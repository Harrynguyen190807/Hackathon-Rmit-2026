"""SanitizerGuard: deterministic PII / secret anonymization (Layer 1 defense).

Detected values are replaced with stable placeholders (``[PHONE_1]``) *before*
any intermediate agent sees the text. The placeholder -> value vault is kept in
``AgentState.pii_vault`` which is excluded from serialization and logging.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

from rao.nlp.text import nfc, strip_invisible

PIIType = str  # PERSON | PHONE | EMAIL | NATIONAL_ID | API_KEY | TOKEN | SECRET

_PRIORITY: dict[str, int] = {
    "API_KEY": 100,
    "TOKEN": 95,
    "SECRET": 90,
    "EMAIL": 80,
    "NATIONAL_ID": 70,
    "PHONE": 60,
    "PERSON": 50,
}

# (type, compiled regex, capture-group index holding the sensitive value)
_PATTERNS: list[tuple[str, re.Pattern[str], int]] = [
    ("API_KEY", re.compile(r"\bsk-(?:live-|test-|proj-)?[A-Za-z0-9_\-]{16,}"), 0),
    ("API_KEY", re.compile(r"\bAKIA[0-9A-Z]{16}\b"), 0),
    ("API_KEY", re.compile(r"\bxox[abprs]-[A-Za-z0-9\-]{10,}"), 0),
    ("API_KEY", re.compile(r"\bgh[pousr]_[A-Za-z0-9]{30,}\b"), 0),
    ("API_KEY", re.compile(r"\bAIza[0-9A-Za-z_\-]{35}\b"), 0),
    ("TOKEN", re.compile(r"\beyJ[A-Za-z0-9_\-]{8,}\.[A-Za-z0-9_\-]{8,}\.[A-Za-z0-9_\-]{8,}"), 0),
    ("TOKEN", re.compile(r"(?i)\bbearer\s+([A-Za-z0-9._\-]{16,})"), 1),
    ("TOKEN", re.compile(r"\b(?:itk|int|svc)_[A-Za-z0-9]{16,}\b"), 0),
    (
        "SECRET",
        re.compile(
            r"(?i)\b(?:api[_\- ]?key|secret|client[_\- ]?secret|access[_\- ]?token|token|password|passwd|"
            r"m[aậ]t\s*kh[aẩ]u)\s*[:=]\s*[\"']?([^\s\"',;]{6,})"
        ),
        1,
    ),
    ("EMAIL", re.compile(r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b"), 0),
    ("NATIONAL_ID", re.compile(r"(?<![\w])0\d{11}(?![\w])"), 0),
    ("PHONE", re.compile(r"(?<![\w+])(?:\+84|84|0)[\s.\-]?[35789](?:[\s.\-]?\d){8}(?!\d)"), 0),
]

VN_SURNAMES: frozenset[str] = frozenset(
    "Nguyễn Trần Lê Phạm Hoàng Huỳnh Phan Vũ Võ Đặng Bùi Đỗ Hồ Ngô Dương Lý Đinh Trương Lâm "
    "Mai Cao Tạ Lưu Châu Quách Kiều Triệu Thái".split()
)
HONORIFICS: frozenset[str] = frozenset(
    "anh chị chi em ông ong bà ba cô co chú chu bác bac bạn sếp sep mr mr. ms ms. mrs mrs.".split()
)
# Administrative / street names that start with a surname but are not persons.
LOCATION_ALLOWLIST: tuple[str, ...] = (
    "Hồ Chí Minh",
    "Cao Bằng",
    "Lâm Đồng",
    "Lý Thường Kiệt",
    "Trần Hưng Đạo",
    "Lê Lợi",
    "Lê Duẩn",
    "Nguyễn Huệ",
    "Phạm Văn Đồng",
    "Võ Văn Kiệt",
    "Mai Chí Thọ",
)
_LOCATION_RE = re.compile("|".join(re.escape(x) for x in LOCATION_ALLOWLIST))
_WORD_RE = re.compile(r"[^\W\d_]+\.?", re.UNICODE)
_PLACEHOLDER_RE = re.compile(r"\[(PERSON|PHONE|EMAIL|NATIONAL_ID|API_KEY|TOKEN|SECRET)_(\d+)\]")


@dataclass(frozen=True)
class PIIFinding:
    type: PIIType
    start: int
    end: int
    value: str


@dataclass
class SanitizationResult:
    text: str
    findings: list[PIIFinding] = field(default_factory=list)

    @property
    def counts(self) -> dict[str, int]:
        out: dict[str, int] = {}
        for f in self.findings:
            out[f.type] = out.get(f.type, 0) + 1
        return out


def _is_title_word(token: str) -> bool:
    core = token.rstrip(".")
    return bool(core) and core[0].isupper() and (len(core) == 1 or core[1:].islower())


class SanitizerGuard:
    """Regex + gazetteer anonymizer for Vietnamese operational text."""

    def detect(self, text: str) -> list[PIIFinding]:
        candidates: list[PIIFinding] = []
        for pii_type, pattern, group in _PATTERNS:
            for m in pattern.finditer(text):
                start, end = m.span(group)
                if start < 0:
                    continue
                candidates.append(PIIFinding(pii_type, start, end, text[start:end]))
        candidates.extend(self._detect_names(text))
        # Drop matches that are themselves placeholders produced earlier.
        candidates = [c for c in candidates if not _PLACEHOLDER_RE.fullmatch(c.value)]
        candidates.sort(key=lambda f: (f.start, -_PRIORITY[f.type], -(f.end - f.start)))
        resolved: list[PIIFinding] = []
        for cand in candidates:
            if resolved and cand.start < resolved[-1].end:
                prev = resolved[-1]
                if _PRIORITY[cand.type] > _PRIORITY[prev.type]:
                    resolved[-1] = cand
                continue
            resolved.append(cand)
        return resolved

    def _detect_names(self, text: str) -> list[PIIFinding]:
        protected = [m.span() for m in _LOCATION_RE.finditer(text)]
        tokens = [(m.group(), m.start(), m.end()) for m in _WORD_RE.finditer(text)]
        findings: list[PIIFinding] = []
        i = 0
        while i < len(tokens):
            word, start, _ = tokens[i]
            prev_word = tokens[i - 1][0].lower() if i > 0 else ""
            starts_by_surname = word.rstrip(".") in VN_SURNAMES
            starts_by_honorific = prev_word in HONORIFICS and _is_title_word(word)
            if not (starts_by_surname or starts_by_honorific):
                i += 1
                continue
            j = i
            while (
                j + 1 < len(tokens)
                and j + 1 - i < 4
                and _is_title_word(tokens[j + 1][0])
                and text[tokens[j][2] : tokens[j + 1][1]] == " "
            ):
                j += 1
            span_start, span_end = start, tokens[j][2]
            if text[span_end - 1] == ".":
                span_end -= 1
            enough = (j > i) or starts_by_honorific
            overlaps_location = any(not (span_end <= ps or span_start >= pe) for ps, pe in protected)
            if enough and not overlaps_location:
                findings.append(PIIFinding("PERSON", span_start, span_end, text[span_start:span_end]))
                i = j + 1
            else:
                i += 1
        return findings

    def sanitize(self, text: str, vault: dict[str, str]) -> SanitizationResult:
        """Replace PII with placeholders; ``vault`` (placeholder->value) is updated in place."""
        text = strip_invisible(nfc(text))
        findings = self.detect(text)
        if not findings:
            return SanitizationResult(text=text)
        reverse = {v: k for k, v in vault.items()}
        counters: dict[str, int] = {}
        for placeholder in vault:
            m = _PLACEHOLDER_RE.fullmatch(placeholder)
            if m:
                counters[m.group(1)] = max(counters.get(m.group(1), 0), int(m.group(2)))
        pieces: list[str] = []
        cursor = 0
        for f in findings:
            key = self._normalize_value(f)
            placeholder = reverse.get(key)
            if placeholder is None:
                counters[f.type] = counters.get(f.type, 0) + 1
                placeholder = f"[{f.type}_{counters[f.type]}]"
                vault[placeholder] = key
                reverse[key] = placeholder
            pieces.append(text[cursor : f.start])
            pieces.append(placeholder)
            cursor = f.end
        pieces.append(text[cursor:])
        return SanitizationResult(text="".join(pieces), findings=findings)

    @staticmethod
    def _normalize_value(finding: PIIFinding) -> str:
        if finding.type == "PHONE":
            digits = re.sub(r"\D", "", finding.value)
            return "0" + digits[2:] if digits.startswith("84") else digits
        return finding.value

    @staticmethod
    def restore(text: str, vault: dict[str, str], allowed_types: frozenset[str]) -> str:
        """Re-insert only explicitly allowed PII types (e.g. PERSON for a polite greeting)."""

        def _sub(m: re.Match[str]) -> str:
            if m.group(1) in allowed_types and m.group(0) in vault:
                return vault[m.group(0)]
            return m.group(0)

        return _PLACEHOLDER_RE.sub(_sub, text)

    def contains_sensitive(self, text: str, types: frozenset[str] | None = None) -> list[PIIFinding]:
        found = self.detect(text)
        return [f for f in found if types is None or f.type in types]
