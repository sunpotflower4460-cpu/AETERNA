import type { ActuationPulse } from '../types/actuationPulse.ts';
import type { ReafferenceComparisonState } from '../types/reafferenceComparisonState.ts';
import type { SensoryReturnPacket } from '../types/sensoryReturnPacket.ts';
import type { WorldMediumState } from '../types/worldMediumState.ts';
import type { BodyWorldClosureState } from '../types/bodyWorldClosureState.ts';

export interface BodyWorldClosureInput {
  timestamp: number;
  actuationPulse: ActuationPulse | null;
  sensoryReturns: SensoryReturnPacket[];
  worldMediumState: WorldMediumState | null;
  reafferenceComparisonState: ReafferenceComparisonState | null;
  ongoingness?: number;
  previousState?: BodyWorldClosureState | null;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function deriveBodyWorldClosureState(
  input: BodyWorldClosureInput,
): BodyWorldClosureState {
  const {
    timestamp,
    actuationPulse,
    sensoryReturns,
    worldMediumState,
    reafferenceComparisonState,
    ongoingness = 0,
    previousState = null,
  } = input;

  const derivedReturnStrength = sensoryReturns.length > 0
    ? average(sensoryReturns.map((packet) => clamp01(packet.intensity)))
    : 0;
  const returnStrength = clamp01(reafferenceComparisonState?.actualReturn ?? derivedReturnStrength);
  const expectedReturn = clamp01(reafferenceComparisonState?.expectedReturn ?? 0);
  const loopGain = expectedReturn > 0.01
    ? clamp(returnStrength / expectedReturn, 0, 1.5)
    : clamp(returnStrength * 1.1, 0, 1.2);

  const roundTripDelay = clamp01(
    reafferenceComparisonState?.returnDelay
      ?? average(sensoryReturns.map((packet) => clamp01(packet.returnDelayHint))),
  );
  const selfCausedMatch = clamp01(reafferenceComparisonState?.selfCausedMatch ?? 0);
  const worldMismatch = clamp01(
    (reafferenceComparisonState?.worldCausedDifference ?? 0) * 0.65 +
    (reafferenceComparisonState?.returnMismatch ?? 0) * 0.35,
  );
  const unresolvedReturn = clamp01(reafferenceComparisonState?.unresolvedReturn ?? 0);
  const mediumStability = clamp01(worldMediumState?.mediumStability ?? 0.5);
  const comparisonConfidence = clamp01(reafferenceComparisonState?.comparisonConfidence ?? 0);

  const driftFromPrevious = previousState == null
    ? 0
    : average([
        Math.abs(loopGain - previousState.loopGain) / 1.5,
        Math.abs(returnStrength - previousState.returnStrength),
        Math.abs(selfCausedMatch - previousState.selfCausedMatch),
        Math.abs(worldMismatch - previousState.worldMismatch),
      ]);

  const closureDrift = clamp01(
    driftFromPrevious * 0.75 +
    unresolvedReturn * 0.15 +
    (1 - mediumStability) * 0.10,
  );

  const closureStability = clamp01(
    mediumStability * 0.35 +
    comparisonConfidence * 0.25 +
    (1 - clamp01(driftFromPrevious)) * 0.20 +
    clamp01(ongoingness) * 0.20,
  );

  const feedbackSaturationRisk = clamp01(
    clamp01(loopGain / 1.2) * 0.45 +
    returnStrength * 0.25 +
    roundTripDelay * 0.10 +
    (1 - mediumStability) * 0.10 +
    (actuationPulse ? clamp01(actuationPulse.intensity) * 0.10 : 0),
  );

  return {
    timestamp,
    loopGain,
    roundTripDelay,
    returnStrength,
    selfCausedMatch,
    worldMismatch,
    closureStability,
    closureDrift,
    unresolvedReturn,
    feedbackSaturationRisk,
    comparisonConfidence,
    returnMismatch: clamp01(reafferenceComparisonState?.returnMismatch ?? 0),
  };
}
