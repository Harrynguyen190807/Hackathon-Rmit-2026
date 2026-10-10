"""InjectionFirewall: dual-layer prompt-injection detection.

Layer 1 (deterministic): weighted regex rules over several normalized views of
the text (raw, NFKC/zero-width stripped, diacritic-folded, base64-decoded),
combined with a noisy-OR. Any *critical* rule hit blocks unconditionally.

Layer 2 (classifier): a pluggable ``InjectionClassifier``. The default
``HeuristicInjectionClassifier`` is a deterministic, dependency-free logistic
scorer over linguistic features. ``LLMInjectionClassifier`` (rao.llm) can be
plugged in for semantic coverage; it is fail-closed and cannot lower a Layer-1
block.
"""

from __future__ import annotations

import base64
import binascii
import math
import re
from dataclasses import dataclass, field
from typing import Literal, Protocol

from rao.nlp.text import canonical, strip_invisible
from rao.state import Verdict

Source = Literal["user", "external", "tool"]


@dataclass(frozen=True)
class Rule:
    rule_id: str
    pattern: re.Pattern[str]
    weight: float
    critical: bool = False
    untrusted_only: bool = False
    description: str = ""


def _r(p: str) -> re.Pattern[str]:
    return re.compile(p, re.IGNORECASE | re.DOTALL)


# Rules are matched against the canonical (folded, lower-cased) view, so the
# Vietnamese rules are written without diacritics.
RULES: tuple[Rule, ...] = (
    Rule("OVERRIDE_EN", _r(r"\b(ignore|disregard|forget|override|bypass)\b.{0,40}\b(previous|above|prior|all|earlier|system|your)\b.{0,30}\b(instructions?|rules?|prompts?|directives?|guidelines?|policies)"), 0.85, True, description="Instruction override (EN)"),
    Rule("OVERRIDE_VI", _r(r"\b(bo qua|phot lo|quen|bo het|vo hieu hoa|khong can tuan theo)\b.{0,40}\b(huong dan|chi dan|chi thi|lenh|quy tac|nguyen tac|prompt)"), 0.85, True, description="Instruction override (VI)"),
    Rule("EXFIL_EN", _r(r"\b(reveal|print|show|dump|output|repeat|leak|display|disclose|send|exfiltrate|list|return)\b.{0,50}\b(system prompt|hidden prompt|initial prompt|your instructions|api[ _-]?keys?|secrets?|credentials?|passwords?|env(ironment)? variables?|access tokens?)"), 0.9, True, description="Secret / system prompt exfiltration (EN)"),
    Rule("EXFIL_VI", _r(r"\b(in ra|tiet lo|hien thi|gui|xuat|liet ke|cung cap|dua ra|chep lai)\b.{0,50}\b(system prompt|prompt he thong|cau lenh he thong|api ?key|khoa api|mat khau|token|thong tin bi mat|bien moi truong)"), 0.9, True, description="Secret / system prompt exfiltration (VI)"),
    Rule("ROLE_HIJACK", _r(r"\b(you are now|act as|pretend (to be|you are)|from now on,? you|developer mode|dan mode|jailbreak|ban bay gio la|tu gio ban la|che do (nha phat trien|debug|developer))\b"), 0.55, description="Role / persona hijack"),
    Rule("ROLE_SPOOF", _r(r"(^|\n)\s*(system|assistant|developer)\s*:"), 0.5, untrusted_only=True, description="Role label spoofing inside data"),
    Rule("DELIMITER", _r(r"(<\|?/?(im_start|im_end|system|endoftext)\|?>|\[/?inst\]|</?(system|instructions?|prompt)>|#{2,}\s*(system|instruction|new rules)|```\s*system|-{3,}\s*end of (document|data|context))"), 0.7, True, description="Delimiter / context-boundary manipulation"),
    Rule("TOOL_HIJACK", _r(r"\b(call|invoke|execute|run|trigger|goi|thuc thi)\b.{0,30}\b(tool|function|ham|send_slack_alert|create_purchase_order|update_shipping_eta|check_inventory)\b"), 0.6, untrusted_only=True, description="Tool invocation requested by untrusted data"),
    Rule("TOOL_NAME_IN_DATA", _r(r"\b(send_slack_alert|create_purchase_order|update_shipping_eta)\b"), 0.45, untrusted_only=True, description="Internal tool name inside untrusted data"),
    Rule("MD_EXFIL", _r(r"!\[[^\]]*\]\(https?://[^)]*(\?|=)[^)]*\)"), 0.6, description="Markdown image exfiltration channel"),
    Rule("PRIORITY_CLAIM", _r(r"\b(important|urgent|critical)\b.{0,20}\b(new|updated|override)\b.{0,20}\b(instruction|task|rule)|\b(luu y quan trong|chi thi moi|nhiem vu moi)\b"), 0.4, description="Fake priority / new-instruction claim"),
)

_B64_BLOB = re.compile(r"[A-Za-z0-9+/]{32,}={0,2}")
_ZW_PRESENT = re.compile("[\u200b-\u200f\u2060-\u2064\ufeff]")
_SEGMENT_SPLIT = re.compile(r"(?<=[.!?\n])\s+|\n+")


@dataclass
class ClassifierResult:
    probability: float
    reasoning: str


class InjectionClassifier(Protocol):
    def classify(self, text: str, source: Source) -> ClassifierResult: ...


