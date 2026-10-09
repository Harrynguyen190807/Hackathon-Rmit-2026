# Hackathon-Rmit-2026

> **Đội thi:** Cơ Rô Chuồng Bích  
> **Sự kiện:** RMIT Hackathon 2026  
> **Chủ đề:** Tính toán khoa học (Scientific Computing), Khí động học số (CFD) & Kỹ thuật hệ thống hiện đại (Modern C++20)

---

## 📌 Tổng quan kho mã nguồn (Repository Overview)

Kho mã nguồn này là tập hợp các dự án kỹ thuật chuyên sâu được phát triển bởi **Team Cơ Rô Chuồng Bích**, bao gồm hai bài toán trọng tâm:

1. **Hệ thống phân loại và giải mã số học toàn diện** xây dựng bằng ngôn ngữ **C++20** hiệu năng cao.
2. **Mô phỏng khí động học (CFD) và cơ học chuyển động xe đạp đua Carbon** giải bằng phương pháp phần tử hữu hạn trên nền tảng **FEniCS**.

---

## 🗂️ Cấu trúc thư mục dự án (Project Architecture)

```text
Hackathon-Rmit-2026/
├── 📁 universal_number_classifier/   # [DỰ ÁN 1] Hệ thống phân loại số học C++20
│   ├── include/                     # Headers (OOP, Parser, Number Theory, Geometry)
│   ├── src/                         # Mã nguồn C++ triển khai thuật toán
│   ├── tests/                       # Bộ Unit Tests tự động (100% pass)
│   ├── build.sh                     # Script biên dịch tự động bằng g++
│   ├── Makefile                     # Makefile chuẩn
│   └── README.md                    # Tài liệu hướng dẫn chi tiết cho Dự án C++
│
├── 📁 cycling_aero_simulation/       # [DỰ ÁN 2] Mô phỏng CFD Khí động học & Công suất
│   ├── simulate_cycling_aero.py     # Script mô phỏng Navier-Stokes & Tính công suất
│   ├── output/                      # Biểu đồ phân tích và file ParaView (.pvd, .vtu)
│   └── README.md                    # Tài liệu lý thuyết & kết quả mô phỏng
│
├── 📁 Hung-practice/                 # Không gian thực hành của thành viên team
├── .gitignore                       # Cấu hình bỏ qua file nhị phân & tạm
└── README.md                        # Tài liệu tổng quát của repository
```

---

## 🚀 Tóm tắt các dự án con (Sub-projects)

### 1. 🔢 Universal Number Classifier & Analyzer (C++20)
* **Vị trí thư mục:** [`universal_number_classifier/`](./universal_number_classifier/)
* **Mô tả:** Hệ thống phân tích, nhận dạng và phân loại số học toàn diện từ chuỗi đầu vào.
* **Khả năng nhận diện:**
  * **Tập hợp số:** Số phức $\mathbb{C}$ (modun, argument, dạng lượng giác, liên hợp), Số thực $\mathbb{R}$, Số hữu tỉ $\mathbb{Q}$ (phân số tối giản), Số vô tỉ $\mathbb{R}\setminus\mathbb{Q}$ (nhận diện $\pi, e, \phi, \sqrt{2}, \sqrt{3}$), Số nguyên $\mathbb{Z}$, Số tự nhiên $\mathbb{N}, \mathbb{N}^*$.
  * **Lý thuyết số:** Số nguyên tố, Hợp số, Phân tích thừa số nguyên tố, Ước số, Số hoàn hảo (Perfect Number), Số dư thừa/thiếu hụt, Số chính phương, Số lập phương, Dãy Fibonacci, Số đối xứng (Palindrome), Số Armstrong, Số tam giác, Số hạnh phúc, Số tự mãn, Giai thừa.
* **Cách chạy nhanh:**
  ```bash
  cd universal_number_classifier
  ./build.sh
  ./bin/number_classifier 997        # Chạy trực tiếp
  ./bin/number_classifier            # Vào giao diện REPL tương tác
  ```
* 📖 *Xem hướng dẫn chi tiết tại:* [universal_number_classifier/README.md](./universal_number_classifier/README.md)

---

### 2. 🚴 FEniCS CFD Cycling Aerodynamics & Power Simulation
* **Vị trí thư mục:** [`cycling_aero_simulation/`](./cycling_aero_simulation/)
* **Mô tả:** Mô phỏng dòng khí động học giải hệ phương trình **Navier-Stokes** bằng phần tử hữu hạn (**FEniCS**) và tính toán công suất người đạp cần tạo ra để duy trì xe đạp đua Carbon ở tốc độ **40 km/h**, **gió ngược 3 km/h** và **độ dốc 5%**.
* **Kết quả vật lý cốt lõi:**
  * **Tổng công suất yêu cầu:** $\mathbf{761.88 \text{ WATT}}$ ($\approx 10.58 \text{ W/kg}$).
  * **Cơ cấu công suất:**
    * Thắng trọng lực leo dốc 5%: **440.8 W** (57.9%)
    * Thắng lực cản gió khí động học (CFD): **267.6 W** (35.1%)
    * Thắng ma sát lăn lốp xe: **30.9 W** (4.1%)
    * Hao phí cơ học xích líp (3%): **22.6 W** (3.0%)
* **Công cụ hỗ trợ trực quan:** Xuất dữ liệu trường dòng khí động học sang phần mềm **ParaView** (`.pvd`, `.vtu`) và biểu đồ phân tích đồ họa (`.png`).
* **Cách chạy nhanh:**
  ```bash
  cd cycling_aero_simulation
  python3 simulate_cycling_aero.py
  ```
* 📖 *Xem hướng dẫn chi tiết tại:* [cycling_aero_simulation/README.md](./cycling_aero_simulation/README.md)

---

## 🛠️ Công nghệ & Công cụ sử dụng (Tech Stack)

| Hạng mục | Công nghệ sử dụng |
| :--- | :--- |
| **Ngôn ngữ lập trình** | C++ (chuẩn C++20), Python 3.14 |
| **Mô phỏng phần tử hữu hạn (FEM)** | FEniCS (DOLFIN 2019.2), mshr, PETSc, MUMPS |
| **Trực quan hóa khoa học** | ParaView 6.1.1, Matplotlib, NumPy |
| **Môi trường thực thi** | Ubuntu trên WSL 2 (Windows Subsystem for Linux) |
| **Quản lý phiên bản & CI/CD** | Git, GitHub |

---

*Phát triển bởi Team Cơ Rô Chuồng Bích — RMIT Hackathon 2026.*
