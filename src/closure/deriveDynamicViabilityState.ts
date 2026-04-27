import type { ActuationPulse } from '../types/actuationPulse.ts';
import type { BodySurfaceState } from '../types/bodySurfaceState.ts';
import type { BodyWorldClosureState } from '../types/bodyWorldClosureState.ts';
import type { DynamicViabilityState } from '../types/dynamicViabilityState.ts';
import type { ReafferenceComparisonState } from '../types/reafferenceComparisonState.ts';
import type { SensoryReturnPacket } from '../types/sensoryReturnPacket.ts';
import type { TraceState } from '../types/traceState.ts';
import type { WorldMediumState } from '../types/worldMediumState.ts';

export interface DeriveDynamicViabilityStateParams {
  closure: BodyWorldClosureState | null;
  world: WorldMediumState | null;
  bodySurface: BodySurfaceState | null;
  pulse: ActuationPulse | null;
  returns: SensoryReturnPacket[];
  reafference: ReafferenceComparisonState | null;
  trace?: TraceState | null;
  previousViability?: DynamicViabilityState | null;
  dt: number;
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
  return values.reduce((sum, value) => sum + clamp01(value), 0) / values.length;
}

function balanceScore(value: number, target = 0.5, tolerance = 0.5): number {
  if (!Number.isFinite(value)) return 0;
  if (tolerance <= 0) return value === target ? 1 : 0;
  return clamp01(1 - Math.abs(value - target) / tolerance);
}

function latestTimestamp(values: Array<number | undefined>): number {
  const finiteValues = values.filter((value): value is number => Number.isFinite(value));
  if (finiteValues.length === 0) return 0;
  return Math.max(...finiteValues);
}

function averageReturnIntensity(returns: SensoryReturnPacket[]): number {
  if (returns.length === 0) return 0;
  return average(returns.map((packet) => packet.intensity * packet.worldOriginStrength));
}

function averageDelayHint(returns: SensoryReturnPacket[]): number {
  if (returns.length === 0) return 0;
  return average(returns.map((packet) => packet.returnDelayHint));
}

function averageReturnReadiness(returns: SensoryReturnPacket[]): number {
  if (returns.length === 0) return 0;
  return average(returns.map((packet) => packet.returnReadiness ?? 0));
}

function smoothWithPrevious(
  current: number,
  previous: number | null | undefined,
  dt: number,
): number {
  if (!Number.isFinite(previous ?? NaN)) return clamp01(current);
  const dtWeight = Number.isFinite(dt) && dt > 0 ? clamp01(dt / 0.1) : 0.2;
  const previousWeight = 0.1 + (1 - dtWeight) * 0.15;
  return clamp01(current * (1 - previousWeight) + clamp01(previous ?? 0) * previousWeight);
}

