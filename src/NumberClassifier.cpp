#include "NumberClassifier.hpp"
#include <sstream>

namespace numsys {

ClassificationReport NumberClassifier::analyze(const std::string& input) {
    ClassificationReport report;
    report.parsed = NumberParser::parse(input);

    if (report.parsed.category == NumberCategory::Invalid) {
        report.isComplex = false;
        report.primaryDescription = "Khong hop le: " + report.parsed.errorMsg;
        return report;
    }

    // Complex analysis is always performed
    report.complexAnalysis = ComplexProperties::analyze(report.parsed.complexVal);
    report.isComplex = true;
    report.isPureImaginary = report.complexAnalysis.isPureImaginary;
    report.isReal = report.complexAnalysis.isReal;

    if (report.isReal) {
        if (report.parsed.category == NumberCategory::MathematicalConstant) {
            report.isRational = false;
            report.isIrrational = true;
        } else if (report.parsed.hasRationalVal || report.parsed.hasIntVal) {
            report.isRational = true;
            report.isIrrational = false;
        } else {
            // General floating point number entered as decimal: can be considered rational approximation
            report.isRational = true;
            report.isIrrational = false;
        }

        if (report.parsed.hasIntVal) {
            report.isInteger = true;
            report.isNatural = (report.parsed.intVal >= 0);
            report.isPositiveInteger = (report.parsed.intVal > 0);

            report.integerAnalysis = IntegerProperties::analyze(report.parsed.intVal);
        } else {
            report.isInteger = false;
            report.isNatural = false;
            report.isPositiveInteger = false;
        }
    } else {
        report.isRational = false;
        report.isIrrational = false;
        report.isInteger = false;
        report.isNatural = false;
        report.isPositiveInteger = false;
    }

    generateTags(report);
    generatePrimaryDescription(report);

    return report;
}

void NumberClassifier::generateTags(ClassificationReport& r) {
    r.tags.clear();

    if (!r.isComplex) {
        r.tags.push_back("Khong hop le");
        return;
    }

    r.tags.push_back("Số phức (ℂ)");

    if (r.isPureImaginary) {
        r.tags.push_back("Số thuần ảo (Purely Imaginary)");
    }

    if (r.isReal) {
        r.tags.push_back("Số thực (ℝ)");

        if (r.isRational) {
            r.tags.push_back("Số hữu tỉ (ℚ)");
        } else if (r.isIrrational) {
            r.tags.push_back("Số vô tỉ (ℝ \\ ℚ)");
        }

        if (r.isInteger && r.integerAnalysis.has_value()) {
            const auto& ia = r.integerAnalysis.value();
            r.tags.push_back("Số nguyên (ℤ)");

            if (r.isNatural) {
                r.tags.push_back("Số tự nhiên (ℕ)");
            }
            if (r.isPositiveInteger) {
                r.tags.push_back("Số tự nhiên dương (ℕ*)");
            }

            if (ia.isZero) {
                r.tags.push_back("Số không (Zero)");
            } else {
                r.tags.push_back(ia.isPositive ? "Số dương (Positive)" : "Số âm (Negative)");
            }

            r.tags.push_back(ia.isEven ? "Số chẵn (Even)" : "Số lẻ (Odd)");

            if (ia.isPrime) r.tags.push_back("Số nguyên tố (Prime)");
            if (ia.isComposite) r.tags.push_back("Hợp số (Composite)");
            if (ia.isUnit) r.tags.push_back("Đơn vị (Unit)");

            if (ia.isSquare) r.tags.push_back("Số chính phương (Square)");
            if (ia.isCube) r.tags.push_back("Số lập phương (Cube)");
            if (ia.isPowerOf2) r.tags.push_back("Lũy thừa của 2 (Power of 2)");

            if (ia.isFibonacci) r.tags.push_back("Số Fibonacci");
            if (ia.isPalindromic) r.tags.push_back("Số đối xứng (Palindrome)");
            if (ia.isArmstrong) r.tags.push_back("Số Armstrong (Narcissistic)");
            if (ia.isTriangular) r.tags.push_back("Số tam giác (Triangular)");
            if (ia.isHappy) r.tags.push_back("Số hạnh phúc (Happy Number)");
            if (ia.isAutomorphic) r.tags.push_back("Số tự mãn (Automorphic)");
            if (ia.isFactorial) r.tags.push_back("Giai thừa (Factorial)");

            if (ia.abundance == AbundanceType::Perfect) r.tags.push_back("Số hoàn hảo (Perfect Number)");
            else if (ia.abundance == AbundanceType::Abundant) r.tags.push_back("Số dư thừa (Abundant Number)");
            else if (ia.abundance == AbundanceType::Deficient) r.tags.push_back("Số thiếu hụt (Deficient Number)");
        }
    }
}

void NumberClassifier::generatePrimaryDescription(ClassificationReport& r) {
    if (!r.isComplex) {
        r.primaryDescription = "Dau vao khong hop le.";
        return;
    }

    std::ostringstream oss;
    if (r.isPureImaginary) {
        oss << "Đây là một SỐ THUẦN ẢO thuộc tập số phức (ℂ) với phần thực bằng 0 và phần ảo = "
            << r.complexAnalysis.value.imag << ".";
    } else if (!r.isReal) {
        oss << "Đây là một SỐ PHỨC (ℂ) có cả phần thực (" << r.complexAnalysis.value.real
            << ") và phần ảo (" << r.complexAnalysis.value.imag << "i).";
    } else {
        // Real
        if (r.isInteger && r.integerAnalysis.has_value()) {
            const auto& ia = r.integerAnalysis.value();
            oss << "Đây là một SỐ NGUYÊN (ℤ) ";
            if (ia.isZero) {
                oss << "[Số 0], vừa chẵn, thuộc tập số tự nhiên ℕ.";
            } else {
                oss << (ia.isPositive ? "dương " : "âm ")
                    << (ia.isEven ? "chẵn " : "lẻ ");
                if (ia.isPrime) oss << "và là SỐ NGUYÊN TỐ.";
                else if (ia.isComposite) oss << "và là HỢP SỐ.";
                else oss << ".";
            }
        } else if (r.parsed.category == NumberCategory::Rational) {
            oss << "Đây là một SỐ HỮU TỈ (ℚ) biểu diễn dưới dạng phân số "
                << r.parsed.rationalVal.num << "/" << r.parsed.rationalVal.den
                << " ≈ " << r.parsed.realVal << ".";
        } else if (r.parsed.category == NumberCategory::MathematicalConstant) {
            oss << "Đây là một HẰNG SỐ TOÁN HỌC VÔ TỈ: " << r.parsed.constantName
                << " ≈ " << r.parsed.realVal << ".";
        } else {
            oss << "Đây là một SỐ THỰC (ℝ) với giá trị thập phân ≈ " << r.parsed.realVal << ".";
        }
    }
    r.primaryDescription = oss.str();
}

} // namespace numsys
