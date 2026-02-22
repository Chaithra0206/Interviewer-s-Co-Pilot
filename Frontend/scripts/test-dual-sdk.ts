import { config } from 'dotenv';
import path from 'path';

// Load env before everything
config({ path: path.resolve(process.cwd(), '.env.local') });

import { cerebrasSDK, model } from '../lib/ai/config';
import { generateText } from 'ai';

async function test() {
  console.log('--- Phase 1: Testing Official Cerebras SDK ---');
  try {
    const sdkStart = Date.now();
    const response = await cerebrasSDK.chat.completions.create({
      model: 'llama3.1-8b',
      messages: [{ role: 'user', content: 'Say "SDK Working!"' }],
    });
    const firstChoice = (
      typeof response === 'object' && response !== null && 'choices' in response
        ? (response as { choices?: Array<{ message?: { content?: string } }> }).choices?.[0]
        : undefined
    );
    console.log('SDK Response:', firstChoice?.message?.content ?? '(no content)');
    console.log('SDK Time:', Date.now() - sdkStart, 'ms');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown SDK error';
    console.error('SDK Phase Failed:', message);
  }

  console.log('\n--- Phase 2: Testing Vercel AI SDK Bridge ---');
  try {
    const aiSdkStart = Date.now();
    const { text } = await generateText({
      model,
      prompt: 'Say "AI SDK Working!"',
    });
    console.log('AI SDK Response:', text);
    console.log('AI SDK Time:', Date.now() - aiSdkStart, 'ms');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown AI SDK error';
    console.error('AI SDK Phase Failed:', message);
  }
}

test();
