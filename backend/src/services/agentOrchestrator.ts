import { getCompletion, isOpenAIConfigured } from '../lib/aiProvider';
import { getModelConfig } from '../lib/modelConfig';
import fs from 'fs/promises';
import path from 'path';

// Validate API key on startup
if (!process.env.OPENAI_API_KEY) {
  console.warn('WARNING: OPENAI_API_KEY not found in environment variables');
  console.warn('API calls will fail. Please set OPENAI_API_KEY in your .env file');
}

export interface AgentConfig {
  name: string;
  description: string;
  tools: string[];
  model?: 'sonnet' | 'opus' | 'haiku'; // Legacy from Anthropic, now ignored
  systemPrompt: string;
}

export class AgentOrchestrator {
  private agentConfigs: Map<string, AgentConfig> = new Map();

  constructor() {
    this.loadAgents();
  }

  private async loadAgents() {
    const agentsDir = path.resolve(__dirname, '../../../.claude/agents');
    const files = await fs.readdir(agentsDir);

    for (const file of files) {
      if (file.endsWith('.md')) {
        const content = await fs.readFile(path.join(agentsDir, file), 'utf-8');
        const agent = this.parseAgentFile(content);
        if (agent) {
          this.agentConfigs.set(agent.name, agent);
        }
      }
    }

    console.log(`Loaded ${this.agentConfigs.size} agents:`, Array.from(this.agentConfigs.keys()));
  }

  private parseAgentFile(content: string): AgentConfig | null {
    // Parse frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontmatterMatch) return null;

    const frontmatter = frontmatterMatch[1];
    const systemPrompt = frontmatterMatch[2].trim();

    const config: any = { systemPrompt };

    // Parse YAML-like frontmatter
    const lines = frontmatter.split('\n');
    for (const line of lines) {
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();

      if (key === 'name') config.name = value;
      if (key === 'description') config.description = value;
      if (key === 'model') config.model = value;
      if (key === 'tools') {
        config.tools = value.split(',').map((t: string) => t.trim());
      }
    }

    return config.name ? config : null;
  }

  async invokeAgent(
    agentName: string,
    prompt: string,
    context?: any,
    onProgress?: (message: string) => void,
    retries: number = 3,
    isBatch: boolean = false
  ): Promise<string> {
    const agent = this.agentConfigs.get(agentName);
    if (!agent) {
      throw new Error(`Agent ${agentName} not found`);
    }

    const modelConfig = getModelConfig(agentName);
    onProgress?.(`[${agentName}] Using ${modelConfig.model}...`);

    // Build full prompt with context
    let fullPrompt = prompt;
    if (context) {
      fullPrompt = `CONTEXT:\n${JSON.stringify(context, null, 2)}\n\nTASK:\n${prompt}`;
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Add progressive delay between agent calls to avoid rate limits
        if (attempt === 0) {
          const baseDelay = 1000; // 1 second base delay (OpenAI is faster)
          await new Promise(resolve => setTimeout(resolve, baseDelay));
        }

        // Validate API key before making request
        if (!isOpenAIConfigured()) {
          throw new Error('OPENAI_API_KEY is not set. Please configure your API key in the .env file.');
        }

        const result = await getCompletion({
          agentName,
          systemPrompt: agent.systemPrompt,
          messages: [{ role: 'user', content: fullPrompt }],
          isBatch,
          maxTokens: modelConfig.maxTokens,
        });

        onProgress?.(`[${agentName}] completed (${result.usage.totalTokens} tokens, ${result.model})`);

        return result.content;
      } catch (error: any) {
        const errorStatus = error.status || error.statusCode;
        const errorMessage = error.message || String(error);

        // Check for different types of API errors
        const isRateLimit = errorStatus === 429 ||
                           errorMessage.includes('rate_limit') ||
                           errorMessage.includes('too many requests');
        const isAuthError = errorStatus === 401 ||
                          errorStatus === 403 ||
                          errorMessage.includes('api key') ||
                          errorMessage.includes('authentication') ||
                          errorMessage.includes('unauthorized');
        const isTimeout = errorMessage.includes('timeout') ||
                         errorMessage.includes('ETIMEDOUT') ||
                         errorMessage.includes('ECONNRESET');
        const isServerError = errorStatus >= 500 && errorStatus < 600;

        // Log detailed error for debugging
        console.error(`[${agentName}] API Error:`, {
          status: errorStatus,
          message: errorMessage,
          type: isRateLimit ? 'rate_limit' :
                isAuthError ? 'auth_error' :
                isTimeout ? 'timeout' :
                isServerError ? 'server_error' : 'unknown',
          attempt: attempt + 1,
          retries: retries
        });

        // Handle rate limits with exponential backoff
        if (isRateLimit && attempt < retries) {
          const waitTime = Math.pow(2, attempt) * 10000; // 10s, 20s, 40s
          onProgress?.(`Rate limit hit. Waiting ${waitTime / 1000}s before retry ${attempt + 1}/${retries}...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        // Handle auth errors - don't retry, fail immediately
        if (isAuthError) {
          onProgress?.(`Authentication error: ${errorMessage}. Please check your API key.`);
          throw new Error(`API Authentication failed: ${errorMessage}. Please check your OPENAI_API_KEY environment variable.`);
        }

        // Handle timeouts - retry with longer delay
        if (isTimeout && attempt < retries) {
          const waitTime = 5000 * (attempt + 1); // 5s, 10s, 15s
          onProgress?.(`Connection timeout. Waiting ${waitTime / 1000}s before retry ${attempt + 1}/${retries}...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        // Handle server errors - retry with exponential backoff
        if (isServerError && attempt < retries) {
          const waitTime = Math.pow(2, attempt) * 5000; // 5s, 10s, 20s
          onProgress?.(`Server error (${errorStatus}). Waiting ${waitTime / 1000}s before retry ${attempt + 1}/${retries}...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        // For other errors, provide detailed message
        const detailedMessage = errorStatus
          ? `Status ${errorStatus}: ${errorMessage}`
          : errorMessage;

        onProgress?.(`[${agentName}] failed: ${detailedMessage}`);
        throw error;
      }
    }

    throw new Error(`${agentName} failed after ${retries} retries`);
  }

  getAgent(name: string): AgentConfig | undefined {
    return this.agentConfigs.get(name);
  }

  getAllAgents(): AgentConfig[] {
    return Array.from(this.agentConfigs.values());
  }
}

// Singleton instance
export const agentOrchestrator = new AgentOrchestrator();
