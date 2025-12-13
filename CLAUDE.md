# Pacy Training System

> AI-powered training content creation using the HIST (High Intensity Skill Training) methodology. Multi-agent system that transforms client briefs into complete training programs with articles, video scripts, and quizzes.

## Quick Start

```bash
# Install all dependencies
npm run install:all

# Start development (both frontend and backend)
npm run dev

# Backend only: http://localhost:3001
npm run dev:backend

# Frontend only: http://localhost:5173
npm run dev:frontend
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router |
| Backend | Node.js, Express, TypeScript, Prisma ORM |
| Database | SQLite (dev) → Supabase PostgreSQL (prod) |
| AI | OpenAI API |

## OpenAI Models

```typescript
// config/models.ts
export const OPENAI_MODELS = {
  thinking: "gpt-5.2",           // For reasoning tasks (content-architect, research-director, hist-compliance-editor)
  fast: "gpt-5.2-chat-latest",   // For standard tasks (article-writer, fact-checker, source-analyst)
  coding: "gpt-5-codex",         // For code generation
  cheap: "gpt-4.1-mini"          // For simple/batch tasks (video-narrator, assessment-designer)
}
```

## Project Structure

```
pacy-training-system/
├── backend/
│   ├── src/
│   │   ├── api/           # Express routes (projects, workflow, content)
│   │   ├── services/      # Business logic (agentOrchestrator, workflowEngine)
│   │   └── db/            # Prisma client
│   └── prisma/
│       └── schema.prisma  # Database schema
├── frontend/
│   └── src/
│       ├── pages/         # CreateProject, ProjectDetail, ProjectList
│       ├── components/    # Layout, TableOfContents
│       └── services/      # API client
├── .claude/
│   ├── agents/            # 9 specialized AI agents
│   └── skills/            # Writing skills (article, word economy, narrative)
└── uploads/               # User-uploaded source materials
```

## The 9 Agents

| Agent | Role | Model |
|-------|------|-------|
| **content-architect** | Main coordinator, orchestrates workflow | Sonnet |
| **research-director** | External research with source verification | Sonnet |
| **source-analyst** | Analyzes client materials, creates terminology guides | Sonnet |
| **topic-expert** | Designs knowledge structures and learning pathways | - |
| **article-writer** | Creates 800-1200 word HIST articles | Sonnet |
| **hist-compliance-editor** | Enforces HIST methodology | Sonnet |
| **fact-checker** | Verifies accuracy, veto power on strict fidelity | Sonnet |
| **video-narrator** | Creates ~250 word video scripts | Sonnet |
| **assessment-designer** | Designs scenario-based quizzes | Sonnet |

## HIST Methodology Rules

These rules are enforced across all content:

- **Articles**: 800-1200 words (optimal: 800-1000)
- **Video scripts**: ~250 words
- **Theory/Practice ratio**: 30-40% theory, 60-70% practice
- **Reading time**: Max 5-7 minutes per session
- **Style**: Concrete examples, role-specific, no abstractions

## Workflow Phases

1. **Phase 0**: Information gathering (brief interpretation)
2. **Phase 1**: Program design (research → structure → program matrix)
3. **Phase 2**: Article creation (write → HIST review → fact check → approve)
4. **Phase 3**: Video script creation (if requested)
5. **Phase 4**: Quiz generation (organized by chapter)

## Key API Endpoints

```
# Projects
POST   /api/projects              # Create project
GET    /api/projects/:id          # Get project details
POST   /api/projects/:id/sources  # Upload source material

# Workflow (SSE streams)
GET    /api/workflow/projects/:id/design              # Run program design
POST   /api/workflow/projects/:id/approve-matrix      # Approve matrix
GET    /api/workflow/sessions/:id/article             # Generate article
GET    /api/workflow/projects/:id/articles/batch-all  # Batch all articles
GET    /api/workflow/projects/:id/videos/batch        # Batch all videos
GET    /api/workflow/projects/:id/quizzes/batch       # Batch all quizzes
```

## Database Schema (Key Models)

- **Project**: Main entity with brief info, deliverables config
- **ProgramMatrix**: Approved program structure
- **Chapter**: Thematic blocks (3-4 per program)
- **Session**: Individual learning units (2-8 per chapter)
- **Article/VideoScript/Quiz**: Content deliverables per session
- **WorkflowStep**: Tracks agent execution progress

## Environment Variables

```bash
# backend/.env
DATABASE_URL="file:./dev.db"
OPENAI_API_KEY="sk-..."
UPLOAD_DIR="./uploads"
PORT=3001
```

## Verification Commands

```bash
# Type checking
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit

# Database
cd backend && npx prisma studio     # Visual DB browser
cd backend && npx prisma migrate dev # Run migrations

# Test API key
cd backend && npx ts-node test-api-key.ts
```

## File Boundaries

- **Safe to edit**: `frontend/src/`, `backend/src/`, `.claude/agents/`
- **Edit with care**: `backend/prisma/schema.prisma` (requires migration)
- **Read-only**: `node_modules/`, `backend/prisma/dev.db`

## Common Tasks

### Adding a new agent
1. Create `.claude/agents/agent-name.md` with frontmatter
2. Include: name, description, tools, model, system prompt
3. Agent auto-loads via `agentOrchestrator.ts`

### Adding a new API endpoint
1. Add route in `backend/src/api/` (projects.ts, workflow.ts, or content.ts)
2. For long operations, use SSE pattern (see existing examples)
3. Register in `backend/src/index.ts` if new file

### Modifying database schema
1. Edit `backend/prisma/schema.prisma`
2. Run `cd backend && npx prisma migrate dev --name description`
3. Prisma client auto-regenerates

## Code Style

- TypeScript strict mode enabled
- Tailwind for styling (no custom CSS unless necessary)
- Async/await for all async operations
- SSE for long-running operations with progress updates

## Known Limitations

- SQLite doesn't support concurrent writes well (use Supabase for production)
- No authentication system yet
- File uploads stored locally (need cloud storage for production)
