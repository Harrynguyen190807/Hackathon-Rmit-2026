#include "Formatter.hpp"
#include <iostream>
#include <sstream>
#include <iomanip>

namespace numsys {

namespace Color {
    const char* RESET   = "\033[0m";
    const char* BOLD    = "\033[1m";
    const char* RED     = "\033[31m";
    const char* GREEN   = "\033[32m";
    const char* YELLOW  = "\033[33m";
    const char* BLUE    = "\033[34m";
    const char* MAGENTA = "\033[35m";
    const char* CYAN    = "\033[36m";
    const char* WHITE   = "\033[37m";
}

void Formatter::printBanner() {
    std::cout << Color::CYAN << Color::BOLD
              << "╔══════════════════════════════════════════════════════════════════════╗\n"
              << "║            UNIVERSAL NUMBER CLASSIFIER & ANALYZER                   ║\n"
              << "║                   Team: Cơ Rô Chuồng Bích                            ║\n"
              << "╚══════════════════════════════════════════════════════════════════════╝\n"
              << Color::RESET << "\n";
}

void Formatter::printHelp() {
    std::cout << Color::YELLOW << "HƯỚNG DẪN SỬ DỤNG:" << Color::RESET << "\n"
              << "  - Nhập số nguyên:         " << Color::GREEN << "42, -17, 0, 999983" << Color::RESET << "\n"
              << "  - Nhập phân số:           " << Color::GREEN << "3/4, -22/7, 120/5" << Color::RESET << "\n"
              << "  - Nhập số thực:           " << Color::GREEN << "3.14159, -0.005, 1.5e-3" << Color::RESET << "\n"
              << "  - Nhập số phức:           " << Color::GREEN << "3 + 4i, -2.5 - 1.5j, 7i, -i" << Color::RESET << "\n"
              << "  - Nhập hằng số toán học:  " << Color::GREEN << "pi, e, phi, sqrt2, sqrt3" << Color::RESET << "\n"
              << "  - Lệnh điều khiển:        " << Color::CYAN << "help, test, clear, exit, quit" << Color::RESET << "\n\n";
}

std::string Formatter::formatReport(const ClassificationReport& r, bool useColor) {
    std::ostringstream ss;

    auto C = [&](const char* col) -> const char* { return useColor ? col : ""; };

    if (!r.isComplex) {
        ss << C(Color::RED) << "[!] " << r.primaryDescription << C(Color::RESET) << "\n";
        return ss.str();
    }

    ss << C(Color::CYAN) << "────────────────────────────────────────────────────────────────────────\n"
       << C(Color::BOLD) << " KẾT QUẢ PHÂN TÍCH SỐ HỌC: " << C(Color::GREEN) << r.parsed.rawInput
       << C(Color::RESET) << "\n"
       << C(Color::CYAN) << "────────────────────────────────────────────────────────────────────────\n"
       << C(Color::RESET);

    // Primary summary
    ss << C(Color::BOLD) << "▶ TỔNG QUAN: " << C(Color::YELLOW) << r.primaryDescription << C(Color::RESET) << "\n\n";

    // Set membership table
    ss << C(Color::BOLD) << "▶ THUỘC CÁC TẬP HỢP SỐ (MATHEMATICAL SETS):\n" << C(Color::RESET);
    auto mark = [&](bool inSet) {
        if (inSet) return useColor ? "\033[32m[✓ THUỘC]\033[0m" : "[YES]";
        return useColor ? "\033[90m[✗ KHÔNG]\033[0m" : "[NO ]";
    };

    ss << "  " << mark(r.isComplex)          << "  ℂ   (Tập số phức - Complex numbers)\n"
       << "  " << mark(r.isReal)             << "  ℝ   (Tập số thực - Real numbers)\n"
       << "  " << mark(r.isRational)         << "  ℚ   (Tập số hữu tỉ - Rational numbers)\n"
       << "  " << mark(r.isIrrational)       << "  ℝ\\ℚ (Tập số vô tỉ - Irrational numbers)\n"
       << "  " << mark(r.isInteger)          << "  ℤ   (Tập số nguyên - Integers)\n"
       << "  " << mark(r.isNatural)          << "  ℕ   (Tập số tự nhiên - Natural numbers, n ≥ 0)\n"
       << "  " << mark(r.isPositiveInteger)  << "  ℕ*  (Tập số tự nhiên dương, n > 0)\n\n";

    // Tags
    ss << C(Color::BOLD) << "▶ CÁC NHÃN ĐẶC TÍNH (CHARACTERISTIC TAGS):\n" << C(Color::RESET) << "  ";
    for (size_t i = 0; i < r.tags.size(); ++i) {
        ss << C(Color::MAGENTA) << "[" << r.tags[i] << "]" << C(Color::RESET);
        if (i + 1 < r.tags.size()) ss << " ";
    }
    ss << "\n\n";

    // Complex / Geometric details
    ss << C(Color::BOLD) << "▶ ĐẶC TÍNH PHỨC & HÌNH HỌC (COMPLEX / GEOMETRIC DETAILS):\n" << C(Color::RESET);
    ss << "  • Phần thực (Real part Re(z)):     " << r.complexAnalysis.value.real << "\n"
       << "  • Phần ảo (Imaginary part Im(z)):  " << r.complexAnalysis.value.imag << "\n"
       << "  • Modun (Magnitude |z|):           " << r.complexAnalysis.modulus << "\n"
       << "  • Argument (Arg(z)):               " << r.complexAnalysis.argumentRad << " rad ("
       << r.complexAnalysis.argumentDeg << "°)\n"
       << "  • Số liên hợp (Conjugate z̄):       " << r.complexAnalysis.conjugate.real
       << (r.complexAnalysis.conjugate.imag >= 0 ? " + " : " - ")
       << std::abs(r.complexAnalysis.conjugate.imag) << "i\n"
       << "  • Dạng lượng giác (Polar form):    " << r.complexAnalysis.polarForm << "\n";

    if (r.parsed.hasRationalVal) {
        ss << "  • Biểu diễn phân số (Fraction):    "
           << r.parsed.rationalVal.num << "/" << r.parsed.rationalVal.den << "\n";
    }

    // Integer Analysis
    if (r.integerAnalysis.has_value()) {
        const auto& ia = r.integerAnalysis.value();
        ss << "\n" << C(Color::BOLD) << "▶ ĐẶC TÍNH SỐ HỌC NGUYÊN (NUMBER-THEORETIC PROPERTIES):\n" << C(Color::RESET);
        ss << "  • Dấu & Tính chẵn lẻ:            "
           << (ia.isZero ? "Bằng 0" : (ia.isPositive ? "Số dương" : "Số âm")) << " | "
           << (ia.isEven ? "Số chẵn (Even)" : "Số lẻ (Odd)") << "\n";

        ss << "  • Nguyên tố / Hợp số:            ";
        if (ia.isPrime) {
            ss << C(Color::GREEN) << "★ SỐ NGUYÊN TỐ (Prime Number)" << C(Color::RESET);
        } else if (ia.isComposite) {
            ss << "Hợp số (Composite Number)";
        } else if (ia.isUnit) {
            ss << "Số đơn vị (Unit)";
        } else {
            ss << "Không là nguyên tố cũng không là hợp số";
        }
        ss << "\n";

        // Prime factorization
        if (!ia.primeFactors.empty()) {
            ss << "  • Phân tích thừa số nguyên tố:   ";
            for (size_t i = 0; i < ia.primeFactors.size(); ++i) {
                ss << ia.primeFactors[i].first;
                if (ia.primeFactors[i].second > 1) {
                    ss << "^" << ia.primeFactors[i].second;
                }
                if (i + 1 < ia.primeFactors.size()) ss << " × ";
            }
            ss << "\n";
        }

        // Divisors
        if (!ia.divisors.empty() && ia.divisors.size() <= 40) {
            ss << "  • Danh sách ước số (" << ia.divisors.size() << " ước):       ";
            for (size_t i = 0; i < ia.divisors.size(); ++i) {
                ss << ia.divisors[i];
                if (i + 1 < ia.divisors.size()) ss << ", ";
            }
            ss << "\n";
            ss << "  • Tổng các ước thực sự (Proper): " << ia.sumProperDivisors << "\n";
        }

        // Properties breakdown
        ss << "  • Kiểm tra lũy thừa & căn:\n";
        if (ia.isSquare) {
            ss << "    - Là SỐ CHÍNH PHƯƠNG (Perfect Square): " << ia.squareRoot << "² = " << ia.value << "\n";
        }
        if (ia.isCube) {
            ss << "    - Là SỐ LẬP PHƯƠNG (Perfect Cube): " << ia.cubeRoot << "³ = " << ia.value << "\n";
        }
        if (ia.isPowerOf2) {
            ss << "    - Là LŨY THỪA CỦA 2 (Power of 2)\n";
        }
        if (!ia.isSquare && !ia.isCube && !ia.isPowerOf2) {
            ss << "    - Không phải số chính phương hay lập phương hoàn hảo.\n";
        }

        ss << "  • Các tính chất dãy số đặc biệt:\n";
        if (ia.isFibonacci)    ss << "    - Thuộc dãy số Fibonacci.\n";
        if (ia.isPalindromic)  ss << "    - Là số đối xứng (Palindromic number).\n";
        if (ia.isArmstrong)    ss << "    - Là số Armstrong / Narcissistic number.\n";
        if (ia.isTriangular)   ss << "    - Là số tam giác thứ " << ia.triangularIndex << " (T(" << ia.triangularIndex << ") = n(n+1)/2).\n";
        if (ia.isHappy)        ss << "    - Là số hạnh phúc (Happy number).\n";
        if (ia.isAutomorphic)  ss << "    - Là số tự mãn (Automorphic number).\n";
        if (ia.isFactorial)    ss << "    - Bằng giai thừa của " << ia.factorialBase << " (" << ia.factorialBase << "! = " << ia.value << ").\n";
        if (ia.abundance == AbundanceType::Perfect) {
            ss << "    - " << C(Color::GREEN) << "★ LÀ SỐ HOÀN HẢO (Perfect Number - tổng ước thực sự bằng chính nó)!" << C(Color::RESET) << "\n";
        }
    }

    ss << C(Color::CYAN) << "────────────────────────────────────────────────────────────────────────\n" << C(Color::RESET);
    return ss.str();
}

} // namespace numsys
