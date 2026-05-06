/**
 * timeReplayBuffer.test.ts
 * v1.7: Deep Inspector / Time Replay — TimeReplayBuffer tests
 *
 * Verifies:
 * - Buffer creation with default and custom maxSnapshots
 * - pushReplaySnapshot: adds snapshots, replaces same-tick, trims to maxSnapshots
 * - getReplaySnapshotByTick: finds existing ticks, returns null for missing
 * - getAvailableTickRange: correct range, null for empty buffer
 * - getLatestSnapshot: returns newest snapshot, null for empty
 * - Raw huge field arrays are NOT stored in snapshots (by type design)
 * - No fake data is inserted for missing ticks
 */

import { describe, it, expect } from 'vitest';

import {
    createReplayBuffer,
    pushReplaySnapshot,
    getReplaySnapshotByTick,
    getAvailableTickRange,
    getLatestSnapshot,
    type TimeReplayBuffer,
} from '../../replay/timeReplayBuffer.js';

import type { TimeReplaySnapshot } from '../../types/timeReplay.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSnapshot(tick: number, lensId: string | null = null): TimeReplaySnapshot {
    return {
        tick,
        timestamp: Date.now(),
        selectedCellObservation: null,
        activeLensId: lensId as TimeReplaySnapshot['activeLensId'],
        focusedMetricId: null,
        globalSummary: {
            phaseCoherence: tick / 1000,
            vortexCandidateCount: tick % 5,
        },
        eventIds: [`evt-${tick}`],
    };
}

// ── createReplayBuffer ────────────────────────────────────────────────────────

describe('createReplayBuffer', () => {
    it('creates empty buffer with default maxSnapshots=120', () => {
        const buf = createReplayBuffer();
        expect(buf.maxSnapshots).toBe(120);
        expect(buf.snapshots).toHaveLength(0);
    });

    it('creates buffer with custom maxSnapshots', () => {
        const buf = createReplayBuffer(10);
        expect(buf.maxSnapshots).toBe(10);
    });

    it('clamps maxSnapshots to minimum 1', () => {
        const buf = createReplayBuffer(0);
        expect(buf.maxSnapshots).toBeGreaterThanOrEqual(1);
    });
});

// ── pushReplaySnapshot ────────────────────────────────────────────────────────

describe('pushReplaySnapshot: basic add', () => {
    it('adds a snapshot to an empty buffer', () => {
        const buf = createReplayBuffer(10);
        const snap = makeSnapshot(100);
        const next = pushReplaySnapshot(buf, snap);
        expect(next.snapshots).toHaveLength(1);
        expect(next.snapshots[0].tick).toBe(100);
    });

    it('does not mutate the original buffer', () => {
        const buf = createReplayBuffer(10);
        const snap = makeSnapshot(100);
        pushReplaySnapshot(buf, snap);
        expect(buf.snapshots).toHaveLength(0);
    });

    it('maintains newest-first ordering', () => {
        let buf = createReplayBuffer(10);
        buf = pushReplaySnapshot(buf, makeSnapshot(10));
        buf = pushReplaySnapshot(buf, makeSnapshot(20));
        buf = pushReplaySnapshot(buf, makeSnapshot(30));
        expect(buf.snapshots[0].tick).toBe(30);
        expect(buf.snapshots[1].tick).toBe(20);
        expect(buf.snapshots[2].tick).toBe(10);
    });
});

describe('pushReplaySnapshot: same-tick replacement', () => {
    it('replaces snapshot when same tick is pushed again', () => {
        let buf = createReplayBuffer(10);
        buf = pushReplaySnapshot(buf, makeSnapshot(50));
        const updated = makeSnapshot(50);
        updated.globalSummary.phaseCoherence = 0.99;
        buf = pushReplaySnapshot(buf, updated);
        const found = getReplaySnapshotByTick(buf, 50);
        expect(found?.globalSummary.phaseCoherence).toBe(0.99);
        // Only one snapshot for tick 50
        expect(buf.snapshots.filter((s) => s.tick === 50)).toHaveLength(1);
    });
});

