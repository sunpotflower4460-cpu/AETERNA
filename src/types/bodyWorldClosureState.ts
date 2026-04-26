/**
 * Body-World Closure State
 *
 * W6: Body-World Closure Metrics
 *
 * Observer-side proxy metrics describing how strongly AETERNA's actuation is
 * closing through the simulated world and returning as sensory feedback.
 */
export interface BodyWorldClosureState {
  timestamp: number;
  loopGain: number;
  roundTripDelay: number;
  returnStrength: number;
  selfCausedMatch: number;
  worldMismatch: number;
  closureStability: number;
  closureDrift: number;
  unresolvedReturn: number;
  feedbackSaturationRisk: number;
  comparisonConfidence?: number;
  returnMismatch?: number;
}
