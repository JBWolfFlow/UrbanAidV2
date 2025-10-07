#!/bin/bash

echo "🔍 UrbanAid Changes Verification"
echo "================================"

echo "1. ✅ Mobile App (Expo):"
if pgrep -f "expo start" > /dev/null; then
    echo "   📱 Expo is running! Access at: http://localhost:8081"
else
    echo "   ❌ Expo not running. Start with: cd mobile-app && npm start"
fi

echo ""
echo "2. 🔧 Filter Modal Changes:"
echo "   📂 Updated file: mobile-app/src/components/FilterModal.tsx"
echo "   📋 Categories added: Health Services, Veterans Services, USDA Services"
echo "   🎯 Where to find: Map screen → Filter icon (🔧)"

echo ""
echo "3. 📱 API Server:"
if pgrep -f "uvicorn" > /dev/null; then
    echo "   ✅ API server is running on port 8000"
else
    echo "   ❌ API server not running. Start with: cd api && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
fi

echo ""
echo "🎯 To see changes:"
echo "   1. Open http://localhost:8081"
echo "   2. Go to Map screen"  
echo "   3. Tap filter icon (🔧)"
echo "   4. See 5 organized categories!"

echo ""
echo "📋 New dropdown categories:"
echo "   🏗️  Infrastructure"
echo "   🏥 Health Services (NEW)"
echo "   🇺🇸 Veterans Services (NEW)" 
echo "   🌾 USDA Services (NEW)"
echo "   ⚕️ Essential Services" 