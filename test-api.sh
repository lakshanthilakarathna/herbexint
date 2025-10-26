#!/bin/bash

# HERB Backend API Test Script
# Tests all API endpoints for the EC2-deployed HERB system

set -e  # Exit on any error

# Configuration
API_BASE_URL="http://ec2-13-41-78-113.eu-west-2.compute.amazonaws.com/api"
TEST_TIMEOUT=10
VERBOSE=false
CLEANUP=true

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
TEST_RESULTS=()

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Test function
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_status="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    log_info "Running: $test_name"
    
    if [ "$VERBOSE" = true ]; then
        echo "Command: $test_command"
    fi
    
    # Run the test command and capture output
    local start_time=$(date +%s)
    local response
    local status_code
    local end_time
    
    if response=$(eval "$test_command" 2>&1); then
        status_code=200
    else
        status_code=$?
    fi
    
    end_time=$(date +%s)
    local duration=$(((end_time - start_time) * 1000))
    
    # Check if test passed
    if [ "$status_code" = "$expected_status" ]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        log_success "$test_name (${duration}ms)"
        TEST_RESULTS+=("PASS:$test_name:$duration")
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        log_error "$test_name (${duration}ms) - Expected: $expected_status, Got: $status_code"
        TEST_RESULTS+=("FAIL:$test_name:$duration:$response")
    fi
    
    if [ "$VERBOSE" = true ] && [ -n "$response" ]; then
        echo "Response: $response"
    fi
    
    echo ""
}

# Cleanup function
cleanup() {
    if [ "$CLEANUP" = true ]; then
        log_info "Cleaning up test data..."
        
        # Delete test products
        curl -s -X DELETE "$API_BASE_URL/products" -H "Content-Type: application/json" \
            -d '{"filter": "test"}' > /dev/null 2>&1 || true
        
        # Delete test customers
        curl -s -X DELETE "$API_BASE_URL/customers" -H "Content-Type: application/json" \
            -d '{"filter": "test"}' > /dev/null 2>&1 || true
        
        # Delete test orders
        curl -s -X DELETE "$API_BASE_URL/orders" -H "Content-Type: application/json" \
            -d '{"filter": "test"}' > /dev/null 2>&1 || true
        
        # Delete test users
        curl -s -X DELETE "$API_BASE_URL/users" -H "Content-Type: application/json" \
            -d '{"filter": "test"}' > /dev/null 2>&1 || true
        
        log_info "Cleanup completed"
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -u|--url)
            API_BASE_URL="$2"
            shift 2
            ;;
        --no-cleanup)
            CLEANUP=false
            shift
            ;;
        -h|--help)
            echo "HERB Backend API Test Script"
            echo ""
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -v, --verbose     Enable verbose output"
            echo "  -u, --url URL     Set API base URL (default: $API_BASE_URL)"
            echo "  --no-cleanup      Skip cleanup of test data"
            echo "  -h, --help        Show this help message"
            echo ""
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use -h or --help for usage information"
            exit 1
            ;;
    esac
done

# Set up cleanup trap
trap cleanup EXIT

# Header
echo "🧪 HERB Backend API Test Suite"
echo "================================"
echo "API URL: $API_BASE_URL"
echo "Timeout: ${TEST_TIMEOUT}s"
echo "Cleanup: $CLEANUP"
echo ""

# Test 1: Health Check
run_test "Health Endpoint" \
    "curl -s -w '%{http_code}' -o /dev/null --max-time $TEST_TIMEOUT '$API_BASE_URL/health'" \
    200

# Test 2: API Base URL
run_test "API Base URL" \
    "curl -s -w '%{http_code}' -o /dev/null --max-time $TEST_TIMEOUT '$API_BASE_URL/products'" \
    200

# Test 3: CORS Configuration
run_test "CORS Configuration" \
    "curl -s -w '%{http_code}' -o /dev/null --max-time $TEST_TIMEOUT -X OPTIONS '$API_BASE_URL/health' -H 'Origin: http://localhost:3000'" \
    200

# Test 4: Products CRUD
log_info "Testing Products CRUD operations..."

# Create product
PRODUCT_DATA='{
    "product_name": "Test Whiskey",
    "brand_name": "Test Brand",
    "category": "liquor",
    "retail_price": 2500,
    "stock_quantity": 100,
    "description": "Test product for API testing"
}'

