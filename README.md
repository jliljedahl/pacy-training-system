# Pacy Training System - AI-Powered Training Content Creation

An automated system for creating high-quality training programs using specialized AI agents that follow the HIST (High Intensity Skill Training) methodology.

---

## Overview

The Pacy Training System orchestrates multiple specialized AI agents to transform client briefs into complete training programs with articles, video scripts, and quizzes. The system ensures content meets HIST principles: brevity with impact, practical focus, micro-learning format, and engaging narrative flow.

**Key Features:**

- Conversational brief interview for project setup
- Multi-agent collaborative content creation
- Research validation with automatic gap-filling
- HIST compliance enforcement (800-1200 word articles, 5-7 min sessions)
- Source fidelity verification
- Quality gates at each phase
- Full workflow tracking and approval points

---

## System Architecture

### Core Components

```
Frontend (React + Vite)
    ↓
Backend API (Express + TypeScript)
    ↓
Agent Orchestrator
    ↓
11 Specialized AI Agents (OpenAI GPT-5.2)
    ↓
Database (PostgreSQL via Supabase)
```

### Tech Stack

**Frontend:**

- React 18 with TypeScript
- React Router for navigation
- Tailwind CSS for styling
- Axios for API communication
- Supabase Auth for authentication

**Backend:**

- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL database (Supabase)
- OpenAI API (GPT-5.2 family)
- File parsing: pdf-parse, mammoth (DOCX)

---

## AI Models

All agents use OpenAI models:

```typescript
const MODELS = {
  thinking: 'gpt-5.2', // For reasoning/orchestration tasks
  fast: 'gpt-5.2-chat-latest', // For standard content tasks
  cheap: 'gpt-4.1-mini', // For simple/batch tasks
};
```

### Agent Model Assignments

| Agent                  | Model               | Purpose                            |
| ---------------------- | ------------------- | ---------------------------------- |
| content-architect      | gpt-5.2             | Orchestration, decision-making     |
| research-director      | gpt-5.2             | Deep research, source verification |
| hist-compliance-editor | gpt-5.2             | Quality enforcement                |
| article-writer         | gpt-5.2-chat-latest | Content creation                   |
| fact-checker           | gpt-5.2-chat-latest | Accuracy verification              |
| source-analyst         | gpt-5.2-chat-latest | Material analysis                  |
| brief-interviewer      | gpt-5.2-chat-latest | User onboarding                    |
| video-narrator         | gpt-4.1-mini        | Script creation                    |
| assessment-designer    | gpt-4.1-mini        | Quiz generation                    |

---

## The 11 Specialized Agents

### 1. **Content Architect** (Main Coordinator)

- **Role**: Orchestrates the entire workflow, makes final decisions
- **Model**: gpt-5.2
- **Responsibilities**:
  - Validates research quality (contradictions, gaps, alternative viewpoints)
  - Coordinates all other agents
  - Enforces HIST principles
  - Manages quality gates

### 2. **Research Director** (Deep Research Specialist)

- **Role**: Conducts comprehensive external research
- **Model**: gpt-5.2
- **Responsibilities**:
  - Find 3-5 authoritative sources (prioritizing 2024-2025)
  - Verify source authenticity
  - Map competing perspectives
  - Provide motivated source selection

### 3. **Brief Interviewer** (Onboarding Specialist)

- **Role**: Conducts conversational project setup
- **Model**: gpt-5.2-chat-latest
- **Responsibilities**:
  - Guide users through brief creation
  - Extract learning objectives, target audience
  - Clarify deliverables and constraints

### 4. **Source Analyst** (Company Materials Specialist)

- **Role**: Analyzes client-provided source materials
- **Model**: gpt-5.2-chat-latest
- **Responsibilities**:
  - Classify sources (strict fidelity vs context)
  - Extract business context and examples
  - Create terminology guidelines

### 5. **Article Writer** (Content Creator)

- **Role**: Writes training articles following HIST principles
- **Model**: gpt-5.2-chat-latest
- **Requirements**:
  - 800-1200 words (optimal: 800-1000)
  - 30-40% theory, 60-70% practice
  - Concrete, role-specific examples

