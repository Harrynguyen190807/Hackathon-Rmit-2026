# Universal Number Classifier & Analyzer (C++20)

**Subproject:** Comprehensive Mathematical Number Classification & Number-Theoretic Analysis in C++20  
**Author:** Team Suits (Co Ro Chuong Bich) — RMIT Hackathon 2026

---

## 📖 Overview

The **Universal Number Classifier & Analyzer** is a high-performance, modern C++20 engine designed to parse, classify, and extract mathematical properties from arbitrary numerical input.

The system determines mathematical set membership ($\mathbb{C}, \mathbb{R}, \mathbb{Q}, \mathbb{R} \setminus \mathbb{Q}, \mathbb{Z}, \mathbb{N}, \mathbb{N}^*$), parses algebraic representations, and computes rigorous number-theoretic properties.

---

## ✨ Core Classification Capabilities

### 1. Mathematical Set Classification:
* $\mathbb{C}$ **(Complex Numbers):** Recognizes standard formats $a + bi$, $a - bj$, pure imaginary values ($5i$, $-i$), and computes:
  * Real part $\text{Re}(z)$ & Imaginary part $\text{Im}(z)$
  * Modulus / Magnitude $|z| = \sqrt{a^2 + b^2}$
  * Argument $\text{Arg}(z)$ (both Radians and Degrees)
  * Complex conjugate $\bar{z} = a - bi$
  * Polar form ($r(\cos\theta + i\sin\theta)$) and exponential form ($r e^{i\theta}$)
