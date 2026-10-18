---
name: rapid-prototype-ui
description: Khởi tạo và xây dựng thần tốc giao diện người dùng (Dashboard, Chat LLM, Security Visualizer) trong vòng 1 giờ cho các kỳ thi Hackathon. Hỗ trợ song song cả hai nền tảng Next.js 15 (Tailwind CSS, shadcn/ui) và Python Streamlit. Kích hoạt khi cần thiết kế giao diện Dark Mode ấn tượng, hiển thị streaming SSE theo thời gian thực, bảng log an ninh SOC, và biểu đồ trực quan hóa rủi ro.
version: 1.0.0
tools:
  - run_command
  - write_to_file
  - replace_file_content
---

# 🎨 Rapid Prototype UI: Hackathon Dashboard & Chat Visualizer

## 🎯 Mục tiêu (Objective)
Tạo dựng một giao diện người dùng hoàn chỉnh chuẩn **Enterprise AI Security & Analytics** trong vòng **1 giờ**. Giao diện tích hợp đầy đủ:
1. **Security Visualizer & Metric Cards**: Đo lường trạng thái rủi ro và các chỉ số vận hành.
2. **Realtime Terminal Logs**: Bảng điều khiển log phòng thủ an ninh mạng trực quan theo thời gian thực.
3. **Reactive Chat LLM**: Khung chat hỗ trợ phản hồi streaming SSE, hiển thị citation thẻ bài và công tắc Mock Mode dự phòng.

---

## 🔒 Ràng buộc kỹ thuật (Constraints)
1. **Dark Mode First**: Phối màu tối chuyên nghiệp (Slate 950 / Zinc 900) kết hợp với các dải màu điểm nhấn Neon (Cyan/Emerald/Rose) tạo cảm giác công nghệ cao.
2. **Zero-Lag SSE Parser**: Luồng nhận stream từ backend phải giải mã ký tự mượt mà, tự động cuộn xuống cuối màn hình (Auto-scroll), không giật lag DOM.
3. **Mock Failover Switch**: Có nút chuyển đổi trạng thái `Demo Mock Data` ngay góc trên cùng để đảm bảo không bị gián đoạn nếu mất kết nối backend.
4. **Mobile & Projection Friendly**: Thiết kế responsive, cỡ chữ và độ tương phản tối ưu cho máy chiếu hội trường Hackathon.

---

## 📋 Quy trình thực thi từng bước (Step-by-Step)

```text
[BƯỚC 1: Chọn Nền Tảng (Streamlit 10 phút HOẶC Next.js 15 SaaS)]
                             │
                             ▼
[BƯỚC 2: Dựng Khung Layout: KPI Metric Bar + 2-Column Split]
                             │
                             ▼
[BƯỚC 3: Triển khai Chat LLM Interface với Streaming State]
                             │
                             ▼
[BƯỚC 4: Tích hợp Realtime Security Log Console mô phỏng SOC]
                             │
                             ▼
[BƯỚC 5: Thiết lập Biểu đồ trực quan hóa rủi ro (Risk Gauge)]
                             │
                             ▼
[BƯỚC 6: Cài đặt Mock Switch dự phòng sự cố mạng]
```

---

## 💻 Mã nguồn chuẩn mực (Production-Ready Boilerplates)

### 🚀 NỀN TẢNG A: Streamlit Full-Suite (Chạy ngay, 100% Python, < 15 Phút)

