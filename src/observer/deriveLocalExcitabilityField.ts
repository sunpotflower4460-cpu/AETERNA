/**
 * deriveLocalExcitabilityField
 *
 * S5: Local Excitability Field
 *
 * Observer-side, read-only derivation of local excitability conditions across
 * coarse torus regions. This function is a pure function (no side effects) that
 * reads existing state and returns a field profile.
 *
 * Design principles:
 * - Observer-side only; does not modify any input state.
 * - Pure function oriented; no global mutation.
 * - regionId values are coarse grid identifiers, not semantic labels.
 * - All output values are clamped to [0, 1]; no NaN or Infinity.
 * - Fallback to neutral values when upstream states are missing.
 * - No semantic interpretation; no neuron placement; no path formation.
 * - S5 observes excitability conditions only; firing is not triggered here.
 */

import type { BodyWorldClosureState } from '../types/bodyWorldClosureState.ts';
import type { DynamicViabilityState } from '../types/dynamicViabilityState.ts';
import type { LocalExcitabilityCell, LocalExcitabilityFieldState } from '../types/localExcitabilityField.ts';
import type { MediumProfileState } from '../types/mediumProfileState.ts';
import type { SensoryReturnPacket } from '../types/sensoryReturnPacket.ts';
import type { TraceState } from '../types/traceState.ts';

