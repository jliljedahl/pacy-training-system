import { Router } from 'express';
import { getStreamingCompletion, ChatMessage } from '../lib/aiProvider';
import { readFile } from 'fs/promises';
import path from 'path';

const router = Router();

// Store conversation history per session (in-memory, consider Redis for production)
const conversations = new Map<string, Array<{ role: 'user' | 'assistant'; content: string }>>();

/**
 * Load the brief-interviewer agent prompt
 */
async function getInterviewerPrompt(): Promise<string> {
  const agentPath = path.resolve(__dirname, '../../../.claude/agents/brief-interviewer.md');
  const content = await readFile(agentPath, 'utf-8');
  // Extract content after the frontmatter (after second ---)
  const parts = content.split('---');
  return parts.length >= 3 ? parts.slice(2).join('---').trim() : content;
}

/**
 * POST /api/interview/chat
 * Streaming chat endpoint for the brief interview
 */
router.post('/chat', async (req, res, next) => {
  try {
    const { sessionId, message, companyContext, isInitial } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    // Get or create conversation history
    if (!conversations.has(sessionId)) {
      conversations.set(sessionId, []);

      // If company context provided, add it as initial context
      if (companyContext) {
        const contextMessage = `COMPANY CONTEXT (from website analysis):
${JSON.stringify(companyContext, null, 2)}

Use this context to personalize your questions. Reference the company name, industry, and suggested training angles when relevant.`;

        conversations.get(sessionId)!.push({
          role: 'user',
          content: contextMessage,
        });
      }
    }

    const history = conversations.get(sessionId)!;

    // Add user message (unless it's the initial "start" message)
    if (!isInitial && message) {
      history.push({ role: 'user', content: message });
    } else if (isInitial) {
      // For initial message, prompt the agent to start
      history.push({ role: 'user', content: 'Hej! Starta intervjun.' });
    }

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // Get system prompt
    const systemPrompt = await getInterviewerPrompt();

    // Stream response from OpenAI
    const result = await getStreamingCompletion({
      agentName: 'brief-interviewer',
      systemPrompt,
      messages: history as ChatMessage[],
      maxTokens: 1024,
      onChunk: (text) => {
        res.write(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`);
      },
    });

    const fullResponse = result.content;

    // Store assistant response in history
    history.push({ role: 'assistant', content: fullResponse });

    // Check if interview is complete (agent outputs JSON with status: complete)
    if (fullResponse.includes('"status"') && fullResponse.includes('"complete"')) {
      try {
        const jsonMatch = fullResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          const briefData = JSON.parse(jsonMatch[1]);
          res.write(`data: ${JSON.stringify({ type: 'complete', brief: briefData })}\n\n`);
        }
      } catch {
        // JSON parsing failed, interview continues
      }
    }

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (error: any) {
    console.error('[Interview] Chat error:', error.message);

    // If headers already sent, end the stream with error
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
      res.end();
    } else {
      next(error);
    }
  }
});

/**
 * DELETE /api/interview/session/:sessionId
 * Clear a session's conversation history
 */
router.delete('/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  conversations.delete(sessionId);
  res.json({ success: true });
});

/**
 * GET /api/interview/session/:sessionId
 * Get session info (for debugging)
 */
router.get('/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const history = conversations.get(sessionId);

  if (!history) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json({
    sessionId,
    messageCount: history.length,
    // Don't expose full history for privacy
  });
});

export default router;
