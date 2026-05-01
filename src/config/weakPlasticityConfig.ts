/**
 * weakPlasticityConfig.ts
 * N5: Weak Plasticity Channel
 *
 * Configuration for the Weak Plasticity Channel.
 *
 * Design principles:
 * - Default is off (enabled=false) to preserve prior behaviour.
 * - ablationEnabled=true means plasticity is observed but NOT fed back to runtime.
 * - mode='observeOnly' is a secondary safety gate: accumulation is computed but
 *   resistanceScale is never passed to the runtime.
 * - mode='resistanceOnly' is the only mode that may feed resistanceScale to runtime,
 *   and only when enabled=true AND ablationEnabled=false simultaneously.
 * - All influence weights and learning rates are 10^-4 order or below.
 * - This is NOT a learning model, NOT semantic memory, NOT a runtime graph.
 *
 * Reference: docs/weak-plasticity-channel.md
 */

export interface WeakPlasticityConfig {
    /** Master switch. When false, updateWeakPlasticityState is a no-op. */
    enabled: boolean;

    /**
     * When true, plasticity accumulation is computed internally but is never
     * reflected in the runtime medium (resistanceScale is calculated but ignored).
     * This allows safe comparison between ablation-on and ablation-off conditions.
     */
    ablationEnabled: boolean;

    /**
     * Operating mode.
     * - 'off'          : Equivalent to enabled=false; all update logic is skipped.
     * - 'observeOnly'  : Accumulation computed; resistanceScale never exposed.
     * - 'resistanceOnly': resistanceScale may be exposed to runtime when
     *                     enabled=true AND ablationEnabled=false.
     */
    mode: 'off' | 'observeOnly' | 'resistanceOnly';

    /**
     * Base scaling factor for trace accumulation per tick.
     * Default: 1e-4 (10^-4 order, very weak).
     */
    learningRate: number;

    /**
     * Maximum absolute change to any trace per tick.
     * Acts as a hard clamp regardless of input magnitude.
     * Default: 1e-4.
     */
    maxDeltaPerTick: number;

    /**
     * Rate at which accumulated trace decays per unit time.
     * trace *= (1 - accumulationDecayRate * dt)
     * Default: 1e-5 (very slow forgetting).
     */
    accumulationDecayRate: number;

    /**
     * Minimum allowed value for resistanceScale.
     * Prevents runaway reduction of local resistance.
     * Default: 0.95.
     */
    minResistanceScale: number;

    /**
     * Maximum allowed value for resistanceScale.
     * Prevents runaway increase of local resistance.
     * Default: 1.05.
     */
    maxResistanceScale: number;

    /** Relative weight of vortex-candidate contribution to trace. Default: 1.0. */
    vortexInfluence: number;

    /** Relative weight of repeated-flow-path contribution to trace. Default: 0.5. */
    repeatedFlowInfluence: number;

    /** Relative weight of local-excitability contribution to trace. Default: 0.25. */
    localExcitabilityInfluence: number;

    /** Relative weight of membrane-observation contribution to trace. Default: 0.25. */
    membraneInfluence: number;

    /**
     * Minimum candidate confidence required before a candidate contributes to trace.
     * Candidates below this threshold are ignored.
     * Default: 0.6.
     */
    requireConfidenceAbove: number;
}

/**
 * Default configuration — safe side.
 *
 * - enabled=false         : no behaviour change from N4 baseline.
 * - ablationEnabled=true  : even if enabled is flipped, plasticity stays ablated.
 * - mode='observeOnly'    : third safety gate; runtime is never touched.
 * - rates at 10^-4 or below.
 */
export const defaultWeakPlasticityConfig: WeakPlasticityConfig = {
    enabled: false,
    ablationEnabled: true,
    mode: 'observeOnly',
    learningRate: 0.0001,
    maxDeltaPerTick: 0.0001,
    accumulationDecayRate: 0.00001,
    minResistanceScale: 0.95,
    maxResistanceScale: 1.05,
    vortexInfluence: 1.0,
    repeatedFlowInfluence: 0.5,
    localExcitabilityInfluence: 0.25,
    membraneInfluence: 0.25,
    requireConfidenceAbove: 0.6,
};
