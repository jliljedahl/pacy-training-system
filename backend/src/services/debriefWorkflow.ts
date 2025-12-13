import { agentOrchestrator } from './agentOrchestrator';
import prisma from '../db/client';

export interface DebriefSource {
  name: string;
  type: string;
  year: string;
  relevance: string;
}

export interface DebriefResult {
  researchSummary: string;
  sources: DebriefSource[];
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

    onProgress?.('✅ Research klar!');
    return researchResult;
  }

  /**
   * Step 2: Generate debrief with 3 alternatives
   */
  async generateDebrief(
    projectId: string,
    researchResult: string,
    onProgress?: (message: string) => void
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
