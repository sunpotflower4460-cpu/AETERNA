/**
 * OrganismSnapshot
 *
 * Minimal snapshot of organism state for packet generation.
 * Prevents packet stages from depending directly on full network state.
 */

export interface OrganismSnapshot {
  /** Frame timestamp */
  timestamp: number;

  /** Energy reserve (0-1) */
  energy: number;

  /** Overload level (0-1+) */
  overload: number;

  /** Coherence/stability (0-1) */
  coherence: number;

  /** Boundary integrity (0-1) */
  boundary: number;

  /** Current mode state */
  modeState: 'wake' | 'sleep' | 'dream';

  /** Touch expectation confidence (0-1) */
  touchExpectationConfidence: number;

  /** Recent perturbation pressure summary (0-1+) */
  recentPerturbationPressure: number;

  /** Mean prediction error from recent frames (0-1+) */
  meanPredictionError: number;

  /** Restoration/recovery bias (0-1) */
  restorationBias: number;

  /** Coherence memory from living state (0-1) */
  coherenceMemory: number;

  /** Recent touch activity level (0-1) */
  recentTouchActivity: number;
}
