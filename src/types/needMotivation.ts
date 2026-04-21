/**
 * Need / Motivation State Types
 *
 * AETERNA v0.5 / A4: Need / Motivation Split
 *
 * This module separates:
 * - NEED: deficiency / maintenance / recovery pressure
 * - MOTIVATION: directional tendency toward action or foreground formation
 *
 * Key principles:
 * - Need and motivation are INDEPENDENT continuous quantities
 * - High need does NOT necessarily produce high motivation
 * - Motivation is NOT solely derived from need
 * - Both influence organism bias but do NOT directly determine actions
 *
 * This is NOT:
 * - A human desire/goal system
 * - An intentional planner
 * - A mode switcher
 * - An anthropomorphic "wants" model
 */

export interface NeedMotivationState {
  /** Frame timestamp */
  timestamp: number;

  /**
   * Energy Need: Activity capacity deficiency pressure
   * Derived from: low energyReserve, high fatigue, depletion
   * Range: 0 (no energy need) to 1+ (severe energy deficiency)
   */
  energyNeed: number;

  /**
   * Safety Need: Overload / boundary maintenance pressure
   * Derived from: overload, boundary integrity loss, instability
   * Range: 0 (no safety need) to 1+ (severe safety pressure)
   */
  safetyNeed: number;

  /**
   * Restoration Need: Recovery / settling / repair pressure
   * Derived from: restorationReadiness with unrecovered state
   * Range: 0 (no restoration need) to 1 (high restoration pressure)
   */
  restorationNeed: number;

  /**
   * Contact Need: Touch / interaction deficiency pressure
   * Derived from: touchNeedBaseline, absence drift, low engagement
   * Range: 0 (no contact need) to 1 (high contact need)
   * Optional: may remain 0 if relational components unavailable
   */
  contactNeed: number;

  /**
   * Novelty Motivation: Tendency toward new / unfamiliar
   * Derived from: moderate arousal + awareness + unresolved salience
   * NOT simply from need - can occur with low need
   * Range: 0 (no novelty tendency) to 1 (strong novelty tendency)
   */
  noveltyMotivation: number;

  /**
   * Repetition Motivation: Tendency toward familiar / known patterns
   * Derived from: replay traces, familiarity, stabilized expectations
   * Range: 0 (no repetition tendency) to 1 (strong repetition tendency)
   */
  repetitionMotivation: number;

  /**
   * Exploration Motivation: Tendency to probe / orient / engage
   * Derived from: moderate openness + moderate novelty + not-too-high safetyNeed
   * NOT uncertainty (we don't have explicit uncertainty yet)
   * Range: 0 (no exploration tendency) to 1 (strong exploration tendency)
   */
  explorationMotivation: number;

  /**
   * Settling Motivation: Tendency toward rest / consolidation / stabilization
   * Derived from: restorationReadiness + coherence + post-replay quietness
   * Range: 0 (no settling tendency) to 1 (strong settling tendency)
   */
  settlingMotivation: number;

  /**
   * Withdraw Motivation: Tendency to pull back / dampen / protect
   * Derived from: safetyNeed + overloadSense + low boundary + harsh interaction
   * Range: 0 (no withdraw tendency) to 1 (strong withdraw tendency)
   */
  withdrawMotivation: number;
}
