import { describe, expect, it } from 'vitest';
import { runReafferenceStudy, checkL2OnConditionA, type ReafferenceStudyConfig } from '../../pure/reafference/runReafferenceStudy.ts';

/**
 * This is the ACTUAL pre-registered K6 run per
 * docs/vessel/K6-reafference-preregistration.md's frozen parameters
 * (seedCount=20, shoutTicks=5, windowHalfWidth=2, observeAfterTicks=3;
 * lambda/shiftCellsPerTick/M/alpha/g/nu0 taken from representative K5
 * test scales, not tuned for this measurement). The specific numeric
 * result below was computed ONCE and is pinned here as a golden value -
 * see docs/vessel/vessel-roadmap.md's K6 section for the full write-up,
 * interpretation, and honestly-stated limitations. This test exists so
 * that any future change to the pure core that would silently alter
 * this frozen finding is caught, not so that the finding itself is
 * "expected" in any normative sense.
 */
const FROZEN_CONFIG: ReafferenceStudyConfig = {
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
  seedCount: 20,
};

describe('pure core K6: the frozen reafference study result (docs/vessel/K6-reafference-preregistration.md, first and only pre-registered run)', () => {
  it('boundary-cell density is distinguishable between conditions A and B; global coherence is not', () => {
    const result = runReafferenceStudy(FROZEN_CONFIG);

    expect(result.boundaryDensityComparison.distinguishable).toBe(true);
    expect(result.coherenceComparison.distinguishable).toBe(false);
    expect(result.distinguishable).toBe(true);

    // Golden values (computed once, pinned as a regression guard).
    expect(result.boundaryDensityComparison.meanDifference).toBeCloseTo(-0.000945, 5);
    expect(result.coherenceComparison.meanDifference).toBeCloseTo(-0.000473, 5);

    // The consistent ~2x factor (condition B's boundary density roughly
    // double condition A's) noted in vessel-roadmap.md - checked here as
    // a per-seed property, not just in aggregate.
    for (const s of result.perSeed) {
      const ratio = s.boundaryDensityB / s.boundaryDensityA;
      expect(ratio).toBeGreaterThan(1.5);
      expect(ratio).toBeLessThan(2.5);
    }
  });

  it('the L2 persistence check is inconclusive by design: tau_min (2x round trip = 20 ticks) exceeds the total observable window (15 ticks), so it can never be satisfied regardless of the physics', () => {
    // This is an honestly-reported design limitation identified AFTER
    // the frozen run, not a result the pre-registration was adjusted to
    // produce - tau_min and the run length were both fixed before this
    // was noticed.
    const window = { roundTripTicks: FROZEN_CONFIG.M / FROZEN_CONFIG.shiftCellsPerTick };
    const totalTicks = window.roundTripTicks + FROZEN_CONFIG.windowHalfWidth + FROZEN_CONFIG.observeAfterTicks;
    const tauMin = 2 * window.roundTripTicks;
    expect(tauMin).toBeGreaterThan(totalTicks);

    for (let i = 0; i < FROZEN_CONFIG.seedCount; i++) {
      const seed = FROZEN_CONFIG.baseSeed + i;
      const l2 = checkL2OnConditionA(FROZEN_CONFIG, seed, 2);
      expect(l2.satisfied).toBe(false);
      expect(l2.maxPersistenceTicks).toBe(totalTicks); // saturates at the run's own length, not a genuine persistence ceiling
    }
  });
});
