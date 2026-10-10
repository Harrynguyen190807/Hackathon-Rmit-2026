"""Hybrid Retrieval Subsystem: BM25 + Dense Semantic Matching with Reciprocal Rank Fusion (RRF).

Combines:
1. BM25 keyword matching with Vietnamese diacritic folding, slang expansion, and n-gram overlap.
2. Lightweight, deterministic Dense semantic matching via character/word subword hash embeddings and cosine similarity.
3. Reciprocal Rank Fusion (RRF) to combine lexical and dense rank lists.
4. Logistics knowledge base indexing standard operational procedures (SOPs), warehouse guidelines, and vendor catalogues.
"""

from __future__ import annotations

import math
import re
from dataclasses import dataclass, field
from typing import Any

from rao.nlp.lexicon import normalize
from rao.nlp.text import canonical


@dataclass(frozen=True)
class KnowledgeDoc:
    doc_id: str
    title: str
    content: str
    category: str
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class SearchResult:
    doc: KnowledgeDoc
    score: float
    bm25_score: float
    dense_score: float
    rank: int


def _tokenize(text: str) -> list[str]:
    """Tokenize Vietnamese text with slang expansion and n-grams."""
    norm = normalize(text)
    # Extract unigrams and bigrams
    words = re.findall(r"\w+", norm.expanded)
    tokens: list[str] = list(words)
    # Add bigrams for compound concepts (e.g., 'kiem_tra', 'ton_kho', 'ket_xe')
    for i in range(len(words) - 1):
        tokens.append(f"{words[i]}_{words[i+1]}")
    return tokens


class BM25Index:
    """Okapi BM25 implementation optimized for Vietnamese technical & logistics text."""

    def __init__(self, k1: float = 1.5, b: float = 0.75) -> None:
        self.k1 = k1
        self.b = b
        self.docs: list[KnowledgeDoc] = []
        self.doc_tokens: list[list[str]] = []
        self.doc_lens: list[int] = []
        self.avg_dl: float = 0.0
        self.df: dict[str, int] = {}
        self.idf: dict[str, float] = {}
        self.n_docs: int = 0

    def fit(self, docs: list[KnowledgeDoc]) -> None:
        self.docs = docs
        self.n_docs = len(docs)
        self.doc_tokens = [_tokenize(f"{d.title} {d.content}") for d in docs]
        self.doc_lens = [len(t) for t in self.doc_tokens]
        self.avg_dl = sum(self.doc_lens) / max(1, self.n_docs)

        # Calculate document frequency
        self.df.clear()
        for tokens in self.doc_tokens:
            for term in set(tokens):
                self.df[term] = self.df.get(term, 0) + 1

        # Calculate IDF (BM25 smoothed)
        self.idf.clear()
        for term, freq in self.df.items():
            self.idf[term] = math.log(1.0 + (self.n_docs - freq + 0.5) / (freq + 0.5))

    def score(self, query: str) -> list[tuple[int, float]]:
        q_tokens = _tokenize(query)
        scores: list[float] = [0.0] * self.n_docs
        for term in q_tokens:
            if term not in self.idf:
                continue
            idf_val = self.idf[term]
            for doc_idx, tokens in enumerate(self.doc_tokens):
                tf = tokens.count(term)
                if tf == 0:
                    continue
                dl = self.doc_lens[doc_idx]
                numerator = tf * (self.k1 + 1.0)
                denominator = tf + self.k1 * (1.0 - self.b + self.b * (dl / self.avg_dl))
                scores[doc_idx] += idf_val * (numerator / denominator)
        ranked = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)
        return ranked


class DenseSemanticIndex:
    """Lightweight subword n-gram hashing embedding space with cosine similarity."""

    def __init__(self, dim: int = 256) -> None:
        self.dim = dim
        self.docs: list[KnowledgeDoc] = []
        self.vectors: list[list[float]] = []

    def _embed(self, text: str) -> list[float]:
        vec = [0.0] * self.dim
        canon = canonical(text)
        tokens = re.findall(r"\w+", canon)
        # Hash character 3-grams and words into fixed dimension
        for tok in tokens:
            # Word level
            h = hash(tok) % self.dim
            vec[h] += 1.0
            # Character n-grams for typo & morphology robustness
            if len(tok) >= 3:
                for i in range(len(tok) - 2):
                    sub = tok[i : i + 3]
                    h_sub = hash(sub) % self.dim
                    vec[h_sub] += 0.5

        # L2 normalize
        norm = math.sqrt(sum(v * v for v in vec))
        if norm > 0.0:
            vec = [v / norm for v in vec]
        return vec

    def fit(self, docs: list[KnowledgeDoc]) -> None:
        self.docs = docs
        self.vectors = [self._embed(f"{d.title} {d.content}") for d in docs]

    def score(self, query: str) -> list[tuple[int, float]]:
        q_vec = self._embed(query)
        scores: list[float] = []
        for d_vec in self.vectors:
            # Dot product is cosine similarity because vectors are L2-normalized
            sim = sum(a * b for a, b in zip(q_vec, d_vec, strict=False))
            scores.append(max(0.0, sim))
        ranked = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)
        return ranked


