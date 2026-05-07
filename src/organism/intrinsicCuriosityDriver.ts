/**
 * IntrinsicCuriosityDriver (Phase C-2)
 *
 * Generates a small, governor-gated actuation seed from sustained
 * hierarchical prediction error. The intent is: when the system is bored
 * (error stays low for a long time) or destabilized (error variance is
 * high), it acquires a slow, internal pressure to produce its own
 * perturbation rather than waiting for the world. This is the autopoiesis-
 * adjacent piece — a primitive organism that pokes its environment to
 * keep its predictive surfaces lively.
 *
 * What this module is NOT
 *   - It does NOT inject perturbations into the runtime. That is Phase D
 *     wiring inside deriveActuationPulse / heartbeat code.
 *   - It does NOT bypass the governor. seedMagnitude is multiplied by
 *     governorGlobalGain(governor) and capped at ≤ 0.05. When the gate
 *     is closed (Phase A invariant: createInitialGovernor has gain=0),
 *     seedMagnitude is exactly 0.
 *   - It does NOT use real randomness. Direction is derived from variance
 *     so the same observed-error trajectory always produces the same seed
 *     direction, which keeps tests deterministic.
 *
 * State
 *   Tracks two long-window EMAs (mean error, error variance) and the
 *   number of ticks observed. The pure function returns the next state
 *   alongside the seed and a 0..1 driveIndex that operators can plot.
 */
import type { HierarchicalPredictionError } from '../perception/hierarchicalPredictor.ts';
import type { ConsciousnessSafetyGovernorState } from '../integration/consciousnessSafetyGovernor.ts';
import {
  GOVERNOR_GAIN_HARD_CAP,
  governorGlobalGain,
} from '../integration/consciousnessSafetyGovernor.ts';

export const INTRINSIC_CURIOSITY_SEED_CAP = 0.05;

export interface IntrinsicCuriosityState {
  /** Long-window EMA of aggregateError. */
  errorEMA: number;
  /** Long-window EMA of (aggregateError - errorEMA)^2. */
  varianceEMA: number;
  /** Tick count, for warm-up disambiguation. */
  observedTicks: number;
  /** Last reported drive index — kept so future ramping/decay can be added. */
  lastDriveIndex: number;
}

export interface IntrinsicCuriosityOutput {
  state: IntrinsicCuriosityState;
  /**
   * Magnitude of the proposed self-driven actuation seed, in [0, 0.05].
   * Always 0 when the governor's gate is closed.
   */
  seedMagnitude: number;
  /**
   * Direction in [-1, 1], deterministic from variance and tick count. A
   * zero magnitude means direction is irrelevant.
   */
  seedDirection: number;
  /**
   * 0..1. How strong the system's internal urge to explore is right now.
   * High when error has been low for a long time (boredom) or when error
   * variance is high (instability). Reported even when the gate is closed
   * so operators can monitor without enabling the path.
   */
  driveIndex: number;
}

export interface IntrinsicCuriosityConfig {
  /** EMA factor for the slow long-window error mean (0..1). */
  errorEmaAlpha?: number;
  /** EMA factor for the variance estimate (0..1). */
  varianceEmaAlpha?: number;
  /**
   * Boredom threshold — when smoothedAggregateError stays below this for
   * a sustained period, drive rises. Default 0.05.
   */
  boredomThreshold?: number;
}

const DEFAULTS = Object.freeze({
  errorEmaAlpha: 0.05,
  varianceEmaAlpha: 0.05,
  boredomThreshold: 0.05,
});

export function createInitialCuriosityState(): IntrinsicCuriosityState {
  return {
    errorEMA: 0,
    varianceEMA: 0,
    observedTicks: 0,
    lastDriveIndex: 0,
  };
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/**
 * Pure function. Returns the next state, the proposed seed magnitude, the
 * seed direction (deterministic), and the drive index for monitoring.
 */
export function deriveIntrinsicCuriositySeed(
  state: IntrinsicCuriosityState,
  hpError: HierarchicalPredictionError,
  governor: ConsciousnessSafetyGovernorState,
  config: IntrinsicCuriosityConfig = {},
): IntrinsicCuriosityOutput {
  const errorAlpha = clamp(config.errorEmaAlpha ?? DEFAULTS.errorEmaAlpha, 0, 1);
  const varianceAlpha = clamp(
    config.varianceEmaAlpha ?? DEFAULTS.varianceEmaAlpha,
    0,
    1,
  );
  const boredomThreshold = clamp(
    config.boredomThreshold ?? DEFAULTS.boredomThreshold,
    0,
    1,
  );

  const aggregateError = clamp(hpError.aggregateError, 0, 1);
  // Update error EMA.
  const errorEMA = state.errorEMA * (1 - errorAlpha) + aggregateError * errorAlpha;
  // Update variance EMA against the prior mean (Welford-like, simplified).
  const deviation = aggregateError - state.errorEMA;
  const varianceEMA =
    state.varianceEMA * (1 - varianceAlpha) + deviation * deviation * varianceAlpha;

  // Boredom: long-window error sits well under the threshold. Maps to 0..1
  // by how far below the threshold we are.
  const boredom = clamp(
    aggregateError < boredomThreshold ? (boredomThreshold - aggregateError) / boredomThreshold : 0,
    0,
    1,
  );

  // Instability: variance is high. variance is bounded by 0.25 for values
  // in [0, 1], so multiply by 4 to land in 0..1.
  const instability = clamp(varianceEMA * 4, 0, 1);

  // Drive index combines boredom and instability. Both contribute. Tick
  // warm-up dampens drive for the first few ticks so the system does not
  // panic from the first observation.
  const warmup = clamp(state.observedTicks / 20, 0, 1);
  const driveIndex = clamp((boredom * 0.6 + instability * 0.4) * warmup, 0, 1);

  // Gate the seed magnitude on the governor.
  const gain = governorGlobalGain(governor);
  // Normalize gain to a [0, 1] multiplier the way ReentryModulator does so
  // semantics stay consistent. Hard cap is GOVERNOR_GAIN_HARD_CAP (0.04).
  const gainNormalized = clamp(gain / Math.max(1e-9, GOVERNOR_GAIN_HARD_CAP), 0, 1);
  const seedMagnitude = clamp(
    driveIndex * INTRINSIC_CURIOSITY_SEED_CAP * gainNormalized,
    0,
    INTRINSIC_CURIOSITY_SEED_CAP,
  );

  // Direction: deterministic from variance and tick parity. Range [-1, 1].
  // Using sin gives smooth direction changes as the system learns.
  const directionPhase = Math.sin(state.observedTicks * 0.37 + varianceEMA * 7);
  const seedDirection = clamp(directionPhase, -1, 1);

  return {
    state: {
      errorEMA,
      varianceEMA,
      observedTicks: state.observedTicks + 1,
      lastDriveIndex: driveIndex,
    },
    seedMagnitude,
    seedDirection,
    driveIndex,
  };
}
