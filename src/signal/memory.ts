import type { SignalRuntimeResult, SignalDecision } from './types.js';

export type SignalMemoryEntry = {
  timestamp: number;
  utterance: string;
  decision: SignalDecision;
  debugNotes: string[];
};

// In-memory store. In a real persistence layer this would be written to disk/DB.
const memoryLog: SignalMemoryEntry[] = [];

export function recordSignalMemory(result: SignalRuntimeResult): SignalMemoryEntry {
  const entry: SignalMemoryEntry = {
    timestamp: Date.now(),
    utterance: result.utterance,
    decision: result.decision,
    debugNotes: [...result.debugNotes],
  };
  memoryLog.push(entry);
  return entry;
}

export function getSignalMemoryLog(): readonly SignalMemoryEntry[] {
  return memoryLog;
}

export function clearSignalMemoryLog(): void {
  memoryLog.length = 0;
}

// ── Revision Proposal ──
// Produces a minimal revision record that captures:
// - what was said (utterance)
// - what decision was made (stance, replyIntent)
// - diagnostic notes (debugNotes)
// Designed to be extended with pathway-level data in future versions.
export type RevisionProposal = {
  timestamp: number;
  utterance: string;
  stance: string;
  replyIntent: string;
  debugNotes: string[];
};

export function buildRevisionProposal(result: SignalRuntimeResult): RevisionProposal {
  return {
    timestamp: Date.now(),
    utterance: result.utterance,
    stance: result.decision.stance,
    replyIntent: result.decision.replyIntent,
    debugNotes: [...result.debugNotes],
  };
}
