#!/bin/bash

# Script to fix the EC2 backend server
# This will be executed via GitHub Actions

echo "🔧 Fixing EC2 backend server..."

# Kill any existing Node.js processes
sudo pkill -f "node server.js" || true

# Wait a moment
sleep 2

# Navigate to the backend directory
cd /var/www/herbexint-api

# Check if the visits endpoint exists in the server.js file
if grep -q "visits" server.js; then
    echo "✅ Visits endpoint found in server.js"
else
    echo "❌ Visits endpoint NOT found in server.js"
    echo "📋 Server.js content:"
    head -20 server.js
fi

# Install dependencies
npm install

# Start the backend server in the background
nohup node server.js > /var/log/herbexint-backend.log 2>&1 &

# Wait a moment for the server to start
sleep 5

# Check if the server is running
if pgrep -f "node server.js" > /dev/null; then
    echo "✅ Backend server restarted successfully"
    echo "📊 Server status:"
    ps aux | grep "node server.js" | grep -v grep
    echo "🌐 Testing API endpoints..."
    curl -s http://localhost:3001/api/products | head -1
    curl -s http://localhost:3001/api/visits | head -1
else
    echo "❌ Failed to restart backend server"
    echo "📋 Checking logs:"
    tail -20 /var/log/herbexint-backend.log
    exit 1
fi

echo "🎉 Backend server fix completed!"
