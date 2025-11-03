import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import prisma from '../db/client';
import { UploadedFile } from 'express-fileupload';

const router = Router();

// Get all projects
router.get('/', async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        sourceMaterials: true,
        programMatrix: true,
        chapters: {
          include: {
            sessions: true,
          },
        },
      },
    });
    res.json(projects);
  } catch (error) {
    next(error);
  }
});

// Get single project
router.get('/:id', async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        sourceMaterials: true,
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
        },
        workflowSteps: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    next(error);
  }
});

// Create new project
router.post('/', async (req, res, next) => {
  try {
    const {
      name,
      learningObjectives,
      targetAudience,
      desiredOutcomes,
      constraints,
      particularAngle,
      deliverables,
      numChapters,
      strictFidelity,
      quizQuestions,
      language,
    } = req.body;

    const project = await prisma.project.create({
      data: {
        name,
        status: 'information_gathering',
        language: language || 'swedish',
        learningObjectives,
        targetAudience,
        desiredOutcomes,
        constraints,
        particularAngle,
        deliverables: deliverables || 'articles',
        numChapters,
        strictFidelity: strictFidelity || false,
        quizQuestions: quizQuestions || 3,
      },
    });

    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
});

// Update project
router.patch('/:id', async (req, res, next) => {
  try {
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: req.body,
    });

    res.json(project);
  } catch (error) {
    next(error);
  }
});

// Upload source material
router.post('/:id/source-materials', async (req, res, next) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.files.file as UploadedFile;
    const { type } = req.body; // 'strict_fidelity' or 'context'

    // Create unique filename
    const fileId = uuidv4();
    const ext = path.extname(file.name);
    const filename = `${fileId}${ext}`;
    const uploadDir = path.resolve(process.env.UPLOAD_DIR || '../uploads');
    const filepath = path.join(uploadDir, filename);

    // Ensure upload directory exists
    await fs.mkdir(uploadDir, { recursive: true });

    // Save file
    await file.mv(filepath);

    // Save to database
    const sourceMaterial = await prisma.sourceMaterial.create({
      data: {
        projectId: req.params.id,
        filename: file.name,
        filepath: filename,
        mimetype: file.mimetype,
        size: file.size,
        type: type || 'context',
      },
    });

    res.status(201).json(sourceMaterial);
  } catch (error) {
    next(error);
  }
});

// Delete project
router.delete('/:id', async (req, res, next) => {
  try {
    // Delete associated source files
    const sourceMaterials = await prisma.sourceMaterial.findMany({
      where: { projectId: req.params.id },
    });

    const uploadDir = path.resolve(process.env.UPLOAD_DIR || '../uploads');
    for (const material of sourceMaterials) {
      const filepath = path.join(uploadDir, material.filepath);
      try {
        await fs.unlink(filepath);
      } catch (err) {
        console.error(`Failed to delete file: ${filepath}`, err);
      }
    }

    // Delete project (cascades to all related data)
    await prisma.project.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
