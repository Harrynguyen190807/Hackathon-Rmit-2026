# Hackathon-Rmit-2026

**Team:** Cơ Rô Chuồng Bích  
**Dự án:** Universal Number Classifier & Analyzer (Hệ thống phân loại và phân tích số học toàn diện trong C++20)

---

## 📖 Giới thiệu (Overview)

**Universal Number Classifier & Analyzer** là một hệ thống C++ hiện đại, mạnh mẽ, được thiết kế để tự động nhận diện, phân tích và phân loại mọi định dạng số học:
- **Tập hợp số (Mathematical Sets):**
  - $\mathbb{C}$ (Số phức - Complex Numbers)
  - Số thuần ảo (Purely Imaginary Numbers)
  - $\mathbb{R}$ (Số thực - Real Numbers)
  - $\mathbb{Q}$ (Số hữu tỉ / Phân số - Rational Numbers)
  - $\mathbb{R} \setminus \mathbb{Q}$ (Số vô tỉ - Irrational Numbers)
  - $\mathbb{Z}$ (Số nguyên - Integers)
  - $\mathbb{N}$ (Số tự nhiên - Natural Numbers, $n \ge 0$)
  - $\mathbb{N}^*$ (Số tự nhiên dương, $n > 0$)
- **Đặc tính số học nguyên (Number-Theoretic Properties):**
  - Số nguyên tố (Prime Numbers) & Hợp số (Composite Numbers)
  - Phân tích thừa số nguyên tố (Prime Factorization, ví dụ: $2^3 \times 3 \times 5$)
  - Danh sách ước số & Tổng các ước thực sự (Proper Divisors)
  - Số hoàn hảo (Perfect Number), Số dư thừa (Abundant), Số thiếu hụt (Deficient)
  - Số chính phương (Perfect Square), Số lập phương (Perfect Cube), Lũy thừa của 2
  - Dãy số Fibonacci
  - Số đối xứng (Palindromic Number)
  - Số Armstrong / Narcissistic (ví dụ: $153 = 1^3 + 5^3 + 3^3$)
  - Số tam giác (Triangular Number: $T_n = n(n+1)/2$)
  - Số hạnh phúc (Happy Number)
  - Số tự mãn (Automorphic Number: $n^2$ tận cùng bằng $n$)
  - Số giai thừa ($n = k!$)
- **Đặc tính số phức & hình học (Complex & Geometric Features):**
  - Phần thực $\text{Re}(z)$ và Phần ảo $\text{Im}(z)$
  - Modun $|z| = \sqrt{a^2 + b^2}$
  - Argument $\text{Arg}(z)$ (cả Radian và Độ)
  - Số liên hợp $\bar{z} = a - bi$
  - Dạng lượng giác (Polar Form) và Dạng mũ (Exponential Form)
- **Hỗ trợ hằng số toán học:** $\pi$, $e$, $\phi$ (Tỷ lệ vàng), $\sqrt{2}$, $\sqrt{3}$.

---

## 📁 Cấu trúc thư mục (Project Structure)

```text
Hackathon-Rmit-2026/
├── include/
│   ├── Common.hpp            # Định nghĩa kiểu dữ liệu, hằng số toán học, cấu trúc cơ bản
│   ├── ComplexProperties.hpp # Phân tích modun, argument, dạng lượng giác số phức
│   ├── Formatter.hpp         # Giao diện hiển thị terminal đẹp mắt (ANSI colors, bảng biểu)
│   ├── IntegerProperties.hpp # Các thuật toán lý thuyết số (Prime, Factorization, Fibonacci...)
│   ├── NumberClassifier.hpp  # Logic phân loại phân cấp tập hợp số
│   └── NumberParser.hpp      # Bộ phân tích cú pháp chuỗi đầu vào đa định dạng
├── src/
│   ├── ComplexProperties.cpp
│   ├── Formatter.cpp
│   ├── IntegerProperties.cpp
│   ├── NumberClassifier.cpp
│   ├── NumberParser.cpp
│   └── main.cpp              # Chương trình chính (REPL tương tác & CLI Arguments)
├── tests/
│   └── test_classifier.cpp   # Bộ Unit Tests tự động (100% pass)
├── build.sh                  # Shell script biên dịch nhanh bằng g++
├── Makefile                  # Makefile tiêu chuẩn
├── .gitignore
└── README.md
```

