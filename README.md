# Pacy Training System

A complete AI-powered training content creation system built with real Claude sub-agents. Creates HIST-compliant training programs with articles, videos, and quizzes.

## Features

- **11 Specialized AI Agents**: Content Architect, Article Writer, HIST Compliance Editor, Fact Checker, and more
- **Web-based UI**: Create and manage training projects through a clean React interface
- **Real-time Progress**: Watch agents work in real-time with Server-Sent Events
- **Multi-format Content**: Generate articles (800-1200 words), video scripts (~250 words), and quizzes
- **Source Material Support**: Upload materials for strict fidelity or contextual guidance
- **HIST Methodology**: High Intensity Skill Training principles built-in
- **Quality Gates**: Approval workflows for program matrix and first article

## Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite with Prisma ORM
- **AI**: Anthropic Claude via Claude Code sub-agents
- **Real-time**: Server-Sent Events (SSE) for progress updates

## Project Structure

```
pacy-training-system/
├── .claude/
│   └── agents/           # 11 AI agent definitions
├── backend/
│   ├── src/
│   │   ├── api/          # Express routes
│   │   ├── services/     # Business logic
│   │   │   ├── workflowEngine.ts           # Original workflow
│   │   │   ├── workflowEngineOptimized.ts  # Optimized (default)
│   │   │   └── agentOrchestrator.ts        # Agent management
│   │   └── db/           # Database client
│   └── prisma/
│       └── schema.prisma # Database schema
└── frontend/
    └── src/
        ├── pages/        # React pages
        └── services/     # API client
```

## Setup

### Prerequisites

- Node.js 18+
- Anthropic API key

### Installation

1. Clone the repository
2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```
3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```
4. Create backend/.env:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   DATABASE_URL="file:./prisma/dev.db"
   UPLOAD_DIR="../uploads"
   PORT=3000
   ```
5. Initialize database:
   ```bash
   cd backend
   npx prisma migrate dev --name init
   ```

### Running

Start backend (from backend folder):
```bash
npm run dev
```

Start frontend (from frontend folder):
```bash
npm run dev
```

Access UI at: http://localhost:5173

## Usage

1. **Create Project**: Fill in learning objectives, target audience, deliverables
2. **Upload Materials** (optional): Add source materials for context
3. **Generate Program Matrix**: Click "Start Program Design" - AI creates complete structure
4. **Approve Matrix**: Review and approve the program structure
5. **Create Articles**: Generate articles for each session
6. **Export**: Download complete program as markdown

## AI Agents

### Core Agents
- **Content Architect**: Main coordinator, creates program structure
- **Article Writer**: Creates HIST-compliant 800-1200 word articles
- **HIST Compliance Editor**: Enforces HIST principles and quality
- **Fact Checker**: Verifies accuracy with veto power

### Supporting Agents
- Research Director
- Source Analyst
- Topic Expert
- Instructional Designer
- Video Narrator
- Assessment Designer
- Image Curator

## Optimizations

The system uses an optimized workflow that:
- Reduces agent calls by 60-70%
- Uses conditional agent invocation (only when needed)
- Handles rate limits with automatic retry (exponential backoff)
- Completes program design in 2-4 minutes (vs 8-12 minutes)
- Saves ~$8-10 per 12-session program in API costs

See [OPTIMIZATIONS.md](OPTIMIZATIONS.md) for details.

## Database Schema

- **Project**: Main training project
- **ProgramMatrix**: Approved program structure
- **Chapter**: Thematic groupings
- **Session**: Individual learning sessions
- **Article**: Generated content (800-1200 words)
- **VideoScript**: Video narration (~250 words)
- **Quiz**: Assessment questions
- **WorkflowStep**: Agent execution history

## Development

### Key Files

- `backend/src/services/workflowEngineOptimized.ts`: Main workflow logic
- `backend/src/services/agentOrchestrator.ts`: Agent invocation with retry logic
- `.claude/agents/*.md`: Agent definitions with system prompts
- `frontend/src/pages/ProjectDetail.tsx`: Main project UI

### Adding New Agents

1. Create `.claude/agents/agent-name.md` with frontmatter:
   ```markdown
   ---
   name: agent-name
   description: Agent description
   tools: Read, Write, Bash
   model: sonnet
   ---

   System prompt here...
   ```
2. Agent is automatically loaded by AgentOrchestrator

## License

MIT

## Created With

Built using Claude Code and Anthropic's Claude Sonnet 4.5
