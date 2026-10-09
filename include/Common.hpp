#pragma once

#include <string>
#include <vector>
#include <utility>
#include <cstdint>
#include <cmath>
#include <complex>

namespace numsys {

constexpr double EPSILON = 1e-9;
constexpr double PI = 3.14159265358979323846;
constexpr double E = 2.71828182845904523536;
constexpr double PHI = 1.61803398874989484820; // Golden ratio
constexpr double SQRT2 = 1.41421356237309504880;
constexpr double SQRT3 = 1.73205080756887729352;

struct ComplexNumber {
    double real{0.0};
    double imag{0.0};

    ComplexNumber() = default;
    ComplexNumber(double r, double i) : real(r), imag(i) {}

    [[nodiscard]] bool isReal() const {
        return std::abs(imag) < EPSILON;
    }

    [[nodiscard]] bool isPureImaginary() const {
        return std::abs(real) < EPSILON && std::abs(imag) >= EPSILON;
    }

    [[nodiscard]] bool isZero() const {
        return std::abs(real) < EPSILON && std::abs(imag) < EPSILON;
    }
};

struct RationalNumber {
    int64_t num{0};
    int64_t den{1};

    RationalNumber() = default;
    RationalNumber(int64_t n, int64_t d) : num(n), den(d) {
        simplify();
    }

    void simplify() {
        if (den == 0) return;
        if (den < 0) {
            num = -num;
            den = -den;
        }
        int64_t g = gcd(std::abs(num), den);
        if (g > 0) {
            num /= g;
            den /= g;
        }
    }

    static int64_t gcd(int64_t a, int64_t b) {
        while (b != 0) {
            int64_t t = b;
            b = a % b;
            a = t;
        }
        return a;
    }

    [[nodiscard]] double toDouble() const {
        return den != 0 ? static_cast<double>(num) / static_cast<double>(den) : 0.0;
    }

    [[nodiscard]] bool isInteger() const {
        return den == 1;
    }
};

} // namespace numsys
