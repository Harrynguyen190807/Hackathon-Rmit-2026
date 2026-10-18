---
name: hackathon-fastapi-backend
description: Khởi tạo và mở rộng nhanh hệ thống RESTful API bất đồng bộ với FastAPI và Pydantic v2 trong vòng 30 phút cho các dự án Hackathon. Kích hoạt khi cần dựng backend microservice, streaming chat SSE/WebSocket, tích hợp CORS cho frontend dev, quản lý state qua Dependency Injection, và xử lý HTTP Exception tập trung không làm sập server.
version: 1.0.0
tools:
  - run_command
  - write_to_file
  - replace_file_content
---

# ⚡ Hackathon FastAPI Backend Playbook

## 🎯 Mục tiêu (Objective)
Thiết kế và triển khai một RESTful API hiệu năng cao, bất đồng bộ (`async`/`await`) hoàn chỉnh trong vòng 30 phút bằng **FastAPI** và **Pydantic v2**, sẵn sàng phục vụ cho Frontend (React/Next.js/Streamlit) và tích hợp các pipeline AI/LLM.

---

## 🔒 Ràng buộc kỹ thuật (Constraints)
1. **Pydantic v2 Standard**: Sử dụng `model_validate`, `field_validator`, và `model_dump` chuẩn Pydantic v2 (không sử dụng các cú pháp v1 đã deprecated như `.dict()` hay `@validator`).
2. **Kháng sập (Crash-Proof)**: Bắt buộc cài đặt Global Exception Handler bắt `RequestValidationError` và `Exception` tổng để server không bao giờ bị exit đột ngột giữa buổi demo.
3. **CORS Linh Hoạt**: Cấu hình mở rộng cho các origin local thông dụng (`http://localhost:3000`, `http://localhost:5173`, `http://localhost:8501`) kèm wildcard trong giai đoạn phát triển hackathon.
4. **Non-blocking Execution**: Toàn bộ endpoint I/O-bound (gọi LLM, truy vấn database, đọc tệp) phải sử dụng `async`/`await` hoặc đẩy vào thread pool bằng `asyncio.to_thread` đối với hàm đồng bộ nặng.

---

## 📋 Quy trình thực thi từng bước (Step-by-Step)

```text
[BƯỚC 1: Cấu hình môi trường & Requirements]
                      │
                      ▼
[BƯỚC 2: Định nghĩa Pydantic Schemas (V2 Strict Typing)]
                      │
                      ▼
[BƯỚC 3: Xây dựng Dependency Injection cho Mock Database/LLM]
                      │
                      ▼
[BƯỚC 4: Thiết lập Exception Handling & Middleware CORS]
                      │
                      ▼
[BƯỚC 5: Viết Endpoints RESTful & SSE Streaming]
                      │
                      ▼
[BƯỚC 6: Kiểm thử tự động bằng Health Check & Swagger UI]
```

---

## 💻 Mã nguồn chuẩn mực (Production-Ready Boilerplate)

### 1. `requirements.txt`
```text
fastapi>=0.115.0
uvicorn[standard]>=0.31.0
pydantic>=2.9.0
pydantic-settings>=2.5.0
python-multipart>=0.0.12
httpx>=0.27.0
```

