import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import prisma from '../db/client';
import { UploadedFile } from 'express-fileupload';
import mammoth from 'mammoth';
const pdfParse = require('pdf-parse');

const router = Router();

// Get all projects (filtered by user if authenticated)
router.get('/', async (req, res, _next) => {
  try {
    console.log('[GET /api/projects] Fetching projects...');

    // First, check database connection
    await prisma.$connect();

    // Filter by user if authenticated
    const whereClause = req.user ? { userId: req.user.id } : {};

    const projects = await prisma.project.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
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
                aiExercise: true,
              },
              orderBy: { number: 'asc' },
            },
          },
          orderBy: { number: 'asc' },
        },
      },
    });
    console.log(
      `[GET /api/projects] Found ${projects.length} projects for user ${req.user?.id || 'anonymous'}`
    );
    res.json(projects);
  } catch (error: any) {
    console.error('[GET /api/projects] Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
    });
    res.status(500).json({
      error: 'Failed to fetch projects',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { details: error.stack }),
    });
  }
});

// Get single project
router.get('/:id', async (req, res, next) => {
  try {
    const projectId = req.params.id;
    console.log(`[GET /api/projects/:id] Fetching project ${projectId}...`);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
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
                aiExercise: true,
              },
              orderBy: { number: 'asc' },
            },
          },
          orderBy: { number: 'asc' },
        },
        workflowSteps: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!project) {
      console.log(`[GET /api/projects/:id] Project ${projectId} not found`);
      return res.status(404).json({ error: 'Project not found' });
    }

    console.log(
      `[GET /api/projects/:id] Project ${projectId} found with ${project.chapters.length} chapters`
    );
    res.json(project);
  } catch (error: any) {
    console.error(`[GET /api/projects/:id] Error for project ${req.params.id}:`, {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    next(error);
  }
});

// Parse client brief (extract project info from uploaded document)
router.post('/parse-brief', async (req, res, next) => {
  try {
    if (!req.files || !req.files.brief) {
      return res.status(400).json({ error: 'No brief file uploaded' });
    }

    const briefFile = req.files.brief as UploadedFile;
    const ext = path.extname(briefFile.name).toLowerCase();

    // Read file content directly in backend
    let briefText = '';

    try {
      if (ext === '.pdf') {
        // Parse PDF
        const pdfData = await pdfParse(briefFile.data);
        briefText = pdfData.text;
      } else if (ext === '.docx' || ext === '.doc') {
        // Parse DOCX
        const result = await mammoth.extractRawText({ buffer: briefFile.data });
        briefText = result.value;
      } else if (ext === '.txt') {
        // Plain text
        briefText = briefFile.data.toString('utf-8');
      } else {
        return res
          .status(400)
          .json({ error: 'Unsupported file type. Please upload PDF, DOCX, or TXT' });
      }
    } catch (parseError) {
      console.error('File parsing error:', parseError);
      return res.status(500).json({ error: 'Failed to read document content' });
    }

    if (!briefText || briefText.trim().length === 0) {
      return res.status(400).json({ error: 'Document appears to be empty or could not be read' });
    }

    console.log(`📄 Extracted ${briefText.length} characters from ${briefFile.name}`);

    // Invoke content-architect with the actual document content
    const { agentOrchestrator } = require('../services/agentOrchestrator');

    const briefParsingPrompt = `
MODE: CLIENT BRIEF INTERPRETATION

⚠️ DOCUMENT CONTENT PROVIDED BELOW ⚠️

You are analyzing a client brief document to understand their training requirements. The full text content is provided below.

Extract project information and return ONLY valid JSON in the specified format.

CLIENT BRIEF DOCUMENT:
---
${briefText}
---

Extract these fields FROM THE DOCUMENT ABOVE:
- Project Name/Topic
- Learning Objectives
- Target Audience
- Desired Outcomes
- Deliverables (articles, videos, quizzes, etc.)
- Number of Chapters (if specified)
- Constraints (timeline, budget, must-include topics)
- Particular Angle or Framework
- Language (swedish/english)

Return ONLY valid JSON (no preamble, no explanation):

\`\`\`json
{
  "extracted": {
    "projectName": "extracted name or [NEEDS INPUT]",
    "learningObjectives": "extracted objectives or [NEEDS INPUT]",
    "targetAudience": "extracted audience or [NEEDS INPUT]",
    "desiredOutcomes": "extracted outcomes or [NEEDS INPUT]",
    "deliverables": "articles",
    "numChapters": null,
    "constraints": null,
    "particularAngle": null,
    "language": "swedish",
    "strictFidelity": false
  },
  "confidence": {
    "projectName": "high",
    "learningObjectives": "high",
    "targetAudience": "high",
    "desiredOutcomes": "high"
  },
  "notes": [],
  "needsHumanInput": []
}
\`\`\`
`;

    const result = await agentOrchestrator.invokeAgent('content-architect', briefParsingPrompt);

    // Parse the JSON response
    let extractedData;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch =
        result.match(/```json\s*([\s\S]*?)\s*```/) || result.match(/```\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : result;
      extractedData = JSON.parse(jsonString);
    } catch {
      console.error('Failed to parse agent response as JSON:', result);
      return res.status(500).json({
        error: 'Failed to parse brief',
        details: 'Agent response was not valid JSON',
        rawResponse: result.substring(0, 500),
      });
    }

    res.json(extractedData);
  } catch (error) {
    next(error);
  }
});

// Create new project
router.post('/', async (req, res, next) => {
  try {
    // Require authentication for creating projects
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required to create projects' });
    }

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
      companyName,
      companyUrl,
      companyContext,
    } = req.body;

    const project = await prisma.project.create({
      data: {
        userId: req.user.id,
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
        companyName,
        companyUrl,
        // Stringify companyContext if it's an object
        companyContext: companyContext ? JSON.stringify(companyContext) : null,
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
