#!/bin/bash

echo "🛑 Stopping Pacy Training System..."

# Kill processes on ports
lsof -ti:3000 | xargs kill -9 2>/dev/null && echo "   ✓ Backend stopped (port 3000)"
lsof -ti:5173 | xargs kill -9 2>/dev/null && echo "   ✓ Frontend stopped (port 5173)"
lsof -ti:5174 | xargs kill -9 2>/dev/null && echo "   ✓ Frontend stopped (port 5174)"
lsof -ti:5555 | xargs kill -9 2>/dev/null && echo "   ✓ Prisma Studio stopped (port 5555)"

echo ""
echo "✅ All servers stopped!"
