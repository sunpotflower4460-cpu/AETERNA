import type { BodySurfaceState } from '../types/bodySurfaceState.ts';
import type { PressureCompetitionState } from '../types/pressureCompetitionState.ts';
import type { RecoveryState } from '../types/recoveryState.ts';
import type { TraceState } from '../types/traceState.ts';
import type { PredictionMismatchState } from '../types/predictionMismatchState.ts';
import type { ActuationPulse, ActuationPulseChannel } from '../types/actuationPulse.ts';

export interface DeriveActuationPulseInput {
  timestamp: number;
  bodySurfaceState: BodySurfaceState | null;
  pressureState?: PressureCompetitionState | null;
  recoveryState?: RecoveryState | null;
  traceState?: TraceState | null;
  mismatchState?: PredictionMismatchState | null;
  ongoingness?: number;
  stability?: number;
  boundaryIntegrity?: number;
  collapseRisk?: number;
  overload?: number;
  quietness?: number;
  meanActivity?: number;
}

function clampFinite(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
  return clampFinite(value, 0, 1);
}

function normalize(value: number | undefined, max: number): number {
  return clamp01((value ?? 0) / max);
}

function deriveFallbackOngoingness(input: DeriveActuationPulseInput, collapseRisk: number): number {
  const quietMeanActivity = clamp01((input.meanActivity ?? 0.1) / 0.25);
  const stability = clamp01(input.stability ?? 0.5);
  return clamp01(quietMeanActivity * 0.22 + stability * 0.38 + (1 - collapseRisk) * 0.4);
}

