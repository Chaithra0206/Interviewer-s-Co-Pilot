'use server';

import { streamObject } from 'ai';
import { z } from 'zod';
import { model, CandidateContext, getInitialContext } from '../../lib/ai-orchestrator';
import { analyzeCodebase, SCOUT_PROMPT } from '@/lib/ai/tools';
import { fetchRepoStructure } from '@/lib/services/github-scraper';

const auditResponseSchema = z.object({
  jdMatchScore: z.number().describe('0-100 score of how the code matches JD needs'),
  contradictionScore: z.number().describe('0-100 score tracking contradictions. If skill inflation is detected, MUST be > 90.'),
  savageVerdict: z.string().describe('Savage verdict on candidate honesty. If skill inflation is detected, MUST equal "Immediate Reject - Skill Inflation Detected".'),
  actualApproach: z.array(z.object({
    feature: z.string().describe('The feature or requirement from the JD'),
    method: z.string().describe('How the candidate actually implemented it'),
    observation: z.string().describe('Analysis of their engineering DNA based on this match or mismatch')
  })).describe('Analysis of how the candidate\'s engineering DNA fits the specific JD.'),
  discrepancies: z.array(z.string()).describe('List of gaps, lies, or contradictions found.'),
  interviewQuestions: z.array(z.string()).describe('List of 5-7 specific, deep technical questions to pressure-test the candidate on their architecture choices and identified gaps.'),
});

/** send callback type: (eventType, payload) => void */
type SendFn = (type: string, payload: unknown) => void;

type NormalizedToolResult = {
  techStack: string[];
  findings: string[];
  complexityScore: number;
};

function normalizeToolResult(toolResult: unknown): NormalizedToolResult {
  if (
    !toolResult ||
    typeof toolResult !== 'object' ||
    typeof (toolResult as { [Symbol.asyncIterator]?: unknown })[Symbol.asyncIterator] === 'function'
  ) {
    return { techStack: [], findings: [], complexityScore: 3 };
  }

  const result = toolResult as {
    techStack?: unknown;
    findings?: unknown;
    complexityScore?: unknown;
  };

  return {
    techStack: Array.isArray(result.techStack)
      ? result.techStack.filter((item): item is string => typeof item === 'string')
      : [],
    findings: Array.isArray(result.findings)
      ? result.findings.filter((item): item is string => typeof item === 'string')
      : [],
    complexityScore:
      typeof result.complexityScore === 'number' && Number.isFinite(result.complexityScore)
        ? result.complexityScore
        : 3,
  };
}

function buildFallbackQuestionSet(
  resumeSkills: string[],
  techStack: string[],
  findings: string[],
): string[] {
  const skills = resumeSkills.slice(0, 4);
  const stack = techStack.slice(0, 4);
  const finding = findings[0];

  const questions: string[] = [
    'Walk me through one complex feature in your repo and justify its architecture decisions.',
    'If traffic spikes 10x, what would fail first and how would you redesign it?',
  ];

  for (const skill of skills) {
    questions.push(`You listed "${skill}" on your resume. Show exactly where and how you applied it in this repository.`);
    if (questions.length >= 7) break;
  }

  for (const tech of stack) {
    questions.push(`Why did you choose ${tech} here, and what alternative did you reject?`);
    if (questions.length >= 7) break;
  }

  if (finding && questions.length < 7) {
    questions.push(`The audit flagged: "${finding}". Explain the tradeoff and how you would fix it.`);
  }

  while (questions.length < 5) {
    questions.push('Pick one technical decision in this codebase you would undo today and explain why.');
  }

  return questions.slice(0, 7);
}

function buildFallback(
  reason: string,
  resumeContext: CandidateContext['resume'],
  toolResult?: unknown,
): CandidateContext & { interviewQuestions: string[] } {
  const context = getInitialContext();
  const normalized = normalizeToolResult(toolResult);

  const resumeSkills = resumeContext.skills ?? [];
  const resumeSkillSet = new Set(resumeSkills.map((s) => s.toLowerCase()));
  const matchedSkills = normalized.techStack.filter((tech) =>
    resumeSkillSet.has(tech.toLowerCase()),
  );
  const mismatchCount = Math.max(0, resumeSkills.length - matchedSkills.length);

  context.discrepancies = [`Audit failed: ${reason}`];
  context.githubData.push({
    techStack: normalized.techStack,
    patterns: normalized.findings,
    codeQuality: normalized.complexityScore >= 7 ? 'strong' : normalized.complexityScore >= 4 ? 'moderate' : 'basic',
  });

  context.jdMatchScore = Math.max(45, Math.min(85, 60 + matchedSkills.length * 5 - mismatchCount * 3));
  context.contradictionScore = Math.max(20, Math.min(90, 35 + mismatchCount * 8));
  context.savageVerdict =
    context.contradictionScore >= 75
      ? 'No-Hire - Significant Claim Mismatch (Fallback)'
      : context.contradictionScore >= 55
      ? 'Hold - Needs Deep Validation (Fallback)'
      : 'Proceed - Validate in Interview (Fallback)';

  return {
    ...context,
    interviewQuestions: buildFallbackQuestionSet(
      resumeSkills,
      normalized.techStack,
      normalized.findings,
    ),
  };
}

function buildFallbackResult(reason: string, toolResult: any): CandidateContext & { interviewQuestions: string[] } {
  return buildFallback(reason, getInitialContext().resume, toolResult);
}

