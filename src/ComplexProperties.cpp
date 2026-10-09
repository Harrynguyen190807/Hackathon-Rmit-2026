#include "ComplexProperties.hpp"
#include <iomanip>
#include <sstream>
#include <cmath>

namespace numsys {

double ComplexProperties::modulus(const ComplexNumber& c) {
    return std::hypot(c.real, c.imag);
}

double ComplexProperties::argumentRadians(const ComplexNumber& c) {
    if (c.isZero()) return 0.0;
    return std::atan2(c.imag, c.real);
}

double ComplexProperties::argumentDegrees(const ComplexNumber& c) {
    return argumentRadians(c) * (180.0 / PI);
}

ComplexNumber ComplexProperties::conjugate(const ComplexNumber& c) {
    return ComplexNumber(c.real, -c.imag);
}

std::string ComplexProperties::toPolarString(const ComplexNumber& c) {
    double r = modulus(c);
    double thetaRad = argumentRadians(c);
    double thetaDeg = argumentDegrees(c);

    std::ostringstream oss;
    oss << std::fixed << std::setprecision(4)
        << r << " * (cos(" << thetaRad << " rad) + i*sin(" << thetaRad << " rad)) "
        << "[or " << r << " ∠ " << thetaDeg << "°]";
    return oss.str();
}

std::string ComplexProperties::toExponentialString(const ComplexNumber& c) {
    double r = modulus(c);
    double thetaRad = argumentRadians(c);

    std::ostringstream oss;
    oss << std::fixed << std::setprecision(4)
        << r << " * e^(i * " << thetaRad << " rad)";
    return oss.str();
}

ComplexAnalysis ComplexProperties::analyze(const ComplexNumber& c) {
    ComplexAnalysis ca;
    ca.value = c;
    ca.modulus = modulus(c);
    ca.argumentRad = argumentRadians(c);
    ca.argumentDeg = argumentDegrees(c);
    ca.conjugate = conjugate(c);
    ca.isPureImaginary = c.isPureImaginary();
    ca.isReal = c.isReal();
    ca.isZero = c.isZero();
    ca.polarForm = toPolarString(c);
    ca.exponentialForm = toExponentialString(c);
    return ca;
}

} // namespace numsys