PRODUCT_ID=$(curl -s -X POST "$API_BASE_URL/products" \
    -H "Content-Type: application/json" \
    -d "$PRODUCT_DATA" \
    --max-time $TEST_TIMEOUT | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -n "$PRODUCT_ID" ]; then
    run_test "Create Product" "echo 'Product created with ID: $PRODUCT_ID'" 200
    
    # Read product
    run_test "Read Product" \
        "curl -s -w '%{http_code}' -o /dev/null --max-time $TEST_TIMEOUT '$API_BASE_URL/products/$PRODUCT_ID'" \
        200
    
    # Update product
    run_test "Update Product" \
        "curl -s -w '%{http_code}' -o /dev/null --max-time $TEST_TIMEOUT -X PUT '$API_BASE_URL/products/$PRODUCT_ID' -H 'Content-Type: application/json' -d '{\"retail_price\": 3000}'" \
        200
    
    # Delete product
    run_test "Delete Product" \
        "curl -s -w '%{http_code}' -o /dev/null --max-time $TEST_TIMEOUT -X DELETE '$API_BASE_URL/products/$PRODUCT_ID'" \
        200
else
    log_error "Failed to create test product"
    FAILED_TESTS=$((FAILED_TESTS + 4))
    TOTAL_TESTS=$((TOTAL_TESTS + 4))
fi

# Test 5: Customers CRUD
log_info "Testing Customers CRUD operations..."

CUSTOMER_DATA='{
    "name": "Test Bar & Grill",
    "type": "bar",
    "email": "test@bar.com",
    "phone": "011-1234567",
    "address": "123 Test Street, Colombo"
}'

CUSTOMER_ID=$(curl -s -X POST "$API_BASE_URL/customers" \
    -H "Content-Type: application/json" \
    -d "$CUSTOMER_DATA" \
    --max-time $TEST_TIMEOUT | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -n "$CUSTOMER_ID" ]; then
    run_test "Create Customer" "echo 'Customer created with ID: $CUSTOMER_ID'" 200
    
    # Read customer
    run_test "Read Customer" \
        "curl -s -w '%{http_code}' -o /dev/null --max-time $TEST_TIMEOUT '$API_BASE_URL/customers/$CUSTOMER_ID'" \
        200
    
    # Update customer
    run_test "Update Customer" \
        "curl -s -w '%{http_code}' -o /dev/null --max-time $TEST_TIMEOUT -X PUT '$API_BASE_URL/customers/$CUSTOMER_ID' -H 'Content-Type: application/json' -d '{\"name\": \"Updated Test Bar\"}'" \
        200
    
    # Delete customer
    run_test "Delete Customer" \
        "curl -s -w '%{http_code}' -o /dev/null --max-time $TEST_TIMEOUT -X DELETE '$API_BASE_URL/customers/$CUSTOMER_ID'" \
        200
else
    log_error "Failed to create test customer"
    FAILED_TESTS=$((FAILED_TESTS + 4))
    TOTAL_TESTS=$((TOTAL_TESTS + 4))
fi

# Test 6: Orders CRUD
log_info "Testing Orders CRUD operations..."

ORDER_DATA='{
    "customer_id": "test-customer",
    "customer_name": "Test Customer",
    "items": [
        {
            "product_id": "test-product",
            "product_name": "Test Product",
            "quantity": 2,
            "price": 1000
        }
    ],
    "total_amount": 2000,
    "status": "pending",
    "notes": "Test order for API testing"
}'

ORDER_ID=$(curl -s -X POST "$API_BASE_URL/orders" \
    -H "Content-Type: application/json" \
    -d "$ORDER_DATA" \
    --max-time $TEST_TIMEOUT | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -n "$ORDER_ID" ]; then
    run_test "Create Order" "echo 'Order created with ID: $ORDER_ID'" 200
    
    # Read order
    run_test "Read Order" \
        "curl -s -w '%{http_code}' -o /dev/null --max-time $TEST_TIMEOUT '$API_BASE_URL/orders/$ORDER_ID'" \
        200
    
    # Update order
    run_test "Update Order" \
        "curl -s -w '%{http_code}' -o /dev/null --max-time $TEST_TIMEOUT -X PUT '$API_BASE_URL/orders/$ORDER_ID' -H 'Content-Type: application/json' -d '{\"status\": \"completed\"}'" \
        200
    
    # Delete order
    run_test "Delete Order" \
        "curl -s -w '%{http_code}' -o /dev/null --max-time $TEST_TIMEOUT -X DELETE '$API_BASE_URL/orders/$ORDER_ID'" \
        200
else
    log_error "Failed to create test order"
    FAILED_TESTS=$((FAILED_TESTS + 4))
    TOTAL_TESTS=$((TOTAL_TESTS + 4))
fi

# Test 7: Users CRUD
log_info "Testing Users CRUD operations..."