export function deriveActuationPulse(input: DeriveActuationPulseInput): ActuationPulse | null {
  const bodySurface = input.bodySurfaceState;
  const pressure = input.pressureState;
  const recovery = input.recoveryState;
  const trace = input.traceState;
  const mismatch = input.mismatchState;

  const collapseRisk = clamp01(input.collapseRisk ?? recovery?.collapseRisk ?? 0);
  const boundaryIntegrity = clamp01(
    bodySurface?.boundaryIntegrity ?? input.boundaryIntegrity ?? 0.5,
  );
  const outputReadiness = clamp01(bodySurface?.outputReadiness ?? 0);
  const recoveryShielding = clamp01(bodySurface?.recoveryShielding ?? 0);
  const overloadNorm = clamp01(
    (input.overload ?? recovery?.overloadDrain ?? 0) / 1.5,
  );
  const ongoingness = clamp01(
    input.ongoingness ?? deriveFallbackOngoingness(input, collapseRisk),
  );
  const stability = clamp01(
    input.stability ?? pressure?.competitionStability ?? recovery?.stabilizationPull ?? 0.5,
  );
  const quietness = clamp01(
    input.quietness ?? (1 - normalize(input.meanActivity, 0.24)) * 0.55 + recoveryShielding * 0.25 + (1 - outputReadiness) * 0.2,
  );

  const pressureEnergy = normalize(pressure?.pressureEnergy, 0.9);
  const safetyPressure = normalize(pressure?.safetyPressure, 1.2);
  const restorationPressure = clamp01(
    pressure?.restorationPressure ?? recovery?.recoveryPressure ?? 0,
  );
  const noveltyPressure = clamp01(pressure?.noveltyPressure ?? 0);
  const explorationPressure = clamp01(pressure?.explorationPressure ?? 0);
  const withdrawalPressure = clamp01(pressure?.withdrawalPressure ?? 0);

  const traceStrength = normalize(trace?.traceStrength, 1.5);
  const replayReadiness = clamp01(trace?.replayReadiness ?? 0);
  const recurrenceWeight = normalize(trace?.recurrenceWeight, 1.2);
  const salienceResidue = normalize(trace?.salienceResidue, 1.5);
  const recoveryLinkedResidue = clamp01(trace?.recoveryLinkedResidue ?? 0);
  const settlingResidue = clamp01(trace?.settlingResidue ?? 0);
  const recentPatternWeight = clamp01(trace?.recentPatternWeight ?? 0);

  const mismatchLevel = clamp01(mismatch?.mismatchLevel ?? 0);
  const boundaryStress = clamp01(mismatch?.boundaryStress ?? 0);
  const localInstability = clamp01(
    mismatch?.localInstability ?? bodySurface?.localIrritability ?? 0,
  );
  const protectiveClosure = clamp01(
    bodySurface?.protectiveClosure ?? withdrawalPressure,
  );
  const surfaceFatigue = clamp01(bodySurface?.surfaceFatigue ?? overloadNorm);

  const recoveryLinked = clamp01(
    (recovery?.recoveryPressure ?? 0) * 0.42 +
      restorationPressure * 0.2 +
      recoveryLinkedResidue * 0.18 +
      settlingResidue * 0.1 +
      clamp01(recovery?.stabilizationPull ?? 0) * 0.1,
  );
  const boundaryLinked = clamp01(
    safetyPressure * 0.26 +
      boundaryStress * 0.24 +
      (1 - boundaryIntegrity) * 0.16 +
      protectiveClosure * 0.18 +
      clamp01(recovery?.selfPreservationDrive ?? 0) * 0.16,
  );
  const traceLinked = clamp01(
    traceStrength * 0.38 +
      replayReadiness * 0.28 +
      recurrenceWeight * 0.22 +
      recoveryLinkedResidue * 0.12,
  );

  const coherence = clamp01(
    ongoingness * 0.34 +
      stability * 0.26 +
      boundaryIntegrity * 0.22 +
      (1 - collapseRisk) * 0.18 -
      surfaceFatigue * 0.1,
  );
  const rhythm = clamp01(
    recurrenceWeight * 0.34 +
      replayReadiness * 0.2 +
      traceStrength * 0.16 +
      stability * 0.18 +
      clamp01(recovery?.stabilizationPull ?? 0) * 0.12,
  );

  const visualForeground = clamp01(
    noveltyPressure * 0.35 +
      traceLinked * 0.3 +
      recoveryLinked * 0.2 +
      salienceResidue * 0.15,
  );
  const simulatedForceForeground = clamp01(
    pressureEnergy * 0.24 +
      boundaryLinked * 0.34 +
      safetyPressure * 0.18 +
      clamp01(recovery?.recoveryPressure ?? 0) * 0.12 +
      boundaryStress * 0.12,
  );

  const visualScore = clamp01(
    outputReadiness * 0.28 +
      coherence * 0.18 +
      ongoingness * 0.14 +
      boundaryIntegrity * 0.1 +
      visualForeground * 0.3 +
      explorationPressure * 0.08 +
      restorationPressure * 0.08 -
      collapseRisk * 0.16 -
      recoveryShielding * 0.12 -
      overloadNorm * 0.12,
  );
  const simulatedForceScore = clamp01(
    outputReadiness * 0.14 +
      coherence * 0.12 +
      simulatedForceForeground * 0.42 +
      mismatchLevel * 0.14 +
      localInstability * 0.1 +
      clamp01(recovery?.recoveryPressure ?? 0) * 0.1 -
      collapseRisk * 0.14 -
      recoveryShielding * 0.1 -
      overloadNorm * 0.08,
  );

  const dominantScore = Math.max(visualScore, simulatedForceScore);
  const salientDrive = Math.max(
    visualForeground,
    simulatedForceForeground,
    pressureEnergy,
    mismatchLevel,
  );

  if (
    collapseRisk >= 0.98 ||
    boundaryIntegrity <= 0.12 ||
    recoveryShielding >= 0.95 ||
    outputReadiness <= 0.005 ||
    overloadNorm >= 0.98
  ) {
    return null;
  }

  if (quietness > 0.82 && salientDrive < 0.18 && outputReadiness < 0.1) {
    return null;
  }

  if (dominantScore < 0.02) {
    return null;
  }

  const channel: ActuationPulseChannel =
    simulatedForceScore > visualScore * 1.05 ? 'simulatedForce' : 'visual';

  const intensity = clamp01(
    dominantScore * (0.65 + outputReadiness * 0.35),
  );
  const locality = clamp01(
    localInstability * 0.32 +
      clamp01(bodySurface?.localIrritability ?? 0) * 0.28 +
      boundaryStress * 0.2 +
      recentPatternWeight * 0.1 +
      (channel === 'simulatedForce' ? 0.1 : 0.02) -
      ongoingness * 0.08,
  );

  return {
    timestamp: input.timestamp,
    channel,
    intensity,
    coherence: clamp01(coherence * (0.75 + outputReadiness * 0.25)),
    rhythm,
    locality,
    recoveryLinked,
    boundaryLinked,
    traceLinked,
    outputReadiness,
    pressureLinked: clamp01(
      pressureEnergy * 0.45 +
        mismatchLevel * 0.25 +
        safetyPressure * 0.15 +
        restorationPressure * 0.15,
    ),
    noveltyLinked: clamp01(
      noveltyPressure * 0.55 + salienceResidue * 0.25 + mismatchLevel * 0.2,
    ),
    restorationLinked: clamp01(
      restorationPressure * 0.4 +
        recoveryLinked * 0.4 +
        clamp01(recovery?.stabilizationPull ?? 0) * 0.2,
    ),
    durationTicks: Math.max(1, Math.round(1 + intensity * 6 + rhythm * 4)),
    decayRate: clamp01(
      0.18 + collapseRisk * 0.25 + recoveryShielding * 0.2 + overloadNorm * 0.1,
    ),
  };
}
