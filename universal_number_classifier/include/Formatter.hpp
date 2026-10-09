#pragma once

#include "NumberClassifier.hpp"
#include <string>

namespace numsys {

class Formatter {
public:
    static std::string formatReport(const ClassificationReport& report, bool useColor = true);
    static void printBanner();
    static void printHelp();
};

} // namespace numsys
