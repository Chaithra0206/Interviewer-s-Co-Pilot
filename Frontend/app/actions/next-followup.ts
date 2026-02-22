'use server';

import { generateObject } from 'ai';
import { z } from 'zod';

import { model } from '@/lib/ai-orchestrator';

const nextFollowupSchema = z.object({
  nextQuestion: z.string().trim().min(1),
});

export interface NextFollowupInput {
  selectedPrompt: string;
  action: string;
  candidateId: string;
  interviewTranscript: string;
  forensicContext?: unknown;
}

export interface NextFollowupOutput {
  nextQuestion: string;
}

export async function generateNextFollowup(input: NextFollowupInput): Promise<NextFollowupOutput> {
  const transcript = input.interviewTranscript ?? '';
  const transcriptTail = transcript.trim().length > 0 ? transcript.slice(-1200) : 'NO_TRANSCRIPT_AVAILABLE';

  const forensicText = JSON.stringify(input.forensicContext ?? {}, null, 0);
  const forensicTail = forensicText.length > 1500 ? forensicText.slice(-1500) : forensicText;

  const fallback: NextFollowupOutput = {
    nextQuestion: `Be specific: in this repo, which exact file/function implements “${input.selectedPrompt}”, and what are the key tradeoffs you made?`,
  };

  try {
    const { object } = await generateObject({
      model,
      schema: nextFollowupSchema,
      maxRetries: 0,
      system: [
        'You are a senior technical interviewer.',
        'Generate ONE next follow-up question. Keep it short and adversarial.',
        'If transcript is available, reference what the candidate said and pressure-test it.',
        'If transcript is not available, use forensic context to force implementation detail.',
        'Output strict JSON only.',
      ].join(' '),
      prompt: [
        `CandidateId: ${input.candidateId}`,
        `Selected prompt (${input.action}): ${input.selectedPrompt}`,
        'Transcript tail:',
        transcriptTail,
        'Forensic tail:',
        forensicTail,
      ].join('\n'),
    });

    return object;
  } catch (error) {
    console.warn('[generateNextFollowup] falling back due to model error', error);
    return fallback;
  }
}
