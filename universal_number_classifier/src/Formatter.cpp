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
              << "║                   Team: Suits (Co Ro Chuong Bich)                    ║\n"
              << "╚══════════════════════════════════════════════════════════════════════╝\n"
              << Color::RESET << "\n";
}

void Formatter::printHelp() {
    std::cout << Color::YELLOW << "USAGE GUIDE:" << Color::RESET << "\n"
              << "  - Enter integer:          " << Color::GREEN << "42, -17, 0, 999983" << Color::RESET << "\n"
              << "  - Enter fraction:         " << Color::GREEN << "3/4, -22/7, 120/5" << Color::RESET << "\n"
              << "  - Enter real decimal:     " << Color::GREEN << "3.14159, -0.005, 1.5e-3" << Color::RESET << "\n"
              << "  - Enter complex number:   " << Color::GREEN << "3 + 4i, -2.5 - 1.5j, 7i, -i" << Color::RESET << "\n"
              << "  - Enter math constant:    " << Color::GREEN << "pi, e, phi, sqrt2, sqrt3" << Color::RESET << "\n"
              << "  - Commands:               " << Color::CYAN << "help, test, clear, exit, quit" << Color::RESET << "\n\n";
}

std::string Formatter::formatReport(const ClassificationReport& r, bool useColor) {
    std::ostringstream ss;

    auto C = [&](const char* col) -> const char* { return useColor ? col : ""; };

    if (!r.isComplex) {
        ss << C(Color::RED) << "[!] " << r.primaryDescription << C(Color::RESET) << "\n";
        return ss.str();
    }

    ss << C(Color::CYAN) << "────────────────────────────────────────────────────────────────────────\n"
       << C(Color::BOLD) << " NUMBER ANALYSIS REPORT: " << C(Color::GREEN) << r.parsed.rawInput
       << C(Color::RESET) << "\n"
       << C(Color::CYAN) << "────────────────────────────────────────────────────────────────────────\n"
       << C(Color::RESET);

    // Primary summary
    ss << C(Color::BOLD) << "▶ SUMMARY: " << C(Color::YELLOW) << r.primaryDescription << C(Color::RESET) << "\n\n";

    // Set membership table
    ss << C(Color::BOLD) << "▶ MATHEMATICAL SET MEMBERSHIP:\n" << C(Color::RESET);
    auto mark = [&](bool inSet) {
        if (inSet) return useColor ? "\033[32m[✓ IN SET]\033[0m" : "[YES]";
        return useColor ? "\033[90m[✗ NOT IN]\033[0m" : "[NO ]";
    };

    ss << "  " << mark(r.isComplex)          << "  ℂ   (Complex numbers)\n"
       << "  " << mark(r.isReal)             << "  ℝ   (Real numbers)\n"
       << "  " << mark(r.isRational)         << "  ℚ   (Rational numbers)\n"
       << "  " << mark(r.isIrrational)       << "  ℝ\\ℚ (Irrational numbers)\n"
       << "  " << mark(r.isInteger)          << "  ℤ   (Integers)\n"
       << "  " << mark(r.isNatural)          << "  ℕ   (Natural numbers, n ≥ 0)\n"
       << "  " << mark(r.isPositiveInteger)  << "  ℕ*  (Positive integers, n > 0)\n\n";

    // Tags
    ss << C(Color::BOLD) << "▶ CHARACTERISTIC TAGS:\n" << C(Color::RESET) << "  ";
    for (size_t i = 0; i < r.tags.size(); ++i) {
        ss << C(Color::MAGENTA) << "[" << r.tags[i] << "]" << C(Color::RESET);
        if (i + 1 < r.tags.size()) ss << " ";
    }
    ss << "\n\n";

    // Complex / Geometric details
    ss << C(Color::BOLD) << "▶ COMPLEX & GEOMETRIC PROPERTIES:\n" << C(Color::RESET);
    ss << "  • Real part Re(z):                 " << r.complexAnalysis.value.real << "\n"
       << "  • Imaginary part Im(z):            " << r.complexAnalysis.value.imag << "\n"
       << "  • Modulus / Magnitude |z|:         " << r.complexAnalysis.modulus << "\n"
       << "  • Argument Arg(z):                 " << r.complexAnalysis.argumentRad << " rad ("
       << r.complexAnalysis.argumentDeg << "°)\n"
       << "  • Complex conjugate (z̄):           " << r.complexAnalysis.conjugate.real
       << (r.complexAnalysis.conjugate.imag >= 0 ? " + " : " - ")
       << std::abs(r.complexAnalysis.conjugate.imag) << "i\n"
       << "  • Polar form:                      " << r.complexAnalysis.polarForm << "\n";

    if (r.parsed.hasRationalVal) {
        ss << "  • Rational fraction:               "
           << r.parsed.rationalVal.num << "/" << r.parsed.rationalVal.den << "\n";
    }

    // Integer Analysis
    if (r.integerAnalysis.has_value()) {
        const auto& ia = r.integerAnalysis.value();
        ss << "\n" << C(Color::BOLD) << "▶ NUMBER-THEORETIC PROPERTIES:\n" << C(Color::RESET);
        ss << "  • Sign & Parity:                 "
           << (ia.isZero ? "Zero" : (ia.isPositive ? "Positive" : "Negative")) << " | "
           << (ia.isEven ? "Even" : "Odd") << "\n";

        ss << "  • Primality:                     ";
        if (ia.isPrime) {
            ss << C(Color::GREEN) << "★ PRIME NUMBER" << C(Color::RESET);
        } else if (ia.isComposite) {
            ss << "Composite Number";
        } else if (ia.isUnit) {
            ss << "Unit";
        } else {
            ss << "Neither prime nor composite";
        }
        ss << "\n";

        // Prime factorization
        if (!ia.primeFactors.empty()) {
            ss << "  • Prime Factorization:           ";
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
            ss << "  • Divisors list (" << ia.divisors.size() << " divisors):       ";
            for (size_t i = 0; i < ia.divisors.size(); ++i) {
                ss << ia.divisors[i];
                if (i + 1 < ia.divisors.size()) ss << ", ";
            }
            ss << "\n";
            ss << "  • Sum of proper divisors:        " << ia.sumProperDivisors << "\n";
        }

        // Properties breakdown
        ss << "  • Powers & Roots check:\n";
        if (ia.isSquare) {
            ss << "    - PERFECT SQUARE: " << ia.squareRoot << "² = " << ia.value << "\n";
        }
        if (ia.isCube) {
            ss << "    - PERFECT CUBE: " << ia.cubeRoot << "³ = " << ia.value << "\n";
        }
        if (ia.isPowerOf2) {
            ss << "    - POWER OF 2\n";
        }
        if (!ia.isSquare && !ia.isCube && !ia.isPowerOf2) {
            ss << "    - Not a perfect square or perfect cube.\n";
        }

        ss << "  • Special sequence properties:\n";
        if (ia.isFibonacci)    ss << "    - Fibonacci sequence member.\n";
        if (ia.isPalindromic)  ss << "    - Palindromic number.\n";
        if (ia.isArmstrong)    ss << "    - Armstrong / Narcissistic number.\n";
        if (ia.isTriangular)   ss << "    - Triangular number T(" << ia.triangularIndex << ") = n(n+1)/2.\n";
        if (ia.isHappy)        ss << "    - Happy number.\n";
        if (ia.isAutomorphic)  ss << "    - Automorphic number.\n";
        if (ia.isFactorial)    ss << "    - Factorial of " << ia.factorialBase << " (" << ia.factorialBase << "! = " << ia.value << ").\n";
        if (ia.abundance == AbundanceType::Perfect) {
            ss << "    - " << C(Color::GREEN) << "★ PERFECT NUMBER (Sum of proper divisors equals itself)!" << C(Color::RESET) << "\n";
        }
    }

    ss << C(Color::CYAN) << "────────────────────────────────────────────────────────────────────────\n" << C(Color::RESET);
    return ss.str();
}

} // namespace numsys