export interface DeriveLocalExcitabilityFieldParams {
  /** Raw activity field — any structure that may supply per-region or global activity */
  activityField?: unknown;
  /** Trace state — source of traceResidue, recurrenceWeight, settlingResidue */
  trace?: TraceState | null;
  /** Sensory return packets — source of returnInfluence per region */
  returns?: SensoryReturnPacket[];
  /** Body-world closure — source of loopGain, returnStrength, closureStability */
  closure?: BodyWorldClosureState | null;
  /** Medium profile — source of resistance, dissipation, echo */
  mediumProfile?: MediumProfileState | null;
  /** Dynamic viability — source of flowContinuity, dissipationBalance, resistanceBalance */
  viability?: DynamicViabilityState | null;
  /** Previous field state for temporal continuity */
  previousField?: LocalExcitabilityFieldState | null;
  /** Time step in seconds */
  dt: number;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** Coarse torus region identifiers arranged on a 4×4 grid */
const REGION_IDS: string[] = [
  'u0-v0', 'u0-v1', 'u0-v2', 'u0-v3',
  'u1-v0', 'u1-v1', 'u1-v2', 'u1-v3',
  'u2-v0', 'u2-v1', 'u2-v2', 'u2-v3',
  'u3-v0', 'u3-v1', 'u3-v2', 'u3-v3',
];

const REGION_COUNT = REGION_IDS.length;

/**
 * Derive a simple pseudo-spatial hash in [0,1] for a region index.
 * Used to introduce mild spatial variation without artificial fluctuation.
 * This is deterministic and produces stable gradients.
 */
function spatialBias(index: number): number {
  // Sinusoidal variation along the torus U and V axes
  const u = Math.floor(index / 4) / 3; // 0..1 in U
  const v = (index % 4) / 3;          // 0..1 in V
  return clamp01(0.5 + 0.12 * Math.sin(u * Math.PI * 2) * Math.cos(v * Math.PI * 2));
}

// ---------------------------------------------------------------------------
// Per-cell derivation
// ---------------------------------------------------------------------------

function deriveCell(
  index: number,
  regionId: string,
  params: DeriveLocalExcitabilityFieldParams,
  previousCell: LocalExcitabilityCell | null,
): LocalExcitabilityCell {
  const { trace, returns, closure, mediumProfile, viability, dt } = params;
  const dtClamped = clamp01((dt ?? 1 / 60) * 60); // normalize to [0,1] per-frame scale

  // Spatial bias for mild regional variation (purely deterministic)
  const bias = spatialBias(index);

  // -------------------------------------------------------------------------
  // activationLevel: global activity proxy, modulated by spatial bias
  // -------------------------------------------------------------------------
  const globalFlow = clamp01(viability?.flowContinuity ?? 0.3);
  const globalEnergy = clamp01(viability?.energyThroughput ?? 0.3);
  const prevActivation = clamp01(previousCell?.activationLevel ?? globalFlow);
  const activationLevel = clamp01(
    prevActivation * 0.72 +
    (globalFlow * 0.14 + globalEnergy * 0.10) * bias +
    clamp01(viability?.boundaryExchange ?? 0.3) * 0.04,
  );

  // -------------------------------------------------------------------------
  // traceResidue: from trace state + echo persistence
  // -------------------------------------------------------------------------
  const traceStrength = clamp01(trace?.traceStrength ?? 0);
  const settlingResidue = clamp01(trace?.settlingResidue ?? 0);
  const recoveryLinkedResidue = clamp01(trace?.recoveryLinkedResidue ?? 0);
  const salienceResidue = clamp01(trace?.salienceResidue ?? 0);
  const echoPersistence = clamp01(mediumProfile?.echo.echoPersistence ?? 0.3);
  const prevTraceResidue = clamp01(previousCell?.traceResidue ?? 0);
  // Low dissipation → trace persists longer; spatial bias adds mild regional variation
  const localDissipationBase = clamp01(
    clamp01(mediumProfile?.resistance.returnAttenuation ?? 0.3) * 0.4 +
    clamp01(viability?.dissipationBalance ?? 0.5) * 0.3 +
    (1 - bias) * 0.2 +
    clamp01(mediumProfile?.echo.echoDecayRate ?? 0.4) * 0.1,
  );
  const decayRate = clamp01(0.04 + localDissipationBase * 0.08) * dtClamped;
  const traceInput = clamp01(
    traceStrength * 0.36 +
    settlingResidue * 0.22 +
    recoveryLinkedResidue * 0.16 +
    salienceResidue * 0.14 +
    echoPersistence * 0.12,
  );
  const traceResidue = clamp01(prevTraceResidue * (1 - decayRate) + traceInput * decayRate * 4 * bias);

  // -------------------------------------------------------------------------
  // returnInfluence: from sensory returns + closure
  // -------------------------------------------------------------------------
  const returnPackets = returns ?? [];
  const rawReturnIntensity = returnPackets.length > 0
    ? clamp01(avg(returnPackets.map((r) => r.intensity * r.worldOriginStrength * clamp01(r.locality * 2))))
    : 0;
  const closureReturnStrength = clamp01(closure?.returnStrength ?? 0);
  const loopGainNorm = clamp01((closure?.loopGain ?? 0) / 1.2);
  const reafferenceMismatch = clamp01(closure?.returnMismatch ?? 0);
  const closureStability = clamp01(closure?.closureStability ?? 0.5);
  const prevReturnInfluence = clamp01(previousCell?.returnInfluence ?? 0);
  const returnInput = clamp01(
    rawReturnIntensity * 0.32 +
    closureReturnStrength * 0.24 +
    loopGainNorm * 0.18 +
    reafferenceMismatch * 0.14 +
    closureStability * 0.12,
  ) * bias;
  const returnInfluence = clamp01(prevReturnInfluence * 0.76 + returnInput * 0.24);

  // -------------------------------------------------------------------------
  // localResistance: from medium resistance profile
  // -------------------------------------------------------------------------
  const worldResistance = clamp01(mediumProfile?.resistance.worldResistance ?? 0.4);
  const boundaryResistance = clamp01(mediumProfile?.resistance.boundaryResistance ?? 0.3);
  const transmissionRatio = clamp01(mediumProfile?.resistance.transmissionRatio ?? 0.5);
  const resistanceBalance = clamp01(viability?.resistanceBalance ?? 0.5);
  const localResistance = clamp01(
    worldResistance * 0.30 +
    boundaryResistance * 0.24 +
    (1 - transmissionRatio) * 0.22 +
    (1 - resistanceBalance) * 0.14 +
    (1 - bias) * 0.10,
  );

  // -------------------------------------------------------------------------
  // localDissipation: how quickly activity/trace fades in this region
  // -------------------------------------------------------------------------
  const echoDecayRate = clamp01(mediumProfile?.echo.echoDecayRate ?? 0.4);
  const dissipationBalance = clamp01(viability?.dissipationBalance ?? 0.5);
  const mediumAbsorption = clamp01(mediumProfile?.resistance.mediumAbsorption ?? 0.3);
  const localDissipation = clamp01(
    echoDecayRate * 0.30 +
    dissipationBalance * 0.26 +
    mediumAbsorption * 0.22 +
    localResistance * 0.12 +
    (1 - bias) * 0.10,
  );

  // -------------------------------------------------------------------------
  // refractoryDepth: post-activation suppression
  // -------------------------------------------------------------------------
  const overCouplingRisk = clamp01(viability?.overCouplingRisk ?? 0);
  const saturationRisk = clamp01(viability?.saturationRisk ?? 0);
  const prevRefractoryDepth = clamp01(previousCell?.refractoryDepth ?? 0);
  // Refractory fades over time unless overload or saturation pushes it up
  const refractoryInput = clamp01(
    overCouplingRisk * 0.44 +
    saturationRisk * 0.36 +
    (1 - clamp01(viability?.viabilityConfidence ?? 0.5)) * 0.20,
  ) * bias;
  const refractoryDecay = clamp01(0.06 + (1 - localDissipation) * 0.06) * dtClamped;
  const refractoryDepth = clamp01(prevRefractoryDepth * (1 - refractoryDecay) + refractoryInput * refractoryDecay * 3);

  // -------------------------------------------------------------------------
  // recoveryProgress: how much the region has recovered from refractory state
  // -------------------------------------------------------------------------
  const extinctionRisk = clamp01(viability?.extinctionRisk ?? 0);
  const delayCoherence = clamp01(viability?.delayCoherence ?? 0.5);
  const traceContinuity = clamp01(viability?.traceContinuity ?? 0.3);
  const prevRecoveryProgress = clamp01(previousCell?.recoveryProgress ?? 0.5);
  // Recovery advances faster when viability is good and refractory is low
  const recoveryInput = clamp01(
    (1 - refractoryDepth) * 0.32 +
    delayCoherence * 0.22 +
    traceContinuity * 0.18 +
    (1 - extinctionRisk) * 0.16 +
    clamp01(viability?.returnContinuity ?? 0.3) * 0.12,
  ) * bias;
  const recoverySpeed = clamp01(0.05 + (1 - refractoryDepth) * 0.08) * dtClamped;
  const recoveryProgress = clamp01(prevRecoveryProgress * (1 - recoverySpeed) + recoveryInput * recoverySpeed * 4);

  // -------------------------------------------------------------------------
  // thresholdProximity: nearness to a low-threshold excitable state
  // -------------------------------------------------------------------------
  const recurrenceWeight = clamp01(trace?.recurrenceWeight ?? 0);
  const replayReadiness = clamp01(trace?.replayReadiness ?? 0);
  const prevThresholdProximity = clamp01(previousCell?.thresholdProximity ?? 0);
  const thresholdInput = clamp01(
    activationLevel * 0.24 +
    traceResidue * 0.22 +
    returnInfluence * 0.18 +
    recoveryProgress * 0.14 +
    recurrenceWeight * 0.12 +
    replayReadiness * 0.10,
  ) * (1 - refractoryDepth * 0.6);
  const thresholdSmoothing = 0.78;
  const thresholdProximity = clamp01(prevThresholdProximity * thresholdSmoothing + thresholdInput * (1 - thresholdSmoothing));

  // -------------------------------------------------------------------------
  // propagationTendency: tendency for local activity to flow to neighbors
  // -------------------------------------------------------------------------
  const closureViability = clamp01(viability?.closureViability ?? 0.4);
  const mediumExchangeBalance = clamp01(viability?.mediumExchangeBalance ?? 0.5);
  const prevPropagation = clamp01(previousCell?.propagationTendency ?? 0);
  const propagationInput = clamp01(
    activationLevel * 0.26 +
    (1 - localResistance) * 0.22 +
    (1 - localDissipation) * 0.18 +
    traceResidue * 0.14 +
    closureViability * 0.12 +
    mediumExchangeBalance * 0.08,
  ) * bias;
  const propagationTendency = clamp01(prevPropagation * 0.80 + propagationInput * 0.20);

  // -------------------------------------------------------------------------
  // excitability: composite of all above (main observable)
  // Refractory suppresses excitability; high dissipation also reduces it.
  // -------------------------------------------------------------------------
  const rawExcitability = clamp01(
    activationLevel * 0.20 +
    thresholdProximity * 0.18 +
    traceResidue * 0.16 +
    returnInfluence * 0.14 +
    propagationTendency * 0.12 +
    recoveryProgress * 0.10 +
    (1 - localResistance) * 0.10,
  );
  // Refractory suppression: deeper refractory → lower excitability
  const refractorySuppress = clamp01(refractoryDepth * 0.65);
  // Dissipation penalty: high dissipation → trace doesn't persist → less excitability
  const dissipationPenalty = clamp01(localDissipation * 0.25);
  const excitability = clamp01(rawExcitability * (1 - refractorySuppress) * (1 - dissipationPenalty));

  // -------------------------------------------------------------------------
  // confidence: reliability of this cell's observation
  // -------------------------------------------------------------------------
  const hasTrace = trace != null ? 0.3 : 0;
  const hasReturns = returnPackets.length > 0 ? 0.25 : 0;
  const hasClosure = closure != null ? 0.2 : 0;
  const hasMedium = mediumProfile != null ? 0.15 : 0;
  const hasViability = viability != null ? 0.1 : 0;
  const confidence = clamp01(hasTrace + hasReturns + hasClosure + hasMedium + hasViability);

  return {
    regionId,
    activationLevel,
    excitability,
    thresholdProximity,
    refractoryDepth,
    recoveryProgress,
    traceResidue,
    returnInfluence,
    propagationTendency,
    localResistance,
    localDissipation,
    confidence,
  };
}

// ---------------------------------------------------------------------------
// Field-level aggregation
// ---------------------------------------------------------------------------

function computeVariance(values: number[], mean: number): number {
  if (values.length === 0) return 0;
  const sqDiffs = values.map((v) => (v - mean) ** 2);
  return sqDiffs.reduce((sum, v) => sum + v, 0) / values.length;
}

function computeGradientStrength(excitabilityValues: number[]): number {
  if (excitabilityValues.length < 2) return 0;
  let totalDelta = 0;
  for (let i = 1; i < excitabilityValues.length; i += 1) {
    totalDelta += Math.abs(excitabilityValues[i] - excitabilityValues[i - 1]);
  }
  return clamp01(totalDelta / (excitabilityValues.length - 1) * 4);
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Derive the Local Excitability Field from available upstream state.
 *
 * This is a read-only, observer-side pure function. It does not modify any
 * input state. All returned values are in [0, 1] with no NaN or Infinity.
 *
 * Region grid: 4×4 coarse torus sectors (u0..u3 × v0..v3).
 * regionId values are spatial coordinates, not semantic labels.
 */
export function deriveLocalExcitabilityField(
  params: DeriveLocalExcitabilityFieldParams,
): LocalExcitabilityFieldState {
  const { previousField } = params;
  const timestamp = (params.trace?.timestamp ?? params.closure?.timestamp ?? 0);

  // Build previous cell map for temporal continuity
  const prevCellMap = new Map<string, LocalExcitabilityCell>(
    (previousField?.cells ?? []).map((cell) => [cell.regionId, cell]),
  );

  // Derive each cell
  const cells: LocalExcitabilityCell[] = REGION_IDS.map((regionId, index) =>
    deriveCell(index, regionId, params, prevCellMap.get(regionId) ?? null),
  );

  // Aggregate field-level statistics
  const excitabilityValues = cells.map((c) => c.excitability);
  const thresholdProximityValues = cells.map((c) => c.thresholdProximity);
  const traceResidueValues = cells.map((c) => c.traceResidue);
  const returnInfluenceValues = cells.map((c) => c.returnInfluence);
  const propagationTendencyValues = cells.map((c) => c.propagationTendency);
  const confidenceValues = cells.map((c) => c.confidence);

  const averageExcitability = clamp01(avg(excitabilityValues));
  const maxExcitability = clamp01(excitabilityValues.length > 0 ? Math.max(...excitabilityValues) : 0);
  const averageThresholdProximity = clamp01(avg(thresholdProximityValues));
  const averageTraceResidue = clamp01(avg(traceResidueValues));
  const averageReturnInfluence = clamp01(avg(returnInfluenceValues));
  const averagePropagationTendency = clamp01(avg(propagationTendencyValues));

  const highExcitabilityRegionCount = cells.filter((c) => c.excitability >= 0.6).length;
  const nearThresholdRegionCount = cells.filter((c) => c.thresholdProximity >= 0.6).length;
  const recoveringRegionCount = cells.filter((c) => c.recoveryProgress > 0.05 && c.refractoryDepth > 0.1).length;
  const localHotspotCount = cells.filter((c) => c.excitability > 0.7).length;

  const excitabilityVariance = computeVariance(excitabilityValues, averageExcitability);
  const regionalGradientStrength = computeGradientStrength(excitabilityValues);
  const fieldConfidence = clamp01(avg(confidenceValues));

  return {
    timestamp,
    regionCount: REGION_COUNT,
    averageExcitability,
    maxExcitability,
    averageThresholdProximity,
    averageTraceResidue,
    averageReturnInfluence,
    averagePropagationTendency,
    highExcitabilityRegionCount,
    nearThresholdRegionCount,
    recoveringRegionCount,
    cells,
    fieldConfidence,
    excitabilityVariance,
    regionalGradientStrength,
    localHotspotCount,
  };
}
