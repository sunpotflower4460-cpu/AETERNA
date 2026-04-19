/**
 * Core Constants and IDs
 *
 * Centralized constants, enums, and identifiers for AETERNA organism core.
 * This prevents duplication and provides a single source of truth.
 */

// Re-export existing constants
export {
  PHI,
  PHI_INV,
  SCHUMANN_RES,
  GAMMA_SYNC,
  HEART_CLOCK_HZ,
  PULSE_STRENGTH,
  TENSION_LAMBDA,
  TENSION_90S_FRAMES,
  PRESETS,
} from '../constants/aeternaConstants.js';

/**
 * Signal source identifiers
 * These identify different types of signals/stimuli in the system
 */
export const SIGNAL_SOURCE = {
  /** Hardware random noise */
  HARDWARE_RANDOM: 'hardware_random',
  /** Heartbeat pulse */
  HEARTBEAT: 'heartbeat',
  /** Touch input */
  TOUCH: 'touch',
  /** Sound input */
  SOUND: 'sound',
  /** Light input */
  LIGHT: 'light',
  /** Motion input */
  MOTION: 'motion',
  /** Time/circadian */
  TIME: 'time',
  /** Prediction error */
  PREDICTION_ERROR: 'prediction_error',
  /** Rewrite/plasticity */
  REWRITE: 'rewrite',
  /** Mode transition */
  MODE_TRANSITION: 'mode_transition',
  /** Action pulse */
  ACTION_PULSE: 'action_pulse',
} as const;

export type SignalSource = typeof SIGNAL_SOURCE[keyof typeof SIGNAL_SOURCE];

/**
 * Node layer identifiers
 */
export const NODE_LAYER = {
  LAYER_0: 0,
  LAYER_1: 1,
  LAYER_2: 2,
} as const;

/**
 * Node type identifiers
 */
export const NODE_TYPE = {
  EXCITATORY: 0,
  INHIBITORY: 1,
} as const;

/**
 * Mode state constants
 */
export const MODE_STATE = {
  WAKE: 'wake',
  SLEEP: 'sleep',
  DREAM: 'dream',
} as const;

export type ModeState = typeof MODE_STATE[keyof typeof MODE_STATE];

/**
 * Action state constants
 */
export const ACTION_STATE = {
  IDLE: 'idle',
  ORIENT: 'orient',
  EXPLORE: 'explore',
  WITHDRAW: 'withdraw',
  SETTLE: 'settle',
} as const;

export type ActionState = typeof ACTION_STATE[keyof typeof ACTION_STATE];

/**
 * Touch pattern constants
 */
export const TOUCH_PATTERN = {
  TAP: 'tap',
  HOLD: 'hold',
  STROKE: 'stroke',
  REPEAT: 'repeat',
} as const;

export type TouchPattern = typeof TOUCH_PATTERN[keyof typeof TOUCH_PATTERN];

/**
 * Rewrite tendency constants
 */
export const REWRITE_TENDENCY = {
  NONE: 'none',
  NOVELTY: 'novelty',
  RECURRENCE: 'recurrence',
  PERSISTENCE: 'persistence',
  DIRECTIONALITY: 'directionality',
} as const;

export type RewriteTendency = typeof REWRITE_TENDENCY[keyof typeof REWRITE_TENDENCY];

/**
 * Common activation function helpers
 * (These can be moved here to reduce duplication across files)
 */

/**
 * Clamp value to [min, max], with fallback for non-finite values
 */
export function clampFinite(value: number, min: number, max: number, fallback = 0): number {
  if (!Number.isFinite(value)) return fallback;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/**
 * Clamp value to [0, 1]
 */
export function clamp01(value: number, fallback = 0): number {
  return clampFinite(value, 0, 1, fallback);
}

/**
 * Sigmoid activation
 */
export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Tanh activation
 */
export function tanhActivation(x: number): number {
  return Math.tanh(x);
}

/**
 * ReLU activation
 */
export function relu(x: number): number {
  return Math.max(0, x);
}

/**
 * Leaky ReLU activation
 */
export function leakyRelu(x: number, alpha = 0.01): number {
  return x > 0 ? x : alpha * x;
}
