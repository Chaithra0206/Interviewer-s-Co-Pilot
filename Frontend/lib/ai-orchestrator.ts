import { model as cerebrasModel } from './ai/config';

export const model = cerebrasModel;

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
