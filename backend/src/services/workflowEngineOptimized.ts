import { agentOrchestrator } from './agentOrchestrator';
import prisma from '../db/client';

export type WorkflowPhase =
  | 'information_gathering'
  | 'program_design'
  | 'article_creation'
  | 'video_creation'
  | 'quiz_creation'
  | 'completed';

export interface WorkflowContext {
  projectId: string;
  phase: WorkflowPhase;
  onProgress?: (message: string) => void;
}

export class WorkflowEngineOptimized {
  /**
   * OPTIMIZED Phase 1: Program Design
   * Uses fewer agents, only when needed
   */
  async executeProgramDesign(context: WorkflowContext): Promise<any> {
    const { projectId, onProgress } = context;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { sourceMaterials: true },
    });

    if (!project) throw new Error('Project not found');

    onProgress?.('📋 Starting Optimized Program Design...');

    // COMBINED STEP: Research + Source Analysis + Architecture + Program Matrix
    // All done by Content Architect who coordinates as needed
    const designStep = await this.createWorkflowStep(
      projectId,
      'program_design',
      'create_program_matrix',
      'content-architect'
    );

    const designPrompt = `
You are the Content Architect creating a complete HIST training program.

PROJECT: ${project.name}

LEARNING OBJECTIVES:
${project.learningObjectives || 'Not specified'}

TARGET AUDIENCE:
${project.targetAudience || 'Not specified'}

DESIRED OUTCOMES:
${project.desiredOutcomes || 'Not specified'}

PARTICULAR ANGLE/FRAMEWORK:
${project.particularAngle || 'None specified'}

DELIVERABLES REQUESTED:
${project.deliverables}

${project.sourceMaterials.length > 0 ? `
SOURCE MATERIALS PROVIDED:
${project.sourceMaterials.map((m) => `- ${m.filename} (${m.type})`).join('\n')}
Strict Fidelity Required: ${project.strictFidelity}

Note: Analyze these materials and incorporate their insights.
` : 'No source materials provided - base content on research and best practices.'}

YOUR TASK:
Create a complete Program Matrix for approval. This should include:

1. **Brief Research Overview** (200-300 words)
   - Key frameworks and approaches relevant to this topic
   - Current best practices
   - Recommended angle for this audience

${project.sourceMaterials.length > 0 ? `
2. **Source Material Insights** (150-200 words)
   - Key concepts from materials
   - Terminology to use
   - Examples to incorporate
` : ''}

3. **Program Structure**
   - 3-4 Chapters with clear themes
   - 2-6 Sessions per chapter
   - Learning progression rationale

4. **Complete Program Matrix Table**

⚠️ KRITISKT VIKTIGT - FÖLJ DETTA FORMAT EXAKT ⚠️

DU MÅSTE presentera programmatrisen som en MARKDOWN-TABELL.
INGEN annan text förutom Research Overview och HIST Alignment får finnas utanför tabellen.
ALLA kapitel och sessioner MÅSTE vara i tabellen.

Börja tabellen direkt efter denna rad:

| Kapitel | Session | Detaljerat innehåll | Learning Objective (WIIFM) |
|---------|---------|---------------------|----------------------------|
| **Kapitel 1: [Exakt kapitelnamn]**<br><br>*Tema: [Kort tema-beskrivning]* | **Session 1.1: [Exakt sessionsnamn]**<br><br>[1-2 meningar beskrivning] | • [Punkt 1]<br>• [Punkt 2]<br>• [Punkt 3]<br>• [Punkt 4]<br>• [Punkt 5] | [WIIFM-mening] |
| [SAMMA KAPITEL FORTSÄTTER] | **Session 1.2: [Sessionsnamn]**<br><br>[Beskrivning] | • [Punkt 1]<br>• [Punkt 2]<br>• [Punkt 3]<br>• [Punkt 4]<br>• [Punkt 5] | [WIIFM-mening] |
| **Kapitel 2: [Nästa kapitel]**<br><br>*Tema: [Tema]* | **Session 2.1: [Sessionsnamn]**<br><br>[Beskrivning] | • [Punkt 1]<br>• [Punkt 2]<br>• [Punkt 3]<br>• [Punkt 4]<br>• [Punkt 5] | [WIIFM-mening] |

KONKRET EXEMPEL som du MÅSTE följa:
| Kapitel | Session | Detaljerat innehåll | Learning Objective (WIIFM) |
|---------|---------|---------------------|----------------------------|
| **Kapitel 1: Styrelsens grundläggande ansvar**<br><br>*Tema: Förståelse för styrelsens juridiska och strategiska roll* | **Session 1.1: Styrelsens juridiska ramverk**<br><br>En överblick av bostadsrättslagen och styrelsens formella ansvar | • Bostadsrättslagen paragraf 9:2 - styrelsens uppdrag<br>• Skillnad mellan strategiskt ansvar och operativ ledning<br>• Styrelsens firmateckningsrätt och beslutsmandat<br>• Dokumentationskrav och mötesprotokoll<br>• Personligt ansvar kontra föreningsansvar | Du får full klarhet i vad lagen kräver av dig som styrelseledamot och kan tryggt fatta beslut inom ditt mandat |

REGLER:
- En rad per session (inte per kapitel!)
- Kapitelnamn upprepas ENDAST vid första sessionen i varje kapitel
- Använd <br> för radbrytningar INOM celler
- Exakt 5 innehållspunkter per session
- WIIFM ska vara EN mening, börja inte med "Du kommer att..." - skriv direkt vad användaren får

5. **HIST Alignment**
   - How this structure supports micro-learning
   - Theory-practice balance approach
   - Cognitive load management

${project.deliverables.includes('quiz') || project.deliverables.includes('full_program') ? `
6. **Interactive Activities**
   - Suggest 1 activity per chapter
