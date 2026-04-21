import type { TouchBackactionState } from '../types/touchBackaction.ts';
import type { OpenStateSnapshot } from '../types/openStateSnapshot.ts';
import type { FeltStateVector } from '../types/feltState.ts';
import type { ArousalAwarenessState } from '../types/arousalAwareness.ts';
import type { NeedMotivationState } from '../types/needMotivation.ts';
import type { TouchExpectationState } from './touchExpectation.ts';

export interface TouchSurpriseMetrics {
  spatialSurprise: number;
  temporalSurprise: number;
  strengthSurprise: number;
  missingTouchSurprise: number;
  releaseSurprise: number;
  totalSurprise: number;
}

export interface TouchBackactionInputs {
  timestamp: number;
  openStateSnapshot?: OpenStateSnapshot | null;
  feltState?: FeltStateVector | null;
  arousalAwareness?: ArousalAwarenessState | null;
  needMotivation?: NeedMotivationState | null;
  expectationState?: TouchExpectationState | null;
  surpriseMetrics?: TouchSurpriseMetrics | null;
  familiarityBackactionEnabled?: boolean;
}

function clampFinite(value: number, min: number, max: number, fallback = 0): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}

function safeMean(arr: ArrayLike<number> | null | undefined): number {
  if (!arr || arr.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
  }
  return clampFinite(sum / arr.length, 0, Number.POSITIVE_INFINITY, 0);
}

/**
 * Derive state-dependent touch backaction weights.
 * This is a pure helper that reads current/last mixed-state proxies and
 * returns small weighting factors for touch handling.
 */
export function deriveTouchBackaction(inputs: TouchBackactionInputs): TouchBackactionState {
  const openState = inputs.openStateSnapshot ?? null;
  const felt = inputs.feltState ?? null;
  const arousal = inputs.arousalAwareness ?? null;
  const need = inputs.needMotivation ?? null;
  const expect = inputs.expectationState ?? null;
  const surprise = inputs.surpriseMetrics ?? null;

  const overload = clampFinite(openState?.feltMix.overload ?? felt?.overload ?? 0, 0, 1.5, 0);
  const boundaryIntegrity = clampFinite(openState?.feltMix.boundaryIntegrity ?? felt?.boundaryIntegrity ?? 1, 0, 1, 1);
  const openness = clampFinite(openState?.feltMix.openness ?? felt?.openness ?? 0, 0, 1, 0);
  const coherence = clampFinite(openState?.feltMix.coherence ?? felt?.coherence ?? 0.5, 0, 1, 0.5);
  const perturbationLoad = clampFinite(openState?.feltMix.perturbationLoad ?? felt?.perturbationLoad ?? 0, 0, 1.5, 0);
  const awarenessWindow = clampFinite(openState?.activationMix.awarenessWindow ?? arousal?.awarenessWindow ?? 0.4, 0, 1, 0.4);
  const foregroundPressure = clampFinite(openState?.activationMix.foregroundPressure ?? arousal?.foregroundPressure ?? 0.3, 0, 1, 0.3);
  const stabilityIndex = clampFinite(openState?.stabilityIndex ?? 0, 0, 1, 0);

  const safetyNeed = clampFinite(openState?.driveMix.safetyNeed ?? need?.safetyNeed ?? 0, 0, 1.2, 0);
  const repetitionMotivation = clampFinite(openState?.driveMix.repetitionMotivation ?? need?.repetitionMotivation ?? 0, 0, 1, 0);
  const explorationMotivation = clampFinite(openState?.driveMix.explorationMotivation ?? need?.explorationMotivation ?? 0, 0, 1, 0);
  const noveltyMotivation = clampFinite(openState?.driveMix.noveltyMotivation ?? need?.noveltyMotivation ?? 0, 0, 1, 0);

  const expectationConfidence = clampFinite(expect?.touchExpectationConfidence ?? 0.5, 0, 1, 0.5);
  const meanHabituation = safeMean(expect?.touchHabituationField);
  const meanExpectedTouch = safeMean(expect?.expectedTouchField);

  const totalSurprise = clampFinite(surprise?.totalSurprise ?? 0, 0, 2, 0);
  const missingSurprise = clampFinite(surprise?.missingTouchSurprise ?? 0, 0, 1, 0);
  const spatialSurprise = clampFinite(surprise?.spatialSurprise ?? 0, 0, 1, 0);

  const familiarityEnabled = inputs.familiarityBackactionEnabled !== false;
  const familiarityDamping = familiarityEnabled
    ? clampFinite(
        meanHabituation * 0.7 +
          repetitionMotivation * 0.2 +
          expectationConfidence * 0.1 -
          totalSurprise * 0.1,
        0,
        1.2,
        0
      )
    : 0;

  const overloadAmplification = clampFinite(
    overload * 0.7 +
      (1.0 - boundaryIntegrity) * 0.25 +
      (1.0 - awarenessWindow) * 0.2 +
      perturbationLoad * 0.05,
    0,
    1.5,
    0
  );

  const awarenessCoupling = clampFinite(
    awarenessWindow * 0.6 + foregroundPressure * 0.4,
    0,
    1,
    0
  );

  const boundaryModulation = clampFinite(
    1.0 +
      (1.0 - boundaryIntegrity) * 0.4 +
      safetyNeed * 0.12 -
      coherence * 0.08,
    0.7,
    1.4,
    1
  );

  const opennessModulation = clampFinite(
    1.0 +
      openness * 0.28 +
      explorationMotivation * 0.12 -
      safetyNeed * 0.15 +
      noveltyMotivation * 0.05,
    0.7,
    1.4,
    1
  );

  const backactionGain = clampFinite(
    1.0 +
      overload * 0.22 +
      (1.0 - boundaryIntegrity) * 0.18 +
      openness * 0.12 +
      foregroundPressure * 0.08 -
      coherence * 0.12 +
      stabilityIndex * 0.05,
    0.75,
    1.45,
    1
  );

  const surpriseGain = clampFinite(
    1.0 +
      totalSurprise * 0.25 +
      overload * 0.18 +
      missingSurprise * 0.15 +
      spatialSurprise * 0.08 -
      familiarityDamping * 0.18 -
      expectationConfidence * 0.06 -
      meanExpectedTouch * 0.05,
    0.8,
    1.6,
    1
  );

  const coherenceShift = clampFinite(
    (stabilityIndex - 0.5) * 0.12 -
      overload * 0.08 -
      perturbationLoad * 0.05 +
      coherence * 0.1,
    -0.18,
    0.18,
    0
  );

  return {
    timestamp: inputs.timestamp,
    backactionGain,
    surpriseGain,
    boundaryModulation,
    opennessModulation,
    coherenceShift,
    awarenessCoupling,
    overloadAmplification,
    familiarityDamping,
  };
}
