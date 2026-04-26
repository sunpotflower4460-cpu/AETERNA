/**
 * Pressure Competition State
 *
 * AETERNA Phase 6 / Q2-1: Annealing-Inspired Pressure Competition
 *
 * Represents the outcome of annealing-inspired competition among
 * multiple simultaneous life-field pressures.
 *
 * Key principles:
 * - Multiple pressures can coexist — this is NOT winner-take-all
 * - Competition is energy-landscape-inspired, not if-branch priority
 * - dominantPressure is a soft foreground indicator, not a mode switch
 * - entropy/stability describe how contested the field is, not meaning
 * - annealingTemperature is a derived proxy for field "temperature"
 *   (high = diffuse/contested, low = one pressure foregrounds)
 *
 * This is NOT:
 * - A goal or intention system
 * - A mode switcher
 * - A semantic planner
 * - A literal quantum annealing implementation
 */

export interface PressureCompetitionState {
  /** Frame timestamp */
  timestamp: number;

  /**
   * Safety pressure: boundary-maintenance / overload-protection pressure
   * Derived from: safetyNeed
   * Range: 0–1.2
   */
  safetyPressure: number;

  /**
   * Restoration pressure: recovery / settling / repair pressure
   * Derived from: restorationNeed + settlingMotivation
   * Range: 0–1
   */
  restorationPressure: number;

  /**
   * Novelty pressure: tendency toward unfamiliar / new patterns
   * Derived from: noveltyMotivation
   * Range: 0–1
   */
  noveltyPressure: number;

  /**
   * Repetition pressure: tendency toward familiar / known patterns
   * Derived from: repetitionMotivation
   * Range: 0–1
   */
  repetitionPressure: number;

  /**
   * Exploration pressure: tendency to probe / orient / engage
   * Derived from: explorationMotivation
   * Range: 0–1
   */
  explorationPressure: number;

  /**
   * Withdrawal pressure: tendency to pull back / dampen / protect
   * Derived from: withdrawMotivation
   * Range: 0–1
   */
  withdrawalPressure: number;

  /**
   * Dominant pressure name (softmax foreground)
   * The pressure with the highest softmax weight — if clearly above uniform.
   * null when competition is diffuse (no clear foreground).
   * This is a soft indicator, NOT a mode or intent.
   */
  dominantPressure: string | null;

  /**
   * Competition entropy (normalized Shannon entropy of softmax weights)
   * Range: 0 (one pressure fully dominant) to 1 (all pressures equally weighted)
   * High entropy = contested / diffuse field.
   * Low entropy = one pressure foregrounds clearly.
   */
  competitionEntropy: number;

  /**
   * Competition stability (inverse of entropy)
   * Range: 0 (maximally diffuse) to 1 (maximally concentrated)
   * Proxy for how stable the current pressure foreground is.
   */
  competitionStability: number;

  /**
   * Annealing temperature (derived proxy)
   * High when pressures are similar / contested (diffuse competition).
   * Low when one pressure clearly dominates (concentrated).
   * NOT a literal temperature — an energy-landscape-inspired proxy.
   */
  annealingTemperature: number;

  /**
   * Pressure energy (optional): mean squared pressure across all axes
   * Proxy for overall pressure intensity in the field.
   */
  pressureEnergy?: number;

  /**
   * Candidate energies (optional): softmax-weighted score per pressure name
   * Keys: 'safety' | 'restoration' | 'novelty' | 'repetition' | 'exploration' | 'withdrawal'
   * Values: softmax weight (sums to 1 across all pressures)
   */
  candidateEnergies?: Record<string, number>;
}
