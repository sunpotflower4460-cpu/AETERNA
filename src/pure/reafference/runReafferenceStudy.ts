/**
 * PUT-IN: a ReafferenceStudyConfig (the ReafferenceExperimentConfig plus
 *   calibrationSeed/baseSeed/seedCount)
 * EMERGED: the full pre-registered comparison across seedCount seeds:
 *   the calibration values, per-seed condition A/B measurements, and
 *   the frozen paired-comparison verdict for boundaryDensity and
 *   globalCoherence
 * claim-tier: C2 (implemented exactly per docs/vessel/K6-reafference-
 *   preregistration.md; orchestration correctness unit-tested in
 *   src/tests/pure/reafferenceStudy.test.ts with a SMALL seedCount for
 *   speed - the actual seedCount=20 frozen run and its result are
 *   recorded in docs/vessel/vessel-roadmap.md, transcribed from this
 *   code's own output, not asserted as an expected value inside a test)
 * floors (誠実な床): calibrationSeed must not overlap the study's seed
 *   range [baseSeed, baseSeed+seedCount) - this function does not
 *   enforce that (the pre-registration fixes concrete values where this
 *   cannot happen; enforcing it generically would add a runtime check
 *   for a condition the frozen config already avoids by construction).
 */

import type { ReafferenceExperimentConfig } from './conditions.ts';
import { computeReturnWindow, runConditionA, runConditionB } from './conditions.ts';
import { calibrateControlAmplitude, measureReturnEnergy } from './calibration.ts';
import { comparePaired, type PairedComparisonResult } from './statistics.ts';
import { vortexPersistenceAtLeast, type VortexPersistenceCheck } from '../observe/vortexCandidates.ts';

export interface ReafferenceStudyConfig extends ReafferenceExperimentConfig {
  calibrationSeed: number;
  baseSeed: number;
  seedCount: number;
}

export interface PerSeedMeasurement {
  seed: number;
  boundaryDensityA: number;
  boundaryDensityB: number;
  globalCoherenceA: number;
  globalCoherenceB: number;
}

export interface ReafferenceStudyResult {
  targetEnergy: number;
  controlAmplitude: number;
  perSeed: PerSeedMeasurement[];
  boundaryDensityComparison: PairedComparisonResult;
  coherenceComparison: PairedComparisonResult;
  distinguishable: boolean;
}

export function runReafferenceStudy(config: ReafferenceStudyConfig): ReafferenceStudyResult {
  const window = computeReturnWindow(config);
  const calibrationRun = runConditionA(config, config.calibrationSeed);
  const targetEnergy = measureReturnEnergy(calibrationRun.exchangeWorkNPsiTrajectory, window);
  const controlAmplitude = calibrateControlAmplitude(config, config.calibrationSeed, targetEnergy);

  const perSeed: PerSeedMeasurement[] = [];
  for (let i = 0; i < config.seedCount; i++) {
    const seed = config.baseSeed + i;
    const a = runConditionA(config, seed);
    const b = runConditionB(config, seed, controlAmplitude);
    perSeed.push({
      seed,
      boundaryDensityA: a.boundaryDensity,
      boundaryDensityB: b.boundaryDensity,
      globalCoherenceA: a.globalCoherence,
      globalCoherenceB: b.globalCoherence,
    });
  }

  const boundaryDensityComparison = comparePaired(perSeed.map((s) => s.boundaryDensityA - s.boundaryDensityB));
  const coherenceComparison = comparePaired(perSeed.map((s) => s.globalCoherenceA - s.globalCoherenceB));

  return {
    targetEnergy,
    controlAmplitude,
    perSeed,
    boundaryDensityComparison,
    coherenceComparison,
    distinguishable: boundaryDensityComparison.distinguishable || coherenceComparison.distinguishable,
  };
}

/**
 * The separate, non-reafference measurement docs/vessel/K6-reafference-
 * preregistration.md also calls for: applying Genesis's L2 rule to
 * condition A's OWN dynamics (self-echo active), with tau_min fixed
 * geometrically (a multiple of the round-trip period) rather than
 * chosen after looking at results.
 */
export function checkL2OnConditionA(config: ReafferenceExperimentConfig, seed: number, tauMinMultiple = 2): VortexPersistenceCheck {
  const window = computeReturnWindow(config);
  const tauMin = tauMinMultiple * window.roundTripTicks;
  const result = runConditionA(config, seed);
  return vortexPersistenceAtLeast(tauMin)(result.vortexCandidateHistory);
}
