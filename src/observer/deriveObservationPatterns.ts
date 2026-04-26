/**
 * Derive Observation Patterns
 *
 * Phase 5: Observation Layer Purification
 *
 * This helper derives ObservationPatternState from existing organism state.
 * It is a pure read-only observer function: it reads state, returns derived
 * counts, and does NOT modify any core organism variable.
 *
 * Design:
 * - Pure function (no side effects, no mutation)
 * - Observer-side only — never feeds back into organism dynamics
 * - Returns rough proxy counts, not semantic labels
 * - Counts represent "candidate observations", not confirmed structures
 *
 * Vocabulary note:
 * knot / path / recurrence locus / basin / anomaly / proto-point are
 * observer-side shorthand for structural candidates in the life-field.
 * They are NOT semantic nodes, concept labels, or object identifiers.
 */

import type { ObservationPatternState } from '../types/observationPatternState.ts';
import type { TraceState } from '../types/traceState.ts';
import type { ReplayState } from '../types/replayState.ts';
import type { RecoveryState } from '../types/recoveryState.ts';
import type { PredictionMismatchState } from '../types/predictionMismatchState.ts';

export interface ObservationPatternsInput {
  timestamp: number;

  /** Trace state from current frame (or null if unavailable) */
  traceState: TraceState | null;

  /** Replay state from current frame (or null if unavailable) */
  replayState: ReplayState | null;

  /** Recovery state from current frame (or null if unavailable) */
  recoveryState: RecoveryState | null;

  /** Prediction mismatch state from current frame (or null if unavailable) */
  mismatchState: PredictionMismatchState | null;

  /** Recent mean activity history (sliding window) */
  activityHistory: number[];

  /** Recent perturbation pressure history (sliding window) */
  recentPerturbationHistory: number[];

  /** Current mean activity level */
  meanActivity: number;

