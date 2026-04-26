/**
 * Observation Pattern State
 *
 * Phase 5: Observation Layer Purification
 *
 * ObservationPatternState holds observer-side derived counts of structural
 * candidates that appear naturally in the life-field. These are NOT semantic
 * labels or nodes. They are rough proxy counts derived from existing state
 * for research observation only.
 *
 * Important:
 * - These are observer-side vocabulary, not runtime decision inputs.
 * - Counts are rough proxies, not proofs of the named structures.
 * - proto-point candidate ≠ semantic node; no label is attached.
 * - This type must never be used to drive organism core behavior.
 */
export interface ObservationPatternState {
  /** Frame timestamp */
  timestamp: number;

  /**
   * Knot count (proxy):
   * Locally recurring activity clusters — field knots that rise repeatedly.
   * Derived from recurrenceWeight and replayReadiness.
   */
  knotCount: number;

  /**
   * Path count (proxy):
   * Flow-path candidates — channels where activity consistently propagates.
   * Derived from replay salience and repeated perturbation direction.
   */
  pathCount: number;

  /**
   * Recurrence locus count (proxy):
   * Areas that re-activate across multiple events or quiet periods.
   * Derived from recurrenceWeight and recentPatternWeight.
   */
  recurrenceLocusCount: number;

  /**
   * Basin count (proxy):
   * Stable-return zones — field regions the system tends to recover toward.
   * Derived from stabilizationPull and restorationBias correlation.
   */
  basinCount: number;

  /**
   * Long-lived anomaly count (proxy):
   * Persistent deviations that survive recovery and remain above baseline.
   * Derived from sustained salienceResidue and mismatch level.
   */
  longLivedAnomalyCount: number;

  /**
   * Proto-point candidate count (proxy):
   * Field nodes that naturally accumulate multiple observation criteria.
   * Not a semantic node. Not labeled. Not passed to any teacher.
   * Derived from combination of knot + recurrence + basin + persistence.
   */
  protoPointCandidateCount: number;

  /**
   * Collapse profile count (proxy):
   * Number of distinct collapse patterns observable in this window.
   * Derived from collapseRisk trajectory variation.
   */
  collapseProfileCount?: number;

  /**
   * Recovery profile count (proxy):
   * Number of distinct recovery patterns observable in this window.
   * Derived from recoveryPressure and trajectory diversity.
   */
  recoveryProfileCount?: number;

  /**
   * Stable attractor candidate count (proxy):
   * Regions the field repeatedly returns to after perturbation.
   * Derived from basin + recovery correlation.
   */
  stableAttractorCandidateCount?: number;

  /**
   * Observation confidence (proxy):
   * How reliable the current observation window is.
   * Not a proof — a rough signal quality estimate.
   * Range 0–1; 1 = high recent activity + stable history available.
   */
  observationConfidence?: number;
}
