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
  feedback?: string;  // User feedback for regeneration
  previousMatrix?: string;  // Previous matrix content for context when regenerating
}

export class WorkflowEngineOptimized {
  /**
   * OPTIMIZED Phase 1: Program Design
   * Uses fewer agents, only when needed
   */
  async executeProgramDesign(context: WorkflowContext): Promise<any> {
    const { projectId, onProgress, feedback, previousMatrix } = context;

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

${(feedback && previousMatrix) ? `
⚠️ VIKTIGT - DETTA ÄR EN UPPDATERING AV EN BEFINTLIG MATRIS ⚠️

BEFINTLIG MATRIS SOM SKA UPPDATERAS:
"""
${previousMatrix}
"""

ANVÄNDARENS FEEDBACK (ÄNDRINGAR SOM SKA GÖRAS):
"""
${feedback}
"""

INSTRUKTIONER:
1. Använd den befintliga matrisen som UTGÅNGSPUNKT
2. Gör ENDAST de ändringar som användaren begärt i sin feedback
3. Behåll allt annat innehåll OFÖRÄNDRAT
4. Om användaren ber om att ta bort något (t.ex. "ta bort Codex"), se till att det INTE finns kvar någonstans i den nya matrisen
5. Dubbelkolla att ändringarna faktiskt är implementerade innan du returnerar resultatet

` : (feedback ? `
⚠️ VIKTIGT - ANVÄNDAREN HAR GETT FEEDBACK ⚠️
Denna matris ska skapas baserat på följande feedback från användaren:

"""
${feedback}
"""

Du MÅSTE implementera dessa önskemål i matrisen.
` : '')}

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
    isFirstArticle: boolean = false,
    isFirstInChapterOverride?: boolean
  ): Promise<any> {
    const { projectId, onProgress } = context;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        chapter: {
          include: {
            sessions: {
              include: {
                article: true,
              },
              orderBy: { number: 'asc' },
            },
            project: {
              include: {
                sourceMaterials: true,
                workflowSteps: {
                  where: { phase: 'program_design' },
                },
                chapters: {
                  include: {
                    sessions: {
                      include: {
                        article: true,
                      },
                      orderBy: { number: 'asc' },
                    },
                  },
                  orderBy: { number: 'asc' },
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

    // Determine article type
    const allChapters = project.chapters;
    const firstChapter = allChapters[0];
    const sessionIndex = session.chapter.sessions.findIndex((s: any) => s.id === sessionId);
    const isFirstInProgram = isFirstArticle || (firstChapter?.id === session.chapterId && sessionIndex === 0);
    const isFirstInChapter = isFirstInChapterOverride !== undefined 
      ? isFirstInChapterOverride 
      : sessionIndex === 0;

    // Get previous sessions in same chapter with articles
    const previousSessionsInChapter = session.chapter.sessions
      .filter((s: any) => s.number < session.number && s.article)
      .map((s: any) => `Session ${s.number}: ${s.name} - ${s.article?.content.substring(0, 200)}...`)
      .join('\n\n');

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
- 800-1500 words (prefer 1000-1200, but extend to 1500 if all necessary knowledge requires it)
- Conversational professional tone
- Concrete examples for ${project.targetAudience}
- 30-40% theory, 60-70% practice
- Scannable structure with short paragraphs
- Engaging from start to finish
- Proper source citations in academic format
- **CRITICAL: State WIIFM (what reader will learn) early in opening (first 2 paragraphs)**

${isFirstInProgram ? `
⭐ THIS IS THE FIRST ARTICLE IN THE ENTIRE PROGRAM - it must:
- Welcome the reader to the training program "${project.name}"
- Set expectations for the entire program
- Explain the learning journey ahead
- Create excitement and motivation
- DO NOT reference previous sessions (there are none)
- Example opening: "Welcome to ${project.name}. Over the next sessions, you'll learn..."
` : ''}

${isFirstInChapter && !isFirstInProgram ? `
⭐ THIS IS THE FIRST SESSION IN THIS CHAPTER - it must:
- Introduce the chapter topic "${session.chapter.name}" and its importance
- Explain what this chapter will cover overall
- Set context for the chapter's learning journey
- DO NOT reference previous sessions from other chapters
- DO reference the overall program context if relevant
` : ''}

${previousSessionsInChapter ? `
📚 CONTEXT - Previous sessions in this chapter:
${previousSessionsInChapter}

IMPORTANT: Build on these previous sessions naturally. Reference what was learned and show progression. Make it clear how this session connects to previous ones in the chapter.
` : ''}

Create the complete article now.
`;

    let articleResult = await agentOrchestrator.invokeAgent(
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

    let histReview = await agentOrchestrator.invokeAgent(
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
Fact-check and AUTO-FIX this article:

${articleResult}

HIST REVIEW:
${histReview}

PROJECT TYPE: ${project.strictFidelity ? 'STRICT FIDELITY' : 'RESEARCH-BASED'}

**IMPORTANT**: 
1. Fix all issues you can automatically (formatting, citations, typos, minor updates)
2. Return the CORRECTED ARTICLE with fixes applied
3. Format: [CORRECTED ARTICLE] --- [FACT CHECK SUMMARY]

Verify factual accuracy, source citations, and ${project.strictFidelity ? 'strict fidelity compliance' : 'general accuracy'}.
Only report issues you cannot fix automatically.
`;

    let factCheck = await agentOrchestrator.invokeAgent(
      'fact-checker',
      factPrompt,
      { article: articleResult, project },
      onProgress
    );

    await this.completeWorkflowStep(factStep.id, factCheck);

    // Extract corrected article from fact-checker response
    // Fact-checker now returns the corrected article, not just notes
    let correctedArticle = articleResult;
    let factCheckNotes = factCheck;
    
    // Check if fact-checker returned a corrected article (look for article content before "---")
    const factCheckParts = factCheck.split('---');
    if (factCheckParts.length > 1 && factCheckParts[0].trim().length > 500) {
      // First part is likely the corrected article
      correctedArticle = factCheckParts[0].trim();
      factCheckNotes = factCheckParts.slice(1).join('---').trim();
    }

    // Step 4: Auto-revision if fact-checker made corrections
    if (correctedArticle !== articleResult) {
      onProgress?.('🔧 Applying fact-checker corrections...');
      
      // Update article content with corrections
      articleResult = correctedArticle;
      
      // Re-run HIST review on corrected article
      const histReviewUpdated = await agentOrchestrator.invokeAgent(
        'hist-compliance-editor',
        `Review this corrected article for HIST compliance:\n\n${correctedArticle}`,
        { article: correctedArticle },
        onProgress
      );
      
      histReview = histReviewUpdated;
    }

    // Check if article already exists
    const existingArticle = await prisma.article.findUnique({
      where: { sessionId },
    });

    // Save or update article
    const article = existingArticle
      ? await prisma.article.update({
          where: { sessionId },
          data: {
            content: correctedArticle,
            wordCount: this.countWords(correctedArticle),
            status: 'fact_check',
            histReview,
            factCheck: factCheckNotes,
            approved: false,
          },
        })
      : await prisma.article.create({
      data: {
        sessionId,
            content: correctedArticle,
            wordCount: this.countWords(correctedArticle),
        status: 'fact_check',
        histReview,
            factCheck: factCheckNotes,
        approved: false,
      },
    });

    onProgress?.(
      `✅ Article complete! ${isFirstArticle ? 'Please approve the style before continuing.' : 'Ready for approval.'}`
    );

    return {
      articleId: article.id,
      sessionId,
      wordCount: article.wordCount,
      article: articleResult,
      histReview,
      factCheck,
      isFirstArticle,
    };
  }

  /**
   * Batch generate articles for ALL sessions in ALL chapters
   * After first article is approved, generate all remaining articles
   */
  async executeBatchAllArticlesCreation(
    context: WorkflowContext
  ): Promise<any> {
    const { projectId, onProgress } = context;

    // Get all chapters with sessions
    const chapters = await prisma.chapter.findMany({
      where: { projectId },
      include: {
        sessions: {
          include: {
            article: true,
          },
          orderBy: { number: 'asc' },
        },
      },
      orderBy: { number: 'asc' },
    });

    // Find all sessions without articles across all chapters
    const allSessionsWithoutArticles: Array<{ chapterId: string; chapterNumber: number; session: any }> = [];
    
    chapters.forEach(chapter => {
      chapter.sessions.forEach(session => {
        // Double-check: verify article doesn't exist in database
        // (session.article might be null even if article exists due to include issues)
        if (!session.article) {
          allSessionsWithoutArticles.push({
            chapterId: chapter.id,
            chapterNumber: chapter.number,
            session,
          });
        } else {
          console.log(`⏭️ Skipping session ${session.number} (${session.name}) - article already exists`);
        }
      });
    });
    
    console.log(`📊 Found ${allSessionsWithoutArticles.length} sessions without articles out of ${chapters.reduce((sum, c) => sum + c.sessions.length, 0)} total sessions`);

    if (allSessionsWithoutArticles.length === 0) {
      onProgress?.('✅ All articles already exist across all chapters.');
      return { 
        message: 'All articles already exist', 
        total: 0,
        created: 0,
        failed: 0,
        results: []
      };
    }

    onProgress?.(`📚 Starting batch generation for ${allSessionsWithoutArticles.length} articles across ${chapters.length} chapters...`);

    const results: any[] = [];
    const firstChapter = chapters[0];
    let articleIndex = 0;

    for (const { chapterId, chapterNumber, session } of allSessionsWithoutArticles) {
      try {
        const isFirstInProgram = firstChapter?.id === chapterId && 
                                 firstChapter.sessions[0]?.id === session.id &&
                                 articleIndex === 0;
        
        // Check if this is first in chapter
        const chapter = chapters.find(c => c.id === chapterId);
        const existingArticlesInChapter = chapter?.sessions.filter(s => s.article) || [];
        const isFirstInChapter = existingArticlesInChapter.length === 0 && 
                                 chapter?.sessions[0]?.id === session.id;

        let retries = 3;
        let success = false;
        
        while (retries > 0 && !success) {
          try {
            // Double-check article doesn't exist before creating
            const existingArticleCheck = await prisma.article.findUnique({
              where: { sessionId: session.id },
            });
            
            if (existingArticleCheck) {
              console.log(`⏭️ Skipping session ${session.number} - article already exists in database`);
              onProgress?.(`⏭️ [${articleIndex + 1}/${allSessionsWithoutArticles.length}] Session ${session.number} already has an article, skipping...`);
              results.push({ 
                chapterId, 
                sessionId: session.id, 
                sessionNumber: session.number,
                sessionName: session.name,
                skipped: true,
                message: 'Article already exists'
              });
              articleIndex++;
              success = true;
              continue;
            }

            onProgress?.(`📝 [${articleIndex + 1}/${allSessionsWithoutArticles.length}] Chapter ${chapterNumber}, Session ${session.number}: ${session.name}...`);

            const result = await this.executeArticleCreation(
              context,
              session.id,
              isFirstInProgram,
              isFirstInChapter
            );

            results.push({ chapterId, sessionId: session.id, ...result });
            onProgress?.(`✅ [${articleIndex + 1}/${allSessionsWithoutArticles.length}] Article created successfully!`);
            success = true;
            
            // Progressive delay - longer wait as we process more articles to avoid rate limits
            const delay = Math.min(3000 + (articleIndex * 500), 10000); // 3-10 seconds
            if (articleIndex < allSessionsWithoutArticles.length - 1) {
              onProgress?.(`⏳ Waiting ${delay/1000} seconds before next article...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
            
            articleIndex++;
          } catch (error: any) {
            retries--;
            const errorMessage = error.message || String(error);
            const errorStack = error.stack ? error.stack.substring(0, 500) : '';
            const isRateLimit = errorMessage.includes('rate_limit') || 
                               errorMessage.includes('429') || 
                               errorMessage.includes('too many requests') ||
                               error.status === 429 ||
                               errorMessage.includes('rate limit');
            
            console.error(`❌ Error creating article for session ${session.id} (${retries} retries left):`, {
              message: errorMessage,
              stack: errorStack,
              sessionNumber: session.number,
              sessionName: session.name,
              chapterNumber,
              errorType: error.constructor?.name,
              errorStatus: error.status,
              errorCode: error.code,
            });
            
            if (retries > 0) {
              // If rate limited, wait much longer
              const retryDelay = isRateLimit ? 30000 : 10000; // 30 seconds for rate limit, 10 for other errors
              onProgress?.(`⚠️ ${isRateLimit ? 'Rate limit detected' : 'Error occurred'}. Retrying in ${retryDelay/1000} seconds... (${retries} attempts remaining)`);
              onProgress?.(`   Error details: ${errorMessage.substring(0, 200)}`);
              await new Promise(resolve => setTimeout(resolve, retryDelay));
            } else {
              const fullErrorMessage = `${errorMessage}${errorStack ? `\n   Stack: ${errorStack}` : ''}`;
              onProgress?.(`❌ Failed to create article for Session ${session.number}: ${errorMessage}`);
              onProgress?.(`   Full error: ${fullErrorMessage.substring(0, 300)}`);
              results.push({ 
                chapterId, 
                sessionId: session.id, 
                sessionNumber: session.number,
                sessionName: session.name,
                error: errorMessage,
                errorDetails: errorStack
              });
              articleIndex++;
              
              // If rate limited and no retries left, wait before continuing
              if (isRateLimit) {
                onProgress?.(`⏸️ Rate limit reached. Waiting 30 seconds before continuing with next article...`);
                await new Promise(resolve => setTimeout(resolve, 30000));
              }
            }
          }
        }
      } catch (outerError: any) {
        // Catch any errors that occur outside the retry loop (e.g., finding chapter, etc.)
        console.error(`❌ Outer error for session ${session?.id || 'unknown'}:`, outerError);
        onProgress?.(`❌ Fatal error for Session ${session?.number || '?'}: ${outerError.message || String(outerError)}`);
        results.push({ 
          chapterId: chapterId || 'unknown', 
          sessionId: session?.id || 'unknown', 
          sessionNumber: session?.number || '?',
          sessionName: session?.name || 'unknown',
          error: outerError.message || String(outerError),
          fatal: true
        });
        articleIndex++;
      }
    }

    const createdCount = results.filter(r => !r.error && !r.skipped && !r.fatal).length;
    const failedCount = results.filter(r => r.error || r.fatal).length;
    const skippedCount = results.filter(r => r.skipped).length;
    
    onProgress?.(`✅ Batch generation complete! Created ${createdCount} articles, ${skippedCount} skipped, ${failedCount} failed.`);
    
    if (failedCount > 0) {
      const failedSessions = results.filter(r => r.error || r.fatal).map(r => 
        `  - Session ${r.sessionNumber || '?'}: ${r.error || r.message || 'Unknown error'}`
      ).join('\n');
      onProgress?.(`\n❌ Failed sessions:\n${failedSessions}`);
      console.error(`Batch generation completed with ${failedCount} failures:`, 
        results.filter(r => r.error || r.fatal)
      );
    }
    
    if (skippedCount > 0) {
      console.log(`Batch generation skipped ${skippedCount} sessions (articles already exist)`);
    }

    return {
      total: allSessionsWithoutArticles.length,
      created: createdCount,
      failed: failedCount,
      results,
    };
  }

  /**
   * Batch generate articles for all sessions in a chapter
   * After first article is approved, generate remaining articles
   */
  async executeBatchArticleCreation(
    context: WorkflowContext,
    chapterId: string
  ): Promise<any> {
    const { projectId, onProgress } = context;

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        project: true,
        sessions: {
          include: {
            article: true,
          },
          orderBy: { number: 'asc' },
        },
      },
    });

    if (!chapter) throw new Error('Chapter not found');

    // Find sessions without articles
    const sessionsWithoutArticles = chapter.sessions.filter(s => !s.article);

    console.log(`🔍 Chapter ${chapter.number} has ${chapter.sessions.length} total sessions`);
    console.log(`🔍 Sessions without articles: ${sessionsWithoutArticles.length}`);
    chapter.sessions.forEach(s => {
      console.log(`  - Session ${s.number}: ${s.name} - Article: ${s.article ? 'YES' : 'NO'}`);
    });

    if (sessionsWithoutArticles.length === 0) {
      onProgress?.('✅ All articles in this chapter already exist.');
      return { message: 'All articles already exist', count: 0 };
    }

    onProgress?.(`📚 Starting batch generation for ${sessionsWithoutArticles.length} articles in Chapter ${chapter.number}...`);

    const results = [];
    let isFirstInProgram = false;
    let isFirstInChapter = false;

    // Check if this is the first chapter
    const allChapters = await prisma.chapter.findMany({
      where: { projectId },
      orderBy: { number: 'asc' },
      include: {
        sessions: {
          orderBy: { number: 'asc' },
        },
      },
    });

    const firstChapter = allChapters[0];
    const isFirstChapter = firstChapter?.id === chapterId;

    for (let i = 0; i < sessionsWithoutArticles.length; i++) {
      const session = sessionsWithoutArticles[i];
      
      // Determine if this is first in program or chapter
      // For batch, only first session in first chapter is "first in program"
      isFirstInProgram = isFirstChapter && i === 0 && 
                        firstChapter.sessions[0]?.id === session.id;
      
      // First session in chapter is only if it's the first one we're processing
      // But we need to check if there are already articles in this chapter
      const existingArticlesInChapter = chapter.sessions.filter(s => s.article);
      isFirstInChapter = existingArticlesInChapter.length === 0 && i === 0;

      try {
        onProgress?.(`📝 [${i + 1}/${sessionsWithoutArticles.length}] Creating article for Session ${session.number}: ${session.name}...`);

        const result = await this.executeArticleCreation(
          context,
          session.id,
          isFirstInProgram
        );

        results.push(result);
        onProgress?.(`✅ [${i + 1}/${sessionsWithoutArticles.length}] Article for Session ${session.number} created successfully!`);
        
        // Small delay between articles to avoid rate limits
        if (i < sessionsWithoutArticles.length - 1) {
          onProgress?.(`⏳ Waiting 2 seconds before next article...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error: any) {
        console.error(`Error creating article for session ${session.id}:`, error);
        onProgress?.(`❌ Failed to create article for Session ${session.number}: ${error.message}`);
        results.push({ sessionId: session.id, error: error.message });
      }
    }

    onProgress?.(`✅ Batch generation complete! Created ${results.filter(r => !r.error).length} articles.`);

    return {
      chapterId,
      total: sessionsWithoutArticles.length,
      created: results.filter(r => !r.error).length,
      failed: results.filter(r => r.error).length,
      results,
    };
  }

  /**
   * OPTIMIZED Phase 3: Video Creation (only if requested)
   */
  async executeVideoCreation(context: WorkflowContext, sessionId: string): Promise<any> {
    const { projectId, onProgress } = context;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { 
        article: true,
        chapter: {
          include: {
            project: true,
            sessions: {
              include: {
                article: true,
              },
              orderBy: { number: 'asc' },
            },
          },
        },
      },
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

    // Determine if this is first in program or chapter
    const project = session.chapter.project;
    const allChapters = await prisma.chapter.findMany({
      where: { projectId },
      orderBy: { number: 'asc' },
    });
    const firstChapter = allChapters[0];
    const sessionIndex = session.chapter.sessions.findIndex((s: any) => s.id === sessionId);
    const isFirstInProgram = firstChapter?.id === session.chapterId && sessionIndex === 0;
    const isFirstInChapter = sessionIndex === 0;

    // Get previous sessions in same chapter with articles
    const previousSessionsInChapter = session.chapter.sessions
      .filter((s: any) => s.number < session.number && s.article)
      .map((s: any) => `Session ${s.number}: ${s.name}`)
      .join(', ');

    const videoPrompt = `
Create a ~250 word video script based on this article:

SESSION: ${session.number} - ${session.name}

LEARNING OBJECTIVE (WIIFM):
${session.wiifm}

ARTICLE:
${session.article.content}

${isFirstInProgram ? `
⭐ THIS IS THE FIRST VIDEO IN THE ENTIRE PROGRAM - it must:
- Welcome the viewer to the training program "${project.name}"
- Set expectations for the entire program
- Explain the learning journey ahead
- Create excitement and motivation
- DO NOT reference previous sessions (there are none)
` : ''}

${isFirstInChapter && !isFirstInProgram ? `
⭐ THIS IS THE FIRST SESSION IN THIS CHAPTER - it must:
- Introduce the chapter topic "${session.chapter.name}" and its importance
- Explain what this chapter will cover overall
- Set context for the chapter's learning journey
- DO NOT reference previous sessions from other chapters
- DO reference the overall program context if relevant
` : ''}

${previousSessionsInChapter ? `
📚 CONTEXT - Previous sessions in this chapter:
${previousSessionsInChapter}

IMPORTANT: Build on these previous sessions naturally. Reference what was learned and show progression. Make it clear how this session connects to previous ones in the chapter.
` : ''}

CRITICAL REQUIREMENTS:
- Exactly 240-260 words
- Conversational, spoken-word style
- Short sentences (10-15 words max)
- NO section headers like [HOOK], [MAIN MESSAGE], [APPLICATION], or [CLOSING] in the final script
- The script must be pure text that flows naturally and can be read by an avatar
- State WIIFM (what viewer will learn) early in the opening (first 2-3 sentences)
- ONE key insight (not multiple concepts)
- Hook → Main Message → Application → Closing (structure internally, but output as continuous text)
`;

    const videoResult = await agentOrchestrator.invokeAgent(
      'video-narrator',
      videoPrompt,
      { session },
      onProgress
    );

    await this.completeWorkflowStep(videoStep.id, videoResult);

    // Check if video script already exists
    const existingVideo = await prisma.videoScript.findUnique({
      where: { sessionId },
    });

    const videoScript = existingVideo
      ? await prisma.videoScript.update({
          where: { sessionId },
          data: {
            content: videoResult,
            wordCount: this.countWords(videoResult),
            approved: false,
          },
        })
      : await prisma.videoScript.create({
      data: {
        sessionId,
        content: videoResult,
        wordCount: this.countWords(videoResult),
        approved: false,
      },
    });

    onProgress?.(`✅ Video script complete!`);

    return { videoScript: videoResult, videoScriptId: videoScript.id };
  }

  /**
   * Batch generate video scripts for all sessions with articles
   */
  async executeBatchVideoCreation(
    context: WorkflowContext
  ): Promise<any> {
    const { projectId, onProgress } = context;

    // Get all sessions with articles but without video scripts
    const sessions = await prisma.session.findMany({
      where: {
        chapter: { projectId },
        article: { isNot: null },
        videoScript: null,
      },
      include: {
        article: true,
        chapter: true,
      },
      orderBy: [
        { chapter: { number: 'asc' } },
        { number: 'asc' },
      ],
    });

    if (sessions.length === 0) {
      onProgress?.('✅ All video scripts already exist.');
      return { message: 'All video scripts already exist', count: 0 };
    }

    onProgress?.(`🎬 Starting batch generation for ${sessions.length} video scripts...`);

    const results = [];

    for (let i = 0; i < sessions.length; i++) {
      const session = sessions[i];
      
      try {
        onProgress?.(`🎬 [${i + 1}/${sessions.length}] Creating video script for Session ${session.number}: ${session.name}...`);

        const result = await this.executeVideoCreation(context, session.id);
        results.push({ sessionId: session.id, ...result });
        onProgress?.(`✅ [${i + 1}/${sessions.length}] Video script created successfully!`);
        
        if (i < sessions.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error: any) {
        console.error(`Error creating video script for session ${session.id}:`, error);
        onProgress?.(`❌ Failed to create video script for Session ${session.number}: ${error.message}`);
        results.push({ sessionId: session.id, error: error.message });
      }
    }

    onProgress?.(`✅ Batch video generation complete! Created ${results.filter(r => !r.error).length} video scripts.`);

    return {
      total: sessions.length,
      created: results.filter(r => !r.error).length,
      failed: results.filter(r => r.error).length,
      results,
    };
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

    // Parse quiz questions from the result (simplified parsing)
    // The result should be a table with: Fråga | a | b | c | Rätt svar
    const questionLines = quizResult.split('\n').filter(line => line.includes('|'));
    const questions = [];

    for (const line of questionLines) {
      if (line.trim().startsWith('|') && !line.includes('Fråga')) {
        const parts = line.split('|').map(p => p.trim()).filter(p => p);
        if (parts.length >= 5) {
          questions.push({
            question: parts[0],
            optionA: parts[1],
            optionB: parts[2],
            optionC: parts[3],
            correctAnswer: parts[4].toLowerCase().trim(),
          });
        }
      }
    }

    // Check if quiz already exists
    const existingQuiz = await prisma.quiz.findUnique({
      where: { sessionId },
      include: { questions: true },
    });

    let quiz;
    if (existingQuiz) {
      // Delete old questions
      await prisma.quizQuestion.deleteMany({
        where: { quizId: existingQuiz.id },
      });
      
      quiz = await prisma.quiz.update({
        where: { sessionId },
        data: {
          approved: false,
        },
      });
    } else {
      quiz = await prisma.quiz.create({
      data: {
        sessionId,
        approved: false,
      },
    });
    }

    // Create quiz questions
    for (const q of questions) {
      await prisma.quizQuestion.create({
        data: {
          quizId: quiz.id,
          question: q.question,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          correctAnswer: q.correctAnswer,
        },
      });
    }

    onProgress?.(`✅ Quiz complete! Created ${questions.length} questions.`);

    return { quiz: quizResult, quizId: quiz.id, questionCount: questions.length };
  }

  /**
   * Batch generate quizzes for all sessions with articles
   */
  async executeBatchQuizCreation(
    context: WorkflowContext,
    numQuestions: number = 3
  ): Promise<any> {
    const { projectId, onProgress } = context;

    // Get project to find numQuestions
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    const questionsPerQuiz = numQuestions || project?.quizQuestions || 3;

    // Get all sessions with articles but without quizzes
    const sessions = await prisma.session.findMany({
      where: {
        chapter: { projectId },
        article: { isNot: null },
        quiz: null,
      },
      include: {
        article: true,
        chapter: true,
      },
      orderBy: [
        { chapter: { number: 'asc' } },
        { number: 'asc' },
      ],
    });

    if (sessions.length === 0) {
      onProgress?.('✅ All quizzes already exist.');
      return { message: 'All quizzes already exist', count: 0 };
    }

    onProgress?.(`🎯 Starting batch generation for ${sessions.length} quizzes...`);

    const results = [];

    for (let i = 0; i < sessions.length; i++) {
      const session = sessions[i];
      
      try {
        onProgress?.(`🎯 [${i + 1}/${sessions.length}] Creating quiz for Session ${session.number}: ${session.name}...`);

        const result = await this.executeQuizCreation(context, session.id, questionsPerQuiz);
        results.push({ sessionId: session.id, ...result });
        onProgress?.(`✅ [${i + 1}/${sessions.length}] Quiz created successfully!`);
        
        if (i < sessions.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error: any) {
        console.error(`Error creating quiz for session ${session.id}:`, error);
        onProgress?.(`❌ Failed to create quiz for Session ${session.number}: ${error.message}`);
        results.push({ sessionId: session.id, error: error.message });
      }
    }

    onProgress?.(`✅ Batch quiz generation complete! Created ${results.filter(r => !r.error).length} quizzes.`);

    return {
      total: sessions.length,
      created: results.filter(r => !r.error).length,
      failed: results.filter(r => r.error).length,
      results,
    };
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
    // Improved regex to handle multiple formats and all sessions
    const chaptersMap = new Map<number, { name: string; theme: string; sessions: any[] }>();

    // Split by table rows (lines starting with |)
    const lines = matrixResult.split('\n').filter(line => line.trim().startsWith('|') && !line.includes('---'));
    
    let currentChapter: { num: number; name: string; theme: string } | null = null;

    for (const line of lines) {
      // Try to match chapter row: | **Kapitel/Chapter N: Name**<br><br>*Tema/Theme: ...* | ...
      const chapterMatch = line.match(/\|\s*\*\*(?:Kapitel|Chapter)\s+(\d+):\s*([^*<]+)(?:<br><br>\*(?:Tema|Theme):\s*([^*]+)\*)?/i);

      if (chapterMatch) {
        const chapterNum = parseInt(chapterMatch[1]);
        const chapterName = chapterMatch[2].trim();
        const theme = chapterMatch[3] ? chapterMatch[3].trim() : '';

        currentChapter = { num: chapterNum, name: chapterName, theme };

        if (!chaptersMap.has(chapterNum)) {
          chaptersMap.set(chapterNum, {
            name: chapterName,
            theme,
            sessions: [],
          });
        }
      }

      // Try to match session row: | **Session N.M: Name**<br><br>Description | ... | ... |
      // Also handle empty chapter cell: |  | **Session N.M: Name** | ... |
      const sessionMatch = line.match(/\|\s*(?:\*\*(?:Kapitel|Chapter)[^|]*\*\*[^|]*\||[^|]*)\|\s*\*\*Session\s+([\d.]+):\s*([^*<]+)(?:<br><br>([^|]*))?/i);
      
      if (sessionMatch && currentChapter) {
        const sessionNum = sessionMatch[1].trim();
        const sessionName = sessionMatch[2].trim();
        const sessionDesc = sessionMatch[3] ? sessionMatch[3].trim() : '';
        
        // Extract WIIFM from the last column if available
        const columns = line.split('|').map(c => c.trim()).filter(c => c);
        const wiifm = columns.length >= 4 ? columns[columns.length - 1] : sessionDesc;

        chaptersMap.get(currentChapter.num)!.sessions.push({
        number: sessionNum,
        name: sessionName,
        description: sessionDesc,
          wiifm: wiifm,
        });
      }
    }

    // Log what was parsed for debugging
    console.log(`📊 Parsed ${chaptersMap.size} chapters:`);
    for (const [num, data] of chaptersMap.entries()) {
      console.log(`  Chapter ${num}: ${data.name} - ${data.sessions.length} sessions`);
      data.sessions.forEach(s => {
        console.log(`    - Session ${s.number}: ${s.name}`);
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
            wiifm: sessionData.wiifm || sessionData.description,
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
