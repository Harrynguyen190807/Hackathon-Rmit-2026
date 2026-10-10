"""Unicode / Vietnamese text utilities shared by security and NLP layers."""

from __future__ import annotations

import re
import unicodedata

_ZERO_WIDTH = re.compile("[\u200b-\u200f\u2028-\u202f\u2060-\u2064\ufeff]")
_WS = re.compile(r"\s+")


def nfc(text: str) -> str:
    return unicodedata.normalize("NFC", text)


def strip_invisible(text: str) -> str:
    """Remove zero-width / bidi control characters used for prompt smuggling."""
    return _ZERO_WIDTH.sub("", text)


def fold_diacritics(text: str) -> str:
    """'Kiểm tra đơn hàng' -> 'Kiem tra don hang' (handles đ/Đ explicitly)."""
    text = text.replace("đ", "d").replace("Đ", "D")
    decomposed = unicodedata.normalize("NFD", text)
    return "".join(ch for ch in decomposed if unicodedata.category(ch) != "Mn")


def canonical(text: str) -> str:
    """Lower-cased, folded, whitespace-collapsed form used for robust matching."""
    text = strip_invisible(unicodedata.normalize("NFKC", text))
    return _WS.sub(" ", fold_diacritics(text).lower()).strip()


def collapse_ws(text: str) -> str:
    return _WS.sub(" ", text).strip()
