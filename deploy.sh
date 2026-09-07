#!/bin/bash

# Youtogram Railway Deployment Script
# Run this after pushing to GitHub and setting up Railway project

echo "🚀 Starting Youtogram Railway Deployment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Environment Setup${NC}"
echo "1. Go to https://railway.app and login"
echo "2. Create a new project"
echo "3. Deploy from GitHub"
echo "Press Enter when Railway project is created..."
read

echo ""
echo -e "${BLUE}Step 2: Backend Service Configuration${NC}"
echo "Instructions:"
echo "1. Click 'Add Service' → 'Database' → 'MongoDB'"
echo "2. Wait for MongoDB to provision (1-2 minutes)"
echo "3. Select Backend Service"
echo "4. Go to Variables → Add:"
echo "   NODE_ENV=production"
echo "   JWT_SECRET=<long-random-secret>"
echo "5. Add MONGO_URI=${{MongoDB.MONGO_URL}}"
echo "6. Click Deploy"
echo "Press Enter when backend is deployed..."
read

echo ""
echo -e "${BLUE}Step 3: Copy Backend URL${NC}"
read -p "Enter your backend Railway domain (e.g., https://service.up.railway.app): " BACKEND_URL

echo ""
echo -e "${BLUE}Step 4: Frontend Service Configuration${NC}"
echo "Instructions:"
echo "1. Add new service from same GitHub repo"
echo "2. Set root directory to 'client'"
echo "3. Go to Variables → Add:"
echo "   NEXT_PUBLIC_API_URL=${BACKEND_URL}/api"
echo "   NEXT_PUBLIC_SOCKET_URL=${BACKEND_URL}"
echo "4. Click Deploy"
echo "Press Enter when frontend is deployed..."
read

echo ""
echo -e "${BLUE}Step 5: Update Backend FRONTEND_URL${NC}"
read -p "Enter your frontend Railway domain (e.g., https://client.up.railway.app): " FRONTEND_URL

echo "Instructions:"
echo "1. Go to Backend Service Variables"
echo "2. Set FRONTEND_URL=${FRONTEND_URL}"
echo "3. Click Redeploy"
echo "Press Enter when backend is redeployed..."
read

echo ""
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo ""
echo "Your services are live:"
echo -e "Backend API: ${BLUE}${BACKEND_URL}/api/health${NC}"
echo -e "Frontend: ${BLUE}${FRONTEND_URL}${NC}"
echo ""
echo "Next steps:"
echo "1. Visit frontend URL and test registration"
echo "2. Login and verify all features work"
echo "3. Check browser console for any errors"
echo "4. Bookmark the Railway dashboard for monitoring"
echo ""
echo -e "${GREEN}Happy coding! 🎉${NC}"
