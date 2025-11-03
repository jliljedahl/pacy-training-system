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

export class WorkflowEngine {
  /**
   * Phase 1: Program Design
   * Research → Source Analysis → Knowledge Architecture → Program Matrix
   */
  async executeProgramDesign(context: WorkflowContext): Promise<any> {
    const { projectId, onProgress } = context;

    // Get project data
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { sourceMaterials: true },
    });

    if (!project) throw new Error('Project not found');

    onProgress?.('📋 Starting Program Design Phase...');

    // Step 1: Research Director
    const researchStep = await this.createWorkflowStep(
      projectId,
      'program_design',
      'research_topic',
      'research-director'
    );

    const researchPrompt = `
Research the topic: ${project.name}

Learning Objectives:
${project.learningObjectives || 'Not specified'}

Target Audience:
${project.targetAudience || 'Not specified'}

Particular Angle/Framework:
${project.particularAngle || 'No specific angle'}

Provide a comprehensive research report including:
- Overview of intellectual landscape
- Key frameworks and approaches
- Schools of thought
- Practical applications
- Recommended content angles
- Key sources with proper citations
`;

    const researchResult = await agentOrchestrator.invokeAgent(
      'research-director',
      researchPrompt,
      { project },
      onProgress
    );

    await this.completeWorkflowStep(researchStep.id, researchResult);

    // Step 2: Source Analysis (if materials provided)
    let sourceAnalysis = null;
    if (project.sourceMaterials.length > 0) {
      const sourceStep = await this.createWorkflowStep(
        projectId,
        'program_design',
        'analyze_sources',
        'source-analyst'
      );

      const sourcePrompt = `
Analyze the provided source materials for project: ${project.name}

Source Materials:
${project.sourceMaterials.map((m) => `- ${m.filename} (${m.type})`).join('\n')}

Strict Fidelity Required: ${project.strictFidelity}

Provide a source analysis report including:
- Material classification (strict fidelity vs context)
- Fidelity rules for content creators
- Key business context
- Terminology and language guidelines
- Extracted concepts
- Concrete examples bank
- Mapping to learning objectives
`;

      sourceAnalysis = await agentOrchestrator.invokeAgent(
        'source-analyst',
        sourcePrompt,
        { project },
        onProgress
      );

      await this.completeWorkflowStep(sourceStep.id, sourceAnalysis);
    }

    // Step 3: Knowledge Architecture (Topic Expert + Instructional Designer collaboration)
    const architectureStep = await this.createWorkflowStep(
      projectId,
      'program_design',
      'design_architecture',
      'topic-expert'
    );

    const architecturePrompt = `
Design the knowledge architecture for: ${project.name}

Research Findings:
${researchResult}

${sourceAnalysis ? `Source Analysis:\n${sourceAnalysis}\n` : ''}

Learning Objectives:
${project.learningObjectives || 'Not specified'}

Target Audience:
${project.targetAudience || 'Not specified'}

Provide a complete knowledge architecture including:
- Proposed chapter structure (3-4 chapters typically)
- Session breakdown (2-8 sessions per chapter)
- Knowledge progression rationale
- Critical dependencies
- Completeness check

Work collaboratively with the Instructional Designer to ensure both subject-matter accuracy and pedagogical effectiveness.
`;

    const architectureResult = await agentOrchestrator.invokeAgent(
      'topic-expert',
      architecturePrompt,
      { project, researchResult, sourceAnalysis },
      onProgress
    );

    await this.completeWorkflowStep(architectureStep.id, architectureResult);

    // Step 4: Instructional Design
    const instructionalStep = await this.createWorkflowStep(
      projectId,
      'program_design',
      'instructional_design',
      'instructional-designer'
    );

    const instructionalPrompt = `
Design the learning experience for: ${project.name}

Knowledge Architecture:
${architectureResult}

Provide a learning design including:
- Pedagogical approach and rationale
- Scaffolding strategy
- Chapter design rationale with session distribution (2-8 per chapter)
- Cognitive load management
- Engagement touchpoints
- WIIFM for each session
- HIST alignment verification
`;

    const instructionalResult = await agentOrchestrator.invokeAgent(
      'instructional-designer',
      instructionalPrompt,
      { project, architectureResult },
      onProgress
    );

    await this.completeWorkflowStep(instructionalStep.id, instructionalResult);

    // Step 5: Assessment Design (Interactive Activities)
    const assessmentStep = await this.createWorkflowStep(
      projectId,
      'program_design',
      'suggest_activities',
      'assessment-designer'
    );

    const assessmentPrompt = `
Suggest interactive activities for the chapters in: ${project.name}

Knowledge Architecture:
${architectureResult}

Learning Design:
${instructionalResult}

Provide 1-2 interactive activities per chapter that reinforce learning.
`;

    const assessmentResult = await agentOrchestrator.invokeAgent(
      'assessment-designer',
      assessmentPrompt,
      { project, architectureResult, instructionalResult },
      onProgress
    );

    await this.completeWorkflowStep(assessmentStep.id, assessmentResult);

    // Step 6: Content Architect creates Program Matrix
    const matrixStep = await this.createWorkflowStep(
      projectId,
      'program_design',
      'create_program_matrix',
      'content-architect'
    );

    const matrixPrompt = `
Create the final Program Matrix for: ${project.name}

Research:
${researchResult}

${sourceAnalysis ? `Source Analysis:\n${sourceAnalysis}\n` : ''}

Knowledge Architecture:
${architectureResult}

Learning Design:
${instructionalResult}

Interactive Activities:
${assessmentResult}

Create a complete Program Matrix with:
- Overview paragraph
- 4-column table: Chapter | Session | Session Description | Learning Objective (WIIFM)
- Research basis
- Pedagogical approach
- HIST alignment

Format as markdown with clear structure ready for user approval.
`;

    const matrixResult = await agentOrchestrator.invokeAgent(
      'content-architect',
      matrixPrompt,
      {
        project,
        researchResult,
        sourceAnalysis,
        architectureResult,
        instructionalResult,
        assessmentResult,
      },
      onProgress
    );

    await this.completeWorkflowStep(matrixStep.id, matrixResult);

    // Parse and save program matrix structure
    await this.saveProgramMatrix(projectId, matrixResult);

    // Update project status
    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'program_design' },
    });

    onProgress?.('✅ Program Design Phase Complete! Awaiting user approval...');

    return {
      research: researchResult,
      sourceAnalysis,
      architecture: architectureResult,
      instructionalDesign: instructionalResult,
      activities: assessmentResult,
      programMatrix: matrixResult,
    };
  }

  /**
   * Phase 2: Article Creation
   * First article → HIST Review → Fact Check → Approval → Remaining articles
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

    onProgress?.(`📝 Creating article for Session ${session.number}: ${session.name}...`);

    // Get context from program design phase
    const researchStep = project.workflowSteps.find((s) => s.step === 'research_topic');
    const architectureStep = project.workflowSteps.find((s) => s.step === 'design_architecture');

    // Step 1: Article Writer creates article
    const writerStep = await this.createWorkflowStep(
      projectId,
      'article_creation',
      `write_article_${sessionId}`,
      'article-writer'
    );

    const writerPrompt = `
Write article for Session ${session.number}: ${session.name}

Session Description:
${session.description}

Learning Objective (WIIFM):
${session.wiifm}

Research Context:
${researchStep?.result || 'Not available'}

Knowledge Architecture:
${architectureStep?.result || 'Not available'}

Requirements:
- 800-1200 words (prefer 800-1000)
- Conversational professional tone
- Concrete examples (${project.targetAudience})
- 30-40% theory, 60-70% practice
- Scannable structure
- Engaging from start to finish
- Proper source citations

${isFirstArticle ? 'This is the FIRST article - it will set the style for all others.' : ''}

Create a complete article following HIST principles.
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

    const histPrompt = `
Review this article for HIST compliance:

${articleResult}

Provide a complete HIST Compliance Review using the standard format.
Check: length, flow, HIST principles, and provide specific recommendations.
`;

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

HIST Review:
${histReview}

Project Type: ${project.strictFidelity ? 'STRICT FIDELITY' : 'RESEARCH-BASED'}

${
  project.strictFidelity
    ? 'You have VETO POWER - block if source material violated.'
    : 'Provide ADVISORY feedback on accuracy.'
}

Verify:
- Factual accuracy
- Source citations (format and clickability)
- Strict fidelity compliance (if applicable)
`;

    const factCheck = await agentOrchestrator.invokeAgent(
      'fact-checker',
      factPrompt,
      { article: articleResult, project },
      onProgress
    );

    await this.completeWorkflowStep(factStep.id, factCheck);

    // Save article to database
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
      `✅ Article for Session ${session.number} complete and ready for ${isFirstArticle ? 'style ' : ''}approval!`
    );

    return {
      article: articleResult,
      histReview,
      factCheck,
      isFirstArticle,
    };
  }

  private async createWorkflowStep(
    projectId: string,
    phase: string,
    step: string,
    agentName: string
  ) {
    return prisma.workflowStep.create({
      data: {
        projectId,
        phase,
        step,
        agentName,
        status: 'in_progress',
      },
    });
  }

  private async completeWorkflowStep(stepId: string, result: string) {
    return prisma.workflowStep.update({
      where: { id: stepId },
      data: {
        status: 'completed',
        result,
        completedAt: new Date(),
      },
    });
  }

  private async saveProgramMatrix(projectId: string, matrixResult: string) {
    // Parse the matrix result and create database records
    // This is a simplified version - you'd want more robust parsing
    await prisma.programMatrix.create({
      data: {
        projectId,
        overview: matrixResult.substring(0, 500), // Extract overview
        researchBasis: 'See workflow steps',
        pedagogicalApproach: 'See workflow steps',
        histAlignment: 'HIST-compliant',
        approved: false,
      },
    });
  }

  private countWords(text: string): number {
    return text.split(/\s+/).filter((word) => word.length > 0).length;
  }
}

export const workflowEngine = new WorkflowEngine();
