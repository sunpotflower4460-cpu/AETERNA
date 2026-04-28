/**
 * deriveProtoNetworkCandidates
 *
 * S7: Proto-Network Candidate Observation
 *
 * Observer-side, read-only derivation of proto-network candidates.
 * This function reads existing state and returns observed network-like candidates.
 * It does NOT create runtime edges, modify medium conditions, form graphs,
 * or perform any semantic interpretation.
 *
 * Design principles:
 * - Observer-side only; does not modify any input state.
 * - Pure function oriented; no global mutation.
 * - regionIds are coarse grid identifiers, not semantic labels.
 * - All output values are clamped to [0, 1]; no NaN or Infinity.
 * - Fallback to neutral / empty values when upstream states are missing.
 * - No semantic interpretation; no edge creation; no path weight reinforcement.
 * - No Node bridge, no LLM teacher, no concept graph, no knowledge graph.
 * - Candidates are pre-semantic observations, NOT:
 *   - neural networks
 *   - knowledge graphs
 *   - semantic networks
 *   - memory structures
 *   - concept graphs
 *   - relation maps
 *   - runtime edges or weighted paths
 *
 * Conditions used to form network candidates (at least MIN_CANDIDATE_CONDITIONS
 * must be satisfied):
 *   A: coActivationStrength — multiple regions/paths activating together
 *   B: propagationStrength — consistent directional flow across path group
 *   C: recurrenceStrength — same region/path groups appearing repeatedly
 *   D: traceCorrelation — trace/residue correlations across paths/regions
 *   E: replayCoReturn — multiple paths returning together in quiet conditions
 *   F: closureCoupling — co-occurrence with Body-World Closure events
 *   G: weakPlasticity — observed resistance/dissipation/threshold proximity shifts
 */

import type { BodyWorldClosureState } from '../types/bodyWorldClosureState.ts';
import type { DynamicViabilityState } from '../types/dynamicViabilityState.ts';
import type { LocalExcitabilityFieldState } from '../types/localExcitabilityField.ts';
import type { MediumProfileState } from '../types/mediumProfileState.ts';
import type { ProtoNetworkCandidate, ProtoNetworkObservationState } from '../types/protoNetworkCandidate.ts';
import type { ProtoNeuronObservationState } from '../types/protoNeuronObservationState.ts';
import type { ReafferenceComparisonState } from '../types/reafferenceComparisonState.ts';
import type { RepeatedFlowPathCandidate, RepeatedFlowPathObservationState } from '../types/repeatedFlowPath.ts';
import type { TraceState } from '../types/traceState.ts';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum number of candidates to keep (guards against explosion) */
const MAX_CANDIDATES = 12;

/** Minimum confidence before a candidate is considered stable */
const STABLE_CONFIDENCE_THRESHOLD = 0.30;

/** Minimum number of component scores above threshold before forming a candidate */
const MIN_CANDIDATE_CONDITIONS = 2;

/** Component score threshold for counting as "satisfied" */
const CONDITION_THRESHOLD = 0.25;

/** Decay applied to previous-observation confidence when not re-observed */
const PREV_CONFIDENCE_DECAY = 0.92;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function safeAverage(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, v) => acc + (Number.isFinite(v) ? v : 0), 0);
  return clamp01(sum / values.length);
}

// ---------------------------------------------------------------------------
// Component derivation helpers
// ---------------------------------------------------------------------------

/**
 * Derive coActivationStrength from repeated flow paths and local excitability field.
 * Measures: multiple regions/paths activating in same time window.
 */
