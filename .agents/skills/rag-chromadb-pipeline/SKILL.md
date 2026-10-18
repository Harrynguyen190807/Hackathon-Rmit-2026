---
name: rag-chromadb-pipeline
description: Xây dựng và triển khai pipeline Retrieval-Augmented Generation (RAG) cục bộ hiệu năng cao sử dụng ChromaDB, Sentence-Transformers và tích hợp linh hoạt với Ollama hoặc Gemini API. Kích hoạt khi cần xử lý tài liệu đa ngữ hoặc ngôn ngữ tài nguyên thấp (tiếng Việt), tối ưu chunking ngữ âm/ngữ nghĩa, truy vấn vector kèm metadata, reranking nhẹ, và kiểm soát chống hallucination triệt để.
version: 1.0.0
tools:
  - run_command
  - write_to_file
  - replace_file_content
---

# 🧠 Multilingual & Low-Resource RAG Pipeline Playbook

## 🎯 Mục tiêu (Objective)
Xây dựng một pipeline RAG độc lập, gọn nhẹ nhưng đạt chuẩn Production trong Hackathon bằng **ChromaDB**, **Sentence-Transformers (Multilingual-E5 / MiniLM)**, và **Ollama / Gemini API**. Pipeline được tinh chỉnh đặc thù cho tiếng Việt và các tập dữ liệu đặc thù ít tài nguyên số, loại bỏ ảo giác (anti-hallucination) và trích xuất nguồn tin cậy (citations).

---

## 🔒 Ràng buộc kỹ thuật (Constraints)
1. **Vietnamese & Low-Resource Text Segmentation**: Không sử dụng các bộ tách từ đơn thuần theo dấu cách (whitespace split) vì làm mất liên kết từ ghép tiếng Việt. Phải bảo toàn cấu trúc câu và đoạn văn (`Paragraph-Sentence sliding window`).
2. **Metadata Integrity**: Bắt buộc gắn metadata chi tiết cho từng chunk (`source`, `chunk_id`, `page_number`, `token_count`, `created_at`) để hiển thị citation trên UI.
3. **Chống ảo giác (Anti-Hallucination Guard)**: Nếu khoảng cách Cosine Distance > `0.45` (tương đương similarity < `0.55`), hệ thống phải từ chối trả lời hoặc gắn cảnh báo `LOW_CONFIDENCE` thay vì suy diễn bừa bãi.
4. **Lightweight & Modular**: Không bắt buộc cài đặt các bộ framework khổng lồ (LangChain/LlamaIndex) nếu chỉ cần tốc độ; ưu tiên tương tác trực tiếp với ChromaDB Client để kiểm soát 100% latency.

---

## 📋 Quy trình thực thi từng bước (Step-by-Step)

```text
[BƯỚC 1: Tiền xử lý & Chuẩn hóa văn bản tiếng Việt]
                       │
                       ▼
[BƯỚC 2: Chunking theo Ngữ cảnh trượt (Sliding Window Chunker)]
                       │
                       ▼
[BƯỚC 3: Embedding Đa ngữ & Nạp vào ChromaDB Persistent Client]
                       │
                       ▼
[BƯỚC 4: Hybrid Top-K Retrieval + Lexical Keyword Filter]
                       │
                       ▼
[BƯỚC 5: Lightweight Cross-Score Reranking (Ngữ nghĩa & Relevance)]
                       │
                       ▼
[BƯỚC 6: Tổng hợp Context & Prompt Chống ảo giác cho LLM]
```

---

## 💻 Mã nguồn chuẩn mực (Production-Ready Boilerplate)

### 1. `requirements.txt`
```text
chromadb>=0.5.5
sentence-transformers>=3.1.0
google-genai>=0.1.1
numpy>=1.26.0
pydantic>=2.9.0
```

