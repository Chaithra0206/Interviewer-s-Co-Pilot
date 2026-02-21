'use server';

import { generateObject } from 'ai';
import { z } from 'zod';

import { model } from '../../lib/ai-orchestrator';

const syncAnalysisSchema = z.object({
  alert: z.string().nullable(),
  followUpQuestion: z.string().min(1),
  isGap: z.boolean(),
  gapCategory: z.enum(['Architecture Lie', 'Skill Gap', 'Red Flag', 'No Issue']),
  contradiction: z.string().nullable(),
  commitSentimentMatch: z.enum(['aligned', 'mixed', 'contradicted']),
  commitVibeNote: z.string().min(1),
});

export type SyncAnalysisResult = z.infer<typeof syncAnalysisSchema>;

export async function syncAnalysis(
  liveTranscript: string,
  forensicContext: unknown,
  githubRepoData: unknown,
): Promise<SyncAnalysisResult> {
  const { object } = await generateObject({
    model,
    schema: syncAnalysisSchema,
    system: [
      'You are a Shadow Interviewer with forensic audit access.',
      'Compare the Spoken Claim in the transcript to the Forensic Evidence in the GitHub context.',
      'If the candidate claims a skill contradicted by evidence, flag it as a SAVAGE GAP.',
      'Output strict JSON only.',
    ].join(' '),
    prompt: [
      'Forensic Context:',
      JSON.stringify(forensicContext, null, 2),
      '',
      'GitHub Repo Evidence:',
      JSON.stringify(githubRepoData, null, 2),
      '',
      'Transcript:',
      liveTranscript,
      '',
      [
        'Rules:',
        '1) If claim conflicts with evidence, set isGap=true and provide a specific contradiction.',
        "2) gapCategory must be one of: 'Architecture Lie' | 'Skill Gap' | 'Red Flag' | 'No Issue'.",
        '3) commitSentimentMatch should reflect whether current explanation aligns with historical commit vibe.',
        '4) Keep followUpQuestion adversarial and precise.',
      ].join('\n'),
    ].join('\n'),
  });

  return object;
}
