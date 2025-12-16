/**
 * Model Configuration for Pacy Training System
 *
 * All content creation agents use Anthropic Claude models.
 * See CLAUDE.md for model reference.
 */

export type ModelProvider = 'openai' | 'anthropic';

export interface ModelConfig {
  provider: ModelProvider;
  model: string;
  maxTokens?: number;
  isReasoningModel?: boolean;
}

// Anthropic Claude model constants
const MODELS = {
  thinking: 'claude-opus-4-5-20251101', // For reasoning tasks
  fast: 'claude-sonnet-4-5-20250929', // For standard tasks (what I'm running on!)
  cheap: 'claude-haiku-4-5-20251001', // For simple/batch tasks
};

// Agent model configurations - all using Anthropic Claude
export const agentModels: Record<string, ModelConfig> = {
  // Thinking/reasoning tasks - Claude Opus 4
  'content-architect': {
    provider: 'anthropic',
    model: MODELS.thinking,
    maxTokens: 16384,
  },
  'research-director': {
    provider: 'anthropic',
    model: MODELS.thinking,
    maxTokens: 16384,
  },
  'content-quality-agent': {
    provider: 'anthropic',
    model: MODELS.thinking,
    maxTokens: 8192,
  },
  'hist-compliance-editor': {
    provider: 'anthropic',
    model: MODELS.thinking,
    maxTokens: 8192,
  },

  // Standard tasks - Claude Sonnet 4.5
  'article-writer': {
    provider: 'anthropic',
    model: MODELS.fast,
    maxTokens: 6000, // Increased for 1000-1500 word articles with better narrative flow
  },
  'fact-checker': {
    provider: 'anthropic',
    model: MODELS.fast,
    maxTokens: 2048,
  },
  'source-analyst': {
    provider: 'anthropic',
    model: MODELS.fast,
    maxTokens: 4096,
  },
  'brief-interviewer': {
    provider: 'anthropic',
    model: MODELS.fast,
    maxTokens: 1024,
  },

  // Simple/batch tasks - Claude Haiku 3.5
  'article-writer-batch': {
    provider: 'anthropic',
    model: MODELS.cheap,
    maxTokens: 4096,
  },
  'video-narrator': {
    provider: 'anthropic',
    model: MODELS.cheap,
    maxTokens: 1024,
  },
  'assessment-designer': {
    provider: 'anthropic',
    model: MODELS.cheap,
    maxTokens: 2048,
  },
  'ai-exercise-designer': {
    provider: 'anthropic',
    model: MODELS.cheap,
    maxTokens: 2048,
  },
  'program-matrix-formatter': {
    provider: 'anthropic',
    model: MODELS.cheap,
    maxTokens: 1024,
  },
  'company-researcher': {
    provider: 'anthropic',
    model: MODELS.cheap,
    maxTokens: 2048,
  },

  // Default fallback
  default: {
    provider: 'anthropic',
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
