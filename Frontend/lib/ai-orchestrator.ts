import { createOpenAI } from '@ai-sdk/openai';

const cerebras = createOpenAI({
  baseURL: 'https://api.cerebras.ai/v1',
  apiKey: process.env.CEREBRAS_API_KEY,
});

export const model = cerebras.chat('llama3.1-8b');

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
    engineeringDNA?: {
      architecturePattern: string;
      stateManagement: string;
      namingConventions: string;
    };
  }>;
  discrepancies: string[];
  jdMatchScore?: number;
  actualApproach?: Array<{
    feature: string;
    method: string;
    observation: string;
  }>;
  contradictionScore?: number;
  savageVerdict?: string;
}

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
    actualApproach: [],
    contradictionScore: 0,
    savageVerdict: '',
  };
}
