import { Router } from 'express';
import prisma from '../db/client';

const router = Router();

// Get all chapters for a project
router.get('/projects/:projectId/chapters', async (req, res, next) => {
  try {
    const chapters = await prisma.chapter.findMany({
      where: { projectId: req.params.projectId },
      include: {
        sessions: {
          include: {
            article: true,
            videoScript: true,
            quiz: {
              include: {
                questions: true,
              },
            },
          },
        },
      },
      orderBy: { number: 'asc' },
    });

    res.json(chapters);
  } catch (error) {
    next(error);
  }
});

// Create chapter
router.post('/projects/:projectId/chapters', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { number, name, description, interactiveActivity } = req.body;

    const chapter = await prisma.chapter.create({
      data: {
        projectId,
        number,
        name,
        description,
        interactiveActivity,
      },
    });

    res.status(201).json(chapter);
  } catch (error) {
    next(error);
  }
});

// Create session
router.post('/chapters/:chapterId/sessions', async (req, res, next) => {
  try {
    const { chapterId } = req.params;
    const { number, name, description, wiifm } = req.body;

    const session = await prisma.session.create({
      data: {
        chapterId,
        number,
        name,
        description,
        wiifm,
      },
    });

    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
});

// Get article
router.get('/articles/:articleId', async (req, res, next) => {
  try {
    const article = await prisma.article.findUnique({
      where: { id: req.params.articleId },
      include: {
        session: {
          include: {
            chapter: true,
          },
        },
      },
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json(article);
  } catch (error) {
    next(error);
  }
});

// Update article
router.patch('/articles/:articleId', async (req, res, next) => {
  try {
    const article = await prisma.article.update({
      where: { id: req.params.articleId },
      data: req.body,
    });

    res.json(article);
  } catch (error) {
    next(error);
  }
});

// Get program matrix
router.get('/projects/:projectId/matrix', async (req, res, next) => {
  try {
    const matrix = await prisma.programMatrix.findFirst({
      where: { projectId: req.params.projectId },
    });

    if (!matrix) {
      return res.status(404).json({ error: 'Program matrix not found' });
    }

    res.json(matrix);
  } catch (error) {
    next(error);
  }
});

// Export project content
router.get('/projects/:projectId/export', async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.projectId },
      include: {
        programMatrix: true,
        chapters: {
          include: {
            sessions: {
              include: {
                article: true,
                videoScript: true,
                quiz: {
                  include: {
                    questions: true,
                  },
                },
              },
            },
          },
          orderBy: { number: 'asc' },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Format as markdown document
    let markdown = `# ${project.name}\n\n`;
    markdown += `**Language:** ${project.language}\n`;
    markdown += `**Created:** ${project.createdAt.toISOString()}\n\n`;

    if (project.programMatrix) {
      markdown += `## Program Matrix\n\n`;
      markdown += `${project.programMatrix.overview}\n\n`;
    }

    for (const chapter of project.chapters) {
      markdown += `\n## Chapter ${chapter.number}: ${chapter.name}\n\n`;
      markdown += `${chapter.description}\n\n`;

      for (const session of chapter.sessions) {
        markdown += `\n### Session ${session.number}: ${session.name}\n\n`;
        markdown += `**Learning Objective:** ${session.wiifm}\n\n`;

        if (session.article) {
          markdown += `${session.article.content}\n\n`;
          markdown += `---\n`;
          markdown += `Word count: ${session.article.wordCount}\n\n`;
        }

        if (session.videoScript) {
          markdown += `\n#### Video Script\n\n`;
          markdown += `${session.videoScript.content}\n\n`;
        }

        if (session.quiz) {
          markdown += `\n#### Quiz\n\n`;
          for (const question of session.quiz.questions) {
            markdown += `**Q:** ${question.question}\n`;
            markdown += `a) ${question.optionA}\n`;
            markdown += `b) ${question.optionB}\n`;
            markdown += `c) ${question.optionC}\n`;
            markdown += `**Answer:** ${question.correctAnswer}\n\n`;
          }
        }
      }
    }

    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="${project.name}.md"`);
    res.send(markdown);
  } catch (error) {
    next(error);
  }
});

export default router;
