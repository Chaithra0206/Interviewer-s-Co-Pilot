import { openai } from '@ai-sdk/openai';

export interface CandidateContext {
  resume: {
    skills: string[];
    experience: any[];
    education: any[];
  };
  githubData: Array<{
    techStack: string[];
    patterns: string[];
    codeQuality: string;
  }>;
  discrepancies: string[];
  jdMatchScore?: number;
  signatureMatch?: string;
}

export const model = openai('gpt-4o');

export function getInitialContext(): CandidateContext {
  return {
    resume: {
      skills: [],
      experience: [],
      education: [],
    },
    githubData: [],
    discrepancies: [],
    jdMatchScore: 0,
    signatureMatch: '',
  };
}