### 6. **HIST Compliance Editor** (Quality Enforcer)

- **Role**: Enforces HIST methodology compliance
- **Model**: gpt-5.2
- **Checks**:
  - Word count limits
  - Theory/practice balance
  - Concrete examples (no abstractions)
  - Narrative energy

### 7. **Fact Checker** (Accuracy Verifier)

- **Role**: Verifies factual accuracy and source fidelity
- **Model**: gpt-5.2-chat-latest
- **Special**: VETO POWER on strict fidelity projects

### 8. **Video Narrator** (Script Writer)

- **Role**: Creates ~250 word video scripts
- **Model**: gpt-4.1-mini

### 9. **Assessment Designer** (Quiz Creator)

- **Role**: Designs scenario-based quizzes
- **Model**: gpt-4.1-mini
- **Standards**:
  - 3-5 questions per session
  - Scenario-based, not trivial recall
  - Meaningful distractors

### 10. **Program Matrix Formatter**

- **Role**: Formats matrix output
- **Model**: gpt-5.2-chat-latest

### 11. **Company Researcher**

- **Role**: Analyzes company websites for context
- **Model**: gpt-5.2-chat-latest

---

## The Complete Workflow

### **Phase 0: Onboarding**

**Steps**:

1. User starts new project
2. **Brief Interviewer** conducts conversational interview
3. Optional: Company URL analysis for context
4. Optional: User uploads source materials
5. Project configured and ready

---

### **Phase 1: Research & Debrief**

**Steps**:

1. **Research Director conducts research**:
   - Gathers 3-5 high-quality sources
   - Prioritizes recent sources (2024-2025)
   - Provides motivation for each source

2. **Content Architect validates research**:
   - Identifies contradictions between sources
   - Finds gaps in coverage
   - Discovers contrarian/alternative viewpoints

3. **Automatic research deepening** (if needed):
   - If critical gaps found, Research Director expands research
   - Alternative perspectives are explored
   - Contradictions are clarified

4. **Debrief generation**:
   - Research summary with validation results
   - 3 alternative program directions
   - User feedback loop

**Quality Gate**: User approves research direction before matrix creation

---

### **Phase 2: Program Design**

**Steps**:

1. **Program Matrix created**:
   - 3-4 chapters (thematic blocks)
   - 2-8 sessions per chapter
   - Each session has name, description, 5 content points

2. **User feedback loop**:
   - Chat interface for providing feedback
   - "Uppdatera matris" button to regenerate with changes
   - Matrix includes previous content for targeted edits

**Quality Gate**: User approves program structure before content creation

---

### **Phase 3: Article Creation**

**Workflow per Article**:

```
Article Writer creates draft
    ↓
HIST Compliance Editor reviews
    ↓ (if changes needed)
Article Writer revises
    ↓ (loop until compliant)
Fact Checker verifies accuracy
    ↓
User approval
```

**Batch Options** (after first article approved):

- Sequential: One at a time
- By Chapter: Complete one chapter, then next
- Full Batch: All articles at once

---

### **Phase 4: Video Script Creation** (if requested)

~250 word scripts with visual notes

---

### **Phase 5: Quiz Creation** (if requested)

Scenario-based questions organized by chapter

---

## Database Schema

**Key Models**:

```
User (Supabase Auth)
    └── Projects[]
        ├── sourceMaterials[]
        ├── programMatrix
        ├── chapters[]
        │   └── sessions[]
        │       ├── article
        │       ├── videoScript
        │       └── quiz
        │           └── questions[]
        └── workflowSteps[]
```

**Status Flow**:

```
information_gathering → research → debrief_review → matrix_creation →
article_creation → video_creation → quiz_creation → completed
```

---

## HIST Methodology Principles

### 1. **Brevity with Impact**

- Articles: 800-1200 words (optimal 800-1000)
- Videos: ~250 words
- Sessions: 5-7 minute reading time

### 2. **Theory → Practice Balance**

- 30-40% theory/concepts
- 60-70% practical application

### 3. **Micro-Learning Format**

- One focused topic per session
- Progressive skill building

### 4. **Concrete & Actionable**

