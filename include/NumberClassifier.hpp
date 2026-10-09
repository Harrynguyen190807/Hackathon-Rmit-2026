#pragma once

#include "Common.hpp"
#include "NumberParser.hpp"
#include "IntegerProperties.hpp"
#include "ComplexProperties.hpp"
#include <string>
#include <vector>
#include <optional>

namespace numsys {

struct ClassificationReport {
    ParsedNumber parsed;

    // Set membership
    bool isComplex{true};          // Always in C
    bool isReal{false};            // In R
    bool isRational{false};        // In Q
    bool isIrrational{false};      // In R \ Q
    bool isInteger{false};         // In Z
    bool isNatural{false};         // In N (>= 0)
    bool isPositiveInteger{false}; // In N* (> 0)
    bool isPureImaginary{false};

    // Sub-analyses
    ComplexAnalysis complexAnalysis;
    std::optional<IntegerAnalysis> integerAnalysis;

    // High-level summary labels
    std::vector<std::string> tags;
    std::string primaryDescription;
};

class NumberClassifier {
public:
    static ClassificationReport analyze(const std::string& input);

private:
    static void generateTags(ClassificationReport& report);
    static void generatePrimaryDescription(ClassificationReport& report);
};

} // namespace numsys