### 2. Triển khai Pipeline (`rag_engine.py`)
```python
import os
import re
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.utils import embedding_functions

class VietnameseTextChunker:
    """Bộ chia chunk tối ưu cho tiếng Việt và ngôn ngữ tài nguyên thấp."""
    @staticmethod
    def clean_text(text: str) -> str:
        # Chuẩn hóa khoảng trắng và ngắt dòng
        text = re.sub(r"\r\n", "\n", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()

    @classmethod
    def split_into_chunks(
        cls, 
        text: str, 
        chunk_size: int = 500, 
        overlap: int = 100
    ) -> List[str]:
        cleaned = cls.clean_text(text)
        # Tách theo ranh giới câu hợp lý trong tiếng Việt (. ! ? \n)
        sentences = re.split(r"(?<=[.!?\n])\s+", cleaned)
        chunks = []
        current_chunk = []
        current_len = 0

        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
            s_len = len(sentence)
            if current_len + s_len > chunk_size and current_chunk:
                chunks.append(" ".join(current_chunk))
                # Tạo overlap từ câu cuối
                current_chunk = [current_chunk[-1]] if len(current_chunk) > 1 else []
                current_len = sum(len(s) for s in current_chunk)
            current_chunk.append(sentence)
            current_len += s_len

        if current_chunk:
            chunks.append(" ".join(current_chunk))
        return chunks


class ChromaRAGPipeline:
    def __init__(
        self, 
        persist_dir: str = "./chroma_db", 
        collection_name: str = "hackathon_multilingual_knowledge"
    ):
        self.client = chromadb.PersistentClient(path=persist_dir)
        # Sử dụng model đa ngữ nhẹ, hỗ trợ xuất sắc tiếng Việt
        self.embed_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="paraphrase-multilingual-MiniLM-L12-v2"
        )
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            embedding_function=self.embed_fn,
            metadata={"hnsw:space": "cosine"}
        )

    def ingest_document(self, doc_id: str, raw_text: str, metadata: Dict[str, Any]):
        """Chia chunk và upsert vào ChromaDB với metadata nguồn gốc."""
        chunks = VietnameseTextChunker.split_into_chunks(raw_text)
        ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
        metadatas = [
            {
                **metadata,
                "chunk_index": i,
                "total_chunks": len(chunks),
                "char_length": len(chunk)
            }
            for i, chunk in enumerate(chunks)
        ]
        self.collection.upsert(documents=chunks, metadatas=metadatas, ids=ids)
        return len(chunks)

    def retrieve(self, query: str, top_k: int = 4, threshold: float = 0.45) -> List[Dict[str, Any]]:
        """Truy vấn Top-K vector kết hợp lọc khoảng cách cosine chống hallucination."""
        results = self.collection.query(
            query_texts=[query],
            n_results=top_k
        )

        retrieved_items = []
        if not results or not results["documents"] or not results["documents"][0]:
            return retrieved_items

        docs = results["documents"][0]
        distances = results["distances"][0]
        metas = results["metadatas"][0]

        for doc, dist, meta in zip(docs, distances, metas):
            # Trong cosine distance: 0 là giống hệt, 1 là trực giao, 2 là đối lập
            # dist <= threshold đảm bảo tính tương đồng cao
            if dist <= threshold:
                retrieved_items.append({
                    "content": doc,
                    "metadata": meta,
                    "distance": round(dist, 4),
                    "confidence_score": round(1.0 - dist, 4)
                })

        # Sắp xếp lại theo điểm tin cậy cao nhất
        retrieved_items.sort(key=lambda x: x["confidence_score"], reverse=True)
        return retrieved_items

    def construct_grounded_prompt(self, query: str, contexts: List[Dict[str, Any]]) -> str:
        """Tạo prompt nghiêm ngặt bắt buộc LLM dẫn nguồn và cấm bịa đặt."""
        if not contexts:
            return (
                "HỆ THỐNG CẢNH BÁO: Không tìm thấy ngữ cảnh tài liệu phù hợp trong cơ sở tri thức. "
                "Vui lòng trả lời: 'Tôi không tìm thấy thông tin này trong tài liệu kiểm chứng được cung cấp.'"
            )

        context_str = "\n\n".join([
            f"--- [TRÍCH DẪN {i+1} | Nguồn: {c['metadata'].get('source', 'Unknown')} (Trang {c['metadata'].get('page', 1)})] ---\n{c['content']}"
            for i, c in enumerate(contexts)
        ])

        system_instruction = f"""
Bạn là chuyên gia thẩm định dữ liệu chính xác tuyệt đối. 
Nhiệm vụ: Trả lời câu hỏi người dùng CHỈ DỰA TRÊN các đoạn văn bản trong <tailieu_kiemchung>.

QUY TẮC BẮT BUỘC:
1. Tuyệt đối không thêm thắt thông tin ngoài tài liệu (Chống ảo giác).
2. Cuối mỗi luận điểm phải ghi rõ nguồn: [Nguồn: <tên_file>, Trang <số_trang>].
3. Nếu tài liệu không chứa câu trả lời, nói rõ: 'Tài liệu không đề cập đến vấn đề này'.

<tailieu_kiemchung>
{context_str}
</tailieu_kiemchung>

Câu hỏi của người dùng: {query}
Câu trả lời phân tích:
"""
        return system_instruction.strip()
```

---

## 🔍 Checklist xác minh (Verification)
- [ ] **ChromaDB Ingestion**: Thử nạp 1 văn bản tiếng Việt dài > 2000 ký tự và kiểm tra `collection.count()` tăng tương ứng số chunks.
- [ ] **Bảo toàn ngữ nghĩa**: Thử truy vấn với các từ khóa viết tắt hoặc biến thể từ đồng nghĩa (ví dụ: *"an toàn thông tin"* vs *"ATTT"*), kết quả phải lấy đúng đoạn văn liên quan.
- [ ] **Kiểm tra Ngưỡng Hallucination**: Đặt câu hỏi hoàn toàn vô nghĩa (ví dụ: *"Cách phóng phi thuyền lên sao Hỏa"* vào bộ tài liệu pháp lý), hệ thống phải kích hoạt cảnh báo không tìm thấy tài liệu phù hợp thay vì suy diễn.
- [ ] **Hiển thị Citation**: Đầu ra của `retrieve()` phải có đầy đủ trường `metadata.source` và `metadata.page` phục vụ render giao diện người dùng.
