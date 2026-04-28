/**
 * Proto-Network Candidate Types
 *
 * S7: Proto-Network Candidate Observation
 *
 * These types describe observer-side, pre-semantic network-like candidates
 * that emerge when groups of repeated-flow path candidates are observed
 * co-activating, propagating together, or recurrently appearing as a group.
 * They are NOT semantic networks, concept graphs, knowledge graphs, memory
 * graphs, or runtime edges of any kind.
 *
 * Design principles:
 * - Observer-side only; no runtime edges, graphs, or relations are created.
 * - All values are continuous, typically in [0, 1] range.
 * - No NaN or Infinity values permitted.
 * - No semantic interpretation (no label, meaning, concept, category, relation,
 *   sameObject, objectId, teacherVerdict, languageMeaning, utterance,
 *   nodeId, sharedTrunkCandidate, semanticNode, nodeBridge, llmTeacher,
 *   edge, weight, edgeId, networkEdge, pathWeight).
 * - regionIds are spatial coordinate-based identifiers, NOT semantic labels.
 *   Never use cat, memory, sadness, user, emotion, brain, neuron, meaning, label.
 * - pathCandidateIds reference S6 RepeatedFlowPathCandidate IDs; not semantic
 *   relations or directed edges.
 * - A high confidence value means the network-like pattern is robustly observed,
 *   NOT that it carries semantic meaning.
 * - Proto-network candidates are pre-semantic observations. They are not:
 *   - neural networks
 *   - knowledge graphs
 *   - semantic networks
 *   - memory structures
 *   - concept graphs
 *   - relation maps
 *
 * Future phases:
 * - S8: Long-Run Natural Emergence Scenarios (uses proto-network candidates
 *   as observation scaffolding for emergence monitoring)
 */

/**
 * ProtoNetworkCandidate describes a single observed proto-network candidate:
 * a group of co-activated / co-recurrent region/path candidates that
 * collectively exhibit network-like statistical patterns.
 *
 * This is an observer-side record only. No runtime edges or graph structures
 * are created. All fields are observation proxies, not semantic interpretations.
 */
export interface ProtoNetworkCandidate {
  /**
   * Unique identifier for this network candidate.
   * Format: "nc-{regionA}-{regionB}-{tick}"
   * nc = network candidate (observer label only, not a graph node).
   */
  id: string;

  /** Frame timestamp when this candidate was last updated. */
  timestamp: number;

  /**
   * Spatial coordinate-based region identifiers involved in this candidate.
   * NOT semantic labels. Coordinate notation only (e.g. "u0-v1").
   * Never interpreted as cat, memory, sadness, user, emotion, brain, etc.
   */
  regionIds: string[];

  /**
   * References to S6 RepeatedFlowPathCandidate IDs that form this group.
   * These are observation path IDs, NOT semantic relations, edges, or links.
   */
  pathCandidateIds: string[];

  /**
   * Strength of co-activation: multiple regions/paths activating in the
   * same time window, observed from excitability fields and path recurrence.
   * High = many of these regions/paths activate together within a frame window.
   * NOT a measure of semantic association.
   * Range: 0–1.
   */
  coActivationStrength: number;

  /**
   * Consistency of directional flow across the path group.
   * Derived from propagationConsistency of member paths and
   * averagePropagationTendency of the local field.
   * High = paths in this group consistently propagate in a similar direction/order.
   * NOT a causal or semantic claim.
   * Range: 0–1.
   */
  propagationStrength: number;

  /**
   * Repeated appearance of the same region/path groups across frames.
   * Derived from recurrenceStrength of member S6 paths and trace recurrence.
   * High = this group has been seen multiple times.
   * NOT a memory indicator.
   * Range: 0–1.
   */
  recurrenceStrength: number;

  /**
   * Trace/residue correlations observed across the regions/paths of this group.
   * Derived from traceSupport of member paths, averageTraceResidue of the
   * local field, and trace.salienceResidue.
   * High = trace/residue activity is present across multiple paths in the group.
   * NOT semantic memory residue.
   * Range: 0–1.
   */
  traceCorrelation: number;

