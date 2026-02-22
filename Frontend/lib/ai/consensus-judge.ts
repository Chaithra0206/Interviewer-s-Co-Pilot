import { generateObject } from 'ai';
import { z } from 'zod';
import { model } from '../ai-orchestrator';
import type { CandidateContext } from '../ai-orchestrator';
import { behavioralCloserSchema, generateBehavioralCloser } from './behavioral-closer';
import type { BehavioralCloser } from './behavioral-closer';

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
  hireStatus: z.enum(['Hire', 'No-Hire', 'Junior-Level Hire', 'Reject']).describe('The definitive hiring decision.'),
  behavioralDNA: z.string().describe('A direct, forensic analysis of the candidate\'s Logic and Attitude as seen in the Interview Transcript.'),
  reasoning: z.string().describe('Direct, forensic reasoning supporting the verdict. No fluff.'),
  trace: z.array(z.string()).describe('Array of objective observations leading to the conclusion.'),
  behavioralCloser: behavioralCloserSchema.optional().describe('strategic high-impact behavioral question for the finish.'),
});

export type FinalVerdict = z.infer<typeof finalVerdictSchema>;

export async function generateFinalVerdict(
  context: FullCandidateContext,
): Promise<FinalVerdict> {
  const [verdictResult, behavioralResult] = await Promise.all([
    generateObject({
      model: model,
      schema: finalVerdictSchema.omit({ behavioralCloser: true }),
      system: `
        You are the Lead Hiring Committee Judge. Your tone is Savage, direct, and forensic. No fluff. No sugar-coating.
        
        Your goal is to reach a final 'hireStatus' verdict (Hire, No-Hire, Junior-Level Hire, or Reject). 
        
        CRITICAL WEIGHTING RULES:
        - Weight 'Code Evidence' (GitHub) exactly 60%.
        - Weight 'Resume Claims' exactly 40%.
        
        CONTRADICTION PENALTY:
        - If a major skill on the Resume (like 'Senior React') is missing or poorly implemented in the GitHub Repo, the hireStatus MUST default to 'Reject' or 'Junior-Level Hire', regardless of how well they speak in the interview.
        
        You must perform a direct Behavioral Analysis. Scrutinize the 'Interview Transcript' (Step 6) and identify the candidate's core Logic & Attitude.
        - Do they deflect accountability?
        - Do they bullshit when they don't know an answer?
        - Are they defensive when their architecture is questioned?
        
        Produce a definitive hiring decision, a forensic 'behavioralDNA' string, and brutal reasoning.
      `,
      prompt: [
        'Evaluate the candidate using the full context below.',
        'Resolve conflicts between Resume Claims and Actual Code with explicit reasoning.',
        '',
        'Candidate Context (JSON):',
        JSON.stringify(context, null, 2),
      ].join('\n'),
    }),
    generateBehavioralCloser(context)
  ]);

  return {
    ...verdictResult.object,
    behavioralCloser: behavioralResult
  };
}

