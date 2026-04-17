// ── Bridge: Torus ↔ Signal Runtime ──
// PR5: One-way connection Torus → Signal Runtime.
// Bidirectional full-loop is deferred to the next phase.

import { runSignalRuntime } from '../signal/index.js';
import type { SignalRuntimeResult, TouchPatternSeeds } from '../signal/types.js';
import type { AeternaNetworkLike, SignalFeedback, TorusStatePacket } from '../types/torusState.js';

// ── Packet builder ─────────────────────────────────────────────────────

/**
 * Assembles a TorusStatePacket from the values available inside animateLoop.
 * Numeric mapping to existing metrics is intentionally preserved as-is.
 *
 * dyn.arousal        → arousal
 * dyn.sigmaDisplay   → sigma
 * dyn.phiApprox      → phi_proxy
 * dyn.ignitionRatio  → cluster_ratio
 * state.tensionLoad  → tension
 */
export function buildTorusStatePacket({
  now,
  dyn,
  engineState,
  tension,
  activeTouches,
}: {
  now: number;
  dyn: {
    arousal: number;
    sigmaDisplay: number;
    phiApprox: number;
    ignitionRatio: number;
    soundLevel?: number;
    soundDelta?: number;
    soundBandLow?: number;
    soundBandMid?: number;
    soundBandHigh?: number;
    soundNovelty?: number;
    soundPersistence?: number;
    soundRecurrence?: number;
    soundDirectionality?: number;
    soundActive?: boolean;
    dominantPattern?: 'tap' | 'repeat' | 'hold' | 'stroke' | null;
    touchPatternScores?: { tap: number; repeat: number; hold: number; stroke: number };
    modeState?: 'sleep' | 'wake' | 'dream';
    wakeDrive?: number;
    sleepPressure?: number;
    dreamPressure?: number;
    energy?: number;
    stability?: number;
    overload?: number;
    actionState?: 'idle' | 'orient' | 'withdraw' | 'settle';
    orientingDrive?: number;
    restDrive?: number;
  };
  engineState: 'WHITE' | 'BLACK' | 'NEUTRAL';
  tension: number;
  activeTouches: Map<number, { x: number; y: number }>;
}): TorusStatePacket {
  const touchActive = activeTouches.size > 0;
  let touchLocation: [number, number] | null = null;
  if (touchActive) {
    const first = activeTouches.values().next().value;
    if (first) {
      touchLocation = [
        first.x / window.innerWidth,
        first.y / window.innerHeight,
      ];
    }
  }
  return {
    timestamp: now,
    arousal: dyn.arousal,
    sigma: dyn.sigmaDisplay,
    phi_proxy: dyn.phiApprox,
    cluster_ratio: dyn.ignitionRatio,
    tension,
    touch_active: touchActive,
    touch_location: touchLocation,
    sound_level: dyn.soundLevel,
    sound_delta: dyn.soundDelta,
    sound_band_low: dyn.soundBandLow,
    sound_band_mid: dyn.soundBandMid,
    sound_band_high: dyn.soundBandHigh,
    sound_novelty: dyn.soundNovelty,
    sound_persistence: dyn.soundPersistence,
    sound_recurrence: dyn.soundRecurrence,
    sound_directionality: dyn.soundDirectionality,
    sound_active: dyn.soundActive,
    engine_state: engineState,
    touch_pattern: dyn.dominantPattern ?? null,
    touch_pattern_scores: dyn.touchPatternScores,
    mode_state: dyn.modeState,
    wake_drive: dyn.wakeDrive,
    sleep_pressure: dyn.sleepPressure,
    dream_pressure: dyn.dreamPressure,
    energy: dyn.energy,
    stability: dyn.stability,
    overload: dyn.overload,
    action_state: dyn.actionState,
    orienting_drive: dyn.orientingDrive,
    rest_drive: dyn.restDrive,
  };
}

// ── PR8-B: Touch pattern → proto-meaning seed converter ───────────────

