/**
 * deriveRepeatedFlowPaths
 *
 * S6: Path Formation by Repeated Flow
 *
 * Observer-side, read-only derivation of repeated-flow path candidates.
 * This function reads existing state and returns observed path candidates.
 * It does NOT create runtime edges, modify medium conditions, or perform
 * any semantic interpretation.
 *
 * Design principles:
 * - Observer-side only; does not modify any input state.
 * - Pure function oriented; no global mutation.
 * - regionId values are coarse grid identifiers, not semantic labels.
 * - All output values are clamped to [0, 1]; no NaN or Infinity.
 * - Fallback to neutral / empty values when upstream states are missing.
 * - No semantic interpretation; no edge creation; no path weight reinforcement.
 * - S6 observes repeated flow patterns only; no proto-network is formed here.
 * - Path candidates are pre-semantic observations, NOT:
 *   - memory paths
 *   - semantic relations
 *   - learned routes
 *   - neural edges
 *   - concept links
 *
 * Conditions used to form path candidates (all must contribute):
 *   A: Sequential activation — region A was active, then region B became active
 *   B: Repeated occurrence — the same pair has been seen multiple times
 *   C: Delay consistency — consistent delay window from medium profile
 *   D: Trace support — trace residue present in target region
 *   E: Resistance/dissipation conditions — medium state biases on this pair
 *   F: Replay affinity — pair appears during quiet/replay conditions
 *   G: Closure coupling — pair co-occurs with Body-World Closure events
 */

import type { BodyWorldClosureState } from '../types/bodyWorldClosureState.ts';
import type { DynamicViabilityState } from '../types/dynamicViabilityState.ts';
import type { LocalExcitabilityCell, LocalExcitabilityFieldState } from '../types/localExcitabilityField.ts';
import type { MediumProfileState } from '../types/mediumProfileState.ts';
import type { ReafferenceComparisonState } from '../types/reafferenceComparisonState.ts';
import type { RepeatedFlowPathCandidate, RepeatedFlowPathObservationState } from '../types/repeatedFlowPath.ts';
import type { TraceState } from '../types/traceState.ts';

