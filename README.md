# Pacy Training System - AI-Powered Training Content Creation

An automated system for creating high-quality training programs using specialized AI agents that follow the HIST (High Intensity Skill Training) methodology.

## 🚀 Live Deployment

- **Frontend:** https://pacy-frontend.onrender.com
- **Backend API:** https://pacy-training-system.onrender.com
- **Health Check:** https://pacy-training-system.onrender.com/health

---

## Overview

The Pacy Training System orchestrates multiple specialized AI agents to transform client briefs into complete training programs with articles, video scripts, and quizzes. The system ensures content meets HIST principles: brevity with impact, practical focus, micro-learning format, and engaging narrative flow.

**Key Features:**

- Conversational brief interview for project setup
- Multi-agent collaborative content creation (13 specialized agents)
- Research validation with automatic gap-filling
- HIST compliance enforcement (800-1200 word articles, 5-7 min sessions)
- Source fidelity verification
- Quality gates at each phase
- Full workflow tracking and approval points
- AI exercise generation for interactive practice
- Unified batch content creation (articles + videos + quizzes + exercises)
- Flexible post-approval workflow (batch all vs. chapter-by-chapter)

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
13 Specialized AI Agents (OpenAI GPT-5.2)
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

| Agent                    | Model               | Purpose                            |
| ------------------------ | ------------------- | ---------------------------------- |
| content-architect        | gpt-5.2             | Orchestration, decision-making     |
| research-director        | gpt-5.2             | Deep research, source verification |
| hist-compliance-editor   | gpt-5.2             | Quality enforcement                |
| article-writer           | gpt-5.2-chat-latest | Content creation                   |
| content-quality-agent    | gpt-5.2-chat-latest | Learning quality validation        |
| fact-checker             | gpt-5.2-chat-latest | Accuracy verification              |
| source-analyst           | gpt-5.2-chat-latest | Material analysis                  |
| brief-interviewer        | gpt-5.2-chat-latest | User onboarding                    |
| video-narrator           | gpt-4.1-mini        | Script creation                    |
| assessment-designer      | gpt-4.1-mini        | Quiz generation                    |
| ai-exercise-designer     | gpt-4.1-mini        | Interactive AI exercise creation   |
| program-matrix-formatter | gpt-5.2-chat-latest | Matrix formatting                  |
| company-researcher       | gpt-5.2-chat-latest | Company context analysis           |

---

## The 13 Specialized Agents

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

### 6. **Content Quality Agent** (Learning Design Validator)

- **Role**: Validates learning design quality before HIST compliance
- **Model**: gpt-5.2-chat-latest
- **Checks**:
  - Brief alignment and learning objectives
  - Business context integration
  - Topic accuracy and depth
  - Engagement and theory-practice balance
- **Actions**: Auto-fixes minor issues, reports major concerns

### 7. **HIST Compliance Editor** (Quality Enforcer)

- **Role**: Enforces HIST methodology compliance
- **Model**: gpt-5.2
- **Checks**:
  - Word count limits
  - Theory/practice balance
  - Concrete examples (no abstractions)
  - Narrative energy

### 8. **Fact Checker** (Accuracy Verifier)

- **Role**: Verifies factual accuracy and source fidelity
- **Model**: gpt-5.2-chat-latest
- **Special**: VETO POWER on strict fidelity projects

### 9. **Video Narrator** (Script Writer)

- **Role**: Creates ~250 word video scripts
- **Model**: gpt-4.1-mini

### 10. **Assessment Designer** (Quiz Creator)

- **Role**: Designs scenario-based quizzes
- **Model**: gpt-4.1-mini
- **Standards**:
  - 3-5 questions per session
  - Scenario-based, not trivial recall
  - Meaningful distractors

### 11. **AI Exercise Designer** (Interactive Practice Creator)

- **Role**: Creates scenario-based practice activities for AI mentor interactions
- **Model**: gpt-4.1-mini
- **Standards**:
  - Real-world scenarios
  - Decision-making focus
  - Designed for use with AI coaching/mentoring

### 12. **Program Matrix Formatter**

- **Role**: Formats matrix output
- **Model**: gpt-5.2-chat-latest

### 13. **Company Researcher**

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

### **Phase 3: Test Session (First Session)**

**Complete workflow for first session**:

