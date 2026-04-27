import type { BodySurfaceState } from '../types/bodySurfaceState.ts';
import type { BodyWorldClosureState } from '../types/bodyWorldClosureState.ts';
import type { DynamicViabilityState } from '../types/dynamicViabilityState.ts';
import {
  createNeutralNaturalFeedbackAdjustment,
  type NaturalFeedbackAdjustment,
} from '../types/naturalFeedbackAdjustment.ts';
import type { TraceState } from '../types/traceState.ts';
import type { WorldMediumState } from '../types/worldMediumState.ts';

export interface DeriveMinimalNaturalFeedbackParams {
  viability: DynamicViabilityState;
  closure: BodyWorldClosureState | null;
  world: WorldMediumState | null;
  bodySurface: BodySurfaceState | null;
  trace?: TraceState | null;
  previousAdjustment?: NaturalFeedbackAdjustment | null;
  dt: number;
}

// S3 keeps raw condition adjustments in a very small ±0.05 band so feedback
// remains a thin medium-condition bias rather than a stabilization command.
const RAW_ADJUSTMENT_LIMIT = 0.05;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function clampSigned(value: number, limit = 1): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(-limit, Math.min(limit, value));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + clamp01(value), 0) / values.length;
}

function latestTimestamp(values: Array<number | undefined>): number {
  const finiteValues = values.filter((value): value is number => Number.isFinite(value));
  return finiteValues.length > 0 ? Math.max(...finiteValues) : 0;
}

function smoothSigned(current: number, previous: number | null | undefined, dt: number): number {
  if (!Number.isFinite(previous ?? NaN)) return current;
  const dtWeight = Number.isFinite(dt) && dt > 0 ? clamp01(dt / 0.1) : 0.15;
  const blend = 0.22 + (1 - dtWeight) * 0.18;
  return clampSigned(current * (1 - blend) + (previous ?? 0) * blend, RAW_ADJUSTMENT_LIMIT);
}

function scaleRawAdjustment(raw: number): number {
  return clampSigned(raw, 1) * RAW_ADJUSTMENT_LIMIT;
}

function averageAbsoluteAdjustment(adjustment: NaturalFeedbackAdjustment): number {
  return average([
    Math.abs(adjustment.echoDecayAdjustment) / RAW_ADJUSTMENT_LIMIT,
    Math.abs(adjustment.returnGainAdjustment) / RAW_ADJUSTMENT_LIMIT,
    Math.abs(adjustment.pulseLeakageAdjustment) / RAW_ADJUSTMENT_LIMIT,
    Math.abs(adjustment.boundaryPermeabilityAdjustment) / RAW_ADJUSTMENT_LIMIT,
    Math.abs(adjustment.sensoryAttenuationAdjustment) / RAW_ADJUSTMENT_LIMIT,
    Math.abs(adjustment.traceDecayAdjustment) / RAW_ADJUSTMENT_LIMIT,
    Math.abs(adjustment.worldResistanceAdjustment ?? 0) / RAW_ADJUSTMENT_LIMIT,
    Math.abs(adjustment.delayWindowAdjustment ?? 0) / RAW_ADJUSTMENT_LIMIT,
    Math.abs(adjustment.mediumAbsorptionAdjustment ?? 0) / RAW_ADJUSTMENT_LIMIT,
  ]);
}

