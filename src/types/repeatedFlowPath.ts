/**
 * Repeated Flow Path Types
 *
 * S6: Path Formation by Repeated Flow
 *
 * These types describe observer-side, pre-semantic path candidates that emerge
 * when the same region-pair activation sequence is observed repeatedly. They
 * are NOT semantic relations, memory routes, or meaning links.
 *
 * Design principles:
 * - Observer-side only; no runtime edges or path weights are created.
 * - All values are continuous, typically in [0, 1] range.
 * - No NaN or Infinity values permitted.
 * - No semantic interpretation (no label, meaning, concept, category, sameObject,
 *   teacherBinding, LLM teacher, same-object detection, relation, memory path).
 * - fromRegionId / toRegionId are spatial coordinates, not semantic labels.
 * - A high confidence value means the flow candidate is robustly observed,
 *   NOT that it carries semantic meaning.
 * - Repeated flow path candidates are the pre-condition for S7 Proto-Network
 *   Candidate Observation; they are not proto-network edges.
 *
 * Future phases:
 * - S7: Proto-Network Candidate Observation (uses repeated flow path candidates
 *   as observation scaffolding)
 */

/**
 * RepeatedFlowPathCandidate describes a single observed repeated-flow path
 * candidate between two coarse torus regions. It is an observer-side record
 * of statistical flow history, not a semantic or causal link.
 */
export interface RepeatedFlowPathCandidate {
  /** Unique identifier for this path candidate, e.g. "u0-v0->u1-v1" */
  id: string;

  /** Frame timestamp when this candidate was last updated */
  timestamp: number;

  /** Source coarse region identifier. Coordinate notation only, not semantic label. */
  fromRegionId: string;

  /** Target coarse region identifier. Coordinate notation only, not semantic label. */
  toRegionId: string;

  /**
   * Number of times this region pair has been observed in sequential activation.
   * NOT a learning counter; raw observation count only.
   * This is the primary driver of recurrenceStrength.
   */
  flowCount: number;

  /**
   * How strongly this same flow pattern has recurred.
   * Derived from flowCount. Saturates toward 1.0 as flowCount grows.
   * Range: 0–1. Does NOT imply learning or memory.
   */
  recurrenceStrength: number;

  /**
   * How consistently activation propagates from fromRegion to toRegion.
   * Derived from propagationTendency values of the source region over time.
   * Range: 0–1.
   */
  propagationConsistency: number;

  /**
   * How stable the activation delay between fromRegion and toRegion has been.
   * Derived from medium delay profile and viability delayCoherence.
   * Range: 0–1. High = consistent delay window; low = erratic.
   */
  delayConsistency: number;

  /**
   * How much trace/residue is observed in the toRegion after this flow.
   * Derived from traceResidue of the target region cell.
   * Range: 0–1. NOT semantic memory residue.
   */
  traceSupport: number;

  /**
   * Observed change in localResistance on this region pair compared to baseline.
   * Positive = resistance appears lower on this path (more permeable condition).
   * This is purely an observation of medium conditions, NOT path reinforcement.
   * Range: 0–1 (magnitude of observed shift).
   */
  resistanceShift: number;

  /**
   * Observed change in localDissipation on this region pair compared to baseline.
   * Positive = dissipation appears lower on this path (trace persists longer).
   * Observer-only; does NOT imply modifying the medium.
   * Range: 0–1 (magnitude of observed shift).
   */
  dissipationShift: number;

  /**
   * Proxy for how often this pair reactivates during quiet / low-perturbation
   * conditions where replay readiness is elevated.
   * NOT "memory replay" — a flow-residue re-occurrence proxy.
   * Range: 0–1.
   */
  replayAffinity: number;

  /**
   * How much this path candidate co-occurs with Body-World Closure events:
   * returnMismatch, selfCausedMatch, closureDrift, worldMismatch.
   * Indicates that world-loop return may influence local flow patterns on this path.
   * NOT a semantic "the world caused this" claim.
   * Range: 0–1.
   */
  closureCoupling: number;

  /**
   * Composite observation confidence for this path candidate.
   * Weighted combination of recurrenceStrength, propagationConsistency,
   * delayConsistency, traceSupport, replayAffinity, closureCoupling,
   * resistanceShift, dissipationShift.
   * HIGH confidence = robustly observed flow pattern.
   * Does NOT imply semantic meaning, memory, or causal relation.
   * Range: 0–1.
   */
  confidence: number;

  /** Frame number when this candidate was last observed active */
  lastSeenTick?: number;

  /** How many frames this candidate has been continuously present */
  lifetimeTicks?: number;

  /**
   * Average observed activation strength at fromRegion when this flow occurred.
   * Range: 0–1.
   */
  averageFlowStrength?: number;

  /**
   * Stability score: how consistently this candidate appears across frames.
   * Decays if not observed. Range: 0–1.
   */
  pathStability?: number;

  /**
   * Decay rate proxy: how quickly this candidate loses strength when not observed.
   * Range: 0–1.
   */
  pathDecay?: number;
}

/**
 * RepeatedFlowPathObservationState aggregates all currently observed
 * repeated-flow path candidates and field-level summary statistics.
 *
 * This is an observer-side, read-only snapshot. It does NOT represent
 * a proto-network, edge set, or semantic relation map.
 */
export interface RepeatedFlowPathObservationState {
  /** Frame timestamp */
  timestamp: number;

  /** Total number of path candidates currently observed */
  pathCandidateCount: number;

  /**
   * Number of path candidates with confidence >= STABLE_CONFIDENCE_THRESHOLD
   * AND flowCount >= STABLE_FLOW_COUNT_THRESHOLD.
   */
  stablePathCandidateCount: number;

  /** Mean confidence across all candidates (0 if none) */
  averageConfidence: number;

  /** Maximum confidence among all candidates (0 if none) */
  maxConfidence: number;

  /** Mean recurrenceStrength across all candidates */
  averageRecurrenceStrength: number;

  /** Mean propagationConsistency across all candidates */
  averagePropagationConsistency: number;

  /** Mean traceSupport across all candidates */
  averageTraceSupport: number;

  /** Mean closureCoupling across all candidates */
  averageClosureCoupling: number;

  /**
   * All current path candidates.
   * Sorted by confidence descending.
   * Not semantic edges; not runtime graph nodes.
   */
  candidates: RepeatedFlowPathCandidate[];

  /**
   * Overall confidence in this observation state.
   * Reflects data availability (upstream state richness).
   * Range: 0–1.
   */
  observationConfidence: number;
}
