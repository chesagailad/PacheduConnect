/**
 * Author: Gailad Chesa
 * Created: 2025-07-28
 * Description: start-services - Service layer for business logic operations
 */

#!/bin/bash

# PacheduConnect Service Startup Script
# This script starts all services with proper port configuration

echo "🚀 Starting PacheduConnect Services..."

# Kill any existing processes on our ports
echo "🧹 Cleaning up existing processes..."
lsof -ti:5001 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Start Redis if not running
echo "🔴 Starting Redis..."
brew services start redis

# Wait a moment for Redis to start
sleep 2

# Start backend on port 5001
echo "🔧 Starting Backend (Port 5001)..."
cd backend && PORT=5001 npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Test backend health
echo "🏥 Testing backend health..."
if curl -s http://localhost:5001/api/health > /dev/null; then
    echo "✅ Backend is healthy!"
else
    echo "❌ Backend health check failed"
    exit 1
fi

# Start frontend on port 3000
echo "🎨 Starting Frontend (Port 3000)..."
cd ../frontend && PORT=3000 npm run dev &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 5

# Test frontend
echo "🌐 Testing frontend..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend is running!"
else
    echo "❌ Frontend test failed"
    exit 1
fi

echo ""
echo "🎉 All services started successfully!"
echo ""
echo "📱 Services:"
echo "  Backend:  http://localhost:5001"
echo "  Frontend: http://localhost:3000"
echo "  Redis:    localhost:6379"
echo ""
echo "🔗 API Endpoints:"
echo "  Health:   http://localhost:5001/api/health"
echo "  Auth:     http://localhost:3000/auth"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt signal
trap 'echo ""; echo "🛑 Stopping services..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo "✅ Services stopped"; exit 0' INT

# Keep script running
wait 