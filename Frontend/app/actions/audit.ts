'use server';

import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  type UIMessage,
} from 'ai';

import type { CandidateContext } from '@/lib/ai-orchestrator';
import { model } from '@/lib/ai-orchestrator';
import { SCOUT_PROMPT, analyzeCodebase } from '@/lib/ai/tools';
import {
  appendThoughtToTraceStore,
  type TraceEntry,
} from '@/lib/utils/trace-logger';

interface AuditStreamMetadata {
  thought: string;
  internalMonologue: string[];
  maxSteps: number;
  totalTokens?: number;
}

type AuditUIMessage = UIMessage<
  AuditStreamMetadata,
  {
    trace: TraceEntry;
  }
>;

function sanitizeThought(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

export async function auditCandidate(
  resumeData: CandidateContext['resume'],
  githubUrl: string,
  githubMarkdownContent: string,
): Promise<Response> {
  const thoughtTrace: string[] = [];
  const maxSteps = 5;

  const stream = createUIMessageStream<AuditUIMessage>({
    execute: ({ writer }) => {
      const addTrace = (agent: string, thought: string, evidence: string): void => {
        const cleanValue = sanitizeThought(thought);
        if (cleanValue.length === 0) {
          return;
        }

        thoughtTrace.push(cleanValue);

        const traceEntry = appendThoughtToTraceStore(agent, cleanValue, evidence);

        writer.write({
          type: 'data-trace',
          data: traceEntry,
          transient: true,
        });
      };

      addTrace(
        'Scout',
        'Scout preparing repository scan and claim-vs-code validation plan.',
        'Initializing audit flow with resume + repository markdown context.',
      );

      const result = streamText({
        model,
        tools: {
          analyzeCodebase,
        },
        stopWhen: stepCountIs(maxSteps),
        system: [
          SCOUT_PROMPT,
          'You are an autonomous hiring panel with three roles: Scout, Analyst, Judge.',
          'Run a multi-step process.',
          'Step 1 must call analyzeCodebase to extract technical evidence from repository markdown.',
          'Step 2 must compare analyzeCodebase output against resumeData and identify contradictions or overstatements.',
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
        ].join('\n'),
        prepareStep: ({ steps }) => {
          if (steps.length === 0) {
            addTrace(
              'Scout',
              'Scout found JWT logic... Analyst flagging missing CSRF protection... Judge weighing resume claim of "Security Expert" against this gap.',
              'Step 1 planning: force analyzeCodebase tool execution.',
            );
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
            addTrace(
              'Analyst',
              'Analyst mapping tool findings to resume claims and marking potential credibility gaps.',
              'Step 2 planning: compare tool output against resume claims.',
            );
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

          addTrace(
            'Judge',
            'Judge consolidating evidence into final risk-ranked interview plan.',
            `Step ${steps.length + 1} planning: synthesis without additional tool calls.`,
          );
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
            addTrace(
              'Analyst',
              'Scout completed code evidence collection. Analyst now stress-testing resume honesty against implementation details.',
              'Tool result from analyzeCodebase became available.',
            );
          } else {
            addTrace(
              'Judge',
              'Judge updating weighted confidence as new narrative evidence is synthesized.',
              'Completed a non-tool reasoning step.',
            );
          }
        },
      });

      writer.merge(
        result.toUIMessageStream({
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
        }),
      );
    },
  });

  return createUIMessageStreamResponse({ stream });
}
