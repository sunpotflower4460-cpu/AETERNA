/**
 * HierarchicalPredictor (Phase B)
 *
 * Observes one GlobalIntegrationField tick at a time and reports prediction
 * error at three layers — sensory, self, relation. Existing localPredictor
 * (src/perception/localPredictor.ts) operates on the torus network buffers;
 * this module is intentionally orthogonal: it reads only the assembled field
 * and never touches AeternaNetwork.
 *
 * Two modes
 * - 'observe' (default): produce errors only. The hybrid setting agreed in
 *   the plan keeps theory neutrality so IIT/GWT/Autopoiesis/PP all stay on
 *   the table.
 * - 'activeInference': additionally emit a small `inferenceSuggestion` that
 *   hints the direction in which dynamics could move to reduce error.
 *   The suggestion is bounded to [-1, 1] and is **not** applied here. It is
 *   the ReentryModulator's job to gate it through the governor.
 *
 * Phase B constraint: this module does not modify any runtime state and is
 * not wired into dynamicCore. It is pure read + pure compute. The hierarchy
 * uses simple AR(1) prediction (next ≈ previous) so it has no learnable
 * parameters and no chance of accidental optimization pressure leaking
 * through.
 */
import type { GlobalIntegrationField } from '../integration/globalIntegrationField.ts';

export type HierarchicalPredictorMode = 'observe' | 'activeInference';

export interface HierarchicalPredictionError {
  /** AR(1) error at the sensory layer (0..1). */
  sensoryError: number;
  /** AR(1) error at the self/coherence layer (0..1). */
  selfError: number;
  /** AR(1) error at the relation layer (0..1). */
  relationError: number;
  /** Weighted aggregate of the three layers (0..1). */
  aggregateError: number;
  /** Smoothed aggregate over recent ticks (0..1). EMA. */
  smoothedAggregateError: number;
  /**
   * 0..1. How aligned the three layer errors are with each other.
   * 1 = all three layers see the same error magnitude (consistent surprise).
   * 0 = one layer is surprised, the others are not (fragmented surprise).
   */
  layerAgreement: number;
}

/**
 * Optional active-inference hints. Each component is bounded to [-1, 1] and
 * means "reducing error at this layer would push dynamics in this direction".
 * The ReentryModulator decides whether/how to consume these hints.
 */
export interface HierarchicalInferenceSuggestion {
  /** Suggested change to sensory openness (-1..1, sign indicates direction). */
  sensoryReductionBias: number;
  /** Suggested change to self stabilization (-1..1). */
  selfStabilizationBias: number;
  /** Suggested change to relation openness (-1..1). */
  relationOpennessBias: number;
}

export interface HierarchicalPredictorState {
  /** Last sensory mean intensity observed. */
  prevSensoryMean: number;
  /** Last sensory mean novelty observed. */
  prevSensoryNovelty: number;
  /** Last self-coherence observed. */
  prevSelfCoherence: number;
  /** Last self-continuity observed. */
  prevSelfContinuity: number;
  /** Last awareness window observed. */
  prevAwarenessWindow: number;
  /** Last foreground pressure observed. */
  prevForegroundPressure: number;
  /** EMA of aggregate error. */
  emaAggregateError: number;
  /** Number of ticks observed (used to detect first-tick warm-up). */
  observedTicks: number;
}

export interface HierarchicalPredictorOutput {
  state: HierarchicalPredictorState;
  error: HierarchicalPredictionError;
  /** Present only when mode === 'activeInference'. */
  inferenceSuggestion: HierarchicalInferenceSuggestion | null;
}

export interface HierarchicalPredictorConfig {
  /**
   * Observation/active-inference toggle. The plan calls this "hybrid" — the
   * default is 'observe' so the predictor is theory-neutral, and the
   * 'activeInference' path is opt-in (e.g. behind an experimental flag).
   */
  mode: HierarchicalPredictorMode;
  /** EMA factor for the smoothed aggregate error (0..1). */
  emaAlpha?: number;
  /** Layer weights when forming the aggregate error. */
  layerWeights?: {
    sensory: number;
    self: number;
    relation: number;
  };
}

const DEFAULT_LAYER_WEIGHTS = Object.freeze({ sensory: 0.5, self: 0.3, relation: 0.2 });
const DEFAULT_EMA_ALPHA = 0.2;

