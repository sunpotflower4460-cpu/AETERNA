/**
 * Derive Proto-Point Candidates
 *
 * AETERNA Phase 7: proto-point の観測導入
 *
 * This helper derives ProtoPointObservationState from existing organism state.
 * It is observer-side and read-only: it reads state, computes derived proxy
 * values, and does NOT modify any core organism variable.
 *
 * Design:
 * - Observer-side only — never feeds back into organism dynamics
 * - Takes previous state as optional input for lifecycle tracking
 * - Returns rough proxy observations, not semantic labels
 * - Candidates represent "observable structural nodes", not confirmed facts
 * - Conservative thresholds to avoid mass generation
 * - No semantic node, label, category, concept, or same-object detection
 * - Node bridge (Phase 8+) is explicitly out of scope
 *
 * Candidate conditions (all multi-criteria, no single-condition candidates):
 *   A: recurrence — same local region repeatedly rises
 *   B: local contrast — stands out from ambient field
 *   C: trace persistence — residue survives for multiple ticks
 *   D: replay return — re-entered during quiet/replay
 *   E: knot/basin overlap — overlaps Phase 5 structural candidates
 *   F: lifetime — above threshold for multiple consecutive ticks
 *
 * Confidence formula (derived/proxy):
 *   confidence = 0.20*recurrenceScore + 0.20*traceAffinity + 0.20*replayAffinity
 *              + 0.15*localContrast + 0.15*knotOverlap + 0.10*basinOverlap
 *
 * All outputs are observer-side proxy counts/values.
 * This function has no side effects.
 */

import type { ProtoPointCandidate, ProtoPointCandidateLifecycle } from '../types/protoPointCandidate.ts';
import type { ProtoPointObservationState } from '../types/protoPointObservationState.ts';
import type { TraceState } from '../types/traceState.ts';
import type { ReplayState } from '../types/replayState.ts';
import type { RecoveryState } from '../types/recoveryState.ts';
import type { ObservationPatternState } from '../types/observationPatternState.ts';

export interface ProtoPointCandidatesInput {
  /** Frame timestamp */
  timestamp: number;

  /** Trace state (or null if unavailable) */
  traceState: TraceState | null;

  /** Replay state (or null if unavailable) */
  replayState: ReplayState | null;

  /** Recovery state (or null if unavailable) */
  recoveryState: RecoveryState | null;

  /** Phase 5 observation pattern state (or null if unavailable) */
  observationPatternState: ObservationPatternState | null;

  /** Recent mean activity history (sliding window) */
  activityHistory: number[];

  /** Recent perturbation pressure history (sliding window) */
  recentPerturbationHistory: number[];

  /** Current mean activity level */
  meanActivity: number;

  /** Quiet baseline activity level (no-input floor) */
  baselineActivity: number;

