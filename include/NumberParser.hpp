#pragma once

#include "Common.hpp"
#include <string>
#include <optional>

namespace numsys {

enum class NumberCategory {
    Integer,
    Rational,
    Real,
    Complex,
    PureImaginary,
    MathematicalConstant,
    Invalid
};

struct ParsedNumber {
    std::string rawInput;
    NumberCategory category{NumberCategory::Invalid};
    ComplexNumber complexVal{0.0, 0.0};
    RationalNumber rationalVal{0, 1};
    double realVal{0.0};
    int64_t intVal{0};
    bool hasIntVal{false};
    bool hasRationalVal{false};
    std::string constantName;
    std::string errorMsg;
};

class NumberParser {
public:
    static ParsedNumber parse(const std::string& input);

private:
    static std::string trim(const std::string& s);
    static std::string toLower(const std::string& s);
    static bool parseConstant(const std::string& s, ParsedNumber& result);
    static bool parseRational(const std::string& s, ParsedNumber& result);
    static bool parseComplex(const std::string& s, ParsedNumber& result);
    static bool parseReal(const std::string& s, ParsedNumber& result);
};

} // namespace numsys
