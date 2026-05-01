/**
 * weakPlasticityObservation.ts
 * N5: Weak Plasticity Channel — observer-side summary type
 *
 * WeakPlasticityObservationState is derived from WeakPlasticityState by
 * deriveWeakPlasticityObservation(). It is an observer-side record only:
 * no runtime feedback is triggered here.
 *
 * Design principles:
 * - Observer-side, read-only summary.
 * - No semantic labels, no learning claims.
 * - All values finite; NaN / Infinity guarded.
 * - Source-annotated for UI transparency.
 *
 * Reference: docs/weak-plasticity-channel.md
 */

export interface WeakPlasticityObservationState {
    /** Wall-clock timestamp */
    timestamp: number;

    /** Simulation tick */
    tick: number;

    /** Sum of accumulatedTrace across all cells */
    totalAccumulation: number;

    /** Mean accumulatedTrace across all cells */
    averageAccumulation: number;

    /** Maximum accumulatedTrace in any single cell */
    maxAccumulation: number;

    /** Number of cells with accumulatedTrace > 0 */
    affectedRegionCount: number;

    /** Mean resistanceScale across all cells */
    averageResistanceScale: number;

    /** Minimum resistanceScale across all cells */
    minResistanceScale: number;

    /** Maximum resistanceScale across all cells */
    maxResistanceScale: number;

    /**
     * Fraction of total accumulation that came from vortex-candidate traces.
     * Range: 0–1 (relative contribution).
     */
    vortexContribution: number;

    /**
     * Fraction of total accumulation that came from repeated-flow-path traces.
     * Range: 0–1.
     */
    repeatedFlowContribution: number;

    /**
     * Fraction of total accumulation that came from local-excitability traces.
     * Range: 0–1.
     */
    localExcitabilityContribution: number;

    /**
     * Fraction of total accumulation that came from membrane traces.
     * Range: 0–1.
     */
    membraneContribution: number;

    /**
     * Proxy risk that plasticity accumulation is saturating.
     * High when maxAccumulation is near the clamp ceiling.
     * Range: 0–1.
     */
    plasticitySaturationRisk: number;

    /**
     * Proxy risk that plasticity is effectively dormant (near-zero accumulation).
     * High when totalAccumulation is very small.
     * Range: 0–1.
     */
    plasticityDormancyRisk: number;

    /** Whether ablation was active when this observation was derived */
    ablationEnabled: boolean;

    /** Operating mode when this observation was derived */
    mode: 'off' | 'observeOnly' | 'resistanceOnly';

    /**
     * Aggregate observation confidence.
     * Reflects availability of upstream observer inputs.
     * Range: 0–1.
     */
    observationConfidence: number;

    /**
     * Count of NaN / Infinity values in the underlying WeakPlasticityState.
     * Should always be 0.
     */
    nanOrInfinityCount: number;
}
