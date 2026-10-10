# Hackathon-Rmit-2026

> **Đội thi:** Cơ Rô Chuồng Bích  
> **Sự kiện:** RMIT Hackathon 2026  
> **Chủ đề:** Hệ thống Đa Tác tử (Multi-Agent Systems), Tính toán Khoa học (Scientific Computing) & Kỹ thuật Hệ thống Hiệu năng cao (Modern C++20)

---

## 📌 Tổng quan kho mã nguồn (Repository Overview)

Kho mã nguồn này là tập hợp các giải pháp kỹ thuật chuyên sâu được phát triển bởi **Team Cơ Rô Chuồng Bích**, bao gồm 3 dự án cốt lõi:

1. 🛡️ **Resilient Agentic Orchestrator (RAO):** Hệ thống điều phối đa tác tử (StateGraph Engine) tích hợp bảo mật 2 lớp (OWASP Top 10 for LLMs), xử lý ngôn ngữ tiếng Việt bản địa (Logistics Slang & Shorthand) và kiểm soát hợp đồng dữ liệu nghiêm ngặt bằng Pydantic v2.
2. 🔢 **Universal Number Classifier & Analyzer:** Hệ thống phân loại, nhận dạng và phân tích số học toàn diện viết bằng **C++20** hiện đại.
3. 🚴 **FEniCS CFD Cycling Aerodynamics & Power Simulation:** Mô phỏng khí động học giải hệ phương trình **Navier-Stokes** bằng phần tử hữu hạn (**FEniCS**) tính toán công suất xe đạp đua Carbon leo dốc 5% ở 40 km/h.

---

## 🗂️ Cấu trúc thư mục dự án (Project Architecture)

```text
Hackathon-Rmit-2026/
├── 📁 resilient_agentic_orchestrator/  # [DỰ ÁN 1] Hệ thống Đa tác tử & Bảo mật AI (Python 3.11+)
│   ├── rao/
│   │   ├── schemas.py                 # Pydantic v2 Contracts (extra='forbid', strict=True)
│   │   ├── state.py                   # AgentState, DAG Plan, TraceEvent, Verdict
│   │   ├── tools.py                   # ToolRegistry, Retry Logic, Mock Backend
│   │   ├── orchestrator.py            # StateGraph Engine (5 Node Pipeline)
│   │   ├── planner.py                 # Planner Agent (Task Decomposition DAG)
│   │   ├── security/                  # SanitizerGuard (PII) & InjectionFirewall
│   │   └── nlp/                       # Vietnamese Lexicon, Slang & Hybrid Retriever (BM25 + Dense)
│   ├── tests/test_rao.py              # Suite kiểm thử tự động (TC-01, TC-02, TC-03)
│   ├── benchmark.py                   # CLI Benchmark Runner
│   ├── pyproject.toml                 # Cấu hình dự án & Pytest
│   └── README.md                      # Tài liệu kỹ thuật chi tiết của RAO
│
├── 📁 universal_number_classifier/     # [DỰ ÁN 2] Hệ thống phân loại số học C++20
│   ├── include/                       # Headers (OOP, Parser, Number Theory, Geometry)
│   ├── src/                           # Mã nguồn C++ triển khai thuật toán
│   ├── tests/                         # Bộ Unit Tests tự động (100% pass)
│   ├── build.sh                       # Script biên dịch tự động bằng g++
│   ├── Makefile                       # Makefile chuẩn
│   └── README.md                      # Tài liệu hướng dẫn chi tiết cho Dự án C++
│
├── 📁 cycling_aero_simulation/         # [DỰ ÁN 3] Mô phỏng CFD Khí động học & Công suất
│   ├── simulate_cycling_aero.py       # Script mô phỏng Navier-Stokes & Tính công suất
│   ├── output/                        # Biểu đồ phân tích và file ParaView (.pvd, .vtu)
│   └── README.md                      # Tài liệu lý thuyết & kết quả mô phỏng
│
├── 📁 Hung-practice/                   # Không gian thực hành của thành viên team
├── .gitignore                         # Cấu hình bỏ qua file nhị phân & tạm
└── README.md                          # Tài liệu tổng quát của repository
```

---

## 🚀 Tóm tắt các dự án (Projects Summary)

