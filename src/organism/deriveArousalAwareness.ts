import type { FeltStateVector } from '../types/feltState.ts';
import type { OrganismLivingState } from '../types/organismState.ts';
import type { OrganismSnapshot } from '../types/organismSnapshot.ts';
import type { SelfWorldModelPacket } from '../types/selfWorldModel.ts';
import type { ArousalAwarenessState } from '../types/arousalAwareness.ts';

function clampFinite(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

/**
 * Derive arousal / awareness-like availability from existing organism state.
 *
 * This is intentionally read-only and does not decide mode transitions.
 */
export function deriveArousalAwareness(
  snapshot: OrganismSnapshot,
  feltState: FeltStateVector,
  livingState: OrganismLivingState,
  selfWorld: SelfWorldModelPacket | null = null
): ArousalAwarenessState {
  const currentActivity = clampFinite(snapshot.currentActivity ?? 0, 0, 1);
  const ignitionRatio = clampFinite(snapshot.ignitionRatio ?? 0, 0, 1);
  const touchSurprise = clampFinite(snapshot.recentTouchSurprise ?? 0, 0, 1.5);
  const worldPressure = clampFinite(selfWorld?.worldPressure ?? 0, 0, 1);
  const selfContinuity = clampFinite(selfWorld?.selfContinuity ?? 0.5, 0, 1);
  const relationEngagement = clampFinite(selfWorld?.relationEngagement ?? 0.5, 0, 1);
  const predictionSensitivity = clampFinite(livingState.predictionSensitivity, 0, 1);

  const arousalDrive =
    currentActivity * 0.30 +
    ignitionRatio * 0.16 +
    clampFinite(snapshot.overload, 0, 1) * 0.16 +
    clampFinite(feltState.overload, 0, 1.5) * 0.14 +
    clampFinite(feltState.perturbationLoad, 0, 1.5) * 0.12 +
    touchSurprise * 0.08 +
    predictionSensitivity * 0.04 +
    worldPressure * 0.06;
  const arousalRecovery =
    clampFinite(feltState.restorationReadiness, 0, 1) * 0.08 +
    clampFinite(feltState.depletion, 0, 1.5) * 0.04;
  const arousalLevel = clampFinite(0.08 + arousalDrive - arousalRecovery, 0.04, 1);

  const awarenessSupport =
    clampFinite(feltState.coherence, 0, 1) * 0.28 +
    clampFinite(feltState.boundaryIntegrity, 0, 1) * 0.18 +
    clampFinite(feltState.restorationReadiness, 0, 1) * 0.18 +
    selfContinuity * 0.14 +
    relationEngagement * 0.08 +
    clampFinite(livingState.coherenceMemory, 0, 1) * 0.06;
  const awarenessNarrowing =
    clampFinite(feltState.overload, 0, 1.5) * 0.18 +
    clampFinite(feltState.depletion, 0, 1.5) * 0.16 +
    clampFinite(feltState.perturbationLoad, 0, 1.5) * 0.10 +
    touchSurprise * 0.06 +
    worldPressure * 0.04;
  const awarenessWindow = clampFinite(0.12 + awarenessSupport - awarenessNarrowing, 0.05, 1);

  const salienceOpenness = clampFinite(
    0.08 +
      awarenessWindow * 0.55 +
      clampFinite(feltState.openness, 0, 1) * 0.18 +
      clampFinite(feltState.perturbationLoad, 0, 1.5) * 0.12 +
      touchSurprise * 0.12 +
      predictionSensitivity * 0.08 -
      clampFinite(feltState.depletion, 0, 1.5) * 0.10 -
      clampFinite(feltState.overload, 0, 1.5) * 0.15,
    0.04,
    1
  );

  const foregroundPressure = clampFinite(
    0.05 +
      clampFinite(feltState.perturbationLoad, 0, 1.5) * 0.35 +
      touchSurprise * 0.25 +
      clampFinite(feltState.overload, 0, 1.5) * 0.12 +
      (1 - selfContinuity) * 0.08 +
      clampFinite(feltState.depletion, 0, 1.5) * 0.05 +
      relationEngagement * clampFinite(snapshot.recentTouchActivity, 0, 1) * 0.05,
    0.03,
    1
  );

  const restDepth = clampFinite(
    0.15 +
      clampFinite(feltState.restorationReadiness, 0, 1) * 0.25 +
      (1 - arousalLevel) * 0.30 +
      clampFinite(feltState.coherence, 0, 1) * 0.12 -
      clampFinite(feltState.perturbationLoad, 0, 1.5) * 0.18 -
      touchSurprise * 0.08,
    0.02,
    1
  );

  const hyperreactivity = clampFinite(
    arousalLevel * 0.45 +
      touchSurprise * 0.20 +
      clampFinite(feltState.overload, 0, 1.5) * 0.18 +
      predictionSensitivity * 0.12 -
      awarenessWindow * 0.22 -
      restDepth * 0.08,
    0,
    1
  );

  const settlingWindow = clampFinite(
    0.08 +
      awarenessWindow * 0.45 +
      clampFinite(feltState.restorationReadiness, 0, 1) * 0.22 +
      restDepth * 0.12 -
      hyperreactivity * 0.18 -
      foregroundPressure * 0.10,
    0.02,
    1
  );

  return {
    timestamp: snapshot.timestamp,
    arousalLevel,
    awarenessWindow,
    salienceOpenness,
    foregroundPressure,
    restDepth,
    hyperreactivity,
    settlingWindow,
  };
}
