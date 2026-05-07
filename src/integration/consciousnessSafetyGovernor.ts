/**
 * ConsciousnessSafetyGovernor (Phase A)
 *
 * Single choke-point that any future re-entry path (observer → core) must
 * respect. In Phase A no re-entry path exists yet, so this module is set up
 * with `globalGain = 0` and serves as the place where future Phase B/C
 * Reentry deltas will be gated.
 *
 * Design promises
 * - When `enabled === false`, downstream code reading `globalGain` must
 *   read 0. There is no other way to disable feedback.
 * - The governor is a pure data structure plus pure update functions. It
 *   does **not** import anything from `src/core/`. This keeps the audit
 *   guarantee that core never imports a feedback path.
 * - `tripGovernor` is the only way to set `enabled` to false. It records
 *   the reason and timestamp so an operator can inspect why the system
 *   shut its own feedback off.
 *
 * Trip conditions (drawn from the design plan, surfaced as predicates so they
 * can be unit-tested independently of any real runtime):
 *   1. Re-entry deltas saturate against the clamp >= 95% for >= 5 ticks
 *   2. Energy stays below 0.05 for >= 30 ticks
 *   3. Binding strength rises faster than the runaway threshold
 *   4. Self-coherence stays below 0.10 for >= 60 ticks
 *   5. Internal-utterance recursion depth exceeds 2
 *
 * Phase A only implements (2) (3) (4). (1) and (5) are anchored as fields
 * on the input shape so Phase B/C can light them up without changing the
 * governor's I/O.
 */

export type GovernorTripReason =
  | 'reentrySaturationLockIn'
  | 'energyCollapse'
  | 'bindingRunaway'
  | 'selfCoherenceCollapse'
  | 'utteranceRecursion';

export interface GovernorTripRecord {
  reason: GovernorTripReason;
  tickId: number;
  timestamp: number;
  detail: string;
}

export interface ConsciousnessSafetyGovernorState {
  /** Whether the governor permits any re-entry at all. */
  enabled: boolean;
  /** Master gain applied to every Reentry delta. 0 in Phase A. */
  globalGain: number;
  /** Most recent trip reason, or null if never tripped. */
  lastTripReason: GovernorTripReason | null;
  /** Bounded history of trip events (most recent last). */
  history: ReadonlyArray<GovernorTripRecord>;
  /** Consecutive ticks that low-energy condition has held. */
  lowEnergyStreak: number;
  /** Consecutive ticks that low-coherence condition has held. */
  lowCoherenceStreak: number;
  /** Consecutive ticks that the saturation condition has held. */
  saturationStreak: number;
  /** Smoothed binding strength, used to detect runaway slope. */
  smoothedBindingStrength: number;
}

export interface GovernorUpdateInputs {
  tickId: number;
  timestamp: number;
  energy: number;
  selfCoherence: number;
  bindingStrength: number;
  /** Optional: |Σ deltas| / clampSum, in 0..1, where 1 means fully saturated. */
  saturationRatio?: number;
  /** Optional: utterance recursion depth (Phase C). */
  utteranceRecursionDepth?: number;
}

/**
 * Hard ceiling on the governor's globalGain. Phase B opens the path for
 * non-zero gain but never above this bound. Phase C may revisit, but
 * setGovernorGain enforces it unconditionally.
 */
export const GOVERNOR_GAIN_HARD_CAP = 0.04;

/** Maximum number of trip records retained in history. */
const HISTORY_CAPACITY = 32;
/** Smoothing factor for binding strength EMA. */
const BINDING_EMA_ALPHA = 0.2;
/** Per-tick rise in binding strength that counts as a runaway. */
const BINDING_RUNAWAY_SLOPE = 0.25;
const ENERGY_FLOOR = 0.05;
const ENERGY_FLOOR_STREAK = 30;
const COHERENCE_FLOOR = 0.10;
const COHERENCE_FLOOR_STREAK = 60;
const SATURATION_THRESHOLD = 0.95;
const SATURATION_STREAK = 5;
const UTTERANCE_DEPTH_LIMIT = 2;

export function createInitialGovernor(): ConsciousnessSafetyGovernorState {
  return {
    enabled: true,
    // Phase A: gain is 0. No Reentry path consumes this yet, but downstream
    // code should already read it through `governorGlobalGain()` so future
    // phases can lift it without rewriting call sites.
    globalGain: 0,
    lastTripReason: null,
    history: [],
    lowEnergyStreak: 0,
    lowCoherenceStreak: 0,
    saturationStreak: 0,
    smoothedBindingStrength: 0,
  };
}

