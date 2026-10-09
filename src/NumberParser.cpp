#include "NumberParser.hpp"
#include <algorithm>
#include <cctype>
#include <sstream>
#include <regex>
#include <cmath>

namespace numsys {

std::string NumberParser::trim(const std::string& s) {
    auto start = s.find_first_not_of(" \t\n\r");
    if (start == std::string::npos) return "";
    auto end = s.find_last_not_of(" \t\n\r");
    return s.substr(start, end - start + 1);
}

std::string NumberParser::toLower(const std::string& s) {
    std::string res = s;
    std::transform(res.begin(), res.end(), res.begin(), [](unsigned char c) {
        return static_cast<char>(std::tolower(c));
    });
    return res;
}

bool NumberParser::parseConstant(const std::string& s, ParsedNumber& result) {
    std::string lower = toLower(s);
    lower.erase(std::remove_if(lower.begin(), lower.end(), ::isspace), lower.end());

    if (lower == "pi" || lower == "π") {
        result.category = NumberCategory::MathematicalConstant;
        result.constantName = "pi (Archimedes' constant π)";
        result.realVal = PI;
        result.complexVal = ComplexNumber(PI, 0.0);
        return true;
    }
    if (lower == "e") {
        result.category = NumberCategory::MathematicalConstant;
        result.constantName = "e (Euler's number)";
        result.realVal = E;
        result.complexVal = ComplexNumber(E, 0.0);
        return true;
    }
    if (lower == "phi" || lower == "ϕ" || lower == "φ") {
        result.category = NumberCategory::MathematicalConstant;
        result.constantName = "phi (Golden ratio φ)";
        result.realVal = PHI;
        result.complexVal = ComplexNumber(PHI, 0.0);
        return true;
    }
    if (lower == "sqrt2" || lower == "sqrt(2)") {
        result.category = NumberCategory::MathematicalConstant;
        result.constantName = "sqrt(2) (Pythagoras' constant)";
        result.realVal = SQRT2;
        result.complexVal = ComplexNumber(SQRT2, 0.0);
        return true;
    }
    if (lower == "sqrt3" || lower == "sqrt(3)") {
        result.category = NumberCategory::MathematicalConstant;
        result.constantName = "sqrt(3) (Theodorus' constant)";
        result.realVal = SQRT3;
        result.complexVal = ComplexNumber(SQRT3, 0.0);
        return true;
    }
    return false;
}

bool NumberParser::parseRational(const std::string& s, ParsedNumber& result) {
    if (s.find('i') != std::string::npos || s.find('I') != std::string::npos ||
        s.find('j') != std::string::npos || s.find('J') != std::string::npos) {
        return false;
    }

    auto slashPos = s.find('/');
    if (slashPos == std::string::npos) return false;

    std::string numPart = trim(s.substr(0, slashPos));
    std::string denPart = trim(s.substr(slashPos + 1));

    if (numPart.empty() || denPart.empty()) return false;

    try {
        size_t idx1 = 0, idx2 = 0;
        int64_t num = std::stoll(numPart, &idx1);
        int64_t den = std::stoll(denPart, &idx2);

        if (idx1 != numPart.size() || idx2 != denPart.size()) {
            return false;
        }

        if (den == 0) {
            result.category = NumberCategory::Invalid;
            result.errorMsg = "Loi: Mau so khong the bang 0 (Division by zero)";
            return true;
        }

        result.category = NumberCategory::Rational;
        result.rationalVal = RationalNumber(num, den);
        result.hasRationalVal = true;
        result.realVal = result.rationalVal.toDouble();
        result.complexVal = ComplexNumber(result.realVal, 0.0);

        if (result.rationalVal.isInteger()) {
            result.intVal = result.rationalVal.num;
            result.hasIntVal = true;
        }

        return true;
    } catch (...) {
        return false;
    }
}

bool NumberParser::parseComplex(const std::string& s, ParsedNumber& result) {
    std::string clean = s;
    clean.erase(std::remove_if(clean.begin(), clean.end(), ::isspace), clean.end());

    if (clean.empty()) return false;

    char lastChar = static_cast<char>(std::tolower(clean.back()));
    if (lastChar != 'i' && lastChar != 'j') {
        return false;
    }

    std::string withoutUnit = clean.substr(0, clean.size() - 1);

    // Case 1: Pure imaginary (e.g., "i", "+i", "-i", "5i", "-3.2i")
    if (withoutUnit.empty() || withoutUnit == "+") {
        result.category = NumberCategory::PureImaginary;
        result.complexVal = ComplexNumber(0.0, 1.0);
        return true;
    }
    if (withoutUnit == "-") {
        result.category = NumberCategory::PureImaginary;
        result.complexVal = ComplexNumber(0.0, -1.0);
        return true;
    }

    // Check if it's just a single number followed by i (pure imaginary)
    try {
        size_t idx = 0;
        double imagOnly = std::stod(withoutUnit, &idx);
        if (idx == withoutUnit.size()) {
            if (std::abs(imagOnly) < EPSILON) {
                result.category = NumberCategory::Complex;
                result.complexVal = ComplexNumber(0.0, 0.0);
            } else {
                result.category = NumberCategory::PureImaginary;
                result.complexVal = ComplexNumber(0.0, imagOnly);
            }
            return true;
        }
    } catch (...) {}

    // Case 2: a + bi or a - bi
    // Find the split operator + or -
    // We scan from index 1 upwards. Be careful not to split inside scientific notation e.g. 1e-4
    size_t splitPos = std::string::npos;
    for (size_t i = 1; i < withoutUnit.size(); ++i) {
        char c = withoutUnit[i];
        if (c == '+' || c == '-') {
            char prev = withoutUnit[i - 1];
            if (prev != 'e' && prev != 'E') {
                splitPos = i;
            }
        }
    }

    if (splitPos != std::string::npos) {
        std::string realPartStr = withoutUnit.substr(0, splitPos);
        std::string imagPartStr = withoutUnit.substr(splitPos);

        try {
            size_t idxR = 0;
            double rVal = std::stod(realPartStr, &idxR);
            if (idxR != realPartStr.size()) return false;

            double iVal = 0.0;
            if (imagPartStr == "+") iVal = 1.0;
            else if (imagPartStr == "-") iVal = -1.0;
            else {
                size_t idxI = 0;
                iVal = std::stod(imagPartStr, &idxI);
                if (idxI != imagPartStr.size()) return false;
            }

            result.category = NumberCategory::Complex;
            result.complexVal = ComplexNumber(rVal, iVal);
            return true;
        } catch (...) {
            return false;
        }
    }

    return false;
}

bool NumberParser::parseReal(const std::string& s, ParsedNumber& result) {
    std::string clean = trim(s);
    if (clean.empty()) return false;

    // First check if it's a strict integer
    bool isIntCandidate = true;
    size_t startIdx = 0;
    if (clean[0] == '+' || clean[0] == '-') {
        startIdx = 1;
        if (clean.size() == 1) return false;
    }

    for (size_t i = startIdx; i < clean.size(); ++i) {
        if (!std::isdigit(static_cast<unsigned char>(clean[i]))) {
            isIntCandidate = false;
            break;
        }
    }

    if (isIntCandidate) {
        try {
            int64_t val = std::stoll(clean);
            result.category = NumberCategory::Integer;
            result.intVal = val;
            result.hasIntVal = true;
            result.realVal = static_cast<double>(val);
            result.complexVal = ComplexNumber(result.realVal, 0.0);
            result.rationalVal = RationalNumber(val, 1);
            result.hasRationalVal = true;
            return true;
        } catch (...) {}
    }

    // Try floating point parsing
    try {
        size_t idx = 0;
        double val = std::stod(clean, &idx);
        if (idx == clean.size()) {
            result.category = NumberCategory::Real;
            result.realVal = val;
            result.complexVal = ComplexNumber(val, 0.0);

            // Check if it's virtually an integer (e.g. 10.0)
            double intPart = 0.0;
            if (std::modf(val, &intPart) == 0.0 &&
                val >= static_cast<double>(INT64_MIN) &&
                val <= static_cast<double>(INT64_MAX)) {
                result.intVal = static_cast<int64_t>(val);
                result.hasIntVal = true;
                result.rationalVal = RationalNumber(result.intVal, 1);
                result.hasRationalVal = true;
            }
            return true;
        }
    } catch (...) {}

    return false;
}

ParsedNumber NumberParser::parse(const std::string& input) {
    ParsedNumber res;
    res.rawInput = input;
    std::string trimmed = trim(input);

    if (trimmed.empty()) {
        res.category = NumberCategory::Invalid;
        res.errorMsg = "Chuoi nhap vao bi rong";
        return res;
    }

    if (parseConstant(trimmed, res)) return res;
    if (parseRational(trimmed, res)) return res;
    if (parseComplex(trimmed, res)) return res;
    if (parseReal(trimmed, res)) return res;

    res.category = NumberCategory::Invalid;
    res.errorMsg = "Khong the nhan dang dinh dang so: \"" + input + "\"";
    return res;
}

} // namespace numsys