` : ''}

Keep the entire response focused and under 2000 words. Be specific and actionable.
`;

    const designResult = await agentOrchestrator.invokeAgent(
      'content-architect',
      designPrompt,
      { project },
      onProgress
    );

    await this.completeWorkflowStep(designStep.id, designResult);

    // Save program matrix
    await this.saveProgramMatrix(projectId, designResult);

    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'program_design' },
    });

    onProgress?.('✅ Program Design Complete! Review and approve the matrix.');

    return { programMatrix: designResult };
  }

  /**
   * OPTIMIZED Phase 2: Article Creation
   * Only uses: Content Architect → Article Writer → HIST Compliance → Fact Checker
   * (4 agents instead of 6)
   */
  async executeArticleCreation(
    context: WorkflowContext,
    sessionId: string,
    isFirstArticle: boolean
  ): Promise<any> {
    const { projectId, onProgress } = context;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        chapter: {
          include: {
            project: {
              include: {
                sourceMaterials: true,
                workflowSteps: {
                  where: { phase: 'program_design' },
                },
              },
            },
          },
        },
      },
    });

    if (!session) throw new Error('Session not found');

    const project = session.chapter.project;
    const programDesign = project.workflowSteps.find((s) => s.step === 'create_program_matrix');

    onProgress?.(`📝 Creating article for Session ${session.number}: ${session.name}...`);

    // Step 1: Article Writer
    const writerStep = await this.createWorkflowStep(
      projectId,
      'article_creation',
      `write_article_${sessionId}`,
      'article-writer'
    );

    const writerPrompt = `
Write a HIST-compliant article for:

SESSION ${session.number}: ${session.name}

SESSION DESCRIPTION:
${session.description}

LEARNING OBJECTIVE (WIIFM):
${session.wiifm}

TARGET AUDIENCE:
${project.targetAudience}

${programDesign?.result ? `PROGRAM CONTEXT:\n${programDesign.result.substring(0, 1000)}...\n` : ''}

${project.sourceMaterials.length > 0 ? `
SOURCE MATERIALS: ${project.sourceMaterials.map(m => m.filename).join(', ')}
${project.strictFidelity ? 'STRICT FIDELITY REQUIRED - Follow sources exactly.' : 'Use sources for context and examples.'}
` : ''}

REQUIREMENTS:
- 800-1000 words (STRICT - prefer shorter end)
- Conversational professional tone
- Concrete examples for ${project.targetAudience}
- 30-40% theory, 60-70% practice
- Scannable structure with short paragraphs
- Engaging from start to finish
- Proper source citations in academic format

${isFirstArticle ? '\n⭐ THIS IS THE FIRST ARTICLE - it sets the style for all others.\n' : ''}

Create the complete article now.
`;

    const articleResult = await agentOrchestrator.invokeAgent(
      'article-writer',
      writerPrompt,
      { project, session },
      onProgress
    );

    await this.completeWorkflowStep(writerStep.id, articleResult);

    // Step 2: HIST Compliance Review
    const histStep = await this.createWorkflowStep(
      projectId,
      'article_creation',
      `hist_review_${sessionId}`,
      'hist-compliance-editor'
    );

    const histPrompt = `Review this article for HIST compliance:\n\n${articleResult}`;

    const histReview = await agentOrchestrator.invokeAgent(
      'hist-compliance-editor',
      histPrompt,
      { article: articleResult },
      onProgress
    );

    await this.completeWorkflowStep(histStep.id, histReview);

    // Step 3: Fact Checking
    const factStep = await this.createWorkflowStep(
      projectId,
      'article_creation',
      `fact_check_${sessionId}`,
      'fact-checker'
    );

    const factPrompt = `
Fact-check this article:

${articleResult}

HIST REVIEW:
${histReview}

PROJECT TYPE: ${project.strictFidelity ? 'STRICT FIDELITY' : 'RESEARCH-BASED'}

Verify factual accuracy, source citations, and ${project.strictFidelity ? 'strict fidelity compliance' : 'general accuracy'}.
`;

    const factCheck = await agentOrchestrator.invokeAgent(
      'fact-checker',
      factPrompt,
      { article: articleResult, project },
      onProgress
    );

    await this.completeWorkflowStep(factStep.id, factCheck);

    // Save article
    await prisma.article.create({
      data: {
        sessionId,
        content: articleResult,
        wordCount: this.countWords(articleResult),
        status: 'fact_check',
        histReview,
        factCheck,
        approved: false,
      },
    });

    onProgress?.(
      `✅ Article complete! ${isFirstArticle ? 'Please approve the style before continuing.' : 'Ready for approval.'}`
    );

    return { article: articleResult, histReview, factCheck, isFirstArticle };
  }

  /**
   * OPTIMIZED Phase 3: Video Creation (only if requested)
   */
  async executeVideoCreation(context: WorkflowContext, sessionId: string): Promise<any> {
    const { projectId, onProgress } = context;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { article: true },
    });

    if (!session || !session.article) {
      throw new Error('Article must exist before creating video');
    }

    onProgress?.(`🎬 Creating video script for Session ${session.number}...`);

    const videoStep = await this.createWorkflowStep(
      projectId,
      'video_creation',
      `create_video_${sessionId}`,
      'video-narrator'
    );

    const videoPrompt = `
Create a ~250 word video script based on this article:

SESSION: ${session.name}
ARTICLE:
${session.article.content}

Requirements:
- Exactly 240-260 words
- Conversational, spoken-word style
- Short sentences (10-15 words max)
- Hook → Main Message → Application → Closing
- ONE key insight (not multiple concepts)
`;

    const videoResult = await agentOrchestrator.invokeAgent(
      'video-narrator',
      videoPrompt,
      { session },
      onProgress
    );

    await this.completeWorkflowStep(videoStep.id, videoResult);

    await prisma.videoScript.create({
      data: {
        sessionId,
        content: videoResult,
        wordCount: this.countWords(videoResult),
        approved: false,
      },
    });

    onProgress?.(`✅ Video script complete!`);

    return { videoScript: videoResult };
  }

  /**
   * OPTIMIZED Phase 4: Quiz Creation (only if requested)
   */
  async executeQuizCreation(context: WorkflowContext, sessionId: string, numQuestions: number = 3): Promise<any> {
    const { projectId, onProgress } = context;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { article: true },
    });

    if (!session || !session.article) {
      throw new Error('Article must exist before creating quiz');
    }

    onProgress?.(`🎯 Creating quiz for Session ${session.number}...`);

    const quizStep = await this.createWorkflowStep(
      projectId,
      'quiz_creation',
      `create_quiz_${sessionId}`,
      'assessment-designer'
    );

    const quizPrompt = `
Create ${numQuestions} scenario-based quiz questions for this article:

SESSION: ${session.name}
ARTICLE:
${session.article.content}

Requirements:
- Scenario-based (test understanding, not recall)
- Plausible distractors
- Randomize correct answer placement (a/b/c)
- Output as table: Fråga | a | b | c | Rätt svar
`;

    const quizResult = await agentOrchestrator.invokeAgent(
      'assessment-designer',
      quizPrompt,
      { session },
      onProgress
    );

    await this.completeWorkflowStep(quizStep.id, quizResult);

    // Parse and save quiz (simplified - you'd parse the table properly)
    const quiz = await prisma.quiz.create({
      data: {
        sessionId,
        approved: false,
      },
    });

    onProgress?.(`✅ Quiz complete!`);

    return { quiz: quizResult };
  }

  // Helper methods
  private async createWorkflowStep(projectId: string, phase: string, step: string, agentName: string) {
    return prisma.workflowStep.create({
      data: { projectId, phase, step, agentName, status: 'in_progress' },
    });
  }

  private async completeWorkflowStep(stepId: string, result: string) {
    return prisma.workflowStep.update({
      where: { id: stepId },
      data: { status: 'completed', result, completedAt: new Date() },
    });
  }

  private async saveProgramMatrix(projectId: string, matrixResult: string) {
    // Create ProgramMatrix entry
    await prisma.programMatrix.create({
      data: {
        projectId,
        overview: matrixResult.substring(0, 500),
        researchBasis: 'See workflow steps',
        pedagogicalApproach: 'HIST-based micro-learning',
        histAlignment: 'Optimized for 5-7 min sessions',
        approved: false,
      },
    });

    // Parse chapters and sessions from the matrix result
    // Look for table rows with pattern: | **Kapitel N: Name** | **Session N.M: Name** | ... | ... |
    const tableRegex = /\|\s*\*\*Kapitel\s+(\d+):\s*([^*]+)\*\*[^|]*\|\s*\*\*Session\s+([\d.]+):\s*([^*]+)\*\*\s*<br><br>([^|]*)\|/g;

    const chaptersMap = new Map<number, { name: string; theme: string; sessions: any[] }>();

    let match;
    while ((match = tableRegex.exec(matrixResult)) !== null) {
      const chapterNum = parseInt(match[1]);
      const chapterName = match[2].trim();
      const sessionNum = match[3].trim();
      const sessionName = match[4].trim();
      const sessionDesc = match[5].trim();

      if (!chaptersMap.has(chapterNum)) {
        // Extract theme from the chapter row (usually after <br><br>*Tema: ...)
        const themeMatch = matrixResult.match(new RegExp(`\\*\\*Kapitel\\s+${chapterNum}:[^|]*<br><br>\\*Tema:\\s*([^*]+)\\*`, 'i'));
        const theme = themeMatch ? themeMatch[1].trim() : '';

        chaptersMap.set(chapterNum, {
          name: chapterName,
          theme,
          sessions: [],
        });
      }

      chaptersMap.get(chapterNum)!.sessions.push({
        number: sessionNum,
        name: sessionName,
        description: sessionDesc,
      });
    }

    // Create chapters and sessions in database
    for (const [chapterNum, chapterData] of Array.from(chaptersMap.entries()).sort((a, b) => a[0] - b[0])) {
      const chapter = await prisma.chapter.create({
        data: {
          projectId,
          number: chapterNum,
          name: chapterData.name,
          description: chapterData.theme || `Chapter ${chapterNum} content`,
        },
      });

      // Create sessions for this chapter
      for (const sessionData of chapterData.sessions) {
        await prisma.session.create({
          data: {
            chapterId: chapter.id,
            number: parseFloat(sessionData.number),
            name: sessionData.name,
            description: sessionData.description,
            wiifm: sessionData.description, // Will be extracted properly in future iteration
          },
        });
      }
    }

    console.log(`✅ Created ${chaptersMap.size} chapters with sessions for project ${projectId}`);
  }

  private countWords(text: string): number {
    return text.split(/\s+/).filter((word) => word.length > 0).length;
  }
}

export const workflowEngineOptimized = new WorkflowEngineOptimized();