### 1. 🛡️ Resilient Agentic Orchestrator (RAO)
* **Vị trí thư mục:** [`resilient_agentic_orchestrator/`](./resilient_agentic_orchestrator/)
* **Đặc điểm nổi bật:**
  * **Mô hình StateGraph 5 bước:** `[Input] -> [Guardrail Pre-Check] -> [Planner/Router] -> [Tool Execution] -> [Response Synthesis] -> [Guardrail Post-Check]`.
  * **Bảo vệ an ninh 2 lớp:**
    * *SanitizerGuard:* Ẩn danh hóa số điện thoại, CCCD, tên người, khóa API_KEY/Token vào Vault bảo mật.
    * *InjectionFirewall:* Phát hiện và trung hòa tấn công Prompt Injection (trực tiếp & gián tiếp qua tài liệu đính kèm), ngăn chặn rò rỉ System Prompt.
  * **NLP Tiếng Việt Logistics:** Xử lý từ viết tắt (`ktra`, `NCC`, `SL`, `đh`), từ lóng (`tui`, `nha sếp`, `nghen`), đơn vị hành chính (`Q.7`, `TP.HCM`) và thời gian trễ (`2 tiếng rưỡi` $\rightarrow$ 150 phút).
  * **Tìm kiếm lai (Hybrid Retrieval):** BM25 + Dense Subword Hashing kết hợp bằng Reciprocal Rank Fusion (RRF).
  * **Hợp đồng dữ liệu Pydantic v2:** 100% hợp lệ, cấm ép kiểu sai lệch (`extra="forbid"`, `strict=True`).
* **Lệnh chạy:**
  ```bash
  cd resilient_agentic_orchestrator
  .venv/bin/pytest -v         # Chạy toàn bộ 8 bài test tự động (100% PASS)
  .venv/bin/python benchmark.py # Chạy Benchmark Runner cho TC-01, TC-02, TC-03
  ```

---

### 2. 🔢 Universal Number Classifier & Analyzer (C++20)
* **Vị trí thư mục:** [`universal_number_classifier/`](./universal_number_classifier/)
* **Đặc điểm nổi bật:**
  * Nhận diện tập hợp số: Số phức $\mathbb{C}$, số thực $\mathbb{R}$, số hữu tỉ $\mathbb{Q}$, số vô tỉ $\mathbb{R}\setminus\mathbb{Q}$, số nguyên $\mathbb{Z}$, số tự nhiên $\mathbb{N}, \mathbb{N}^*$.
  * Phân tích lý thuyết số chuyên sâu: Số nguyên tố, hợp số, thừa số nguyên tố, số hoàn hảo, số chính phương, Fibonacci, Armstrong, số tam giác, số hạnh phúc...
* **Lệnh chạy:**
  ```bash
  cd universal_number_classifier
  ./build.sh && ./bin/test_classifier
  ./bin/number_classifier 997
  ```

---

### 3. 🚴 FEniCS CFD Cycling Aerodynamics & Power Simulation
* **Vị trí thư mục:** [`cycling_aero_simulation/`](./cycling_aero_simulation/)
* **Đặc điểm nổi bật:**
  * Giải phương trình **Navier-Stokes** trạng thái ổn định bằng phương pháp phần tử hữu hạn Taylor-Hood ($P_2 - P_1$) kết hợp bộ giải trực tiếp MUMPS.
  * Tính toán công suất người đạp cần sinh ra ở tốc độ 40 km/h, gió ngược 3 km/h, dốc 5%: **761.88 WATT** (10.58 W/kg).
  * Hỗ trợ xuất dữ liệu sang **ParaView 6.1.1** (`velocity.pvd`, `pressure.pvd`).
* **Lệnh chạy:**
  ```bash
  cd cycling_aero_simulation
  python3 simulate_cycling_aero.py
  ```

---

## 🛠️ Công nghệ & Công cụ sử dụng (Tech Stack)

| Lĩnh vực | Công nghệ |
| :--- | :--- |
| **Agentic Orchestration & Security** | Python 3.11+, Pydantic v2, StateGraph Engine, Regex Multi-view, Subword Hashing, BM25 |
| **Systems & High-Performance Computing** | C++20, g++ 15.2, Makefile |
| **Scientific Computing & CFD** | FEniCS 2019.2, mshr, PETSc, MUMPS, ParaView 6.1.1 |
| **Testing & CI/CD** | Pytest, Git, GitHub Actions |
| **Môi trường vận hành** | Ubuntu 26.04 LTS trên WSL 2 (Windows Subsystem for Linux) |

---

*Phát triển bởi Team Cơ Rô Chuồng Bích — RMIT Hackathon 2026.*
