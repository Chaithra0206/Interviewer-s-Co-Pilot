export type TraceEntry = {
  agent: string;
  thought: string;
  timestamp: number;
  evidence: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __TRACE_STORE__: TraceEntry[] | undefined;
}

function getGlobalStore(): TraceEntry[] {
  if (!globalThis.__TRACE_STORE__) {
    globalThis.__TRACE_STORE__ = [];
  }
  return globalThis.__TRACE_STORE__;
}

export function appendTrace(entry: TraceEntry): TraceEntry {
  const normalized: TraceEntry = {
    agent: entry.agent.trim(),
    thought: entry.thought.trim(),
    timestamp: entry.timestamp,
    evidence: entry.evidence.trim(),
  };

  getGlobalStore().push(normalized);
  return normalized;
}

export function appendThoughtToTraceStore(
  agent: string,
  thought: string,
  evidence: string,
): TraceEntry {
  return appendTrace({
    agent,
    thought,
    evidence,
    timestamp: Date.now(),
  });
}

export function getTraceStore(): TraceEntry[] {
  return [...getGlobalStore()];
}

export function clearTraceStore(): void {
  globalThis.__TRACE_STORE__ = [];
}
