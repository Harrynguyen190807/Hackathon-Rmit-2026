#include "NumberClassifier.hpp"
#include <sstream>

namespace numsys {

ClassificationReport NumberClassifier::analyze(const std::string& input) {
    ClassificationReport report;
    report.parsed = NumberParser::parse(input);

    if (report.parsed.category == NumberCategory::Invalid) {
        report.isComplex = false;
        report.primaryDescription = "Invalid input: " + report.parsed.errorMsg;
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
        r.tags.push_back("Invalid");
        return;
    }

    r.tags.push_back("Complex Number (ℂ)");

    if (r.isPureImaginary) {
        r.tags.push_back("Pure Imaginary Number");
    }

    if (r.isReal) {
        r.tags.push_back("Real Number (ℝ)");

        if (r.isRational) {
            r.tags.push_back("Rational Number (ℚ)");
        } else if (r.isIrrational) {
            r.tags.push_back("Irrational Number (ℝ \\ ℚ)");
        }

        if (r.isInteger && r.integerAnalysis.has_value()) {
            const auto& ia = r.integerAnalysis.value();
            r.tags.push_back("Integer (ℤ)");

            if (r.isNatural) {
                r.tags.push_back("Natural Number (ℕ)");
            }
            if (r.isPositiveInteger) {
                r.tags.push_back("Positive Integer (ℕ*)");
            }

            if (ia.isZero) {
                r.tags.push_back("Zero");
            } else {
                r.tags.push_back(ia.isPositive ? "Positive" : "Negative");
            }

            r.tags.push_back(ia.isEven ? "Even" : "Odd");

            if (ia.isPrime) r.tags.push_back("Prime Number");
            if (ia.isComposite) r.tags.push_back("Composite Number");
            if (ia.isUnit) r.tags.push_back("Unit");

            if (ia.isSquare) r.tags.push_back("Perfect Square");
            if (ia.isCube) r.tags.push_back("Perfect Cube");
            if (ia.isPowerOf2) r.tags.push_back("Power of 2");

            if (ia.isFibonacci) r.tags.push_back("Fibonacci Number");
            if (ia.isPalindromic) r.tags.push_back("Palindromic Number");
            if (ia.isArmstrong) r.tags.push_back("Armstrong Number");
            if (ia.isTriangular) r.tags.push_back("Triangular Number");
            if (ia.isHappy) r.tags.push_back("Happy Number");
            if (ia.isAutomorphic) r.tags.push_back("Automorphic Number");
            if (ia.isFactorial) r.tags.push_back("Factorial");

            if (ia.abundance == AbundanceType::Perfect) r.tags.push_back("Perfect Number");
            else if (ia.abundance == AbundanceType::Abundant) r.tags.push_back("Abundant Number");
            else if (ia.abundance == AbundanceType::Deficient) r.tags.push_back("Deficient Number");
        }
    }
}

void NumberClassifier::generatePrimaryDescription(ClassificationReport& r) {
    if (!r.isComplex) {
        r.primaryDescription = "Invalid input.";
        return;
    }

    std::ostringstream oss;
    if (r.isPureImaginary) {
        oss << "This is a PURE IMAGINARY number in the complex set (ℂ) with real part 0 and imaginary part = "
            << r.complexAnalysis.value.imag << "i.";
    } else if (!r.isReal) {
        oss << "This is a COMPLEX NUMBER (ℂ) with real part (" << r.complexAnalysis.value.real
            << ") and imaginary part (" << r.complexAnalysis.value.imag << "i).";
    } else {
        // Real
        if (r.isInteger && r.integerAnalysis.has_value()) {
            const auto& ia = r.integerAnalysis.value();
            oss << "This is an INTEGER (ℤ) ";
            if (ia.isZero) {
                oss << "[Zero], even, belonging to the natural numbers ℕ.";
            } else {
                oss << (ia.isPositive ? "positive " : "negative ")
                    << (ia.isEven ? "even " : "odd ");
                if (ia.isPrime) oss << "and a PRIME NUMBER.";
                else if (ia.isComposite) oss << "and a COMPOSITE NUMBER.";
                else oss << ".";
            }
        } else if (r.parsed.category == NumberCategory::Rational) {
            oss << "This is a RATIONAL NUMBER (ℚ) represented as fraction "
                << r.parsed.rationalVal.num << "/" << r.parsed.rationalVal.den
                << " ≈ " << r.parsed.realVal << ".";
        } else if (r.parsed.category == NumberCategory::MathematicalConstant) {
            oss << "This is an IRRATIONAL MATHEMATICAL CONSTANT: " << r.parsed.constantName
                << " ≈ " << r.parsed.realVal << ".";
        } else {
            oss << "This is a REAL NUMBER (ℝ) with decimal value ≈ " << r.parsed.realVal << ".";
        }
    }
    r.primaryDescription = oss.str();
}

} // namespace numsys
