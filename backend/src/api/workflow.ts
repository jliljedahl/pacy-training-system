import { Router } from 'express';
import { workflowEngine } from '../services/workflowEngine';
import { workflowEngineOptimized } from '../services/workflowEngineOptimized';
import prisma from '../db/client';

const router = Router();

// Execute program design phase
router.get('/projects/:projectId/design', async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Set up SSE for real-time progress
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendProgress = (message: string) => {
      res.write(`data: ${JSON.stringify({ type: 'progress', message })}\n\n`);
    };

    try {
      // Use optimized workflow (fewer agents, conditional logic)
      const result = await workflowEngineOptimized.executeProgramDesign({
        projectId,
        phase: 'program_design',
        onProgress: sendProgress,
      });

      res.write(`data: ${JSON.stringify({ type: 'complete', result })}\n\n`);
      res.end();
    } catch (error: any) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
      res.end();
    }
  } catch (error) {
    next(error);
  }
});

// Approve program matrix
router.post('/projects/:projectId/approve-matrix', async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Update program matrix as approved
    const matrix = await prisma.programMatrix.findFirst({
      where: { projectId },
    });

    if (!matrix) {
      return res.status(404).json({ error: 'Program matrix not found' });
    }

    await prisma.programMatrix.update({
      where: { id: matrix.id },
      data: {
        approved: true,
        approvedAt: new Date(),
      },
    });

    // Update project status
    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'article_creation' },
    });

    res.json({ message: 'Program matrix approved', matrix });
  } catch (error) {
    next(error);
  }
});

// Create article for session
router.get('/sessions/:sessionId/article', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const isFirstArticle = req.query.isFirstArticle === 'true';

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { chapter: true },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Set up SSE for real-time progress
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendProgress = (message: string) => {
      res.write(`data: ${JSON.stringify({ type: 'progress', message })}\n\n`);
    };

    try {
      // Use optimized workflow
      const result = await workflowEngineOptimized.executeArticleCreation(
        {
          projectId: session.chapter.projectId,
          phase: 'article_creation',
          onProgress: sendProgress,
        },
        sessionId,
        isFirstArticle || false
      );

      res.write(`data: ${JSON.stringify({ type: 'complete', result })}\n\n`);
      res.end();
    } catch (error: any) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
      res.end();
    }
  } catch (error) {
    next(error);
  }
});

// Approve article
router.post('/articles/:articleId/approve', async (req, res, next) => {
  try {
    const { articleId } = req.params;

    const article = await prisma.article.update({
      where: { id: articleId },
      data: {
        approved: true,
        approvedAt: new Date(),
        status: 'approved',
      },
    });

    res.json({ message: 'Article approved', article });
  } catch (error) {
    next(error);
  }
});

// Request article revision
router.post('/articles/:articleId/revise', async (req, res, next) => {
  try {
    const { articleId } = req.params;
    const { feedback } = req.body;

    const article = await prisma.article.update({
      where: { id: articleId },
      data: {
        status: 'revision_needed',
        factCheck: feedback, // Store revision feedback
      },
    });

    res.json({ message: 'Article marked for revision', article });
  } catch (error) {
    next(error);
  }
});

// Get workflow progress
router.get('/projects/:projectId/progress', async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const steps = await prisma.workflowStep.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    res.json({
      project,
      steps,
      summary: {
        total: steps.length,
        completed: steps.filter((s) => s.status === 'completed').length,
        inProgress: steps.filter((s) => s.status === 'in_progress').length,
        failed: steps.filter((s) => s.status === 'failed').length,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
