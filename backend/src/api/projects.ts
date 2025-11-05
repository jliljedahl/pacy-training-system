import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import prisma from '../db/client';
import { UploadedFile } from 'express-fileupload';
const pdfParse = require('pdf-parse');
import mammoth from 'mammoth';

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
        return res.status(400).json({ error: 'Unsupported file type. Please upload PDF, DOCX, or TXT' });
      }
    } catch (parseError) {
      console.error('File parsing error:', parseError);
      return res.status(500).json({ error: 'Failed to read document content' });
    }

    if (!briefText || briefText.trim().length === 0) {
      return res.status(400).json({ error: 'Document appears to be empty or could not be read' });
    }

    console.log(`📄 Extracted ${briefText.length} characters from ${briefFile.name}`);

    // Invoke source-analyst with the actual document content
    const { agentOrchestrator } = require('../services/agentOrchestrator');

    const briefParsingPrompt = `
MODE: CLIENT BRIEF PARSER

⚠️ DOCUMENT CONTENT PROVIDED BELOW ⚠️

You are analyzing a client brief document. The full text content is provided below.

Extract project information and return ONLY valid JSON in the specified format.

DOCUMENT CONTENT:
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

    const result = await agentOrchestrator.invokeAgent(
      'source-analyst',
      briefParsingPrompt
    );

    // Parse the JSON response
    let extractedData;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = result.match(/```json\s*([\s\S]*?)\s*```/) || result.match(/```\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : result;
      extractedData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse agent response as JSON:', result);
      return res.status(500).json({
        error: 'Failed to parse brief',
        details: 'Agent response was not valid JSON',
        rawResponse: result.substring(0, 500)
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
