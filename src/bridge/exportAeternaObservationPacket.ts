/**
 * exportAeternaObservationPacket
 *
 * AETERNA Phase 8: AETERNA → Node bridge 最小版 — observation exporter
 *
 * Assembles an AeternaObservationPacket from AETERNA organism state.
 * This is a pure, read-only helper. It does NOT modify any organism state
 * and does NOT send data to any external system.
 *
 * Design:
 * - Pure function (no side effects, no mutation)
 * - Read-only: reads state, produces packet, returns it
 * - Fallback-safe: missing state fields produce safe default values
 * - No semantic content is generated or attached
 * - No feedback to AETERNA core dynamics
 *
 * Ongoingness proxy derivation:
 *   ongoingness ≈ (1 - collapseRisk * 0.6) * (1 - volatility * 0.2)
 *   This is a rough composite, not a confirmed measurement.
 */

import type { AeternaObservationPacket } from '../types/aeternaObservationPacket.js';
import { AETERNA_PACKET_VERSION } from '../types/aeternaObservationPacket.js';
import type { TraceState } from '../types/traceState.js';
import type { RecoveryState } from '../types/recoveryState.js';
import type { ObservationPatternState } from '../types/observationPatternState.js';
import type { ProtoPointObservationState } from '../types/protoPointObservationState.js';
import type { PressureCompetitionState } from '../types/pressureCompetitionState.js';

/** Input state snapshot for packet export. All fields are optional. */
export interface AeternaExportInput {
  /** Current frame tick or timestamp. */
  timestamp: number;

  /** Recent mean activity levels (sliding window). */
  meanActivity?: number;

  /** Activity variance (std-dev over recent window). */
  activityVariance?: number;

  /** Collapse rate estimate (0–1). */
  collapseRate?: number;

  /** Saturation rate estimate (0–1). */
  saturationRate?: number;

  /** Quiet baseline floor (mean activity during no-touch periods). */
  quietBaselineFloor?: number;

  /** Phase coherence estimate (0–1). */
  phaseCoherence?: number;

  /** Boundary integrity from homeostatic state (0–1). */
  boundaryIntegrity?: number;

  /** Collapse risk from homeostatic or recovery state (0–1). */
  collapseRisk?: number;

  /** Competition stability from pressure competition (0–1). */
  competitionStability?: number;

  /** Trace state from current frame (or null). */
  traceState?: TraceState | null;

  /** Recovery state from current frame (or null). */
  recoveryState?: RecoveryState | null;

  /** Observation pattern state from Phase 5 observer (or null). */
  observationPatternState?: ObservationPatternState | null;

  /** Proto-point observation state from Phase 7 observer (or null). */
  protoPointObservationState?: ProtoPointObservationState | null;

  /** Pressure competition state from Phase 6 observer (or null). */
  pressureCompetitionState?: PressureCompetitionState | null;

  /** Previous phase-coherence reading (for long-cycle shift derivation). */
  previousPhaseCoherence?: number | null;
}

function clamp(v: number, min: number, max: number): number {
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, v));
}

function clamp01(v: number): number {
  return clamp(v, 0, 1);
}

/**
 * Derive a composite ongoingness proxy from available state.
 * All inputs are optional; safe defaults are used for missing values.
 *
 * Formula (heuristic proxy):
 *   base = (1 - collapseRate * 5, clamped 0-1) * 0.5
 *         + (1 - saturationRate * 20, clamped 0-1) * 0.3
 *         + min(quietBaselineFloor / 0.2, 1) * 0.2
 *   adjusted = base * (1 - collapseRisk * 0.3)
 */
function deriveOngoingness(input: AeternaExportInput): number {
  const collapseRate = clamp01(input.collapseRate ?? 0);
  const saturationRate = clamp01(input.saturationRate ?? 0);
  const quietFloor = clamp01((input.quietBaselineFloor ?? 0.1) / 0.2);
  const collapseRisk = clamp01(input.collapseRisk ?? (input.recoveryState?.collapseRisk ?? 0));

  const base = clamp01(1 - collapseRate * 5) * 0.5
    + clamp01(1 - saturationRate * 20) * 0.3
    + quietFloor * 0.2;

  return clamp01(base * (1 - collapseRisk * 0.3));
}

