import { agentOrchestrator } from './agentOrchestrator';
import prisma from '../db/client';

export interface DebriefSource {
  name: string;
  type: string;
  year: string;
  relevance: string;
}

export interface ResearchValidation {
  contradictions: {
    area: string;
    description: string;
    sources: string[];
  }[];
  gaps: {
    topic: string;
    importance: string;
    resolved: boolean;
  }[];
  contrarianViews: {
    viewpoint: string;
    source?: string;
    relevance: string;
  }[];
  deepenedResearch?: string;
  validationSummary: string;
}

export interface DebriefResult {
  researchSummary: string;
  sources: DebriefSource[];
  validation?: ResearchValidation;
  alternatives: {
    id: string;
    title: string;
    description: string;
    recommended: boolean;
  }[];
  fullDebrief: string;
}

export interface DebriefFeedbackResult {
  acknowledged: boolean;
  message: string;
}

/**
 * Debrief Workflow Service
 * Handles the new workflow: Research → Debrief with 3 alternatives → Feedback loop → Matrix
 */
export class DebriefWorkflowService {

  /**
   * Step 1: Execute research phase
   */
  async executeResearch(
    projectId: string,
    onProgress?: (message: string) => void
  ): Promise<string> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { sourceMaterials: true },
    });

    if (!project) throw new Error('Project not found');

    onProgress?.('🔍 Startar research-fas...');

    // Create workflow step for research
    const researchStep = await prisma.workflowStep.create({
      data: {
        projectId,
        phase: 'research',
        step: 'research',
        agentName: 'research-director',
        status: 'running',
        
      },
    });

    const researchPrompt = `
Du är Research Director för ett utbildningsprogram.

PROJEKT: ${project.name}

LÄRANDEMÅL:
${project.learningObjectives || 'Ej specificerat'}

MÅLGRUPP:
${project.targetAudience || 'Ej specificerat'}

ÖNSKADE RESULTAT:
${project.desiredOutcomes || 'Ej specificerat'}

SÄRSKILD VINKEL/RAMVERK:
${project.particularAngle || 'Ingen specificerad'}

${project.sourceMaterials.length > 0 ? `
KÄLLMATERIAL:
${project.sourceMaterials.map((m) => `- ${m.filename} (${m.type})`).join('\n')}
Strikt källtrohet krävs: ${project.strictFidelity}
` : 'Inget källmaterial tillhandahållet.'}

DIN UPPGIFT:
Gör en grundlig research och sammanställ:

1. **Teoretisk grund** (300-400 ord)
   - Relevanta teorier och ramverk för ämnet
   - Ledande tänkare och deras bidrag
   - Vetenskaplig grund där tillämpligt

2. **Best practices** (200-300 ord)
   - Beprövade metoder inom området
   - Vanliga fallgropar att undvika
   - Framgångsfaktorer

3. **Målgruppsinsikter** (150-200 ord)
   - Vad denna målgrupp typiskt behöver
   - Vanliga kunskapsluckor
   - Motivationsfaktorer

4. **Källor** (VIKTIGT - kvalitet över kvantitet)
   - Välj endast 3-5 MYCKET relevanta källor
   - Prioritera ALLTID:
     * Officiell dokumentation (för tekniska ämnen: företagsdocs från t.ex. Anthropic, OpenAI, Google, etc.)
     * Färska källor (2024-2025) för snabbrörliga områden som AI, tech
     * Primärkällor framför sekundärkällor
   - För varje källa, ange:
     * Källans namn och typ (dokumentation, whitepaper, studie, etc.)
     * Årtal
     * VARFÖR denna källa är relevant (1 mening)
   - UNDVIK: Gamla källor för snabbrörliga områden, generiska läroböcker, icke-auktoritativa bloggar

VIKTIGT OM KÄLLKVALITET:
- För AI/tech-ämnen: Prioritera officiella API-docs, whitepapers och engineering blogs från de stora AI-företagen
- För etablerade ämnen: Klassiska verk är OK men motivera varför de fortfarande är relevanta
- Var ärlig: Om du inte har specifika källor, säg det hellre än att fabricera

Var konkret och faktabaserad. Undvik generaliseringar.
`;

    const researchResult = await agentOrchestrator.invokeAgent(
      'research-director',
      researchPrompt,
      { project },
      onProgress
    );

    // Complete workflow step
    await prisma.workflowStep.update({
      where: { id: researchStep.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        result: researchResult,
      },
    });

    onProgress?.('✅ Initial research klar!');
    return researchResult;
  }

  /**
   * Step 1.5: Validate research - check for contradictions, gaps, and contrarian views
   */
  async validateResearch(
    projectId: string,
    researchResult: string,
    onProgress?: (message: string) => void
  ): Promise<{ validatedResearch: string; validation: ResearchValidation }> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { sourceMaterials: true },
    });

    if (!project) throw new Error('Project not found');

    onProgress?.('🔍 Validerar research-kvalitet...');

    // Create workflow step for validation
    const validationStep = await prisma.workflowStep.create({
      data: {
        projectId,
        phase: 'research',
        step: 'validate_research',
        agentName: 'content-architect',
        status: 'running',
      },
    });

    const validationPrompt = `
Du är Content Architect och ska kvalitetssäkra research-resultatet innan vi går vidare.

PROJEKT: ${project.name}
MÅLGRUPP: ${project.targetAudience || 'Ej specificerat'}
LÄRANDEMÅL: ${project.learningObjectives || 'Ej specificerat'}

RESEARCH-RESULTAT ATT VALIDERA:
"""
${researchResult}
"""

DIN UPPGIFT:
Analysera researchen kritiskt genom att svara på dessa tre kontrollfrågor:

1. **MOTSÄGELSER (Contradictions)**
   - Finns det områden där källorna inte är överens?
   - Finns det interna motsägelser i materialet?
   - Om ja: Beskriv varje motsägelse och vilka källor som står i konflikt.

2. **LUCKOR (Gaps)**
   - Vad saknas för att verkligen förstå ämnet?
   - Finns det viktiga aspekter som inte täcks av källorna?
   - Vilken information skulle vara nödvändig för att skapa ett komplett utbildningsprogram?
   - VIKTIGT: Om du identifierar luckor, markera dem som "resolved: false" så vi kan fördjupa researchen.

3. **ALTERNATIVA PERSPEKTIV (Contrarian Views)**
   - Finns det kontroversiella eller mindre kända synpunkter som inte täcks?
   - Finns det alternativa skolor/metoder som utmanar mainstream-synen?
   - Skulle dessa perspektiv vara värdefulla för målgruppen att känna till?

Svara i följande JSON-format:

{
  "contradictions": [
    {
      "area": "Området där motsägelsen finns",
      "description": "Beskrivning av motsägelsen",
      "sources": ["Källa 1", "Källa 2"]
    }
  ],
  "gaps": [
    {
      "topic": "Ämnet som saknas",
      "importance": "Varför detta är viktigt (critical/important/nice-to-have)",
      "resolved": false
    }
  ],
  "contrarianViews": [
    {
      "viewpoint": "Det alternativa perspektivet",
      "source": "Eventuell källa eller tänkare",
      "relevance": "Varför detta är relevant för målgruppen"
    }
  ],
  "validationSummary": "Sammanfattning av valideringen (2-3 meningar). Bedöm om researchen är tillräcklig eller behöver fördjupas."
}

VIKTIGT:
- Var ärlig och kritisk - det är bättre att hitta luckor nu än senare
- Om det finns gaps med importance "critical" eller "important", måste vi fördjupa researchen
- Svara ENDAST med JSON
`;

    const validationResult = await agentOrchestrator.invokeAgent(
      'content-architect',
      validationPrompt,
      { project, researchResult },
      onProgress
    );

    // Parse validation result
    let validation: ResearchValidation;
    try {
      const jsonMatch = validationResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        validation = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch (e) {
      validation = {
        contradictions: [],
        gaps: [],
        contrarianViews: [],
        validationSummary: 'Kunde inte parsa valideringsresultatet.',
      };
    }

    // Check if we need to deepen research
    const criticalGaps = validation.gaps.filter(
      g => g.importance === 'critical' || g.importance === 'important'
    );
    const hasContrarianViewsToExplore = validation.contrarianViews.length > 0;

    let finalResearch = researchResult;

    if (criticalGaps.length > 0 || hasContrarianViewsToExplore) {
      onProgress?.('🔬 Fördjupar research baserat på identifierade luckor...');

      const deepenPrompt = `
Du är Research Director och ska fördjupa researchen baserat på identifierade luckor.

URSPRUNGLIG RESEARCH:
"""
${researchResult}
"""

IDENTIFIERADE LUCKOR ATT FYLLA:
${criticalGaps.map(g => `- ${g.topic}: ${g.importance}`).join('\n')}

ALTERNATIVA PERSPEKTIV ATT UTFORSKA:
${validation.contrarianViews.map(v => `- ${v.viewpoint}`).join('\n')}

${validation.contradictions.length > 0 ? `
MOTSÄGELSER ATT KLARGÖRA:
${validation.contradictions.map(c => `- ${c.area}: ${c.description}`).join('\n')}
` : ''}

DIN UPPGIFT:
Komplettera researchen med:
1. Information som fyller de kritiska luckorna
2. Beskrivning av alternativa perspektiv och varför de finns
3. Klarläggande av eventuella motsägelser

Skriv ENDAST den kompletterande informationen (200-400 ord).
Upprepa inte det som redan finns i ursprunglig research.
Var specifik och faktabaserad.
`;

      const deepenedResearch = await agentOrchestrator.invokeAgent(
        'research-director',
        deepenPrompt,
        { project },
        onProgress
      );

      validation.deepenedResearch = deepenedResearch;

      // Mark gaps as resolved
      validation.gaps = validation.gaps.map(g => ({
        ...g,
        resolved: true,
      }));

      // Combine original and deepened research
      finalResearch = `${researchResult}

---

## Fördjupad Research

${deepenedResearch}`;

      onProgress?.('✅ Research fördjupad!');
    }

    // Complete workflow step
    await prisma.workflowStep.update({
      where: { id: validationStep.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        result: JSON.stringify({
          validation,
          deepenedResearch: validation.deepenedResearch,
        }),
      },
    });

    // Also update the original research step with the complete research
    const researchStep = await prisma.workflowStep.findFirst({
      where: {
        projectId,
        step: 'research',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (researchStep) {
      await prisma.workflowStep.update({
        where: { id: researchStep.id },
        data: { result: finalResearch },
      });
    }

    onProgress?.('✅ Research-validering klar!');

    return {
      validatedResearch: finalResearch,
      validation,
    };
  }

  /**
   * Step 2: Generate debrief with 3 alternatives
   */
  async generateDebrief(
    projectId: string,
    researchResult: string,
    onProgress?: (message: string) => void,
    validation?: ResearchValidation
  ): Promise<DebriefResult> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { sourceMaterials: true },
    });

    if (!project) throw new Error('Project not found');

    onProgress?.('📝 Skapar debrief med 3 alternativa inriktningar...');

    // Create workflow step for debrief
    const debriefStep = await prisma.workflowStep.create({
      data: {
        projectId,
        phase: 'debrief',
        step: 'create_debrief',
        agentName: 'content-architect',
        status: 'running',
        
      },
    });

    const debriefPrompt = `
Du är Content Architect och ska skapa en debrief för kundens godkännande.

PROJEKT: ${project.name}

BRIEF:
- Lärandemål: ${project.learningObjectives || 'Ej specificerat'}
- Målgrupp: ${project.targetAudience || 'Ej specificerat'}
- Önskade resultat: ${project.desiredOutcomes || 'Ej specificerat'}
- Särskild vinkel: ${project.particularAngle || 'Ingen'}

RESEARCH-RESULTAT:
${researchResult}

${validation ? `
RESEARCH-VALIDERING (viktigt att beakta):

${validation.contradictions.length > 0 ? `
**Identifierade motsägelser i källorna:**
${validation.contradictions.map(c => `- ${c.area}: ${c.description}`).join('\n')}
` : 'Inga motsägelser identifierade.'}

${validation.gaps.length > 0 ? `
**Identifierade kunskapsluckor (${validation.gaps.filter(g => g.resolved).length}/${validation.gaps.length} åtgärdade):**
${validation.gaps.map(g => `- ${g.topic} (${g.importance})${g.resolved ? ' ✓ åtgärdad' : ''}`).join('\n')}
` : 'Inga kritiska luckor identifierade.'}

${validation.contrarianViews.length > 0 ? `
**Alternativa/konträra perspektiv att överväga:**
${validation.contrarianViews.map(v => `- ${v.viewpoint}${v.source ? ` (${v.source})` : ''}: ${v.relevance}`).join('\n')}
` : ''}

**Valideringssummering:** ${validation.validationSummary}
` : ''}

${project.sourceMaterials.length > 0 ? `
KÄLLMATERIAL:
${project.sourceMaterials.map((m) => `- ${m.filename}`).join('\n')}
` : ''}

DIN UPPGIFT:
Skapa en strukturerad debrief i följande JSON-format:

{
  "researchSummary": "En sammanfattning av research-resultaten (200-300 ord). Beskriv de viktigaste insikterna och hur de påverkar programdesignen.",

  "sources": [
    {
      "name": "Källans namn (t.ex. 'OpenAI API Documentation')",
      "type": "Typ (dokumentation/whitepaper/studie/etc.)",
      "year": "2024 eller 2025",
      "relevance": "Varför denna källa är viktig för just detta program (1 mening)"
    }
  ],

  "alternatives": [
    {
      "id": "A",
      "title": "Kort titel för alternativ A",
      "description": "Beskrivning av detta alternativ (100-150 ord). Förklara teoretisk grund, fokusområden, djup och vad som gör detta unikt. Beskriv fördelar och eventuella nackdelar.",
      "recommended": true
    },
    {
      "id": "B",
      "title": "Kort titel för alternativ B",
      "description": "Beskrivning av alternativ B (100-150 ord). Detta kan ha annat teoretiskt fokus, annat djup, eller annan pedagogisk approach.",
      "recommended": false
    },
    {
      "id": "C",
      "title": "Kort titel för alternativ C",
      "description": "Beskrivning av alternativ C (100-150 ord). Ytterligare ett distinkt alternativ.",
      "recommended": false
    }
  ],

  "fullDebrief": "Komplett debrief-text (400-600 ord) som sammanfattar briefen, research, och den rekommenderade riktningen. Inkludera hur programmet kommer att struktureras på hög nivå utan att visa detaljerad matris."
}

VIKTIGT:
- Alternativens ska vara VERKLIGT OLIKA, inte bara variationer
- De kan baseras på:
  * Olika teoretiska skolor/ramverk som ibland står i konflikt
  * Olika djup (grundläggande vs avancerat)
  * Olika fokusområden inom ämnet
- Markera ETT alternativ som recommended: true
- Svara ENDAST med JSON, ingen annan text
`;

    const debriefResult = await agentOrchestrator.invokeAgent(
      'content-architect',
      debriefPrompt,
      { project, researchResult },
      onProgress
    );

    // Parse JSON from result
    let parsedDebrief: DebriefResult;
    try {
      // Try to extract JSON from the response
      const jsonMatch = debriefResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedDebrief = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (e) {
      // Fallback structure if parsing fails
      parsedDebrief = {
        researchSummary: debriefResult,
        sources: [],
        alternatives: [
          { id: 'A', title: 'Standard approach', description: debriefResult.substring(0, 500), recommended: true },
          { id: 'B', title: 'Alternativ approach', description: 'Alternativ vinkel på innehållet', recommended: false },
          { id: 'C', title: 'Djupgående approach', description: 'Mer djupgående behandling av ämnet', recommended: false },
        ],
        fullDebrief: debriefResult,
      };
    }

    // Include validation results in the debrief
    if (validation) {
      parsedDebrief.validation = validation;
    }

    // Complete workflow step
    await prisma.workflowStep.update({
      where: { id: debriefStep.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        result: JSON.stringify(parsedDebrief),
      },
    });

    // Update project status
    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'debrief_review' },
    });

    onProgress?.('✅ Debrief klar! Väntar på din feedback.');
    return parsedDebrief;
  }

  /**
   * Step 3: Handle feedback on debrief (short acknowledgment)
   */
  async handleDebriefFeedback(
    projectId: string,
    feedback: string,
    selectedAlternative?: string,
    onProgress?: (message: string) => void
  ): Promise<DebriefFeedbackResult> {
    onProgress?.('💬 Tar emot feedback...');

    // Store feedback
    await prisma.workflowStep.create({
      data: {
        projectId,
        phase: 'debrief',
        step: 'debrief_feedback',
        agentName: 'content-architect',
        status: 'completed',
        
        completedAt: new Date(),
        result: JSON.stringify({ feedback, selectedAlternative }),
      },
    });

    // Generate SHORT acknowledgment
    const ackPrompt = `
Användaren har gett följande feedback på debriefsen:

"${feedback}"

${selectedAlternative ? `Valt alternativ: ${selectedAlternative}` : ''}

Svara KORT (max 2 meningar) och bekräfta att du förstått feedbacken.
Upprepa inte feedbacken - bekräfta bara att du förstått och vad du kommer göra.
Var koncis och professionell.
`;

    const acknowledgment = await agentOrchestrator.invokeAgent(
      'content-architect',
      ackPrompt,
      {},
      undefined,
      1, // Only 1 retry for quick response
      true // isBatch for faster response
    );

    return {
      acknowledged: true,
      message: acknowledgment.trim(),
    };
  }

  /**
   * Step 4: Regenerate debrief based on feedback
   */
  async regenerateDebrief(
    projectId: string,
    feedback: string,
    selectedAlternative?: string,
    onProgress?: (message: string) => void
  ): Promise<DebriefResult> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { sourceMaterials: true },
    });

    if (!project) throw new Error('Project not found');

    // Get previous research and debrief
    const previousSteps = await prisma.workflowStep.findMany({
      where: {
        projectId,
        step: { in: ['research', 'create_debrief'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    const researchResult = previousSteps.find(s => s.step === 'research')?.result || '';
    const previousDebrief = previousSteps.find(s => s.step === 'create_debrief')?.result || '';

    onProgress?.('🔄 Genererar ny debrief baserat på feedback...');

    const regeneratePrompt = `
Du är Content Architect och ska UPPDATERA debriefsen baserat på kundens feedback.

PROJEKT: ${project.name}

TIDIGARE DEBRIEF:
${previousDebrief}

KUNDENS FEEDBACK:
"${feedback}"

${selectedAlternative ? `Kunden föredrar riktning: ${selectedAlternative}` : ''}

RESEARCH-RESULTAT (för referens):
${researchResult}

DIN UPPGIFT:
Skapa en NY debrief som tar hänsyn till feedbacken. Använd samma JSON-format:

{
  "researchSummary": "Uppdaterad sammanfattning...",
  "sources": ["Källa 1", "Källa 2"],
  "alternatives": [
    {"id": "A", "title": "...", "description": "...", "recommended": true},
    {"id": "B", "title": "...", "description": "...", "recommended": false},
    {"id": "C", "title": "...", "description": "...", "recommended": false}
  ],
  "fullDebrief": "Uppdaterad komplett debrief..."
}

VIKTIGT:
- Anpassa alternativen baserat på feedbacken
- Om kunden valt ett alternativ, utveckla det vidare
- Håll alternativen distinkt olika
- Svara ENDAST med JSON
`;

    const newDebriefResult = await agentOrchestrator.invokeAgent(
      'content-architect',
      regeneratePrompt,
      { project, feedback, selectedAlternative },
      onProgress
    );

    // Parse and return
    let parsedDebrief: DebriefResult;
    try {
      const jsonMatch = newDebriefResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedDebrief = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch (e) {
      parsedDebrief = {
        researchSummary: newDebriefResult,
        sources: [],
        alternatives: [
          { id: 'A', title: 'Uppdaterat alternativ', description: newDebriefResult.substring(0, 500), recommended: true },
          { id: 'B', title: 'Alternativ B', description: 'Alternativt approach', recommended: false },
          { id: 'C', title: 'Alternativ C', description: 'Tredje alternativet', recommended: false },
        ],
        fullDebrief: newDebriefResult,
      };
    }

    // Store updated debrief
    await prisma.workflowStep.create({
      data: {
        projectId,
        phase: 'debrief',
        step: 'create_debrief',
        agentName: 'content-architect',
        status: 'completed',
        
        completedAt: new Date(),
        result: JSON.stringify(parsedDebrief),
      },
    });

    onProgress?.('✅ Ny debrief klar!');
    return parsedDebrief;
  }

  /**
   * Step 5: Approve debrief and proceed to matrix creation
   */
  async approveDebrief(
    projectId: string,
    selectedAlternative: string,
    onProgress?: (message: string) => void
  ): Promise<void> {
    onProgress?.('✅ Debrief godkänd!');

    // Store approval
    await prisma.workflowStep.create({
      data: {
        projectId,
        phase: 'debrief',
        step: 'approve_debrief',
        agentName: 'user',
        status: 'completed',
        
        completedAt: new Date(),
        result: JSON.stringify({ approved: true, selectedAlternative }),
      },
    });

    // Update project status
    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'matrix_creation' },
    });
  }
}

export const debriefWorkflowService = new DebriefWorkflowService();