export async function auditCandidate(
  resumeContext: CandidateContext['resume'],
  githubUrl: string,
  jobDescription?: string,
  githubMarkdownContent?: string,
  send?: SendFn
): Promise<CandidateContext & { interviewQuestions: string[] }> {

  try {
    // Update 1: Scout is auditing repository structure...
    send?.('status', 'Scout is auditing repository structure...');
    const markdownContext = githubMarkdownContent || await Promise.race([
      fetchRepoStructure(githubUrl),
      
    ]);
    const boundedMarkdown = (markdownContext ?? '').substring(0, 15000);

    // Update 2: Analyst is comparing React patterns against JD...
    send?.('status', 'Analyst is comparing React patterns against JD...');
    const toolResult = await Promise.race([
      analyzeCodebase.execute!(
        {
          repoUrl: githubUrl,
          resumeClaims: resumeContext.skills,
          markdownContent: boundedMarkdown,
        },
        { toolCallId: 'manual', messages: [] },
      ),
      new Promise<{
        contradictionScore: number;
        techStack: string[];
        complexityScore: number;
        gaps: string[];
        findings: string[];
      }>((resolve) => {
        setTimeout(() => {
          resolve({
            contradictionScore: 35,
            techStack: [],
            complexityScore: 3,
            gaps: ['Codebase analyzer timed out - fallback evidence used.'],
            findings: ['Analyzer timeout fallback.'],
          });
        }, 30000);
      }),
    ]);

    // Update 3: Judge is finalizing the Savage Verdict...
    send?.('status', 'Judge is finalizing the Savage Verdict...');

    const systemPrompt = `
      ${SCOUT_PROMPT}

      You are an expert technical interviewer and Senior Staff Software Engineer. 
      Your goal is to compare the provided Resume with the findings from the Sub-Agent's Codebase Analysis tool and Job Description.
      
      Instructions:
      1. JD ALIGNMENT (jdMatchScore): The score (0-100) must be strictly tied to the specific tools mentioned in the Job Description. If the JD asks for 'Tailwind' and they used 'Bootstrap', you MUST deduct points. Do not reward generic equivalents unless permitted by the JD.
      2. Identify gaps: If the resume says "Expert" but the code is "Basic", flag it.
      3. Identify contradictions: If the resume claims a skill not found in any project, mark it as a "Validation Required" topic.
         - CRITICAL RULE: If the candidate claims a high-level skill (like Rust, Cloud Architecture, C++) but the repository is low-level or basic (like HTML/JS, simple CRUD), you MUST set "contradictionScore" above 90 and set the "savageVerdict" to "Immediate Reject - Skill Inflation Detected".
      4. Generate 5-7 HIGHLY SPECIFIC, deep technical interview questions based on the "Engineering DNA" and technical stack found in the code.
         - Ask "WHY" they chose specific tools.
         - Ask about their state management and architectural patterns.
         - Do NOT ask generic definition questions. Base every question on their actual codebase implementation.
      5. Compile the actualApproach comparing their methods against the Job Description.

      Return your findings perfectly matching the JSON schema.
    `;

    const userPrompt = `
      Candidate Resume:
      ${JSON.stringify(resumeContext, null, 2)}
      
      GitHub Repository URL: ${githubUrl}

      Job Description:
      ${jobDescription || 'None provided'}
      
      Fetched GitHub Markdown (Structure and code snippets):
      ${boundedMarkdown.substring(0, 8000)}
      
      Sub-Agent Code Analysis Findings:
      ${JSON.stringify(toolResult, null, 2)}
      
      Please compare the resume with the findings and generate the JSON audit.
    `;

    let resolvedObject;
    try {
      const { object } = await streamObject({
        model: model,
        system: systemPrompt,
        prompt: userPrompt,
        schema: auditResponseSchema,
      });
      resolvedObject = await Promise.race([
        object,
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Final audit synthesis timed out.')), 45000); 
        }),
      ]);
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown audit synthesis error';
      console.warn('[auditCandidate] Falling back due to synthesis schema mismatch:', reason);
      return buildFallback(reason, resumeContext, toolResult);
    }

    // Construct and return final context
    const context = getInitialContext();
    context.resume = resumeContext;

    if (
      toolResult &&
      typeof toolResult === 'object' &&
      typeof (toolResult as { [Symbol.asyncIterator]?: unknown })[Symbol.asyncIterator] !== 'function'
    ) {
      const result = toolResult as {
        techStack?: unknown;
        findings?: unknown;
        complexityScore?: unknown;
      };
      const techStack = Array.isArray(result.techStack)
        ? result.techStack.filter((item): item is string => typeof item === 'string')
        : [];
      const patterns = Array.isArray(result.findings)
        ? result.findings.filter((item): item is string => typeof item === 'string')
        : [];
      const complexityScore =
        typeof result.complexityScore === 'number' && Number.isFinite(result.complexityScore)
          ? result.complexityScore
          : 3;
      context.githubData.push({
        techStack,
        patterns,
        codeQuality: complexityScore >= 7 ? 'strong' : complexityScore >= 4 ? 'moderate' : 'basic',
      });
    }

    context.jdMatchScore = resolvedObject.jdMatchScore;
    context.contradictionScore = resolvedObject.contradictionScore;
    context.savageVerdict = resolvedObject.savageVerdict;
    context.actualApproach = resolvedObject.actualApproach;

    context.discrepancies = (resolvedObject.discrepancies && resolvedObject.discrepancies.length > 0)
      ? resolvedObject.discrepancies
      : ['Model analysis complete. No major discrepancies found.'];

    return {
      ...context,
      interviewQuestions: (resolvedObject.interviewQuestions && resolvedObject.interviewQuestions.length > 0)
        ? resolvedObject.interviewQuestions
        : ['Could not generate specific questions. Ask the candidate to walk through their codebase.']
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown audit error';
    console.error('[auditCandidate] Fallback engaged:', reason);
    return buildFallback(reason, resumeContext);
  }
}
