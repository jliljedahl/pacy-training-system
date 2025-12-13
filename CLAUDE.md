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
| Database | SQLite (dev) / Supabase PostgreSQL (prod) |
| Auth | Supabase Auth |
| AI | OpenAI API (GPT-5.2 family) |

## AI Models

All agents use OpenAI models configured in `backend/src/lib/modelConfig.ts`:

```typescript
const MODELS = {
  thinking: 'gpt-5.2',            // For reasoning/orchestration tasks
  fast: 'gpt-5.2-chat-latest',    // For standard content tasks
  cheap: 'gpt-4.1-mini',          // For simple/batch tasks
};
```

### Agent Model Assignments

| Agent | Model | Use Case |
|-------|-------|----------|
| **content-architect** | gpt-5.2 | Orchestration, decision-making |
| **research-director** | gpt-5.2 | Deep research, source analysis |
| **hist-compliance-editor** | gpt-5.2 | Quality enforcement |
| **article-writer** | gpt-5.2-chat-latest | Content creation |
| **fact-checker** | gpt-5.2-chat-latest | Accuracy verification |
| **source-analyst** | gpt-5.2-chat-latest | Material analysis |
| **brief-interviewer** | gpt-5.2-chat-latest | User onboarding |
| **video-narrator** | gpt-4.1-mini | Script creation |
| **assessment-designer** | gpt-4.1-mini | Quiz generation |

## Project Structure

```
pacy-training-system/
├── backend/
│   ├── src/
│   │   ├── api/           # Express routes (projects, workflow, content)
│   │   ├── services/      # Business logic
│   │   │   ├── agentOrchestrator.ts    # Agent coordination
│   │   │   ├── workflowEngineOptimized.ts  # Matrix workflow
│   │   │   └── debriefWorkflow.ts      # Research + validation workflow
│   │   ├── lib/           # Utilities
│   │   │   ├── aiProvider.ts    # OpenAI integration
│   │   │   └── modelConfig.ts   # Model configuration
│   │   └── db/            # Prisma client
│   └── prisma/
│       └── schema.prisma  # Database schema
├── frontend/
│   └── src/
│       ├── pages/         # React pages
│       │   ├── InterviewChat.tsx   # Brief interview
│       │   ├── DebriefView.tsx     # Research debrief
│       │   └── ProjectDetail.tsx   # Main project view
│       ├── components/    # Reusable components
│       └── services/      # API client
├── .claude/
│   ├── agents/            # 11 specialized AI agents
│   └── skills/            # Writing skills
└── uploads/               # User-uploaded source materials
```

## The 11 Agents

| Agent | Role | Model |
|-------|------|-------|
| **content-architect** | Main coordinator, orchestrates workflow | gpt-5.2 |
| **research-director** | External research with source verification | gpt-5.2 |
| **source-analyst** | Analyzes client materials, creates terminology guides | gpt-5.2-chat |
| **brief-interviewer** | Conducts conversational onboarding | gpt-5.2-chat |
| **article-writer** | Creates 800-1200 word HIST articles | gpt-5.2-chat |
| **hist-compliance-editor** | Enforces HIST methodology | gpt-5.2 |
| **fact-checker** | Verifies accuracy, veto power on strict fidelity | gpt-5.2-chat |
| **video-narrator** | Creates ~250 word video scripts | gpt-4.1-mini |
| **assessment-designer** | Designs scenario-based quizzes | gpt-4.1-mini |
| **program-matrix-formatter** | Formats matrix output | gpt-5.2-chat |
| **company-researcher** | Analyzes company context | gpt-5.2-chat |

## HIST Methodology Rules

These rules are enforced across all content:

- **Articles**: 800-1200 words (optimal: 800-1000)
- **Video scripts**: ~250 words
- **Theory/Practice ratio**: 30-40% theory, 60-70% practice
- **Reading time**: Max 5-7 minutes per session
- **Style**: Concrete examples, role-specific, no abstractions

## Workflow Phases

### Phase 0: Onboarding
- Brief interview chat (conversational)
- Company URL analysis (if provided)
- Project configuration

### Phase 1: Research & Debrief
1. **Research** - Research Director gathers sources
2. **Validation** - Content Architect checks for:
   - Contradictions between sources
   - Gaps in coverage
   - Missing contrarian/alternative viewpoints
3. **Auto-deepening** - If gaps found, research is automatically expanded
4. **Debrief** - 3 alternative program directions presented
5. **Feedback loop** - User can iterate on debrief

### Phase 2: Program Design
- Matrix creation with chapters/sessions
- User can provide feedback and regenerate
- Approval before content creation

### Phase 3: Article Creation
- Write → HIST review → Fact check → Approve
- First article sets style template
- Batch generation for remaining articles

### Phase 4: Video Scripts (if requested)
### Phase 5: Quiz Generation (if requested)

## Key API Endpoints

```
# Projects
POST   /api/projects              # Create project
GET    /api/projects/:id          # Get project details
POST   /api/projects/:id/sources  # Upload source material

# Debrief Workflow (NEW)
GET    /api/workflow/projects/:id/debrief/start     # Start research + debrief
GET    /api/workflow/projects/:id/debrief           # Get current debrief
POST   /api/workflow/projects/:id/debrief/feedback  # Submit feedback
POST   /api/workflow/projects/:id/debrief/regenerate # Regenerate with feedback
POST   /api/workflow/projects/:id/debrief/approve   # Approve and proceed

# Matrix Workflow
GET    /api/workflow/projects/:id/design            # Create program matrix
POST   /api/workflow/projects/:id/matrix/regenerate # Regenerate with feedback
POST   /api/workflow/projects/:id/approve-matrix    # Approve matrix

# Content Generation (SSE streams)
GET    /api/workflow/sessions/:id/article           # Generate article
GET    /api/workflow/projects/:id/articles/batch-all # Batch all articles
GET    /api/workflow/projects/:id/videos/batch      # Batch all videos
GET    /api/workflow/projects/:id/quizzes/batch     # Batch all quizzes
```

## Database Schema (Key Models)

- **User**: Supabase Auth user
- **Project**: Main entity with brief info, deliverables config
- **ProgramMatrix**: Approved program structure
- **Chapter**: Thematic blocks (3-4 per program)
- **Session**: Individual learning units (2-8 per chapter)
- **Article/VideoScript/Quiz**: Content deliverables per session
- **WorkflowStep**: Tracks agent execution progress

## Environment Variables

```bash
# backend/.env
DATABASE_URL="postgresql://..." # or "file:./dev.db" for SQLite
OPENAI_API_KEY="sk-..."
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_ANON_KEY="eyJ..."
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
```

## File Boundaries

- **Safe to edit**: `frontend/src/`, `backend/src/`, `.claude/agents/`
- **Edit with care**: `backend/prisma/schema.prisma` (requires migration)
- **Read-only**: `node_modules/`, `backend/prisma/dev.db`

## Common Tasks

### Adding a new agent
1. Create `.claude/agents/agent-name.md` with frontmatter
2. Add model config in `backend/src/lib/modelConfig.ts`
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
