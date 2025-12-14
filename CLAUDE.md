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

- **Articles**: 800-1200 words (optimal: 800-1000 for tighter engagement)
- **Video scripts**: ~250 words
- **AI Exercises**: Scenario-based practice activities for AI mentor interactions
- **Theory/Practice**: 30-40% theory, 60-70% practice
- **Reading time**: Max 5-7 minutes per session
- **Style**: Narrative flow, concrete examples, role-specific, minimal bullet lists

## Workflow Phases

1. **Onboarding**: Brief interview → Company analysis → Project config
2. **Research & Debrief**: Research → Validation (contradictions/gaps/alternatives) → Auto-deepen if needed → 3 alternatives
3. **Program Design**: Matrix creation → Feedback loop → Approval
4. **Test Session**: Create first session → Approve article, video, quiz, AI exercise individually
5. **Batch Creation**: After test session, choose:
   - Option 1: Generate ALL remaining content (articles + videos + quizzes + exercises)
   - Option 2: Generate next chapter only
   - After each chapter: Same prompt recurses for granular control
6. **Content Quality Gates**: Article → Content QA → HIST review → Fact check → Approve

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
- SSE for long-running operations with disconnect handling
- Pre-commit hooks run ESLint + Prettier automatically

## External Access / Port Forwarding

For remote testing and collaboration:

1. **Setup ngrok** (if not installed):

   ```bash
   # Download for Apple Silicon
   curl -L https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-darwin-arm64.zip -o /tmp/ngrok.zip
   unzip /tmp/ngrok.zip -d ~
   chmod +x ~/ngrok
   ```

2. **Start tunnel**:

   ```bash
   ~/ngrok http 5173
   ```

3. **Configure Supabase**:
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add ngrok URL to **Redirect URLs**: `https://your-tunnel.ngrok-free.dev/**`
   - Update **Site URL**: `https://your-tunnel.ngrok-free.dev`

4. **Update Vite config** (already configured):
   - `allowedHosts` includes `.ngrok-free.dev` wildcard
   - Frontend proxies `/api` to backend automatically

## Stability Features

- **SSE Disconnect Handling**: All long-running operations detect client disconnects
- **Graceful Degradation**: Operations continue even if client disconnects mid-stream
- **Error Logging**: Comprehensive logging with operation prefixes for debugging
- **No Crash Guarantees**: Backend won't crash on network failures or client disconnects
