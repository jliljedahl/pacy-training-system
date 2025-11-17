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

// Batch generate ALL articles for ALL chapters
router.get('/projects/:projectId/articles/batch-all', async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Set up SSE for real-time progress
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendProgress = (message: string) => {
      try {
        res.write(`data: ${JSON.stringify({ type: 'progress', message })}\n\n`);
      } catch (writeError) {
        console.error('Failed to send progress message:', writeError);
      }
    };

    try {
      sendProgress('🚀 Starting batch generation...');
      console.log(`[Batch Articles] Starting batch generation for project ${projectId}`);
      
      const result = await workflowEngineOptimized.executeBatchAllArticlesCreation({
        projectId,
        phase: 'article_creation',
        onProgress: sendProgress,
      });

      console.log(`[Batch Articles] Completed: ${result.created || 0} created, ${result.failed || 0} failed`);
      sendProgress(`✅ Batch generation completed! Created ${result.created || 0} articles, ${result.failed || 0} failed.`);
      res.write(`data: ${JSON.stringify({ type: 'complete', result })}\n\n`);
      res.end();
    } catch (error: any) {
      console.error('[Batch Articles] Fatal error:', {
        message: error.message,
        stack: error.stack,
        projectId,
        errorType: error.constructor?.name,
        errorStatus: error.status,
        errorCode: error.code,
      });
      
      const errorMessage = error.message || 'Unknown error occurred during batch generation';
      const errorStack = error.stack ? `\n\nStack: ${error.stack.substring(0, 500)}` : '';
      
      try {
        sendProgress(`❌ Batch generation failed: ${errorMessage}${errorStack}`);
        res.write(`data: ${JSON.stringify({ type: 'error', message: errorMessage, details: errorStack })}\n\n`);
        res.end();
      } catch (sendError) {
        console.error('[Batch Articles] Failed to send error to client:', sendError);
        // Connection might be closed, try to end response
        try {
          res.end();
        } catch (e) {
          // Ignore
        }
      }
    }
  } catch (error) {
    next(error);
  }
});

