import { model } from './ai/config';
export { model };

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
  };
}
