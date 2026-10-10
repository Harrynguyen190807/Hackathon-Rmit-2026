"""Vietnamese logistics lexicon, slang expansion and entity extraction.

Handles shorthand (ktra, NCC, ETA, SL, PO, đh), unaccented typing (ngap, ket xe),
Southern / Northern particles (nha, nghen, giùm, tui, hông), compound durations
("2 tiếng rưỡi", "1h30", "90p", "nửa tiếng") and administrative abbreviations
("Q.7", "TP.HCM", "SG", "HN").
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from rao.nlp.text import canonical, collapse_ws
from rao.state import Entity, Origin

# folded slang token -> canonical folded expansion
SLANG: dict[str, str] = {
    "ktra": "kiem tra",
    "ktr": "kiem tra",
    "kt": "kiem tra",
    "check": "kiem tra",
    "ncc": "nha cung cap",
    "sl": "so luong",
    "dh": "don hang",
    "dhang": "don hang",
    "po": "don mua hang",
    "eta": "thoi gian du kien den",
    "tk": "ton kho",
    "tonkho": "ton kho",
    "sp": "san pham",
    "k": "khong",
    "ko": "khong",
    "hong": "khong",
    "hok": "khong",
    "dc": "duoc",
    "j": "gi",
    "tui": "toi",
    "giup": "giup",
    "gium": "giup",
    "dum": "giup",
    "nghen": "nha",
    "nhen": "nha",
    "nhe": "nha",
    "delay": "tre",
    "lui": "tre",
    "doi": "doi lich",
    "ib": "nhan tin",
    "rep": "tra loi",
    "sep": "quan ly",
}

# Reason taxonomy, matched on the canonical view (diacritics folded).
REASON_PATTERNS: tuple[tuple[str, str, re.Pattern[str]], ...] = (
    ("FLOOD", "Ngập nước", re.compile(r"\b(ngap|ngap nuoc|trieu cuong|nuoc len|lut)\b")),
    ("TRAFFIC", "Kẹt xe", re.compile(r"\b(ket xe|tac duong|ket duong|un tac|traffic)\b")),
    ("STORM", "Bão / thời tiết xấu", re.compile(r"\b(mua bao|do bao|vi bao|bao lon|bao so \d+|giong|mua lon|thoi tiet xau)\b")),
    ("VEHICLE", "Sự cố phương tiện", re.compile(r"\b(hu xe|xe hu|be lop|thung lop|chet may|su co xe)\b")),
    ("CUSTOMS", "Thủ tục hải quan", re.compile(r"\b(hai quan|thong quan)\b")),
)

# canonical alias -> official administrative display name
ADMIN_UNITS: dict[str, str] = {
    "thu duc": "TP. Thủ Đức",
    "tp thu duc": "TP. Thủ Đức",
    "tan binh": "Quận Tân Bình",
    "binh thanh": "Quận Bình Thạnh",
    "go vap": "Quận Gò Vấp",
    "q7": "Quận 7",
    "q.7": "Quận 7",
    "quan 7": "Quận 7",
    "q1": "Quận 1",
    "q.1": "Quận 1",
    "quan 1": "Quận 1",
    "nha be": "Huyện Nhà Bè",
    "di an": "TP. Dĩ An",
    "binh duong": "Bình Dương",
    "long bien": "Quận Long Biên",
    "tp.hcm": "TP. Hồ Chí Minh",
    "tphcm": "TP. Hồ Chí Minh",
    "hcm": "TP. Hồ Chí Minh",
    "sai gon": "TP. Hồ Chí Minh",
    "sg": "TP. Hồ Chí Minh",
    "ha noi": "Hà Nội",
    "hn": "Hà Nội",
    "da nang": "Đà Nẵng",
    "can tho": "Cần Thơ",
    "hai phong": "Hải Phòng",
}

SKU_RE = re.compile(r"(?<![\w-])([A-Za-z]{2,5})-(\d{3,6})(?![\w-])")
VENDOR_RE = re.compile(r"(?<![\w-])ncc[\s\-_]?(\d{3})(?!\d)", re.IGNORECASE)
TRACKING_RE = re.compile(r"(?<![\w-])([A-Za-z]{2,4}\d{6,12})(?![\w-])")
CHANNEL_RE = re.compile(r"(?<![\w#])(#[a-z0-9][a-z0-9_-]{0,79})\b")
_TIME_UNIT_AHEAD = r"(?!\s*(?:tieng|gio|phut|ph|p|h|g|ngay|ruoi|min|m|d)\b)"
QTY_RE = re.compile(
    r"\b(?:sl|so luong|dat|nhap|nhap them|dat them|them|bo sung|order|x)\s*[:=]?\s*(\d{1,6})"
    + _TIME_UNIT_AHEAD
    + r"\s*(?:cai|chiec|bo|thung|hop|cuon|pcs|units?|sp|san pham)?\b"
)
QTY_UNIT_RE = re.compile(r"(?<![\w-])(\d{1,6})\s*(?:cai|chiec|bo|thung|hop|cuon|pcs|units?)\b")

_UNIT_MIN = {
    "phut": 1, "ph": 1, "p": 1, "m": 1, "min": 1, "mins": 1, "minutes": 1,
    "tieng": 60, "gio": 60, "h": 60, "g": 60, "hr": 60, "hrs": 60, "hours": 60, "hour": 60,
    "ngay": 1440, "d": 1440, "day": 1440, "days": 1440,
}
DURATION_RE = re.compile(
    r"(?:(?<![\w-])(?P<num>\d+(?:[.,]\d+)?)\s*(?P<unit>tieng|gio|phut|ph|ngay|hours?|hrs?|h|g|p|mins?|minutes|m|d|days?)"
    r"(?:\s*(?P<half>ruoi)|\s*(?P<sub>\d{1,2})(?:\s*(?:phut|ph|p|m))?)?"
    r"|(?P<halfonly>nua)\s*(?P<unit2>tieng|gio|ngay)"
    r"|(?P<unit3>tieng|gio)\s*ruoi)\b"
)
DELAY_CUE_RE = re.compile(r"\b(tre|cham|doi lich|them|delay|lui|cong them|keo dai|tang)\b")


@dataclass(frozen=True)
class NormalizedText:
    original: str
    canonical: str
    expanded: str


def normalize(text: str) -> NormalizedText:
    """Return the canonical (folded) and slang-expanded views of ``text``."""
    canon = canonical(text)
    tokens = re.split(r"(\W+)", canon)
    expanded = "".join(SLANG.get(tok, tok) for tok in tokens)
    return NormalizedText(original=text, canonical=canon, expanded=collapse_ws(expanded))


def parse_duration_minutes(canon: str) -> list[tuple[str, int]]:
    """Parse every duration expression in a canonical string -> [(surface, minutes)]."""
    results: list[tuple[str, int]] = []
    for m in DURATION_RE.finditer(canon):
        if m.group("halfonly"):
            minutes = _UNIT_MIN[m.group("unit2")] // 2
        elif m.group("unit3"):
            minutes = int(_UNIT_MIN[m.group("unit3")] * 1.5)
        else:
            value = float(m.group("num").replace(",", "."))
            unit = _UNIT_MIN[m.group("unit")]
            minutes = int(round(value * unit))
            if m.group("half"):
                minutes += unit // 2
            elif m.group("sub") and unit == 60:
                minutes += int(m.group("sub"))
        if minutes > 0:
            results.append((m.group(0), minutes))
    return results


def _severity(canon: str) -> str | None:
    if re.search(r"\b(critical|khan cap|rat gap|nghiem trong|sev ?1|p0)\b", canon):
        return "CRITICAL"
    if re.search(r"\b(warning|canh bao|gap|luu y|quan trong)\b", canon):
        return "WARNING"
    if re.search(r"\b(info|thong bao|fyi)\b", canon):
        return "INFO"
    return None


def _locations(canon: str) -> list[tuple[str, str]]:
    found: list[tuple[str, str]] = []
    seen: set[str] = set()
    for alias in sorted(ADMIN_UNITS, key=len, reverse=True):
        pattern = r"(?<![\w.#-])" + re.escape(alias) + r"(?![\w-])"
        if re.search(pattern, canon):
            display = ADMIN_UNITS[alias]
            if display not in seen:
                seen.add(display)
                found.append((alias, display))
    return found


def extract_entities(text: str, origin: Origin = "user") -> list[Entity]:
    """Deterministic, grounded extraction: every entity has a surface form in ``text``."""
    norm = normalize(text)
    canon = norm.canonical
    entities: list[Entity] = []

    for m in SKU_RE.finditer(text):
        if m.group(1).upper() == "NCC":
            continue
        entities.append(Entity(type="SKU", surface=m.group(0), normalized=f"{m.group(1).upper()}-{m.group(2)}", origin=origin))
    for m in VENDOR_RE.finditer(text):
        entities.append(Entity(type="VENDOR", surface=m.group(0), normalized=f"NCC-{m.group(1)}", origin=origin))
    for m in TRACKING_RE.finditer(text):
        token = m.group(1).upper()
        if re.fullmatch(r"(PERSON|PHONE|EMAIL|TOKEN|SECRET)\d*", token):
            continue
        entities.append(Entity(type="TRACKING_ID", surface=m.group(0), normalized=token, origin=origin))
    for m in CHANNEL_RE.finditer(text.lower()):
        entities.append(Entity(type="CHANNEL", surface=m.group(1), normalized=m.group(1), origin=origin))

    qty_seen: set[int] = set()
    id_spans = [m.span() for rx in (SKU_RE, VENDOR_RE, TRACKING_RE) for m in rx.finditer(canon)]
    for regex in (QTY_RE, QTY_UNIT_RE):
        for m in regex.finditer(canon):
            q = int(m.group(1))
            qs, qe = m.span(1)
            if q in qty_seen or any(not (qe <= s or qs >= e) for s, e in id_spans):
                continue
            qty_seen.add(q)
            entities.append(Entity(type="QUANTITY", surface=m.group(0), normalized=q, origin=origin))

    if DELAY_CUE_RE.search(norm.expanded):
        for surface, minutes in parse_duration_minutes(canon):
            entities.append(Entity(type="DURATION_MIN", surface=surface, normalized=minutes, origin=origin))

    sev = _severity(canon)
    if sev:
        entities.append(Entity(type="SEVERITY", surface=sev.lower(), normalized=sev, origin=origin))
    for alias, display in _locations(canon):
        entities.append(Entity(type="LOCATION", surface=alias, normalized=display, origin=origin))
    for code, label, pattern in REASON_PATTERNS:
        m = pattern.search(canon)
        if m:
            entities.append(Entity(type="REASON", surface=m.group(0), normalized=f"{code}|{label}", origin=origin))
    return entities
