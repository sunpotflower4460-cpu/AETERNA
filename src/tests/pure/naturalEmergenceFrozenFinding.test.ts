import { describe, expect, it } from 'vitest';
import { runNaturalEmergenceStudy, type NaturalEmergenceConfig } from '../../pure/emergence/naturalEmergenceStudy.ts';

/**
 * The ACTUAL pre-registered K7 follow-up run per
 * docs/vessel/K7-natural-emergence-preregistration.md's frozen
 * parameters (N=10, alpha=1, g=4, nu0=0.15, uniform persistent drive,
 * totalTicks=1200, tauMin=500, maxLocalizedFraction=0.3, seeds 1-5).
 * The result was computed ONCE and is pinned here as a golden value -
 * see docs/vessel/vessel-roadmap.md's K7 follow-up section for the full
 * write-up. This test exists so a future change to the pure core that
 * would silently alter this frozen finding is caught, not so the
 * finding is "expected" in any normative sense.
 */
const BASE_CONFIG = {
  N: 10,
  alpha: 1,
  g: 4,
  nu0: 0.15,
  dt: 0.01,
  driveAmplitude: 0.3,
  driveOmega: 3,
  totalTicks: 1200,
  tauMin: 500,
  maxLocalizedFraction: 0.3,
  M: 24,
  shiftCellsPerTick: 2,
  lambda: 20,
};

const CONDITION_1: NaturalEmergenceConfig = { ...BASE_CONFIG, kappa: 0, rho: 0, useChi: false };
const CONDITION_2: NaturalEmergenceConfig = { ...BASE_CONFIG, kappa: 1, rho: 0.3, useChi: true };
const SEEDS = [1, 2, 3, 4, 5];

describe('pure core K7 follow-up: the frozen natural emergence study result (docs/vessel/K7-natural-emergence-preregistration.md, first and only pre-registered run)', () => {
  it('L2 is NOT satisfied in either condition, for any of the 5 seeds (tau_min=500 is not met)', () => {
    const c1 = runNaturalEmergenceStudy(CONDITION_1, SEEDS);
    const c2 = runNaturalEmergenceStudy(CONDITION_2, SEEDS);

    for (const { result } of c1) expect(result.l2Satisfied).toBe(false);
    for (const { result } of c2) expect(result.l2Satisfied).toBe(false);
  });

  it('winding defects appear transiently in both conditions, but final-tick localization is always empty (golden values)', () => {
    const c1 = runNaturalEmergenceStudy(CONDITION_1, SEEDS);
    const c2 = runNaturalEmergenceStudy(CONDITION_2, SEEDS);

    for (const { result } of [...c1, ...c2].map((r) => r)) {
      expect(result.windingDetectedAnyTick).toBe(true);
      expect(result.finalLocalization.candidateCount).toBe(0);
    }
  });

  it('condition 2 (medium history + chi) sustains vortex candidates far longer than condition 1 (nu-frozen, no chi) - a consistent, honest secondary finding that falls well short of tau_min', () => {
    const c1 = runNaturalEmergenceStudy(CONDITION_1, SEEDS);
    const c2 = runNaturalEmergenceStudy(CONDITION_2, SEEDS);

    for (const { result } of c1) {
      expect(result.maxPersistenceTicks).toBe(1);
    }
    for (const { result } of c2) {
      expect(result.maxPersistenceTicks).toBeGreaterThan(30);
      expect(result.maxPersistenceTicks).toBeLessThan(40);
    }

    // Every seed shows condition 2 outlasting condition 1 by a wide margin,
    // yet both remain far below tau_min=500 - neither hypothesis in
    // white-ceilings.md (L3 for K2 PR5, L4 candidate for K3) is supported
    // by this alone.
    for (let i = 0; i < SEEDS.length; i++) {
      expect(c2[i].result.maxPersistenceTicks).toBeGreaterThan(c1[i].result.maxPersistenceTicks * 20);
      expect(c2[i].result.maxPersistenceTicks).toBeLessThan(BASE_CONFIG.tauMin);
    }
  });
});
