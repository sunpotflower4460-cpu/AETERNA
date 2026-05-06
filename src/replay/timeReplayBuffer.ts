/**
 * timeReplayBuffer.ts
 * v1.7: Deep Inspector / Time Replay
 *
 * Manages a bounded ring-buffer of TimeReplaySnapshot entries.
 *
 * Design principles:
 * - maxSnapshots is always respected: oldest entries are dropped first.
 * - Raw field buffers are never stored (enforced by TimeReplaySnapshot type).
 * - Memory leak prevention: old snapshots are discarded when limit is exceeded.
 * - Replay is observation-only: the runtime is NOT rewound.
 * - Missing ticks return null — no interpolation or fabrication.
 *
 * Guardrails:
 * - This buffer stores lightweight observation snapshots only.
 * - It does NOT store raw field arrays.
 * - Retrieving a missing tick returns null — fake data is never inserted.
 *
 * Reference: docs/deep-inspector-time-replay.md
 */

import type { TimeReplaySnapshot } from '../types/timeReplay.ts';

// ── TimeReplayBuffer ──────────────────────────────────────────────────────────

/**
 * Bounded buffer of TimeReplaySnapshot entries.
 * Snapshots are stored newest-first after each push.
 */
export interface TimeReplayBuffer {
    /** Maximum number of snapshots to retain. Oldest are dropped when exceeded. */
    maxSnapshots: number;
    /** Stored snapshots, ordered newest-first (index 0 = most recent). */
    snapshots: TimeReplaySnapshot[];
}

// ── createReplayBuffer ────────────────────────────────────────────────────────

/**
 * Create a new empty TimeReplayBuffer.
 *
 * @param maxSnapshots - Maximum number of snapshots to retain (default: 120)
 */
export function createReplayBuffer(maxSnapshots = 120): TimeReplayBuffer {
    return { maxSnapshots: Math.max(1, Math.floor(maxSnapshots)), snapshots: [] };
}

// ── pushReplaySnapshot ────────────────────────────────────────────────────────

/**
 * Push a new snapshot into the buffer and return the updated buffer.
 *
 * If the buffer already contains a snapshot for the same tick, it is replaced.
 * When the buffer would exceed maxSnapshots, the oldest snapshot is dropped.
 *
 * IMPORTANT: This function returns a new buffer object — it does NOT mutate
 * the input buffer.  The runtime is not affected.
 *
 * @param buffer   - Existing TimeReplayBuffer
 * @param snapshot - New snapshot to add
 * @returns        - New TimeReplayBuffer with the snapshot added
 */
export function pushReplaySnapshot(
    buffer: TimeReplayBuffer,
    snapshot: TimeReplaySnapshot,
): TimeReplayBuffer {
    // Replace existing snapshot for same tick if present
    const filtered = buffer.snapshots.filter((s) => s.tick !== snapshot.tick);
    // Prepend new snapshot (newest-first ordering)
    const next = [snapshot, ...filtered];
    // Trim to maxSnapshots (drop oldest = tail of array)
    const trimmed = next.length > buffer.maxSnapshots
        ? next.slice(0, buffer.maxSnapshots)
        : next;
    return { maxSnapshots: buffer.maxSnapshots, snapshots: trimmed };
}

// ── getReplaySnapshotByTick ───────────────────────────────────────────────────

/**
 * Retrieve the snapshot for a specific tick, or null if not available.
 *
 * Missing ticks always return null.  No interpolation or fabrication is
 * performed.  The caller must handle the null case.
 *
 * @param buffer - TimeReplayBuffer to search
 * @param tick   - Simulation tick to look up
 * @returns      - Matching snapshot, or null if not found
 */
export function getReplaySnapshotByTick(
    buffer: TimeReplayBuffer,
    tick: number,
): TimeReplaySnapshot | null {
    return buffer.snapshots.find((s) => s.tick === tick) ?? null;
}

// ── getAvailableTickRange ─────────────────────────────────────────────────────

/**
 * Return the range [minTick, maxTick] of ticks currently stored in the buffer.
 * Returns null when the buffer is empty.
 *
 * @param buffer - TimeReplayBuffer to query
 */
export function getAvailableTickRange(
    buffer: TimeReplayBuffer,
): { minTick: number; maxTick: number } | null {
    if (buffer.snapshots.length === 0) return null;
    let min = Infinity;
    let max = -Infinity;
    for (const s of buffer.snapshots) {
        if (s.tick < min) min = s.tick;
        if (s.tick > max) max = s.tick;
    }
    return { minTick: min, maxTick: max };
}

// ── getLatestSnapshot ─────────────────────────────────────────────────────────

/**
 * Return the most recently added snapshot, or null if the buffer is empty.
 *
 * @param buffer - TimeReplayBuffer to query
 */
export function getLatestSnapshot(
    buffer: TimeReplayBuffer,
): TimeReplaySnapshot | null {
    return buffer.snapshots[0] ?? null;
}
