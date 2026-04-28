/**
 * Long-Run Natural Emergence Scenario Summary
 *
 * S8: Long-Run Natural Emergence Scenarios
 *
 * Summary type for long-run natural emergence integration scenarios.
 * Records aggregate metrics across a full long-run scenario spanning S0–S7 elements.
 *
 * This is NOT a proof of consciousness, self-awareness, life, or intelligence.
 * It is a research-diagnostic summary of how flow / resistance / dissipation /
 * delay / boundary exchange / local excitability / repeated flow path /
 * proto-network candidate behave under various long-run conditions.
 *
 * Classification note:
 * - Measured: directly observable counts or values from the run
 * - Derived: computed from measured values
 * - Proxy: indirect indicator, not a direct measure
 */

export interface LongRunEmergenceScenarioSummary {
  /** Scenario identifier — research label, not a semantic claim */
  scenarioName: string;

  /** Total ticks executed in this scenario run */
  ticks: number;

  /** Duration of the run in milliseconds (Measured) */
  durationMs: number;

  /**
   * Average flowContinuity across all ticks (Derived).
   * Higher = flow did not collapse over the run.
   */
  averageFlowContinuity: number;

  /**
   * Average energyThroughput across all ticks (Derived).
   */
  averageEnergyThroughput: number;

  /**
   * Average dissipationBalance across all ticks (Derived).
   */
  averageDissipationBalance: number;

  /**
   * Average resistanceBalance across all ticks (Derived).
   */
  averageResistanceBalance: number;

  /**
   * Average delayCoherence across all ticks (Derived).
   */
  averageDelayCoherence: number;

  /**
   * Average boundaryExchange across all ticks (Derived).
   */
  averageBoundaryExchange: number;

  /**
   * Maximum saturationRisk observed in any tick (Proxy).
   */
  maxSaturationRisk: number;

  /**
   * Maximum extinctionRisk observed in any tick (Proxy).
   */
  maxExtinctionRisk: number;

  /**
   * Maximum feedbackDominanceRisk observed in any tick (Proxy).
   */
  maxFeedbackDominanceRisk: number;

  /**
   * Average echo strength across all ticks (Derived).
   */
  averageEchoStrength: number;

  /**
   * Average returnDelay across all ticks (Derived).
   */
  averageReturnDelay: number;

  /**
   * Average transmissionRatio across all ticks (Derived).
   */
  averageTransmissionRatio: number;

  /**
   * Number of ticks where highExcitabilityRegionCount > 0 (Measured).
   */
  highExcitabilityRegionCount: number;

  /**
   * Total repeated flow path candidates observed across the run (Measured).
   * Observer-side only — no runtime edges created.
   */
  repeatedFlowPathCandidateCount: number;

  /**
   * Total proto-network candidates observed across the run (Measured).
   * Observer-side only — no runtime edges created.
   */
  protoNetworkCandidateCount: number;

  /**
   * Count of stable path candidates (Measured).
   */
  stablePathCandidateCount: number;

  /**
   * Count of stable proto-network candidates (Measured).
   */
  stableProtoNetworkCandidateCount: number;

  /**
   * Count of frames where semantic leak was detected (Measured).
   * Must be 0 in all valid runs.
   */
  semanticLeakCount: number;

  /**
   * Count of frames where NaN or Infinity was detected in any metric (Measured).
   * Must be 0 in all valid runs.
   */
  nanOrInfinityCount: number;

  // --- Optional extended metrics ---

  /** Average proto-network candidate confidence (Derived, optional) */
  averageProtoNetworkConfidence?: number;

  /** Maximum proto-network candidate confidence (Derived, optional) */
  maxProtoNetworkConfidence?: number;

  /** Average closureCoupling across proto-network candidates (Derived, optional) */
  averageClosureCoupling?: number;

  /** Count of emergence-like events (e.g., new high-stability candidates) (Measured, optional) */
  emergenceEventCount?: number;

  /** Count of collapse events (e.g., flowContinuity < 0.1) (Measured, optional) */
  collapseEventCount?: number;

  /** Count of recovery events (following a collapse) (Measured, optional) */
  recoveryEventCount?: number;
}
