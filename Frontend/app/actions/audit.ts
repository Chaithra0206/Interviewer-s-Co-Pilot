'use server';

import { stepCountIs, streamText } from 'ai';

import type { CandidateContext } from '@/lib/ai-orchestrator';
import { model } from '@/lib/ai-orchestrator';
import { SCOUT_PROMPT, analyzeCodebase } from '@/lib/ai/tools';

interface AuditStreamMetadata {
  thought: string;
  internalMonologue: string[];
  maxSteps: number;
  totalTokens?: number;
}

function sanitizeThought(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

export async function auditCandidate(
  resumeData: CandidateContext['resume'],
  githubUrl: string,
  githubMarkdownContent: string,
  jobDescription: string,
): Promise<Response> {
  const thoughtTrace: string[] = [];
  const maxSteps = 5;

  const addThought = (value: string): void => {
    const cleanValue = sanitizeThought(value);
    if (cleanValue.length === 0) {
      return;
    }
    thoughtTrace.push(cleanValue);
  };

  addThought('Scout preparing repository scan and claim-vs-code validation plan.');

  const result = streamText({
    model,
    tools: {
      analyzeCodebase,
    },
    stopWhen: stepCountIs(maxSteps),
    system: [
      SCOUT_PROMPT,
      'You are now a Triple-Threat Auditor. You must triangulate findings between the Resume, the GitHub Code, and the Job Description.',
      'JD Alignment: Does the candidate write code that actually solves the specific problems in the JD? (e.g., If the JD asks for Scalable Microservices, but they only write Monoliths, penalize the score).',
      'Technical Debt vs. JD: If the JD requires high-performance systems but the code is unoptimized, flag this as a critical risk.',
      'Verdict: Your final recommendation must be based on the candidate\'s ability to perform the specific tasks in the JD, not just their general coding skill.',
      'Step 1 must call analyzeCodebase to extract technical evidence from repository markdown.',
      'Step 2 must compare analyzeCodebase output against resumeData and jobDescription, identifying contradictions or overstatements.',
      'Then produce discrepancies, confidence notes, and high-pressure interview questions.',
      'Keep findings concrete and tied to observable code signals.',
    ].join(' '),
    prompt: [
      'Resume Data:',
      JSON.stringify(resumeData, null, 2),
      '',
      `GitHub URL: ${githubUrl}`,
      'Repository Markdown:',
      githubMarkdownContent,
      '',
      'Job Description:',
      jobDescription,
    ].join('\n'),
    prepareStep: ({ steps }) => {
      if (steps.length === 0) {
        addThought('Scout found JWT logic... Analyst flagging missing CSRF protection... Judge weighing resume claim of "Security Expert" against this gap.');
        return {
          activeTools: ['analyzeCodebase'],
          toolChoice: { type: 'tool', toolName: 'analyzeCodebase' },
          system: [
            SCOUT_PROMPT,
            'Step 1 only: call analyzeCodebase now.',
            'Do not provide final conclusions in this step.',
          ].join(' '),
        };
      }

      if (steps.length === 1) {
        addThought('Analyst mapping tool findings to resume claims and marking potential credibility gaps.');
        return {
          activeTools: [],
          toolChoice: 'none',
          system: [
            SCOUT_PROMPT,
            'Step 2: compare prior analyzeCodebase output against resumeData.',
            'List contradictions, missing depth, and validation-required claims.',
          ].join(' '),
        };
      }

      addThought('Judge consolidating evidence into final risk-ranked interview plan.');
      return {
        activeTools: [],
        toolChoice: 'none',
      };
    },
    onStepFinish: (step) => {
      const usedAnalyzeCodebase = step.toolResults.some(
        (toolResult) => toolResult.toolName === 'analyzeCodebase',
      );

      if (usedAnalyzeCodebase) {
        addThought('Scout completed code evidence collection. Analyst now stress-testing resume honesty against implementation details.');
      } else {
        addThought('Judge updating weighted confidence as new narrative evidence is synthesized.');
      }
    },
  });

  return result.toUIMessageStreamResponse({
    messageMetadata: ({ part }): AuditStreamMetadata | undefined => {
      if (part.type === 'start') {
        return {
          thought: thoughtTrace.at(-1) ?? 'Scout initializing audit.',
          internalMonologue: [...thoughtTrace],
          maxSteps,
        };
      }

      if (part.type === 'finish') {
        return {
          thought: thoughtTrace.at(-1) ?? 'Judge completed final synthesis.',
          internalMonologue: [...thoughtTrace],
          maxSteps,
          totalTokens: part.totalUsage.totalTokens,
        };
      }

      return undefined;
    },
  });
}