function deriveCoActivationStrength(
  localField: LocalExcitabilityFieldState | null,
  repeatedFlowPaths: RepeatedFlowPathObservationState | null,
): number {
  // From rfp candidates: average coActivation-proxy (recurrenceStrength + propagationConsistency)
  // among paths that pass a joint threshold
  let rfpCoActivation = 0;
  if (repeatedFlowPaths && repeatedFlowPaths.candidates.length > 0) {
    const highPaths = repeatedFlowPaths.candidates.filter(
      (c) => c.recurrenceStrength > 0.35 && c.propagationConsistency > 0.3,
    );
    if (highPaths.length > 0) {
      rfpCoActivation = safeAverage(
        highPaths.map((c) => (c.recurrenceStrength + c.propagationConsistency) / 2),
      );
    }
  }

  // From localField cells: count pairs with both cells excitability > 0.5
  let fieldCoActivation = 0;
  if (localField && localField.cells.length > 1) {
    const activeCells = localField.cells.filter((c) => c.excitability > 0.5);
    const totalCells = localField.cells.length;
    // Ratio of highly-excitable cells relative to total, as co-activation proxy
    const ratio = activeCells.length / totalCells;
    fieldCoActivation = clamp01(ratio * 1.5); // scale to make 0.33 cells → ~0.5
  }

  return clamp01(rfpCoActivation * 0.65 + fieldCoActivation * 0.35);
}

/**
 * Derive propagationStrength from repeated flow paths and local excitability field.
 * Measures: paths flowing in consistent direction/order.
 */
function derivePropagationStrength(
  localField: LocalExcitabilityFieldState | null,
  repeatedFlowPaths: RepeatedFlowPathObservationState | null,
): number {
  const rfpProp = clamp01(repeatedFlowPaths?.averagePropagationConsistency ?? 0);
  const fieldProp = clamp01(localField?.averagePropagationTendency ?? 0);
  return clamp01(rfpProp * 0.65 + fieldProp * 0.35);
}

/**
 * Derive recurrenceStrength from repeated flow paths and trace state.
 * Measures: same region/path groups appearing repeatedly.
 */
function deriveRecurrenceStrength(
  repeatedFlowPaths: RepeatedFlowPathObservationState | null,
  trace: TraceState | null | undefined,
): number {
  const rfpRecurrence = clamp01(repeatedFlowPaths?.averageRecurrenceStrength ?? 0);
  const traceRecurrence = clamp01(trace?.recurrenceWeight ?? 0);
  return clamp01(rfpRecurrence * 0.70 + traceRecurrence * 0.30);
}

/**
 * Derive traceCorrelation from repeated flow paths, local field, and trace state.
 * Measures: trace/residue correlations across regions/paths.
 */
function deriveTraceCorrelation(
  localField: LocalExcitabilityFieldState | null,
  repeatedFlowPaths: RepeatedFlowPathObservationState | null,
  trace: TraceState | null | undefined,
): number {
  const rfpTrace = clamp01(repeatedFlowPaths?.averageTraceSupport ?? 0);
  const fieldTrace = clamp01(localField?.averageTraceResidue ?? 0);
  const traceResidue = clamp01(trace?.salienceResidue ?? 0);
  return clamp01(rfpTrace * 0.50 + fieldTrace * 0.30 + traceResidue * 0.20);
}

/**
 * Derive replayCoReturn from repeated flow paths and trace state.
 * Measures: multiple paths weakly returning together in quiet/replay conditions.
 */
function deriveReplayCoReturn(
  repeatedFlowPaths: RepeatedFlowPathObservationState | null,
  trace: TraceState | null | undefined,
): number {
  let rfpReplay = 0;
  if (repeatedFlowPaths && repeatedFlowPaths.candidates.length > 0) {
    const recurrentPaths = repeatedFlowPaths.candidates.filter((c) => c.recurrenceStrength > 0.3);
    if (recurrentPaths.length > 0) {
      rfpReplay = safeAverage(recurrentPaths.map((c) => c.replayAffinity));
    }
  }

  const traceReplay = clamp01(
    (trace?.replayReadiness ?? 0) * (1 - clamp01(trace?.replaySuppression ?? 0.5)),
  );

  return clamp01(rfpReplay * 0.65 + traceReplay * 0.35);
}

