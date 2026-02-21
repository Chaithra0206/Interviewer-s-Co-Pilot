import { generateObject } from 'ai';
import { z } from 'zod';
import { model } from '../ai-orchestrator';

import type { CandidateContext } from '../ai-orchestrator';

export interface FullCandidateContext extends CandidateContext {
  interviewTranscript: string;
  interviewSummary?: string;
  redFlags?: string[];
  reasoningTrace?: Array<{
    at: string;
    stage: string;
    summary: string;
  }>;
}

const finalVerdictSchema = z.object({
  verdict: z.enum(['Hire', 'No-Hire', 'Strong Hire', 'Reject']),
  reasoning: z.string().min(1),
  trace: z.array(z.string().min(1)),
});

export type FinalVerdict = z.infer<typeof finalVerdictSchema>;

export async function generateFinalVerdict(
  context: FullCandidateContext,
): Promise<FinalVerdict> {
  const { object } = await generateObject({
    model: model,
    schema: finalVerdictSchema,
    system:
      "You are the Lead Hiring Committee Judge. Your goal is to reach a final Hire/No-Hire verdict. Compare the technical depth found in their GitHub repos with the honesty and clarity of their interview answers.",
    prompt: [
      'Evaluate the candidate using the full context below.',
      'Resolve conflicts between Resume Claims and Actual Code with explicit reasoning.',
      '',
      'Candidate Context (JSON):',
      JSON.stringify(context, null, 2),
    ].join('\n'),
  });

  return object;
}

