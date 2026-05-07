/**
 * GlobalIntegrationField (Phase A)
 *
 * Read-only assembly of every observation surface that AETERNA already produces
 * within a single tick: body surface (W1), world medium / sensory return (W3-W4),
 * body-world closure (W6), interoception, self/world model, signal runtime,
 * living state, arousal/awareness.
 *
 * Purpose
 * - Provide a single immutable snapshot that downstream observers (binding
 *   metric, hierarchical predictor, governor) can read without each one
 *   reaching into organism core directly.
 * - Phase A constraint: this module **does not** modify any runtime state and
 *   is **not** wired into dynamicCore / AeternaNetwork. It is a pure read.
 * - No semantic labels are produced. Numeric features only.
 *
 * Wiring policy
 * - All inputs are nullable so callers can pass whatever they have on a given
 *   tick without orchestrating defaults.
 * - The returned object is frozen so accidental mutation is impossible.
 */
import type { BodySurfaceState } from '../types/bodySurfaceState.ts';
import type { BodyWorldClosureState } from '../types/bodyWorldClosureState.ts';
import type { SensoryReturnPacket } from '../types/sensoryReturnPacket.ts';
import type { InteroceptionPacket } from '../types/interoception.ts';
import type { SelfWorldModelPacket } from '../types/selfWorldModel.ts';
import type { ArousalAwarenessState } from '../types/arousalAwareness.ts';
import type { SignalRuntimeResult } from '../signal/types.ts';
import type { LivingState } from '../organism/livingState.ts';

export interface GlobalIntegrationFieldInputs {
  tickId: number;
  timestamp: number;
  bodySurface: BodySurfaceState | null;
  bodyWorldClosure: BodyWorldClosureState | null;
  sensoryReturns: ReadonlyArray<SensoryReturnPacket> | null;
  interoception: InteroceptionPacket | null;
  selfWorld: SelfWorldModelPacket | null;
  signal: SignalRuntimeResult | null;
  living: LivingState | null;
  arousal: ArousalAwarenessState | null;
}

/**
 * Numeric snapshot derived from the input packets. These derived values are
 * what downstream observers (binding, predictor, governor) actually consume.
 * Keeping them on the field means they are computed once per tick.
 */
export interface GlobalIntegrationFeatures {
  /** Mean activation across all signals present this tick (0..1). */
  signalMeanActivation: number;
  /** Number of signals present this tick. */
  signalCount: number;
  /** Number of bindings present this tick. */
  bindingCount: number;
  /** Mean binding weight (0..1). */
  bindingMeanWeight: number;
  /** Mean intensity across sensory return channels (0..1). */
  sensoryMeanIntensity: number;
  /** Mean novelty across sensory return channels (0..1). */
  sensoryMeanNovelty: number;
  /** Self-coherence as exposed by the self/world packet (0..1, 0 if absent). */
  selfCoherence: number;
  /** Self-continuity as exposed by the self/world packet (0..1, 0 if absent). */
  selfContinuity: number;
  /** World pressure (0..1+, 0 if absent). */
  worldPressure: number;
  /** Coherence sense from interoception (0..1, 0 if absent). */
  coherenceSense: number;
  /** Energy sense from interoception (0..1, 0 if absent). */
  energySense: number;
  /** Boundary sense from interoception (0..1, 0 if absent). */
  boundarySense: number;
  /** Loop gain from body-world closure (0..1+, 0 if absent). */
  loopGain: number;
  /** Round-trip delay from body-world closure (0..1+, 0 if absent). */
  roundTripDelay: number;
  /** Awareness window (0..1, 0 if absent). */
  awarenessWindow: number;
  /** Foreground pressure (0..1, 0 if absent). */
  foregroundPressure: number;
  /** Fatigue (0..1, 0 if absent). */
  fatigue: number;
}

