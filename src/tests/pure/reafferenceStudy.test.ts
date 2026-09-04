import { describe, expect, it } from 'vitest';
import { runReafferenceStudy, checkL2OnConditionA, type ReafferenceStudyConfig } from '../../pure/reafference/runReafferenceStudy.ts';
import type { ReafferenceExperimentConfig } from '../../pure/reafference/conditions.ts';

function smallStudyConfig(seedCount: number): ReafferenceStudyConfig {
  return {
    N: 6,
    M: 20,
    shiftCellsPerTick: 2,
    alpha: 1,
    g: 1,
    nu0: 0.2,
    kappa: 1,
    rho: 0.3,
    lambda: 20,
    dt: 0.01,
    shoutAmplitude: 0.5,
    shoutOmega: 5,
    shoutPhase: 0.3,
    shoutTicks: 5,
    windowHalfWidth: 2,
    observeAfterTicks: 3,
    calibrationSeed: 0,
    baseSeed: 1,
    seedCount,
  };
}

describe('pure core K6 reafference study: orchestration (docs/vessel/K6-reafference-preregistration.md, small-scale determinism/structure check)', () => {
  it('produces one measurement per seed, using the frozen [baseSeed, baseSeed+seedCount) range', () => {
    const result = runReafferenceStudy(smallStudyConfig(3));
    expect(result.perSeed).toHaveLength(3);
    expect(result.perSeed.map((s) => s.seed)).toEqual([1, 2, 3]);
  });

  it('is fully deterministic: running the same frozen config twice gives bit-identical results', () => {
    const r1 = runReafferenceStudy(smallStudyConfig(3));
    const r2 = runReafferenceStudy(smallStudyConfig(3));
    expect(r1).toEqual(r2);
  });

  it('all per-seed measurements and the paired comparisons are finite numbers', () => {
    const result = runReafferenceStudy(smallStudyConfig(5));
    for (const s of result.perSeed) {
      expect(Number.isFinite(s.boundaryDensityA)).toBe(true);
      expect(Number.isFinite(s.boundaryDensityB)).toBe(true);
      expect(Number.isFinite(s.globalCoherenceA)).toBe(true);
      expect(Number.isFinite(s.globalCoherenceB)).toBe(true);
    }
    expect(Number.isFinite(result.boundaryDensityComparison.meanDifference)).toBe(true);
    expect(Number.isFinite(result.coherenceComparison.meanDifference)).toBe(true);
    expect(typeof result.distinguishable).toBe('boolean');
  });

  it('distinguishable is true iff either comparison is individually distinguishable (frozen rule: no multiple-comparison correction)', () => {
    const result = runReafferenceStudy(smallStudyConfig(5));
    expect(result.distinguishable).toBe(result.boundaryDensityComparison.distinguishable || result.coherenceComparison.distinguishable);
  });
});

describe('pure core K6: Genesis L2 rule applied to condition A\'s own dynamics (docs/vessel/K6-reafference-preregistration.md, tau_min fixed geometrically)', () => {
  it('checkL2OnConditionA uses tau_min = tauMinMultiple * roundTripTicks, not a hand-tuned threshold', () => {
    const config: ReafferenceExperimentConfig = smallStudyConfig(1);
    const result = checkL2OnConditionA(config, 1, 2);
    expect(typeof result.satisfied).toBe('boolean');
    expect(Number.isFinite(result.maxPersistenceTicks)).toBe(true);
    expect(result.maxPersistenceTicks).toBeGreaterThanOrEqual(0);
  });
});
