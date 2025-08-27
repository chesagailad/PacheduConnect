#!/bin/bash

# Comprehensive Test Runner for PacheduConnect Mobile App
# Author: Gailad Chesa
# Created: 2024-01-01
# Description: Runs all tests including performance, accessibility, and optimization tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPORTS_DIR="$PROJECT_ROOT/test-reports"
COVERAGE_DIR="$PROJECT_ROOT/coverage"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create directories
mkdir -p "$REPORTS_DIR"
mkdir -p "$COVERAGE_DIR"

echo -e "${BLUE}🚀 Starting Comprehensive Test Suite for PacheduConnect Mobile App${NC}"
echo -e "${BLUE}Timestamp: $TIMESTAMP${NC}"
echo -e "${BLUE}Project Root: $PROJECT_ROOT${NC}"
echo ""

# Function to run tests and capture output
run_test_suite() {
    local suite_name="$1"
    local test_command="$2"
    local report_file="$REPORTS_DIR/${suite_name}_${TIMESTAMP}.txt"
    
    echo -e "${YELLOW}Running $suite_name tests...${NC}"
    
    if eval "$test_command" > "$report_file" 2>&1; then
        echo -e "${GREEN}✅ $suite_name tests passed${NC}"
        return 0
    else
        echo -e "${RED}❌ $suite_name tests failed${NC}"
        echo -e "${YELLOW}Check report: $report_file${NC}"
        return 1
    fi
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check dependencies
echo -e "${BLUE}📋 Checking dependencies...${NC}"
if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dependencies check passed${NC}"
echo ""

# Install dependencies if needed
echo -e "${BLUE}📦 Installing dependencies...${NC}"
cd "$PROJECT_ROOT"
npm install
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# 1. Unit Tests
echo -e "${BLUE}🧪 Running Unit Tests...${NC}"
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test_suite "unit" "npm run test"; then
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# 2. E2E Tests
echo -e "${BLUE}🔍 Running E2E Tests...${NC}"
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test_suite "e2e" "npm run test:e2e"; then
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# 3. Performance Tests
echo -e "${BLUE}⚡ Running Performance Tests...${NC}"
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test_suite "performance" "npm run test:performance"; then
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# 4. Accessibility Tests
echo -e "${BLUE}♿ Running Accessibility Tests...${NC}"
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test_suite "accessibility" "npm run test:accessibility"; then
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# 5. Optimization Tests
echo -e "${BLUE}🔧 Running Optimization Tests...${NC}"
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test_suite "optimization" "npm run test:optimization"; then
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# 6. Storage Tests
echo -e "${BLUE}💾 Running Storage Tests...${NC}"
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test_suite "storage" "npm run test:storage"; then
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# 7. Linting
echo -e "${BLUE}🔍 Running Linting...${NC}"
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test_suite "lint" "npm run lint"; then
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# 8. Type Checking
echo -e "${BLUE}📝 Running Type Checking...${NC}"
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test_suite "types" "npx tsc --noEmit"; then
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Generate comprehensive report
echo -e "${BLUE}📊 Generating Comprehensive Report...${NC}"
REPORT_FILE="$REPORTS_DIR/comprehensive_report_${TIMESTAMP}.md"

cat > "$REPORT_FILE" << EOF
# PacheduConnect Mobile App - Comprehensive Test Report

**Generated:** $(date)
**Timestamp:** $TIMESTAMP
**Project Root:** $PROJECT_ROOT

## Test Summary

- **Total Test Suites:** $TOTAL_TESTS
- **Passed:** $TESTS_PASSED
- **Failed:** $TESTS_FAILED
- **Success Rate:** $(( (TESTS_PASSED * 100) / TOTAL_TESTS ))%

## Test Results

### ✅ Passed Tests ($TESTS_PASSED)
EOF

# Add passed tests to report
if [ $TESTS_PASSED -gt 0 ]; then
    echo "- Unit Tests" >> "$REPORT_FILE"
    echo "- E2E Tests" >> "$REPORT_FILE"
    echo "- Performance Tests" >> "$REPORT_FILE"
    echo "- Accessibility Tests" >> "$REPORT_FILE"
    echo "- Optimization Tests" >> "$REPORT_FILE"
    echo "- Storage Tests" >> "$REPORT_FILE"
    echo "- Linting" >> "$REPORT_FILE"
    echo "- Type Checking" >> "$REPORT_FILE"
fi

cat >> "$REPORT_FILE" << EOF

### ❌ Failed Tests ($TESTS_FAILED)
EOF

# Add failed tests to report
if [ $TESTS_FAILED -gt 0 ]; then
    echo "- Check individual test reports for details" >> "$REPORT_FILE"
fi

cat >> "$REPORT_FILE" << EOF

## Test Coverage

Coverage reports are available in: \`$COVERAGE_DIR\`

## Individual Test Reports

Individual test reports are available in: \`$REPORTS_DIR\`

## Recommendations

EOF

# Add recommendations based on test results
if [ $TESTS_FAILED -eq 0 ]; then
    echo "- All tests passed! The application is ready for production." >> "$REPORT_FILE"
else
    echo "- Review failed test reports and fix issues before deployment." >> "$REPORT_FILE"
    echo "- Consider running tests in CI/CD pipeline for automated validation." >> "$REPORT_FILE"
fi

cat >> "$REPORT_FILE" << EOF

## Next Steps

1. Review test coverage and add tests for uncovered areas
2. Implement performance monitoring in production
3. Set up accessibility testing in CI/CD pipeline
4. Monitor bundle size and memory usage in production
5. Implement automated storage cleanup policies

---

*Report generated by PacheduConnect Mobile App Test Suite*
EOF

echo -e "${GREEN}✅ Comprehensive report generated: $REPORT_FILE${NC}"
echo ""

# Final summary
echo -e "${BLUE}📋 Test Summary${NC}"
echo -e "${BLUE}===============${NC}"
echo -e "Total Test Suites: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo -e "Success Rate: ${GREEN}$(( (TESTS_PASSED * 100) / TOTAL_TESTS ))%${NC}"
echo ""

# Exit with appropriate code
if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! The application is ready for production.${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Please review the reports and fix issues.${NC}"
    echo -e "${YELLOW}Reports available in: $REPORTS_DIR${NC}"
    exit 1
fi 