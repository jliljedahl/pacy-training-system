# Pacy Training System - AI-Powered Training Content Creation

An automated system for creating high-quality training programs using specialized AI agents that follow the HIST (High Intensity Skill Training) methodology.

---

## 🎯 Overview

The Pacy Training System orchestrates multiple specialized AI agents to transform client briefs into complete training programs with articles, video scripts, and quizzes. The system ensures content meets HIST principles: brevity with impact, practical focus, micro-learning format, and engaging narrative flow.

**Key Features:**
- Automated brief interpretation and project setup
- Multi-agent collaborative content creation
- HIST compliance enforcement (800-1200 word articles, 5-7 min sessions)
- Source fidelity verification
- Quality gates at each phase
- Full workflow tracking and approval points

---

## 🏗️ System Architecture

### Core Components

```
Frontend (React + Vite)
    ↓
Backend API (Express + TypeScript)
    ↓
Agent Orchestrator
    ↓
9 Specialized AI Agents (Claude Sonnet 4)
    ↓
Database (PostgreSQL + Prisma)
```

### Tech Stack

**Frontend:**
- React 18 with TypeScript
- React Router for navigation
- Tailwind CSS for styling
- Axios for API communication
- Lucide React for icons

**Backend:**
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL database
- Anthropic Claude SDK
- File parsing: pdf-parse, mammoth (DOCX)

---

## 🤖 The 9 Specialized Agents

Each agent is a specialized Claude instance with specific tools, responsibilities, and expertise:

### 1. **Content Architect** (Main Coordinator)
- **Role**: Orchestrates the entire workflow, makes final decisions
- **Responsibilities**:
  - Interprets client briefs
  - Coordinates all other agents
  - Enforces HIST principles
  - Manages quality gates
  - Presents deliverables to user
- **Tools**: All tools (Bash, Read, Write, Edit, Task, TodoWrite, WebFetch, WebSearch)
- **Model**: Sonnet

### 2. **Research Director** (Deep Research Specialist)
- **Role**: Conducts comprehensive external research
- **Responsibilities**:
  - Find authoritative sources (academic papers, thought leaders)
  - Verify source authenticity (original vs derivative)
  - Map competing perspectives and debates
  - Identify latest developments (2023-2025)
  - Flag decision points requiring human input
- **Tools**: WebSearch, WebFetch, Read, Write, TodoWrite
- **Model**: Sonnet
- **Critical**: No program matrix can be created until research is complete

### 3. **Source Analyst** (Company Materials Specialist)
- **Role**: Analyzes client-provided source materials
- **Responsibilities**:
  - Classify sources (strict fidelity vs context)
  - Extract business context, processes, values
  - Identify concrete examples for content
  - Create terminology guidelines
  - Map source content to learning objectives
- **Tools**: Read, Write, Bash, TodoWrite
- **Model**: Sonnet
- **Note**: Only handles source materials, NOT client briefs

### 4. **Topic Expert** (Knowledge Architect)
- **Role**: Creates knowledge structures and learning pathways
- **Responsibilities**:
  - Design progressive learning sequences
  - Define mental models and frameworks
  - Create knowledge dependency maps
  - Ensure conceptual coherence
- **Tools**: Read, Write
- **Model**: Sonnet

### 5. **Article Writer** (Content Creator)
- **Role**: Writes training articles following HIST principles
- **Responsibilities**:
  - Create 800-1200 word articles
  - Follow 30-40% theory, 60-70% practice ratio
  - Use concrete, role-specific examples
  - Maintain engaging narrative flow
  - Ensure 5-7 minute reading time
- **Tools**: Read, Write, WebFetch
- **Model**: Sonnet

### 6. **HIST Compliance Editor** (Quality Enforcer)
- **Role**: Enforces HIST methodology compliance
- **Responsibilities**:
  - Verify word count limits
  - Check theory/practice balance
  - Ensure concrete examples (no abstractions)
  - Maintain narrative energy
  - Flag "checklist drift"
  - Provide specific revision guidance
- **Tools**: Read, Write
- **Model**: Haiku (fast, focused)

### 7. **Fact Checker** (Accuracy Verifier)
- **Role**: Verifies factual accuracy and source fidelity
- **Responsibilities**:
  - Check claims against research
  - Verify strict fidelity sources match exactly
  - Validate examples and statistics
  - Flag unsupported assertions
  - **VETO POWER** on strict fidelity projects
- **Tools**: Read, Write, WebFetch
- **Model**: Sonnet

