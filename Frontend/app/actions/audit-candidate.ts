'use server';

import { generateObject } from 'ai';
import { z } from 'zod';
import { model, CandidateContext, getInitialContext } from '../../lib/ai-orchestrator';
import { analyzeCodebase, SCOUT_PROMPT } from '../../lib/tools/github-analyzer';

const auditResponseSchema = z.object({
  discrepancies: z.array(z.string()).describe('List of gaps, lies, or contradictions found.'),
  interviewQuestions: z.array(z.string()).describe('Specific technical questions to pressure-test the candidate on the identified gaps.'),
});

export async function auditCandidate(
  resumeContext: CandidateContext['resume'],
  githubUrl: string
): Promise<CandidateContext & { interviewQuestions: string[] }> {
  
  // 1. Manually run the Sub-Agent Tool since generateObject doesn't support maxSteps
  const toolResult = await analyzeCodebase.execute!({
    repoUrl: githubUrl,
    resumeClaims: resumeContext.skills,
  }, { toolCallId: 'manual', messages: [] }); // Note: second arg varies by version, passing dummy for execute

  const systemPrompt = `
    ${SCOUT_PROMPT}

    You are an expert technical interviewer and architect. 
    Your goal is to compare the provided Resume with the findings from the Sub-Agent's Codebase Analysis tool.
    
    Instructions:
    1. Identify gaps: If the resume says "Expert" but the code is "Basic", flag it.
    2. Identify contradictions: If the resume claims a skill not found in any project, mark it as a "Validation Required" topic.
    3. Generate specific interview questions based on these gaps and contradictions.
    
    Return your findings perfectly matching the JSON schema.
    OUTPUT ONLY VALID JSON. Do not include markdown formatting, backticks, or conversational text. Start directly with {
    Example JSON:
    {
      "discrepancies": ["Claimed React Expert but found legacy class components."],
      "interviewQuestions": ["Can you explain the difference between useEffect and componentDidMount?"]
    }
  `;

  const userPrompt = `
    Candidate Resume:
    ${JSON.stringify(resumeContext, null, 2)}
    
    GitHub Repository URL: ${githubUrl}
    
    Sub-Agent Code Analysis Findings:
    ${JSON.stringify(toolResult, null, 2)}
    
    Please compare the resume with the findings and generate the discrepancies and questions.
  `;

  // 2. Generate structured output
  const { object } = await generateObject({
    model: model,
    mode: 'json',
    system: systemPrompt,
    prompt: userPrompt,
    schema: auditResponseSchema,
  });

  // 3. Construct and return final context
  const context = getInitialContext();
  context.resume = resumeContext;
  
  if (toolResult) {
    context.githubData.push(toolResult as any);
  }

  context.discrepancies = object.discrepancies.length > 0 
    ? object.discrepancies 
    : ['Model analysis complete. No major discrepancies found.'];

  return {
    ...context,
    interviewQuestions: object.interviewQuestions.length > 0 
      ? object.interviewQuestions 
      : ['Could not generate specific questions. Ask the candidate to walk through their codebase.']
  };
}
