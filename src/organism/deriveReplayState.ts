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
import type { ArousalAwarenessState } from '../types/arousalAwareness.ts';
import type { FeltStateVector } from '../types/feltState.ts';
import type { OrganismSnapshot } from '../types/organismSnapshot.ts';
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
  arousalAwareness: ArousalAwarenessState,
  feltState: FeltStateVector,
  snapshot: OrganismSnapshot,
  queueSalience: number
): number {
  // Quiet conditions increase pressure
  const quietBonus = (1.0 - arousalAwareness.arousalLevel) * 0.4;
  const restBonus = arousalAwareness.restDepth * 0.3;
  const lowPerturbationBonus = (1.0 - clampFinite(feltState.perturbationLoad, 0, 1.5)) * 0.15;

  // Queue salience contributes
  const queuePressure = Math.min(1.0, queueSalience) * 0.2;

  // Restoration readiness slight bonus
  const restorationBonus = clampFinite(feltState.restorationReadiness, 0, 1) * 0.1;

  const rawPressure = quietBonus + restBonus + lowPerturbationBonus + queuePressure + restorationBonus;

  return clampFinite(rawPressure, 0, 1);
}

/**
 * Derive replay readiness
 * Indicates whether conditions are suitable for replay
 */
function deriveReplayReadiness(
  arousalAwareness: ArousalAwarenessState,
  feltState: FeltStateVector,
  _snapshot: OrganismSnapshot
): number {
  // Low to moderate arousal
  const arousalOk = arousalAwareness.arousalLevel < 0.5 ? 0.3 : 0.0;

  // Moderate awareness window or settling window
  const awarenessOk = clampFinite(arousalAwareness.awarenessWindow, 0, 1) * 0.2;
  const settlingOk = clampFinite(arousalAwareness.settlingWindow, 0, 1) * 0.2;

  // Rest depth positive
  const restOk = arousalAwareness.restDepth * 0.25;

  // Restoration readiness positive
  const restorationOk = clampFinite(feltState.restorationReadiness, 0, 1) * 0.15;

  // Overload not extreme
  const overloadPenalty = clampFinite(feltState.overload, 0, 1.5) > 0.8 ? -0.3 : 0.0;

  const rawReadiness = arousalOk + awarenessOk + settlingOk + restOk + restorationOk + overloadPenalty;

  return clampFinite(rawReadiness, 0, 1);
}

/**
 * Derive replay suppression
 * High external input suppresses replay
 */
function deriveReplaySuppression(
  arousalAwareness: ArousalAwarenessState,
  feltState: FeltStateVector,
  snapshot: OrganismSnapshot
): number {
  // High arousal suppresses
  const arousalSuppression = arousalAwareness.arousalLevel > 0.4 ? (arousalAwareness.arousalLevel - 0.4) * 1.5 : 0.0;

  // High perturbation load suppresses
  const perturbationSuppression = clampFinite(feltState.perturbationLoad, 0, 1.5) > 0.5 ?
    (clampFinite(feltState.perturbationLoad, 0, 1.5) - 0.5) * 0.8 : 0.0;

  // Touch activity suppresses
  const touchSuppression = clampFinite(snapshot.recentTouchActivity, 0, 1) * 0.4;

  // High overload suppresses
  const overloadSuppression = clampFinite(feltState.overload, 0, 1.5) > 0.6 ?
    (clampFinite(feltState.overload, 0, 1.5) - 0.6) * 0.7 : 0.0;

  const rawSuppression = arousalSuppression + perturbationSuppression + touchSuppression + overloadSuppression;

  return clampFinite(rawSuppression, 0, 1);
}

/**
 * Derive consolidation gain
 * How much replay affects slow state
 */
function deriveConsolidationGain(
  arousalAwareness: ArousalAwarenessState,
  feltState: FeltStateVector,
  replayReadiness: number
): number {
  // Rest depth increases consolidation
  const restGain = arousalAwareness.restDepth * 0.4;

  // Coherence increases consolidation
  const coherenceGain = clampFinite(feltState.coherence, 0, 1) * 0.3;

  // Readiness increases consolidation
  const readinessGain = replayReadiness * 0.2;

  // Settling window increases consolidation
  const settlingGain = clampFinite(arousalAwareness.settlingWindow, 0, 1) * 0.15;

  const rawGain = restGain + coherenceGain + readinessGain + settlingGain;

  // Consolidation is always weak
  return clampFinite(rawGain * 0.3, 0, 0.3);
}

/**
 * Derive rest consolidation depth
 * How deep the rest-based consolidation goes
 */
function deriveRestConsolidationDepth(
  arousalAwareness: ArousalAwarenessState,
  feltState: FeltStateVector
): number {
  // Deep rest + high restoration readiness
  const depth = arousalAwareness.restDepth * 0.6 +
                clampFinite(feltState.restorationReadiness, 0, 1) * 0.3 +
                clampFinite(feltState.coherence, 0, 1) * 0.1;

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
  queue: ReplayQueue,
  activeReplayCount: number,
  recentReplaySalience: number,
  lastReplayCategory: string | null
): ReplayState {
  const queueSalience = queue.averageSalience();

  const replayPressure = deriveReplayPressure(arousalAwareness, feltState, snapshot, queueSalience);
  const replayReadiness = deriveReplayReadiness(arousalAwareness, feltState, snapshot);
  const replaySuppression = deriveReplaySuppression(arousalAwareness, feltState, snapshot);
  const consolidationGain = deriveConsolidationGain(arousalAwareness, feltState, replayReadiness);
  const restConsolidationDepth = deriveRestConsolidationDepth(arousalAwareness, feltState);

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
