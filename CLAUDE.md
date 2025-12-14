# Pacy Training System

> AI-powered training content creation using HIST methodology. Multi-agent system transforming client briefs into training programs.

## Quick Start

```bash
npm run install:all    # Install dependencies
npm run dev            # Start both servers (frontend :5173, backend :3001)
npm run lint           # ESLint check
npm run format         # Prettier format
```

## Tech Stack

| Layer    | Technology                                              |
| -------- | ------------------------------------------------------- |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS                |
| Backend  | Node.js, Express, TypeScript, Prisma ORM                |
| Database | SQLite (dev) / Supabase PostgreSQL (prod)               |
| Auth     | Supabase Auth                                           |
| AI       | OpenAI API (models in `backend/src/lib/modelConfig.ts`) |

## Project Structure

```
pacy-training-system/
├── backend/src/
│   ├── api/              # Express routes
│   ├── services/         # Business logic (agentOrchestrator, workflowEngine)
│   ├── lib/              # aiProvider.ts, modelConfig.ts
│   └── db/               # Prisma client
├── frontend/src/
│   ├── pages/            # React pages
│   ├── components/       # Reusable components
│   └── services/         # API client
├── .claude/
│   ├── agents/           # 13 AI agent definitions
│   └── skills/           # Writing skills
└── backend/prisma/schema.prisma
```

## The 13 Agents

| Agent                    | Role                                              |
| ------------------------ | ------------------------------------------------- |
| content-architect        | Main coordinator, orchestrates workflow           |
| research-director        | External research with source verification        |
| source-analyst           | Analyzes client materials                         |
| brief-interviewer        | Conversational onboarding                         |
| article-writer           | Creates 800-1200 word HIST articles               |
| content-quality-agent    | Validates learning quality and brief alignment    |
| hist-compliance-editor   | Enforces HIST methodology                         |
| fact-checker             | Verifies accuracy (veto power on strict fidelity) |
| video-narrator           | Creates ~250 word video scripts                   |
| assessment-designer      | Designs scenario-based quizzes                    |
| ai-exercise-designer     | Creates interactive AI practice exercises         |
| program-matrix-formatter | Formats matrix output                             |
| company-researcher       | Analyzes company context                          |

## HIST Methodology

- **Articles**: 1000-1500 words (optimal: 1200-1400 for narrative flow)
- **Video scripts**: ~250 words
- **Theory/Practice**: 30-40% theory, 60-70% practice
- **Reading time**: Max 7-10 minutes per session
- **Style**: Narrative flow, concrete examples, role-specific, minimal bullet lists

## Workflow Phases

1. **Onboarding**: Brief interview → Company analysis → Project config
2. **Research & Debrief**: Research → Validation (contradictions/gaps/alternatives) → Auto-deepen if needed → 3 alternatives
3. **Program Design**: Matrix creation → Feedback loop → Approval
4. **Content Creation**: Article → Content QA → HIST review → Fact check → Approve → Batch remaining
5. **Videos/Quizzes**: If requested

## Environment Variables

```bash
# backend/.env
DATABASE_URL="file:./dev.db"  # or postgresql://...
OPENAI_API_KEY="sk-..."
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_ANON_KEY="eyJ..."
PORT=3001
```

## Verification Commands

```bash
npm run lint              # ESLint
npm run format:check      # Prettier check
npm run typecheck:backend # TypeScript backend
npm run typecheck:frontend # TypeScript frontend
npx prisma studio         # Visual DB browser (in backend/)
```

## File Boundaries

- **Safe to edit**: `frontend/src/`, `backend/src/`, `.claude/agents/`
- **Edit with care**: `backend/prisma/schema.prisma` (requires migration)
- **Read-only**: `node_modules/`, `backend/prisma/dev.db`

## Common Tasks

### Adding a new agent

1. Create `.claude/agents/agent-name.md` with frontmatter (name, description, tools)
2. Add model config in `backend/src/lib/modelConfig.ts`

### Adding API endpoint

1. Add route in `backend/src/api/`
2. For long operations, use SSE pattern
3. Register in `backend/src/index.ts` if new file

### Modifying database

1. Edit `backend/prisma/schema.prisma`
2. Run `cd backend && npx prisma migrate dev --name description`

## Code Style

- TypeScript strict mode
- Tailwind for styling
- Async/await for async operations
- SSE for long-running operations
- Pre-commit hooks run ESLint + Prettier automatically
