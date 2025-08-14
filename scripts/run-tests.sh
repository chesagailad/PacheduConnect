#!/bin/bash

# PacheduConnect Comprehensive Test Runner
# Senior Automation Engineer Implementation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# Function to print colored output
print_status() {
    echo -e "${BLUE}[TEST RUNNER]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to run tests and capture results
run_test_suite() {
    local suite_name="$1"
    local test_command="$2"
    local test_dir="$3"
    
    print_status "Running $suite_name tests..."
    
    if [ -d "$test_dir" ]; then
        cd "$test_dir"
        
        # Run tests and capture exit code
        if eval "$test_command"; then
            print_success "$suite_name tests passed"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            print_error "$suite_name tests failed"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
        
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
        cd - > /dev/null
    else
        print_warning "$suite_name test directory not found: $test_dir"
        SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
    fi
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18 or higher is required"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    if [ -f "package.json" ]; then
        npm install
    fi
    
    # Install backend dependencies
    if [ -d "backend" ]; then
        cd backend
        npm install
        cd ..
    fi
    
    # Install frontend dependencies
    if [ -d "frontend" ]; then
        cd frontend
        npm install
        cd ..
    fi
    
    print_success "Dependencies installed"
}

# Function to setup test environment
setup_test_environment() {
    print_status "Setting up test environment..."
    
    # Create test database
    if [ -d "backend" ]; then
        cd backend
        
        # Check if test database exists
        if [ ! -f ".env.test" ]; then
            print_warning "Creating test environment file..."
            cp .env.example .env.test
            # Update test environment variables
            sed -i 's/DATABASE_URL=.*/DATABASE_URL=postgresql:\/\/test:test@localhost:5432\/pachedu_test/' .env.test
            sed -i 's/NODE_ENV=.*/NODE_ENV=test/' .env.test
        fi
        
        cd ..
    fi
    
    # Create test fixtures directory
    mkdir -p backend/tests/fixtures
    
    print_success "Test environment setup complete"
}

# Function to run backend tests
run_backend_tests() {
    print_status "Running backend tests..."
    
    if [ -d "backend" ]; then
        cd backend
        
        # Run unit tests
        print_status "Running backend unit tests..."
        if npm test -- --testPathPattern="unit" --coverage; then
            print_success "Backend unit tests passed"
        else
            print_error "Backend unit tests failed"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
        
        # Run integration tests
        print_status "Running backend integration tests..."
        if npm test -- --testPathPattern="integration" --coverage; then
            print_success "Backend integration tests passed"
        else
            print_error "Backend integration tests failed"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
        
        cd ..
    else
        print_warning "Backend directory not found"
        SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
    fi
}

# Function to run frontend tests
run_frontend_tests() {
    print_status "Running frontend tests..."
    
    if [ -d "frontend" ]; then
        cd frontend
        
        # Run component tests
        print_status "Running frontend component tests..."
        if npm test -- --testPathPattern="components" --coverage; then
            print_success "Frontend component tests passed"
        else
            print_error "Frontend component tests failed"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
        
        # Run page tests
        print_status "Running frontend page tests..."
        if npm test -- --testPathPattern="pages" --coverage; then
            print_success "Frontend page tests passed"
        else
            print_error "Frontend page tests failed"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
        
        cd ..
    else
        print_warning "Frontend directory not found"
        SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
    fi
}

# Function to run E2E tests
run_e2e_tests() {
    print_status "Running E2E tests..."
    
    if [ -d "e2e" ]; then
        cd e2e
        
        # Run Playwright tests
        print_status "Running Playwright E2E tests..."
        if npm test; then
            print_success "E2E tests passed"
        else
            print_error "E2E tests failed"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
        
        cd ..
    else
        print_warning "E2E directory not found"
        SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
    fi
}

# Function to generate coverage report
generate_coverage_report() {
    print_status "Generating coverage report..."
    
    # Create coverage directory
    mkdir -p coverage
    
    # Combine coverage reports
    if [ -d "backend/coverage" ] && [ -d "frontend/coverage" ]; then
        # Merge coverage reports
        npx istanbul-combine -d coverage -r lcov -r html backend/coverage/lcov.info frontend/coverage/lcov.info
        
        print_success "Coverage report generated: coverage/index.html"
    else
        print_warning "Coverage reports not found"
    fi
}

# Function to run specific test categories
run_specific_tests() {
    local category="$1"
    
    case $category in
        "auth")
            print_status "Running authentication tests..."
            run_test_suite "Authentication" "npm test -- --testNamePattern='auth'" "backend"
            ;;
        "kyc")
            print_status "Running KYC tests..."
            run_test_suite "KYC" "npm test -- --testNamePattern='kyc'" "backend"
            ;;
        "transactions")
            print_status "Running transaction tests..."
            run_test_suite "Transactions" "npm test -- --testNamePattern='transactions'" "backend"
            ;;
        "chatbot")
            print_status "Running chatbot tests..."
            run_test_suite "Chatbot" "npm test -- --testNamePattern='chatbot'" "backend"
            ;;
        "frontend")
            print_status "Running frontend tests..."
            run_test_suite "Frontend" "npm test" "frontend"
            ;;
        "e2e")
            print_status "Running E2E tests..."
            run_test_suite "E2E" "npm test" "e2e"
            ;;
        *)
            print_error "Unknown test category: $category"
            print_status "Available categories: auth, kyc, transactions, chatbot, frontend, e2e"
            exit 1
            ;;
    esac
}

