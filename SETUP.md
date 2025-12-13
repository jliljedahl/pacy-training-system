# Quick Setup Guide

Follow these steps to get the Pacy Training System running on your machine.

## Prerequisites

- Node.js 18 or higher
- npm (comes with Node.js)
- An Anthropic API key ([get one here](https://console.anthropic.com/))

## Installation Steps

### 1. Navigate to Project Directory

```bash
cd pacy-training-system
```

### 2. Install All Dependencies

```bash
npm run install:all
```

This installs dependencies for:

- Root workspace
- Backend
- Frontend

### 3. Configure Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and add your Anthropic API key:

```
ANTHROPIC_API_KEY=your_actual_api_key_here
DATABASE_URL="file:./prisma/dev.db"
PORT=3000
NODE_ENV=development
UPLOAD_DIR=../uploads
MAX_FILE_SIZE=52428800
```

### 4. Initialize Database

```bash
# Still in backend directory
npm run prisma:generate
npm run prisma:migrate
```

This creates the SQLite database with all necessary tables.

### 5. Create Uploads Directory

```bash
# From root directory
mkdir -p uploads
```

### 6. Start the Application

```bash
# From root directory
npm run dev
```

This starts both:

- **Backend**: http://localhost:3000
- **Frontend**: http://localhost:5173

## Verify Installation

1. Open your browser to http://localhost:5173
2. You should see the Pacy Training System interface
3. Click "New Project" to create your first training program

## Test the System

### Create a Test Project

1. Click "New Project"
2. Fill in:
   - Name: "Test Program"
   - Learning Objectives: "Test the system"
   - Target Audience: "Developers"
   - Deliverables: "Articles only"
3. Click "Create Project"
4. On the project page, click "Start Program Design"
5. Watch the agents work in real-time!

## Troubleshooting

### "Cannot find module '@prisma/client'"

```bash
cd backend
npm run prisma:generate
```

### "ANTHROPIC_API_KEY is not set"

Make sure you've:

1. Created `backend/.env` from `backend/.env.example`
2. Added your actual API key
3. Restarted the backend server

### "Port 3000 already in use"

Edit `backend/.env` and change the PORT:

```
PORT=3001
```

Also update `frontend/vite.config.ts` proxy target to match.

### "Database file not found"

```bash
cd backend
npm run prisma:migrate
```

### File upload fails

Ensure uploads directory exists and has write permissions:

```bash
mkdir -p uploads
chmod 755 uploads
```

## Next Steps

Once setup is complete:

1. Read the [README.md](README.md) for full documentation
2. Create your first real training program
3. Explore the agent definitions in `.claude/agents/`
4. Customize agents or workflow as needed

## Production Deployment

For production deployment:

1. Use PostgreSQL instead of SQLite
2. Set `NODE_ENV=production`
3. Build frontend: `cd frontend && npm run build`
4. Build backend: `cd backend && npm run build`
5. Deploy backend and frontend to your hosting service
6. Set all environment variables securely

## Getting Help

- Check the main [README.md](README.md)
- Review agent definitions in `.claude/agents/`
- Consult [Claude Code docs](https://docs.claude.com/en/docs/claude-code)
- Check [Anthropic API docs](https://docs.anthropic.com)

---

You're all set! Enjoy creating HIST-based training content with AI agents.
