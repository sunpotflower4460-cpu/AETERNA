/**
 * Closed-Loop Scenario Summary
 *
 * W8: Closed-Loop Scenario Tests
 *
 * Summary type for Body-World Closure integration scenarios.
 * Records aggregate metrics across a full scenario run spanning W1–W7 elements.
 *
 * This is NOT a proof of consciousness, self-awareness, or intelligence.
 * It is a research-diagnostic summary of how strongly AETERNA's body-world
 * closed loop is functioning under a given scenario condition.
 *
 * Classification note:
 * - Measured: directly observable counts or values from the run
 * - Derived: computed from measured values
 * - Proxy: indirect indicator, not a direct measure
 */

export interface ClosedLoopScenarioSummary {
  /** Scenario identifier — research label, not a semantic claim */
  scenarioName: string;

  /** Total ticks executed in this scenario run */
  ticks: number;

  /** Number of Actuation Pulses emitted during the run (Measured) */
  pulseCount: number;

  /** Number of Sensory Return packets received during the run (Measured) */
  sensoryReturnCount: number;

  /** Number of Reafference Comparison frames computed (Measured) */
  reafferenceCount: number;

  /**
   * Average loopGain across all closure frames (Derived).
   * > 1.0 = amplification risk; < 1.0 = attenuation; ≈ 1.0 = balanced loop.
   */
  averageLoopGain: number;

  /**
   * Average closureStability across all closure frames (Derived).
   * Higher = more sustained, stable closed-loop operation.
   */
  averageClosureStability: number;

  /**
   * Average closureDrift across all closure frames (Derived).
   * Higher = more drift / loop variation over time.
   */
  averageClosureDrift: number;

  /**
   * Maximum feedbackSaturationRisk observed in any frame (Proxy).
   * High value indicates potential for runaway feedback.
   */
  maxFeedbackSaturationRisk: number;

  /** Total proto-neuron candidates observed across the run (Measured) */
  protoNeuronCandidateCount: number;

  /**
   * Count of stable proto-neuron candidates (stabilizing + persistent lifecycle) (Measured).
   * Candidates remain observer-side only — no runtime neuron node is placed.
   */
  stableProtoNeuronCandidateCount: number;

  /**
   * Average confidence of proto-neuron candidates across the run (Derived).
   * Confidence is a proxy score, not a certainty claim.
   */
  averageProtoNeuronConfidence: number;

  /**
   * Count of frames where semantic leak was detected (Measured).
   * Must be 0 in all valid runs — semantic fields are forbidden.
   */
  semanticLeakCount: number;

  /**
   * Count of frames where NaN or Infinity was detected in any metric (Measured).
   * Must be 0 in all valid runs.
   */
  nanOrInfinityCount: number;

  // --- Optional extended metrics ---

  /**
   * Count of Sensory Returns that arrived with no prior pulse (Measured).
   * Proxy for world-only / external perturbation returns.
   */
  worldOnlyReturnCount?: number;

  /**
   * Count of Sensory Returns where selfCausedMatch was above threshold (Measured).
   * Proxy for self-matched loop closure events.
   */
  selfMatchedReturnCount?: number;

  /**
   * Count of Sensory Returns with ambiguous attribution (Measured).
   * Frames where unresolvedReturn > 0.4.
   */
  unresolvedReturnCount?: number;

  /**
   * Average roundTripDelay across all closure frames (Derived).
   * Higher = longer delay between pulse and return.
   */
  averageRoundTripDelay?: number;

  /**
   * Count of closure frames where closureStability fell below 0.25 (Derived).
   * Proxy for loop failure events.
   */
  closureFailureCount?: number;

  /**
   * Average selfCausedMatch across reafference frames (Derived).
   * Proxy for how often AETERNA's pulse corresponded to a matched return.
   */
  averageSelfCausedMatch?: number;

  /**
   * Average worldCausedDifference across reafference frames (Derived).
   * Proxy for how often world-side dynamics contributed independent returns.
   */
  averageWorldCausedDifference?: number;

  /**
   * Average closureCoupling of proto-neuron candidates (Derived).
   * Proxy for how strongly candidates were linked to the closed loop.
   */
  averageClosureCoupling?: number;
}
