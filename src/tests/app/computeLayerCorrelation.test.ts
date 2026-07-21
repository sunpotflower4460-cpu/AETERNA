/**
 * computeLayerCorrelation.test.ts
 *
 * Confirms:
 * - all 6 metric pairs (sigma/phi/energy/arousal, C(4,2)) are returned
 * - a perfect positive correlation (identical linear relationship) computes to 1
 * - a perfect negative correlation computes to -1
 * - null (not 0) when fewer than 2 paired samples are available (no fabrication)
 * - null when a metric has zero variance (constant value — correlation undefined)
 * - a metric missing (null) in some snapshots is excluded from that pair's sample, not treated as 0
 */

import { describe, it, expect } from 'vitest';
import { computeLayerCorrelation } from '../../app/replay/computeLayerCorrelation.js';
import {
  createRuntimeSnapshotHistory,
  pushRuntimeSnapshot,
} from '../../app/replay/RuntimeSnapshotHistory.js';
import type { RuntimeSnapshot } from '../../app/runtime/RuntimeSnapshot.js';

function makeSnapshot(tick: number, overrides: Partial<RuntimeSnapshot> = {}): RuntimeSnapshot {
  return {
    tick,
    timestamp: tick * 100,
    engineState: 'NEUTRAL',
    sigma: null,
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
    ...overrides,
  };
}

describe('computeLayerCorrelation', () => {
  it('returns all 6 metric pairs', () => {
    const result = computeLayerCorrelation(createRuntimeSnapshotHistory());
    expect(result.pairs).toHaveLength(6);
    const pairNames = result.pairs.map((p) => `${p.metricA}-${p.metricB}`);
    expect(pairNames).toEqual([
      'sigma-phi',
      'sigma-energy',
      'sigma-arousal',
      'phi-energy',
      'phi-arousal',
      'energy-arousal',
    ]);
  });

  it('computes 1 for a perfect positive linear relationship', () => {
    let h = createRuntimeSnapshotHistory();
    for (let i = 1; i <= 5; i++) {
      h = pushRuntimeSnapshot(h, makeSnapshot(i, { sigma: i, energy: i * 2 }));
    }
    const pair = computeLayerCorrelation(h).pairs.find((p) => p.metricA === 'sigma' && p.metricB === 'energy');
    expect(pair?.correlation).toBeCloseTo(1, 10);
    expect(pair?.sampleSize).toBe(5);
  });

  it('computes -1 for a perfect negative linear relationship', () => {
    let h = createRuntimeSnapshotHistory();
    for (let i = 1; i <= 5; i++) {
      h = pushRuntimeSnapshot(h, makeSnapshot(i, { sigma: i, energy: -i }));
    }
    const pair = computeLayerCorrelation(h).pairs.find((p) => p.metricA === 'sigma' && p.metricB === 'energy');
    expect(pair?.correlation).toBeCloseTo(-1, 10);
  });

  it('returns null (not 0) when fewer than 2 paired samples exist', () => {
    let h = createRuntimeSnapshotHistory();
    h = pushRuntimeSnapshot(h, makeSnapshot(1, { sigma: 1, energy: 2 }));
    const pair = computeLayerCorrelation(h).pairs.find((p) => p.metricA === 'sigma' && p.metricB === 'energy');
    expect(pair?.correlation).toBeNull();
    expect(pair?.sampleSize).toBe(1);
  });

  it('returns null when a metric has zero variance', () => {
    let h = createRuntimeSnapshotHistory();
    for (let i = 1; i <= 5; i++) {
      h = pushRuntimeSnapshot(h, makeSnapshot(i, { sigma: 1, energy: i }));
    }
    const pair = computeLayerCorrelation(h).pairs.find((p) => p.metricA === 'sigma' && p.metricB === 'energy');
    expect(pair?.correlation).toBeNull();
  });

  it('excludes snapshots missing a metric from that pair rather than treating them as 0', () => {
    let h = createRuntimeSnapshotHistory();
    h = pushRuntimeSnapshot(h, makeSnapshot(1, { sigma: 1, energy: 2 }));
    h = pushRuntimeSnapshot(h, makeSnapshot(2, { sigma: 2, energy: null }));
    h = pushRuntimeSnapshot(h, makeSnapshot(3, { sigma: 3, energy: 6 }));
    const pair = computeLayerCorrelation(h).pairs.find((p) => p.metricA === 'sigma' && p.metricB === 'energy');
    expect(pair?.sampleSize).toBe(2);
  });
});
