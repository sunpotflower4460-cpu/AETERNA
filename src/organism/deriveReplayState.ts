/**
 * Derive Replay State
 *
 * AETERNA v0.5 / A3: Offline Replay / Rest Consolidation
 *
 * Derives ReplayState from existing organism state.
 * This determines when and how strongly replay should occur.
 *
 * Core principles:
 * - Replay happens during quiet/rest conditions
 * - High external input suppresses replay
 * - Replay pressure builds during quiet periods
 * - Consolidation gain depends on rest depth and readiness
 *
 * This is a pure function for testability.
 */

import type { ReplayState } from '../types/replayState.ts';
import type { TraceState } from '../types/traceState.ts';
import type { ArousalAwarenessState } from '../types/arousalAwareness.ts';
import type { FeltStateVector } from '../types/feltState.ts';
import type { OrganismSnapshot } from '../types/organismSnapshot.ts';
import type { RecoveryState } from '../types/recoveryState.ts';
import type { ReplayQueue } from './replayQueue.ts';

function clampFinite(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

/**
 * Derive replay pressure
 * Builds during quiet, low-perturbation conditions
 */
function deriveReplayPressure(
  traceState: TraceState,
  arousalAwareness: ArousalAwarenessState,
  feltState: FeltStateVector,
  snapshot: OrganismSnapshot,
  queueSalience: number,
  recoveryState?: RecoveryState | null,
): number {
  const quietBonus = (1.0 - arousalAwareness.arousalLevel) * 0.4;
  const restBonus = arousalAwareness.restDepth * 0.3;
  const lowPerturbationBonus = (1.0 - clampFinite(feltState.perturbationLoad, 0, 1.5)) * 0.15;
  const queuePressure = Math.min(1.0, queueSalience) * 0.2;
  const restorationBonus = clampFinite(feltState.restorationReadiness, 0, 1) * 0.1;
  const traceBonus = clampFinite(traceState.traceStrength, 0, 1.5) * 0.16;
  const salienceBonus = clampFinite(traceState.salienceResidue, 0, 1.5) * 0.1;
  const recurrenceBonus = clampFinite(traceState.recurrenceWeight, 0, 1.2) * 0.08;
  const settlingBonus = clampFinite(traceState.settlingResidue ?? 0, 0, 1) * 0.08;
  const stabilizationBonus = clampFinite(recoveryState?.stabilizationPull ?? 0, 0, 1) * 0.06;
  const suppressionPenalty = clampFinite(traceState.replaySuppression, 0, 1) * 0.22;
  const collapsePenalty = clampFinite(recoveryState?.collapseRisk ?? 0, 0, 1) * 0.12;

  const rawPressure =
    quietBonus +
    restBonus +
    lowPerturbationBonus +
    queuePressure +
    restorationBonus +
    traceBonus +
    salienceBonus +
    recurrenceBonus +
    settlingBonus +
    stabilizationBonus -
    suppressionPenalty -
    collapsePenalty;

  return clampFinite(rawPressure, 0, 1);
}

/**
 * Derive replay readiness
 * Indicates whether conditions are suitable for replay
 */
function deriveReplayReadiness(
  traceState: TraceState,
  arousalAwareness: ArousalAwarenessState,
  feltState: FeltStateVector,
  _snapshot: OrganismSnapshot,
  recoveryState?: RecoveryState | null,
): number {
  const arousalOk = arousalAwareness.arousalLevel < 0.5 ? 0.3 : 0.0;
  const awarenessOk = clampFinite(arousalAwareness.awarenessWindow, 0, 1) * 0.2;
  const settlingOk = clampFinite(arousalAwareness.settlingWindow, 0, 1) * 0.2;
  const restOk = arousalAwareness.restDepth * 0.25;
  const restorationOk = clampFinite(feltState.restorationReadiness, 0, 1) * 0.15;
  const overloadPenalty = clampFinite(feltState.overload, 0, 1.5) > 0.8 ? -0.3 : 0.0;
  const traceReadiness = clampFinite(traceState.replayReadiness, 0, 1) * 0.35;
  const traceResidue = clampFinite(traceState.traceStrength, 0, 1.5) * 0.08;
  const recoveryBonus = clampFinite(traceState.recoveryLinkedResidue ?? 0, 0, 1) * 0.06;
  const stabilizationBonus = clampFinite(recoveryState?.stabilizationPull ?? 0, 0, 1) * 0.08;
  const suppressionPenalty = clampFinite(traceState.replaySuppression, 0, 1) * -0.24;
  const collapsePenalty = clampFinite(recoveryState?.collapseRisk ?? 0, 0, 1) * -0.18;

  const rawReadiness =
    arousalOk +
    awarenessOk +
    settlingOk +
    restOk +
    restorationOk +
    traceReadiness +
    traceResidue +
    recoveryBonus +
    stabilizationBonus +
    overloadPenalty +
    suppressionPenalty +
    collapsePenalty;

  return clampFinite(rawReadiness, 0, 1);
}

/**
 * Derive replay suppression
 * High external input suppresses replay
 */
function deriveReplaySuppression(
  traceState: TraceState,
  arousalAwareness: ArousalAwarenessState,
  feltState: FeltStateVector,
  snapshot: OrganismSnapshot
): number {
  const arousalSuppression = arousalAwareness.arousalLevel > 0.4 ? (arousalAwareness.arousalLevel - 0.4) * 1.5 : 0.0;
  const perturbationSuppression = clampFinite(feltState.perturbationLoad, 0, 1.5) > 0.5 ?
    (clampFinite(feltState.perturbationLoad, 0, 1.5) - 0.5) * 0.8 : 0.0;
  const touchSuppression = clampFinite(snapshot.recentTouchActivity, 0, 1) * 0.4;
  const overloadSuppression = clampFinite(feltState.overload, 0, 1.5) > 0.6 ?
    (clampFinite(feltState.overload, 0, 1.5) - 0.6) * 0.7 : 0.0;
  const traceSuppression = clampFinite(traceState.replaySuppression, 0, 1) * 0.45;

  const rawSuppression =
    arousalSuppression +
    perturbationSuppression +
    touchSuppression +
    overloadSuppression +
    traceSuppression;

  return clampFinite(rawSuppression, 0, 1);
}

/**
 * Derive consolidation gain
 * How much replay affects slow state
 */
function deriveConsolidationGain(
  traceState: TraceState,
  arousalAwareness: ArousalAwarenessState,
  feltState: FeltStateVector,
  replayReadiness: number,
  recoveryState?: RecoveryState | null,
): number {
  const restGain = arousalAwareness.restDepth * 0.4;
  const coherenceGain = clampFinite(feltState.coherence, 0, 1) * 0.3;
  const readinessGain = replayReadiness * 0.2;
  const settlingGain = clampFinite(arousalAwareness.settlingWindow, 0, 1) * 0.15;
  const traceGain = clampFinite(traceState.traceStrength, 0, 1.5) * 0.12;
  const recurrenceGain = clampFinite(traceState.recurrenceWeight, 0, 1.2) * 0.08;
  const stabilizationGain = clampFinite(recoveryState?.stabilizationPull ?? 0, 0, 1) * 0.08;

  const rawGain = restGain + coherenceGain + readinessGain + settlingGain + traceGain + recurrenceGain + stabilizationGain;

  return clampFinite(rawGain * 0.18, 0, 0.22);
}

/**
 * Derive rest consolidation depth
 * How deep the rest-based consolidation goes
 */
function deriveRestConsolidationDepth(
  traceState: TraceState,
  arousalAwareness: ArousalAwarenessState,
  feltState: FeltStateVector
): number {
  const depth = arousalAwareness.restDepth * 0.6 +
                clampFinite(feltState.restorationReadiness, 0, 1) * 0.3 +
                clampFinite(feltState.coherence, 0, 1) * 0.05 +
                clampFinite(traceState.settlingResidue ?? 0, 0, 1) * 0.03 +
                clampFinite(traceState.recoveryLinkedResidue ?? 0, 0, 1) * 0.02;

  return clampFinite(depth, 0, 1);
}

/**
 * Derive complete ReplayState
 *
 * This is a pure function - no side effects.
 */
export function deriveReplayState(
  snapshot: OrganismSnapshot,
  feltState: FeltStateVector,
  arousalAwareness: ArousalAwarenessState,
  traceState: TraceState,
  queue: ReplayQueue,
  activeReplayCount: number,
  recentReplaySalience: number,
  lastReplayCategory: string | null,
  recoveryState?: RecoveryState | null,
): ReplayState {
  const queueSalience = queue.averageSalience();

  const replayPressure = deriveReplayPressure(traceState, arousalAwareness, feltState, snapshot, queueSalience, recoveryState);
  const replayReadiness = deriveReplayReadiness(traceState, arousalAwareness, feltState, snapshot, recoveryState);
  const replaySuppression = deriveReplaySuppression(traceState, arousalAwareness, feltState, snapshot);
  const consolidationGain = deriveConsolidationGain(traceState, arousalAwareness, feltState, replayReadiness, recoveryState);
  const restConsolidationDepth = deriveRestConsolidationDepth(traceState, arousalAwareness, feltState);

  return {
    timestamp: snapshot.timestamp,
    replayPressure,
    replayReadiness,
    consolidationGain,
    activeReplayCount,
    recentReplaySalience,
    restConsolidationDepth,
    replaySuppression,
    lastReplayCategory,
  };
}