  /**
   * Multiple paths weakly returning together in quiet/replay conditions.
   * Derived from replayAffinity of member paths and
   * trace.replayReadiness * (1 - trace.replaySuppression).
   * High = this group tends to re-appear during quiet/settling conditions.
   * NOT "memory replay" — a flow-residue co-occurrence proxy.
   * Range: 0–1.
   */
  replayCoReturn: number;

  /**
   * Correlation with Body-World Closure return/mismatch/drift events.
   * Derived from closureCoupling of member paths, closure state returnMismatch,
   * worldMismatch, closureDrift, loopGain, and reafference returnMismatch.
   * High = this group co-appears with world-loop return events.
   * NOT a semantic "the world caused this" claim.
   * Range: 0–1.
   */
  closureCoupling: number;

  /**
   * Observation of threshold proximity / local resistance / trace residue
   * shifts across the paths in this group after repeated activation.
   * This is purely an observation proxy — NOT a runtime weight change,
   * NOT a plasticity update, NOT a path reinforcement.
   * Derived from resistanceShift/dissipationShift of member paths,
   * medium profile transmissionRatio, and localField averageThresholdProximity.
   * Range: 0–1.
   */
  weakPlasticity: number;

  /**
   * Composite observation confidence for this network candidate.
   * Weighted combination of all sub-indicator scores.
   * HIGH confidence = this candidate is robustly and consistently observed.
   * Does NOT imply semantic meaning, memory, causal relation, or runtime edge.
   * Range: 0–1.
   */
  confidence: number;

  /** How many frames this candidate has been continuously present. */
  lifetimeTicks?: number;

  /** Frame number when this candidate was last observed active. */
  lastSeenTick?: number;

  /**
   * How consistently this network candidate persists across frames.
   * Decays if not observed.
   * Range: 0–1.
   */
  networkStability?: number;

  /**
   * Decay rate proxy: how quickly this candidate loses strength when not seen.
   * Range: 0–1.
   */
  networkDecay?: number;

  /**
   * The path candidate ID that contributes most to this group's signal.
   * Observer label only; not a semantic "dominant concept" or "main edge".
   * Null if no dominant path is apparent.
   */
  dominantPathId?: string | null;

  /**
   * Average delay consistency of the member path candidates.
   * From delayConsistency fields of S6 RepeatedFlowPathCandidates.
   * Range: 0–1.
   */
  averageDelayConsistency?: number;
}

/**
 * ProtoNetworkObservationState aggregates all currently observed
 * proto-network candidates and field-level summary statistics.
 *
 * This is an observer-side, read-only snapshot. It does NOT represent
 * a semantic network, graph, or relation map. No runtime edges are created.
 */
export interface ProtoNetworkObservationState {
  /** Frame timestamp. */
  timestamp: number;

  /** Total number of network candidates currently observed. */
  networkCandidateCount: number;

  /**
   * Number of candidates with confidence >= STABLE_CONFIDENCE_THRESHOLD.
   */
  stableNetworkCandidateCount: number;

  /** Mean confidence across all candidates (0 if none). */
  averageConfidence: number;

  /** Maximum confidence among all candidates (0 if none). */
  maxConfidence: number;

  /** Mean coActivationStrength across all candidates. */
  averageCoActivation: number;

  /** Mean propagationStrength across all candidates. */
  averagePropagation: number;

  /** Mean recurrenceStrength across all candidates. */
  averageRecurrence: number;

  /** Mean traceCorrelation across all candidates. */
  averageTraceCorrelation: number;

  /** Mean replayCoReturn across all candidates. */
  averageReplayCoReturn: number;

  /** Mean closureCoupling across all candidates. */
  averageClosureCoupling: number;

  /**
   * All current network candidates, sorted by confidence descending.
   * Not semantic edges; not runtime graph nodes; not concept relations.
   */
  candidates: ProtoNetworkCandidate[];

  /**
   * Overall confidence in this observation state.
   * Reflects data availability (upstream state richness), NOT semantic meaning.
   * Range: 0–1.
   */
  observationConfidence: number;
}
