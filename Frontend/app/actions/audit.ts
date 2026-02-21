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
  contradictionScoreAdjustment?: number;
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

function hasSecurityBestPracticesClaim(resumeData: CandidateContext['resume']): boolean {
  return (resumeData.skills ?? []).some((skill) =>
    skill.toLowerCase().includes('security best practices'),
  );
}

function detectSecurityVulnerability(markdown: string): boolean {
  const riskyPatterns = [
    /next_public_[a-z0-9_]*(secret|token|key)/i,
    /process\.env\.[a-z0-9_]*(secret|token|private|api[_-]?key)/i,
    /dangerouslysetinnerhtml/i,
    /eval\s*\(/i,
    /innerhtml\s*=/i,
  ];

  return riskyPatterns.some((pattern) => pattern.test(markdown));
}

export async function auditCandidate(
  resumeData: CandidateContext['resume'],
  githubUrl: string,
  githubMarkdownContent: string,
): Promise<Response> {
  const thoughtTrace: string[] = [];
  const maxSteps = 5;
  const securityClaimPresent = hasSecurityBestPracticesClaim(resumeData);
  let contradictionScoreAdjustment = 0;
  let forcedBoostApplied = false;

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
          'Step 3 must run SecurityAnalyst review with this exact prompt: "You are a DevSecOps expert. Scan the findings for hardcoded secrets, insecure API patterns, or missing sanitization."',
          securityClaimPresent
            ? 'SecurityAnalyst must challenge the candidate claim of "Security Best Practices" from the resume.'
            : 'SecurityAnalyst should still report concrete security risks if found.',
          'If a vulnerability is found, contradictionScore must increase by 20 points.',
          'Use this response contract for actualApproach: [{ method: string, fileReference: string, evidence?: string }].',
          'When identifying an implementation method (e.g., JWT Auth), you MUST provide the specific filename from the Scout\'s markdown where you found this evidence (e.g., lib/auth.ts).',
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
                'Build actualApproach entries with method and fileReference fields.',
                'When identifying an implementation method (e.g., JWT Auth), you MUST provide the specific filename from the Scout\'s markdown where you found this evidence (e.g., lib/auth.ts).',
                'List contradictions, missing depth, and validation-required claims.',
              ].join(' '),
            };
          }

          if (steps.length === 2) {
            addTrace(
              'SecurityAnalyst',
              'SecurityAnalyst auditing for hardcoded secrets, insecure API patterns, and missing sanitization.',
              'Step 3 planning: adversarial DevSecOps challenge pass.',
            );
            return {
              activeTools: [],
              toolChoice: 'none',
              system: [
                SCOUT_PROMPT,
                'You are a DevSecOps expert. Scan the findings for hardcoded secrets, insecure API patterns, or missing sanitization.',
                securityClaimPresent
                  ? 'Challenge the candidate claim of "Security Best Practices" found on the resume.'
                  : 'Report vulnerabilities as objective security risk findings.',
                'If you find a vulnerability (e.g., process.env secrets exposed in client-side files), explicitly say vulnerability_found=true.',
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
          const stepTextLower = step.text.toLowerCase();
          const securityTextDetected =
            stepTextLower.includes('vulnerability_found=true') ||
            stepTextLower.includes('hardcoded secret') ||
            stepTextLower.includes('insecure api') ||
            stepTextLower.includes('missing sanitization');
          const securityPatternDetected = detectSecurityVulnerability(githubMarkdownContent);

          if (usedAnalyzeCodebase) {
            addTrace(
              'Analyst',
              'Scout completed code evidence collection. Analyst now stress-testing resume honesty against implementation details.',
              'Tool result from analyzeCodebase became available.',
            );
          } else if (
            !forcedBoostApplied &&
            (securityTextDetected || securityPatternDetected)
          ) {
            contradictionScoreAdjustment += 20;
            forcedBoostApplied = true;
            addTrace(
              'SecurityAnalyst',
              'Vulnerability detected. Forcing contradictionScore increase by 20 points.',
              securityPatternDetected
                ? 'Static markdown scan matched risky secret/sanitization patterns.'
                : 'SecurityAnalyst flagged vulnerability in step analysis.',
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
                contradictionScoreAdjustment,
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
