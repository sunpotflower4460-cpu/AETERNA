import type { TraceState } from '../types/traceState.ts';

export interface DeriveTraceStateInput {
  timestamp: number;
  recentPerturbationHistory: number[];
  mismatchHistory: number[];
  recoveryHistory: number[];
  repeatedPatternHistory: number[];
  externalInputLevel: number;
  arousalLevel: number;
  awarenessWindow: number;
  restDepth: number;
  settlingWindow: number;
  restorationReadiness: number;
  boundaryIntegrity: number;
  collapseRisk?: number;
}

function clampFinite(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function weightedRecentMean(values: number[], window = 60, maxValue = 1.5): number {
  const slice = values.slice(-window);
  if (slice.length === 0) return 0;

  let weightedSum = 0;
  let totalWeight = 0;

  for (let i = 0; i < slice.length; i++) {
    const weight = i + 1;
    weightedSum += clampFinite(slice[i], 0, maxValue) * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

function recentPeak(values: number[], window = 20, maxValue = 1.5): number {
  const slice = values.slice(-window);
  if (slice.length === 0) return 0;
  return slice.reduce((peak, value) => Math.max(peak, clampFinite(value, 0, maxValue)), 0);
}

export function deriveTraceState(input: DeriveTraceStateInput): TraceState {
  const perturbationMean = weightedRecentMean(input.recentPerturbationHistory, 72, 1.5);
  const mismatchMean = weightedRecentMean(input.mismatchHistory, 72, 1.5);
  const recoveryMean = weightedRecentMean(input.recoveryHistory, 72, 1);
  const repeatMean = weightedRecentMean(input.repeatedPatternHistory, 90, 1);
  const repeatPeak = recentPeak(input.repeatedPatternHistory, 24, 1);
  const saliencePeak = Math.max(
    recentPeak(input.recentPerturbationHistory, 18, 1.5),
    recentPeak(input.mismatchHistory, 18, 1.5),
  );

  const externalInput = clampFinite(input.externalInputLevel, 0, 1.5);
  const arousalLevel = clampFinite(input.arousalLevel, 0, 1);
  const awarenessWindow = clampFinite(input.awarenessWindow, 0, 1);
  const restDepth = clampFinite(input.restDepth, 0, 1);
  const settlingWindow = clampFinite(input.settlingWindow, 0, 1);
  const restorationReadiness = clampFinite(input.restorationReadiness, 0, 1);
  const boundaryIntegrity = clampFinite(input.boundaryIntegrity, 0, 1);
  const collapseRisk = clampFinite(input.collapseRisk ?? 0, 0, 1);

  const quietness = clampFinite(
    (1 - clampFinite(externalInput / 1.2, 0, 1)) * 0.5 +
    restDepth * 0.3 +
    settlingWindow * 0.2,
    0,
    1,
  );

  const replaySuppression = clampFinite(
    clampFinite(externalInput / 1.1, 0, 1) * 0.45 +
    arousalLevel * 0.28 +
    (1 - awarenessWindow) * 0.08 +
    collapseRisk * 0.12 +
    (1 - boundaryIntegrity) * 0.07,
    0,
    1,
  );

  const recentPatternWeight = clampFinite(
    perturbationMean * 0.3 +
    mismatchMean * 0.22 +
    repeatMean * 0.3 +
    repeatPeak * 0.18,
    0,
    1.2,
  );

  const settlingResidue = clampFinite(
    quietness * 0.4 +
    settlingWindow * 0.28 +
    restorationReadiness * 0.2 +
    Math.max(0, 0.3 - perturbationMean) * 0.35,
    0,
    1,
  );

  const recoveryLinkedResidue = clampFinite(
    recoveryMean * 0.58 +
    restorationReadiness * 0.22 +
    boundaryIntegrity * 0.1 +
    quietness * 0.1,
    0,
    1,
  );

  const salienceResidue = clampFinite(
    perturbationMean * 0.36 +
    mismatchMean * 0.38 +
    saliencePeak * 0.22 +
    (1 - boundaryIntegrity) * 0.14,
    0,
    1.5,
  );

  const recurrenceWeight = clampFinite(
    repeatMean * 0.62 +
    repeatPeak * 0.24 +
    recentPatternWeight * 0.14,
    0,
    1.2,
  );

  const traceStrength = clampFinite(
    salienceResidue * 0.38 +
    recurrenceWeight * 0.2 +
    settlingResidue * 0.18 +
    recoveryLinkedResidue * 0.16 +
    quietness * 0.12 -
    replaySuppression * 0.18,
    0,
    1.5,
  );

  const replayReadiness = clampFinite(
    traceStrength * 0.26 +
    quietness * 0.22 +
    settlingResidue * 0.16 +
    recoveryLinkedResidue * 0.12 +
    restorationReadiness * 0.12 +
    awarenessWindow * 0.08 +
    recurrenceWeight * 0.08 -
    replaySuppression * 0.24 -
    collapseRisk * 0.12,
    0,
    1,
  );

  return {
    timestamp: input.timestamp,
    traceStrength,
    recurrenceWeight,
    salienceResidue,
    replayReadiness,
    replaySuppression,
    recentPatternWeight,
    settlingResidue,
    recoveryLinkedResidue,
  };
}
