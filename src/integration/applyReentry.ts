/**
 * applyReentry (Phase C-1)
 *
 * Helpers that splice ReentryDeltas into the existing organism modulation
 * pipeline without bypassing the audited choke-point.
 *
 * Two consumer surfaces are supported:
 *   - BeautifulLoopModulation (consumed by AeternaNetwork via clamp/smooth)
 *   - the blModulation argument that updateLivingState already accepts
 *
 * Both return new objects; the inputs are never mutated. Phase C-1 only
 * provides these helpers; whether to actually call them per-tick is a
 * decision deferred to Phase D wiring (heartbeat / runtime integration).
 *
 * Audit guarantee: this module imports ReentryDeltas from the modulator
 * but does NOT import or invoke anything from src/core/dynamicCore.ts or
 * src/core/AeternaNetwork.js. Reentry stays at the modulation-bundle level
 * and never bypasses clampModulation in src/core/beautifulLoopModulation.ts.
 */
import type { BeautifulLoopModulation } from '../core/beautifulLoopModulation.ts';
import type { ReentryDeltas } from './reentryModulator.ts';

/**
 * Merge ReentryDeltas into an existing BeautifulLoopModulation bundle.
 * The original five deltas are passed through unchanged; only the four
 * Phase C fields are populated. Pass the result through clampModulation
 * before applying to organism core to enforce per-channel limits.
 */
export function mergeReentryIntoBeautifulLoop(
  base: BeautifulLoopModulation,
  reentry: ReentryDeltas,
): BeautifulLoopModulation {
  return {
    ...base,
    curiosityBiasDelta: reentry.curiosityBiasDelta,
    internalUtteranceBiasDelta: reentry.internalUtteranceBiasDelta,
    bindingCoherenceDelta: reentry.bindingCoherenceDelta,
    hierarchicalErrorBiasDelta: reentry.hierarchicalErrorBiasDelta,
  };
}

/**
 * Pull the four Phase C fields back out of a BeautifulLoopModulation. Returns
 * zeros for absent fields so downstream callers can read a stable shape.
 */
export function extractReentryFromBeautifulLoop(
  modulation: BeautifulLoopModulation,
): ReentryDeltas {
  return {
    curiosityBiasDelta: modulation.curiosityBiasDelta ?? 0,
    internalUtteranceBiasDelta: modulation.internalUtteranceBiasDelta ?? 0,
    bindingCoherenceDelta: modulation.bindingCoherenceDelta ?? 0,
    hierarchicalErrorBiasDelta: modulation.hierarchicalErrorBiasDelta ?? 0,
  };
}

/**
 * Shape that updateLivingState's `blModulation` argument accepts (Phase C
 * extension). Defined here so callers don't have to copy the inline literal
 * type from livingState.ts.
 */
export interface LivingStateReentryInput {
  touchOpennessDelta?: number;
  noveltyBiasDelta?: number;
  curiosityBiasDelta?: number;
  internalUtteranceBiasDelta?: number;
  bindingCoherenceDelta?: number;
  hierarchicalErrorBiasDelta?: number;
}

/**
 * Build the blModulation argument for updateLivingState from a Reentry delta
 * bundle and an optional pair of legacy Beautiful-Loop deltas. Either side
 * can be omitted; missing fields stay undefined and updateLivingState treats
 * them as 0.
 */
export function buildLivingStateReentryInput(
  reentry: ReentryDeltas | null,
  legacy: { touchOpennessDelta?: number; noveltyBiasDelta?: number } | null = null,
): LivingStateReentryInput {
  return {
    touchOpennessDelta: legacy?.touchOpennessDelta,
    noveltyBiasDelta: legacy?.noveltyBiasDelta,
    curiosityBiasDelta: reentry?.curiosityBiasDelta,
    internalUtteranceBiasDelta: reentry?.internalUtteranceBiasDelta,
    bindingCoherenceDelta: reentry?.bindingCoherenceDelta,
    hierarchicalErrorBiasDelta: reentry?.hierarchicalErrorBiasDelta,
  };
}
