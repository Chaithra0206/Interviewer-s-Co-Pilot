'use server';

import { generateObject } from 'ai';
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

import { streamObject } from 'ai';

/** send callback type: (eventType, payload) => void */
type SendFn = (type: string, payload: unknown) => void;

export async function auditCandidate(
  resumeContext: CandidateContext['resume'],
  githubUrl: string,
  jobDescription?: string,
  githubMarkdownContent?: string,
  send?: SendFn
): Promise<CandidateContext & { interviewQuestions: string[] }> {
  const buildFallback = (reason: string, toolResult?: unknown): CandidateContext & { interviewQuestions: string[] } => {
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
    context.jdMatchScore = 60;
    context.contradictionScore = 45;
    context.savageVerdict = 'Partial Audit - fallback mode';
    context.actualApproach = [];
    context.discrepancies = [`Fallback triggered: ${reason}`];
    return {
      ...context,
      interviewQuestions: [
        'Walk me through one complex feature and why you designed it this way.',
        'Which resume claim should we validate first with code evidence?',
        'What security risk in this repo would you prioritize first?',
        'How would this architecture scale to 10x load?',
        'What tradeoff did you intentionally accept and why?',
      ],
    };
  };

  try {
    // Update 1: Scout is auditing repository structure...
    send?.('status', 'Scout is auditing repository structure...');
    const markdownContext = githubMarkdownContent || await Promise.race([
      fetchRepoStructure(githubUrl),
      new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error('Repository crawl timed out.')), 30000);
      }),
    ]);
    const boundedMarkdown = (markdownContext || '').substring(0, 12000);

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
    
    Fethed GitHub Markdown (Structure and code snippets):
    ${boundedMarkdown.substring(0, 8000)}
    
    Sub-Agent Code Analysis Findings:
    ${JSON.stringify(toolResult, null, 2)}
    
    Please compare the resume with the findings and generate the JSON audit.
  `;

    const { object } = await streamObject({
      model: model,
      system: systemPrompt,
      prompt: userPrompt,
      schema: auditResponseSchema,
    });
    const resolvedObject = await Promise.race([
      object,
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Final audit synthesis timed out.')), 45000);
      }),
    ]);

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

    context.discrepancies = resolvedObject.discrepancies.length > 0
      ? resolvedObject.discrepancies
      : ['Model analysis complete. No major discrepancies found.'];

    return {
      ...context,
      interviewQuestions: resolvedObject.interviewQuestions.length > 0
        ? resolvedObject.interviewQuestions
        : ['Could not generate specific questions. Ask the candidate to walk through their codebase.']
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown audit error';
    console.error('[auditCandidate] Fallback engaged:', reason);
    return buildFallback(reason);
  }
}
