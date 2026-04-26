/**
 * Trace State
 *
 * Phase 4: residue / trace / replay purification
 *
 * TraceState describes the weak residue left in the life-field after
 * perturbation, recurrence, recovery, and settling. It is not semantic memory.
 */
export interface TraceState {
  /** Frame timestamp */
  timestamp: number;

  /** Overall residue currently remaining in the field */
  traceStrength: number;

  /** How much repeated patterns are becoming easier to re-enter */
  recurrenceWeight: number;

  /** Residue left by salient mismatch / disturbance */
  salienceResidue: number;

  /** Whether replay is likely to weakly re-activate */
  replayReadiness: number;

  /** Pressure suppressing replay while external input dominates */
  replaySuppression: number;

  /** How much the recent local pattern is still present */
  recentPatternWeight?: number;

  /** Quiet-settling residue that remains after the field calms */
  settlingResidue?: number;

  /** Residue linked to recovery / restoration tendency */
  recoveryLinkedResidue?: number;
}