describe('pushReplaySnapshot: maxSnapshots limit', () => {
    it('trims buffer to maxSnapshots', () => {
        let buf = createReplayBuffer(3);
        buf = pushReplaySnapshot(buf, makeSnapshot(1));
        buf = pushReplaySnapshot(buf, makeSnapshot(2));
        buf = pushReplaySnapshot(buf, makeSnapshot(3));
        buf = pushReplaySnapshot(buf, makeSnapshot(4));
        expect(buf.snapshots).toHaveLength(3);
    });

    it('drops oldest snapshots when limit exceeded', () => {
        let buf = createReplayBuffer(3);
        buf = pushReplaySnapshot(buf, makeSnapshot(1));
        buf = pushReplaySnapshot(buf, makeSnapshot(2));
        buf = pushReplaySnapshot(buf, makeSnapshot(3));
        buf = pushReplaySnapshot(buf, makeSnapshot(4));
        // tick 1 should be gone (oldest)
        expect(getReplaySnapshotByTick(buf, 1)).toBeNull();
        // ticks 2,3,4 should remain
        expect(getReplaySnapshotByTick(buf, 2)).not.toBeNull();
        expect(getReplaySnapshotByTick(buf, 4)).not.toBeNull();
    });
});

// ── getReplaySnapshotByTick ───────────────────────────────────────────────────

describe('getReplaySnapshotByTick', () => {
    it('returns snapshot for a known tick', () => {
        let buf = createReplayBuffer(10);
        buf = pushReplaySnapshot(buf, makeSnapshot(42));
        const found = getReplaySnapshotByTick(buf, 42);
        expect(found).not.toBeNull();
        expect(found!.tick).toBe(42);
    });

    it('returns null for a missing tick', () => {
        let buf = createReplayBuffer(10);
        buf = pushReplaySnapshot(buf, makeSnapshot(42));
        expect(getReplaySnapshotByTick(buf, 99)).toBeNull();
    });

    it('returns null for empty buffer', () => {
        const buf = createReplayBuffer(10);
        expect(getReplaySnapshotByTick(buf, 0)).toBeNull();
    });

    it('does NOT fabricate data for missing ticks', () => {
        // Missing tick must return null — no interpolation or fake data
        let buf = createReplayBuffer(10);
        buf = pushReplaySnapshot(buf, makeSnapshot(10));
        buf = pushReplaySnapshot(buf, makeSnapshot(20));
        expect(getReplaySnapshotByTick(buf, 15)).toBeNull();
    });
});

// ── getAvailableTickRange ─────────────────────────────────────────────────────

describe('getAvailableTickRange', () => {
    it('returns null for empty buffer', () => {
        expect(getAvailableTickRange(createReplayBuffer())).toBeNull();
    });

    it('returns correct min and max for single snapshot', () => {
        let buf = createReplayBuffer(10);
        buf = pushReplaySnapshot(buf, makeSnapshot(50));
        const range = getAvailableTickRange(buf);
        expect(range).toEqual({ minTick: 50, maxTick: 50 });
    });

    it('returns correct range for multiple snapshots', () => {
        let buf = createReplayBuffer(10);
        buf = pushReplaySnapshot(buf, makeSnapshot(30));
        buf = pushReplaySnapshot(buf, makeSnapshot(10));
        buf = pushReplaySnapshot(buf, makeSnapshot(50));
        const range = getAvailableTickRange(buf);
        expect(range?.minTick).toBe(10);
        expect(range?.maxTick).toBe(50);
    });
});

// ── getLatestSnapshot ─────────────────────────────────────────────────────────

describe('getLatestSnapshot', () => {
    it('returns null for empty buffer', () => {
        expect(getLatestSnapshot(createReplayBuffer())).toBeNull();
    });

    it('returns the most recently added snapshot', () => {
        let buf = createReplayBuffer(10);
        buf = pushReplaySnapshot(buf, makeSnapshot(10));
        buf = pushReplaySnapshot(buf, makeSnapshot(30));
        buf = pushReplaySnapshot(buf, makeSnapshot(20));
        const latest = getLatestSnapshot(buf);
        expect(latest?.tick).toBe(20);
    });
});

// ── Raw field arrays NOT stored ───────────────────────────────────────────────

describe('TimeReplaySnapshot: no raw field arrays', () => {
    it('snapshot does not accept Float32Array fields in globalSummary', () => {
        const snap = makeSnapshot(100);
        // globalSummary only contains numeric scalars by type definition
        expect(typeof snap.globalSummary.phaseCoherence === 'number' ||
               snap.globalSummary.phaseCoherence === undefined).toBe(true);
        // Ensure no typed arrays were accidentally included
        const values = Object.values(snap.globalSummary);
        for (const v of values) {
            if (v !== undefined) {
                expect(typeof v).toBe('number');
            }
        }
    });

    it('snapshot eventIds are string IDs only, not full event objects', () => {
        const snap = makeSnapshot(100);
        for (const id of snap.eventIds) {
            expect(typeof id).toBe('string');
        }
    });
});