### 8. **Video Narrator** (Script Writer)
- **Role**: Creates video scripts and visual content
- **Responsibilities**:
  - Write ~250 word video scripts
  - Design visual learning aids
  - Create presenter notes
  - Ensure video-appropriate pacing
- **Tools**: Read, Write
- **Model**: Sonnet

### 9. **Assessment Designer** (Quiz Creator)
- **Role**: Designs quizzes and interactive assessments
- **Responsibilities**:
  - Create scenario-based questions
  - Avoid trivial recall questions
  - Design meaningful distractors
  - Include explanations for answers
  - Align with learning objectives
- **Tools**: Read, Write
- **Model**: Haiku

---

## 🔄 The Complete Workflow

The system operates in distinct phases with quality gates between each phase.

### **Phase 0: Information Gathering**

**Trigger**: User creates new project

**Steps**:
1. **User uploads client brief** (PDF, DOCX, or TXT)
2. **Content Architect interprets brief**:
   - Extracts project name, learning objectives, target audience
   - Identifies deliverables, constraints, language
   - Returns structured JSON with confidence levels
3. **User reviews and confirms** extracted information
4. **Optional: User uploads source materials**:
   - Company documents (strict fidelity)
   - Context materials (examples, culture docs)

**Output**: Project created in database with all specifications

**Quality Gate**: User confirms brief interpretation accuracy

---

### **Phase 1: Program Design**

**Trigger**: Information gathering complete, user initiates "Start Workflow"

**Steps**:

1. **Research Director conducts deep research** (20-30 min):
   - Uses WebSearch extensively (10-15+ searches)
   - Finds original sources (academic papers, foundational works)
   - Identifies primary authorities and thought leaders
   - Maps competing perspectives if they exist
   - Documents latest developments (2023-2025)
   - Produces comprehensive research report

2. **Source Analyst analyzes client materials** (if provided):
   - Classifies each document (strict fidelity vs context)
   - Extracts business context and examples
   - Creates terminology guidelines
   - Provides fidelity rules for content team

3. **Content Architect coordinates structure design**:
   - Delegates to Topic Expert for knowledge architecture
   - Works with Instructional Designer input
   - Consults Assessment Designer for interactive activities
   - Synthesizes research + source analysis + learning objectives

4. **Program Matrix created**:
   - 3-4 chapters (thematic blocks)
   - 2-8 sessions per chapter
   - Each session has:
     - Name and description
     - 5 detailed content points
     - Learning objective (WIIFM - "What's In It For Me")

**Output**: Program Matrix (markdown table with full structure)

**Quality Gate**: User approves program structure before content creation

---

### **Phase 2: Article Creation**

**Trigger**: Program matrix approved

**Workflow per Article**:
```
Article Writer creates draft
    ↓
HIST Compliance Editor reviews
    ↓ (if changes needed)
Article Writer revises
    ↓ (loop until compliant)
Fact Checker verifies accuracy
    ↓ (if issues found)
Article Writer corrects
    ↓
Content Architect final review
    ↓
User approval
```

**First Article Process**:
1. **Full review cycle** with style approval
2. User confirms writing style and approach
3. After approval: Sets template for remaining articles

**Batch Options** (after first article approved):
- **Sequential**: One at a time with full reviews
- **By Chapter**: Complete one chapter, then next
- **Full Batch**: All articles, then batch review

**HIST Requirements Enforced**:
- 800-1200 words (optimal: 800-1000)
- 30-40% theory, 60-70% practice
- 5-7 minute reading time
- Concrete, role-specific examples
- Engaging narrative flow

**Output**: Approved articles for all sessions

**Quality Gate**: Each article must pass HIST + Fact Check + Architect review

---

### **Phase 3: Video Script Creation** (if requested)

**Trigger**: Articles complete, videos in deliverables

**Workflow per Video**:
```
Video Narrator creates script (~250 words)
    ↓
Fact Checker verifies accuracy
    ↓
Content Architect reviews
    ↓
User approval
```

**First Video Process**:
1. Full review with style approval
2. After approval: Template set for remaining videos

**Batch Options**:
- Sequential or batch all after first approval

**Output**: Video scripts with visual notes

**Quality Gate**: First video style approval, then batch delivery

---

### **Phase 4: Quiz Creation** (if requested)

**Trigger**: Content complete, quizzes in deliverables

**Workflow**:
```
Assessment Designer creates all quizzes
    ↓ (organized by chapter)
Content Architect reviews
    ↓
User approval
```

**Quiz Standards**:
- 3-5 questions per session (configurable)
- Scenario-based, not trivial recall
- Meaningful distractors
- Explanations for correct answers
- Aligned with learning objectives

