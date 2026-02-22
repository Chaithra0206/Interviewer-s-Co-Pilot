import type { CandidateContext } from '../ai-orchestrator';

export interface StoredCandidateContext {
  githubUrl: string;
  context: CandidateContext;
  updatedAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __LATEST_CANDIDATE_CONTEXT__: StoredCandidateContext | undefined;
}

export function setLatestCandidateContext(
  githubUrl: string,
  context: CandidateContext,
): StoredCandidateContext {
  const stored: StoredCandidateContext = {
    githubUrl,
    context,
    updatedAt: Date.now(),
  };

  globalThis.__LATEST_CANDIDATE_CONTEXT__ = stored;
  return stored;
}

export function getLatestCandidateContext(): StoredCandidateContext | null {
  return globalThis.__LATEST_CANDIDATE_CONTEXT__ ?? null;
}

