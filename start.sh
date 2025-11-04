#!/bin/bash

echo "🚀 Starting Pacy Training System..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must be run from project root directory"
    exit 1
fi

# Start backend
echo "📦 Starting backend server..."
cd backend
npm run dev > /tmp/pacy-backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Wait a bit for backend to start
sleep 2

# Start frontend
echo "🎨 Starting frontend server..."
cd ../frontend
npm run dev > /tmp/pacy-frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

echo ""
echo "✅ Pacy Training System started!"
echo ""
echo "   Backend:  http://localhost:3000"
echo "   Frontend: http://localhost:5173"
echo ""
echo "   Backend logs:  tail -f /tmp/pacy-backend.log"
echo "   Frontend logs: tail -f /tmp/pacy-frontend.log"
echo ""
echo "To stop servers:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
