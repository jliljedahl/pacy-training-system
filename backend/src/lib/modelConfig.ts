/**
 * Model Configuration for Pacy Training System
 *
 * All content creation agents use OpenAI models.
 * GPT-5.2 for thinking/reasoning tasks, GPT-5.2-instant for standard tasks.
 */

export type ModelProvider = 'openai' | 'anthropic';

export interface ModelConfig {
  provider: ModelProvider;
  model: string;
  maxTokens?: number;
  isReasoningModel?: boolean;
}

// Agent model configurations - all using OpenAI
export const agentModels: Record<string, ModelConfig> = {
  // Thinking/reasoning tasks - GPT-5.2
  'content-architect': {
    provider: 'openai',
    model: 'gpt-5.2',
    maxTokens: 16384,
  },
  'research-director': {
    provider: 'openai',
    model: 'gpt-5.2',
    maxTokens: 16384,
  },
  'hist-compliance-editor': {
    provider: 'openai',
    model: 'gpt-5.2',
    maxTokens: 8192,
  },

  // Standard tasks - GPT-5.2-instant
  'article-writer': {
    provider: 'openai',
    model: 'gpt-5.2-instant',
    maxTokens: 4096,
  },
  'article-writer-batch': {
    provider: 'openai',
    model: 'gpt-5.2-instant',
    maxTokens: 4096,
  },
  'fact-checker': {
    provider: 'openai',
    model: 'gpt-5.2-instant',
    maxTokens: 2048,
  },
  'source-analyst': {
    provider: 'openai',
    model: 'gpt-5.2-instant',
    maxTokens: 4096,
  },
  'video-narrator': {
    provider: 'openai',
    model: 'gpt-5.2-instant',
    maxTokens: 1024,
  },
  'assessment-designer': {
    provider: 'openai',
    model: 'gpt-5.2-instant',
    maxTokens: 2048,
  },
  'brief-interviewer': {
    provider: 'openai',
    model: 'gpt-5.2-instant',
    maxTokens: 1024,
  },

  // Default fallback
  'default': {
    provider: 'openai',
    model: 'gpt-5.2-instant',
    maxTokens: 4096,
  },
};

/**
 * Get model configuration for an agent
 */
export function getModelConfig(agentName: string): ModelConfig {
  return agentModels[agentName] || agentModels['default'];
}

/**
 * Get model for batch operations (uses cheaper model)
 */
export function getBatchModelConfig(agentName: string): ModelConfig {
  const batchKey = `${agentName}-batch`;
  return agentModels[batchKey] || getModelConfig(agentName);
}