export function deriveDynamicViabilityState(
  params: DeriveDynamicViabilityStateParams,
): DynamicViabilityState {
  const {
    closure,
    world,
    bodySurface,
    pulse,
    returns,
    reafference,
    trace = null,
    previousViability = null,
    dt,
  } = params;

  const timestamp = latestTimestamp([
    closure?.timestamp,
    world?.timestamp,
    bodySurface?.timestamp,
    pulse?.timestamp,
    reafference?.timestamp,
    trace?.timestamp,
    returns[returns.length - 1]?.timestamp,
    previousViability?.timestamp,
  ]);

  const pulseIntensity = clamp01(pulse?.intensity ?? 0);
  const pulseCoherence = clamp01(pulse?.coherence ?? 0);
  const pulseOutputReadiness = clamp01(pulse?.outputReadiness ?? bodySurface?.outputReadiness ?? 0);
  const pulseBoundaryLink = clamp01(pulse?.boundaryLinked ?? 0);
  const pulseSupport = pulse == null
    ? 0
    : average([pulseIntensity, pulseCoherence, pulseOutputReadiness, pulseBoundaryLink]);

  const returnStrength = clamp01(
    reafference?.actualReturn ??
      closure?.returnStrength ??
      averageReturnIntensity(returns),
  );
  const returnCountNorm = clamp01(returns.length / 4);
  const averageDelay = clamp01(
    reafference?.returnDelay ??
      closure?.roundTripDelay ??
      (returns.length > 0 ? averageDelayHint(returns) : (world?.feedbackDelay ?? 0)),
  );
  const worldFeedbackDelay = clamp01(world?.feedbackDelay ?? averageDelay);
  const unresolvedReturn = clamp01(reafference?.unresolvedReturn ?? closure?.unresolvedReturn ?? 0);
  const returnMismatch = clamp01(
    reafference?.returnMismatch ??
      closure?.returnMismatch ??
      Math.abs(pulseSupport - returnStrength),
  );
  const returnAmplification = clamp01(
    reafference?.returnAmplification ?? Math.max(0, returnStrength - pulseSupport),
  );
  const returnAttenuation = clamp01(
    reafference?.returnAttenuation ?? Math.max(0, pulseSupport - returnStrength),
  );

  const traceStrength = clamp01(trace?.traceStrength ?? 0);
  const recurrenceWeight = clamp01(trace?.recurrenceWeight ?? 0);
  const salienceResidue = clamp01(trace?.salienceResidue ?? 0);
  const replayReadiness = clamp01(trace?.replayReadiness ?? 0);
  const settlingResidue = clamp01(trace?.settlingResidue ?? trace?.recoveryLinkedResidue ?? 0);

  const surfaceResistance = clamp01(world?.surfaceResistance ?? 0.5);
  const echoLevel = clamp01(world?.echoLevel ?? 0);
  const lastPulseImpact = clamp01(world?.lastPulseImpact ?? 0);
  const mediumStability = clamp01(
    world?.mediumStability ??
      average(returns.map((packet) => packet.mediumStabilityHint)),
  );
  const worldReturnReadiness = clamp01(world?.returnReadiness ?? averageReturnReadiness(returns));

  const boundaryIntegrity = clamp01(bodySurface?.boundaryIntegrity ?? 0.5);
  const permeability = clamp01(bodySurface?.permeability ?? 0.5);
  const contactReadiness = clamp01(bodySurface?.contactReadiness ?? 0.5);
  const outputReadiness = clamp01(bodySurface?.outputReadiness ?? pulseOutputReadiness);
  const recoveryShielding = clamp01(bodySurface?.recoveryShielding ?? 0.3);
  const externalContactLoad = clamp01(bodySurface?.externalContactLoad ?? 0.25);

  const loopGain = clamp(closure?.loopGain ?? returnStrength, 0, 1.5);
  const loopGainNormalized = clamp01(loopGain / 1.1);
  const closureStability = clamp01(closure?.closureStability ?? 0.4);
  const closureDrift = clamp01(closure?.closureDrift ?? 0);
  const closureConfidence = clamp01(
    closure?.comparisonConfidence ?? reafference?.comparisonConfidence ?? 0,
  );
  const closureFeedbackSaturationRisk = clamp01(closure?.feedbackSaturationRisk ?? 0);
  const worldMismatch = clamp01(
    reafference?.worldCausedDifference ?? closure?.worldMismatch ?? 0,
  );

  const traceContinuity = average([
    traceStrength,
    recurrenceWeight,
    replayReadiness,
    settlingResidue,
  ]);
  const returnContinuity = average([
    returnStrength,
    returnCountNorm,
    1 - unresolvedReturn,
    1 - Math.abs(averageDelay - worldFeedbackDelay),
  ]);

  const energyThroughput = average([
    pulseSupport,
    returnStrength,
    lastPulseImpact,
    worldReturnReadiness,
    average([traceStrength, salienceResidue]),
  ]);

  const rawFlowContinuity = average([
    Math.max(pulseSupport, returnStrength),
    traceContinuity,
    closureStability,
    Math.max(lastPulseImpact, worldReturnReadiness),
    returnContinuity,
  ]);
  const flowContinuity = smoothWithPrevious(
    rawFlowContinuity,
    previousViability?.flowContinuity,
    dt,
  );

  const residueMean = average([
    echoLevel,
    lastPulseImpact,
    traceStrength,
    salienceResidue,
  ]);
  const dissipationBalance = average([
    balanceScore(residueMean, 0.4, 0.4),
    balanceScore(replayReadiness, 0.35, 0.35),
    1 - average([echoLevel, traceStrength, closureFeedbackSaturationRisk]),
    1 - clamp01((0.18 - residueMean) / 0.18),
  ]);

  const resistanceBalance = average([
    balanceScore(surfaceResistance, 0.5, 0.5),
    balanceScore(permeability, 0.5, 0.5),
    balanceScore(returnAttenuation, 0.35, 0.35),
    balanceScore(loopGainNormalized, 0.65, 0.45),
    balanceScore(boundaryIntegrity, 0.72, 0.42),
  ]);

  const delayCoherence = average([
    balanceScore(average([averageDelay, worldFeedbackDelay]), 0.4, 0.4),
    1 - unresolvedReturn,
    1 - closureDrift,
    balanceScore(traceContinuity, 0.45, 0.55),
  ]);

  const boundaryExchange = average([
    balanceScore(permeability, 0.5, 0.5),
    balanceScore(contactReadiness, 0.55, 0.45),
    balanceScore(outputReadiness, 0.55, 0.45),
    balanceScore(boundaryIntegrity, 0.72, 0.42),
    balanceScore(recoveryShielding, 0.35, 0.35),
    balanceScore(externalContactLoad, 0.35, 0.35),
  ]);

  const mediumExchangeBalance = average([
    boundaryExchange,
    balanceScore(surfaceResistance, 0.5, 0.5),
    balanceScore(returnStrength, 0.4, 0.4),
  ]);

  const underCouplingRisk = clamp01(
    pulseSupport * (1 - returnStrength) * 0.35 +
      clamp01((0.75 - loopGain) / 0.75) * 0.25 +
      Math.max(outputReadiness, pulseIntensity) * (1 - Math.max(lastPulseImpact, worldReturnReadiness)) * 0.2 +
      (1 - flowContinuity) * 0.1 +
      (1 - boundaryExchange) * 0.1,
  );

  const overCouplingRisk = clamp01(
    clamp01((loopGain - 0.85) / 0.45) * 0.3 +
      echoLevel * 0.2 +
      returnStrength * 0.15 +
      returnAmplification * 0.2 +
      closureFeedbackSaturationRisk * 0.15,
  );

  const saturationRisk = clamp01(
    average([
      pulseIntensity,
      returnStrength,
      echoLevel,
      traceStrength,
      lastPulseImpact,
      closureFeedbackSaturationRisk,
      returnAmplification,
    ]) * 0.7 +
      (1 - dissipationBalance) * 0.3,
  );

  const extinctionRisk = clamp01(
    (1 - flowContinuity) * 0.3 +
      (1 - energyThroughput) * 0.25 +
      (1 - returnStrength) * 0.15 +
      (1 - traceContinuity) * 0.15 +
      clamp01((0.2 - pulseSupport) / 0.2) * 0.1 +
      (1 - worldReturnReadiness) * 0.05,
  );

  const closureViability = average([
    flowContinuity,
    delayCoherence,
    boundaryExchange,
    1 - underCouplingRisk,
    1 - overCouplingRisk,
    1 - average([saturationRisk, extinctionRisk]),
  ]);

  const coverage = [
    closure != null,
    world != null,
    bodySurface != null,
    pulse != null,
    returns.length > 0,
    reafference != null,
    trace != null,
  ].filter(Boolean).length / 7;

  const previousDelta = previousViability == null
    ? 0
    : average([
        Math.abs(flowContinuity - previousViability.flowContinuity),
        Math.abs(energyThroughput - previousViability.energyThroughput),
        Math.abs(delayCoherence - previousViability.delayCoherence),
        Math.abs(boundaryExchange - previousViability.boundaryExchange),
        Math.abs(saturationRisk - previousViability.saturationRisk),
        Math.abs(extinctionRisk - previousViability.extinctionRisk),
      ]);
  const dtQuality = Number.isFinite(dt) && dt > 0 ? 1 : 0.4;

  const viabilityConfidence = clamp01(
    coverage * 0.35 +
      closureConfidence * 0.15 +
      closureStability * 0.1 +
      mediumStability * 0.1 +
      (1 - average([saturationRisk, extinctionRisk])) * 0.15 +
      (1 - unresolvedReturn) * 0.08 +
      (1 - previousDelta) * 0.05 +
      dtQuality * 0.02,
  );

  return {
    timestamp,
    flowContinuity,
    energyThroughput,
    dissipationBalance,
    resistanceBalance,
    delayCoherence,
    boundaryExchange,
    underCouplingRisk,
    overCouplingRisk,
    saturationRisk,
    extinctionRisk,
    viabilityConfidence,
    returnContinuity,
    traceContinuity,
    mediumExchangeBalance,
    closureViability,
  };
}