/**
 * Derive closureCoupling from repeated flow paths, closure state, and reafference.
 * Measures: correlation with Body-World Closure return/mismatch/drift events.
 */
function deriveClosureCoupling(
  repeatedFlowPaths: RepeatedFlowPathObservationState | null,
  closure: BodyWorldClosureState | null | undefined,
  reafference: ReafferenceComparisonState | null | undefined,
): number {
  const rfpClosure = clamp01(repeatedFlowPaths?.averageClosureCoupling ?? 0);

  let closureScore = 0;
  if (closure) {
    const returnMismatch = clamp01(closure.returnMismatch ?? closure.worldMismatch ?? 0);
    const selfCausedMatch = clamp01(closure.selfCausedMatch ?? 0) * 0.4;
    const worldMismatch = clamp01(closure.worldMismatch ?? 0) * 0.3;
    const closureDrift = clamp01(closure.closureDrift ?? 0) * 0.2;
    const loopGainSat = clamp01(((closure.loopGain ?? 0) - 1.0) / 0.5) * 0.1;
    closureScore = clamp01(returnMismatch * 0.4 + selfCausedMatch + worldMismatch + closureDrift + loopGainSat);
  }

  const reafScore = clamp01(reafference?.returnMismatch ?? 0);

  if (!closure && !reafference) {
    return rfpClosure;
  }

  return clamp01(rfpClosure * 0.40 + closureScore * 0.40 + reafScore * 0.20);
}

/**
 * Derive weakPlasticity: observation of threshold proximity / resistance /
 * dissipation shifts after repetition. NOT a runtime weight change.
 */
function deriveWeakPlasticity(
  localField: LocalExcitabilityFieldState | null,
  repeatedFlowPaths: RepeatedFlowPathObservationState | null,
  mediumProfile: MediumProfileState | null | undefined,
): number {
  // From rfp candidates: average of (resistanceShift + dissipationShift) / 2
  // for paths with sufficient flowCount
  let rfpPlasticity = 0;
  if (repeatedFlowPaths && repeatedFlowPaths.candidates.length > 0) {
    const maturePaths = repeatedFlowPaths.candidates.filter((c) => c.flowCount >= 3);
    if (maturePaths.length > 0) {
      rfpPlasticity = safeAverage(
        maturePaths.map((c) => (c.resistanceShift + c.dissipationShift) / 2),
      );
    }
  }

  // From medium profile: transmission proxy as plasticity indicator
  let mediumPlasticity = 0;
  if (mediumProfile) {
    const transmissionRatio = clamp01(mediumProfile.resistance.transmissionRatio);
    const worldResistance = clamp01(mediumProfile.resistance.worldResistance);
    mediumPlasticity = clamp01((1 - worldResistance) * transmissionRatio);
  }

  // From local field: averageThresholdProximity as near-threshold state indicator
  const fieldProximity = clamp01(localField?.averageThresholdProximity ?? 0);

  return clamp01(rfpPlasticity * 0.50 + mediumPlasticity * 0.25 + fieldProximity * 0.25);
}

/**
 * Compute the composite confidence from all 7 component scores.
 */
function computeNetworkConfidence(components: {
  coActivationStrength: number;
  propagationStrength: number;
  recurrenceStrength: number;
  traceCorrelation: number;
  replayCoReturn: number;
  closureCoupling: number;
  weakPlasticity: number;
}): number {
  return clamp01(
    0.18 * components.coActivationStrength +
    0.16 * components.propagationStrength +
    0.16 * components.recurrenceStrength +
    0.14 * components.traceCorrelation +
    0.14 * components.replayCoReturn +
    0.14 * components.closureCoupling +
    0.08 * components.weakPlasticity,
  );
}

/**
 * Count how many component scores exceed the condition threshold.
 */
