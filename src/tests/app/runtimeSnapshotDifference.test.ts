/**
 * runtimeSnapshotDifference.test.ts
 *
 * Confirms:
 * - computes delta = after - before for each of sigma/phi/energy/arousal
 * - a metric missing in either snapshot gets delta=null (never fabricated as 0)
 * - beforeTick/afterTick reflect the two snapshots' real ticks
 * - a null before or after snapshot produces null values/deltas throughout, not zeros
 */

import { describe, it, expect } from 'vitest';
import { buildRuntimeSnapshotDifference } from '../../app/replay/RuntimeSnapshotDifference.js';
import type { RuntimeSnapshot } from '../../app/runtime/RuntimeSnapshot.js';

function makeSnapshot(tick: number, overrides: Partial<RuntimeSnapshot> = {}): RuntimeSnapshot {
  return {
    tick,
    timestamp: tick * 100,
    engineState: 'NEUTRAL',
    sigma: 1,
    phi: 0.001,
    energy: 0.5,
    arousal: 0.02,
    viability: null,
    closure: null,
    membrane: null,
    localField: null,
    repeatedFlowPaths: null,
    protoNetwork: null,
    observedRatios: null,
    ...overrides,
  };
}

describe('buildRuntimeSnapshotDifference', () => {
  it('computes delta = after - before for each metric', () => {
    const before = makeSnapshot(1, { sigma: 1.0, phi: 0.001, energy: 0.5, arousal: 0.02 });
    const after = makeSnapshot(2, { sigma: 1.08, phi: 0.002, energy: 0.6, arousal: 0.03 });
    const diff = buildRuntimeSnapshotDifference(before, after);
    const byId = Object.fromEntries(diff.items.map((i) => [i.metricId, i]));
    expect(byId.sigma.delta).toBeCloseTo(0.08, 10);
    expect(byId.phi.delta).toBeCloseTo(0.001, 10);
    expect(byId.energy.delta).toBeCloseTo(0.1, 10);
    expect(byId.arousal.delta).toBeCloseTo(0.01, 10);
  });

  it('sets delta=null (not 0) when a metric is null in either snapshot', () => {
    const before = makeSnapshot(1, { energy: null });
    const after = makeSnapshot(2, { energy: 0.6 });
    const diff = buildRuntimeSnapshotDifference(before, after);
    const energy = diff.items.find((i) => i.metricId === 'energy');
    expect(energy?.before).toBeNull();
    expect(energy?.after).toBe(0.6);
    expect(energy?.delta).toBeNull();
  });

  it('reflects the real beforeTick/afterTick', () => {
    const diff = buildRuntimeSnapshotDifference(makeSnapshot(3), makeSnapshot(9));
    expect(diff.beforeTick).toBe(3);
    expect(diff.afterTick).toBe(9);
  });

  it('produces null tick/values/deltas throughout when before is null', () => {
    const diff = buildRuntimeSnapshotDifference(null, makeSnapshot(5));
    expect(diff.beforeTick).toBeNull();
    expect(diff.afterTick).toBe(5);
    for (const item of diff.items) {
      expect(item.before).toBeNull();
      expect(item.delta).toBeNull();
    }
  });

  it('produces null tick/values/deltas throughout when after is null', () => {
    const diff = buildRuntimeSnapshotDifference(makeSnapshot(5), null);
    expect(diff.afterTick).toBeNull();
    for (const item of diff.items) {
      expect(item.after).toBeNull();
      expect(item.delta).toBeNull();
    }
  });
});