// Batch generate articles for a chapter
router.get('/chapters/:chapterId/articles/batch', async (req, res, next) => {
  try {
    const { chapterId } = req.params;

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { project: true },
    });

    if (!chapter) {
      return res.status(404).json({ error: 'Chapter not found' });
    }

    // Set up SSE for real-time progress
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendProgress = (message: string) => {
      res.write(`data: ${JSON.stringify({ type: 'progress', message })}\n\n`);
    };

    try {
      const result = await workflowEngineOptimized.executeBatchArticleCreation(
        {
          projectId: chapter.projectId,
          phase: 'article_creation',
          onProgress: sendProgress,
        },
        chapterId
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

// Batch generate ALL video scripts
router.get('/projects/:projectId/videos/batch', async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendProgress = (message: string) => {
      res.write(`data: ${JSON.stringify({ type: 'progress', message })}\n\n`);
    };

    try {
      const result = await workflowEngineOptimized.executeBatchVideoCreation({
        projectId,
        phase: 'video_creation',
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

// Create test session: article + video + quiz in sequence
router.get('/sessions/:sessionId/test-session', async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { chapter: true },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

    const sendProgress = (message: string) => {
      try {
        res.write(`data: ${JSON.stringify({ type: 'progress', message })}\n\n`);
      } catch (error) {
        console.error('Error sending progress:', error);
      }
    };

    // Send initial connection message
    sendProgress('🔌 Connected. Starting test session...');

    try {
      const results: any = {};

      // Step 1: Create article
      sendProgress('📝 Step 1/3: Creating article...');
      const articleResult = await workflowEngineOptimized.executeArticleCreation(
        {
          projectId: session.chapter.projectId,
          phase: 'article_creation',
          onProgress: sendProgress,
        },
        sessionId,
        false
      );
      results.article = articleResult;
      sendProgress('✅ Article created!');

      // Step 2: Create video script
      sendProgress('🎬 Step 2/3: Creating video script...');
      const videoResult = await workflowEngineOptimized.executeVideoCreation(
        {
          projectId: session.chapter.projectId,
          phase: 'video_creation',
          onProgress: sendProgress,
        },
        sessionId
      );
      results.video = videoResult;
      sendProgress('✅ Video script created!');

      // Step 3: Create quiz
      sendProgress('🎯 Step 3/3: Creating quiz...');
      const project = await prisma.project.findUnique({
        where: { id: session.chapter.projectId },
      });
      const quizResult = await workflowEngineOptimized.executeQuizCreation(
        {
          projectId: session.chapter.projectId,
          phase: 'quiz_creation',
          onProgress: sendProgress,
        },
        sessionId,
        project?.quizQuestions || 3
      );
      results.quiz = quizResult;
      sendProgress('✅ Quiz created!');

      sendProgress('🎉 Test session complete! All content created.');

      res.write(`data: ${JSON.stringify({ type: 'complete', result: results })}\n\n`);
      res.end();
    } catch (error: any) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
      res.end();
    }
  } catch (error) {
    next(error);
  }
});

// Save feedback for article, video, or quiz
router.post('/feedback/:type/:id', async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const { feedback } = req.body;

    let result;
    if (type === 'article') {
      result = await prisma.article.update({
        where: { id },
        data: { feedback },
      });
    } else if (type === 'video') {
      result = await prisma.videoScript.update({
        where: { id },
        data: { feedback },
      });
    } else if (type === 'quiz') {
      result = await prisma.quiz.update({
        where: { id },
        data: { feedback },
      });
    } else {
      return res.status(400).json({ error: 'Invalid type. Use: article, video, or quiz' });
    }

    res.json({ message: 'Feedback saved', result });
  } catch (error) {
    next(error);
  }
});

// Update content (article, video, or quiz) with manual edits
router.patch('/content/:type/:id', async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const { content, wordCount } = req.body;

    let result;
    if (type === 'article') {
      result = await prisma.article.update({
        where: { id },
        data: {
          content,
          wordCount: wordCount || content.split(/\s+/).filter((w: string) => w.length > 0).length,
          updatedAt: new Date(),
        },
      });
    } else if (type === 'video') {
      result = await prisma.videoScript.update({
        where: { id },
        data: {
          content,
          wordCount: wordCount || content.split(/\s+/).filter((w: string) => w.length > 0).length,
          updatedAt: new Date(),
        },
      });
    } else {
      return res.status(400).json({ error: 'Invalid type. Use: article or video' });
    }

    res.json({ message: 'Content updated', result });
  } catch (error) {
    next(error);
  }
});

// Update quiz questions
router.patch('/quizzes/:quizId/questions', async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const { questions } = req.body;

    // Delete old questions
    await prisma.quizQuestion.deleteMany({
      where: { quizId },
    });

    // Create new questions
    for (const q of questions) {
      await prisma.quizQuestion.create({
        data: {
          quizId,
          question: q.question,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          correctAnswer: q.correctAnswer,
        },
      });
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });

    res.json({ message: 'Quiz questions updated', quiz });
  } catch (error) {
    next(error);
  }
});