function countSatisfiedConditions(components: {
  coActivationStrength: number;
  propagationStrength: number;
  recurrenceStrength: number;
  traceCorrelation: number;
  replayCoReturn: number;
  closureCoupling: number;
  weakPlasticity: number;
}): number {
  let count = 0;
  if (components.coActivationStrength > CONDITION_THRESHOLD) count++;
  if (components.propagationStrength > CONDITION_THRESHOLD) count++;
  if (components.recurrenceStrength > CONDITION_THRESHOLD) count++;
  if (components.traceCorrelation > CONDITION_THRESHOLD) count++;
  if (components.replayCoReturn > CONDITION_THRESHOLD) count++;
  if (components.closureCoupling > CONDITION_THRESHOLD) count++;
  if (components.weakPlasticity > CONDITION_THRESHOLD) count++;
  return count;
}

/**
 * Compute overall observation confidence from data availability.
 */
function computeObservationConfidence(params: {
  localField: LocalExcitabilityFieldState | null;
  repeatedFlowPaths: RepeatedFlowPathObservationState | null;
  protoNeuronObservation?: ProtoNeuronObservationState | null;
  trace?: TraceState | null;
  mediumProfile?: MediumProfileState | null;
  closure?: BodyWorldClosureState | null;
  reafference?: ReafferenceComparisonState | null;
  viability?: DynamicViabilityState | null;
}): number {
  const hasLocalField = params.localField != null ? 0.20 : 0;
  const hasRfp = params.repeatedFlowPaths != null ? 0.25 : 0;
  const hasTrace = params.trace != null ? 0.15 : 0;
  const hasClosure = params.closure != null ? 0.12 : 0;
  const hasViability = params.viability != null ? 0.10 : 0;
  const hasMedium = params.mediumProfile != null ? 0.08 : 0;
  const hasReafference = params.reafference != null ? 0.05 : 0;
  const hasProtoNeuron = params.protoNeuronObservation != null ? 0.05 : 0;

  const base = clamp01(hasLocalField + hasRfp + hasTrace + hasClosure + hasViability + hasMedium + hasReafference + hasProtoNeuron);

  // Bonus if rfp observation confidence is strong
  const rfpBonus = (params.repeatedFlowPaths?.observationConfidence ?? 0) > 0.4 ? 0.05 : 0;

  return clamp01(base + rfpBonus);
}

// ---------------------------------------------------------------------------
// Candidate formation
// ---------------------------------------------------------------------------

/**
 * Group repeated flow path candidates into potential network groups.
 * Groups paths that share a common region (regionId overlap).
 * Returns groups of 2+ paths.
 */
function groupPathCandidates(
  candidates: RepeatedFlowPathCandidate[],
): RepeatedFlowPathCandidate[][] {
  if (candidates.length < 2) return [];

  // Simple grouping: find pairs/groups that share at least one region
  const groups: RepeatedFlowPathCandidate[][] = [];
  const used = new Set<string>();

  for (let i = 0; i < candidates.length; i++) {
    if (used.has(candidates[i].id)) continue;

    const group: RepeatedFlowPathCandidate[] = [candidates[i]];
    used.add(candidates[i].id);

    for (let j = i + 1; j < candidates.length; j++) {
      if (used.has(candidates[j].id)) continue;

      const ci = candidates[i];
      const cj = candidates[j];

      // Check for region overlap (shared fromRegion or toRegion)
      const hasOverlap =
        ci.fromRegionId === cj.fromRegionId ||
        ci.fromRegionId === cj.toRegionId ||
        ci.toRegionId === cj.fromRegionId ||
        ci.toRegionId === cj.toRegionId;

      if (hasOverlap) {
        group.push(cj);
        used.add(cj.id);
      }
    }

    if (group.length >= 2) {
      groups.push(group);
    }
  }

  return groups;
}

/**
 * Form a network candidate ID from a group of paths and current tick.
 */
