/**
 * Vortex Pair Candidate Types
 *
 * N3: Curvature × Vortex Coupling
 *
 * A vortex pair candidate is an observer-side record of a positively-charged
 * and a negatively-charged vortex candidate that appear in close proximity on
 * the torus grid.
 *
 * Guardrails:
 * - vortex pairs are geometric / topological observer records only.
 * - They are NOT semantic pairs, memory associations, or relation edges.
 * - They are NOT connected to runtime feedback or weak plasticity.
 * - They carry no emotional, intentional, or consciousness meaning.
 */

export interface VortexPairCandidate {
  /** Unique pair identifier, e.g. `pair-<posId>-<negId>-<timestamp>`. */
  id: string;
  /** Timestamp at which this pair was observed. */
  timestamp: number;
  /** ID of the positive-charge vortex candidate. */
  positiveVortexId: string;
  /** ID of the negative-charge vortex candidate. */
  negativeVortexId: string;
  /** Grid distance between the two candidate cells. */
  distance: number;
  /** Mean of the two candidates' confidence values. */
  averageConfidence: number;
  /**
   * Estimated pair lifetime in ticks.
   * In N3 this is derived from the shorter of the two candidate lifetimes.
   */
  estimatedLifetime: number;
  /** Confidence that this is a genuine pair, not a coincidental pairing [0,1]. */
  confidence: number;
}
