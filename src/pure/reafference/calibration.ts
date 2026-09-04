/**
 * PUT-IN: condition A's measured exchangeWork_N_psi trajectory, the
 *   return window, a ReafferenceExperimentConfig, and a fixed
 *   calibration seed (distinct from the study's seed ensemble)
 * EMERGED: measuredReturnEnergy (the total N-work condition A's coupling
 *   actually delivered to psi during the return window) and a calibrated
 *   control-drive amplitude for condition B
 * claim-tier: C2 (implemented per docs/vessel/K6-reafference-
 *   preregistration.md's calibration procedure)
 * floors (誠実な床): calibrateControlAmplitude is a SINGLE-SHOT LINEAR
 *   approximation (run one test amplitude, scale proportionally to hit
 *   the target), not an iteratively-refined exact match. driveWork_N is
 *   only exactly linear in drive amplitude to leading order (see
 *   stepDrive.ts's module doc: driveWork_N ~ 2*dt*Re(conj(psi)*J) at
 *   leading order, plus an O(dt^2) quadratic term in J that is NOT
 *   linear) - this was an explicit, pre-registered choice
 *   (docs/vessel/K6-reafference-preregistration.md), not an oversight
 *   discovered after the fact.
 */

import type { ReafferenceExperimentConfig, ReturnWindow } from './conditions.ts';
import { runConditionB } from './conditions.ts';

export function measureReturnEnergy(exchangeWorkNPsiTrajectory: readonly number[], window: ReturnWindow): number {
  let total = 0;
  for (let tick = window.start; tick <= window.end; tick++) {
    total += exchangeWorkNPsiTrajectory[tick];
  }
  return total;
}

export function calibrateControlAmplitude(
  config: ReafferenceExperimentConfig,
  calibrationSeed: number,
  targetEnergy: number,
  testAmplitude = 0.01,
): number {
  const testResult = runConditionB(config, calibrationSeed, testAmplitude);
  const testEnergy = testResult.controlDriveWorkNTrajectory.reduce((sum, value) => sum + value, 0);
  if (!Number.isFinite(testEnergy) || testEnergy === 0) {
    throw new Error(`calibrateControlAmplitude: degenerate calibration - test drive produced zero or non-finite N-work (${testEnergy}); choose a different testAmplitude or shout phase`);
  }
  return testAmplitude * (targetEnergy / testEnergy);
}