class HybridRetriever:
    """Hybrid Retriever combining BM25 keyword matching and Dense semantic vectors via RRF."""

    def __init__(self, docs: list[KnowledgeDoc] | None = None, rrf_k: int = 60) -> None:
        self.rrf_k = rrf_k
        self.docs = docs or DEFAULT_LOGISTICS_KB
        self.bm25 = BM25Index()
        self.dense = DenseSemanticIndex()
        self.fit(self.docs)

    def fit(self, docs: list[KnowledgeDoc]) -> None:
        self.docs = docs
        self.bm25.fit(docs)
        self.dense.fit(docs)

    def search(self, query: str, top_k: int = 3) -> list[SearchResult]:
        if not self.docs:
            return []
        bm25_ranked = self.bm25.score(query)
        dense_ranked = self.dense.score(query)

        # Build rank maps
        bm25_rank_map = {doc_idx: rank for rank, (doc_idx, _) in enumerate(bm25_ranked)}
        dense_rank_map = {doc_idx: rank for rank, (doc_idx, _) in enumerate(dense_ranked)}

        bm25_scores = dict(bm25_ranked)
        dense_scores = dict(dense_ranked)

        # Reciprocal Rank Fusion (RRF)
        rrf_scores: dict[int, float] = {}
        for idx in range(len(self.docs)):
            r_bm25 = bm25_rank_map[idx]
            r_dense = dense_rank_map[idx]
            score = (1.0 / (self.rrf_k + r_bm25 + 1)) + (1.0 / (self.rrf_k + r_dense + 1))
            rrf_scores[idx] = score

        ranked_indices = sorted(rrf_scores.keys(), key=lambda i: rrf_scores[i], reverse=True)

        results: list[SearchResult] = []
        for rank, idx in enumerate(ranked_indices[:top_k], start=1):
            results.append(
                SearchResult(
                    doc=self.docs[idx],
                    score=round(rrf_scores[idx], 5),
                    bm25_score=round(bm25_scores[idx], 4),
                    dense_score=round(dense_scores[idx], 4),
                    rank=rank,
                )
            )
        return results


# Standard Logistics Knowledge Base for Vietnam E-Commerce / Supply Chain
DEFAULT_LOGISTICS_KB: list[KnowledgeDoc] = [
    KnowledgeDoc(
        doc_id="SOP-INV-001",
        title="Quy trình kiểm tra tồn kho và cảnh báo thiếu hàng (Low Stock SOP)",
        content=(
            "Khi kiểm tra tồn kho (ktra tồn kho / stock check) cho một mã hàng (SKU), "
            "nếu số lượng on_hand dưới mức tái đặt hàng (reorder_point), trạng thái là LOW_STOCK hoặc OUT_OF_STOCK. "
            "Nhân viên điều phối cần tạo ngay Đơn mua hàng (Purchase Order - PO) với số lượng đề xuất "
            "(suggested_reorder_qty) từ nhà cung cấp ưu tiên (preferred_vendor_id) và phát cảnh báo lên kênh Slack #kho-hcm."
        ),
        category="INVENTORY_SOP",
        metadata={"priority": "HIGH"},
    ),
    KnowledgeDoc(
        doc_id="SOP-PO-002",
        title="Quy định đặt hàng và phê duyệt NCC (Purchase Order Guidelines)",
        content=(
            "Mỗi đơn mua hàng (PO) cần chỉ định chính xác mã SKU, số lượng (quantity >= 1) và mã NCC đã được "
            "phê duyệt (NCC-009 cho phụ kiện, NCC-017 cho máy tính/màn hình, NCC-021 cho cáp mạng). "
            "Đơn đặt hàng sau khi tạo phải được gửi thông báo đến các kênh điều phối tương ứng với mức độ WARNING."
        ),
        category="PROCUREMENT_SOP",
        metadata={"priority": "HIGH"},
    ),
    KnowledgeDoc(
        doc_id="SOP-LOG-003",
        title="Xử lý giao hàng trễ hạn do ngập nước hoặc kẹt xe (ETA Delay Handling)",
        content=(
            "Khi đối tác giao hàng (GHN, GHTK, Viettel Post) gặp sự cố khách quan như ngập nước do triều cường/mưa lớn "
            "hoặc kẹt xe nghiêm trọng tại TP.HCM (Thủ Đức, Q.7, Tân Bình), điều phối viên cần cập nhật ETA (thêm số phút trễ) "
            "kèm lý do chuẩn hóa vào hệ thống TMS và soạn thông báo lịch sự, chuyên nghiệp gửi khách hàng."
        ),
        category="LOGISTICS_SOP",
        metadata={"priority": "CRITICAL"},
    ),
    KnowledgeDoc(
        doc_id="CAT-VENDORS",
        title="Danh mục Nhà cung cấp được ủy quyền (Approved Vendors Catalog)",
        content=(
            "NCC-009: Công ty TNHH Phụ Kiện Số Sài Gòn (Lead time: 3 ngày). "
            "NCC-017: Công ty CP Phân Phối Thiết Bị Miền Nam (Lead time: 5 ngày). "
            "NCC-021: Công ty TNHH Cáp Mạng Bình Dương (Lead time: 2 ngày)."
        ),
        category="VENDOR_CATALOG",
        metadata={"priority": "MEDIUM"},
    ),
]
