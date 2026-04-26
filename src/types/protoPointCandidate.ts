/**
 * Proto-Point Candidate
 *
 * AETERNA Phase 7: proto-point の観測導入
 *
 * A ProtoPointCandidate is an observer-side record of a field region that
 * has naturally accumulated multiple structural observation criteria:
 * recurrence, trace persistence, replay affinity, local contrast, and
 * knot/basin overlap.
 *
 * Critical design constraints:
 * - This is NOT a semantic node, object label, or concept.
 * - This is NOT a runtime node or memory item.
 * - No label or meaning is attached.
 * - This is observation-only: it does NOT feed back into organism core dynamics.
 * - Candidates are not pre-placed; they emerge when conditions are met.
 * - Node bridge (Phase 8+) is explicitly out of scope.
 *
 * All numeric scores are derived/proxy values, not confirmed measurements.
 */

/**
 * Observer-side lifecycle stage of a proto-point candidate.
 * Lifecycle is observer-side only — it does NOT affect organism runtime behavior.
 */
export type ProtoPointCandidateLifecycle = 'new' | 'recurring' | 'persistent' | 'decaying';

export interface ProtoPointCandidate {
  /** Stable observer-side ID for this candidate slot */
  id: string;

  /** Observation timestamp (frame tick) */
  timestamp: number;

  /**
   * Proxy region identifier on the torus life-field.
   * NOT a semantic label — a rough locality tag derived from which signals dominate.
   * e.g. "proxy-recurrence-dominant", "proxy-basin-dominant", "proxy-anomaly-dominant"
   */
  regionId: string | null;

  /**
   * How many consecutive ticks this candidate has been observed above threshold.
   * Observer-side persistence counter only.
   */
  persistence: number;

  /**
   * How much this region repeatedly re-activates across events.
   * Derived from recurrenceWeight and recentPatternWeight. Range 0–1.
   * [PROXY]
   */
  recurrenceScore: number;

  /**
   * How much this region overlaps with trace/residue patterns.
   * Derived from traceStrength and salienceResidue. Range 0–1.
   * [PROXY]
   */
  traceAffinity: number;

  /**
   * How replay-accessible this region appears to be.
   * Derived from replayReadiness, recentReplaySalience, consolidationGain. Range 0–1.
   * [PROXY]
   */
  replayAffinity: number;

  /**
   * How much this region stands out from its ambient field context.
   * Derived from activity vs baseline margin and salienceResidue elevation. Range 0–1.
   * [PROXY]
   */
  localContrast: number;

  /**
   * Overlap with basin candidates from Phase 5 observation layer.
   * Derived from basinCount, stabilizationPull, restorationBias. Range 0–1.
   * [PROXY]
   */
  basinOverlap: number;

  /**
   * Overlap with knot candidates from Phase 5 observation layer.
   * Derived from knotCount, recurrenceWeight. Range 0–1.
   * [PROXY]
   */
  knotOverlap: number;

  /**
   * Composite observer confidence that this is a proto-point candidate.
   * Derived from weighted combination of all sub-scores.
   * Range 0–1. Conservative threshold applied before inclusion.
   * [DERIVED/PROXY — not a probability]
   */
  confidence: number;

  /**
   * How many ticks this candidate has been observed in total (since first seen).
   * Observer-side lifetime counter only.
   */
  lifetimeTicks?: number;

  /**
   * Last tick this candidate was above the confidence threshold.
   * Observer-side tracking only.
   */
  lastSeenTick?: number;

  /**
   * Composite stability proxy: persistence × confidence.
   * Higher values indicate candidate has been consistently above threshold.
   * [DERIVED/PROXY]
   */
  stabilityScore?: number;

  /**
   * Overlap with long-lived anomaly candidates from Phase 5 observation layer.
   * Derived from longLivedAnomalyCount, salienceResidue. Range 0–1.
   * [PROXY]
   */
  anomalyOverlap?: number;

  /**
   * Observer-side lifecycle stage.
   * Does NOT affect organism runtime behavior.
   */
  lifecycle: ProtoPointCandidateLifecycle;
}