export function deriveMinimalNaturalFeedback(
  params: DeriveMinimalNaturalFeedbackParams,
): NaturalFeedbackAdjustment {
  const {
    viability,
    closure,
    world,
    bodySurface,
    trace = null,
    previousAdjustment = null,
    dt,
  } = params;

  const timestamp = latestTimestamp([
    viability.timestamp,
    closure?.timestamp,
    world?.timestamp,
    bodySurface?.timestamp,
    trace?.timestamp,
    previousAdjustment?.timestamp,
  ]);

  const neutral = createNeutralNaturalFeedbackAdjustment(timestamp);

  if (!viability) {
    return neutral;
  }

  const coverage = [closure, world, bodySurface, trace].filter(Boolean).length / 4;
  const dtQuality = Number.isFinite(dt) && dt > 0 ? clamp01(dt / 0.12) : 0.35;

  const loopGain = clamp01((closure?.loopGain ?? 0.6) / 1.25);
  const returnStrength = clamp01(closure?.returnStrength ?? 0);
  const unresolvedReturn = clamp01(closure?.unresolvedReturn ?? 0);
  const closureDrift = clamp01(closure?.closureDrift ?? 0);
  const feedbackSaturationRisk = clamp01(closure?.feedbackSaturationRisk ?? 0);
  const roundTripDelay = clamp01(closure?.roundTripDelay ?? world?.feedbackDelay ?? 0.25);

  const echoLevel = clamp01(world?.echoLevel ?? 0);
  const surfaceResistance = clamp01(world?.surfaceResistance ?? 0.5);
  const feedbackDelay = clamp01(world?.feedbackDelay ?? roundTripDelay);
  const returnReadiness = clamp01(world?.returnReadiness ?? 0.3);

  const permeability = clamp01(bodySurface?.permeability ?? 0.5);
  const outputReadiness = clamp01(bodySurface?.outputReadiness ?? 0.5);

  const traceStrength = clamp01(trace?.traceStrength ?? 0);
  const salienceResidue = clamp01(trace?.salienceResidue ?? 0);
  const settlingResidue = clamp01(trace?.settlingResidue ?? trace?.recoveryLinkedResidue ?? 0);

  const overCouplingDrive = average([
    viability.overCouplingRisk,
    viability.saturationRisk,
    feedbackSaturationRisk,
    clamp01((echoLevel - 0.58) / 0.42),
    clamp01((returnStrength - 0.72) / 0.28),
    clamp01((loopGain - 0.78) / 0.22),
  ]);

  const underCouplingDrive = average([
    viability.underCouplingRisk,
    viability.extinctionRisk,
    1 - viability.flowContinuity,
    1 - viability.energyThroughput,
    clamp01((0.32 - returnStrength) / 0.32),
    clamp01((0.58 - loopGain) / 0.58),
    clamp01((0.28 - returnReadiness) / 0.28),
  ]);

  const delayDrive = average([
    1 - viability.delayCoherence,
    closureDrift,
    unresolvedReturn,
    Math.abs(feedbackDelay - roundTripDelay),
    Math.abs(roundTripDelay - 0.35) / 0.65,
  ]);

  const residueExcess = average([
    clamp01((echoLevel - 0.56) / 0.44),
    clamp01((traceStrength - 0.54) / 0.46),
    clamp01((salienceResidue - 0.52) / 0.48),
    feedbackSaturationRisk,
  ]);
  const residueScarcity = average([
    clamp01((0.14 - echoLevel) / 0.14),
    clamp01((0.12 - traceStrength) / 0.12),
    clamp01((0.12 - settlingResidue) / 0.12),
    1 - viability.dissipationBalance,
  ]);
  const dissipationDrive = average([
    1 - viability.dissipationBalance,
    residueExcess,
    residueScarcity,
  ]);

  const confidenceStability = previousAdjustment == null
    ? 0.82
    : 1 - average([
        Math.abs(previousAdjustment.echoDecayAdjustment) / RAW_ADJUSTMENT_LIMIT,
        Math.abs(previousAdjustment.returnGainAdjustment) / RAW_ADJUSTMENT_LIMIT,
        Math.abs(previousAdjustment.pulseLeakageAdjustment) / RAW_ADJUSTMENT_LIMIT,
      ]) * 0.35;

  const adjustmentConfidence = clamp01(
    viability.viabilityConfidence * 0.48 +
      coverage * 0.25 +
      dtQuality * 0.12 +
      (1 - unresolvedReturn) * 0.08 +
      confidenceStability * 0.07,
  );

  const demandLevel = Math.max(overCouplingDrive, underCouplingDrive, delayDrive, dissipationDrive);
  const adjustmentStrength = clamp01(
    (demandLevel * 0.58 + (1 - coverage) * 0.08 + Math.abs(permeability - 0.5) * 0.18) *
      (0.42 + adjustmentConfidence * 0.38),
  );

  const delayWindowDirection = roundTripDelay >= 0.52 ? 1 : roundTripDelay <= 0.18 ? -1 : 0;

  const rawAdjustment = {
    echoDecayAdjustment:
      overCouplingDrive * 0.92 + residueExcess * 0.68 - underCouplingDrive * 0.72 - residueScarcity * 0.35,
    returnGainAdjustment:
      underCouplingDrive * 0.88 - overCouplingDrive * 0.82 - delayDrive * 0.08,
    pulseLeakageAdjustment:
      underCouplingDrive * 0.76 - overCouplingDrive * 0.7 + clamp01((outputReadiness - 0.48) / 0.52) * 0.08,
    boundaryPermeabilityAdjustment:
      underCouplingDrive * 0.62 - overCouplingDrive * 0.28 + clamp01((0.46 - permeability) / 0.46) * 0.24 - clamp01((permeability - 0.68) / 0.32) * 0.22,
    sensoryAttenuationAdjustment:
      overCouplingDrive * 0.82 + clamp01((returnStrength - 0.68) / 0.32) * 0.22 - underCouplingDrive * 0.2,
    traceDecayAdjustment:
      residueExcess * 0.86 - residueScarcity * 0.78 + overCouplingDrive * 0.18 - underCouplingDrive * 0.12,
    worldResistanceAdjustment:
      overCouplingDrive * 0.48 - underCouplingDrive * 0.42 + clamp01((0.42 - surfaceResistance) / 0.42) * 0.15,
    delayWindowAdjustment: delayDrive * delayWindowDirection * 0.58,
    mediumAbsorptionAdjustment:
      residueExcess * 0.74 + overCouplingDrive * 0.22 - underCouplingDrive * 0.22 - residueScarcity * 0.56,
  };

  const adjustment: NaturalFeedbackAdjustment = {
    timestamp,
    echoDecayAdjustment: smoothSigned(
      scaleRawAdjustment(rawAdjustment.echoDecayAdjustment),
      previousAdjustment?.echoDecayAdjustment,
      dt,
    ),
    returnGainAdjustment: smoothSigned(
      scaleRawAdjustment(rawAdjustment.returnGainAdjustment),
      previousAdjustment?.returnGainAdjustment,
      dt,
    ),
    pulseLeakageAdjustment: smoothSigned(
      scaleRawAdjustment(rawAdjustment.pulseLeakageAdjustment),
      previousAdjustment?.pulseLeakageAdjustment,
      dt,
    ),
    boundaryPermeabilityAdjustment: smoothSigned(
      scaleRawAdjustment(rawAdjustment.boundaryPermeabilityAdjustment),
      previousAdjustment?.boundaryPermeabilityAdjustment,
      dt,
    ),
    sensoryAttenuationAdjustment: smoothSigned(
      scaleRawAdjustment(rawAdjustment.sensoryAttenuationAdjustment),
      previousAdjustment?.sensoryAttenuationAdjustment,
      dt,
    ),
    traceDecayAdjustment: smoothSigned(
      scaleRawAdjustment(rawAdjustment.traceDecayAdjustment),
      previousAdjustment?.traceDecayAdjustment,
      dt,
    ),
    adjustmentStrength,
    adjustmentConfidence,
    worldResistanceAdjustment: smoothSigned(
      scaleRawAdjustment(rawAdjustment.worldResistanceAdjustment),
      previousAdjustment?.worldResistanceAdjustment,
      dt,
    ),
    delayWindowAdjustment: smoothSigned(
      scaleRawAdjustment(rawAdjustment.delayWindowAdjustment),
      previousAdjustment?.delayWindowAdjustment,
      dt,
    ),
    mediumAbsorptionAdjustment: smoothSigned(
      scaleRawAdjustment(rawAdjustment.mediumAbsorptionAdjustment),
      previousAdjustment?.mediumAbsorptionAdjustment,
      dt,
    ),
  };

  const averageMagnitude = averageAbsoluteAdjustment(adjustment);
  const previousDominance = clamp01(previousAdjustment?.feedbackDominanceRisk ?? 0);
  adjustment.feedbackEffectEstimate = clamp01(
    averageMagnitude * adjustment.adjustmentStrength * (0.4 + adjustment.adjustmentConfidence * 0.6),
  );
  adjustment.overcorrectionRisk = clamp01(
    adjustment.feedbackEffectEstimate * 0.52 +
      adjustment.adjustmentStrength * 0.22 +
      Math.abs(overCouplingDrive - underCouplingDrive) * 0.12 +
      delayDrive * 0.14,
  );
  adjustment.feedbackDominanceRisk = clamp01(
    adjustment.adjustmentStrength * 0.42 +
      adjustment.feedbackEffectEstimate * 0.3 +
      previousDominance * 0.18 +
      (1 - viability.viabilityConfidence) * 0.1,
  );

  return adjustment;
}
