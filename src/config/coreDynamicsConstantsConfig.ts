/**
 * coreDynamicsConstantsConfig.ts
 * N6: External Constants Removal / Observed Ratios
 *
 * Configuration for how core dynamics handles external constant references.
 *
 * Design principles:
 * - 'neutral' mode: core dynamics uses explicit config values only.
 *   No φ, no Schumann constant names are referenced in dynamic equations.
 * - 'legacy' mode: restores prior behaviour for before/after comparison.
 *   Legacy mode is for research comparison ONLY — it is not the default.
 * - This config does NOT affect observer-side referenceRatios.
 * - Numeric defaults in neutral mode are chosen to preserve runtime behaviour
 *   (they may numerically equal legacy constants, but are unnamed config params).
 *
 * Reference: docs/external-constants-removal.md
 */

export interface CoreDynamicsConstantsConfig {
    /**
     * Mode for handling external constants in core dynamics.
     *
     * 'neutral' (default): Core dynamics use only explicit config parameters.
     *   External constant names (PHI_INV, SCHUMANN_RES) are not referenced.
     *
     * 'legacy': Restores pre-N6 behaviour for before/after comparison.
     *   Must NOT be used as the production default.
     *   Must be labelled "legacy comparison only" in any UI that exposes it.
     */
    externalConstantsMode: 'legacy' | 'neutral';

    /**
     * Base damping factor applied to the wave equation.
     * Range: (0, 1). Typical: 0.985.
     * Unit: dimensionless.
     */
    dampingBase: number;

    /**
     * Per-step damping loss scale, multiplied by (1 − freqRatio).
     * Range: [0, 0.05]. Typical: 0.00764.
     * Chosen to numerically match (1 − φ⁻¹) × 0.02 for continuity,
     * but carries no φ semantic meaning in neutral mode.
     * Unit: dimensionless.
     */
    dampingLoss: number;

    /**
     * Base wave propagation speed.
     * Range: [0.01, 1.0]. Typical: 0.1.
     * The total waveSpeed is: waveSpeedBase + waveSpeedFreqScale × freqRatio.
     * Unit: grid-units per step (dimensionless in normalised units).
     */
    waveSpeedBase: number;

    /**
     * Frequency-dependent scale added to waveSpeedBase.
     * Total: waveSpeedBase + waveSpeedFreqScale × freqRatio.
     * Range: [0, 0.5]. Typical: 0.15.
     */
    waveSpeedFreqScale: number;

    /**
     * Lower bound for omega_t normalisation into freqRatio.
     * freqRatio = clamp((omega_t − freqRangeMin) / (freqRangeMax − freqRangeMin), 0, 1)
     * Numeric default matches legacy SCHUMANN_RES value to preserve continuity,
     * but has no Schumann semantic meaning in neutral mode.
     * Unit: Hz (simulation units).
     */
    freqRangeMin: number;

    /**
     * Upper bound for omega_t normalisation into freqRatio.
     * Numeric default matches legacy GAMMA_SYNC value.
     * Unit: Hz (simulation units).
     */
    freqRangeMax: number;

    /**
     * When true, the legacy code path is allowed to reference external constant
     * names directly. Only relevant when externalConstantsMode = 'legacy'.
     * Must be false in production / neutral mode.
     */
    allowLegacyExternalConstants: boolean;
}

/**
 * Default configuration — neutral mode.
 *
 * Numeric values are chosen to preserve runtime continuity with pre-N6 behaviour.
 * They are configuration parameters, not named external constants.
 *
 * Behaviour in neutral mode:
 *   freqRatio = clamp((omega_t − 7.83) / (40.0 − 7.83), 0, 1)
 *   waveSpeed = 0.1 + 0.15 × freqRatio
 *   damping   = 0.985 − 0.00764 × (1 − freqRatio)
 *               then adjusted by homeostasis term
 */
export const defaultCoreDynamicsConstantsConfig: CoreDynamicsConstantsConfig = {
    externalConstantsMode: 'neutral',
    dampingBase: 0.985,
    dampingLoss: 0.00764,
    waveSpeedBase: 0.1,
    waveSpeedFreqScale: 0.15,
    freqRangeMin: 7.83,
    freqRangeMax: 40.0,
    allowLegacyExternalConstants: false,
};

/**
 * Legacy configuration — for before/after comparison only.
 *
 * Restores pre-N6 behaviour: damping and waveSpeed reference PHI_INV and
 * SCHUMANN_RES directly via the legacy code path in dynamicCore.ts.
 *
 * Do NOT use as the production default.
 * Label as "legacy comparison only" in any UI that exposes it.
 */
export const legacyCoreDynamicsConstantsConfig: CoreDynamicsConstantsConfig = {
    externalConstantsMode: 'legacy',
    dampingBase: 0.985,
    dampingLoss: 0.00764,
    waveSpeedBase: 0.1,
    waveSpeedFreqScale: 0.15,
    freqRangeMin: 7.83,
    freqRangeMax: 40.0,
    allowLegacyExternalConstants: true,
};
