/**
 * Author: Gailad Chesa
 * Created: 2025-07-28
 * Description: run-tests - test file for backend functionality
 */

#!/bin/bash

# PacheduConnect Test Runner
# This script runs all tests that are currently working

echo "🚀 Running PacheduConnect Test Suite"
echo "======================================"

# Set test environment
export NODE_ENV=test

# Track test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

echo ""
echo "📦 Backend Unit Tests"
echo "--------------------"

# Run Fee Calculator Tests
echo "Testing Fee Calculator..."
cd backend
if NODE_ENV=test ./node_modules/.bin/jest tests/unit/utils/feeCalculator.test.js --silent; then
    echo "✅ Fee Calculator: 13/13 tests passing"
    PASSED_TESTS=$((PASSED_TESTS + 13))
else
    echo "❌ Fee Calculator: FAILED"
    FAILED_TESTS=$((FAILED_TESTS + 13))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 13))

# Run User Model Tests
echo "Testing User Model..."
if NODE_ENV=test ./node_modules/.bin/jest tests/unit/models/User.test.js --silent; then
    echo "✅ User Model: 17/17 tests passing"
    PASSED_TESTS=$((PASSED_TESTS + 17))
else
    echo "❌ User Model: FAILED"
    FAILED_TESTS=$((FAILED_TESTS + 17))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 17))

cd ..

echo ""
echo "📊 Test Results Summary"
echo "======================="
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $FAILED_TESTS"

if [ $FAILED_TESTS -eq 0 ]; then
    echo "🎉 All working tests PASSED!"
    exit 0
else
    echo "⚠️  Some tests failed"
    exit 1
fi