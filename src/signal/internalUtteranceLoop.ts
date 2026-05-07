/**
 * InternalUtteranceLoop (Phase C-2)
 *
 * Extracts a small numeric meta-feature vector from a SignalRuntimeResult so
 * the system's own "spoken" tendency can be folded back into its sensing
 * surface as an internal sensory channel — without ever propagating the
 * utterance text itself.
 *
 * Why meta-features only
 *   The plan we agreed with the user (Phase C-2) says the InternalUtterance
 *   loop must surface only quantitative features (answerPressure, fragility,
 *   unfinishedness, stance valence). Free text bypassing the Bridge sanitizer
 *   would weaken the existing AETERNA-to-Node boundary; numeric features do
 *   not. The output type therefore intentionally omits rawText / tokens /
 *   utterance / glossJa / sentencePlan.
 *
 * Scope
 *   Pure read of SignalRuntimeResult. Returns one packet. Does not modify
 *   any input. Phase C-2 also exports a stable list of field names so a
 *   guard test can assert that no text-bearing field ever sneaks in.
 *
 * Phase D (future) wiring
 *   The packet may be folded into deriveSensoryReturn as a new internal
 *   channel. Phase C-2 does not perform that wiring; it only provides the
 *   pure extraction.
 */
import type { SignalDecision, SignalRuntimeResult } from './types.ts';

/**
 * Numeric meta-feature vector. Every field is a finite number; no strings.
 *
 * If you add a field, also append it to INTERNAL_UTTERANCE_META_FIELDS so the
 * leak guard test will pick it up and refuse strings.
 */
export interface InternalUtteranceMetaPacket {
  /** Frame timestamp. */
  timestamp: number;
  /** Pressure to answer (0..1). Mirrors SignalField.answerPressure. */
  answerPressure: number;
  /** Fragility / vulnerability surface (0..1). Mirrors SignalField.fragility. */
  fragility: number;
  /** Unfinishedness / open-endedness (0..1). Mirrors SignalField.unfinishedness. */
  unfinishedness: number;
  /**
   * Stance valence in [-1, 1].
   * 'hold' → -0.3 (held back), 'soft_answer' → 0.3, 'answer' → 0.7,
   * 'open_reflect' → 0.1.
   */
  stanceValence: number;
  /**
   * 0..1. How much was held back (SignalDecision.withheldBias). Useful as a
   * pressure proxy: high withheld bias means the system stayed silent
   * despite urge to speak.
   */
  withheldBias: number;
  /** Whether the original signal runtime emitted any utterance text. */
  hasUtterance: boolean;
  /** Number of signals that contributed to the runtime result (count, not labels). */
  signalCount: number;
  /** Number of bindings that contributed (count, not source/target labels). */
  bindingCount: number;
}

/**
 * Field names of InternalUtteranceMetaPacket. Tests assert that the output
 * carries exactly these and nothing else, so no text-bearing field can sneak
 * in via a future refactor.
 */
export const INTERNAL_UTTERANCE_META_FIELDS = Object.freeze([
  'timestamp',
  'answerPressure',
  'fragility',
  'unfinishedness',
  'stanceValence',
  'withheldBias',
  'hasUtterance',
  'signalCount',
  'bindingCount',
] as const);

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function clampSigned(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= -1) return -1;
  if (value >= 1) return 1;
  return value;
}

/**
 * Map a SignalDecision.stance to a bounded valence value. The mapping is
 * intentionally small (|valence| ≤ 0.7) so this single feature cannot
 * dominate the meta vector.
 */
export function stanceValenceFor(stance: SignalDecision['stance']): number {
  switch (stance) {
    case 'hold':
      return -0.3;
    case 'soft_answer':
      return 0.3;
    case 'answer':
      return 0.7;
    case 'open_reflect':
      return 0.1;
    default: {
      // Defensive: if a future stance value is added we still produce a
      // finite number rather than NaN. The exhaustiveness check would catch
      // this in TypeScript strict mode. Returning 0 is safe.
      const _exhaustive: never = stance;
      void _exhaustive;
      return 0;
    }
  }
}

/**
 * Pure extraction. Inputs are not mutated. Returns a fresh meta packet.
 */
export function deriveInternalUtteranceMeta(
  signal: SignalRuntimeResult,
  timestamp: number,
): InternalUtteranceMetaPacket {
  const field = signal.field;
  const decision = signal.decision;

  return {
    timestamp,
    answerPressure: clamp01(field.answerPressure),
    fragility: clamp01(field.fragility),
    unfinishedness: clamp01(field.unfinishedness),
    stanceValence: clampSigned(stanceValenceFor(decision.stance)),
    withheldBias: clamp01(decision.withheldBias),
    hasUtterance: typeof signal.utterance === 'string' && signal.utterance.length > 0,
    signalCount: signal.signals.length,
    bindingCount: signal.bindings.length,
  };
}

/**
 * Construct a zero packet. Useful when no signal runtime ran on the current
 * tick but downstream consumers still expect a stable shape.
 */
export function createZeroInternalUtteranceMeta(timestamp = 0): InternalUtteranceMetaPacket {
  return {
    timestamp,
    answerPressure: 0,
    fragility: 0,
    unfinishedness: 0,
    stanceValence: 0,
    withheldBias: 0,
    hasUtterance: false,
    signalCount: 0,
    bindingCount: 0,
  };
}
