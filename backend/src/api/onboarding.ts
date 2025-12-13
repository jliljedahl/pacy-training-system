import { Router } from 'express';
import { agentOrchestrator } from '../services/agentOrchestrator';

const router = Router();

/**
 * POST /api/onboarding/analyze-company
 * Analyzes a company website to extract business context for training programs
 */
router.post('/analyze-company', async (req, res, next) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Clean and validate URL
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    console.log(`[Onboarding] Analyzing company: ${cleanUrl}`);

    // Invoke company-researcher agent
    const result = await agentOrchestrator.invokeAgent(
      'company-researcher',
      `Analyze this company website and extract business context for creating training programs: ${cleanUrl}`,
      null,
      (msg) => console.log(`[company-researcher] ${msg}`)
    );

    // Parse JSON from agent response
    let companyData;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = result.match(/```json\s*([\s\S]*?)\s*```/) ||
                        result.match(/```\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : result;
      companyData = JSON.parse(jsonString.trim());
    } catch (parseError) {
      console.error('[Onboarding] Failed to parse agent response:', result.substring(0, 500));
      return res.status(500).json({
        error: true,
        errorType: 'parse_error',
        message: 'Failed to parse company analysis',
        rawResponse: result.substring(0, 1000)
      });
    }

    // Check for agent-reported errors
    if (companyData.error) {
      return res.status(400).json(companyData);
    }

    console.log(`[Onboarding] Successfully analyzed: ${companyData.company?.name || 'Unknown'}`);
    res.json(companyData);

  } catch (error: any) {
    console.error('[Onboarding] Error:', error.message);
    next(error);
  }
});

export default router;
