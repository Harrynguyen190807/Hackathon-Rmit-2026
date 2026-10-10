#include "NumberClassifier.hpp"
#include <iostream>
#include <cassert>
#include <cmath>

void testPrimes() {
    std::cout << "[Test] Checking prime numbers... ";
    assert(numsys::IntegerProperties::isPrime(2) == true);
    assert(numsys::IntegerProperties::isPrime(3) == true);
    assert(numsys::IntegerProperties::isPrime(5) == true);
    assert(numsys::IntegerProperties::isPrime(997) == true);
    assert(numsys::IntegerProperties::isPrime(1) == false);
    assert(numsys::IntegerProperties::isPrime(0) == false);
    assert(numsys::IntegerProperties::isPrime(-7) == false);
    assert(numsys::IntegerProperties::isPrime(100) == false);
    std::cout << "PASSED\n";
}

void testSpecialNumbers() {
    std::cout << "[Test] Checking special numbers (Perfect, Fibonacci, Armstrong)... ";
    // Perfect numbers
    assert(numsys::IntegerProperties::getAbundance(6) == numsys::AbundanceType::Perfect);
    assert(numsys::IntegerProperties::getAbundance(28) == numsys::AbundanceType::Perfect);
    assert(numsys::IntegerProperties::getAbundance(496) == numsys::AbundanceType::Perfect);
    assert(numsys::IntegerProperties::getAbundance(12) == numsys::AbundanceType::Abundant);

    // Fibonacci
    assert(numsys::IntegerProperties::isFibonacci(0) == true);
    assert(numsys::IntegerProperties::isFibonacci(1) == true);
    assert(numsys::IntegerProperties::isFibonacci(13) == true);
    assert(numsys::IntegerProperties::isFibonacci(55) == true);
    assert(numsys::IntegerProperties::isFibonacci(144) == true);
    assert(numsys::IntegerProperties::isFibonacci(4) == false);
    assert(numsys::IntegerProperties::isFibonacci(7) == false);

    // Armstrong
    assert(numsys::IntegerProperties::isArmstrong(153) == true);
    assert(numsys::IntegerProperties::isArmstrong(370) == true);
    assert(numsys::IntegerProperties::isArmstrong(371) == true);
    assert(numsys::IntegerProperties::isArmstrong(407) == true);
    assert(numsys::IntegerProperties::isArmstrong(154) == false);

    std::cout << "PASSED\n";
}

void testFractionsAndRationals() {
    std::cout << "[Test] Checking fractions and rational numbers... ";
    auto r1 = numsys::NumberClassifier::analyze("3/4");
    assert(r1.isReal == true);
    assert(r1.isRational == true);
    assert(r1.isInteger == false);
    assert(std::abs(r1.parsed.realVal - 0.75) < 1e-6);

    auto r2 = numsys::NumberClassifier::analyze("10/2");
    assert(r2.isInteger == true);
    assert(r2.parsed.intVal == 5);
    assert(r2.integerAnalysis->isPrime == true);

    std::cout << "PASSED\n";
}

void testComplexNumbers() {
    std::cout << "[Test] Checking complex & pure imaginary numbers... ";
    auto c1 = numsys::NumberClassifier::analyze("3+4i");
    assert(c1.isComplex == true);
    assert(c1.isReal == false);
    assert(c1.isPureImaginary == false);
    assert(std::abs(c1.complexAnalysis.modulus - 5.0) < 1e-6);

    auto c2 = numsys::NumberClassifier::analyze("-7i");
    assert(c2.isComplex == true);
    assert(c2.isReal == false);
    assert(c2.isPureImaginary == true);

    auto c3 = numsys::NumberClassifier::analyze("12");
    assert(c3.isComplex == true);
    assert(c3.isReal == true);
    assert(c3.isInteger == true);

    std::cout << "PASSED\n";
}

void testConstants() {
    std::cout << "[Test] Checking irrational mathematical constants (pi, e, sqrt2)... ";
    auto piRep = numsys::NumberClassifier::analyze("pi");
    assert(piRep.isReal == true);
    assert(piRep.isIrrational == true);
    assert(std::abs(piRep.parsed.realVal - 3.14159265) < 1e-5);

    auto sqrtRep = numsys::NumberClassifier::analyze("sqrt(2)");
    assert(sqrtRep.isReal == true);
    assert(sqrtRep.isIrrational == true);
    assert(std::abs(sqrtRep.parsed.realVal - 1.41421356) < 1e-5);

    std::cout << "PASSED\n";
}

int main() {
    std::cout << "=== RUNNING NUMBER CLASSIFIER UNIT TESTS ===\n\n";
    testPrimes();
    testSpecialNumbers();
    testFractionsAndRationals();
    testComplexNumbers();
    testConstants();
    std::cout << "\n>>> ALL UNIT TESTS COMPLETED SUCCESSFULLY (100% PASSED)!\n";
    return 0;
}