  /** Quiet baseline activity level (no-input floor) */
  baselineActivity: number;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/**
 * Compute the slope of an array as a rough drift indicator.
 * Returns positive if rising, negative if falling, near 0 if flat.
 */
function roughSlope(history: number[]): number {
  if (history.length < 4) return 0;
  const n = Math.min(history.length, 20);
  const slice = history.slice(-n);
  const first = slice.slice(0, Math.floor(n / 2));
  const last = slice.slice(Math.floor(n / 2));
  const firstMean = first.reduce((a, b) => a + b, 0) / first.length;
  const lastMean = last.reduce((a, b) => a + b, 0) / last.length;
  return lastMean - firstMean;
}

/**
 * Compute variance of an array.
 */
function variance(arr: number[]): number {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return arr.reduce((sum, v) => sum + (v - mean) ** 2, 0) / arr.length;
}

/**
 * Derive observation pattern state from current organism state snapshot.
 *
 * All outputs are observer-side proxy counts derived from existing state
 * variables. This function does not modify any input and has no side effects.
 */
export function deriveObservationPatterns(
  input: ObservationPatternsInput,
): ObservationPatternState {
  const {
    timestamp,
    traceState,
    replayState,
    recoveryState,
    mismatchState,
    activityHistory,
    recentPerturbationHistory,
    meanActivity,
    baselineActivity,
  } = input;

  // --- Extract proxy values from state ---

  const recurrenceWeight = traceState?.recurrenceWeight ?? 0;
  const salienceResidue = traceState?.salienceResidue ?? 0;
  const traceStrength = traceState?.traceStrength ?? 0;
  const recentPatternWeight = traceState?.recentPatternWeight ?? 0;
  const recoveryLinkedResidue = traceState?.recoveryLinkedResidue ?? 0;
  const settlingResidue = traceState?.settlingResidue ?? 0;

  const replayReadiness = replayState?.replayReadiness ?? 0;
  const replaySuppression = replayState?.replaySuppression ?? 0;
  const activeReplayCount = replayState?.activeReplayCount ?? 0;
  const recentReplaySalience = replayState?.recentReplaySalience ?? 0;
  const consolidationGain = replayState?.consolidationGain ?? 0;

  const stabilizationPull = recoveryState?.stabilizationPull ?? 0;
  const restorationBias = recoveryState?.restorationBias ?? 0;
  const collapseRisk = recoveryState?.collapseRisk ?? 0;
  const recoveryPressure = recoveryState?.recoveryPressure ?? 0;
  const relaxationLevel = recoveryState?.relaxationLevel ?? 0;
  const boundaryRepairPressure = recoveryState?.boundaryRepairPressure ?? 0;

  const mismatchLevel = mismatchState?.mismatchLevel ?? 0;
  const surprisePressure = mismatchState?.surprisePressure ?? 0;

  const historyVariance = variance(activityHistory.slice(-40));
  const perturbSlope = roughSlope(recentPerturbationHistory);
  const activitySlope = roughSlope(activityHistory);

  // --- Knot candidate count ---
  // Proxy condition: recurring local activity clusters
  // High recurrenceWeight + replayReadiness + recent pattern + not fully suppressed
  const knotSignal =
    recurrenceWeight * 0.45 +
    replayReadiness * 0.25 +
    recentPatternWeight * 0.20 +
    (1 - replaySuppression) * 0.10;
  const knotCount = knotSignal > 0.35 ? 1
    : knotSignal > 0.55 ? 2
    : 0;

  // --- Path candidate count ---
  // Proxy condition: consistent propagation channel observed in replay
  // High replay salience + active replay + consolidation gain suggests repeated paths
  const pathSignal =
    recentReplaySalience * 0.40 +
    (activeReplayCount > 0 ? 0.25 : 0) +
    consolidationGain * 0.20 +
    clamp01(recentPerturbationHistory.length > 0
      ? recentPerturbationHistory.slice(-10).reduce((a, b) => a + b, 0) / 10
      : 0) * 0.15;
  const pathCount = pathSignal > 0.30 ? 1
    : pathSignal > 0.50 ? 2
    : 0;

  // --- Recurrence locus count ---
  // Proxy condition: regions repeatedly revisited across events
  // High recurrenceWeight + positive perturbation history pattern + recentPatternWeight
  const recurrenceSignal =
    recurrenceWeight * 0.50 +
    recentPatternWeight * 0.30 +
    (perturbSlope > 0.01 ? 0.10 : 0) +
    traceStrength * 0.10;
  const recurrenceLocusCount = recurrenceSignal > 0.30 ? 1
    : recurrenceSignal > 0.50 ? 2
    : 0;

  // --- Basin candidate count ---
  // Proxy condition: field returns to stable zone after perturbation
  // High stabilizationPull + restorationBias + relaxationLevel; low collapseRisk
  const basinSignal =
    stabilizationPull * 0.35 +
    restorationBias * 0.30 +
    relaxationLevel * 0.25 +
    (1 - clamp01(collapseRisk)) * 0.10;
  const basinCount = basinSignal > 0.45 ? 1
    : basinSignal > 0.65 ? 2
    : 0;

  // --- Long-lived anomaly count ---
  // Proxy condition: persistent deviation above baseline, survives recovery
  const anomalyAboveBaseline = meanActivity > baselineActivity + 0.08;
  const salienceResidueHigh = salienceResidue > 0.20;
  const mismatchPersistent = mismatchLevel > 0.15 && surprisePressure > 0.10;
  const longLivedAnomalyCount = (anomalyAboveBaseline && salienceResidueHigh) ? 1
    : (mismatchPersistent && salienceResidue > 0.10) ? 1
    : 0;

  // --- Proto-point candidate count ---
  // Proxy condition: field node that meets several overlap criteria.
  // Must overlap: knot OR recurrence; AND basin OR recovery residue; AND persistence.
  // Not a semantic node — no label.
  const protoOverlap = (knotCount > 0 || recurrenceLocusCount > 0) &&
    (basinCount > 0 || recoveryLinkedResidue > 0.15 || settlingResidue > 0.12);
  const protoPersistence = traceStrength > 0.18 && recurrenceWeight > 0.22;
  const protoPointCandidateCount = (protoOverlap && protoPersistence) ? 1 : 0;

  // --- Collapse profile count ---
  // Proxy: distinct collapse signature detected (rapid rise in collapseRisk)
  const collapseProfileCount = collapseRisk > 0.55 ? 1 : 0;

  // --- Recovery profile count ---
  // Proxy: active recovery signature (recoveryPressure + boundaryRepairPressure)
  const recoveryProfileCount = (recoveryPressure > 0.30 || boundaryRepairPressure > 0.20) ? 1 : 0;

  // --- Stable attractor candidate count ---
  // Proxy: basin + low variance + positive settling slope
  const stableAttractorCandidateCount =
    (basinCount > 0 && historyVariance < 0.04 && activitySlope > -0.005) ? 1 : 0;

  // --- Observation confidence ---
  // Proxy: data availability and stability of current window
  const historyAvailable = activityHistory.length >= 20 ? 1.0 : activityHistory.length / 20;
  const stateAvailable =
    (traceState !== null ? 0.33 : 0) +
    (replayState !== null ? 0.33 : 0) +
    (recoveryState !== null ? 0.34 : 0);
  const noNaN = Number.isFinite(meanActivity) && Number.isFinite(recurrenceWeight) ? 1.0 : 0.0;
  const observationConfidence = clamp01(historyAvailable * 0.4 + stateAvailable * 0.4 + noNaN * 0.2);

  return {
    timestamp,
    knotCount,
    pathCount,
    recurrenceLocusCount,
    basinCount,
    longLivedAnomalyCount,
    protoPointCandidateCount,
    collapseProfileCount,
    recoveryProfileCount,
    stableAttractorCandidateCount,
    observationConfidence,
  };
}
