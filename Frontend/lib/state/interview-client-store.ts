import { useSyncExternalStore } from 'react';
import type { SyncAnalysisResult } from '@/app/actions/sync-analysis';

export interface InterviewClientState {
  hasIssue: boolean;
  issueCount: number;
  pulseTruthBadge: boolean;
  issueCategory: string | null;
  latestContradiction: string | null;
  commitSentimentMatch: 'aligned' | 'mixed' | 'contradicted' | null;
  commitVibeNote: string | null;
  lastAlert: string | null;
  lastFollowUpQuestion: string | null;
}

const initialState: InterviewClientState = {
  hasIssue: false,
  issueCount: 0,
  pulseTruthBadge: false,
  issueCategory: null,
  latestContradiction: null,
  commitSentimentMatch: null,
  commitVibeNote: null,
  lastAlert: null,
  lastFollowUpQuestion: null,
};

let state: InterviewClientState = initialState;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

function isCriticalAlert(alert: string | null): boolean {
  if (!alert) {
    return false;
  }

  const normalized = alert.toLowerCase();
  return (
    normalized.includes('discrepancy') ||
    normalized.includes('contradiction') ||
    normalized.includes('savage gap') ||
    normalized.includes('red flag') ||
    normalized.includes('gap')
  );
}

export function pushInterviewSyncResult(result: SyncAnalysisResult): InterviewClientState {
  const critical = result.isGap || isCriticalAlert(result.alert);

  state = {
    hasIssue: state.hasIssue || critical,
    issueCount: critical ? state.issueCount + 1 : state.issueCount,
    pulseTruthBadge: critical,
    issueCategory: critical ? result.gapCategory : state.issueCategory,
    latestContradiction: result.contradiction ?? state.latestContradiction,
    commitSentimentMatch: result.commitSentimentMatch,
    commitVibeNote: result.commitVibeNote,
    lastAlert: result.alert,
    lastFollowUpQuestion: result.followUpQuestion,
  };

  emit();
  return state;
}

export function clearInterviewPulse(): InterviewClientState {
  state = { ...state, pulseTruthBadge: false };
  emit();
  return state;
}

export function resetInterviewClientState(): void {
  state = initialState;
  emit();
}

export function getInterviewClientStateSnapshot(): InterviewClientState {
  return state;
}

export function useInterviewClientState(): InterviewClientState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getInterviewClientStateSnapshot,
    getInterviewClientStateSnapshot,
  );
}
