/**
 * Model Configuration for Pacy Training System
 *
 * All content creation agents use OpenAI models.
 * See CLAUDE.md for model reference.
 */

export type ModelProvider = 'openai' | 'anthropic';

export interface ModelConfig {
  provider: ModelProvider;
  model: string;
  maxTokens?: number;
  isReasoningModel?: boolean;
}

// OpenAI model constants
const MODELS = {
  thinking: 'gpt-5.2', // For reasoning tasks
  fast: 'gpt-5.2-chat-latest', // For standard tasks
  coding: 'gpt-5-codex', // For code generation
  cheap: 'gpt-4.1-mini', // For simple/batch tasks
};

// Agent model configurations - all using OpenAI
export const agentModels: Record<string, ModelConfig> = {
  // Thinking/reasoning tasks - gpt-5.2
  'content-architect': {
    provider: 'openai',
    model: MODELS.thinking,
    maxTokens: 16384,
  },
  'research-director': {
    provider: 'openai',
    model: MODELS.thinking,
    maxTokens: 16384,
  },
  'content-quality-agent': {
    provider: 'openai',
    model: MODELS.thinking,
    maxTokens: 8192,
  },
  'hist-compliance-editor': {
    provider: 'openai',
    model: MODELS.thinking,
    maxTokens: 8192,
  },

  // Standard tasks - gpt-5.2-chat-latest
  'article-writer': {
    provider: 'openai',
    model: MODELS.fast,
    maxTokens: 6000, // Increased for 1000-1500 word articles with better narrative flow
  },
  'fact-checker': {
    provider: 'openai',
    model: MODELS.fast,
    maxTokens: 2048,
  },
  'source-analyst': {
    provider: 'openai',
    model: MODELS.fast,
    maxTokens: 4096,
  },
  'brief-interviewer': {
    provider: 'openai',
    model: MODELS.fast,
    maxTokens: 1024,
  },

  // Simple/batch tasks - gpt-4.1-mini
  'article-writer-batch': {
    provider: 'openai',
    model: MODELS.cheap,
    maxTokens: 4096,
  },
  'video-narrator': {
    provider: 'openai',
    model: MODELS.cheap,
    maxTokens: 1024,
  },
  'assessment-designer': {
    provider: 'openai',
    model: MODELS.cheap,
    maxTokens: 2048,
  },
  'ai-exercise-designer': {
    provider: 'openai',
    model: MODELS.cheap,
    maxTokens: 2048,
  },
  'program-matrix-formatter': {
    provider: 'openai',
    model: MODELS.cheap,
    maxTokens: 1024,
  },
  'company-researcher': {
    provider: 'openai',
    model: MODELS.cheap,
    maxTokens: 2048,
  },

  // Default fallback
  default: {
    provider: 'openai',
    model: MODELS.fast,
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
