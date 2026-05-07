/**
 * ReentryModulator (Phase B)
 *
 * The single, audited choke-point that any future observer→core feedback
 * must pass through. Phase B builds the path; downstream wiring (livingState
 * additions, beautifulLoopModulation extensions) is deferred to Phase C so
 * that this PR remains purely additive — no existing file changes besides
 * the governor's setGovernorGain helper.
 *
 * Pipeline per tick
 *   1. Read GlobalIntegrationField + PhenomenalBindingMetric +
 *      HierarchicalPredictionError + (optional) HierarchicalInferenceSuggestion.
 *   2. Compute four raw delta candidates from those inputs.
 *   3. Pass each through tanh saturation, then clamp to per-channel limits.
 *   4. EMA-smooth against the previous deltas.
 *   5. Multiply by governorGlobalGain(governor) — which is 0 unless Phase B
 *      explicitly opens the gate via setGovernorGain.
 *   6. Compute saturationRatio so the governor's saturation trip can fire.
 *
 * The output type ReentryDeltas is the only thing future Phase C code is
 * allowed to feed into existing modulation pipelines. The contract:
 * downstream code shall not bypass the EMA, the clamp, or the gain.
 */
import type { GlobalIntegrationField } from './globalIntegrationField.ts';
import type { PhenomenalBindingMetric } from './phenomenalBindingMetric.ts';
import type {
  HierarchicalPredictionError,
  HierarchicalInferenceSuggestion,
} from '../perception/hierarchicalPredictor.ts';
import type { ConsciousnessSafetyGovernorState } from './consciousnessSafetyGovernor.ts';
import { governorGlobalGain } from './consciousnessSafetyGovernor.ts';

/**
 * Per-channel hard caps. These are the "±0.04 max" promise from the design
 * plan, broken out so each channel can be tuned independently. Hierarchical
 * error and binding coherence channels are deliberately tighter than the
 * curiosity channel because they touch self-coherence (a more fragile axis).
 */
export const REENTRY_LIMITS = Object.freeze({
  curiosity: 0.04,
  internalUtterance: 0.03,
  bindingCoherence: 0.03,
  hierarchicalError: 0.03,
});

export interface ReentryDeltas {
  /** Bias toward curiosity-driven actuation (-curiosity..+curiosity). */
  curiosityBiasDelta: number;
  /** Bias toward internal utterance feedback intensity (-internalUtterance..+internalUtterance). */
  internalUtteranceBiasDelta: number;
  /** Bias toward binding coherence (-bindingCoherence..+bindingCoherence). */
  bindingCoherenceDelta: number;
  /** Bias toward hierarchical error reduction (-hierarchicalError..+hierarchicalError). */
  hierarchicalErrorBiasDelta: number;
}

export interface ReentryDiagnostics {
  /**
   * 0..1. |delta| / limit averaged across channels. The governor uses this
   * to detect saturation lock-in (95% saturation for 5 ticks).
   */
  saturationRatio: number;
  /**
   * Sum of signed deltas. Useful for runaway-direction detection in tests
   * and operator tooling.
   */
  totalSignedMagnitude: number;
  /** Whether the governor allowed any non-zero gain this tick. */
  gateOpen: boolean;
}

export interface ReentryModulatorState {
  /** Previous tick's smoothed deltas — fed back through the EMA. */
  smoothedDeltas: ReentryDeltas;
  /** Tick count for warm-up disambiguation. */
  observedTicks: number;
}

export interface ReentryModulatorConfig {
  /** EMA factor for delta smoothing (0..1). */
  emaAlpha?: number;
}

const DEFAULT_EMA_ALPHA = 0.25;

export function createInitialReentryState(): ReentryModulatorState {
  return {
    smoothedDeltas: zeroDeltas(),
    observedTicks: 0,
  };
}