export interface DeriveRepeatedFlowPathsParams {
  /** Current local excitability field — primary activation source */
  localField: LocalExcitabilityFieldState | null;
  /** Previous frame's local excitability field — for sequential activation detection */
  previousLocalField?: LocalExcitabilityFieldState | null;
  /** Raw activity history — unused directly, present for future extension */
  activityHistory?: unknown;
  /** Trace state — source of traceResidue, recurrenceWeight, replayReadiness */
  trace?: TraceState | null;
  /** Medium profile — source of delay consistency, resistance, dissipation */
  mediumProfile?: MediumProfileState | null;
  /** Body-World Closure state — source of closure coupling metrics */
  closure?: BodyWorldClosureState | null;
  /** Reafference comparison — additional closure coupling evidence */
  reafference?: ReafferenceComparisonState | null;
  /** Dynamic viability — source of delayCoherence, traceContinuity */
  viability?: DynamicViabilityState | null;
  /** Previous observation state — used for recurrence tracking across frames */
  previousObservation?: RepeatedFlowPathObservationState | null;
  /** Time step in seconds */
  dt: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Activation threshold: region must exceed this to count as "active" */
const ACTIVATION_THRESHOLD = 0.42;

/** Minimum flowCount before a candidate is considered stable */
const STABLE_FLOW_COUNT = 3;

/** Minimum confidence before a candidate is considered stable */
const STABLE_CONFIDENCE = 0.30;

/** Maximum number of candidates to keep (guards against explosion) */
const MAX_CANDIDATES = 24;

/** Decay applied to pathStability when a candidate is not observed this frame */
const STABILITY_DECAY = 0.18;

/** Minimum pathStability before a candidate is removed */
const STABILITY_PRUNE_THRESHOLD = 0.05;

/** Baseline localResistance to compare against (neutral medium) */
const BASELINE_RESISTANCE = 0.40;

/** Baseline localDissipation to compare against (neutral medium) */
const BASELINE_DISSIPATION = 0.40;

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

/** Build a canonical path ID from two region IDs */
function pathId(fromRegionId: string, toRegionId: string): string {
  return `${fromRegionId}->${toRegionId}`;
}

/**
 * Derive recurrenceStrength from flowCount.
 * Saturates toward 1.0 using 1 - exp(-k * flowCount).
 * k=0.30 means flowCount=5 → ~0.78, flowCount=10 → ~0.95.
 */
function recurrenceFromFlowCount(flowCount: number): number {
  return clamp01(1 - Math.exp(-0.30 * flowCount));
}

/**
 * Detect region pairs where activation appears to propagate sequentially.
 * Returns pairs (fromRegionId → toRegionId) where:
 *   - fromRegion had high activationLevel in the previous field
 *   - toRegion has high activationLevel in the current field
 *   - fromRegion ≠ toRegion
 */
function detectSequentialActivations(
  current: LocalExcitabilityFieldState,
  previous: LocalExcitabilityFieldState,
): Array<{ fromCell: LocalExcitabilityCell; toCell: LocalExcitabilityCell }> {
  const pairs: Array<{ fromCell: LocalExcitabilityCell; toCell: LocalExcitabilityCell }> = [];

  const prevActive = previous.cells.filter((c) => c.activationLevel >= ACTIVATION_THRESHOLD);
  const currActive = current.cells.filter((c) => c.activationLevel >= ACTIVATION_THRESHOLD);

  for (const fromCell of prevActive) {
    for (const toCell of currActive) {
      if (fromCell.regionId === toCell.regionId) continue;
      // Require that the source cell had meaningful propagation tendency
      if (fromCell.propagationTendency < 0.25) continue;
      // Require target cell to also have some receptiveness
      if (toCell.thresholdProximity < 0.20) continue;
      pairs.push({ fromCell, toCell });
    }
  }

  return pairs;
}

/**
 * Compute traceSupport for a pair by examining the target cell's traceResidue.
 * If global trace state is available, supplement with recurrenceWeight.
 */
function computeTraceSupport(
  toCell: LocalExcitabilityCell,
  trace: TraceState | null | undefined,
): number {
  const cellTrace = clamp01(toCell.traceResidue);
  const globalTrace = clamp01(trace?.recurrenceWeight ?? 0);
  return clamp01(cellTrace * 0.70 + globalTrace * 0.30);
}

/**
 * Compute delayConsistency as a proxy from medium profile and viability.
 * High stableDelayWindow + low unstableDelayScore + high delayCoherence → high consistency.
 */
function computeDelayConsistency(
  mediumProfile: MediumProfileState | null | undefined,
  viability: DynamicViabilityState | null | undefined,
): number {
  const stableWindow = clamp01(mediumProfile?.delay.stableDelayWindow ?? 0.5);
  const unstableScore = clamp01(mediumProfile?.delay.unstableDelayScore ?? 0.3);
  const delayCoherence = clamp01(viability?.delayCoherence ?? 0.5);
  return clamp01(
    stableWindow * 0.40 +
    (1 - unstableScore) * 0.30 +
    delayCoherence * 0.30,
  );
}

/**
 * Compute propagationConsistency for the source cell.
 * Uses the current and previous propagationTendency values, supplemented
 * by traceContinuity from viability.
 */
function computePropagationConsistency(
  fromCellCurrent: LocalExcitabilityCell,
  fromCellPrev: LocalExcitabilityCell | null,
  viability: DynamicViabilityState | null | undefined,
): number {
  const currProp = clamp01(fromCellCurrent.propagationTendency);
  const prevProp = clamp01(fromCellPrev?.propagationTendency ?? currProp);
  // Consistency: both frames have high propagation + low variance between them
  const consistency = 1 - clamp01(Math.abs(currProp - prevProp) * 2);
  const traceContinuity = clamp01(viability?.traceContinuity ?? 0.4);
  return clamp01(
    currProp * 0.40 +
    consistency * 0.35 +
    traceContinuity * 0.25,
  );
}

/**
 * Compute resistanceShift: how much the local resistance on the from/to
 * cells deviates below the baseline (lower resistance = more permeable path).
 */
function computeResistanceShift(
  fromCell: LocalExcitabilityCell,
  toCell: LocalExcitabilityCell,
): number {
  const fromShift = clamp01(BASELINE_RESISTANCE - fromCell.localResistance);
  const toShift = clamp01(BASELINE_RESISTANCE - toCell.localResistance);
  // Average, clamped to 0 (no shift when resistance is above baseline)
  return clamp01((fromShift + toShift) / 2);
}

/**
 * Compute dissipationShift: how much local dissipation is below baseline
 * (lower dissipation = trace persists longer on this path).
 */
function computeDissipationShift(
  fromCell: LocalExcitabilityCell,
  toCell: LocalExcitabilityCell,
): number {
  const fromShift = clamp01(BASELINE_DISSIPATION - fromCell.localDissipation);
  const toShift = clamp01(BASELINE_DISSIPATION - toCell.localDissipation);
  return clamp01((fromShift + toShift) / 2);
}

/**
 * Compute replayAffinity: proxy for how often this pair appears in
 * quiet / low-perturbation conditions with elevated replay readiness.
 * This is NOT memory replay; it's a flow-residue re-occurrence proxy.
 */
function computeReplayAffinity(
  fromCell: LocalExcitabilityCell,
  toCell: LocalExcitabilityCell,
  trace: TraceState | null | undefined,
  viability: DynamicViabilityState | null | undefined,
): number {
  // Replay readiness from trace state
  const replayReadiness = clamp01(trace?.replayReadiness ?? 0);
  // Low external input proxy: low replaySuppression → quiet/settling condition
  const quietProxy = clamp01(1 - (trace?.replaySuppression ?? 0.5));
  // Trace resonance in the pair cells
  const pairTrace = clamp01((fromCell.traceResidue + toCell.traceResidue) / 2);
  // Return continuity: stable return suggests quiet baseline
  const returnContinuity = clamp01(viability?.returnContinuity ?? 0.3);
  return clamp01(
    replayReadiness * 0.30 +
    quietProxy * 0.25 +
    pairTrace * 0.25 +
    returnContinuity * 0.20,
  );
}

/**
 * Compute closureCoupling: how much this pair co-occurs with Body-World Closure events.
 * Uses returnMismatch, selfCausedMatch, worldMismatch, closureDrift from closure state,
 * and returnMismatch from reafference state.
 * NOT a semantic "the world caused this" claim.
 */
function computeClosureCoupling(
  fromCell: LocalExcitabilityCell,
  toCell: LocalExcitabilityCell,
  closure: BodyWorldClosureState | null | undefined,
  reafference: ReafferenceComparisonState | null | undefined,
): number {
  if (!closure && !reafference) return 0;

  // Closure events that might correlate with path activation
  const returnMismatch = clamp01(closure?.returnMismatch ?? closure?.worldMismatch ?? 0);
  const selfCausedMatch = clamp01(closure?.selfCausedMatch ?? 0);
  const closureDrift = clamp01(closure?.closureDrift ?? 0);
  const loopGain = clamp01((closure?.loopGain ?? 0) / 1.2);
  const reafMismatch = clamp01(reafference?.returnMismatch ?? 0);

  // Both cells should show return influence for closure to be relevant
  const returnInfluenceProxy = clamp01((fromCell.returnInfluence + toCell.returnInfluence) / 2);

  return clamp01(
    returnMismatch * 0.22 +
    selfCausedMatch * 0.20 +
    closureDrift * 0.16 +
    loopGain * 0.16 +
    reafMismatch * 0.14 +
    returnInfluenceProxy * 0.12,
  );
}

/**
 * Compute weighted confidence score from all sub-indicators.
 * Weights follow the specification in S6 instructions.
 */
function computeConfidence(candidate: {
  recurrenceStrength: number;
  propagationConsistency: number;
  delayConsistency: number;
  traceSupport: number;
  replayAffinity: number;
  closureCoupling: number;
  resistanceShift: number;
  dissipationShift: number;
}): number {
  return clamp01(
    0.18 * candidate.recurrenceStrength +
    0.16 * candidate.propagationConsistency +
    0.14 * candidate.delayConsistency +
    0.14 * candidate.traceSupport +
    0.12 * candidate.replayAffinity +
    0.12 * candidate.closureCoupling +
    0.08 * candidate.resistanceShift +
    0.06 * candidate.dissipationShift,
  );
}

/**
 * Compute overall observation confidence from data availability.
 */
function computeObservationConfidence(params: DeriveRepeatedFlowPathsParams): number {
  const hasLocalField = params.localField != null ? 0.25 : 0;
  const hasPrevField = params.previousLocalField != null ? 0.20 : 0;
  const hasTrace = params.trace != null ? 0.18 : 0;
  const hasClosure = params.closure != null ? 0.15 : 0;
  const hasViability = params.viability != null ? 0.12 : 0;
  const hasMedium = params.mediumProfile != null ? 0.10 : 0;
  return clamp01(hasLocalField + hasPrevField + hasTrace + hasClosure + hasViability + hasMedium);
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Derive Repeated Flow Path Observation State from available upstream state.
 *
 * This is a read-only, observer-side pure function. It does not modify any
 * input state. All returned values are in [0, 1] with no NaN or Infinity.
 *
 * Path candidates are pre-semantic observation records, NOT:
 * - Runtime edges or graph nodes
 * - Semantic relations or meaning links
 * - Memory paths or learned routes
 * - Proto-network edges
 *
 * The function detects sequential regional activation patterns and tracks
 * their recurrence across frames via the previousObservation parameter.
 */
export function deriveRepeatedFlowPaths(
  params: DeriveRepeatedFlowPathsParams,
): RepeatedFlowPathObservationState {
  const { localField, previousLocalField, trace, mediumProfile, closure, reafference, viability, previousObservation, dt } = params;
  const timestamp = localField?.timestamp ?? 0;

  const observationConfidence = computeObservationConfidence(params);

  // -------------------------------------------------------------------------
  // Guard: insufficient data → return empty observation
  // -------------------------------------------------------------------------
  if (!localField || !previousLocalField) {
    return {
      timestamp,
      pathCandidateCount: 0,
      stablePathCandidateCount: 0,
      averageConfidence: 0,
      maxConfidence: 0,
      averageRecurrenceStrength: 0,
      averagePropagationConsistency: 0,
      averageTraceSupport: 0,
      averageClosureCoupling: 0,
      candidates: [],
      observationConfidence,
    };
  }

  const dtClamped = clamp01((dt ?? 1 / 60) * 60);

  // -------------------------------------------------------------------------
  // Build lookup map for previous cells
  // -------------------------------------------------------------------------
  const prevCellMap = new Map<string, LocalExcitabilityCell>(
    previousLocalField.cells.map((c) => [c.regionId, c]),
  );

  // -------------------------------------------------------------------------
  // Detect sequential activations this frame
  // -------------------------------------------------------------------------
  const detectedPairs = detectSequentialActivations(localField, previousLocalField);
  const detectedPairIds = new Set(detectedPairs.map((p) => pathId(p.fromCell.regionId, p.toCell.regionId)));

  // -------------------------------------------------------------------------
  // Build candidate map from previous observation (for recurrence tracking)
  // -------------------------------------------------------------------------
  const prevCandidateMap = new Map<string, RepeatedFlowPathCandidate>(
    (previousObservation?.candidates ?? []).map((c) => [c.id, c]),
  );

  // -------------------------------------------------------------------------
  // Update existing candidates and add newly detected pairs
  // -------------------------------------------------------------------------
  const updatedCandidates: RepeatedFlowPathCandidate[] = [];

  // Process newly detected pairs
  for (const { fromCell, toCell } of detectedPairs) {
    const id = pathId(fromCell.regionId, toCell.regionId);
    const prev = prevCandidateMap.get(id);

    // Compute current-frame metrics
    const prevFromCell = prevCellMap.get(fromCell.regionId) ?? null;
    const propagationConsistency = computePropagationConsistency(fromCell, prevFromCell, viability);
    const delayConsistency = computeDelayConsistency(mediumProfile, viability);
    const traceSupport = computeTraceSupport(toCell, trace);
    const resistanceShift = computeResistanceShift(fromCell, toCell);
    const dissipationShift = computeDissipationShift(fromCell, toCell);
    const replayAffinity = computeReplayAffinity(fromCell, toCell, trace, viability);
    const closureCoupling = computeClosureCoupling(fromCell, toCell, closure, reafference);

    const flowCount = (prev?.flowCount ?? 0) + 1;
    const recurrenceStrength = recurrenceFromFlowCount(flowCount);

    const subMetrics = {
      recurrenceStrength,
      propagationConsistency,
      delayConsistency,
      traceSupport,
      replayAffinity,
      closureCoupling,
      resistanceShift,
      dissipationShift,
    };
    const confidence = computeConfidence(subMetrics);

    // Smooth averageFlowStrength
    const prevAvgStrength = prev?.averageFlowStrength ?? fromCell.activationLevel;
    const averageFlowStrength = clamp01(prevAvgStrength * 0.80 + fromCell.activationLevel * 0.20);

    // Lifetime tracking
    const lifetimeTicks = (prev?.lifetimeTicks ?? 0) + 1;
    const lastSeenTick = timestamp;

    // pathStability: increases toward confidence, decays slightly each frame
    const prevStability = prev?.pathStability ?? 0;
    const pathStability = clamp01(prevStability * (1 - STABILITY_DECAY * dtClamped * 0.5) + confidence * STABILITY_DECAY * dtClamped * 3);

    updatedCandidates.push({
      id,
      timestamp,
      fromRegionId: fromCell.regionId,
      toRegionId: toCell.regionId,
      flowCount,
      recurrenceStrength,
      propagationConsistency,
      delayConsistency,
      traceSupport,
      resistanceShift,
      dissipationShift,
      replayAffinity,
      closureCoupling,
      confidence,
      lastSeenTick,
      lifetimeTicks,
      averageFlowStrength,
      pathStability,
      pathDecay: STABILITY_DECAY,
    });
  }

  // Carry forward previous candidates NOT seen this frame (decay them)
  for (const [id, prev] of prevCandidateMap.entries()) {
    if (detectedPairIds.has(id)) continue; // already updated above

    const prevStability = prev.pathStability ?? prev.confidence;
    const newStability = clamp01(prevStability * (1 - STABILITY_DECAY * dtClamped));

    // Prune if below threshold
    if (newStability < STABILITY_PRUNE_THRESHOLD) continue;

    updatedCandidates.push({
      ...prev,
      timestamp,
      pathStability: newStability,
      // Decay confidence slightly when not observed
      confidence: clamp01(prev.confidence * (1 - STABILITY_DECAY * dtClamped * 0.4)),
    });
  }

  // -------------------------------------------------------------------------
  // Sort by confidence descending, keep top MAX_CANDIDATES
  // -------------------------------------------------------------------------
  updatedCandidates.sort((a, b) => b.confidence - a.confidence);
  const finalCandidates = updatedCandidates.slice(0, MAX_CANDIDATES);

  // -------------------------------------------------------------------------
  // Field-level aggregation
  // -------------------------------------------------------------------------
  const pathCandidateCount = finalCandidates.length;
  const stablePathCandidateCount = finalCandidates.filter(
    (c) => c.confidence >= STABLE_CONFIDENCE && c.flowCount >= STABLE_FLOW_COUNT,
  ).length;

  const confidenceValues = finalCandidates.map((c) => c.confidence);
  const averageConfidence = clamp01(avg(confidenceValues));
  const maxConfidence = clamp01(pathCandidateCount > 0 ? Math.max(...confidenceValues) : 0);

  const averageRecurrenceStrength = clamp01(avg(finalCandidates.map((c) => c.recurrenceStrength)));
  const averagePropagationConsistency = clamp01(avg(finalCandidates.map((c) => c.propagationConsistency)));
  const averageTraceSupport = clamp01(avg(finalCandidates.map((c) => c.traceSupport)));
  const averageClosureCoupling = clamp01(avg(finalCandidates.map((c) => c.closureCoupling)));

  return {
    timestamp,
    pathCandidateCount,
    stablePathCandidateCount,
    averageConfidence,
    maxConfidence,
    averageRecurrenceStrength,
    averagePropagationConsistency,
    averageTraceSupport,
    averageClosureCoupling,
    candidates: finalCandidates,
    observationConfidence,
  };
}
