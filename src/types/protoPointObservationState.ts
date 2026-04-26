/**
 * Proto-Point Observation State
 *
 * AETERNA Phase 7: proto-point の観測導入
 *
 * ProtoPointObservationState holds the full observer-side summary of
 * proto-point candidates detected in a single observation tick.
 *
 * This is the detailed observation layer for Phase 7, complementing the
 * coarse protoPointCandidateCount in ObservationPatternState (Phase 5).
 *
 * Design constraints:
 * - Observer-side only — never fed back into organism core dynamics.
 * - No semantic labels, object identifiers, or concept nodes.
 * - Candidates are observations, not runtime nodes.
 * - Node bridge (Phase 8+) is out of scope.
 * - All values are derived/proxy — not confirmed structural facts.
 */

import type { ProtoPointCandidate } from './protoPointCandidate.ts';

export interface ProtoPointObservationState {
  /** Frame timestamp */
  timestamp: number;

  /**
   * Total number of proto-point candidates observed above confidence threshold.
   * [PROXY count]
   */
  candidateCount: number;

  /**
   * Number of candidates with persistence > stability threshold and confidence > 0.40.
   * These are candidates that have been consistently observed across multiple ticks.
   * [PROXY count]
   */
  stableCandidateCount: number;

  /**
   * Mean confidence across all current candidates.
   * 0 if no candidates present.
   * [DERIVED/PROXY]
   */
  averageConfidence: number;

  /**
   * Highest confidence among current candidates.
   * 0 if no candidates present.
   * [DERIVED/PROXY]
   */
  maxConfidence: number;

  /**
   * Full list of current proto-point candidates.
   * Observer-side only. Not passed to any runtime system.
   */
  candidates: ProtoPointCandidate[];

  /**
   * Number of newly emerged candidates this tick (lifecycle === 'new').
   * [DERIVED/PROXY count]
   */
  newCandidateCount?: number;

  /**
   * Number of candidates whose confidence has dropped below the decaying threshold.
   * [DERIVED/PROXY count]
   */
  decayedCandidateCount?: number;

  /**
   * IDs of candidates currently in 'persistent' lifecycle stage.
   * Observer-side only.
   */
  persistentCandidateIds?: string[];
}