/**
 * Converts touch pattern scores into proto-meaning seeds for the Signal Runtime.
 *
 * These are bias/tendency values — not definitive emotional labels.
 * Mapping (soft, score-based, not one-hot):
 *   tap    → noveltyBias      (arrival / novelty / punctate-contact)
 *   repeat → recurrenceBias   (recurrence / return / repeated-contact)
 *   hold   → persistenceBias  (persistence / sustained-contact)
 *   stroke → directionalityBias (directional traversal / passage)
 */
export function touchPatternToProtoSeeds(
  scores: { tap: number; repeat: number; hold: number; stroke: number } | null | undefined,
): TouchPatternSeeds | null {
  if (!scores) return null;

  return {
    noveltyBias: scores.tap,
    recurrenceBias: scores.repeat,
    persistenceBias: scores.hold,
    directionalityBias: scores.stroke,
    protoMeaningSeeds: [
      scores.tap > 0.25 ? 'arrival' : null,
      scores.tap > 0.35 ? 'novelty' : null,
      scores.repeat > 0.25 ? 'recurrence' : null,
      scores.repeat > 0.35 ? 'return' : null,
      scores.hold > 0.25 ? 'persistence' : null,
      scores.hold > 0.35 ? 'pressure' : null,
      scores.stroke > 0.25 ? 'passage' : null,
      scores.stroke > 0.35 ? 'direction' : null,
    ].filter((s): s is string => s !== null),
  };
}

// ── Synthetic text adapter ─────────────────────────────────────────────

/**
 * Converts numeric torus metrics into a short Japanese description so that
 * runSignalRuntime (which expects text input) can process them naturally.
 * The words are chosen to map onto the emotional/question keywords the
 * Signal Runtime already knows.
 */
function packetToSyntheticText(packet: TorusStatePacket): string {
  const parts: string[] = [];

  if (packet.engine_state === 'WHITE') {
    parts.push('統合が上昇している');
  } else if (packet.engine_state === 'BLACK') {
    parts.push('分散が進んでいる');
  } else {
    parts.push('状態は中立');
  }

  if (packet.arousal > 0.6) {
    parts.push('覚醒が高い');
  } else if (packet.arousal < 0.3) {
    parts.push('覚醒が低い');
  }

  if (packet.tension > 0.4) {
    parts.push('緊張が高まっている');
  }

  if (packet.touch_active) {
    parts.push('接触がある');
  }

  if (packet.sigma > 1.05) {
    parts.push('臨界を超えている');
  } else if (packet.sigma < 0.95) {
    parts.push('臨界を下回っている');
  }

  return parts.join('。') || '状態を観測中';
}

// ── Bridge adapter ─────────────────────────────────────────────────────

/** Weight of tensionLoad in the novelty score sent to Signal Runtime. */
const NOVELTY_TENSION_WEIGHT = 0.5;
/** Weight of arousal in the novelty score sent to Signal Runtime. */
const NOVELTY_AROUSAL_WEIGHT = 0.3;
/** Baseline novelty floor so a silent torus still activates the pipeline. */
const NOVELTY_BASE = 0.2;

/**
 * Converts a TorusStatePacket into Signal Runtime input and runs the
 * full 13-stage pipeline.
 *
 * novelty is derived from tension + arousal so that high-stress torus
 * states produce more salient signal activations.
 */
export function bridgeTorusToSignal(packet: TorusStatePacket): SignalRuntimeResult {
  const syntheticText = packetToSyntheticText(packet);
  const novelty = Math.min(
    1.0,
    packet.tension * NOVELTY_TENSION_WEIGHT +
      packet.arousal * NOVELTY_AROUSAL_WEIGHT +
      NOVELTY_BASE,
  );
  const touchSeeds = touchPatternToProtoSeeds(packet.touch_pattern_scores ?? null);
  return runSignalRuntime(syntheticText, novelty, touchSeeds);
}

// ── Feedback stub ──────────────────────────────────────────────────────

/**
 * Stub for future Signal→Torus feedback (next phase).
 * Currently only logs highlight_hubs for debug purposes.
 */
export function applySignalFeedback(
  feedback: SignalFeedback,
  _network: AeternaNetworkLike,
): void {
  if (feedback.highlight_hubs && feedback.highlight_hubs.length > 0) {
    console.debug('[bridge] highlight_hubs:', feedback.highlight_hubs);
  }
}