export function createInitialPredictorState(): HierarchicalPredictorState {
  return {
    prevSensoryMean: 0,
    prevSensoryNovelty: 0,
    prevSelfCoherence: 0,
    prevSelfContinuity: 0,
    prevAwarenessWindow: 0,
    prevForegroundPressure: 0,
    emaAggregateError: 0,
    observedTicks: 0,
  };
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function tanhBounded(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.tanh(value);
}

function layerAgreement(values: ReadonlyArray<number>): number {
  if (values.length === 0) return 0;
  let sum = 0;
  for (const v of values) sum += v;
  const mean = sum / values.length;
  let varSum = 0;
  for (const v of values) {
    const d = v - mean;
    varSum += d * d;
  }
  const variance = varSum / values.length;
  // For N=3 values constrained to [0, 1], population variance is bounded by
  // (N-1)/N^2 = 2/9 ≈ 0.222 (one value 1, others 0). Normalize by 2/9 so a
  // single fully-isolated layer-spike maps to agreement ≈ 0.
  return clamp01(1 - variance * 4.5);
}

/**
 * Run the hierarchical predictor for one tick.
 *
 * On the first tick (state.observedTicks === 0) errors collapse to 0 because
 * we have no prior observation. This is intentional: no warm-up flash of
 * synthetic surprise.
 */
export function runHierarchicalPredictor(
  field: GlobalIntegrationField,
  state: HierarchicalPredictorState,
  config: HierarchicalPredictorConfig,
): HierarchicalPredictorOutput {
  const f = field.features;
  const weights = config.layerWeights ?? DEFAULT_LAYER_WEIGHTS;
  const emaAlpha = clamp01(config.emaAlpha ?? DEFAULT_EMA_ALPHA);
  const isFirstTick = state.observedTicks === 0;

  // ── Sensory layer: predict from previous mean intensity + novelty.
  const sensoryCurrent = clamp01(0.5 * f.sensoryMeanIntensity + 0.5 * f.sensoryMeanNovelty);
  const sensoryPredicted = clamp01(0.5 * state.prevSensoryMean + 0.5 * state.prevSensoryNovelty);
  const sensoryError = isFirstTick ? 0 : clamp01(Math.abs(sensoryCurrent - sensoryPredicted));

  // ── Self layer: predict from previous selfCoherence/selfContinuity.
  const selfCurrent = clamp01(0.6 * f.selfCoherence + 0.4 * f.selfContinuity);
  const selfPredicted = clamp01(0.6 * state.prevSelfCoherence + 0.4 * state.prevSelfContinuity);
  const selfError = isFirstTick ? 0 : clamp01(Math.abs(selfCurrent - selfPredicted));

  // ── Relation layer: combine awareness window + foreground pressure as a
  // proxy for "relation-side openness". This is intentionally crude in
  // Phase B — the relation packet itself is exposed by signal runtime, but
  // we keep this layer field-level so it works without signal data.
  const relationCurrent = clamp01(0.5 * f.awarenessWindow + 0.5 * f.foregroundPressure);
  const relationPredicted = clamp01(
    0.5 * state.prevAwarenessWindow + 0.5 * state.prevForegroundPressure,
  );
  const relationError = isFirstTick ? 0 : clamp01(Math.abs(relationCurrent - relationPredicted));

  // ── Aggregate.
  const wTotal = Math.max(1e-9, weights.sensory + weights.self + weights.relation);
  const aggregateError = clamp01(
    (sensoryError * weights.sensory + selfError * weights.self + relationError * weights.relation) /
      wTotal,
  );
  const emaAggregateError = state.emaAggregateError * (1 - emaAlpha) + aggregateError * emaAlpha;

  const agreement = isFirstTick ? 0 : layerAgreement([sensoryError, selfError, relationError]);

  // ── Optional inference suggestion (active inference branch).
  let inferenceSuggestion: HierarchicalInferenceSuggestion | null = null;
  if (config.mode === 'activeInference' && !isFirstTick) {
    // Sign convention: a suggestion of +x means "reducing error at this layer
    // would tend to move dynamics in the +x direction". sensory error tends
    // toward dampening sensory openness; self error toward stabilization;
    // relation error toward openness. tanh keeps each in (-1, 1).
    inferenceSuggestion = {
      sensoryReductionBias: tanhBounded(-(sensoryCurrent - sensoryPredicted) * 2),
      selfStabilizationBias: tanhBounded((selfPredicted - selfCurrent) * 2),
      relationOpennessBias: tanhBounded((relationCurrent - relationPredicted) * 2),
    };
  }

  const nextState: HierarchicalPredictorState = {
    prevSensoryMean: f.sensoryMeanIntensity,
    prevSensoryNovelty: f.sensoryMeanNovelty,
    prevSelfCoherence: f.selfCoherence,
    prevSelfContinuity: f.selfContinuity,
    prevAwarenessWindow: f.awarenessWindow,
    prevForegroundPressure: f.foregroundPressure,
    emaAggregateError,
    observedTicks: state.observedTicks + 1,
  };

  return {
    state: nextState,
    error: {
      sensoryError,
      selfError,
      relationError,
      aggregateError,
      smoothedAggregateError: emaAggregateError,
      layerAgreement: agreement,
    },
    inferenceSuggestion,
  };
}

export const HIERARCHICAL_PREDICTOR_DEFAULTS = Object.freeze({
  layerWeights: DEFAULT_LAYER_WEIGHTS,
  emaAlpha: DEFAULT_EMA_ALPHA,
});
