'use server';

import { generateText } from 'ai';
import { model, CandidateContext, getInitialContext } from '@/lib/ai-orchestrator';
import { analyzeCodebase, SCOUT_PROMPT } from '@/lib/ai/tools';

export async function auditCandidate(
  resumeContext: CandidateContext['resume'],
  githubUrl: string,
  githubMarkdownContent: string,
  jobDescription: string
): Promise<CandidateContext & { interviewQuestions: string[] }> {
  // We include the markdown content as a parameter since the action itself shouldn't 
  // be doing the crawling, it gets passed in.

  const systemPrompt = `
    ${SCOUT_PROMPT}

    Instruction Additions:
    - You MUST use the analyzeCodebase tool to extract jdMatchScore and signatureMatch based on the Job Description.

    Return your findings in a structured format:
    - discrepancies: Array of strings identifying lies, gaps or contradictions.
    - interviewQuestions: Array of strings with specific technical questions to pressure-test the candidate on the identified gaps.
  `;

  const userPrompt = `
    Candidate Resume:
    ${JSON.stringify(resumeContext, null, 2)}
    
    GitHub Repository URL: ${githubUrl}
    
    Job Description:
    ${jobDescription}
    
    Please analyze the repository using the provided tool and compare it with the resume and job description.
  `;

  // We are using generateText from ai-sdk
  const { text, toolCalls, toolResults } = await generateText({
    model: model,
    system: systemPrompt,
    prompt: userPrompt,
    tools: {
      analyzeCodebase,
    },
    maxSteps: 2, // Allow the model to call the tool and then generate the final response
  });

  // In a real application, you would use generateObject for structured output, 
  // but for this example, we'll extract the data from the text response or 
  // assume the model returns it in a parseable format if we asked for JSON.

  // For robustness, let's use generateObject if we want typed output, 
  // but sticking to generateText as requested:

  // We'll initialize a context
  const context = getInitialContext();
  context.resume = resumeContext;

  // Extract github data from tool results
  if (toolResults && toolResults.length > 0) {
    const analysisResult = toolResults.find(r => r.toolName === 'analyzeCodebase');
    if (analysisResult && analysisResult.result) {
      const payload: any = analysisResult.result;
      context.githubData.push(payload as any);

      if (payload.jdMatchScore !== undefined) {
        context.jdMatchScore = payload.jdMatchScore;
      }
      if (payload.signatureMatch) {
        context.signatureMatch = payload.signatureMatch;
      }
    }
  }

  // Very basic parsing of the text response to extract discrepancies and questions
  // In production, we strongly recommend using generateObject instead of generateText for this.
  const discrepancies: string[] = [];
  const interviewQuestions: string[] = [];

  const lines = text.split('\n');
  let currentSection = '';

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('discrepanc') || lowerLine.includes('gap') || lowerLine.includes('contradiction')) {
      currentSection = 'discrepancies';
      continue;
    } else if (lowerLine.includes('question') || lowerLine.includes('interview')) {
      currentSection = 'questions';
      continue;
    }

    if (line.trim().startsWith('-') || line.trim().match(/^\d+\./)) {
      const cleanLine = line.replace(/^-\s*/, '').replace(/^\d+\.\s*/, '').trim();
      if (cleanLine) {
        if (currentSection === 'discrepancies') {
          discrepancies.push(cleanLine);
        } else if (currentSection === 'questions') {
          interviewQuestions.push(cleanLine);
        }
      }
    }
  }

  context.discrepancies = discrepancies.length > 0 ? discrepancies : ['Model analysis complete. Review raw text for details if lists are empty: ' + text.substring(0, 100) + '...'];

  return {
    ...context,
    interviewQuestions: interviewQuestions.length > 0 ? interviewQuestions : ['Could not parse specific questions. Please ask the candidate to walk through their codebase.']
  };
}
