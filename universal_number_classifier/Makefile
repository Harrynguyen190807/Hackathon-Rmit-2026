CXX = g++
CXXFLAGS = -std=c++20 -O2 -Wall -Wextra -Iinclude
SRC_COMMON = src/NumberParser.cpp src/IntegerProperties.cpp src/ComplexProperties.cpp src/NumberClassifier.cpp src/Formatter.cpp

all: bin/number_classifier bin/test_classifier

bin:
	mkdir -p bin

bin/number_classifier: bin $(SRC_COMMON) src/main.cpp
	$(CXX) $(CXXFLAGS) $(SRC_COMMON) src/main.cpp -o bin/number_classifier

bin/test_classifier: bin $(SRC_COMMON) tests/test_classifier.cpp
	$(CXX) $(CXXFLAGS) $(SRC_COMMON) tests/test_classifier.cpp -o bin/test_classifier

test: bin/test_classifier
	./bin/test_classifier

clean:
	rm -rf bin

.PHONY: all test clean
