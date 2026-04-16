// ── Bridge: Torus ↔ Signal Runtime ──
// PR5: One-way connection Torus → Signal Runtime.
// Bidirectional full-loop is deferred to the next phase.

import { runSignalRuntime } from './signal/index.js';
import type { SignalRuntimeResult, TouchPatternSeeds } from './signal/types.js';

// ── Types ──────────────────────────────────────────────────────────────

/** Snapshot of the Torus dynamics state, sampled per bridge tick. */
export interface TorusStatePacket {
  /** Performance.now() timestamp at sampling time */
  timestamp: number;
  /** dyn.arousal */
  arousal: number;
  /** dyn.sigmaDisplay — critical coupling */
  sigma: number;
  /** dyn.phiApprox — integrated information proxy */
  phi_proxy: number;
  /** dyn.ignitionRatio — fraction of ignited clusters */
  cluster_ratio: number;
  /** state.tensionLoad — accumulated prediction error */
  tension: number;
  /** Whether any pointer/touch is currently active */
  touch_active: boolean;
  /** Normalised [0,1] screen position of the first active touch, or null */
  touch_location: [number, number] | null;
  /** Refined engine state from animateLoop Phase H */
  engine_state: 'WHITE' | 'BLACK' | 'NEUTRAL';
  /** PR7: Dominant touch tendency ('tap' | 'repeat' | 'hold' | 'stroke' | null) */
  touch_pattern?: 'tap' | 'repeat' | 'hold' | 'stroke' | null;
  /** PR7: Continuous touch pattern scores (EMA-smoothed 0..1) */
  touch_pattern_scores?: { tap: number; repeat: number; hold: number; stroke: number };
  /** PR9-A: Current activity mode */
  mode_state?: 'sleep' | 'wake' | 'dream';
  /** PR9-A: Wake-leaning drive */
  wake_drive?: number;
  /** PR9-A: Sleep pressure */
  sleep_pressure?: number;
  /** PR9-A: Dream pressure */
  dream_pressure?: number;
  /** PR11: Organism state - activity capacity */
  energy?: number;
  /** PR11: Organism state - internal coherence */
  stability?: number;
  /** PR11: Organism state - excessive input burden */
  overload?: number;
  /** PR11: Organism drives - rest pressure */
  rest_drive?: number;
  /** PR11: Organism drives - orienting pressure */
  orienting_drive?: number;
  /** PR11: Action state - current primitive action tendency */
  action_state?: 'idle' | 'orient' | 'withdraw' | 'settle';
}

/** Placeholder for future Signal→Torus feedback (next phase). */
export interface SignalFeedback {
  inject_region?: { i: number; j: number; strength: number };
  modulate_damping?: number;
  highlight_hubs?: string[];
}

/** Minimal interface for the network object used by applySignalFeedback. */
export interface AeternaNetworkLike {
  numNodes: number;
}

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
    dominantPattern?: 'tap' | 'repeat' | 'hold' | 'stroke' | null;
    touchPatternScores?: { tap: number; repeat: number; hold: number; stroke: number };
    modeState?: 'sleep' | 'wake' | 'dream';
    wakeDrive?: number;
    sleepPressure?: number;
    dreamPressure?: number;
    energy?: number;
    stability?: number;
    overload?: number;
    restDrive?: number;
    orientingDrive?: number;
    actionState?: 'idle' | 'orient' | 'withdraw' | 'settle';
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
    rest_drive: dyn.restDrive,
    orienting_drive: dyn.orientingDrive,
    action_state: dyn.actionState,
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