---

## 🚀 Hướng dẫn biên dịch & Chạy (Build & Run)

### 1. Yêu cầu hệ thống
- Trình biên dịch C++ hỗ trợ C++20 (ví dụ: `g++ >= 11`, `clang++ >= 13`).
- Môi trường Linux / WSL2 / macOS hoặc MinGW trên Windows.

### 2. Biên dịch nhanh bằng `build.sh`
```bash
chmod +x build.sh
./build.sh
```

Hoặc dùng `make`:
```bash
make
```

### 3. Chạy Unit Tests
```bash
./bin/test_classifier
```

### 4. Sử dụng chương trình

#### Chế độ dòng lệnh trực tiếp (Direct Arguments):
```bash
# Kiểm tra số nguyên tố
./bin/number_classifier 997

# Kiểm tra số phức
./bin/number_classifier "3 + 4i"

# Kiểm tra phân số hữu tỉ
./bin/number_classifier "3/4"

# Kiểm tra hằng số toán học
./bin/number_classifier "pi"

# Kiểm tra số hoàn hảo
./bin/number_classifier 28
```

#### Chế độ giao diện tương tác (Interactive REPL):
```bash
./bin/number_classifier
```
Giao diện dòng lệnh sẽ xuất hiện:
```text
num-detect > 153
num-detect > 3 - 4j
num-detect > test
num-detect > help
num-detect > exit
```

---

## 🧪 Ví dụ kết quả mẫu (Sample Output)

```text
────────────────────────────────────────────────────────────────────────
 KẾT QUẢ PHÂN TÍCH SỐ HỌC: 28
────────────────────────────────────────────────────────────────────────
▶ TỔNG QUAN: Đây là một SỐ NGUYÊN (ℤ) dương chẵn và là HỢP SỐ.

▶ THUỘC CÁC TẬP HỢP SỐ (MATHEMATICAL SETS):
  [✓ THUỘC]  ℂ   (Tập số phức - Complex numbers)
  [✓ THUỘC]  ℝ   (Tập số thực - Real numbers)
  [✓ THUỘC]  ℚ   (Tập số hữu tỉ - Rational numbers)
  [✗ KHÔNG]  ℝ\ℚ (Tập số vô tỉ - Irrational numbers)
  [✓ THUỘC]  ℤ   (Tập số nguyên - Integers)
  [✓ THUỘC]  ℕ   (Tập số tự nhiên - Natural numbers, n ≥ 0)
  [✓ THUỘC]  ℕ*  (Tập số tự nhiên dương, n > 0)

▶ CÁC NHÃN ĐẶC TÍNH (CHARACTERISTIC TAGS):
  [Số phức (ℂ)] [Số thực (ℝ)] [Số hữu tỉ (ℚ)] [Số nguyên (ℤ)] [Số tự nhiên (ℕ)] [Số tự nhiên dương (ℕ*)] [Số dương (Positive)] [Số chẵn (Even)] [Hợp số (Composite)] [Số tam giác (Triangular)] [Số hạnh phúc (Happy Number)] [Số hoàn hảo (Perfect Number)]

▶ ĐẶC TÍNH SỐ HỌC NGUYÊN (NUMBER-THEORETIC PROPERTIES):
  • Dấu & Tính chẵn lẻ:            Số dương | Số chẵn (Even)
  • Nguyên tố / Hợp số:            Hợp số (Composite Number)
  • Phân tích thừa số nguyên tố:   2^2 × 7
  • Danh sách ước số (6 ước):       1, 2, 4, 7, 14, 28
  • Tổng các ước thực sự (Proper): 28
  • Các tính chất dãy số đặc biệt:
    - Là số tam giác thứ 7 (T(7) = n(n+1)/2).
    - Là số hạnh phúc (Happy number).
    - ★ LÀ SỐ HOÀN HẢO (Perfect Number - tổng ước thực sự bằng chính nó)!
────────────────────────────────────────────────────────────────────────
```

---
*Developed for RMIT Hackathon 2026.*