USER_DATA='{
    "name": "Test User",
    "email": "testuser@herb.com",
    "username": "testuser",
    "role_id": "sales-rep-role-id"
}'

USER_ID=$(curl -s -X POST "$API_BASE_URL/users" \
    -H "Content-Type: application/json" \
    -d "$USER_DATA" \
    --max-time $TEST_TIMEOUT | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -n "$USER_ID" ]; then
    run_test "Create User" "echo 'User created with ID: $USER_ID'" 200
    
    # Read user
    run_test "Read User" \
        "curl -s -w '%{http_code}' -o /dev/null --max-time $TEST_TIMEOUT '$API_BASE_URL/users/$USER_ID'" \
        200
    
    # Update user
    run_test "Update User" \
        "curl -s -w '%{http_code}' -o /dev/null --max-time $TEST_TIMEOUT -X PUT '$API_BASE_URL/users/$USER_ID' -H 'Content-Type: application/json' -d '{\"name\": \"Updated Test User\"}'" \
        200
    
    # Delete user
    run_test "Delete User" \
        "curl -s -w '%{http_code}' -o /dev/null --max-time $TEST_TIMEOUT -X DELETE '$API_BASE_URL/users/$USER_ID'" \
        200
else
    log_error "Failed to create test user"
    FAILED_TESTS=$((FAILED_TESTS + 4))
    TOTAL_TESTS=$((TOTAL_TESTS + 4))
fi

# Test 8: System Logs CRUD
log_info "Testing System Logs CRUD operations..."

LOG_DATA='{
    "action": "test_action",
    "user_id": "test-user",
    "details": "Test log entry for API testing",
    "ip_address": "127.0.0.1"
}'

LOG_ID=$(curl -s -X POST "$API_BASE_URL/system-logs" \
    -H "Content-Type: application/json" \
    -d "$LOG_DATA" \
    --max-time $TEST_TIMEOUT | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -n "$LOG_ID" ]; then
    run_test "Create System Log" "echo 'Log created with ID: $LOG_ID'" 200
    
    # Read log
    run_test "Read System Log" \
        "curl -s -w '%{http_code}' -o /dev/null --max-time $TEST_TIMEOUT '$API_BASE_URL/system-logs/$LOG_ID'" \
        200
    
    # Update log
    run_test "Update System Log" \
        "curl -s -w '%{http_code}' -o /dev/null --max-time $TEST_TIMEOUT -X PUT '$API_BASE_URL/system-logs/$LOG_ID' -H 'Content-Type: application/json' -d '{\"details\": \"Updated test log entry\"}'" \
        200
    
    # Delete log
    run_test "Delete System Log" \
        "curl -s -w '%{http_code}' -o /dev/null --max-time $TEST_TIMEOUT -X DELETE '$API_BASE_URL/system-logs/$LOG_ID'" \
        200
else
    log_error "Failed to create test log"
    FAILED_TESTS=$((FAILED_TESTS + 4))
    TOTAL_TESTS=$((TOTAL_TESTS + 4))
fi

# Test 9: Error Handling
run_test "404 Error Handling" \
    "curl -s -w '%{http_code}' -o /dev/null --max-time $TEST_TIMEOUT '$API_BASE_URL/nonexistent'" \
    404

# Test 10: Performance Test
log_info "Testing API performance..."

PERF_START=$(date +%s)
curl -s "$API_BASE_URL/health" > /dev/null
PERF_END=$(date +%s)
PERF_DURATION=$(((PERF_END - PERF_START) * 1000))

if [ $PERF_DURATION -lt 500 ]; then
    run_test "Performance Test" "echo 'Response time: ${PERF_DURATION}ms'" 200
else
    log_warning "Performance test failed - Response time: ${PERF_DURATION}ms (expected < 500ms)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
fi

# Test 11: Concurrent Requests
log_info "Testing concurrent requests..."

CONCURRENT_START=$(date +%s)
for i in {1..5}; do
    curl -s "$API_BASE_URL/health" > /dev/null &
done
wait
CONCURRENT_END=$(date +%s)
CONCURRENT_DURATION=$(((CONCURRENT_END - CONCURRENT_START) * 1000))

if [ $CONCURRENT_DURATION -lt 2000 ]; then
    run_test "Concurrent Requests" "echo '5 concurrent requests completed in ${CONCURRENT_DURATION}ms'" 200
else
    log_warning "Concurrent requests test failed - Duration: ${CONCURRENT_DURATION}ms (expected < 2000ms)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
fi

# Summary
echo ""
echo "📊 Test Summary"
echo "==============="
echo "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed. Check the output above for details.${NC}"
    exit 1
fi
