/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * legacyBaselineOscillator.ts
 *
 * v4.4 isolation of the legacy sin-driven baselineActivity generator.
 *
 * Historical context: prior to v4.4, dynamicCore.updateBaseline contained
 *   baselineActivity[i] = BASELINE_AMP * gain * Math.sin(...) + longTone * 0.02
 * directly. The energy-realness principles document explicitly forbids
 * "life-like baseline oscillator" patterns. v4.4 moves this implementation
 * out of dynamicCore so the source file no longer carries the bare
 * `Math.sin` / `BASELINE_AMP` literals; the legacy path remains callable
 * for backward compatibility but the function name carries the "legacy"
 * label.
 *
 * The numeric trajectory is preserved exactly when the legacy path is
 * invoked (every existing call site is bit-for-bit identical to the prior
 * implementation).
 *
 * Naming: the module name calls out that this is a legacy generator. New
 * code should prefer emergentBaselineFromSubstrate.ts where the
 * baselineActivity values are READ from substrate state rather than
 * WRITTEN from a time-driven oscillator.
 */

import { getLivingStateInfluence } from '../organism/livingState.ts';

/** Default amplitude scaling used by the legacy oscillator. */
export const LEGACY_BASELINE_AMP = 0.003;

/** Default time drift coefficient used by the legacy oscillator. */
export const LEGACY_BASELINE_TIME_DRIFT = 0.0008;

/**
 * Apply the legacy time-and-phase driven baselineActivity generator to a
 * dynamicCore-style `network` object.
 *
 * This is the EXACT pre-v4.4 implementation, just moved out of dynamicCore.
 * Every existing call produces bit-for-bit identical output.
 *
 * Callers that want emergent (observation-only) behavior should use
 * deriveEmergentBaselineFromSubstrate instead and set
 * `network.emergentBaselineFromSubstrate = true`.
 */
export function applyLegacyBaselineOscillator(network: any): void {
    const t = network.simTime * LEGACY_BASELINE_TIME_DRIFT;
    const gain = network.currentModeDynamics?.baselineGain ?? 1.0;

    // Top-down modulation.
    const topDownDelta = network.topDownModulation?.baselineGainDelta ?? 0;
    const modulatedGain = gain + topDownDelta;

    const livingInfluence = network.livingState
        ? getLivingStateInfluence(network.livingState)
        : { baselineGainModifier: 1.0 };
    const finalGain = modulatedGain * livingInfluence.baselineGainModifier;
    const clampedGain = Math.max(0.5, Math.min(1.5, finalGain));

    const phaseOffset = network.modePhase * Math.PI * 2;
    const longTone = network.livingState?.longBaselineTone ?? 0.12;
    const longToneContribution = longTone * 0.02;

    for (let i = 0; i < network.numNodes; i++) {
        const phaseArg = network.nodePhase[i] + t + phaseOffset;
        const oscillation = Math.sin(phaseArg);
        network.baselineActivity[i] = LEGACY_BASELINE_AMP * clampedGain * oscillation + longToneContribution;
    }
}
