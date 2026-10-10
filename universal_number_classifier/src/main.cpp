#include "NumberClassifier.hpp"
#include "Formatter.hpp"
#include <iostream>
#include <string>
#include <vector>

void runQuickTest() {
    std::cout << "\n>>> RUNNING DEMO TEST SUITE:\n\n";
    std::vector<std::string> testCases = {
        "997",          // Prime
        "28",           // Perfect number
        "153",          // Armstrong
        "55",           // Fibonacci
        "3/4",          // Rational fraction
        "-22/7",        // Rational fraction
        "3.14159",      // Real decimal
        "pi",           // Mathematical constant
        "3 + 4i",       // Complex
        "-5i",          // Pure imaginary
        "144",          // Perfect square & Fibonacci
        "-17",          // Negative odd integer
        "0"             // Zero
    };

    for (const auto& tc : testCases) {
        auto report = numsys::NumberClassifier::analyze(tc);
        std::cout << numsys::Formatter::formatReport(report, true) << "\n";
    }
}

int main(int argc, char* argv[]) {
    // Single argument mode
    if (argc > 1) {
        std::string arg = argv[1];
        if (arg == "--help" || arg == "-h") {
            numsys::Formatter::printBanner();
            numsys::Formatter::printHelp();
            return 0;
        }
        if (arg == "--test" || arg == "-t") {
            numsys::Formatter::printBanner();
            runQuickTest();
            return 0;
        }

        // Combine all remaining arguments in case input had unquoted spaces (e.g. 3 + 4i)
        std::string fullInput;
        for (int i = 1; i < argc; ++i) {
            if (i > 1) fullInput += " ";
            fullInput += argv[i];
        }

        auto report = numsys::NumberClassifier::analyze(fullInput);
        std::cout << numsys::Formatter::formatReport(report, true);
        return 0;
    }

    // Interactive REPL Mode
    numsys::Formatter::printBanner();
    numsys::Formatter::printHelp();

    std::string line;
    while (true) {
        std::cout << "\033[1;36mnum-detect > \033[0m";
        if (!std::getline(std::cin, line)) {
            std::cout << "\nGoodbye!\n";
            break;
        }

        // Trim whitespace
        auto start = line.find_first_not_of(" \t\n\r");
        if (start == std::string::npos) continue;
        auto end = line.find_last_not_of(" \t\n\r");
        std::string cmd = line.substr(start, end - start + 1);

        if (cmd == "exit" || cmd == "quit" || cmd == "q") {
            std::cout << "Goodbye!\n";
            break;
        }
        if (cmd == "help" || cmd == "h") {
            numsys::Formatter::printHelp();
            continue;
        }
        if (cmd == "test") {
            runQuickTest();
            continue;
        }
        if (cmd == "clear" || cmd == "cls") {
            std::cout << "\033[2J\033[1;1H";
            numsys::Formatter::printBanner();
            continue;
        }

        auto report = numsys::NumberClassifier::analyze(cmd);
        std::cout << numsys::Formatter::formatReport(report, true) << "\n";
    }

    return 0;
}