**Output**: Complete quiz bank organized by chapter/session

**Quality Gate**: User approves quiz quality and difficulty

---

## 📊 Database Schema

**Key Models**:

```
Project
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

**Project Fields**:
- Basic: name, status, language
- Learning: learningObjectives, targetAudience, desiredOutcomes
- Content: deliverables, numChapters, strictFidelity, quizQuestions
- Context: constraints, particularAngle

**Status Flow**:
```
information_gathering
    ↓
research
    ↓
program_design
    ↓
article_creation
    ↓
video_creation (if applicable)
    ↓
quiz_creation (if applicable)
    ↓
completed
```

---

## 🎯 HIST Methodology Principles

The system enforces these core principles throughout:

### 1. **Brevity with Impact**
- Articles: 800-1200 words (optimal 800-1000)
- Videos: ~250 words
- Sessions: 5-7 minute reading time

### 2. **Theory → Practice Balance**
- 30-40% theory/concepts
- 60-70% practical application
- Enforced by HIST Compliance Editor

### 3. **Micro-Learning Format**
- One focused topic per session
- Progressive skill building
- Immediate applicability

### 4. **Concrete & Actionable**
- Role-specific examples
- Real-world scenarios
- No abstract generalizations
- "Show, don't just tell"

### 5. **Engaging Narrative Flow**
- Maintain energy throughout
- Avoid "checklist drift"
- Story-driven when appropriate
- Clear WIIFM (What's In It For Me)

---

## 🚨 Quality Gates & Approval Points

The system has mandatory approval points to ensure quality:

### 1. **Brief Interpretation**
- **Who**: User
- **What**: Confirm extracted project information is accurate
- **Why**: Ensures AI understood requirements correctly

### 2. **Program Matrix**
- **Who**: User
- **What**: Approve overall program structure
- **Why**: Major changes later are expensive; lock structure first

### 3. **First Article Style**
- **Who**: User
- **What**: Approve writing style, tone, example quality
- **Why**: Sets template for all remaining articles

### 4. **HIST Compliance**
- **Who**: HIST Compliance Editor
- **What**: Each article must pass compliance check
- **Why**: Non-negotiable methodology requirements

### 5. **Fact Checking**
- **Who**: Fact Checker
- **What**: Verify accuracy, source fidelity
- **Why**: Credibility and client trust
- **Special**: VETO POWER on strict fidelity projects

### 6. **First Video Style** (if applicable)
- **Who**: User
- **What**: Approve video script format and tone
- **Why**: Sets template for remaining videos

### 7. **Final Delivery**
- **Who**: Content Architect
- **What**: Present complete program to user
- **Why**: Formal handoff of deliverables

---

## 🔐 Source Fidelity System

### Two Types of Sources

**Strict Fidelity Sources**:
- Company methodologies/frameworks
- Proprietary processes
- Official definitions
- Compliance-related content
- **Rule**: Content MUST accurately represent source, no creative interpretation
- **Enforcement**: Fact Checker has VETO POWER

**Context Sources**:
- Company culture documents
- Industry reports
- Background materials
- Example scenarios
- **Rule**: Use to inform tone and examples, creative adaptation allowed

### Fidelity Workflow

1. **Source Analyst classifies** each uploaded document
2. **Clear rules provided** to content team
3. **Fact Checker verifies** strict fidelity content matches exactly
4. **Content Architect** makes final call if disputes arise

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- Anthropic API key

### Installation

1. **Clone repository**:
```bash
git clone <repository-url>
cd pacy-training-system
```

2. **Install dependencies**:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. **Configure environment**:

Create `backend/.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/pacy"
ANTHROPIC_API_KEY="sk-ant-..."
UPLOAD_DIR="../uploads"
PORT=3000
```

4. **Setup database**:
```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

5. **Start development servers**:
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

6. **Access application**:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

---

## 📁 Project Structure

```
pacy-training-system/
├── backend/
│   ├── src/
│   │   ├── api/           # API routes
│   │   │   ├── projects.ts
│   │   │   ├── workflow.ts
│   │   │   └── ...
│   │   ├── services/
│   │   │   ├── agentOrchestrator.ts  # Agent coordination
│   │   │   └── workflowEngine.ts     # Workflow execution
│   │   ├── db/
│   │   │   └── client.ts  # Prisma client
│   │   └── index.ts       # Express app
│   ├── prisma/
│   │   └── schema.prisma  # Database schema
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/         # React pages
│   │   ├── components/    # React components
│   │   ├── services/
│   │   │   └── api.ts     # API client
│   │   └── App.tsx
│   └── package.json
├── .claude/
│   └── agents/            # Agent definitions
│       ├── content-architect.md
│       ├── research-director.md
│       ├── source-analyst.md
│       ├── article-writer.md
│       ├── hist-compliance-editor.md
│       ├── fact-checker.md
│       ├── video-narrator.md
│       ├── assessment-designer.md
│       └── program-matrix-formatter.md
├── uploads/               # Uploaded files
└── README.md
```