export function zeroDeltas(): ReentryDeltas {
  return {
    curiosityBiasDelta: 0,
    internalUtteranceBiasDelta: 0,
    bindingCoherenceDelta: 0,
    hierarchicalErrorBiasDelta: 0,
  };
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function tanhClamp(rawSigned: number, limit: number): number {
  // tanh keeps the response smooth as raw signal grows; the multiplier sets
  // the asymptotic limit. Then clamp belt-and-suspenders against finite
  // numeric drift.
  const saturated = Math.tanh(rawSigned) * limit;
  return clamp(saturated, -limit, limit);
}

interface ReentryInputs {
  field: GlobalIntegrationField;
  binding: PhenomenalBindingMetric;
  hpError: HierarchicalPredictionError;
  inferenceSuggestion: HierarchicalInferenceSuggestion | null;
  governor: ConsciousnessSafetyGovernorState;
}

/**
 * Pure function. Returns next state, the deltas to apply (already gain-
 * weighted and EMA-smoothed), and diagnostics for the governor to consume.
 *
 * If the governor's gate is closed, every delta is zero and diagnostics
 * report gateOpen=false. Phase A behaviour (gain 0 → all zeros) is preserved
 * because createInitialGovernor stores globalGain=0.
 */
export function deriveReentryDeltas(
  state: ReentryModulatorState,
  inputs: ReentryInputs,
  config: ReentryModulatorConfig = {},
): {
  state: ReentryModulatorState;
  deltas: ReentryDeltas;
  diagnostics: ReentryDiagnostics;
} {
  const gain = governorGlobalGain(inputs.governor);
  const gateOpen = gain > 0;
  const emaAlpha = clamp(config.emaAlpha ?? DEFAULT_EMA_ALPHA, 0, 1);

  if (!gateOpen) {
    // Belt: when the governor is closed, smoothing decays toward zero so a
    // future re-open does not immediately replay yesterday's residue.
    const decayed: ReentryDeltas = {
      curiosityBiasDelta: state.smoothedDeltas.curiosityBiasDelta * (1 - emaAlpha),
      internalUtteranceBiasDelta: state.smoothedDeltas.internalUtteranceBiasDelta * (1 - emaAlpha),
      bindingCoherenceDelta: state.smoothedDeltas.bindingCoherenceDelta * (1 - emaAlpha),
      hierarchicalErrorBiasDelta:
        state.smoothedDeltas.hierarchicalErrorBiasDelta * (1 - emaAlpha),
    };
    return {
      state: {
        smoothedDeltas: decayed,
        observedTicks: state.observedTicks + 1,
      },
      deltas: zeroDeltas(),
      diagnostics: {
        saturationRatio: 0,
        totalSignedMagnitude: 0,
        gateOpen: false,
      },
    };
  }

  const { field, binding, hpError, inferenceSuggestion } = inputs;

  // ── Raw signed candidates per channel.
  // curiosity: rises with smoothedAggregateError, falls with bindingStrength
  // (when the system is already coherent there is no need to drive curiosity).
  const curiosityRaw =
    hpError.smoothedAggregateError * 1.5 - binding.bindingStrength * 0.6;

  // internalUtterance: in Phase B this is a placeholder driven by signal
  // count vs binding coverage. Phase C will replace its source with the
  // InternalUtteranceLoop's meta-feature vector.
  const utteranceRaw =
    field.features.signalMeanActivation * 0.8 - field.features.bindingMeanWeight * 0.5;

  // bindingCoherence: drive toward higher binding when binding strength is
  // low and self-coherence is high (i.e. the system can afford to integrate).
  const bindingRaw =
    (1 - binding.bindingStrength) * field.features.selfCoherence -
    field.features.fatigue * 0.5;

  // hierarchicalError: positive when layers disagree (low agreement) and
  // smoothed error is elevated. Suggestion (if present) fine-tunes sign.
  const hierarchicalRaw =
    hpError.smoothedAggregateError * (1 - hpError.layerAgreement) * 1.2 +
    (inferenceSuggestion?.selfStabilizationBias ?? 0) * 0.4;

  // ── tanh saturation + per-channel clamp.
  const targetCuriosity = tanhClamp(curiosityRaw, REENTRY_LIMITS.curiosity);
  const targetUtterance = tanhClamp(utteranceRaw, REENTRY_LIMITS.internalUtterance);
  const targetBinding = tanhClamp(bindingRaw, REENTRY_LIMITS.bindingCoherence);
  const targetHierarchical = tanhClamp(hierarchicalRaw, REENTRY_LIMITS.hierarchicalError);

  // ── EMA smoothing against previous tick.
  const prev = state.smoothedDeltas;
  const beta = 1 - emaAlpha;
  const smoothedCuriosity = prev.curiosityBiasDelta * beta + targetCuriosity * emaAlpha;
  const smoothedUtterance = prev.internalUtteranceBiasDelta * beta + targetUtterance * emaAlpha;
  const smoothedBinding = prev.bindingCoherenceDelta * beta + targetBinding * emaAlpha;
  const smoothedHierarchical =
    prev.hierarchicalErrorBiasDelta * beta + targetHierarchical * emaAlpha;

  // Re-clamp after EMA in case of cumulative drift.
  const smoothedDeltas: ReentryDeltas = {
    curiosityBiasDelta: clamp(smoothedCuriosity, -REENTRY_LIMITS.curiosity, REENTRY_LIMITS.curiosity),
    internalUtteranceBiasDelta: clamp(
      smoothedUtterance,
      -REENTRY_LIMITS.internalUtterance,
      REENTRY_LIMITS.internalUtterance,
    ),
    bindingCoherenceDelta: clamp(
      smoothedBinding,
      -REENTRY_LIMITS.bindingCoherence,
      REENTRY_LIMITS.bindingCoherence,
    ),
    hierarchicalErrorBiasDelta: clamp(
      smoothedHierarchical,
      -REENTRY_LIMITS.hierarchicalError,
      REENTRY_LIMITS.hierarchicalError,
    ),
  };

  // ── Apply governor master gain. The cap is tight (≤0.04) and the gain
  // is itself ≤ GOVERNOR_GAIN_HARD_CAP, so the gain effectively scales each
  // delta by at most 1.0. We treat gain as a multiplier in [0, 1] by
  // dividing by the cap; this keeps semantics intuitive ("gain at cap = full
  // delta").
  const gainScalar = gain / Math.max(1e-9, REENTRY_LIMITS.curiosity);
  const gainNormalized = clamp(gainScalar, 0, 1);

  const deltas: ReentryDeltas = {
    curiosityBiasDelta: smoothedDeltas.curiosityBiasDelta * gainNormalized,
    internalUtteranceBiasDelta: smoothedDeltas.internalUtteranceBiasDelta * gainNormalized,
    bindingCoherenceDelta: smoothedDeltas.bindingCoherenceDelta * gainNormalized,
    hierarchicalErrorBiasDelta: smoothedDeltas.hierarchicalErrorBiasDelta * gainNormalized,
  };

  // ── Diagnostics — saturation ratio over the per-channel limits.
  const saturationRatio = clamp(
    (Math.abs(deltas.curiosityBiasDelta) / REENTRY_LIMITS.curiosity +
      Math.abs(deltas.internalUtteranceBiasDelta) / REENTRY_LIMITS.internalUtterance +
      Math.abs(deltas.bindingCoherenceDelta) / REENTRY_LIMITS.bindingCoherence +
      Math.abs(deltas.hierarchicalErrorBiasDelta) / REENTRY_LIMITS.hierarchicalError) /
      4,
    0,
    1,
  );
  const totalSignedMagnitude =
    deltas.curiosityBiasDelta +
    deltas.internalUtteranceBiasDelta +
    deltas.bindingCoherenceDelta +
    deltas.hierarchicalErrorBiasDelta;

  return {
    state: {
      smoothedDeltas,
      observedTicks: state.observedTicks + 1,
    },
    deltas,
    diagnostics: {
      saturationRatio,
      totalSignedMagnitude,
      gateOpen: true,
    },
  };
}
