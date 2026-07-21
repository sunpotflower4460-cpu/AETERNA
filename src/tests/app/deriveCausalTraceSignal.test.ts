/**
 * deriveCausalTraceSignal.test.ts
 *
 * Confirms:
 * - returns confidence='insufficient' when no metric has a delta (no fabrication)
 * - identifies the metric with the largest |delta| as the strongest signal
 * - confidence thresholds: high (>=0.1), medium (>=0.01), low (<0.01)
 * - the mandatory "not causal proof" caution is always present
 */

import { describe, it, expect } from 'vitest';
import { deriveCausalTraceSignal } from '../../app/replay/deriveCausalTraceSignal.js';
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

describe('deriveCausalTraceSignal', () => {
  it('returns insufficient confidence when no metric has a delta', () => {
    const diff = buildRuntimeSnapshotDifference(null, null);
    const signal = deriveCausalTraceSignal(diff);
    expect(signal.confidence).toBe('insufficient');
    expect(signal.metricId).toBeNull();
    expect(signal.delta).toBeNull();
  });

  it('identifies the metric with the largest |delta|', () => {
    const before = makeSnapshot(1, { sigma: 1.0, phi: 0.001, energy: 0.5, arousal: 0.02 });
    const after = makeSnapshot(2, { sigma: 1.01, phi: 0.001, energy: 0.9, arousal: 0.021 });
    const signal = deriveCausalTraceSignal(buildRuntimeSnapshotDifference(before, after));
    expect(signal.metricId).toBe('energy');
    expect(signal.delta).toBeCloseTo(0.4, 10);
  });

  it('reports high confidence for a large change', () => {
    const signal = deriveCausalTraceSignal(
      buildRuntimeSnapshotDifference(makeSnapshot(1, { sigma: 1.0 }), makeSnapshot(2, { sigma: 1.2 }))
    );
    expect(signal.confidence).toBe('high');
  });

  it('reports medium confidence for a moderate change', () => {
    const signal = deriveCausalTraceSignal(
      buildRuntimeSnapshotDifference(makeSnapshot(1, { sigma: 1.0 }), makeSnapshot(2, { sigma: 1.02 }))
    );
    expect(signal.confidence).toBe('medium');
  });

  it('reports low confidence for a small change', () => {
    const signal = deriveCausalTraceSignal(
      buildRuntimeSnapshotDifference(makeSnapshot(1, { sigma: 1.0 }), makeSnapshot(2, { sigma: 1.001 }))
    );
    expect(signal.confidence).toBe('low');
  });

  it('always includes the "not causal proof" caution', () => {
    const signal = deriveCausalTraceSignal(buildRuntimeSnapshotDifference(null, null));
    expect(signal.caution).toContain('因果関係の証明ではありません');
  });
});