* $\mathbb{R}$ **(Real Numbers):** Positive, negative, zero.
* $\mathbb{Q}$ **(Rational Numbers):** Fractional inputs $p/q$, simplified via Greatest Common Divisor ($\gcd$).
* $\mathbb{R} \setminus \mathbb{Q}$ **(Irrational Numbers):** Recognizes canonical mathematical constants:
  * $\pi \approx 3.14159...$ (Archimedes' constant)
  * $e \approx 2.71828...$ (Euler's number)
  * $\phi \approx 1.61803...$ (Golden Ratio)
  * $\sqrt{2} \approx 1.41421...$, $\sqrt{3} \approx 1.73205...$
* $\mathbb{Z}$ **(Integers)**
* $\mathbb{N}$ **(Natural Numbers, $n \ge 0$)**
* $\mathbb{N}^*$ **(Positive Integers, $n > 0$)**

### 2. Number-Theoretic Algorithms ($\mathbb{Z}$):
When an input belongs to $\mathbb{Z}$:
* **Primality & Composites:** $O(\sqrt{n})$ primality testing and prime factorization ($120 = 2^3 \times 3 \times 5$).
* **Divisors & Aliquot Sum:** Enumerates all divisors and calculates the sum of proper divisors.
* **Abundance Classification:**
  * **Perfect Number:** Sum of proper divisors equals the number itself ($6, 28, 496, 8128$).
  * **Abundant Number:** Sum of proper divisors exceeds the number.
  * **Deficient Number:** Sum of proper divisors is less than the number.
* **Powers & Roots:**
  * **Perfect Square** ($n = k^2$) & **Perfect Cube** ($n = k^3$).
  * **Power of 2:** Bitwise evaluation via $(n \& (n - 1)) == 0$.
* **Special Integer Sequences & Properties:**
  * **Fibonacci Sequence:** Verified via square tests on $5n^2 \pm 4$.
  * **Palindromic Number:** Identical read forward and backward ($121, 1331$).
  * **Armstrong / Narcissistic Number:** Sum of its digits raised to power of digit length equals the number ($153 = 1^3 + 5^3 + 3^3$).
  * **Triangular Number:** Satisfies $n = k(k+1)/2$.
  * **Happy Number:** Sum-of-squared-digits sequence converges to 1.
  * **Automorphic Number:** Square ends with the digits of the original number ($25^2 = 625$).
  * **Factorial Number:** Verifies $n = k!$.

---

## 📁 Directory Structure

```text
universal_number_classifier/
├── include/
│   ├── Common.hpp            # Fundamental data types, constants, structures
│   ├── ComplexProperties.hpp # Modulus, argument, polar form analysis
│   ├── Formatter.hpp         # Terminal formatting (ANSI color codes, tabular reports)
│   ├── IntegerProperties.hpp # Number theory algorithms (primes, factors, sequences)
│   ├── NumberClassifier.hpp  # High-level classifier & set membership logic
│   └── NumberParser.hpp      # Robust multi-format numerical string parser
├── src/
│   ├── ComplexProperties.cpp
│   ├── Formatter.cpp
│   ├── IntegerProperties.cpp
│   ├── NumberClassifier.cpp
│   ├── NumberParser.cpp
│   └── main.cpp              # CLI entry point (Interactive REPL & Direct Argument mode)
├── tests/
│   └── test_classifier.cpp   # Automated unit test suite (100% passing)
├── build.sh                  # One-click build script using g++ (C++20)
├── Makefile                  # Standard Makefile
└── README.md                 # Module documentation
```

---

## 🚀 Build & Run Guide

Open a terminal in this directory:
```bash
cd universal_number_classifier
```

### 1. Build
```bash
chmod +x build.sh
./build.sh
```
*Or using `make`:*
```bash
make
```

### 2. Run Automated Unit Tests
```bash
./bin/test_classifier
```

### 3. Run the Application

#### Direct Argument Mode:
```bash
# Analyze a large prime
./bin/number_classifier 997

# Analyze a perfect number
./bin/number_classifier 28

# Analyze a complex number
./bin/number_classifier "3 + 4i"

# Analyze a pure imaginary number
./bin/number_classifier "-5i"

# Analyze a rational fraction
./bin/number_classifier "3/4"

# Analyze an irrational mathematical constant
./bin/number_classifier "pi"
```

#### Interactive REPL Mode:
```bash
./bin/number_classifier
```
Interactive prompt:
```text
num-detect > 153
num-detect > 3 - 4j
num-detect > test
num-detect > help
num-detect > exit
```

---

## 🧪 Sample Execution Output

```text
────────────────────────────────────────────────────────────────────────
 NUMBER ANALYSIS REPORT: 28
────────────────────────────────────────────────────────────────────────
▶ SUMMARY: This is an INTEGER (ℤ) positive even and a COMPOSITE NUMBER.

▶ MATHEMATICAL SET MEMBERSHIP:
  [✓ IN SET]  ℂ   (Complex numbers)
  [✓ IN SET]  ℝ   (Real numbers)
  [✓ IN SET]  ℚ   (Rational numbers)
  [✗ NOT IN]  ℝ\ℚ (Irrational numbers)
  [✓ IN SET]  ℤ   (Integers)
  [✓ IN SET]  ℕ   (Natural numbers, n ≥ 0)
  [✓ IN SET]  ℕ*  (Positive integers, n > 0)

▶ CHARACTERISTIC TAGS:
  [Complex Number (ℂ)] [Real Number (ℝ)] [Rational Number (ℚ)] [Integer (ℤ)] [Natural Number (ℕ)] [Positive Integer (ℕ*)] [Positive] [Even] [Composite Number] [Triangular Number] [Happy Number] [Perfect Number]

▶ NUMBER-THEORETIC PROPERTIES:
  • Sign & Parity:                 Positive | Even
  • Primality:                     Composite Number
  • Prime Factorization:           2^2 × 7
  • Divisors list (6 divisors):    1, 2, 4, 7, 14, 28
  • Sum of proper divisors:        28
  • Powers & Roots check:
    - Not a perfect square or perfect cube.
  • Special sequence properties:
    - Triangular number T(7) = n(n+1)/2.
    - Happy number.
    - ★ PERFECT NUMBER (Sum of proper divisors equals itself)!
────────────────────────────────────────────────────────────────────────
```
