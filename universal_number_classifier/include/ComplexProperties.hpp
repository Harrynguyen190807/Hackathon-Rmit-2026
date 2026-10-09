#pragma once

#include "Common.hpp"
#include <string>

namespace numsys {

struct ComplexAnalysis {
    ComplexNumber value{0.0, 0.0};
    double modulus{0.0};
    double argumentRad{0.0};
    double argumentDeg{0.0};
    ComplexNumber conjugate{0.0, 0.0};
    bool isPureImaginary{false};
    bool isReal{false};
    bool isZero{false};
    std::string polarForm;
    std::string exponentialForm;
};

class ComplexProperties {
public:
    static ComplexAnalysis analyze(const ComplexNumber& c);
    static double modulus(const ComplexNumber& c);
    static double argumentRadians(const ComplexNumber& c);
    static double argumentDegrees(const ComplexNumber& c);
    static ComplexNumber conjugate(const ComplexNumber& c);
    static std::string toPolarString(const ComplexNumber& c);
    static std::string toExponentialString(const ComplexNumber& c);
};

} // namespace numsys
