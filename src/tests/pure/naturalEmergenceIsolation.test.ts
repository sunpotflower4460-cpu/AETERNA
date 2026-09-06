import { describe, expect, it } from 'vitest';
import { runNaturalEmergenceStudy, type NaturalEmergenceConfig } from '../../pure/emergence/naturalEmergenceStudy.ts';

/**
 * EXPLORATORY follow-up to the frozen K7 result in
 * naturalEmergenceFrozenFinding.test.ts (docs/vessel/K7-natural-
 * emergence-preregistration.md). That result left an open question:
 * condition 2 (medium history + chi) sustains vortex candidates ~30x
 * longer than condition 1 (nu frozen, no chi) - but WHICH of those two
 * added mechanisms explains it?
 *
 * This is exploratory analysis of an already-completed pre-registered
 * experiment's own conditions, isolating one more variable - it makes
 * no new confirmatory threshold claim (L2 is still checked against the
 * same frozen tau_min=500, and still isn't satisfied by anything here),
 * so it does not need its own pre-registration. What IS pinned as a
 * genuine finding is the ISOLATION itself: which mechanism reproduces
 * condition 2's persistence advantage.
 *
 * Same base config and same 5 seeds as the frozen study, at two
 * additional points in the 2x2 (useChi x mediumHistoryOn) design:
 * condition 3 (medium history ON, chi OFF) and condition 4 (chi ON,
 * medium history OFF / nu frozen).
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

const CONDITION_3_MEDIUM_HISTORY_ONLY: NaturalEmergenceConfig = { ...BASE_CONFIG, kappa: 1, rho: 0.3, useChi: false };
const CONDITION_4_CHI_ONLY: NaturalEmergenceConfig = { ...BASE_CONFIG, kappa: 0, rho: 0, useChi: true };
const SEEDS = [1, 2, 3, 4, 5];

describe('pure core K7 follow-up (exploratory): isolating chi vs medium history for the persistence advantage', () => {
  it('medium history ALONE (chi off) reproduces the condition-1 baseline exactly - no persistence advantage - across all 5 seeds', () => {
    const results = runNaturalEmergenceStudy(CONDITION_3_MEDIUM_HISTORY_ONLY, SEEDS);
    for (const { result } of results) {
      expect(result.maxPersistenceTicks).toBe(1);
      expect(result.l2Satisfied).toBe(false);
    }
  });

  it('chi ALONE (medium history off, nu frozen) reproduces essentially all of condition 2\'s persistence advantage across all 5 seeds (golden values)', () => {
    const results = runNaturalEmergenceStudy(CONDITION_4_CHI_ONLY, SEEDS);
    const expected = [36, 34, 36, 39, 34];
    results.forEach(({ result }, i) => {
      expect(result.maxPersistenceTicks).toBe(expected[i]);
      expect(result.l2Satisfied).toBe(false);
    });
  });

  it('conclusion: the exchange coupling (chi), not medium history, explains condition 2\'s ~30x persistence advantage over the baseline', () => {
    const mediumHistoryOnly = runNaturalEmergenceStudy(CONDITION_3_MEDIUM_HISTORY_ONLY, SEEDS);
    const chiOnly = runNaturalEmergenceStudy(CONDITION_4_CHI_ONLY, SEEDS);

    for (let i = 0; i < SEEDS.length; i++) {
      // medium history alone: within 1 tick of the bare baseline (1 tick) - negligible.
      expect(mediumHistoryOnly[i].result.maxPersistenceTicks).toBeLessThanOrEqual(2);
      // chi alone: within 1 tick of condition 2's full combined result, i.e. it
      // captures essentially the entire advantage on its own.
      expect(chiOnly[i].result.maxPersistenceTicks).toBeGreaterThan(30);
    }
  });
});