/**
 * Derive a volatility proxy from available state.
 * High variance and high arousal both contribute.
 */
function deriveVolatility(input: AeternaExportInput): number {
  const variance = clamp01((input.activityVariance ?? 0) * 10);
  const collapseRisk = clamp01(input.collapseRisk ?? (input.recoveryState?.collapseRisk ?? 0));
  // High collapse risk also means the field is volatile
  return clamp01(variance * 0.7 + collapseRisk * 0.3);
}

/**
 * Derive a stability proxy from pressure competition and homeostatic state.
 */
function deriveStability(input: AeternaExportInput): number {
  const compStability = clamp01(input.competitionStability
    ?? (input.pressureCompetitionState?.competitionStability ?? 0.5));
  const boundaryOk = clamp01(input.boundaryIntegrity ?? 1);
  const collapseRisk = clamp01(input.collapseRisk ?? (input.recoveryState?.collapseRisk ?? 0));

  return clamp01(compStability * 0.5 + boundaryOk * 0.3 + (1 - collapseRisk) * 0.2);
}

/**
 * Derive packet confidence (observation stability proxy).
 * NOT semantic confidence.
 *
 * Contributions (all bounded):
 * - Ongoingness is healthy (> 0.5)
 * - Boundary integrity is not severely degraded
 * - No NaN (assumed always true here; caller should have filtered)
 * - Trace state is available (avoids total unknowns)
 * - Collapse risk is low
 */
function deriveConfidence(input: AeternaExportInput, ongoingness: number): number {
  const ongoingnessFactor = clamp01(ongoingness / 0.5); // 1.0 at ongoingness=0.5+
  const boundaryFactor = clamp01((input.boundaryIntegrity ?? 1));
  const collapseRisk = clamp01(input.collapseRisk ?? (input.recoveryState?.collapseRisk ?? 0));
  const hasTrace = input.traceState != null ? 1.0 : 0.7;

  return clamp01(
    ongoingnessFactor * 0.35
    + boundaryFactor * 0.30
    + (1 - collapseRisk) * 0.20
    + hasTrace * 0.15,
  );
}

/**
 * Derive long-cycle coherence shift from current vs previous phase coherence.
 * Positive = coherence rising, negative = falling.
 * Returns undefined if previous coherence is not available.
 */
function deriveLongCycleCoherenceShift(input: AeternaExportInput): number | undefined {
  if (
    input.phaseCoherence == null ||
    input.previousPhaseCoherence == null ||
    !Number.isFinite(input.phaseCoherence) ||
    !Number.isFinite(input.previousPhaseCoherence)
  ) {
    return undefined;
  }
  return clamp(input.phaseCoherence - input.previousPhaseCoherence, -1, 1);
}

/**
 * Export an AeternaObservationPacket from current organism state.
 *
 * This is a pure, read-only function. It assembles observation data
 * into a pre-semantic packet suitable for passing to the Node side.
 *
 * Missing or invalid state fields produce safe fallback values.
 * The returned packet must be passed through sanitizeAeternaObservationPacket
 * before external transmission.
 */