/**
 * Read the gain that callers should multiply Reentry deltas by. Returns 0
 * whenever the governor is disabled regardless of the stored gain — defense
 * in depth.
 */
export function governorGlobalGain(state: ConsciousnessSafetyGovernorState): number {
  if (!state.enabled) return 0;
  return Math.max(0, Math.min(1, state.globalGain));
}

function appendHistory(
  history: ReadonlyArray<GovernorTripRecord>,
  record: GovernorTripRecord,
): ReadonlyArray<GovernorTripRecord> {
  const next = history.length >= HISTORY_CAPACITY
    ? history.slice(history.length - HISTORY_CAPACITY + 1)
    : history.slice();
  next.push(record);
  return next;
}

/**
 * Force the governor into the disabled state with a recorded reason. Idempotent
 * if the governor is already disabled with the same most-recent reason.
 */
export function tripGovernor(
  state: ConsciousnessSafetyGovernorState,
  reason: GovernorTripReason,
  detail: string,
  tickId: number,
  timestamp: number,
): ConsciousnessSafetyGovernorState {
  const record: GovernorTripRecord = { reason, tickId, timestamp, detail };
  return {
    ...state,
    enabled: false,
    globalGain: 0,
    lastTripReason: reason,
    history: appendHistory(state.history, record),
  };
}

/**
 * Set the master gain. Returns a new state. Enforces:
 *   - Tripped governors stay at 0 regardless of requested value.
 *   - Negative or non-finite values clamp to 0.
 *   - Values above GOVERNOR_GAIN_HARD_CAP clamp to the cap.
 *
 * Phase B is the first phase where this is allowed to be non-zero. Phase A
 * keeps the field at 0 implicitly (createInitialGovernor sets globalGain=0
 * and nothing calls setGovernorGain). Phase B/C wiring must call this
 * explicitly to open the path.
 */
export function setGovernorGain(
  state: ConsciousnessSafetyGovernorState,
  requestedGain: number,
): ConsciousnessSafetyGovernorState {
  if (!state.enabled) {
    // Tripped: stay at 0 no matter what.
    return state.globalGain === 0 ? state : { ...state, globalGain: 0 };
  }
  let clamped = Number.isFinite(requestedGain) ? requestedGain : 0;
  if (clamped < 0) clamped = 0;
  if (clamped > GOVERNOR_GAIN_HARD_CAP) clamped = GOVERNOR_GAIN_HARD_CAP;
  if (clamped === state.globalGain) return state;
  return { ...state, globalGain: clamped };
}

/**
 * Re-enable the governor after a trip. Resets the streak counters but keeps
 * the trip history so operators can audit. Phase A users never call this in
 * normal operation; it exists for tests and for future operator tooling.
 */
export function resetGovernor(
  state: ConsciousnessSafetyGovernorState,
): ConsciousnessSafetyGovernorState {
  return {
    enabled: true,
    globalGain: 0, // Phase A keeps gain at 0 even after reset.
    lastTripReason: null,
    history: state.history,
    lowEnergyStreak: 0,
    lowCoherenceStreak: 0,
    saturationStreak: 0,
    smoothedBindingStrength: 0,
  };
}

function updateStreaks(
  state: ConsciousnessSafetyGovernorState,
  inputs: GovernorUpdateInputs,
): {
  lowEnergyStreak: number;
  lowCoherenceStreak: number;
  saturationStreak: number;
  smoothedBindingStrength: number;
  bindingSlope: number;
} {
  const lowEnergyStreak = inputs.energy < ENERGY_FLOOR
    ? state.lowEnergyStreak + 1
    : 0;
  const lowCoherenceStreak = inputs.selfCoherence < COHERENCE_FLOOR
    ? state.lowCoherenceStreak + 1
    : 0;
  const saturationStreak = (inputs.saturationRatio ?? 0) >= SATURATION_THRESHOLD
    ? state.saturationStreak + 1
    : 0;
  const smoothedBindingStrength = state.smoothedBindingStrength * (1 - BINDING_EMA_ALPHA)
    + Math.max(0, Math.min(1, inputs.bindingStrength)) * BINDING_EMA_ALPHA;
  const bindingSlope = smoothedBindingStrength - state.smoothedBindingStrength;
  return {
    lowEnergyStreak,
    lowCoherenceStreak,
    saturationStreak,
    smoothedBindingStrength,
    bindingSlope,
  };
}

