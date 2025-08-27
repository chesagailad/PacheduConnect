#!/bin/bash

# Test Runner Script
# Runs tests with proper setup and teardown

set -e

echo "🧪 Running Backend Tests..."

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to run tests with retry
run_tests_with_retry() {
    local test_pattern="$1"
    local max_retries=3
    local retry_count=0
    
    while [ $retry_count -lt $max_retries ]; do
        echo -e "${YELLOW}Running tests: $test_pattern (attempt $((retry_count + 1))/$max_retries)${NC}"
        
        if npm test -- --testPathPattern="$test_pattern" --verbose --silent; then
            echo -e "${GREEN}✅ Tests passed: $test_pattern${NC}"
            return 0
        else
            retry_count=$((retry_count + 1))
            if [ $retry_count -lt $max_retries ]; then
                echo -e "${YELLOW}⚠️  Tests failed, retrying...${NC}"
                sleep 2
            fi
        fi
    done
    
    echo -e "${RED}❌ Tests failed after $max_retries attempts: $test_pattern${NC}"
    return 1
}

# Run tests in order of priority
echo "1. Running security tests..."
run_tests_with_retry "securityBasic"

echo "2. Running model tests..."
run_tests_with_retry "User.test.js"

echo "3. Running unit tests..."
run_tests_with_retry "unit"

echo "4. Running integration tests..."
run_tests_with_retry "integration"

echo "5. Running all tests..."
npm test -- --verbose

echo -e "${GREEN}🎉 All tests completed!${NC}"
