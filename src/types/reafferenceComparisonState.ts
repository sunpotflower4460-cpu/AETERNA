/**
 * Reafference Comparison State
 *
 * W5: Reafference Comparison Introduction
 *
 * ReafferenceComparisonState represents the comparison between AETERNA's
 * Actuation Pulse (what was output) and the Sensory Return (what came back
 * from the World Medium). This is a pre-semantic comparison — NOT a linguistic
 * self-awareness or semantic "I did this" judgment.
 *
 * Design principles:
 * - Reafference Comparison is NOT self-awareness
 * - selfCausedMatch / worldCausedDifference are proxy indicators, not semantic judgments
 * - All values are continuous, typically in [0, 1] range
 * - No NaN or Infinity values permitted
 * - This is efference-copy-like comparison, but pre-semantic
 *
 * Purpose:
 * Compare:
 * - expectedReturn (derived from Actuation Pulse)
 * - actualReturn (derived from Sensory Return packets)
 * - returnDelay (temporal offset between pulse and return)
 * - returnMismatch (difference between expected and actual)
 *
 * And derive proxy indicators:
 * - selfCausedMatch: how much the return appears to match the pulse
 * - worldCausedDifference: how much the return appears independent of pulse
 * - unresolvedReturn: ambiguous attribution
 *
 * Future phases:
 * - W6: Body-World Closure Metrics — integrate into closure loop metrics
 * - W7+: Proto-neuron observation — may inform proto-neuron candidates
 */

export interface ReafferenceComparisonState {
  /** Frame timestamp */
  timestamp: number;

  /**
   * Expected return: strength of Sensory Return predicted from Actuation Pulse.
   * Derived from pulse intensity, coherence, outputReadiness, and locality.
   * Range: 0–1
   */
  expectedReturn: number;

  /**
   * Actual return: strength of Sensory Return actually received.
   * Derived from SensoryReturnPacket[] intensity and worldOriginStrength.
   * Range: 0–1
   */
  actualReturn: number;

  /**
   * Return delay: temporal offset between pulse and return.
   * Derived from returnDelayHint in SensoryReturnPackets.
   * Range: 0–1
   */
  returnDelay: number;

  /**
   * Return mismatch: difference between expectedReturn and actualReturn.
   * High mismatch indicates unexpected world behavior.
   * Range: 0–1
   */
  returnMismatch: number;

  /**
   * Self-caused match: proxy for how much the return appears to be
   * caused by AETERNA's own Actuation Pulse.
   * HIGH when:
   * - pulse exists
   * - pulse channel matches return channel
   * - return delay is reasonable
   * - expectedReturn ≈ actualReturn
   * - mediumStability is not extremely low
   * This is NOT a semantic "I did this" judgment.
   * Range: 0–1
   */
  selfCausedMatch: number;

  /**
   * World-caused difference: proxy for how much the return appears to be
   * caused by independent world dynamics rather than AETERNA's pulse.
   * HIGH when:
   * - no pulse but strong return
   * - expectedReturn << actualReturn
   * - return delay is unusual
   * - mediumStability is low
   * - ambient world drift is high
   * This is NOT a semantic "the world did this" judgment.
   * Range: 0–1
   */
  worldCausedDifference: number;

  /**
   * Unresolved return: ambiguous return that cannot be clearly attributed
   * to self-caused or world-caused sources.
   * HIGH when:
   * - pulse-return correspondence is unclear
   * - expectedReturn and actualReturn are moderately mismatched
   * - return delay is ambiguous
   * - multiple returns overlap
   * Range: 0–1
   */
  unresolvedReturn: number;

  /**
   * Comparison confidence: how reliable this comparison is.
   * HIGH when:
   * - clear pulse-return correspondence
   * - stable world medium
   * - unambiguous timing
   * LOW when:
   * - no pulse or no return
   * - unstable medium
   * - overlapping returns
   * This is a proxy, not a proof.
   * Range: 0–1
   */
  comparisonConfidence: number;

  /**
   * Optional: Pulse-return correlation.
   * Measures temporal and channel correlation between pulse and return.
   * Range: 0–1
   */
  pulseReturnCorrelation?: number;

  /**
   * Optional: Return attenuation.
   * How much the return signal was dampened compared to expected.
   * Positive when actualReturn < expectedReturn.
   * Range: 0–1
   */
  returnAttenuation?: number;

  /**
   * Optional: Return amplification.
   * How much the return signal was amplified compared to expected.
   * Positive when actualReturn > expectedReturn.
   * Range: 0–1
   */
  returnAmplification?: number;

  /**
   * Optional: Delayed echo score.
   * Proxy for returns that arrive with significant delay.
   * Range: 0–1
   */
  delayedEchoScore?: number;
}