/**
 * Pure update. Returns a new governor state and any trip record. The caller
 * is responsible for storing the new state and observing the trip record.
 *
 * If multiple trip conditions fire on the same tick, the first match wins in
 * the order: utterance recursion → energy collapse → binding runaway →
 * coherence collapse → saturation lock-in. The order is fixed so behavior is
 * deterministic and unit-testable.
 */
export function updateGovernor(
  state: ConsciousnessSafetyGovernorState,
  inputs: GovernorUpdateInputs,
): {
  state: ConsciousnessSafetyGovernorState;
  trip: GovernorTripRecord | null;
} {
  if (!state.enabled) {
    // Once tripped, ignore inputs until reset() is called.
    return { state, trip: null };
  }

  const streaks = updateStreaks(state, inputs);
  const next: ConsciousnessSafetyGovernorState = {
    ...state,
    lowEnergyStreak: streaks.lowEnergyStreak,
    lowCoherenceStreak: streaks.lowCoherenceStreak,
    saturationStreak: streaks.saturationStreak,
    smoothedBindingStrength: streaks.smoothedBindingStrength,
  };

  const utteranceDepth = inputs.utteranceRecursionDepth ?? 0;
  if (utteranceDepth > UTTERANCE_DEPTH_LIMIT) {
    const tripped = tripGovernor(
      next,
      'utteranceRecursion',
      `depth ${utteranceDepth} > ${UTTERANCE_DEPTH_LIMIT}`,
      inputs.tickId,
      inputs.timestamp,
    );
    return { state: tripped, trip: tripped.history[tripped.history.length - 1] };
  }

  if (streaks.lowEnergyStreak >= ENERGY_FLOOR_STREAK) {
    const tripped = tripGovernor(
      next,
      'energyCollapse',
      `energy<${ENERGY_FLOOR} for ${streaks.lowEnergyStreak} ticks`,
      inputs.tickId,
      inputs.timestamp,
    );
    return { state: tripped, trip: tripped.history[tripped.history.length - 1] };
  }

  if (streaks.bindingSlope > BINDING_RUNAWAY_SLOPE) {
    const tripped = tripGovernor(
      next,
      'bindingRunaway',
      `bindingStrength slope ${streaks.bindingSlope.toFixed(3)} > ${BINDING_RUNAWAY_SLOPE}`,
      inputs.tickId,
      inputs.timestamp,
    );
    return { state: tripped, trip: tripped.history[tripped.history.length - 1] };
  }

  if (streaks.lowCoherenceStreak >= COHERENCE_FLOOR_STREAK) {
    const tripped = tripGovernor(
      next,
      'selfCoherenceCollapse',
      `selfCoherence<${COHERENCE_FLOOR} for ${streaks.lowCoherenceStreak} ticks`,
      inputs.tickId,
      inputs.timestamp,
    );
    return { state: tripped, trip: tripped.history[tripped.history.length - 1] };
  }

  if (streaks.saturationStreak >= SATURATION_STREAK) {
    const tripped = tripGovernor(
      next,
      'reentrySaturationLockIn',
      `saturationRatio>=${SATURATION_THRESHOLD} for ${streaks.saturationStreak} ticks`,
      inputs.tickId,
      inputs.timestamp,
    );
    return { state: tripped, trip: tripped.history[tripped.history.length - 1] };
  }

  return { state: next, trip: null };
}

/**
 * Constants exported so tests and Phase B/C wiring can reference the same
 * thresholds rather than redefining them.
 */
export const CONSCIOUSNESS_SAFETY_THRESHOLDS = Object.freeze({
  ENERGY_FLOOR,
  ENERGY_FLOOR_STREAK,
  COHERENCE_FLOOR,
  COHERENCE_FLOOR_STREAK,
  SATURATION_THRESHOLD,
  SATURATION_STREAK,
  BINDING_RUNAWAY_SLOPE,
  UTTERANCE_DEPTH_LIMIT,
  GAIN_HARD_CAP: GOVERNOR_GAIN_HARD_CAP,
});