### 2. Cấu trúc mã nguồn chính (`main.py`)
```python
import asyncio
import json
import logging
import time
from typing import AsyncGenerator, Dict, Any, List
from fastapi import FastAPI, Request, status, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel, Field, field_validator

# Cấu hình logging cấu trúc
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("HackathonBackend")

# --- SCHEMAS (Pydantic v2) ---
class ChatMessage(BaseModel):
    role: str = Field(..., description="Role của tin nhắn: user, assistant, system")
    content: str = Field(..., min_length=1, description="Nội dung tin nhắn")

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        valid_roles = {"user", "assistant", "system"}
        if v.lower() not in valid_roles:
            raise ValueError(f"Role không hợp lệ. Phải thuộc: {valid_roles}")
        return v.lower()

class ChatRequest(BaseModel):
    session_id: str = Field(default="demo-session", description="Định danh phiên hội thoại")
    messages: List[ChatMessage] = Field(..., min_length=1)
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    stream: bool = Field(default=False)

class ChatResponse(BaseModel):
    session_id: str
    response: str
    latency_ms: float
    usage: Dict[str, int]

# --- DEPENDENCY INJECTION (Mock / Stateful Service) ---
class DatabaseSessionManager:
    """Mock in-memory repository phục vụ hackathon, dễ dàng tráo đổi với Postgres/Redis."""
    def __init__(self):
        self._store: Dict[str, List[Dict[str, Any]]] = {}

    def save_message(self, session_id: str, message: Dict[str, Any]):
        if session_id not in self._store:
            self._store[session_id] = []
        self._store[session_id].append(message)

    def get_history(self, session_id: str) -> List[Dict[str, Any]]:
        return self._store.get(session_id, [])

# Singleton instance for DI
_db_singleton = DatabaseSessionManager()

def get_db() -> DatabaseSessionManager:
    return _db_singleton

# --- KHỞI TẠO APP & MIDDLEWARE ---
app = FastAPI(
    title="Hackathon High-Velocity Core API",
    description="Backend API chuẩn Clean Architecture cho Hackathon 2026",
    version="1.0.0",
    docs_url="/docs",
    redoc_url=None
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Hỗ trợ mọi frontend dev port: 3000, 5173, 8501
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- GLOBAL EXCEPTION HANDLERS (CRASH-PROOF) ---
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning(f"Validation error on {request.url.path}: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error_type": "ValidationError",
            "detail": exc.errors(),
            "message": "Dữ liệu yêu cầu không đúng định dạng schema."
        }
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception at {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error_type": "InternalServerError",
            "message": "Hệ thống gặp sự cố xử lý. Vui lòng thử lại với chế độ fallback mock."
        }
    )

# --- ENDPOINTS ---
@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "ONLINE",
        "timestamp": time.time(),
        "service": "Hackathon API Core"
    }

@app.post("/api/v1/chat", response_model=ChatResponse, tags=["AI Core"])
async def sync_chat_endpoint(
    req: ChatRequest,
    db: DatabaseSessionManager = Depends(get_db)
):
    start_time = time.perf_counter()
    last_user_message = req.messages[-1].content
    
    # Lưu vào Mock DB qua DI
    db.save_message(req.session_id, {"role": "user", "content": last_user_message})
    
    # Giả lập xử lý model nhanh
    await asyncio.sleep(0.15)
    ai_reply = f"[Processed]: {last_user_message}"
    
    db.save_message(req.session_id, {"role": "assistant", "content": ai_reply})
    elapsed = (time.perf_counter() - start_time) * 1000

    return ChatResponse(
        session_id=req.session_id,
        response=ai_reply,
        latency_ms=round(elapsed, 2),
        usage={"prompt_tokens": len(last_user_message), "completion_tokens": len(ai_reply)}
    )

@app.post("/api/v1/chat/stream", tags=["AI Core"])
async def stream_chat_endpoint(req: ChatRequest):
    async def event_generator() -> AsyncGenerator[str, None]:
        prompt = req.messages[-1].content
        mock_chunks = [
            f"[Khởi tạo phiên {req.session_id}]...",
            " Đang đối soát ngữ cảnh RAG...",
            f" Phân tích dữ liệu: '{prompt[:20]}...' ",
            " Hoàn tất phản hồi với độ chuẩn xác cao."
        ]
        for chunk in mock_chunks:
            await asyncio.sleep(0.2)
            payload = json.dumps({"delta": chunk})
            yield f"data: {payload}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
    )
```

---

## 🔍 Checklist xác minh (Verification)
- [ ] **Lệnh khởi chạy**: `uvicorn main:app --reload --port 8000 --host 0.0.0.0` chạy không cảnh báo deprecation.
- [ ] **Tài liệu Swagger**: Truy cập `http://localhost:8000/docs` thấy đầy đủ schema của `ChatRequest` và `ChatResponse`.
- [ ] **Kiểm tra CORS**: Sử dụng fetch từ console trình duyệt bất kỳ không phát sinh lỗi header.
- [ ] **Bảo vệ sập hệ thống**: Gửi body JSON lỗi (ví dụ sai type `temperature="hot"`) trả về HTTP 422 JSON rõ ràng thay vì HTTP 500 sập process.
- [ ] **Kiểm thử SSE**: Dùng `curl -N -X POST http://localhost:8000/api/v1/chat/stream -H "Content-Type: application/json" -d "{\"messages\":[{\"role\":\"user\",\"content\":\"test\"}]}"` nhận được từng chunk `data: ...` theo thời gian thực.
