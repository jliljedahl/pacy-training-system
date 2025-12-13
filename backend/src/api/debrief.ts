import { Router } from 'express';
import { getCompletion, ChatMessage } from '../lib/aiProvider';
import prisma from '../db/client';

const router = Router();

// Store conversation history per project (in-memory)
const debriefConversations = new Map<string, ChatMessage[]>();

/**
 * Get the system prompt for debrief chat
 */
function getDebriefSystemPrompt(projectContext: Record<string, unknown>): string {
  return `Du ar Content Architect for Pacy Training System. Du har precis skapat en programmatris for ett utbildningsprogram och presenterar den for kunden.

## DIN ROLL

Du har djup kunskap om:
- Programmatrisen du skapat (kapitel, sessioner, larandemal)
- Forskningen som ligger till grund for innehallet
- HIST-metodiken (High Intensity Skill Training)
- Pedagogiska val och strukturella beslut

## PROJEKTKONTEXT

${JSON.stringify(projectContext, null, 2)}

## HUR DU SVARAR

1. **Var konkret**: Referera till specifika kapitel, sessioner eller innehall nar du svarar
2. **Forklara val**: Om kunden fragar varfor du valt en viss struktur, forklara din pedagogiska rationale
3. **Var oppna for andring**: Om kunden vill andra nagot, bekrafta och forklara hur det paverkar programmet
4. **Hallkort**: Halla svaren koncisa (2-4 meningar) om inte kunden fragar om djupare forklaring

## EXEMPEL PA FRAGOR DU KAN FA

- "Varfor har du valt denna kapitelstruktur?"
- "Kan vi lagga till ett kapitel om X?"
- "Varfor borjar vi med Y istallet for Z?"
- "Hur hangs session 2.1 ihop med session 1.3?"

## VIKTIGT

- Svara alltid pa svenska om kunden skriver pa svenska
- Du har INTE mojlighet att andra matrisen direkt - du kan bara forklara och ge forslag
- Om kunden vill gora anpassningar, forklara vad som behovs och att de kan gora det efter godkannande
`;
}

interface ChapterWithSessions {
  number: number;
  name: string;
  description: string;
  sessions: Array<{
    number: number;
    name: string;
    description: string;
  }>;
}

interface WorkflowStep {
  step: string;
  result: string | null;
}

interface SourceMaterial {
  filename: string;
  type: string;
}

/**
 * POST /api/debrief/:projectId/chat
 * Chat endpoint for program design debrief
 */
router.post('/:projectId/chat', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    // Load project context
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        programMatrix: true,
        chapters: {
          include: {
            sessions: true
          },
          orderBy: { number: 'asc' }
        },
        workflowSteps: {
          where: {
            step: { in: ['create_program_matrix', 'create_program_design', 'research'] }
          }
        },
        sourceMaterials: true,
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get or create conversation history
    if (!debriefConversations.has(projectId)) {
      debriefConversations.set(projectId, []);
    }

    const history = debriefConversations.get(projectId)!;

    // Add user message
    history.push({ role: 'user', content: message });

    // Build project context
    const projectContext = {
      name: project.name,
      learningObjectives: project.learningObjectives,
      targetAudience: project.targetAudience,
      desiredOutcomes: project.desiredOutcomes,
      language: project.language,
      particularAngle: project.particularAngle,
      programMatrix: (project.workflowSteps as WorkflowStep[]).find(
        (s: WorkflowStep) => s.step === 'create_program_matrix' || s.step === 'create_program_design'
      )?.result?.substring(0, 5000),
      chapters: (project.chapters as ChapterWithSessions[]).map((c: ChapterWithSessions) => ({
        number: c.number,
        name: c.name,
        description: c.description,
        sessions: c.sessions.map((s) => ({
          number: s.number,
          name: s.name,
          description: s.description
        }))
      })),
      sourceMaterials: (project.sourceMaterials as SourceMaterial[] | null)?.map((s: SourceMaterial) => ({
        filename: s.filename,
        type: s.type
      }))
    };

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // Get response from OpenAI
    const result = await getCompletion({
      agentName: 'content-architect',
      systemPrompt: getDebriefSystemPrompt(projectContext),
      messages: history,
      maxTokens: 1024,
    });

    // Store assistant response in history
    history.push({ role: 'assistant', content: result.content });

    // Send response as SSE chunks (simulating streaming for compatibility)
    const chunks = result.content.match(/.{1,50}/g) || [result.content];
    for (const chunk of chunks) {
      res.write(`data: ${JSON.stringify({ type: 'text', content: chunk })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();

  } catch (error: unknown) {
    const err = error as Error;
    console.error('[Debrief] Chat error:', err.message);

    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
      res.end();
    } else {
      next(error);
    }
  }
});

/**
 * DELETE /api/debrief/:projectId/session
 * Clear a project's debrief conversation history
 */
router.delete('/:projectId/session', (req, res) => {
  const { projectId } = req.params;
  debriefConversations.delete(projectId);
  res.json({ success: true });
});

/**
 * GET /api/debrief/:projectId/sources
 * Get research sources and references for a project
 */
router.get('/:projectId/sources', async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        workflowSteps: {
          where: { step: 'research' }
        },
        sourceMaterials: true,
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Extract sources from research step result
    const researchStep = (project.workflowSteps as WorkflowStep[]).find(
      (s: WorkflowStep) => s.step === 'research'
    );
    const sources: Array<{ title: string; excerpt?: string; url?: string }> = [];

    // Add uploaded source materials
    (project.sourceMaterials as SourceMaterial[] | null)?.forEach((sm: SourceMaterial) => {
      sources.push({
        title: sm.filename,
        excerpt: `Uppladdad kallfil (${sm.type})`
      });
    });

    // Try to extract web sources from research result
    if (researchStep?.result) {
      const urlPattern = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g;
      const urls = researchStep.result.match(urlPattern) || [];
      urls.slice(0, 10).forEach((url: string, idx: number) => {
        sources.push({
          title: `Webb-kalla ${idx + 1}`,
          url: url,
          excerpt: url.includes('wikipedia') ? 'Wikipedia' :
                   url.includes('harvard') ? 'Harvard Business Review' :
                   url.includes('.gov') ? 'Myndighetskalla' : 'Webbkalla'
        });
      });
    }

    res.json({ sources });

  } catch (error: unknown) {
    const err = error as Error;
    console.error('[Debrief] Sources error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