class HeuristicInjectionClassifier:
    """Deterministic logistic scorer (Layer 2 default, no network, ~µs latency)."""

    _IMPERATIVE_TO_MODEL = re.compile(
        r"\b(you must|you should|you will|assistant,|ai,|chatbot|model,|hay (lam|thuc hien|gui|in)|ban phai|tro ly (hay|phai))\b"
    )
    _SECRET_NOUNS = re.compile(r"\b(api ?key|secret|password|mat khau|token|credential|system prompt|prompt he thong)\b")
    _META = re.compile(r"\b(instruction|prompt|chi thi|huong dan|rule|quy tac|policy)\b")
    _SECOND_PERSON = re.compile(r"\b(you|your|ban|may)\b")

    def classify(self, text: str, source: Source) -> ClassifierResult:
        c = canonical(text)
        features = {
            "imperative_to_model": 1.0 if self._IMPERATIVE_TO_MODEL.search(c) else 0.0,
            "secret_nouns": min(len(self._SECRET_NOUNS.findall(c)), 3) / 3,
            "meta_language": min(len(self._META.findall(c)), 3) / 3,
            "second_person": min(len(self._SECOND_PERSON.findall(c)), 4) / 4,
            "untrusted": 1.0 if source != "user" else 0.0,
        }
        weights = {"imperative_to_model": 2.2, "secret_nouns": 2.0, "meta_language": 1.4, "second_person": 0.8, "untrusted": 0.6}
        z = -3.2 + sum(weights[k] * v for k, v in features.items())
        prob = 1.0 / (1.0 + math.exp(-z))
        active = [k for k, v in features.items() if v > 0]
        return ClassifierResult(round(prob, 4), f"heuristic features={active}")


@dataclass
class FirewallDecision:
    verdict: Verdict
    confidence: float
    reasons: list[str] = field(default_factory=list)
    matched_rules: list[str] = field(default_factory=list)
    rule_score: float = 0.0
    classifier_probability: float = 0.0


@dataclass
class QuarantineResult:
    text: str
    decision: FirewallDecision
    removed_segments: int


class InjectionFirewall:
    def __init__(
        self,
        classifier: InjectionClassifier | None = None,
        block_threshold: float = 0.6,
        classifier_weight: float = 0.35,
    ) -> None:
        self.classifier: InjectionClassifier = classifier or HeuristicInjectionClassifier()
        self.block_threshold = block_threshold
        self.classifier_weight = classifier_weight

    # ------------------------------------------------------------------ views
    @staticmethod
    def _views(text: str) -> list[str]:
        views = [canonical(text)]
        for blob in _B64_BLOB.findall(strip_invisible(text)):
            try:
                decoded = base64.b64decode(blob + "=" * (-len(blob) % 4), validate=True).decode("utf-8")
            except (binascii.Error, UnicodeDecodeError, ValueError):
                continue
            if decoded.isprintable() or "\n" in decoded:
                views.append(canonical(decoded))
        return views

    def _rule_scan(self, text: str, source: Source) -> tuple[float, list[str], list[str], bool]:
        matched: list[str] = []
        reasons: list[str] = []
        critical = False
        survival = 1.0
        views = self._views(text)
        decoded_hit = len(views) > 1
        for rule in RULES:
            if rule.untrusted_only and source == "user":
                continue
            if any(rule.pattern.search(v) for v in views):
                matched.append(rule.rule_id)
                reasons.append(rule.description)
                survival *= 1.0 - rule.weight
                critical = critical or rule.critical
        if _ZW_PRESENT.search(text):
            matched.append("ZERO_WIDTH")
            reasons.append("Invisible zero-width characters (smuggling)")
            survival *= 1.0 - 0.3
        if decoded_hit and matched:
            reasons.append("Payload hidden inside base64 blob")
        return round(1.0 - survival, 4), matched, reasons, critical

    # ----------------------------------------------------------------- public
    def scan(self, text: str, source: Source = "user") -> FirewallDecision:
        rule_score, matched, reasons, critical = self._rule_scan(text, source)
        cls = self.classifier.classify(text, source)
        combined = round(1.0 - (1.0 - rule_score) * (1.0 - self.classifier_weight * cls.probability), 4)
        blocked = critical or rule_score >= 0.5 or combined >= self.block_threshold
        verdict = Verdict.BLOCKED if blocked else Verdict.SAFE
        confidence = combined if blocked else round(1.0 - combined, 4)
        all_reasons = reasons + ([f"classifier p={cls.probability} ({cls.reasoning})"] if cls.probability >= 0.5 else [])
        return FirewallDecision(verdict, confidence, all_reasons, matched, rule_score, cls.probability)

    def quarantine(self, document: str, source: Source = "external") -> QuarantineResult:
        """Segment-level neutralization: drop only the malicious spans of a document.

        Legitimate data (SKUs, quantities, tracking IDs) in clean segments is
        preserved so that the business request can still be fulfilled.
        """
        doc_decision = self.scan(document, source)
        if doc_decision.verdict is Verdict.SAFE:
            return QuarantineResult(document, doc_decision, 0)
        segments = [s for s in _SEGMENT_SPLIT.split(document) if s and s.strip()]
        kept: list[str] = []
        removed = 0
        for seg in segments:
            if self.scan(seg, source).verdict is Verdict.BLOCKED:
                removed += 1
                kept.append("[ĐÃ LOẠI BỎ: nội dung nghi chèn lệnh]")
            else:
                kept.append(seg.strip())
        if removed == 0:  # injection only visible at document level -> drop everything
            return QuarantineResult("[ĐÃ LOẠI BỎ: tài liệu nghi chèn lệnh]", doc_decision, len(segments))
        return QuarantineResult("\n".join(kept), doc_decision, removed)
