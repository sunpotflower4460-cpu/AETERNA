/**
 * aeternaNaturalPresets.ts
 * AETERNA-NATURAL v1.0 Stabilization
 *
 * Named presets for the AeternaNaturalRuntimeConfig.
 * Each preset captures a specific mode combination with a clear research purpose.
 *
 * Design principles:
 * - Presets are read-only reference objects — they are never mutated at runtime.
 * - fullNaturalExperimental is the only preset with safetyMode='experimental'.
 * - legacyComparison is the only preset with externalConstantsMode='legacy'.
 * - Neither of those is the default.
 * - complexRuntime is not the default in any preset.
 * - resistanceOnly is not the default in any preset.
 * - No semantic node, Node bridge, LLM, or API.
 *
 * Reference: docs/aeterna-natural-v1-stabilization.md §4
 */

import type { AeternaNaturalRuntimeConfig } from './aeternaNaturalRuntimeConfig.ts';

// ── Preset IDs ─────────────────────────────────────────────────────────────────

export type AeternaNaturalPresetId =
    | 'safeBaseline'
    | 'geometryPreview'
    | 'complexObserverPreview'
    | 'naturalObserverSuite'
    | 'plasticityObserveOnly'
    | 'fullNaturalExperimental'
    | 'legacyComparison';

// ── Preset type ────────────────────────────────────────────────────────────────

export interface AeternaNaturalPreset {
    id: AeternaNaturalPresetId;
    label: string;
    description: string;
    /** Warning shown in UI when this preset is selected */
    uiWarning?: string;
    config: AeternaNaturalRuntimeConfig;
}

// ── Preset definitions ─────────────────────────────────────────────────────────

/**
 * safeBaseline
 *
 * Closest to the pre-N-series default behaviour.
 * - flat metric, scalar field, membrane observerOnly
 * - plasticity off, neutral constants
 * - Purpose: safe reference baseline; comparing against this reveals N-series effects.
 */
const safeBaseline: AeternaNaturalPreset = {
    id: 'safeBaseline',
    label: 'Safe Baseline',
    description:
        'Closest to pre-N-series behaviour. '
        + 'Flat metric, scalar field, membrane observer-only, plasticity off, '
        + 'neutral constants. Use as safe comparison reference.',
    config: {
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
    },
};

/**
 * geometryPreview
 *
 * Isolates the effect of the N1 curved torus metric.
 * - curved metric, scalar field
 * - plasticity off, neutral constants
 * - Purpose: observe curvature asymmetry / active-region distribution / trace distribution.
 */
const geometryPreview: AeternaNaturalPreset = {
    id: 'geometryPreview',
    label: 'Geometry Preview',
    description:
        'N1 curved torus metric in isolation. '
        + 'Scalar field, plasticity off, neutral constants. '
        + 'Observe curvature effects on field dynamics.',
    config: {
        metricMode: 'curved',
        fieldRuntimeMode: 'scalar',
        membraneMode: 'observerOnly',
        weakPlasticityMode: 'off',
        weakPlasticityEnabled: false,
        weakPlasticityAblationEnabled: true,
        externalConstantsMode: 'neutral',
        observedRatiosEnabled: true,
        longRunComparisonEnabled: false,
        safetyMode: 'research',
    },
};

/**
 * complexObserverPreview
 *
 * Introduces N2 complex field in observer-only mode.
 * - flat or curved metric, complexObserver field
 * - plasticity off, neutral constants
 * - Purpose: observe phase / vortex candidates without runtime feedback.
 */
const complexObserverPreview: AeternaNaturalPreset = {
    id: 'complexObserverPreview',
    label: 'Complex Observer Preview',
    description:
        'N2 complex field in observer-only mode. '
        + 'Complex field is NOT fed back to runtime. '
        + 'Observe phase, vortex candidates. Plasticity off, neutral constants.',
    config: {
        metricMode: 'flat',
        fieldRuntimeMode: 'complexObserver',
        membraneMode: 'observerOnly',
        weakPlasticityMode: 'off',
        weakPlasticityEnabled: false,
        weakPlasticityAblationEnabled: true,
        externalConstantsMode: 'neutral',
        observedRatiosEnabled: true,
        longRunComparisonEnabled: false,
        safetyMode: 'research',
    },
};

/**
 * naturalObserverSuite
 *
 * All N-series observer features active, no runtime feedback.
 * - curved metric, complexObserver field, membrane observerOnly
 * - plasticity observeOnly + ablation on, neutral constants
 * - Purpose: observe the full N-series without any runtime coupling.
 */
const naturalObserverSuite: AeternaNaturalPreset = {
    id: 'naturalObserverSuite',
    label: 'Natural Observer Suite',
    description:
        'N1–N6 observer features all active. '
        + 'Curved metric, complex observer, membrane observer-only, '
        + 'plasticity observe-only (ablation on), neutral constants. '
        + 'No N-series feature feeds back to runtime.',
    config: {
        metricMode: 'curved',
        fieldRuntimeMode: 'complexObserver',
        membraneMode: 'observerOnly',
        weakPlasticityMode: 'observeOnly',
        weakPlasticityEnabled: true,
        weakPlasticityAblationEnabled: true,
        externalConstantsMode: 'neutral',
        observedRatiosEnabled: true,
        longRunComparisonEnabled: false,
        safetyMode: 'research',
    },
};