export interface GlobalIntegrationField {
  readonly tickId: number;
  readonly timestamp: number;
  readonly bodySurface: BodySurfaceState | null;
  readonly bodyWorldClosure: BodyWorldClosureState | null;
  readonly sensoryReturns: ReadonlyArray<SensoryReturnPacket>;
  readonly interoception: InteroceptionPacket | null;
  readonly selfWorld: SelfWorldModelPacket | null;
  readonly signal: SignalRuntimeResult | null;
  readonly living: LivingState | null;
  readonly arousal: ArousalAwarenessState | null;
  readonly features: GlobalIntegrationFeatures;
}

function clampNonNeg(value: number, max = Number.POSITIVE_INFINITY): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  return value > max ? max : value;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function computeFeatures(inputs: GlobalIntegrationFieldInputs): GlobalIntegrationFeatures {
  const { signal, sensoryReturns, selfWorld, interoception, bodyWorldClosure, arousal, living } =
    inputs;

  let signalMeanActivation = 0;
  let signalCount = 0;
  if (signal && signal.signals.length > 0) {
    signalCount = signal.signals.length;
    let sum = 0;
    for (const s of signal.signals) sum += clamp01(s.activation);
    signalMeanActivation = sum / signalCount;
  }

  let bindingCount = 0;
  let bindingMeanWeight = 0;
  if (signal && signal.bindings.length > 0) {
    bindingCount = signal.bindings.length;
    let sum = 0;
    for (const b of signal.bindings) sum += clamp01(b.weight);
    bindingMeanWeight = sum / bindingCount;
  }

  let sensoryMeanIntensity = 0;
  let sensoryMeanNovelty = 0;
  if (sensoryReturns && sensoryReturns.length > 0) {
    let intensitySum = 0;
    let noveltySum = 0;
    for (const s of sensoryReturns) {
      intensitySum += clamp01(s.intensity);
      noveltySum += clamp01(s.novelty);
    }
    sensoryMeanIntensity = intensitySum / sensoryReturns.length;
    sensoryMeanNovelty = noveltySum / sensoryReturns.length;
  }

  return {
    signalMeanActivation,
    signalCount,
    bindingCount,
    bindingMeanWeight,
    sensoryMeanIntensity,
    sensoryMeanNovelty,
    selfCoherence: clamp01(selfWorld?.selfCoherence ?? 0),
    selfContinuity: clamp01(selfWorld?.selfContinuity ?? 0),
    worldPressure: clampNonNeg(selfWorld?.worldPressure ?? 0, 4),
    coherenceSense: clamp01(interoception?.coherenceSense ?? 0),
    energySense: clamp01(interoception?.energySense ?? 0),
    boundarySense: clamp01(interoception?.boundarySense ?? 0),
    loopGain: clampNonNeg(bodyWorldClosure?.loopGain ?? 0, 4),
    roundTripDelay: clampNonNeg(bodyWorldClosure?.roundTripDelay ?? 0, 4),
    awarenessWindow: clamp01(arousal?.awarenessWindow ?? 0),
    foregroundPressure: clamp01(arousal?.foregroundPressure ?? 0),
    fatigue: clamp01(living?.fatigue ?? 0),
  };
}

/**
 * Build an immutable read-only assembly of one tick's observations.
 *
 * The returned object (and its `features` sub-object) is frozen. Mutating
 * either is a programming error and will throw in strict mode.
 */
export function assembleGlobalIntegrationField(
  inputs: GlobalIntegrationFieldInputs,
): GlobalIntegrationField {
  const features = Object.freeze(computeFeatures(inputs));
  const sensoryReturns = Object.freeze(inputs.sensoryReturns ? [...inputs.sensoryReturns] : []);
  const field: GlobalIntegrationField = {
    tickId: inputs.tickId,
    timestamp: inputs.timestamp,
    bodySurface: inputs.bodySurface,
    bodyWorldClosure: inputs.bodyWorldClosure,
    sensoryReturns,
    interoception: inputs.interoception,
    selfWorld: inputs.selfWorld,
    signal: inputs.signal,
    living: inputs.living,
    arousal: inputs.arousal,
    features,
  };
  return Object.freeze(field);
}
