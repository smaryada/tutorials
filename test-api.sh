#!/bin/bash

# Cosmos Member Service API Test Script
BASE_URL="http://localhost:8081"

echo "=== Cosmos Member Service API Test ==="
echo

# Test Health Check
echo "1. Testing Health Check..."
curl -s -X GET "$BASE_URL/health" | jq .
echo
echo "---"
echo

# Test Create Member
echo "2. Testing Create Member..."
MEMBER_RESPONSE=$(curl -s -X POST "$BASE_URL/members" \
  -H "Content-Type: application/json" \
  -d '{
    "memberId": "MEMBER001",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1-555-123-4567",
    "address": {
      "street": "123 Main Street",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    }
  }')
echo "$MEMBER_RESPONSE" | jq .
echo
echo "---"
echo

# Test Get Member
echo "3. Testing Get Member..."
curl -s -X GET "$BASE_URL/members/MEMBER001" | jq .
echo
echo "---"
echo

# Test Update Member
echo "4. Testing Update Member..."
curl -s -X PUT "$BASE_URL/members/MEMBER001" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Smith",
    "email": "john.smith@example.com",
    "phone": "+1-555-987-6543"
  }' | jq .
echo
echo "---"
echo

# Test Get Updated Member
echo "5. Testing Get Updated Member..."
curl -s -X GET "$BASE_URL/members/MEMBER001" | jq .
echo
echo "---"
echo

# Test Delete Member
echo "6. Testing Delete Member..."
curl -s -X DELETE "$BASE_URL/members/MEMBER001" | jq .
echo
echo "---"
echo

# Test Get Deleted Member (should return 404)
echo "7. Testing Get Deleted Member (should return 404)..."
curl -s -X GET "$BASE_URL/members/MEMBER001" | jq .
echo
echo "---"
echo

echo "=== Test Complete ==="