/**
 * plasticityObserveOnly
 *
 * Focuses on N5 weak plasticity trace accumulation without runtime effect.
 * - plasticity enabled + observeOnly + ablation on
 * - Purpose: observe trace accumulation without any resistanceScale applied.
 */
const plasticityObserveOnly: AeternaNaturalPreset = {
    id: 'plasticityObserveOnly',
    label: 'Plasticity Observe-Only',
    description:
        'N5 weak plasticity trace accumulation with observer isolation. '
        + 'Plasticity enabled but observe-only, ablation on. '
        + 'resistanceScale is computed but never applied to runtime.',
    config: {
        metricMode: 'flat',
        fieldRuntimeMode: 'scalar',
        membraneMode: 'observerOnly',
        weakPlasticityMode: 'observeOnly',
        weakPlasticityEnabled: true,
        weakPlasticityAblationEnabled: true,
        externalConstantsMode: 'neutral',
        observedRatiosEnabled: true,
        longRunComparisonEnabled: false,
        safetyMode: 'research',
    },
};

/**
 * fullNaturalExperimental
 *
 * All N-series features including runtime feedback paths.
 * EXPERIMENTAL — must never be used as the default.
 * - curved metric, complexRuntime field, membrane weakCoupling
 * - plasticity resistanceOnly + ablation off, neutral constants
 *
 * WARNING: This is safetyMode='experimental'.
 * Use only when all saturation / NaN guards are confirmed active.
 */
const fullNaturalExperimental: AeternaNaturalPreset = {
    id: 'fullNaturalExperimental',
    label: 'Full Natural Experimental',
    description:
        '⚠ EXPERIMENTAL. N1–N6 all features with runtime feedback paths. '
        + 'Curved metric, complex field (runtime), membrane weak-coupling, '
        + 'plasticity resistance-only (ablation off), neutral constants. '
        + 'Do NOT use as default. Saturation / NaN guards must be verified.',
    uiWarning:
        '⚠ EXPERIMENTAL MODE: runtime feedback paths are active. '
        + 'Monitor saturation risk and NaN guards. '
        + 'This mode is not suitable for routine observation.',
    config: {
        metricMode: 'curved',
        fieldRuntimeMode: 'complexRuntime',
        membraneMode: 'weakCoupling',
        weakPlasticityMode: 'resistanceOnly',
        weakPlasticityEnabled: true,
        weakPlasticityAblationEnabled: false,
        externalConstantsMode: 'neutral',
        observedRatiosEnabled: true,
        longRunComparisonEnabled: false,
        safetyMode: 'experimental',
    },
};

/**
 * legacyComparison
 *
 * Restores pre-N6 external constants for before/after comparison.
 * COMPARISON ONLY — must never be used as the default.
 * - flat metric, scalar field, legacy constants
 * - Purpose: compare pre-N6 vs N6 observed ratios.
 */
const legacyComparison: AeternaNaturalPreset = {
    id: 'legacyComparison',
    label: 'Legacy Comparison',
    description:
        'Pre-N6 external constants restored for before/after comparison. '
        + 'Flat metric, scalar field, legacy constants. '
        + 'COMPARISON USE ONLY — do not set as default.',
    uiWarning:
        'LEGACY COMPARISON MODE: pre-N6 external constants are active. '
        + 'This mode is for comparison only and must not be used as the runtime default.',
    config: {
        metricMode: 'flat',
        fieldRuntimeMode: 'scalar',
        membraneMode: 'observerOnly',
        weakPlasticityMode: 'off',
        weakPlasticityEnabled: false,
        weakPlasticityAblationEnabled: true,
        externalConstantsMode: 'legacy',
        observedRatiosEnabled: true,
        longRunComparisonEnabled: false,
        safetyMode: 'research',
    },
};

// ── Registry ───────────────────────────────────────────────────────────────────

/** All presets in canonical order. */
export const AETERNA_NATURAL_PRESETS: AeternaNaturalPreset[] = [
    safeBaseline,
    geometryPreview,
    complexObserverPreview,
    naturalObserverSuite,
    plasticityObserveOnly,
    fullNaturalExperimental,
    legacyComparison,
];

// ── Lookup helpers ─────────────────────────────────────────────────────────────

/** Look up a preset by ID. Returns undefined if not found. */
export function getAeternaNaturalPreset(id: AeternaNaturalPresetId): AeternaNaturalPreset | undefined {
    return AETERNA_NATURAL_PRESETS.find(p => p.id === id);
}

/** Return all preset IDs in canonical order. */
export function getAllPresetIds(): AeternaNaturalPresetId[] {
    return AETERNA_NATURAL_PRESETS.map(p => p.id);
}