function formCandidateId(
  regionIds: string[],
  tick: number,
): string {
  const sorted = [...regionIds].sort();
  const regionA = sorted[0] ?? 'r0';
  const regionB = sorted[sorted.length - 1] ?? 'r1';
  return `nc-${regionA}-${regionB}-${tick}`;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export interface DeriveProtoNetworkCandidatesParams {
  /** Current local excitability field — primary activation source */
  localField: LocalExcitabilityFieldState | null;
  /** Repeated flow path observation — S6 output, primary evidence source */
  repeatedFlowPaths: RepeatedFlowPathObservationState | null;
  /** Proto-neuron observation — supplemental evidence */
  protoNeuronObservation?: ProtoNeuronObservationState | null;
  /** Trace state — source of recurrenceWeight, replayReadiness, salienceResidue */
  trace?: TraceState | null;
  /** Medium profile — source of resistance, dissipation, transmission */
  mediumProfile?: MediumProfileState | null;
  /** Body-World Closure state — source of closure coupling metrics */
  closure?: BodyWorldClosureState | null;
  /** Reafference comparison — additional closure coupling evidence */
  reafference?: ReafferenceComparisonState | null;
  /** Dynamic viability — supplemental evidence */
  viability?: DynamicViabilityState | null;
  /** Previous observation state — used for candidate carryover across frames */
  previousObservation?: ProtoNetworkObservationState | null;
  /** Time step in seconds */
  dt: number;
}

/**
 * Derive Proto-Network Candidate Observation State from available upstream state.
 *
 * This is a read-only, observer-side pure function. It does not modify any
 * input state. All returned values are in [0, 1] with no NaN or Infinity.
 *
 * Network candidates are pre-semantic observation records, NOT:
 * - Runtime edges or graph nodes
 * - Semantic networks or concept graphs
 * - Memory structures or knowledge graphs
 * - Directed edge sets or relation maps
 * - Proto-network edges or LLM-teacher constructs
 *
 * The function detects groups of co-activating / co-recurrent path candidates
 * from S6 RepeatedFlowPaths and tracks their recurrence across frames via
 * the previousObservation parameter.
 */
export function deriveProtoNetworkCandidates(
  params: DeriveProtoNetworkCandidatesParams,
): ProtoNetworkObservationState {
  const { localField, repeatedFlowPaths, trace, mediumProfile, closure, reafference, previousObservation } = params;
  const timestamp = localField?.timestamp ?? repeatedFlowPaths?.timestamp ?? 0;
  const tick = timestamp;

  const observationConfidence = computeObservationConfidence(params);

  // Guard: if no rfp state, return minimal observation
  if (!repeatedFlowPaths) {
    const prevDecayed: ProtoNetworkCandidate[] = (previousObservation?.candidates ?? [])
      .map((c) => ({ ...c, confidence: clamp01(c.confidence * PREV_CONFIDENCE_DECAY) }))
      .filter((c) => c.confidence > 0.05);

    const activeCount = prevDecayed.length;
    return {
      timestamp,
      networkCandidateCount: activeCount,
      stableNetworkCandidateCount: prevDecayed.filter((c) => c.confidence >= STABLE_CONFIDENCE_THRESHOLD).length,
      averageConfidence: safeAverage(prevDecayed.map((c) => c.confidence)),
      maxConfidence: activeCount > 0 ? clamp01(Math.max(...prevDecayed.map((c) => c.confidence))) : 0,
      averageCoActivation: safeAverage(prevDecayed.map((c) => c.coActivationStrength)),
      averagePropagation: safeAverage(prevDecayed.map((c) => c.propagationStrength)),
      averageRecurrence: safeAverage(prevDecayed.map((c) => c.recurrenceStrength)),
      averageTraceCorrelation: safeAverage(prevDecayed.map((c) => c.traceCorrelation)),
      averageReplayCoReturn: safeAverage(prevDecayed.map((c) => c.replayCoReturn)),
      averageClosureCoupling: safeAverage(prevDecayed.map((c) => c.closureCoupling)),
      candidates: prevDecayed.slice(0, MAX_CANDIDATES),
      observationConfidence,
    };
  }

  // -------------------------------------------------------------------------
  // Derive global component scores
  // -------------------------------------------------------------------------
  const globalCoActivation = deriveCoActivationStrength(localField, repeatedFlowPaths);
  const globalPropagation = derivePropagationStrength(localField, repeatedFlowPaths);
  const globalRecurrence = deriveRecurrenceStrength(repeatedFlowPaths, trace);
  const globalTraceCorrelation = deriveTraceCorrelation(localField, repeatedFlowPaths, trace);
  const globalReplayCoReturn = deriveReplayCoReturn(repeatedFlowPaths, trace);
  const globalClosureCoupling = deriveClosureCoupling(repeatedFlowPaths, closure, reafference);
  const globalWeakPlasticity = deriveWeakPlasticity(localField, repeatedFlowPaths, mediumProfile);

  // -------------------------------------------------------------------------
  // Group path candidates into potential network groups
  // -------------------------------------------------------------------------
  const pathGroups = groupPathCandidates(repeatedFlowPaths.candidates);

  // -------------------------------------------------------------------------
  // Form new candidates from groups
  // -------------------------------------------------------------------------
  const newCandidates: ProtoNetworkCandidate[] = [];

  for (const group of pathGroups) {
    // Collect unique region IDs in this group
    const regionIdSet = new Set<string>();
    for (const path of group) {
      regionIdSet.add(path.fromRegionId);
      regionIdSet.add(path.toRegionId);
    }
    const regionIds = [...regionIdSet];
    const pathCandidateIds = group.map((p) => p.id);

    // Compute group-specific component scores
    const coActivationStrength = clamp01(
      globalCoActivation * 0.6 +
      safeAverage(group.map((p) => (p.recurrenceStrength + p.propagationConsistency) / 2)) * 0.4,
    );

    const propagationStrength = clamp01(
      globalPropagation * 0.5 +
      safeAverage(group.map((p) => p.propagationConsistency)) * 0.5,
    );

    const recurrenceStrength = clamp01(
      globalRecurrence * 0.5 +
      safeAverage(group.map((p) => p.recurrenceStrength)) * 0.5,
    );

    const traceCorrelation = clamp01(
      globalTraceCorrelation * 0.5 +
      safeAverage(group.map((p) => p.traceSupport)) * 0.5,
    );

    const replayCoReturn = clamp01(
      globalReplayCoReturn * 0.5 +
      safeAverage(group.map((p) => p.replayAffinity)) * 0.5,
    );

    const closureCoupling = clamp01(
      globalClosureCoupling * 0.5 +
      safeAverage(group.map((p) => p.closureCoupling)) * 0.5,
    );

    const weakPlasticity = clamp01(
      globalWeakPlasticity * 0.5 +
      safeAverage(group.map((p) => (p.resistanceShift + p.dissipationShift) / 2)) * 0.5,
    );

    const components = {
      coActivationStrength,
      propagationStrength,
      recurrenceStrength,
      traceCorrelation,
      replayCoReturn,
      closureCoupling,
      weakPlasticity,
    };

    // Conservative multi-condition rule: at least MIN_CANDIDATE_CONDITIONS satisfied
    const satisfiedCount = countSatisfiedConditions(components);
    if (satisfiedCount < MIN_CANDIDATE_CONDITIONS) continue;

    const confidence = computeNetworkConfidence(components);

    // Find dominant path (highest confidence S6 path in group)
    const dominantPath = group.reduce(
      (best, p) => (p.confidence > best.confidence ? p : best),
      group[0],
    );

    const averageDelayConsistency = safeAverage(
      group.map((p) => p.delayConsistency),
    );

    const id = formCandidateId(regionIds, tick);

    newCandidates.push({
      id,
      timestamp,
      regionIds,
      pathCandidateIds,
      coActivationStrength,
      propagationStrength,
      recurrenceStrength,
      traceCorrelation,
      replayCoReturn,
      closureCoupling,
      weakPlasticity,
      confidence,
      lifetimeTicks: 1,
      lastSeenTick: tick,
      networkStability: confidence,
      networkDecay: 0.08,
      dominantPathId: dominantPath?.id ?? null,
      averageDelayConsistency,
    });
  }

  // -------------------------------------------------------------------------
  // Carry forward and decay previous candidates
  // -------------------------------------------------------------------------
  const prevCandidateMap = new Map<string, ProtoNetworkCandidate>(
    (previousObservation?.candidates ?? []).map((c) => [c.id, c]),
  );

  const newCandidateIds = new Set(newCandidates.map((c) => c.id));

  const carriedForward: ProtoNetworkCandidate[] = [];
  for (const [id, prev] of prevCandidateMap.entries()) {
    if (newCandidateIds.has(id)) continue; // already in new list

    const decayedConfidence = clamp01(prev.confidence * PREV_CONFIDENCE_DECAY);
    if (decayedConfidence <= 0.05) continue; // prune

    carriedForward.push({
      ...prev,
      timestamp,
      confidence: decayedConfidence,
      networkStability: clamp01((prev.networkStability ?? prev.confidence) * PREV_CONFIDENCE_DECAY),
      lifetimeTicks: (prev.lifetimeTicks ?? 0) + 1,
    });
  }

  // Update lifetimeTicks for new candidates that match a previous one
  const updatedNewCandidates = newCandidates.map((c) => {
    const prev = prevCandidateMap.get(c.id);
    if (prev) {
      return {
        ...c,
        lifetimeTicks: (prev.lifetimeTicks ?? 0) + 1,
        networkStability: clamp01(
          (prev.networkStability ?? prev.confidence) * 0.7 + c.confidence * 0.3,
        ),
      };
    }
    return c;
  });

  // Merge: prefer new candidates over carried forward if same ID
  const allCandidates = [...updatedNewCandidates, ...carriedForward];

  // Sort by confidence descending, cap at MAX_CANDIDATES
  allCandidates.sort((a, b) => b.confidence - a.confidence);
  const finalCandidates = allCandidates.slice(0, MAX_CANDIDATES);

  // -------------------------------------------------------------------------
  // Aggregate state
  // -------------------------------------------------------------------------
  const networkCandidateCount = finalCandidates.length;
  const stableNetworkCandidateCount = finalCandidates.filter(
    (c) => c.confidence >= STABLE_CONFIDENCE_THRESHOLD,
  ).length;

  const confidenceValues = finalCandidates.map((c) => c.confidence);
  const averageConfidence = safeAverage(confidenceValues);
  const maxConfidence = networkCandidateCount > 0
    ? clamp01(Math.max(...confidenceValues))
    : 0;

  const averageCoActivation = safeAverage(finalCandidates.map((c) => c.coActivationStrength));
  const averagePropagation = safeAverage(finalCandidates.map((c) => c.propagationStrength));
  const averageRecurrence = safeAverage(finalCandidates.map((c) => c.recurrenceStrength));
  const averageTraceCorrelation = safeAverage(finalCandidates.map((c) => c.traceCorrelation));
  const averageReplayCoReturn = safeAverage(finalCandidates.map((c) => c.replayCoReturn));
  const averageClosureCoupling = safeAverage(finalCandidates.map((c) => c.closureCoupling));

  return {
    timestamp,
    networkCandidateCount,
    stableNetworkCandidateCount,
    averageConfidence,
    maxConfidence,
    averageCoActivation,
    averagePropagation,
    averageRecurrence,
    averageTraceCorrelation,
    averageReplayCoReturn,
    averageClosureCoupling,
    candidates: finalCandidates,
    observationConfidence,
  };
}
