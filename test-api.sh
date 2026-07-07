#!/bin/bash
BASE_URL="https://addis-mesob-addis-ketema-system-production.up.railway.app/api"

echo "🧪 Testing Golden Monday APIs..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Test Health
echo -e "${YELLOW}1. Testing Health...${NC}"
curl -s $BASE_URL/health
echo ""

# 2. Test Telegram Connection
echo -e "${YELLOW}2. Testing Telegram Connection...${NC}"
curl -s $BASE_URL/telegram/test
echo ""

# 3. Login
echo -e "${YELLOW}3. Logging in...${NC}"
echo "Using: superadmin@mesob.gov.et / superadmin123"

LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@mesob.gov.et","password":"superadmin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    echo -e "${GREEN}✅ Login successful${NC}"
    echo ""
    
    # 4. Get all sessions
    echo -e "${YELLOW}4. Getting all sessions...${NC}"
    curl -s -X GET $BASE_URL/golden-monday \
      -H "Authorization: Bearer $TOKEN"
    echo ""
    
    # 5. Get rotation preview
    echo -e "${YELLOW}5. Getting rotation preview...${NC}"
    curl -s -X GET $BASE_URL/golden-monday/rotation/preview \
      -H "Authorization: Bearer $TOKEN"
    echo ""
    
    # 6. Get roster
    echo -e "${YELLOW}6. Getting roster...${NC}"
    curl -s -X GET $BASE_URL/golden-monday/roster \
      -H "Authorization: Bearer $TOKEN"
    echo ""
    
    # 7. Get live recordings
    echo -e "${YELLOW}7. Getting live recordings...${NC}"
    curl -s -X GET $BASE_URL/golden-monday/recordings/live \
      -H "Authorization: Bearer $TOKEN"
    echo ""
    
    # 8. Get suggested topics
    echo -e "${YELLOW}8. Getting suggested topics...${NC}"
    curl -s -X GET $BASE_URL/golden-monday/suggest-topics \
      -H "Authorization: Bearer $TOKEN"
    echo ""
    
    # 9. Create a session
    echo -e "${YELLOW}9. Creating a session...${NC}"
    DATE=$(date -I)
    SESSION_RESPONSE=$(curl -s -X POST $BASE_URL/golden-monday \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"title\": \"Test Golden Monday Session\",
        \"organization\": \"Addis MESOB\",
        \"speaker\": \"Test Speaker\",
        \"date\": \"$DATE\",
        \"rawNotes\": \"This is a test session for Golden Monday.\",
        \"description\": \"Testing the complete workflow.\"
      }")
    echo $SESSION_RESPONSE
    
    SESSION_ID=$(echo $SESSION_RESPONSE | grep -o '"_id":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$SESSION_ID" ] && [ "$SESSION_ID" != "null" ]; then
        echo -e "${GREEN}✅ Session created with ID: $SESSION_ID${NC}"
        echo ""
        
        # 10. Set presentation title
        echo -e "${YELLOW}10. Setting presentation title...${NC}"
        curl -s -X PUT $BASE_URL/golden-monday/$SESSION_ID/title \
          -H "Authorization: Bearer $TOKEN" \
          -H "Content-Type: application/json" \
          -d '{"title": "AI and Digital Transformation in Public Service"}'
        echo ""
        
        # 11. Post to Telegram
        echo -e "${YELLOW}11. Posting to Telegram...${NC}"
        curl -s -X POST $BASE_URL/telegram/post/$SESSION_ID \
          -H "Authorization: Bearer $TOKEN"
        echo ""
        
        # 12. Send test post
        echo -e "${YELLOW}12. Sending test Telegram post...${NC}"
        curl -s -X POST $BASE_URL/telegram/test-post \
          -H "Authorization: Bearer $TOKEN"
        echo ""
    fi
    
else
    echo -e "${RED}❌ Login failed${NC}"
fi

echo -e "${GREEN}✅ Testing complete!${NC}"
echo ""
echo -e "${BLUE}Check your Telegram channel for the test messages!${NC}"