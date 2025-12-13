# Implementation Plan: Pacy Training System Enhancements

## Overview

Three major enhancements to transform the local development project into a production-ready, team-accessible system:

1. **Supabase Migration** - PostgreSQL database + Auth + hosting preparation
2. **Company URL Onboarding** - Automatic business context extraction from company websites
3. **Interview Chat Brief Builder** - Conversational AI interface to create training briefs

---

## 1. Supabase Migration

### Why Supabase?

- **PostgreSQL**: Production-ready, supports concurrent users (SQLite limitation)
- **Built-in Auth**: User management, row-level security, team access
- **Real-time**: Can enhance progress updates
- **Storage**: File uploads for source materials
- **Edge Functions**: Could run agents closer to users (future)

### Migration Steps

#### A. Database Migration

```bash
# 1. Create Supabase project at supabase.com
# 2. Get connection string from Settings > Database

# 3. Update Prisma schema
# backend/prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  # For migrations
}
```

**Schema additions for multi-user support:**

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())

  organizations OrganizationMember[]
  projects      Project[]
}

model Organization {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())

  members   OrganizationMember[]
  projects  Project[]
}

model OrganizationMember {
  id             String       @id @default(uuid())
  userId         String
  organizationId String
  role           String       @default("member") // admin, member

  user           User         @relation(fields: [userId], references: [id])
  organization   Organization @relation(fields: [organizationId], references: [id])

  @@unique([userId, organizationId])
}

// Update Project to include ownership
model Project {
  // ... existing fields
  userId         String?
  organizationId String?

  user           User?        @relation(fields: [userId], references: [id])
  organization   Organization? @relation(fields: [organizationId], references: [id])
}
```

#### B. Authentication Setup

**Install Supabase client:**

```bash
cd backend && npm install @supabase/supabase-js
cd frontend && npm install @supabase/supabase-js
```

**Backend auth middleware:**

```typescript
// backend/src/middleware/auth.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // Service key for backend
);

export async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  req.user = user;
  next();
}
```

**Frontend auth context:**

```typescript
// frontend/src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { createClient, User } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export function AuthProvider({ children }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, supabase }}>
      {children}
    </AuthContext.Provider>
  );
}
```

#### C. File Storage Migration

```typescript
// backend/src/services/storage.ts
import { supabase } from '../middleware/auth';

export async function uploadFile(file: Buffer, filename: string, projectId: string) {
  const path = `projects/${projectId}/${filename}`;

  const { data, error } = await supabase.storage.from('source-materials').upload(path, file, {
    contentType: 'application/octet-stream',
  });

  if (error) throw error;
  return data.path;
}

export async function getFileUrl(path: string) {
  const { data } = supabase.storage.from('source-materials').getPublicUrl(path);

  return data.publicUrl;
}
```

#### D. Environment Variables

```bash
# backend/.env
DATABASE_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"
SUPABASE_URL="https://[ref].supabase.co"
SUPABASE_SERVICE_KEY="eyJ..."
ANTHROPIC_API_KEY="sk-ant-..."

# frontend/.env
VITE_SUPABASE_URL="https://[ref].supabase.co"
VITE_SUPABASE_ANON_KEY="eyJ..."
VITE_API_URL="https://your-backend.com" # or localhost for dev
```

### Deployment Options

| Option               | Frontend          | Backend        | Database |
| -------------------- | ----------------- | -------------- | -------- |
| **Vercel + Railway** | Vercel            | Railway        | Supabase |
| **Vercel + Render**  | Vercel            | Render         | Supabase |
| **All Supabase**     | Supabase (static) | Edge Functions | Supabase |

**Recommended: Vercel (frontend) + Railway (backend) + Supabase (database)**

---

## 2. Company URL Onboarding Feature

### User Flow

```
1. User enters company URL (e.g., "volvo.com")
2. System fetches and analyzes website
3. Extracts: company info, industry, target audience, tone
4. Presents summary for user confirmation
5. Proceeds to interview chat with pre-filled context
```

### New Agent: Company Researcher

````markdown
# .claude/agents/company-researcher.md

---

name: company-researcher
description: Analyzes company websites to extract business context for training programs. Use when user provides a company URL.
tools: WebFetch, WebSearch, Read, Write
model: sonnet

---

# COMPANY RESEARCHER - Business Context Extractor

You analyze company websites to extract relevant context for creating training programs.

## YOUR TASK

Given a company URL, extract and summarize:

1. **Company Overview**
   - Name and industry
   - Core business/products/services
   - Company size indicators (if visible)
   - Geographic focus

2. **Brand Voice & Tone**
   - Communication style (formal/casual/technical)
   - Key messaging themes
   - Value propositions emphasized

3. **Target Audience Indicators**
   - Who they sell to (B2B/B2C/both)
   - Industry verticals they serve
   - Typical customer profile

4. **Training-Relevant Context**
   - Company values/culture indicators
   - Any visible learning/development focus
   - Industry-specific terminology used

## OUTPUT FORMAT

```json
{
  "company": {
    "name": "Company Name",
    "industry": "Industry classification",
    "description": "2-3 sentence overview",
    "website": "url"
  },
  "brandVoice": {
    "tone": "professional/casual/technical/friendly",
    "keyThemes": ["theme1", "theme2"],
    "communicationStyle": "Description of how they communicate"
  },
  "audience": {
    "type": "B2B/B2C/Both",
    "segments": ["segment1", "segment2"],
    "typicalRole": "Description of typical customer"
  },
  "trainingContext": {
    "relevantTerminology": ["term1", "term2"],
    "industryContext": "Brief industry context",
    "suggestedAngles": ["angle1", "angle2"]
  },
  "confidence": "high/medium/low",
  "notes": ["Any important observations"]
}
```
````

## IMPORTANT

- Focus on publicly available information
- Be conservative with assumptions
- Flag low-confidence extractions
- Suggest follow-up questions for unclear areas

````

### Backend Implementation

```typescript
// backend/src/api/onboarding.ts
import { Router } from 'express';
import { agentOrchestrator } from '../services/agentOrchestrator';

