/**
 * AI Provider for Pacy Training System
 *
 * Provides a unified interface for AI model calls using OpenAI.
 * Supports both GPT-4o models and o1 reasoning models.
 */

import OpenAI from 'openai';
import { getModelConfig, getBatchModelConfig, ModelConfig } from './modelConfig';

// Initialize OpenAI client with extended timeout
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 120000, // 2 minutes
  maxRetries: 0, // We'll handle retries ourselves
});

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionOptions {
  agentName: string;
  systemPrompt: string;
  messages: ChatMessage[];
  isBatch?: boolean;
  temperature?: number;
  maxTokens?: number;
}

export interface CompletionResult {
  content: string;
  model: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

export interface StreamOptions extends CompletionOptions {
  onChunk: (chunk: string) => void;
}

/**
 * Check if a model is a new-generation model (GPT-5.x, o1)
 * These models have different API requirements
 */
function isNewGenerationModel(model: string): boolean {
  return model.startsWith('o1') || model.startsWith('gpt-5') || model.includes('gpt-5');
}

/**
 * Sleep helper for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry wrapper for OpenAI API calls with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  operation = 'OpenAI API call'
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Check if error is retryable
      const isRetryable =
        error.status === 503 || // Service unavailable
        error.status === 429 || // Rate limit
        error.status === 502 || // Bad gateway
        error.code === 'ECONNRESET' || // Connection reset
        error.code === 'ETIMEDOUT' || // Timeout
        error.message?.includes('timeout') ||
        error.message?.includes('ECONNREFUSED');

      if (!isRetryable || attempt === maxRetries) {
        console.error(`[AI Provider] ${operation} failed after ${attempt + 1} attempts:`, {
          status: error.status,
          code: error.code,
          message: error.message,
        });
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt) * 1000;
      console.log(
        `[AI Provider] ${operation} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`,
        {
          status: error.status,
          message: error.message,
        }
      );
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Check if a model requires max_completion_tokens instead of max_tokens
 */
function usesMaxCompletionTokens(model: string): boolean {
  return isNewGenerationModel(model);
}

/**
 * Check if a model supports custom temperature
 * New generation models only support default temperature (1)
 */
function supportsTemperature(model: string): boolean {
  return !isNewGenerationModel(model);
}

/**
 * Check if a model is an o1 reasoning model (uses developer role)
 */
function isReasoningModel(config: ModelConfig): boolean {
  return config.isReasoningModel === true || config.model.startsWith('o1');
}

/**
 * Get a completion from the AI model
 * Handles both standard GPT models and o1 reasoning models
 */
export async function getCompletion(options: CompletionOptions): Promise<CompletionResult> {
  const config = options.isBatch
    ? getBatchModelConfig(options.agentName)
    : getModelConfig(options.agentName);

  // o1 models have different requirements
  if (isReasoningModel(config)) {
    return getReasoningCompletion(options, config);
  }

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: options.systemPrompt },
    ...options.messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];

  const maxTokens = options.maxTokens || config.maxTokens || 4096;

  // Build request params based on model requirements
  const requestParams: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
    model: config.model,
    messages,
  };

  // Only set temperature for models that support it
  if (supportsTemperature(config.model)) {
    requestParams.temperature = options.temperature ?? 0.7;
  }

  // Use max_completion_tokens for newer models, max_tokens for older ones
  if (usesMaxCompletionTokens(config.model)) {
    requestParams.max_completion_tokens = maxTokens;
  } else {
    requestParams.max_tokens = maxTokens;
  }

  const response = await retryWithBackoff(
    () => openai.chat.completions.create(requestParams),
    3,
    `${options.agentName} completion`
  );

  const content = response.choices[0]?.message?.content || '';

  return {
    content,
    model: response.model,
    usage: {
      inputTokens: response.usage?.prompt_tokens || 0,
      outputTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
    },
  };
}

/**
 * Get a completion from o1 reasoning models
 * These models have specific requirements:
 * - Use 'developer' role instead of 'system'
 * - Use max_completion_tokens instead of max_tokens
 * - Don't support temperature parameter
 * - Don't support streaming
 */
async function getReasoningCompletion(
  options: CompletionOptions,
  config: ModelConfig
): Promise<CompletionResult> {
  // o1 models use 'developer' role for system instructions
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'developer', content: options.systemPrompt } as OpenAI.Chat.ChatCompletionMessageParam,
    ...options.messages.map(
      (m) =>
        ({
          role: m.role === 'system' ? 'developer' : m.role,
          content: m.content,
        }) as OpenAI.Chat.ChatCompletionMessageParam
    ),
  ];

  const response = await retryWithBackoff(
    () =>
      openai.chat.completions.create({
        model: config.model,
        messages,
        max_completion_tokens: options.maxTokens || config.maxTokens || 16384,
        // Note: o1 models don't support temperature parameter
      }),
    3,
    `${options.agentName} reasoning completion`
  );

  const content = response.choices[0]?.message?.content || '';

  return {
    content,
    model: response.model,
    usage: {
      inputTokens: response.usage?.prompt_tokens || 0,
      outputTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
    },
  };
}

/**
 * Get a streaming completion from the AI model
 * Note: o1 reasoning models don't support streaming, so they fall back to regular completion
 */
export async function getStreamingCompletion(options: StreamOptions): Promise<CompletionResult> {
  const config = options.isBatch
    ? getBatchModelConfig(options.agentName)
    : getModelConfig(options.agentName);

  // o1 models don't support streaming - fall back to regular completion
  if (isReasoningModel(config)) {
    const result = await getReasoningCompletion(options, config);
    // Emit the full response as a single chunk
    options.onChunk(result.content);
    return result;
  }

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: options.systemPrompt },
    ...options.messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];

  const maxTokens = options.maxTokens || config.maxTokens || 4096;

  // Build request params based on model requirements
  const requestParams: OpenAI.Chat.ChatCompletionCreateParamsStreaming = {
    model: config.model,
    messages,
    stream: true,
  };

  // Only set temperature for models that support it
  if (supportsTemperature(config.model)) {
    requestParams.temperature = options.temperature ?? 0.7;
  }

  // Use max_completion_tokens for newer models, max_tokens for older ones
  if (usesMaxCompletionTokens(config.model)) {
    requestParams.max_completion_tokens = maxTokens;
  } else {
    requestParams.max_tokens = maxTokens;
  }

  const stream = await retryWithBackoff(
    () => openai.chat.completions.create(requestParams),
    3,
    `${options.agentName} streaming completion`
  );

  let fullContent = '';
  let inputTokens = 0;
  let outputTokens = 0;

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    if (content) {
      fullContent += content;
      options.onChunk(content);
    }

    // Track usage from final chunk
    if (chunk.usage) {
      inputTokens = chunk.usage.prompt_tokens || 0;
      outputTokens = chunk.usage.completion_tokens || 0;
    }
  }

  return {
    content: fullContent,
    model: config.model,
    usage: {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
    },
  };
}

/**
 * Simple completion helper for quick calls
 */
export async function quickCompletion(
  agentName: string,
  systemPrompt: string,
  userMessage: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const result = await getCompletion({
    agentName,
    systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
    ...options,
  });
  return result.content;
}

/**
 * Check if OpenAI is configured
 */
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * Get the OpenAI client for direct access if needed
 */
export function getOpenAIClient(): OpenAI {
  return openai;
}