  /**
   * Previous observation state, used for lifecycle tracking.
   * Pass null on first call.
   */
  previousState: ProtoPointObservationState | null;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/**
 * Compute the weighted confidence score for a candidate.
 * Formula is derived/proxy — not exact measurement.
 */
function computeConfidence(
  recurrenceScore: number,
  traceAffinity: number,
  replayAffinity: number,
  localContrast: number,
  knotOverlap: number,
  basinOverlap: number,
): number {
  return clamp01(
    0.20 * recurrenceScore +
    0.20 * traceAffinity +
    0.20 * replayAffinity +
    0.15 * localContrast +
    0.15 * knotOverlap +
    0.10 * basinOverlap,
  );
}

/**
 * Determine lifecycle stage based on persistence and confidence trend.
 * Observer-side only — does not affect runtime behavior.
 */
function deriveLifecycle(
  persistence: number,
  confidence: number,
  prevLifecycle: ProtoPointCandidateLifecycle | undefined,
  isDecaying: boolean,
): ProtoPointCandidateLifecycle {
  if (isDecaying) return 'decaying';
  if (persistence <= 1) return 'new';
  if (persistence >= 8 && confidence > 0.40) return 'persistent';
  return 'recurring';
}

/**
 * Build a single proto-point candidate from its sub-scores.
 */
function buildCandidate(
  id: string,
  timestamp: number,
  regionId: string,
  recurrenceScore: number,
  traceAffinity: number,
  replayAffinity: number,
  localContrast: number,
  knotOverlap: number,
  basinOverlap: number,
  anomalyOverlap: number,
  prevCandidate: ProtoPointCandidate | undefined,
): ProtoPointCandidate {
  const confidence = computeConfidence(
    recurrenceScore, traceAffinity, replayAffinity,
    localContrast, knotOverlap, basinOverlap,
  );

  const prevPersistence = prevCandidate?.persistence ?? 0;
  const prevLifetime = prevCandidate?.lifetimeTicks ?? 0;
  const persistence = prevPersistence + 1;
  const lifetimeTicks = prevLifetime + 1;

  const prevLifecycle = prevCandidate?.lifecycle;
  const isDecaying = confidence < 0.18 && persistence > 2;
  const lifecycle = deriveLifecycle(persistence, confidence, prevLifecycle, isDecaying);

  const stabilityScore = clamp01(
    Math.min(persistence / 20, 1) * 0.5 + confidence * 0.5,
  );

  return {
    id,
    timestamp,
    regionId,
    persistence,
    recurrenceScore,
    traceAffinity,
    replayAffinity,
    localContrast,
    basinOverlap,
    knotOverlap,
    confidence,
    lifetimeTicks,
    lastSeenTick: timestamp,
    stabilityScore,
    anomalyOverlap,
    lifecycle,
  };
}

/**
 * Derive ProtoPointObservationState from current organism state snapshot.
 *
 * Uses up to three "virtual region" candidate slots, each emphasizing
 * a different dominant signal combination:
 *   - Slot A: recurrence-dominant (high recurrenceWeight + knotCount > 0)
 *   - Slot B: basin-dominant (high stabilizationPull + basinCount > 0)
 *   - Slot C: replay-dominant (high replayReadiness + recentReplaySalience)
 *
 * A candidate slot only produces a candidate if:
 * 1. At least three distinct sub-conditions are elevated (multi-criteria gate)
 * 2. The composite confidence score exceeds the conservative threshold (0.25)
 *
 * This function has no side effects and does not modify any input.
 */
export function deriveProtoPointCandidates(
  input: ProtoPointCandidatesInput,
): ProtoPointObservationState {
  const {
    timestamp,
    traceState,
    replayState,
    recoveryState,
    observationPatternState,
    activityHistory,
    recentPerturbationHistory,
    meanActivity,
    baselineActivity,
    previousState,
  } = input;

  // --- Extract proxy values from state ---

  const recurrenceWeight = clamp01(traceState?.recurrenceWeight ?? 0);
  const salienceResidue = clamp01(traceState?.salienceResidue ?? 0);
  const traceStrength = clamp01(traceState?.traceStrength ?? 0);
  const recentPatternWeight = clamp01(traceState?.recentPatternWeight ?? 0);
  const recoveryLinkedResidue = clamp01(traceState?.recoveryLinkedResidue ?? 0);
  const settlingResidue = clamp01(traceState?.settlingResidue ?? 0);

  const replayReadiness = clamp01(replayState?.replayReadiness ?? 0);
  const replaySuppression = clamp01(replayState?.replaySuppression ?? 0);
  const recentReplaySalience = clamp01(replayState?.recentReplaySalience ?? 0);
  const consolidationGain = clamp01(replayState?.consolidationGain ?? 0);

  const stabilizationPull = clamp01(recoveryState?.stabilizationPull ?? 0);
  const restorationBias = clamp01(recoveryState?.restorationBias ?? 0);
  const relaxationLevel = clamp01(recoveryState?.relaxationLevel ?? 0);
  const collapseRisk = clamp01(recoveryState?.collapseRisk ?? 0);

  const knotCount = observationPatternState?.knotCount ?? 0;
  const basinCount = observationPatternState?.basinCount ?? 0;
  const recurrenceLocusCount = observationPatternState?.recurrenceLocusCount ?? 0;
  const longLivedAnomalyCount = observationPatternState?.longLivedAnomalyCount ?? 0;

  // Ambient field contrast proxy: how much current activity stands above baseline
  const activityAboveBaseline = clamp01((meanActivity - baselineActivity) / Math.max(baselineActivity + 0.01, 0.08));

  // Perturbation regularity: how consistent the recent perturbation history is
  const perturbN = Math.min(recentPerturbationHistory.length, 30);
  const perturbSlice = recentPerturbationHistory.slice(-perturbN);
  const perturbMean = perturbN > 0
    ? perturbSlice.reduce((a, b) => a + b, 0) / perturbN
    : 0;

  // Activity regularity proxy: sustained above-floor activity
  const actN = Math.min(activityHistory.length, 40);
  const actSlice = activityHistory.slice(-actN);
  const actMean = actN > 0 ? actSlice.reduce((a, b) => a + b, 0) / actN : 0;

  // --- Build sub-scores for each candidate slot ---

  // SLOT A: recurrence-dominant
  // Emphasizes: recurrence, trace persistence, replay re-entry
  const slotA_recurrence = clamp01(recurrenceWeight * 0.60 + recentPatternWeight * 0.40);
  const slotA_trace = clamp01(traceStrength * 0.55 + salienceResidue * 0.45);
  const slotA_replay = clamp01(
    replayReadiness * 0.45 +
    recentReplaySalience * 0.35 +
    (1 - replaySuppression) * 0.20,
  );
  const slotA_contrast = clamp01(
    activityAboveBaseline * 0.60 +
    recurrenceWeight * 0.40,
  );
  const slotA_knot = clamp01(
    (knotCount > 0 ? 0.60 : 0) +
    (recurrenceLocusCount > 0 ? 0.40 : 0),
  );
  const slotA_basin = clamp01(
    (basinCount > 0 ? 0.50 : 0) +
    recoveryLinkedResidue * 0.30 +
    settlingResidue * 0.20,
  );
  const slotA_anomaly = clamp01((longLivedAnomalyCount > 0 ? 0.70 : 0) + salienceResidue * 0.30);

  // Multi-criteria gate for slot A: need at least 3 sub-conditions above their floor
  const slotA_conditionsMet =
    (slotA_recurrence > 0.25 ? 1 : 0) +
    (slotA_trace > 0.20 ? 1 : 0) +
    (slotA_replay > 0.18 ? 1 : 0) +
    (slotA_contrast > 0.15 ? 1 : 0) +
    (slotA_knot > 0.30 ? 1 : 0);
  const slotA_active = slotA_conditionsMet >= 3;

  // SLOT B: basin-dominant
  // Emphasizes: basin stability, restoration, low collapse risk
  const slotB_recurrence = clamp01(recurrenceWeight * 0.40 + perturbMean * 0.60);
  const slotB_trace = clamp01(traceStrength * 0.50 + recoveryLinkedResidue * 0.50);
  const slotB_replay = clamp01(
    consolidationGain * 0.50 +
    recentReplaySalience * 0.30 +
    settlingResidue * 0.20,
  );
  const slotB_contrast = clamp01(
    stabilizationPull * 0.50 +
    restorationBias * 0.30 +
    actMean * 0.20,
  );
  const slotB_knot = clamp01(
    (knotCount > 0 ? 0.40 : 0) +
    (recurrenceLocusCount > 0 ? 0.30 : 0) +
    recurrenceWeight * 0.30,
  );
  const slotB_basin = clamp01(
    (basinCount > 0 ? 0.55 : 0) +
    stabilizationPull * 0.25 +
    (1 - clamp01(collapseRisk)) * 0.20,
  );
  const slotB_anomaly = clamp01(
    (longLivedAnomalyCount > 0 ? 0.40 : 0) +
    recoveryLinkedResidue * 0.35 +
    relaxationLevel * 0.25,
  );

  // Multi-criteria gate for slot B
  const slotB_conditionsMet =
    (slotB_recurrence > 0.20 ? 1 : 0) +
    (slotB_trace > 0.20 ? 1 : 0) +
    (slotB_replay > 0.15 ? 1 : 0) +
    (slotB_contrast > 0.20 ? 1 : 0) +
    (slotB_basin > 0.30 ? 1 : 0);
  const slotB_active = slotB_conditionsMet >= 3;

  // SLOT C: replay-dominant
  // Emphasizes: replay re-entry, consolidation, quiet-return
  const slotC_recurrence = clamp01(recentPatternWeight * 0.55 + perturbMean * 0.45);
  const slotC_trace = clamp01(salienceResidue * 0.55 + traceStrength * 0.45);
  const slotC_replay = clamp01(
    replayReadiness * 0.50 +
    consolidationGain * 0.30 +
    (1 - replaySuppression) * 0.20,
  );
  const slotC_contrast = clamp01(
    activityAboveBaseline * 0.50 +
    salienceResidue * 0.30 +
    recurrenceWeight * 0.20,
  );
  const slotC_knot = clamp01(
    (knotCount > 0 ? 0.45 : 0) +
    recentPatternWeight * 0.30 +
    (recurrenceLocusCount > 0 ? 0.25 : 0),
  );
  const slotC_basin = clamp01(
    (basinCount > 0 ? 0.40 : 0) +
    relaxationLevel * 0.35 +
    settlingResidue * 0.25,
  );
  const slotC_anomaly = clamp01(
    (longLivedAnomalyCount > 0 ? 0.50 : 0) +
    salienceResidue * 0.30 +
    activityAboveBaseline * 0.20,
  );

  // Multi-criteria gate for slot C
  const slotC_conditionsMet =
    (slotC_recurrence > 0.20 ? 1 : 0) +
    (slotC_trace > 0.20 ? 1 : 0) +
    (slotC_replay > 0.22 ? 1 : 0) +
    (slotC_contrast > 0.15 ? 1 : 0) +
    (slotC_knot > 0.25 ? 1 : 0);
  const slotC_active = slotC_conditionsMet >= 3;

  // --- Retrieve previous candidates for lifecycle continuity ---
  const prevCandidates = previousState?.candidates ?? [];
  const prevMap = new Map<string, ProtoPointCandidate>(
    prevCandidates.map((c) => [c.id, c]),
  );

  // Conservative confidence threshold (avoid mass generation)
  const CONFIDENCE_THRESHOLD = 0.25;

  const candidates: ProtoPointCandidate[] = [];

  if (slotA_active) {
    const candidate = buildCandidate(
      'proto-slot-A',
      timestamp,
      'proxy-recurrence-dominant',
      slotA_recurrence,
      slotA_trace,
      slotA_replay,
      slotA_contrast,
      slotA_knot,
      slotA_basin,
      slotA_anomaly,
      prevMap.get('proto-slot-A'),
    );
    if (candidate.confidence >= CONFIDENCE_THRESHOLD) {
      candidates.push(candidate);
    }
  } else {
    // Slot no longer active — if it was a candidate, mark decaying briefly
    const prev = prevMap.get('proto-slot-A');
    if (prev && prev.lifecycle !== 'decaying' && prev.persistence > 2) {
      candidates.push({
        ...prev,
        timestamp,
        lifecycle: 'decaying',
        lastSeenTick: prev.lastSeenTick,
        // confidence drifts down by 30% when decaying
        confidence: clamp01(prev.confidence * 0.70),
      });
    }
  }

  if (slotB_active) {
    const candidate = buildCandidate(
      'proto-slot-B',
      timestamp,
      'proxy-basin-dominant',
      slotB_recurrence,
      slotB_trace,
      slotB_replay,
      slotB_contrast,
      slotB_knot,
      slotB_basin,
      slotB_anomaly,
      prevMap.get('proto-slot-B'),
    );
    if (candidate.confidence >= CONFIDENCE_THRESHOLD) {
      candidates.push(candidate);
    }
  } else {
    const prev = prevMap.get('proto-slot-B');
    if (prev && prev.lifecycle !== 'decaying' && prev.persistence > 2) {
      candidates.push({
        ...prev,
        timestamp,
        lifecycle: 'decaying',
        lastSeenTick: prev.lastSeenTick,
        confidence: clamp01(prev.confidence * 0.70),
      });
    }
  }

  if (slotC_active) {
    const candidate = buildCandidate(
      'proto-slot-C',
      timestamp,
      'proxy-replay-dominant',
      slotC_recurrence,
      slotC_trace,
      slotC_replay,
      slotC_contrast,
      slotC_knot,
      slotC_basin,
      slotC_anomaly,
      prevMap.get('proto-slot-C'),
    );
    if (candidate.confidence >= CONFIDENCE_THRESHOLD) {
      candidates.push(candidate);
    }
  } else {
    const prev = prevMap.get('proto-slot-C');
    if (prev && prev.lifecycle !== 'decaying' && prev.persistence > 2) {
      candidates.push({
        ...prev,
        timestamp,
        lifecycle: 'decaying',
        lastSeenTick: prev.lastSeenTick,
        confidence: clamp01(prev.confidence * 0.70),
      });
    }
  }

  // Remove candidates that have been decaying for more than 3 ticks
  const visibleCandidates = candidates.filter((c) => {
    if (c.lifecycle !== 'decaying') return true;
    const lastSeen = c.lastSeenTick ?? timestamp;
    return (timestamp - lastSeen) < 3;
  });

  // --- Compute summary statistics ---

  const candidateCount = visibleCandidates.length;
  const stableCandidates = visibleCandidates.filter(
    (c) => c.lifecycle === 'persistent' || (c.persistence >= 5 && c.confidence >= 0.40),
  );
  const stableCandidateCount = stableCandidates.length;

  const averageConfidence = candidateCount > 0
    ? visibleCandidates.reduce((sum, c) => sum + c.confidence, 0) / candidateCount
    : 0;
  const maxConfidence = candidateCount > 0
    ? Math.max(...visibleCandidates.map((c) => c.confidence))
    : 0;

  const newCandidateCount = visibleCandidates.filter((c) => c.lifecycle === 'new').length;
  const decayedCandidateCount = visibleCandidates.filter((c) => c.lifecycle === 'decaying').length;
  const persistentCandidateIds = stableCandidates
    .filter((c) => c.lifecycle === 'persistent')
    .map((c) => c.id);

  return {
    timestamp,
    candidateCount,
    stableCandidateCount,
    averageConfidence,
    maxConfidence,
    candidates: visibleCandidates,
    newCandidateCount,
    decayedCandidateCount,
    persistentCandidateIds,
  };
}