export function exportAeternaObservationPacket(
  input: AeternaExportInput,
): AeternaObservationPacket {
  const obs = input.observationPatternState;
  const proto = input.protoPointObservationState;
  const pressure = input.pressureCompetitionState;
  const trace = input.traceState;
  const recovery = input.recoveryState;

  // Field state derivations
  const ongoingness = deriveOngoingness(input);
  const stability = deriveStability(input);
  const volatility = deriveVolatility(input);
  const boundaryIntegrity = clamp01(input.boundaryIntegrity ?? 1);
  const recoveryPressure = clamp01(recovery?.recoveryPressure ?? 0);
  const collapseRisk = clamp01(
    input.collapseRisk ?? recovery?.collapseRisk ?? 0,
  );

  // Pattern candidate counts (from Phase 5 + Phase 7 observers)
  // If Phase 7 provides a protoPointCandidateCount, prefer it over Phase 5.
  const protoPointCandidateCount = proto != null
    ? proto.candidateCount
    : (obs?.protoPointCandidateCount ?? 0);

  // Pressure state (from Phase 6 observer)
  const safetyPressure = clamp(pressure?.safetyPressure ?? 0, 0, 1.2);
  const restorationPressure = clamp01(pressure?.restorationPressure ?? 0);
  const noveltyPressure = clamp01(pressure?.noveltyPressure ?? 0);
  const repetitionPressure = clamp01(pressure?.repetitionPressure ?? 0);
  const explorationPressure = clamp01(pressure?.explorationPressure ?? 0);
  const withdrawalPressure = clamp01(pressure?.withdrawalPressure ?? 0);

  // Trace state (from Phase 4 observer)
  const traceStrength = clamp01(trace?.traceStrength ?? 0);
  const replayReadiness = clamp01(trace?.replayReadiness ?? 0);
  const recurrenceWeight = clamp01(trace?.recurrenceWeight ?? 0);
  const salienceResidue = clamp01(trace?.salienceResidue ?? 0);

  // Confidence and long-cycle shift
  const confidence = deriveConfidence(input, ongoingness);
  const longCycleCoherenceShift = deriveLongCycleCoherenceShift(input);

  const packet: AeternaObservationPacket = {
    timestamp: input.timestamp,
    source: 'aeterna',
    fieldState: {
      ongoingness,
      stability,
      volatility,
      boundaryIntegrity,
      recoveryPressure,
      collapseRisk,
    },
    patternCandidates: {
      knotCount: obs?.knotCount ?? 0,
      pathCount: obs?.pathCount ?? 0,
      recurrenceLocusCount: obs?.recurrenceLocusCount ?? 0,
      basinCount: obs?.basinCount ?? 0,
      longLivedAnomalyCount: obs?.longLivedAnomalyCount ?? 0,
      protoPointCandidateCount,
    },
    pressureState: {
      safetyPressure,
      restorationPressure,
      noveltyPressure,
      repetitionPressure,
      explorationPressure,
      withdrawalPressure,
    },
    traceState: {
      traceStrength,
      replayReadiness,
      recurrenceWeight,
      salienceResidue,
    },
    confidence,
    packetVersion: AETERNA_PACKET_VERSION,
  };

  if (longCycleCoherenceShift !== undefined) {
    packet.longCycleCoherenceShift = longCycleCoherenceShift;
  }

  return packet;
}

/**
 * Build a detailed AeternaPatternCandidatePacket from proto-point observation state.
 * Returns null if no candidates are available.
 *
 * This function is separate from exportAeternaObservationPacket because
 * detailed candidate packets are heavier and optional.
 */
export function exportAeternaPatternCandidatePacket(
  timestamp: number,
  protoPointObservationState: ProtoPointObservationState | null,
): import('../types/aeternaPatternCandidatePacket.js').AeternaPatternCandidatePacket | null {
  if (!protoPointObservationState || protoPointObservationState.candidateCount === 0) {
    return null;
  }

  const candidates = protoPointObservationState.candidates.map((c) => ({
    candidateId: c.id,
    regionId: c.regionId,
    persistence: c.persistence,
    recurrenceScore: clamp01(c.recurrenceScore),
    traceAffinity: clamp01(c.traceAffinity),
    replayAffinity: clamp01(c.replayAffinity),
    localContrast: clamp01(c.localContrast),
    confidence: clamp01(c.confidence),
  }));

  return {
    timestamp,
    source: 'aeterna',
    protoPointCandidates: candidates,
    packetVersion: AETERNA_PACKET_VERSION,
  };
}