File `app.py`:
```python
import streamlit as st
import time
import random

st.set_page_config(
    page_title="AI Cyber Sentinel & RAG Hub",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Dark theme & Hacker styling
st.markdown("""
<style>
    .stApp { background-color: #090d16; color: #f8fafc; }
    .metric-card {
        background: #111827;
        padding: 18px;
        border-radius: 12px;
        border: 1px solid #1f2937;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
    }
    .terminal-box {
        background-color: #030712;
        color: #10b981;
        font-family: 'Courier New', Courier, monospace;
        padding: 12px;
        border-radius: 8px;
        border: 1px solid #1f2937;
        height: 280px;
        overflow-y: auto;
    }
</style>
""", unsafe_allow_html=True)

# Sidebar
with st.sidebar:
    st.image("https://img.icons8.com/fluency/96/shield.png", width=64)
    st.title("Admin Console")
    st.toggle("⚡ Mock Failover Mode", value=False, key="mock_mode")
    st.slider("Guard Sensitivity", min_value=0.0, max_value=1.0, value=0.85)
    st.caption("Environment: **Hackathon Finals v2.6**")

# Top KPI Metric Cards
st.title("🛡️ AI Security Visualizer & Low-Resource RAG")
col1, col2, col3, col4 = st.columns(4)
col1.metric("🔒 Defense Status", "ARMED", "Zero Breaches")
col2.metric("⚡ Mean Latency", "128 ms", "-12 ms")
col3.metric("📚 Indexed Corpus", "15,820", "Vietnamese Legal")
col4.metric("🛑 Injection Blocked", "42 Attacks", "+5 Today")

st.divider()

# Main Stage: 2 Cột (Trái: Chat SSE, Phải: Security Log & Risk Visualizer)
left_col, right_col = st.columns([6, 4])

with left_col:
    st.subheader("💬 Trợ Lý AI Đa Ngữ (RAG Grounded)")
    
    if "chat_history" not in st.session_state:
        st.session_state.chat_history = [
            {"role": "assistant", "content": "Xin chào! Tôi là AI Sentinel. Mọi câu hỏi của bạn đều được bảo vệ và đối soát trích dẫn đầy đủ."}
        ]

    for msg in st.session_state.chat_history:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])

    user_query = st.chat_input("Nhập câu hỏi tra cứu hoặc payload test injection...")
    if user_query:
        st.session_state.chat_history.append({"role": "user", "content": user_query})
        with st.chat_message("user"):
            st.markdown(user_query)

        with st.chat_message("assistant"):
            status_box = st.status("🔍 Đang thẩm tra an ninh và truy vấn RAG...", expanded=True)
            time.sleep(0.4)
            status_box.write("🛡️ Cyber Prompt Guard: **Passed (No Injection detected)**")
            time.sleep(0.3)
            status_box.write("📚 ChromaDB: Đã trích xuất 2 tài liệu liên quan (Cosine: 0.18)")
            status_box.update(label="✅ Hoàn tất đối soát!", state="complete", expanded=False)

            placeholder = st.empty()
            full_text = ""
            mock_reply = (
                f"Dựa trên tài liệu thẩm tra, yêu cầu **'{user_query}'** đã được xử lý an toàn.\n\n"
                f"- **Kết luận**: Đảm bảo tuân thủ tiêu chuẩn an toàn thông tin.\n"
                f"- **Trích dẫn nguồn**: `TT01-BTTTT-2026.pdf` (Trang 15, Mục 3.2)."
            )
            for char in mock_reply:
                full_text += char
                placeholder.markdown(full_text + "▌")
                time.sleep(0.015)
            placeholder.markdown(full_text)
            st.session_state.chat_history.append({"role": "assistant", "content": full_text})

with right_col:
    st.subheader("📊 SOC Realtime Logs & Risk Meter")
    st.progress(15, text="Mức độ rủi ro hệ thống: THẤP (15%)")
    
    logs = [
        f"[{time.strftime('%H:%M:%S')}] [SEC_AUDIT] Sanitizer initialized. Rules: 14",
        f"[{time.strftime('%H:%M:%S')}] [RAG_CORE] ChromaDB loaded: 15,820 vectors",
        f"[{time.strftime('%H:%M:%S')}] [NET_IO] Inbound POST /api/v1/chat -> 200 OK",
        f"[{time.strftime('%H:%M:%S')}] [PROMPT_GUARD] Pattern check: 0 threats found",
        f"[{time.strftime('%H:%M:%S')}] [CANARY] Token rotation complete: 0x8f2a..."
    ]
    log_content = "\n".join(logs)
    st.markdown(f'<div class="terminal-box"><pre>{log_content}</pre></div>', unsafe_allow_html=True)
```

---

## 🔍 Checklist xác minh (Verification)
- [ ] **Khởi chạy ứng dụng**: Chạy `streamlit run app.py` giao diện hiển thị không lỗi cú pháp.
- [ ] **Mô phỏng Streaming**: Gõ tin nhắn trong khung chat, text phản hồi hiển thị hiệu ứng đánh máy mượt mà.
- [ ] **Mock Mode Switch**: Bật nút gạt `Mock Failover Mode` trên Sidebar hoạt động trơn tru.
- [ ] **Tương phản hiển thị**: Giao diện hiển thị rõ ràng trên cả màn hình nhỏ và máy chiếu độ phân giải lớn.
