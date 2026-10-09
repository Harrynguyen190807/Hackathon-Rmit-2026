#pragma once

#include <cstdint>
#include <vector>
#include <utility>
#include <string>

namespace numsys {

enum class AbundanceType {
    Perfect,
    Deficient,
    Abundant
};

struct IntegerAnalysis {
    int64_t value{0};
    bool isPositive{false};
    bool isNegative{false};
    bool isZero{false};
    bool isEven{false};
    bool isOdd{false};

    // Primality & Factors
    bool isPrime{false};
    bool isComposite{false};
    bool isUnit{false}; // 1 or -1
    std::vector<std::pair<int64_t, int>> primeFactors;
    std::vector<int64_t> divisors;
    int64_t sumProperDivisors{0};
    AbundanceType abundance{AbundanceType::Deficient};

    // Powers & Roots
    bool isSquare{false};
    int64_t squareRoot{0};
    bool isCube{false};
    int64_t cubeRoot{0};
    bool isPowerOf2{false};

    // Special Sequences & Patterns
    bool isFibonacci{false};
    bool isPalindromic{false};
    bool isArmstrong{false};
    bool isTriangular{false};
    int64_t triangularIndex{0};
    bool isHappy{false};
    bool isAutomorphic{false};
    bool isFactorial{false};
    int64_t factorialBase{0};
};

class IntegerProperties {
public:
    static IntegerAnalysis analyze(int64_t n);

    static bool isEven(int64_t n);
    static bool isOdd(int64_t n);
    static bool isPrime(int64_t n);
    static bool isComposite(int64_t n);
    static std::vector<std::pair<int64_t, int>> primeFactorization(int64_t n);
    static std::vector<int64_t> getDivisors(int64_t n);
    static int64_t sumOfProperDivisors(int64_t n);
    static AbundanceType getAbundance(int64_t n);
    static bool isPerfectSquare(int64_t n, int64_t& root);
    static bool isPerfectCube(int64_t n, int64_t& root);
    static bool isFibonacci(int64_t n);
    static bool isPalindromic(int64_t n);
    static bool isArmstrong(int64_t n);
    static bool isTriangular(int64_t n, int64_t& k);
    static bool isPowerOfTwo(int64_t n);
    static bool isHappyNumber(int64_t n);
    static bool isAutomorphic(int64_t n);
    static bool isFactorial(int64_t n, int64_t& k);
};

} // namespace numsys
