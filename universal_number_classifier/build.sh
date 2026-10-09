#!/usr/bin/env bash
set -e

echo "=== Biến dịch Universal Number Classifier & Analyzer (C++20) ==="

mkdir -p bin

CXX="g++"
CXXFLAGS="-std=c++20 -O2 -Wall -Wextra -Iinclude"
COMMON_SRCS="src/NumberParser.cpp src/IntegerProperties.cpp src/ComplexProperties.cpp src/NumberClassifier.cpp src/Formatter.cpp"

echo "[1/2] Biên dịch CLI chính (bin/number_classifier)..."
$CXX $CXXFLAGS $COMMON_SRCS src/main.cpp -o bin/number_classifier

echo "[2/2] Biên dịch Unit Tests (bin/test_classifier)..."
$CXX $CXXFLAGS $COMMON_SRCS tests/test_classifier.cpp -o bin/test_classifier

echo "=== Biên dịch thành công! ==="
echo "Chạy thử unit test: ./bin/test_classifier"
echo "Chạy chương trình:  ./bin/number_classifier"