const router = Router();

router.post('/analyze-company', async (req, res, next) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Clean and validate URL
    const cleanUrl = url.startsWith('http') ? url : `https://${url}`;

    const result = await agentOrchestrator.invokeAgent(
      'company-researcher',
      `Analyze this company website and extract business context: ${cleanUrl}`,
      null,
      (msg) => console.log(msg)
    );

    // Parse JSON from agent response
    const jsonMatch = result.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      const companyData = JSON.parse(jsonMatch[1]);
      return res.json(companyData);
    }

    res.json({ rawAnalysis: result });
  } catch (error) {
    next(error);
  }
});

export default router;
````

### Frontend Implementation

```typescript
// frontend/src/pages/Onboarding.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, ArrowRight, Building2 } from 'lucide-react';

export default function Onboarding() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [companyData, setCompanyData] = useState(null);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const response = await fetch('/api/onboarding/analyze-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();
      setCompanyData(data);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleContinue = () => {
    // Store company data and proceed to interview chat
    sessionStorage.setItem('companyContext', JSON.stringify(companyData));
    navigate('/create/interview');
  };

  return (
    <div className="max-w-2xl mx-auto py-12">
      <h1 className="text-4xl font-semibold mb-4">
        Let's start with your company
      </h1>
      <p className="text-gray-600 mb-8">
        Enter your company website and we'll gather context to personalize your training program.
      </p>

      {!companyData ? (
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="company.com"
                className="w-full pl-12 pr-4 py-3 border rounded-xl"
              />
            </div>
            <button
              onClick={handleAnalyze}
              disabled={!url || analyzing}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl disabled:opacity-50"
            >
              {analyzing ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>

          <button
            onClick={() => navigate('/create/interview')}
            className="text-gray-500 hover:text-gray-700"
          >
            Skip this step →
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border">
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold">{companyData.company.name}</h2>
            </div>
            <p className="text-gray-600 mb-4">{companyData.company.description}</p>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Industry:</span> {companyData.company.industry}
              </div>
              <div>
                <span className="font-medium">Audience:</span> {companyData.audience.type}
              </div>
              <div>
                <span className="font-medium">Tone:</span> {companyData.brandVoice.tone}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setCompanyData(null)}
              className="px-6 py-3 border rounded-xl"
            >
              Try Different URL
            </button>
            <button
              onClick={handleContinue}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl flex items-center justify-center gap-2"
            >
              Continue to Interview <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 3. Interview Chat Brief Builder

### User Flow

```
1. User arrives at interview chat (with optional company context)
2. AI asks questions conversationally to build the brief
3. Questions adapt based on answers
4. User can ask clarifying questions back
5. At end, AI summarizes and user confirms
6. Brief is created and user proceeds to project creation
```

### New Agent: Brief Interviewer

````markdown
# .claude/agents/brief-interviewer.md

---

name: brief-interviewer
description: Conducts conversational interviews to build training program briefs. Asks smart questions, adapts to responses, and creates structured output.
tools: Read, Write
model: sonnet

---

# BRIEF INTERVIEWER - Conversational Brief Builder

You conduct friendly, professional interviews to gather requirements for training programs.

## YOUR ROLE

You're a senior learning consultant having a conversation with a client. Your goal is to understand their training needs and create a comprehensive brief.

## CONVERSATION STYLE

- **Friendly but professional**: Like a consultant meeting a client
- **One topic at a time**: Don't overwhelm with multiple questions
- **Acknowledge responses**: Show you understood before moving on
- **Adapt questions**: Skip irrelevant questions based on answers
- **Offer suggestions**: When appropriate, suggest options or examples

## INTERVIEW FLOW

### 1. Opening (if no company context)

"Hi! I'm here to help you create a training program. Let's start with the basics - what's the main topic or skill you want to train your team on?"

### 1. Opening (with company context)

"Hi! I see you're from [Company]. Based on your [industry/focus], I have some context already. What specific skill or topic do you want to train your team on?"

### 2. Core Questions (adapt order based on flow)

**Learning Objectives**

- "What should participants be able to DO after this training?"
- "Are there specific behaviors you want to see change?"

**Target Audience**

- "Who will be taking this training? What are their roles?"
- "What's their current knowledge level on this topic?"

**Scope & Deliverables**

- "How comprehensive should this be? A quick refresher or deep dive?"
- "Do you need just articles, or also videos and quizzes?"

**Constraints & Preferences**

- "Any specific frameworks or methodologies you want to follow?"
- "Are there source materials you want us to incorporate?"
- "What language should the content be in?"

### 3. Closing

- Summarize what you've learned
- Ask if anything is missing
- Confirm readiness to proceed

## OUTPUT FORMAT

When interview is complete, output:

```json
{
  "status": "complete",
  "brief": {
    "projectName": "Suggested name",
    "learningObjectives": "What participants will learn",
    "targetAudience": "Who this is for",
    "desiredOutcomes": "Expected behavior changes",
    "deliverables": "articles|articles_videos|articles_videos_quizzes|full_program",
    "language": "swedish|english",
    "particularAngle": "Any specific framework or approach",
    "constraints": "Any constraints mentioned",
    "strictFidelity": false,
    "companyContext": {
      /* If provided */
    }
  },
  "suggestedChapters": ["Chapter 1: ...", "Chapter 2: ..."],
  "notes": ["Any important observations or suggestions"]
}
```
````

## IMPORTANT BEHAVIORS

- If user seems unsure, offer examples from their industry
- If user wants to skip a topic, mark it as "[User skipped]"
- If user asks a question, answer it helpfully
- Keep individual messages concise (2-4 sentences max)
- Use the company context to make relevant suggestions

````

### Backend: Chat Endpoint with Streaming

```typescript
// backend/src/api/interview.ts
import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { readFile } from 'fs/promises';
import path from 'path';

