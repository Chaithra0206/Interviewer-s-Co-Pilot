import { createOpenAI } from '@ai-sdk/openai';
import Cerebras from '@cerebras/cerebras_cloud_sdk';

// 1. Official SDK instance for direct, high-performance inference
export const cerebrasSDK = new Cerebras({
  apiKey: process.env.CEREBRAS_API_KEY || "csk-j2rxmh99redjd2jrt6tyj9k2kv2mxpmnfn28k2cpnk4hh86t",
});

// 2. Vercel AI SDK instance (OpenAI-compatible) for structured data features
// We use createOpenAI because the @ai-sdk/cerebras wrapper is currently unstable
export const cerebras = createOpenAI({
  baseURL: 'https://api.cerebras.ai/v1',
  apiKey: process.env.CEREBRAS_API_KEY || "csk-j2rxmh99redjd2jrt6tyj9k2kv2mxpmnfn28k2cpnk4hh86t",
});

// Export the specific model instance for the app
// Using llama3.1-8b as it is the most stable and available model for this account
export const model = cerebras.chat('llama3.1-8b');
