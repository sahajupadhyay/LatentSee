#!/bin/bash

# Smart Cloud Dashboard - Endpoint Testing Script
# Tests all three consistency models for basic functionality

echo "🚀 Smart Cloud Dashboard - Endpoint Tests"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"

# Function to test endpoint
test_endpoint() {
    local name=$1
    local endpoint=$2
    local expected_status=$3
    
    echo -e "\n${BLUE}Testing: $name${NC}"
    echo "Endpoint: $endpoint"
    
    response=$(curl -s -w "%{http_code}" -o /tmp/response.json "$endpoint" 2>/dev/null)
    status_code="${response: -3}"
    
    if [ "$status_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✅ Status: $status_code (Expected: $expected_status)${NC}"
        
        # Check for cache headers
        cache_status=$(curl -s -I "$endpoint" 2>/dev/null | grep -i "x-cache-status" | cut -d' ' -f2 | tr -d '\r')
        if [ ! -z "$cache_status" ]; then
            echo -e "${YELLOW}📊 Cache Status: $cache_status${NC}"
        fi
        
        # Check response structure
        if command -v jq &> /dev/null; then
            data_count=$(jq '.data | length' /tmp/response.json 2>/dev/null)
            if [ ! -z "$data_count" ] && [ "$data_count" -gt 0 ]; then
                echo -e "${GREEN}📦 Data Items: $data_count${NC}"
            fi
            
            request_id=$(jq -r '.metadata.requestId' /tmp/response.json 2>/dev/null)
            if [ ! -z "$request_id" ] && [ "$request_id" != "null" ]; then
                echo -e "${BLUE}🆔 Request ID: $request_id${NC}"
            fi
        fi
        
        return 0
    else
        echo -e "${RED}❌ Status: $status_code (Expected: $expected_status)${NC}"
        echo "Response:"
        cat /tmp/response.json
        return 1
    fi
}

echo -e "\n${YELLOW}Starting endpoint tests...${NC}"
echo "Make sure the development server is running: npm run dev"

# Test health endpoint first
echo -e "\n${BLUE}Testing Health Check${NC}"
health_response=$(curl -s "$BASE_URL/api/health" 2>/dev/null)
if echo "$health_response" | grep -q "ok"; then
    echo -e "${GREEN}✅ Server is running${NC}"
else
    echo -e "${RED}❌ Server not responding. Start with: npm run dev${NC}"
    exit 1
fi

# Test all endpoints
test_endpoint "Always Fresh (Strong Consistency)" "$BASE_URL/api/always-fresh" 200
test_endpoint "Check Fast (TTL Cache)" "$BASE_URL/api/check-fast" 200
test_endpoint "Smart Memory (LRU Cache)" "$BASE_URL/api/smart-memory" 200

# Test with parameters
echo -e "\n${YELLOW}Testing with query parameters...${NC}"
test_endpoint "Always Fresh with Limit" "$BASE_URL/api/always-fresh?limit=5" 200
test_endpoint "Check Fast with Category" "$BASE_URL/api/check-fast?category=compute" 200
test_endpoint "Smart Memory with Priority" "$BASE_URL/api/smart-memory?priority=high&limit=3" 200

# Test error handling
echo -e "\n${YELLOW}Testing error handling...${NC}"
test_endpoint "Invalid Parameter (Should Return 400)" "$BASE_URL/api/always-fresh?limit=invalid" 400

echo -e "\n${GREEN}🎉 All tests completed!${NC}"
echo -e "\n${BLUE}Performance Testing:${NC}"
echo "1. Run multiple requests to see cache hit rates improve"
echo "2. Monitor cache headers: X-Cache-Status, X-Cache-Hit-Rate"  
echo "3. Compare response times between cached and fresh requests"
echo -e "\n${YELLOW}Access the dashboard: $BASE_URL${NC}"

# Cleanup
rm -f /tmp/response.json