const router = Router();
const anthropic = new Anthropic();

// Store conversation history per session
const conversations = new Map<string, Array<{ role: string; content: string }>>();

router.post('/chat', async (req, res, next) => {
  try {
    const { sessionId, message, companyContext } = req.body;

    // Get or create conversation history
    if (!conversations.has(sessionId)) {
      // Load interviewer system prompt
      const agentPath = path.resolve(__dirname, '../../../.claude/agents/brief-interviewer.md');
      const agentContent = await readFile(agentPath, 'utf-8');
      const systemPrompt = agentContent.split('---')[2].trim();

      // Initialize with company context if available
      const contextMessage = companyContext
        ? `COMPANY CONTEXT:\n${JSON.stringify(companyContext, null, 2)}\n\nStart the interview with awareness of this context.`
        : 'Start the interview from scratch - no company context provided.';

      conversations.set(sessionId, [{
        role: 'user',
        content: contextMessage
      }]);
    }

    const history = conversations.get(sessionId)!;

    // Add user message
    history.push({ role: 'user', content: message });

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Stream response
    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system: await getInterviewerPrompt(),
      messages: history as any,
    });

    let fullResponse = '';

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        const text = chunk.delta.text;
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`);
      }
    }

    // Store assistant response
    history.push({ role: 'assistant', content: fullResponse });

    // Check if interview is complete
    if (fullResponse.includes('"status": "complete"')) {
      const jsonMatch = fullResponse.match(/```json\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        res.write(`data: ${JSON.stringify({ type: 'complete', brief: JSON.parse(jsonMatch[1]) })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();

  } catch (error) {
    next(error);
  }
});

// Clear session
router.delete('/session/:sessionId', (req, res) => {
  conversations.delete(req.params.sessionId);
  res.json({ success: true });
});

async function getInterviewerPrompt(): Promise<string> {
  const agentPath = path.resolve(__dirname, '../../../.claude/agents/brief-interviewer.md');
  const content = await readFile(agentPath, 'utf-8');
  return content.split('---')[2].trim();
}

export default router;
````

### Frontend: Chat Interface

```typescript
// frontend/src/pages/InterviewChat.tsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Bot, User } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function InterviewChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => uuidv4());
  const [brief, setBrief] = useState(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get company context from previous step
  const companyContext = sessionStorage.getItem('companyContext');

  // Start interview on mount
  useEffect(() => {
    startInterview();
  }, []);

  const startInterview = async () => {
    setLoading(true);
    await sendMessage('Start the interview', true);
    setLoading(false);
  };

  const sendMessage = async (text: string, isInitial = false) => {
    if (!isInitial) {
      setMessages(prev => [...prev, { role: 'user', content: text }]);
    }

    setLoading(true);

    try {
      const response = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: text,
          companyContext: companyContext ? JSON.parse(companyContext) : null,
        }),
      });

      const reader = response.body?.getReader();
      if (!reader) return;

      let assistantMessage = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);
        const lines = text.split('\n').filter(line => line.startsWith('data: '));

        for (const line of lines) {
          const data = JSON.parse(line.slice(6));

          if (data.type === 'text') {
            assistantMessage += data.content;
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMsg = newMessages[newMessages.length - 1];
              if (lastMsg?.role === 'assistant') {
                lastMsg.content = assistantMessage;
              } else {
                newMessages.push({ role: 'assistant', content: assistantMessage });
              }
              return newMessages;
            });
          }

          if (data.type === 'complete') {
            setBrief(data.brief);
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    sendMessage(input);
    setInput('');
  };

  const handleCreateProject = () => {
    if (brief) {
      sessionStorage.setItem('interviewBrief', JSON.stringify(brief));
      navigate('/create');
    }
  };

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-200px)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Let's Build Your Training Brief</h1>
        <p className="text-gray-600">I'll ask you a few questions to understand your needs.</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Bot className="w-5 h-5 text-blue-600" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-600" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Brief Ready */}
      {brief && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
          <p className="font-medium text-green-800 mb-2">Brief Ready!</p>
          <button
            onClick={handleCreateProject}
            className="px-4 py-2 bg-green-600 text-white rounded-lg"
          >
            Create Project with This Brief
          </button>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your response..."
          className="flex-1 px-4 py-3 border rounded-xl"
          disabled={loading || !!brief}
        />
        <button
          type="submit"
          disabled={loading || !input.trim() || !!brief}
          className="px-4 py-3 bg-blue-600 text-white rounded-xl disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
```

---

## Updated User Journey

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  1. Company URL │────▶│  2. Interview   │────▶│  3. Review &    │
│   (optional)    │     │     Chat        │     │    Create       │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
  Analyze website        AI asks questions      Pre-filled form
  Extract context        Adapt to answers       User confirms
  Show summary           Build brief            Project created
```

---

## New Routes Structure

```typescript
// frontend/src/App.tsx
<Routes>
  <Route path="/" element={<ProjectList />} />
  <Route path="/onboarding" element={<Onboarding />} />        {/* NEW */}
  <Route path="/create/interview" element={<InterviewChat />} /> {/* NEW */}
  <Route path="/create" element={<CreateProject />} />          {/* Updated */}
  <Route path="/projects/:id" element={<ProjectDetail />} />
</Routes>
```

---

## Implementation Order

1. **Phase 1: Supabase Migration** (foundation)
   - Set up Supabase project
   - Migrate Prisma schema to PostgreSQL
   - Add auth middleware
   - Update frontend with auth context
   - Migrate file storage

2. **Phase 2: Company URL Onboarding**
   - Create company-researcher agent
   - Add `/api/onboarding` endpoints
   - Build Onboarding.tsx page
   - Wire up navigation

3. **Phase 3: Interview Chat**
   - Create brief-interviewer agent
   - Add `/api/interview` endpoints with streaming
   - Build InterviewChat.tsx page
   - Connect to CreateProject with pre-filled data

4. **Phase 4: Deployment**
   - Deploy backend to Railway/Render
   - Deploy frontend to Vercel
   - Configure environment variables
   - Set up CI/CD

---

## Files to Create/Modify

### New Files

- `.claude/agents/company-researcher.md`
- `.claude/agents/brief-interviewer.md`
- `backend/src/api/onboarding.ts`
- `backend/src/api/interview.ts`
- `backend/src/middleware/auth.ts`
- `backend/src/services/storage.ts`
- `frontend/src/pages/Onboarding.tsx`
- `frontend/src/pages/InterviewChat.tsx`
- `frontend/src/contexts/AuthContext.tsx`

### Modified Files

- `backend/prisma/schema.prisma` (add User, Organization, update Project)
- `backend/src/index.ts` (register new routes)
- `frontend/src/App.tsx` (add new routes)
- `frontend/src/pages/CreateProject.tsx` (accept pre-filled data)
- `frontend/src/services/api.ts` (add auth headers)
- `.env` files (add Supabase config)

---

## Questions to Decide

1. **Auth provider**: Use Supabase Auth or integrate with existing SSO?
2. **User model**: Individual users or organization-based access?
3. **Deployment region**: EU (for Swedish content) or US?
4. **Storage**: Supabase Storage or separate S3/Cloudflare R2?
