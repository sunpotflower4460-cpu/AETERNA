/**
 * RuntimeSnapshotHistory.ts
 *
 * Context Panel Migration item 4/9 (Replay). Deliberately NOT built on
 * the existing src/replay/timeReplayBuffer.ts / TimeReplaySnapshot —
 * that type requires a full CellObservation (curvature, membrane,
 * vortex, etc.) that isn't available from the live legacy Runtime (see
 * PR8b/PR8c's notes on the same gap). This is a much smaller, real
 * buffer of RuntimeSnapshot (PR3) readings — tick/sigma/phi/energy/
 * arousal only, everything RuntimeSnapshot actually has today.
 *
 * Same bounded-ring-buffer, observation-only, no-fabrication design
 * principles as timeReplayBuffer.ts: oldest entries are dropped first,
 * a missing tick returns null (never interpolated), and replay never
 * rewinds the Runtime — it only re-displays a previously captured
 * RuntimeSnapshot.
 */

import type { RuntimeSnapshot } from '../runtime/RuntimeSnapshot.js';

export interface RuntimeSnapshotHistory {
  maxSnapshots: number;
  /** Newest-first. */
  snapshots: RuntimeSnapshot[];
}

export function createRuntimeSnapshotHistory(maxSnapshots = 60): RuntimeSnapshotHistory {
  return { maxSnapshots: Math.max(1, Math.floor(maxSnapshots)), snapshots: [] };
}

/** Returns a NEW history object — does not mutate the input. */
export function pushRuntimeSnapshot(
  history: RuntimeSnapshotHistory,
  snapshot: RuntimeSnapshot
): RuntimeSnapshotHistory {
  const filtered = history.snapshots.filter((s) => s.tick !== snapshot.tick);
  const next = [snapshot, ...filtered];
  const trimmed = next.length > history.maxSnapshots ? next.slice(0, history.maxSnapshots) : next;
  return { maxSnapshots: history.maxSnapshots, snapshots: trimmed };
}

export function getSnapshotByTick(history: RuntimeSnapshotHistory, tick: number): RuntimeSnapshot | null {
  return history.snapshots.find((s) => s.tick === tick) ?? null;
}

export function getTickRange(history: RuntimeSnapshotHistory): { minTick: number; maxTick: number } | null {
  if (history.snapshots.length === 0) return null;
  let min = Infinity;
  let max = -Infinity;
  for (const s of history.snapshots) {
    if (s.tick < min) min = s.tick;
    if (s.tick > max) max = s.tick;
  }
  return { minTick: min, maxTick: max };
}
