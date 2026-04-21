/**
 * Arousal / Awareness-like Availability State
 *
 * AETERNA v0.5 / A2: Separates activity level from foreground availability.
 *
 * Important:
 * - This is a derived internal state, not a human consciousness model.
 * - Values remain continuous and softly changing.
 * - "awareness" here means foreground availability / passage window only.
 */
export interface ArousalAwarenessState {
  /** Frame timestamp */
  timestamp: number;

  /** Activity height / activation load */
  arousalLevel: number;

  /** Availability window for foreground formation */
  awarenessWindow: number;

  /** Openness for novelty / mismatch / stimulus passage */
  salienceOpenness: number;

  /** Current pressure for something to move into foreground */
  foregroundPressure: number;

  /** Quiet-depth / rest-side settling depth */
  restDepth: number;

  /** Sharp reactive edge when arousal outruns organization */
  hyperreactivity: number;

  /** Available room for re-settling after perturbation */
  settlingWindow: number;
}
