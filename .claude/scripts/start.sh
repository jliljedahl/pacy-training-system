#!/bin/bash
# Start development servers with process cleanup
# This prevents multiple parallel instances from running

echo "🧹 Cleaning up old processes..."
pkill -f "ts-node src/index.ts" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 2

echo "✅ Ready to start fresh"
echo "🚀 Starting development servers..."
npm run dev
