/**
 * runtimeSnapshotHistory.test.ts
 *
 * Confirms:
 * - createRuntimeSnapshotHistory starts empty
 * - pushRuntimeSnapshot adds newest-first, does not mutate the input
 * - pushing a duplicate tick replaces the existing entry rather than duplicating it
 * - oldest entries are dropped once maxSnapshots is exceeded
 * - getSnapshotByTick returns null for a tick never recorded (no fabrication)
 * - getTickRange returns null when empty, and the correct min/max otherwise
 */

import { describe, it, expect } from 'vitest';
import {
  createRuntimeSnapshotHistory,
  pushRuntimeSnapshot,
  getSnapshotByTick,
  getTickRange,
} from '../../app/replay/RuntimeSnapshotHistory.js';
import type { RuntimeSnapshot } from '../../app/runtime/RuntimeSnapshot.js';

function makeSnapshot(tick: number, sigma = 1): RuntimeSnapshot {
  return {
    tick,
    timestamp: tick * 100,
    engineState: 'NEUTRAL',
    sigma,
    phi: null,
    energy: null,
    arousal: null,
    viability: null,
    closure: null,
    membrane: null,
    localField: null,
    repeatedFlowPaths: null,
    protoNetwork: null,
    observedRatios: null,
  };
}

describe('createRuntimeSnapshotHistory', () => {
  it('starts empty', () => {
    expect(createRuntimeSnapshotHistory().snapshots).toEqual([]);
  });
});

describe('pushRuntimeSnapshot', () => {
  it('adds newest-first and does not mutate the input history', () => {
    const h0 = createRuntimeSnapshotHistory();
    const h1 = pushRuntimeSnapshot(h0, makeSnapshot(1));
    const h2 = pushRuntimeSnapshot(h1, makeSnapshot(2));
    expect(h0.snapshots).toEqual([]);
    expect(h1.snapshots.map((s) => s.tick)).toEqual([1]);
    expect(h2.snapshots.map((s) => s.tick)).toEqual([2, 1]);
  });

  it('replaces an existing entry for the same tick rather than duplicating it', () => {
    let h = createRuntimeSnapshotHistory();
    h = pushRuntimeSnapshot(h, makeSnapshot(5, 1.0));
    h = pushRuntimeSnapshot(h, makeSnapshot(5, 1.5));
    expect(h.snapshots).toHaveLength(1);
    expect(h.snapshots[0].sigma).toBe(1.5);
  });

  it('drops the oldest entry once maxSnapshots is exceeded', () => {
    let h = createRuntimeSnapshotHistory(3);
    for (let tick = 1; tick <= 5; tick++) {
      h = pushRuntimeSnapshot(h, makeSnapshot(tick));
    }
    expect(h.snapshots).toHaveLength(3);
    expect(h.snapshots.map((s) => s.tick)).toEqual([5, 4, 3]);
  });
});

describe('getSnapshotByTick', () => {
  it('returns null for a tick never recorded — no interpolation/fabrication', () => {
    const h = pushRuntimeSnapshot(createRuntimeSnapshotHistory(), makeSnapshot(1));
    expect(getSnapshotByTick(h, 99)).toBeNull();
  });

  it('returns the matching snapshot', () => {
    const h = pushRuntimeSnapshot(createRuntimeSnapshotHistory(), makeSnapshot(7, 1.23));
    expect(getSnapshotByTick(h, 7)?.sigma).toBe(1.23);
  });
});

describe('getTickRange', () => {
  it('returns null when empty', () => {
    expect(getTickRange(createRuntimeSnapshotHistory())).toBeNull();
  });

  it('returns the correct min/max tick', () => {
    let h = createRuntimeSnapshotHistory();
    for (const tick of [10, 3, 7]) h = pushRuntimeSnapshot(h, makeSnapshot(tick));
    expect(getTickRange(h)).toEqual({ minTick: 3, maxTick: 10 });
  });
});