- Role-specific examples
- Real-world scenarios
- No abstract generalizations

### 5. **Engaging Narrative Flow**

- Maintain energy throughout
- Avoid "checklist drift"
- Clear WIIFM (What's In It For Me)

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL (or Supabase account)
- OpenAI API key

### Installation

1. **Clone repository**:

```bash
git clone <repository-url>
cd pacy-training-system
```

2. **Install dependencies**:

```bash
npm run install:all
```

3. **Configure environment**:

Create `backend/.env`:

```env
DATABASE_URL="postgresql://..."
OPENAI_API_KEY="sk-..."
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_ANON_KEY="eyJ..."
UPLOAD_DIR="./uploads"
PORT=3001
```

Create `frontend/.env`:

```env
VITE_SUPABASE_URL="https://xxx.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJ..."
VITE_API_URL="http://localhost:3001"
```

4. **Setup database**:

```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

5. **Start development servers**:

```bash
npm run dev
```

6. **Access application**:

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

---

## Project Structure

```
pacy-training-system/
├── backend/
│   ├── src/
│   │   ├── api/              # API routes
│   │   │   ├── projects.ts
│   │   │   ├── workflow.ts
│   │   │   └── content.ts
│   │   ├── services/
│   │   │   ├── agentOrchestrator.ts   # Agent coordination
│   │   │   ├── workflowEngineOptimized.ts  # Matrix workflow
│   │   │   └── debriefWorkflow.ts     # Research + validation
│   │   ├── lib/
│   │   │   ├── aiProvider.ts      # OpenAI integration
│   │   │   └── modelConfig.ts     # Model configuration
│   │   ├── db/
│   │   │   └── client.ts      # Prisma client
│   │   └── index.ts           # Express app
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── InterviewChat.tsx   # Brief interview
│   │   │   ├── DebriefView.tsx     # Research debrief
│   │   │   └── ProjectDetail.tsx   # Main project view
│   │   ├── components/
│   │   │   ├── ChatCanvas.tsx      # Chat with regenerate
│   │   │   └── MatrixDebrief.tsx   # Matrix display
│   │   ├── services/
│   │   │   └── api.ts         # API client
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx    # Supabase Auth
│   │   └── App.tsx
│   └── package.json
├── .claude/
│   └── agents/                # Agent definitions
│       ├── content-architect.md
│       ├── research-director.md
│       ├── brief-interviewer.md
│       └── ...
├── uploads/                   # Uploaded files
├── CLAUDE.md                  # Claude Code instructions
└── README.md
```

---

## API Endpoints

### Projects

```
POST   /api/projects              # Create project
GET    /api/projects              # List user's projects
GET    /api/projects/:id          # Get project details
POST   /api/projects/:id/sources  # Upload source material
```

### Debrief Workflow

```
GET    /api/workflow/projects/:id/debrief/start      # Start research + debrief
GET    /api/workflow/projects/:id/debrief            # Get current debrief
POST   /api/workflow/projects/:id/debrief/feedback   # Submit feedback
POST   /api/workflow/projects/:id/debrief/regenerate # Regenerate debrief
POST   /api/workflow/projects/:id/debrief/approve    # Approve and proceed
```

### Matrix Workflow

```
GET    /api/workflow/projects/:id/design             # Create program matrix
POST   /api/workflow/projects/:id/matrix/regenerate  # Regenerate with feedback
POST   /api/workflow/projects/:id/approve-matrix     # Approve matrix
```

### Content Generation (SSE Streams)

```
GET    /api/workflow/sessions/:id/article            # Generate single article
GET    /api/workflow/projects/:id/articles/batch-all # Batch all articles
GET    /api/workflow/projects/:id/videos/batch       # Batch all videos
GET    /api/workflow/projects/:id/quizzes/batch      # Batch all quizzes
```

---

## License

MIT

---

## Acknowledgments

Built with:

- OpenAI GPT-5.2 for AI agents
- React + Vite for frontend
- Express + Prisma for backend
- Supabase for database and authentication

Inspired by the HIST (High Intensity Skill Training) methodology for effective micro-learning.

---

**Last Updated**: 2025-12-13
**Version**: 2.0.0