// Batch generate chapter: article + video + quiz for all sessions in a chapter
router.get('/chapters/:chapterId/batch-complete', async (req, res, next) => {
  try {
    const { chapterId } = req.params;

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        project: true,
        sessions: {
          include: {
            article: true,
            videoScript: true,
            quiz: true,
          },
          orderBy: { number: 'asc' },
        },
      },
    });

    if (!chapter) {
      return res.status(404).json({ error: 'Chapter not found' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendProgress = (message: string) => {
      res.write(`data: ${JSON.stringify({ type: 'progress', message })}\n\n`);
    };

    try {
      // Get feedback from first session (if exists) to apply to all
      const firstSession = chapter.sessions[0];
      const articleFeedback = firstSession?.article?.feedback;
      const videoFeedback = firstSession?.videoScript?.feedback;
      const quizFeedback = firstSession?.quiz?.feedback;

      const results = [];

      for (let i = 0; i < chapter.sessions.length; i++) {
        const session = chapter.sessions[i];
        
        sendProgress(`📚 [${i + 1}/${chapter.sessions.length}] Processing Session ${session.number}: ${session.name}...`);

        const sessionResult: any = { sessionId: session.id, sessionNumber: session.number };

        // Create article if missing
        if (!session.article) {
          sendProgress(`  📝 Creating article...`);
          try {
            const articleResult = await workflowEngineOptimized.executeArticleCreation(
              {
                projectId: chapter.projectId,
                phase: 'article_creation',
                onProgress: sendProgress,
              },
              session.id,
              false
            );
            sessionResult.article = articleResult;
            
            // Apply feedback if available
            if (articleFeedback) {
              await prisma.article.update({
                where: { sessionId: session.id },
                data: { feedback: articleFeedback },
              });
            }
          } catch (error: any) {
            sessionResult.articleError = error.message;
          }
        }

        // Create video if article exists and video missing
        if (session.article && !session.videoScript) {
          sendProgress(`  🎬 Creating video script...`);
          try {
            const videoResult = await workflowEngineOptimized.executeVideoCreation(
              {
                projectId: chapter.projectId,
                phase: 'video_creation',
                onProgress: sendProgress,
              },
              session.id
            );
            sessionResult.video = videoResult;
            
            // Apply feedback if available
            if (videoFeedback) {
              await prisma.videoScript.update({
                where: { sessionId: session.id },
                data: { feedback: videoFeedback },
              });
            }
          } catch (error: any) {
            sessionResult.videoError = error.message;
          }
        }

        // Create quiz if article exists and quiz missing
        if (session.article && !session.quiz) {
          sendProgress(`  🎯 Creating quiz...`);
          try {
            const quizResult = await workflowEngineOptimized.executeQuizCreation(
              {
                projectId: chapter.projectId,
                phase: 'quiz_creation',
                onProgress: sendProgress,
              },
              session.id,
              chapter.project.quizQuestions || 3
            );
            sessionResult.quiz = quizResult;
            
            // Apply feedback if available
            if (quizFeedback) {
              await prisma.quiz.update({
                where: { sessionId: session.id },
                data: { feedback: quizFeedback },
              });
            }
          } catch (error: any) {
            sessionResult.quizError = error.message;
          }
        }

        results.push(sessionResult);
        
        // Delay between sessions
        if (i < chapter.sessions.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      sendProgress(`✅ Chapter batch generation complete!`);

      res.write(`data: ${JSON.stringify({ type: 'complete', result: { chapterId, results } })}\n\n`);
      res.end();
    } catch (error: any) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
      res.end();
    }
  } catch (error) {
    next(error);
  }
});

// Create single video script
router.get('/sessions/:sessionId/video', async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { chapter: true },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendProgress = (message: string) => {
      res.write(`data: ${JSON.stringify({ type: 'progress', message })}\n\n`);
    };

    try {
      const result = await workflowEngineOptimized.executeVideoCreation(
        {
          projectId: session.chapter.projectId,
          phase: 'video_creation',
          onProgress: sendProgress,
        },
        sessionId
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

// Approve video script
router.post('/videos/:videoId/approve', async (req, res, next) => {
  try {
    const { videoId } = req.params;

    const video = await prisma.videoScript.update({
      where: { id: videoId },
      data: { approved: true, approvedAt: new Date() },
    });

    res.json(video);
  } catch (error) {
    next(error);
  }
});

// Batch generate ALL quizzes
router.get('/projects/:projectId/quizzes/batch', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const numQuestions = req.query.numQuestions ? parseInt(req.query.numQuestions as string) : undefined;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendProgress = (message: string) => {
      res.write(`data: ${JSON.stringify({ type: 'progress', message })}\n\n`);
    };

    try {
      const result = await workflowEngineOptimized.executeBatchQuizCreation(
        {
          projectId,
          phase: 'quiz_creation',
          onProgress: sendProgress,
        },
        numQuestions
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

// Create single quiz
router.get('/sessions/:sessionId/quiz', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const numQuestions = req.query.numQuestions ? parseInt(req.query.numQuestions as string) : 3;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { chapter: true },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendProgress = (message: string) => {
      res.write(`data: ${JSON.stringify({ type: 'progress', message })}\n\n`);
    };

    try {
      const result = await workflowEngineOptimized.executeQuizCreation(
        {
          projectId: session.chapter.projectId,
          phase: 'quiz_creation',
          onProgress: sendProgress,
        },
        sessionId,
        numQuestions
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

// Approve quiz
router.post('/quizzes/:quizId/approve', async (req, res, next) => {
  try {
    const { quizId } = req.params;

    const quiz = await prisma.quiz.update({
      where: { id: quizId },
      data: { approved: true, approvedAt: new Date() },
    });

    res.json(quiz);
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