# Function to display test summary
display_summary() {
    echo ""
    echo "=========================================="
    echo "           TEST EXECUTION SUMMARY"
    echo "=========================================="
    echo ""
    echo "Total Test Suites: $TOTAL_TESTS"
    echo "Passed: $PASSED_TESTS"
    echo "Failed: $FAILED_TESTS"
    echo "Skipped: $SKIPPED_TESTS"
    echo ""
    
    if [ $FAILED_TESTS -eq 0 ]; then
        print_success "All tests passed! 🎉"
        exit 0
    else
        print_error "Some tests failed! ❌"
        exit 1
    fi
}

# Function to display help
show_help() {
    echo "PacheduConnect Test Runner"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -c, --category CATEGORY Run specific test category"
    echo "  -s, --setup             Setup test environment only"
    echo "  -i, --install           Install dependencies only"
    echo "  -b, --backend           Run backend tests only"
    echo "  -f, --frontend          Run frontend tests only"
    echo "  -e, --e2e               Run E2E tests only"
    echo "  -a, --all               Run all tests (default)"
    echo ""
    echo "Test Categories:"
    echo "  auth         Authentication tests"
    echo "  kyc          KYC system tests"
    echo "  transactions Money transfer tests"
    echo "  chatbot      Chatbot system tests"
    echo "  frontend     Frontend component tests"
    echo "  e2e          End-to-end tests"
    echo ""
    echo "Examples:"
    echo "  $0                    # Run all tests"
    echo "  $0 -c auth           # Run authentication tests only"
    echo "  $0 -b                # Run backend tests only"
    echo "  $0 -s                # Setup test environment only"
}

# Main execution
main() {
    local category=""
    local setup_only=false
    local install_only=false
    local backend_only=false
    local frontend_only=false
    local e2e_only=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -c|--category)
                category="$2"
                shift 2
                ;;
            -s|--setup)
                setup_only=true
                shift
                ;;
            -i|--install)
                install_only=true
                shift
                ;;
            -b|--backend)
                backend_only=true
                shift
                ;;
            -f|--frontend)
                frontend_only=true
                shift
                ;;
            -e|--e2e)
                e2e_only=true
                shift
                ;;
            -a|--all)
                shift
                ;;
            *)
                print_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    print_status "Starting PacheduConnect test execution..."
    
    # Check prerequisites
    check_prerequisites
    
    # Install dependencies
    install_dependencies
    
    if [ "$install_only" = true ]; then
        print_success "Dependencies installed successfully"
        exit 0
    fi
    
    # Setup test environment
    setup_test_environment
    
    if [ "$setup_only" = true ]; then
        print_success "Test environment setup complete"
        exit 0
    fi
    
    # Run specific category if specified
    if [ -n "$category" ]; then
        run_specific_tests "$category"
    elif [ "$backend_only" = true ]; then
        run_backend_tests
    elif [ "$frontend_only" = true ]; then
        run_frontend_tests
    elif [ "$e2e_only" = true ]; then
        run_e2e_tests
    else
        # Run all tests
        run_backend_tests
        run_frontend_tests
        run_e2e_tests
    fi
    
    # Generate coverage report
    generate_coverage_report
    
    # Display summary
    display_summary
}

# Execute main function
main "$@" 