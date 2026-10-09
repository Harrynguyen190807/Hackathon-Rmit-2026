#include "IntegerProperties.hpp"
#include <cmath>
#include <algorithm>
#include <unordered_set>
#include <string>

namespace numsys {

bool IntegerProperties::isEven(int64_t n) {
    return (n % 2) == 0;
}

bool IntegerProperties::isOdd(int64_t n) {
    return (n % 2) != 0;
}

bool IntegerProperties::isPrime(int64_t n) {
    if (n <= 1) return false;
    if (n <= 3) return true;
    if (n % 2 == 0 || n % 3 == 0) return false;

    for (int64_t i = 5; i * i <= n; i += 6) {
        if (n % i == 0 || n % (i + 2) == 0) return false;
    }
    return true;
}

bool IntegerProperties::isComposite(int64_t n) {
    return n > 1 && !isPrime(n);
}

std::vector<std::pair<int64_t, int>> IntegerProperties::primeFactorization(int64_t n) {
    std::vector<std::pair<int64_t, int>> factors;
    if (n == 0 || n == 1 || n == -1) return factors;

    int64_t temp = std::abs(n);

    // Count factors of 2
    if (temp % 2 == 0) {
        int count = 0;
        while (temp % 2 == 0) {
            count++;
            temp /= 2;
        }
        factors.emplace_back(2, count);
    }

    // Odd factors
    for (int64_t d = 3; d * d <= temp; d += 2) {
        if (temp % d == 0) {
            int count = 0;
            while (temp % d == 0) {
                count++;
                temp /= d;
            }
            factors.emplace_back(d, count);
        }
    }

    if (temp > 1) {
        factors.emplace_back(temp, 1);
    }

    return factors;
}

std::vector<int64_t> IntegerProperties::getDivisors(int64_t n) {
    std::vector<int64_t> divs;
    if (n == 0) return divs;

    int64_t temp = std::abs(n);
    for (int64_t i = 1; i * i <= temp; ++i) {
        if (temp % i == 0) {
            divs.push_back(i);
            if (i * i != temp) {
                divs.push_back(temp / i);
            }
        }
    }
    std::sort(divs.begin(), divs.end());
    return divs;
}

int64_t IntegerProperties::sumOfProperDivisors(int64_t n) {
    if (n == 0 || n == 1 || n == -1) return 0;
    auto divs = getDivisors(n);
    int64_t sum = 0;
    int64_t absVal = std::abs(n);
    for (int64_t d : divs) {
        if (d < absVal) sum += d;
    }
    return sum;
}

AbundanceType IntegerProperties::getAbundance(int64_t n) {
    if (n <= 1) return AbundanceType::Deficient;
    int64_t sum = sumOfProperDivisors(n);
    if (sum == n) return AbundanceType::Perfect;
    if (sum < n) return AbundanceType::Deficient;
    return AbundanceType::Abundant;
}

bool IntegerProperties::isPerfectSquare(int64_t n, int64_t& root) {
    if (n < 0) return false;
    root = static_cast<int64_t>(std::round(std::sqrt(static_cast<double>(n))));
    return root * root == n;
}

bool IntegerProperties::isPerfectCube(int64_t n, int64_t& root) {
    root = static_cast<int64_t>(std::round(std::cbrt(static_cast<double>(n))));
    return root * root * root == n;
}

bool IntegerProperties::isFibonacci(int64_t n) {
    if (n < 0) return false;
    int64_t dummy = 0;
    // n is Fibonacci iff 5*n^2 + 4 or 5*n^2 - 4 is a perfect square
    // Watch for overflow for very large numbers
    if (n > 1000000000LL) {
        // Fallback iteration
        int64_t a = 0, b = 1;
        while (b < n) {
            int64_t next = a + b;
            a = b;
            b = next;
        }
        return (n == 0 || b == n);
    }
    int64_t t1 = 5 * n * n + 4;
    int64_t t2 = 5 * n * n - 4;
    return isPerfectSquare(t1, dummy) || isPerfectSquare(t2, dummy);
}

bool IntegerProperties::isPalindromic(int64_t n) {
    std::string s = std::to_string(std::abs(n));
    std::string rev = s;
    std::reverse(rev.begin(), rev.end());
    return s == rev;
}

bool IntegerProperties::isArmstrong(int64_t n) {
    if (n < 0) return false;
    std::string s = std::to_string(n);
    int numDigits = static_cast<int>(s.length());
    int64_t sum = 0;
    for (char c : s) {
        int digit = c - '0';
        int64_t p = 1;
        for (int i = 0; i < numDigits; ++i) p *= digit;
        sum += p;
    }
    return sum == n;
}

bool IntegerProperties::isTriangular(int64_t n, int64_t& k) {
    if (n < 0) return false;
    // 8n + 1 must be a perfect square
    int64_t m = 0;
    if (isPerfectSquare(8 * n + 1, m)) {
        if ((m - 1) % 2 == 0) {
            k = (m - 1) / 2;
            return true;
        }
    }
    return false;
}

bool IntegerProperties::isPowerOfTwo(int64_t n) {
    return n > 0 && (n & (n - 1)) == 0;
}

bool IntegerProperties::isHappyNumber(int64_t n) {
    if (n <= 0) return false;
    std::unordered_set<int64_t> seen;
    int64_t curr = n;
    while (curr != 1 && seen.find(curr) == seen.end()) {
        seen.insert(curr);
        int64_t next = 0;
        int64_t temp = curr;
        while (temp > 0) {
            int64_t digit = temp % 10;
            next += digit * digit;
            temp /= 10;
        }
        curr = next;
    }
    return curr == 1;
}

bool IntegerProperties::isAutomorphic(int64_t n) {
    if (n < 0) return false;
    if (n > 10000000) return false; // Prevent overflow
    int64_t sq = n * n;
    std::string sN = std::to_string(n);
    std::string sSq = std::to_string(sq);
    if (sSq.size() < sN.size()) return false;
    return sSq.substr(sSq.size() - sN.size()) == sN;
}

bool IntegerProperties::isFactorial(int64_t n, int64_t& k) {
    if (n <= 0) return false;
    int64_t prod = 1;
    k = 1;
    while (prod < n) {
        k++;
        prod *= k;
    }
    return prod == n;
}

IntegerAnalysis IntegerProperties::analyze(int64_t n) {
    IntegerAnalysis a;
    a.value = n;
    a.isPositive = (n > 0);
    a.isNegative = (n < 0);
    a.isZero = (n == 0);
    a.isEven = isEven(n);
    a.isOdd = isOdd(n);

    a.isUnit = (n == 1 || n == -1);
    a.isPrime = isPrime(n);
    a.isComposite = isComposite(n);
    a.primeFactors = primeFactorization(n);
    a.divisors = getDivisors(n);
    a.sumProperDivisors = sumOfProperDivisors(n);
    a.abundance = getAbundance(n);

    a.isSquare = isPerfectSquare(n, a.squareRoot);
    a.isCube = isPerfectCube(n, a.cubeRoot);
    a.isPowerOf2 = isPowerOfTwo(n);

    a.isFibonacci = isFibonacci(n);
    a.isPalindromic = isPalindromic(n);
    a.isArmstrong = isArmstrong(n);
    a.isTriangular = isTriangular(n, a.triangularIndex);
    a.isHappy = isHappyNumber(n);
    a.isAutomorphic = isAutomorphic(n);
    a.isFactorial = isFactorial(n, a.factorialBase);

    return a;
}

} // namespace numsys
