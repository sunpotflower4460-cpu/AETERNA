/**
 * aeternaNaturalRuntimeConfig.ts
 * AETERNA-NATURAL v1.0 Stabilization
 *
 * Unified runtime config for all N1–N7 feature modes.
 * Replaces the scattered per-feature booleans that accumulated across N1–N7.
 *
 * Design principles:
 * - One file to understand the full N-series mode matrix.
 * - Default is safe: flat metric, scalar field, observer-only membrane,
 *   weak plasticity off, neutral constants, long-run disabled.
 * - safe / research / experimental hierarchy enforced by safety gate
 *   (see src/runtime/validateAeternaNaturalConfig.ts).
 * - complexRuntime and resistanceOnly are NEVER the default.
 * - observedRatio is NEVER used as runtime feedback.
 * - referenceRatios is NEVER imported into dynamicCore.
 * - No semantic node, Node bridge, LLM, or API.
 *
 * Reference: docs/aeterna-natural-v1-stabilization.md
 */

// ── Mode types ─────────────────────────────────────────────────────────────────

/** Torus metric mode (N1). */
export type MetricMode = 'flat' | 'curved';

/**
 * Field runtime mode (N2).
 * 'scalar'          : real scalar field — pre-N2 baseline, always safe.
 * 'complexObserver' : complex field tracked observer-side only, safe.
 * 'complexRuntime'  : complex field fed back to runtime (experimental only).
 */
export type FieldRuntimeMode = 'scalar' | 'complexObserver' | 'complexRuntime';

/**
 * Membrane mode (N4).
 * 'off'          : membrane layer inactive.
 * 'observerOnly' : membrane observes, does not couple to runtime.
 * 'weakCoupling' : membrane weakly coupled to runtime dynamics (experimental).
 */
export type MembraneMode = 'off' | 'observerOnly' | 'weakCoupling';

/**
 * Weak plasticity mode (N5).
 * 'off'             : plasticity completely inactive.
 * 'observeOnly'     : trace accumulates, resistanceScale never applied.
 * 'resistanceOnly'  : resistanceScale may be weakly applied to runtime;
 *                     ablation guard is required.
 */
export type WeakPlasticityMode = 'off' | 'observeOnly' | 'resistanceOnly';

/**
 * External constants mode (N6).
 * 'neutral' : core dynamics uses only explicit config parameters.
 * 'legacy'  : restores pre-N6 code path — comparison use ONLY.
 */
export type ExternalConstantsMode = 'legacy' | 'neutral';

/**
 * Safety mode hierarchy.
 * 'safe'         : safe defaults; dangerous feedback paths are disabled.
 * 'research'     : observer-series features are allowed; warnings are shown.
 * 'experimental' : complexRuntime / resistanceOnly / weakCoupling are allowed;
 *                  must be explicitly selected; warnings are always shown.
 */
export type SafetyMode = 'safe' | 'research' | 'experimental';

// ── Config interface ───────────────────────────────────────────────────────────

/**
 * Unified runtime configuration for the AETERNA-NATURAL N1–N7 feature set.
 *
 * This is the single source of truth for which mode combinations are active.
 * Individual per-feature configs (TorusMetricRuntimeConfig, WeakPlasticityConfig,
 * CoreDynamicsConstantsConfig, MembraneConfig) remain in place for detailed tuning,
 * but this interface captures the high-level mode selection.
 */
export interface AeternaNaturalRuntimeConfig {
    /** Torus metric mode. Default: 'flat' (safe). */
    metricMode: MetricMode;

    /**
     * Field runtime mode.
     * Default: 'scalar' (safe).
     * 'complexRuntime' is only allowed in experimental safety mode.
     */
    fieldRuntimeMode: FieldRuntimeMode;

    /**
     * Membrane mode.
     * Default: 'observerOnly' (safe; observation without runtime coupling).
     * 'weakCoupling' is only allowed in experimental safety mode.
     */
    membraneMode: MembraneMode;

    /**
     * Weak plasticity operating mode.
     * Default: 'off' (safe).
     * 'resistanceOnly' is only allowed in experimental safety mode.
     */
    weakPlasticityMode: WeakPlasticityMode;

    /**
     * Master switch for the weak plasticity channel.
     * Default: false (safe).
     */
    weakPlasticityEnabled: boolean;

    /**
     * When true, plasticity trace is computed but resistanceScale is never
     * returned to the runtime even if weakPlasticityMode = 'resistanceOnly'.
     * Default: true (safe; ablation always on by default).
     */
    weakPlasticityAblationEnabled: boolean;

    /**
     * External constants mode.
     * Default: 'neutral' (safe).
     * 'legacy' is for before/after comparison only — must not be the default.
     */
    externalConstantsMode: ExternalConstantsMode;

    /**
     * When true, observed ratios (N6) are computed and surfaced in diagnostics.
     * Observed ratios are NEVER used as runtime feedback.
     * Default: true (safe; observation is always allowed).
     */
    observedRatiosEnabled: boolean;

    /**
     * When true, the long-run comparison suite (N7) is allowed to run.
     * Default: false (safe; long-run is expensive and must be explicitly enabled).
     */
    longRunComparisonEnabled: boolean;

    /**
     * Safety mode.
     * Controls which mode combinations are allowed.
     * Default: 'safe'.
     */
    safetyMode: SafetyMode;
}

// ── Default config ─────────────────────────────────────────────────────────────

/**
 * Default configuration — safe side.
 *
 * - metricMode: flat              → no curvature effect on runtime
 * - fieldRuntimeMode: scalar      → no complex field in runtime
 * - membraneMode: observerOnly    → membrane observes but does not couple
 * - weakPlasticityMode: off       → plasticity channel completely inactive
 * - weakPlasticityEnabled: false  → master switch off
 * - weakPlasticityAblationEnabled: true → extra safety gate even if enabled
 * - externalConstantsMode: neutral → no named external constants in runtime
 * - observedRatiosEnabled: true   → safe observer-side ratio computation
 * - longRunComparisonEnabled: false → expensive suite must be explicitly enabled
 * - safetyMode: safe              → dangerous paths are blocked
 */
export const defaultAeternaNaturalRuntimeConfig: AeternaNaturalRuntimeConfig = {
    metricMode: 'flat',
    fieldRuntimeMode: 'scalar',
    membraneMode: 'observerOnly',
    weakPlasticityMode: 'off',
    weakPlasticityEnabled: false,
    weakPlasticityAblationEnabled: true,
    externalConstantsMode: 'neutral',
    observedRatiosEnabled: true,
    longRunComparisonEnabled: false,
    safetyMode: 'safe',
};