```
Article Writer creates draft
    ↓
Content Quality Agent validates learning design
    ↓
HIST Compliance Editor reviews
    ↓ (if changes needed)
Article Writer revises
    ↓ (loop until compliant)
Fact Checker verifies accuracy
    ↓
User approves article
    ↓
Video Narrator creates script
    ↓
User approves video
    ↓
Assessment Designer creates quiz
    ↓
User approves quiz
    ↓
AI Exercise Designer creates practice scenario
    ↓
User approves exercise
```

**Quality Gate**: All 4 content types approved individually before batch options appear

---

### **Phase 4: Batch Content Creation**

After test session complete, user chooses:

**Option 1: Generate ALL Remaining Content**

- Creates all articles, videos, quizzes, and AI exercises for all remaining sessions
- Single batch operation
- Fastest path to completion

**Option 2: Generate Next Chapter Only**

- Creates all 4 content types for all sessions in next chapter
- After chapter complete, same 2-option prompt appears (recursive)
- Provides granular control and review points

**Unified Batch Creation**:

- All content types generated together per session
- Articles → Videos → Quizzes → AI Exercises
- Progress tracking via Server-Sent Events (SSE)
- Graceful handling of disconnects

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
        │       ├── quiz
        │       │   └── questions[]
        │       └── aiExercise
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
GET    /api/workflow/sessions/:id/article              # Generate single article
GET    /api/workflow/sessions/:id/video                # Generate single video
GET    /api/workflow/sessions/:id/quiz                 # Generate single quiz
GET    /api/workflow/sessions/:id/exercise             # Generate single AI exercise
GET    /api/workflow/projects/:id/content/batch        # Unified: all videos + quizzes + exercises
GET    /api/workflow/projects/:id/articles/batch-all   # Batch all articles only
GET    /api/workflow/chapters/:id/batch-complete       # Complete chapter (all 4 content types)
POST   /api/workflow/articles/:id/regenerate           # Regenerate with feedback
POST   /api/workflow/videos/:id/regenerate             # Regenerate with feedback
```

---

## External Access / Port Forwarding

For remote testing, collaboration, and demos:

### Setup ngrok Tunnel

1. **Install ngrok** (Apple Silicon Mac):

```bash
curl -L https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-darwin-arm64.zip -o /tmp/ngrok.zip
unzip /tmp/ngrok.zip -d ~
chmod +x ~/ngrok
```

2. **Start tunnel**:

```bash
~/ngrok http 5173
```

3. **Configure Supabase** for the tunnel URL:
   - Dashboard → Authentication → URL Configuration
   - Add to **Redirect URLs**: `https://your-url.ngrok-free.dev/**`
   - Update **Site URL**: `https://your-url.ngrok-free.dev`

4. **Vite configuration** (already set):
   - `allowedHosts` includes `.ngrok-free.dev` wildcard
   - API proxy automatically works through tunnel

---

## Stability & Production Features

### SSE Connection Management

- **Disconnect Detection**: All long-running operations detect client disconnects
- **Graceful Degradation**: Operations continue even if client drops
- **Error Logging**: Comprehensive logging with operation-specific prefixes
- **No Crash Guarantee**: Backend stays stable during network failures

### Implemented on Endpoints

- Matrix regeneration (`/projects/:id/matrix/regenerate`)
- Unified batch content (`/projects/:id/content/batch`)
- Chapter batch complete (`/chapters/:id/batch-complete`)
- All SSE streaming endpoints

### Error Handling

```typescript
// Client disconnect detection
req.on('close', () => {
  clientDisconnected = true;
  console.log('[Operation] Client disconnected');
});

// Safe response writing
if (!clientDisconnected && !res.writableEnded) {
  res.write(data);
}
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

**Last Updated**: 2025-12-14
**Version**: 2.1.0

### What's New in v2.1.0

- **AI Exercises**: Fourth content type for interactive practice scenarios
- **Unified Batch Creation**: Generate all content types together (videos + quizzes + exercises)
- **Flexible Workflow**: Choose between batch-all or chapter-by-chapter generation
- **13 Agents**: Added Content Quality Agent and AI Exercise Designer
- **Enhanced Stability**: SSE disconnect handling prevents crashes
- **External Access**: ngrok tunnel support for remote testing