---

## 🎓 Example: Complete Flow

Let's walk through creating a leadership training program:

### 1. **Client Brief Upload**
User uploads: "leadership-brief.pdf"

Content Architect extracts:
```json
{
  "projectName": "Effective Leadership for First-Time Managers",
  "learningObjectives": "Understand team leadership, give feedback, delegate tasks, build trust",
  "targetAudience": "Recently promoted tech team leaders, 0-2 years experience",
  "deliverables": "articles and quizzes",
  "numChapters": 4,
  "language": "english"
}
```

### 2. **Research Phase**
Research Director searches:
- "leadership styles academic research 2024"
- "servant leadership original source Greenleaf"
- "situational leadership Hersey Blanchard"
- "first-time manager challenges research"
- "effective delegation frameworks"

Produces 15-page research report with:
- Original sources (Greenleaf, Hersey & Blanchard, Goleman)
- Recent studies (2023-2025)
- Competing perspectives (servant vs situational vs transformational)
- Recommendation: Situational approach for first-time managers

### 3. **Program Matrix Created**
```
Chapter 1: Understanding Your Leadership Role (2 sessions)
  - Session 1.1: Transition from Individual Contributor
  - Session 1.2: Building Your Leadership Presence

Chapter 2: Communication Fundamentals (3 sessions)
  - Session 2.1: One-on-One Meeting Structure
  - Session 2.2: Giving Constructive Feedback
  - Session 2.3: Active Listening Techniques

Chapter 3: Delegation & Task Management (2 sessions)
  - Session 3.1: When and What to Delegate
  - Session 3.2: Delegation Communication Framework

Chapter 4: Building Team Trust (2 sessions)
  - Session 4.1: Psychological Safety Basics
  - Session 4.2: Handling Conflict Productively
```

### 4. **Content Creation**
Article Writer creates Session 1.1 (950 words):
- Theory: Role transition challenges (300 words)
- Practice: Common scenarios + responses (650 words)

HIST Compliance Editor checks:
- ✅ 950 words (within 800-1200)
- ✅ 32% theory, 68% practice
- ✅ Concrete tech startup examples
- ✅ 6-minute read time
- ✅ Engaging narrative maintained

Fact Checker verifies:
- ✅ Transition statistics cited correctly
- ✅ Framework attribution accurate
- ✅ Examples realistic

User approves style → Batch remaining 8 articles

### 5. **Quiz Creation**
Assessment Designer creates quiz for Session 1.1:
```
Question 1 (scenario-based):
"Your former peer asks you to cover their work like before. How do you respond?"
A) Say yes to maintain friendship
B) Decline and explain your new responsibilities (CORRECT)
C) Ask your manager for permission
D) Suggest they find someone else

Explanation: "As a new leader, boundary-setting..."
```

### 6. **Delivery**
Complete program with:
- 9 articles (800-1100 words each)
- 27 quiz questions (3 per session)
- Total: ~8000 words, 4 chapters
- Timeline: Created in 2-3 hours (mostly AI processing)

---

## 🔮 Future Enhancements

**Planned Features**:
- [ ] Multi-language support beyond English/Swedish
- [ ] Custom agent personas per client
- [ ] Learning analytics dashboard
- [ ] A/B testing for content variations
- [ ] Integration with LMS platforms
- [ ] Visual content generation (diagrams, infographics)
- [ ] Audio narration generation
- [ ] Adaptive content based on learner feedback

**Agent Improvements**:
- [ ] Memory system for client preferences
- [ ] Cross-project learning
- [ ] Automated style guide creation
- [ ] Competitor content analysis

---

## 📄 License

MIT

---

## 🙏 Acknowledgments

Built with:
- Anthropic Claude (Sonnet 4) for AI agents
- React + Vite for frontend
- Express + Prisma for backend
- PostgreSQL for data persistence

Inspired by the HIST (High Intensity Skill Training) methodology for effective micro-learning.

---

**Last Updated**: 2025-11-05
**Version**: 1.0.0
