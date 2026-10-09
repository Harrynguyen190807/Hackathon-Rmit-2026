# Universal Number Classifier & Analyzer (C++20)

**Dự án con:** Phân loại và phân tích số học toàn diện trong C++20  
**Tác giả:** Team Cơ Rô Chuồng Bích — RMIT Hackathon 2026

---

## 📖 Giới thiệu (Overview)

**Universal Number Classifier & Analyzer** là một hệ thống C++20 hiện đại, tối ưu và đa năng, được thiết kế để nhận diện, phân tích và phân loại chuyên sâu mọi định dạng số học mà người dùng nhập vào.

Hệ thống tự động phát hiện số thuộc tập hợp nào, giải mã cấu trúc đại số và trích xuất hàng loạt các tính chất số học đặc biệt.

---

## ✨ Các tính năng phân loại chính

### 1. Phân loại theo tập hợp số học (Mathematical Sets):
* $\mathbb{C}$ **(Tập số phức - Complex numbers):** Nhận diện dạng chuẩn $a + bi$, $a - bj$, số thuần ảo ($5i$, $-i$), tự động tính:
  * Phần thực $\text{Re}(z)$ & Phần ảo $\text{Im}(z)$
  * Modun $|z| = \sqrt{a^2 + b^2}$
  * Argument $\text{Arg}(z)$ (cả Radian và Độ)
  * Số liên hợp $\bar{z} = a - bi$
  * Dạng lượng giác (Polar form: $r(\cos\theta + i\sin\theta)$) và dạng hàm mũ ($r e^{i\theta}$)
* $\mathbb{R}$ **(Tập số thực - Real numbers):** Số dương, số âm, số 0.
* $\mathbb{Q}$ **(Tập số hữu tỉ - Rational numbers):** Phân số dạng $p/q$, tự động tối giản ước chung lớn nhất (GCD).
* $\mathbb{R} \setminus \mathbb{Q}$ **(Tập số vô tỉ - Irrational numbers):** Nhận diện các hằng số toán học kinh điển:
  * $\pi \approx 3.14159...$ (Số Pi)
  * $e \approx 2.71828...$ (Hằng số Euler)
  * $\phi \approx 1.61803...$ (Tỷ lệ vàng - Golden Ratio)
  * $\sqrt{2} \approx 1.41421...$, $\sqrt{3} \approx 1.73205...$
* $\mathbb{Z}$ **(Tập số nguyên - Integers)**
* $\mathbb{N}$ **(Tập số tự nhiên - Natural numbers, $n \ge 0$)**
* $\mathbb{N}^*$ **(Tập số tự nhiên dương, $n > 0$)**

### 2. Thuật toán lý thuyết số học nguyên chuyên sâu (Number Theory):
Khi số thuộc tập số nguyên $\mathbb{Z}$:
* **Nguyên tố & Hợp số:** Thuật toán kiểm tra số nguyên tố tối ưu $O(\sqrt{n})$ và phân tích thừa số nguyên tố (Prime Factorization, ví dụ: $120 = 2^3 \times 3 \times 5$).
* **Ước số & Tổng ước:** Liệt kê toàn bộ ước số, tính tổng các ước số thực sự (Proper Divisors).
* **Số hoàn hảo (Perfect Number):** Tổng các ước thực sự bằng chính nó (ví dụ: $6, 28, 496, 8128$).
* **Số dư thừa (Abundant)** / **Số thiếu hụt (Deficient)**.
* **Số chính phương (Square)** ($n = k^2$) & **Số lập phương (Cube)** ($n = k^3$).
* **Lũy thừa của 2 (Power of 2):** Kiểm tra nhanh qua bitwise $(n \& (n-1)) == 0$.
* **Dãy số Fibonacci:** Kiểm tra nghiệm $5n^2 \pm 4$ là số chính phương.
* **Số đối xứng (Palindromic number):** Đọc xuôi ngược như nhau (ví dụ: $121, 1331$).
* **Số Armstrong / Narcissistic:** Tổng các chữ số mũ $k$ bằng chính nó (ví dụ: $153 = 1^3 + 5^3 + 3^3$).
* **Số tam giác (Triangular number):** Thỏa mãn $n = k(k+1)/2$.
* **Số hạnh phúc (Happy number):** Chuỗi tổng bình phương các chữ số hội tụ về 1.
* **Số tự mãn (Automorphic number):** Bình phương tận cùng bằng chính nó (ví dụ: $25^2 = 625$).
* **Số giai thừa (Factorial):** Kiểm tra $n = k!$.

---

## 📁 Cấu trúc thư mục (Directory Structure)

```text
universal_number_classifier/
├── include/
│   ├── Common.hpp            # Định nghĩa kiểu dữ liệu, hằng số, cấu trúc cơ bản
│   ├── ComplexProperties.hpp # Phân tích modun, argument, dạng lượng giác số phức
│   ├── Formatter.hpp         # Trực quan hóa kết quả (ANSI colors, bảng biểu)
│   ├── IntegerProperties.hpp # Các thuật toán lý thuyết số nguyên
│   ├── NumberClassifier.hpp  # Logic điều phối và phân loại tập hợp số
│   └── NumberParser.hpp      # Bộ phân tích cú pháp chuỗi đầu vào đa dạng
├── src/
│   ├── ComplexProperties.cpp
│   ├── Formatter.cpp
│   ├── IntegerProperties.cpp
│   ├── NumberClassifier.cpp
│   ├── NumberParser.cpp
│   └── main.cpp              # Entry point CLI (Interactive REPL & Direct Argument)
├── tests/
│   └── test_classifier.cpp   # Bộ Unit Tests tự động (100% pass)
├── build.sh                  # Shell script biên dịch nhanh bằng g++ (C++20)
├── Makefile                  # Makefile chuẩn
└── README.md                 # Tài liệu module
```

---

## 🚀 Hướng dẫn biên dịch & Chạy (Build & Run)

Mở terminal trong thư mục này:
```bash
cd universal_number_classifier
```

### 1. Biên dịch
```bash
chmod +x build.sh
./build.sh
```
*Hoặc sử dụng `make`:*
```bash
make
```

### 2. Chạy Unit Tests tự động
```bash
./bin/test_classifier
```

### 3. Thực thi chương trình

#### Chế độ tham số dòng lệnh một lần (Direct Arguments):
```bash
# Kiểm tra số nguyên tố lớn
./bin/number_classifier 997

# Kiểm tra số hoàn hảo
./bin/number_classifier 28

# Kiểm tra số phức
./bin/number_classifier "3 + 4i"

# Kiểm tra số thuần ảo
./bin/number_classifier "-5i"

# Kiểm tra phân số hữu tỉ
./bin/number_classifier "3/4"

# Kiểm tra hằng số toán học
./bin/number_classifier "pi"
```

#### Chế độ tương tác liên tục (Interactive REPL):
```bash
./bin/number_classifier
```
Giao diện dòng lệnh sẽ xuất hiện để bạn nhập thử nghiệm:
```text
num-detect > 153
num-detect > 3 - 4j
num-detect > test
num-detect > help
num-detect > exit
```

---

## 🧪 Ví dụ kết quả thực tế

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
