/**
 * validateAeternaNaturalConfig.ts
 * AETERNA-NATURAL v1.0 Stabilization
 *
 * Safety gate for AeternaNaturalRuntimeConfig.
 * Detects dangerous mode combinations and normalizes configs.
 *
 * Design principles:
 * - safe mode: dangerous settings are silently normalized to safe alternatives.
 * - research mode: dangerous settings emit warnings but are not normalized
 *   unless they are strictly forbidden (complexRuntime, resistanceOnly).
 * - experimental mode: dangerous settings are allowed but always emit warnings.
 * - observedRatio is NEVER a runtime feedback path — no config can enable that.
 * - No semantic node, Node bridge, LLM, or API.
 *
 * Reference: docs/aeterna-natural-v1-stabilization.md §5
 */

import type { AeternaNaturalRuntimeConfig } from '../config/aeternaNaturalRuntimeConfig.ts';

// ── Result type ────────────────────────────────────────────────────────────────

export interface AeternaNaturalConfigValidationResult {
    /** True when the config passes all checks for its safety mode. */
    valid: boolean;
    /** Non-fatal issues to surface in diagnostics / UI. */
    warnings: string[];
    /** Fatal issues that prevented the config from being used as-is. */
    errors: string[];
    /**
     * The safe version of the input config.
     * In safe mode, dangerous fields are clamped to safe values.
     * In research / experimental mode, the input is returned with warnings.
     */
    normalizedConfig: AeternaNaturalRuntimeConfig;
}

// ── Dangerous mode definitions ─────────────────────────────────────────────────

/**
 * Modes that require safetyMode='experimental'.
 * These are NEVER allowed in safe or research mode.
 */
const EXPERIMENTAL_ONLY_FIELD_MODES = ['complexRuntime'] as const;
const EXPERIMENTAL_ONLY_PLASTICITY_MODES = ['resistanceOnly'] as const;
const EXPERIMENTAL_ONLY_MEMBRANE_MODES = ['weakCoupling'] as const;

// ── Validation logic ───────────────────────────────────────────────────────────

/**
 * Validates and optionally normalizes an AeternaNaturalRuntimeConfig.
 *
 * In safe mode:
 *   - complexRuntime → complexObserver
 *   - resistanceOnly → observeOnly
 *   - weakCoupling   → observerOnly
 *   - externalConstantsMode='legacy' does NOT cause normalization; it emits a warning.
 *
 * In research mode:
 *   - complexRuntime / resistanceOnly / weakCoupling emit errors (forbidden).
 *   - externalConstantsMode='legacy' emits a warning.
 *   - weakPlasticityEnabled without ablation emits a warning.
 *
 * In experimental mode:
 *   - All modes allowed; all risky combinations emit warnings.
 *   - resistanceOnly without ablation emits a warning.
 */
export function validateAeternaNaturalConfig(
    config: AeternaNaturalRuntimeConfig,
): AeternaNaturalConfigValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Start with a copy of the input config.
    let normalized: AeternaNaturalRuntimeConfig = { ...config };
    let valid = true;

    // ── Check 1: complexRuntime requires experimental mode ─────────────────────
    if (EXPERIMENTAL_ONLY_FIELD_MODES.includes(normalized.fieldRuntimeMode as 'complexRuntime')) {
        if (normalized.safetyMode === 'safe') {
            errors.push(
                'fieldRuntimeMode=complexRuntime is not allowed in safe mode. '
                + 'Normalized to complexObserver.',
            );
            normalized = { ...normalized, fieldRuntimeMode: 'complexObserver' };
            valid = false;
        } else if (normalized.safetyMode === 'research') {
            errors.push(
                'fieldRuntimeMode=complexRuntime is not allowed in research mode. '
                + 'Use safetyMode=experimental to enable complexRuntime.',
            );
            normalized = { ...normalized, fieldRuntimeMode: 'complexObserver' };
            valid = false;
        } else {
            warnings.push(
                '⚠ fieldRuntimeMode=complexRuntime is experimental. '
                + 'Monitor NaN / saturation risk.',
            );
        }
    }

    // ── Check 2: resistanceOnly requires experimental mode ────────────────────
    if (EXPERIMENTAL_ONLY_PLASTICITY_MODES.includes(normalized.weakPlasticityMode as 'resistanceOnly')) {
        if (normalized.safetyMode === 'safe') {
            errors.push(
                'weakPlasticityMode=resistanceOnly is not allowed in safe mode. '
                + 'Normalized to observeOnly.',
            );
            normalized = { ...normalized, weakPlasticityMode: 'observeOnly' };
            valid = false;
        } else if (normalized.safetyMode === 'research') {
            errors.push(
                'weakPlasticityMode=resistanceOnly is not allowed in research mode. '
                + 'Use safetyMode=experimental to enable resistanceOnly.',
            );
            normalized = { ...normalized, weakPlasticityMode: 'observeOnly' };
            valid = false;
        } else {
            warnings.push(
                '⚠ weakPlasticityMode=resistanceOnly is experimental. '
                + 'Clamp guards must be verified.',
            );
        }
    }

    // ── Check 3: weakCoupling membrane requires experimental mode ─────────────
    if (EXPERIMENTAL_ONLY_MEMBRANE_MODES.includes(normalized.membraneMode as 'weakCoupling')) {
        if (normalized.safetyMode === 'safe') {
            errors.push(
                'membraneMode=weakCoupling is not allowed in safe mode. '
                + 'Normalized to observerOnly.',
            );
            normalized = { ...normalized, membraneMode: 'observerOnly' };
            valid = false;
        } else if (normalized.safetyMode === 'research') {
            errors.push(
                'membraneMode=weakCoupling is not allowed in research mode. '
                + 'Use safetyMode=experimental to enable weakCoupling.',
            );
            normalized = { ...normalized, membraneMode: 'observerOnly' };
            valid = false;
        } else {
            warnings.push(
                '⚠ membraneMode=weakCoupling is experimental. '
                + 'Monitor saturation risk.',
            );
        }
    }

    // ── Check 4: legacy constants should not be the casual default ────────────
    if (normalized.externalConstantsMode === 'legacy') {
        warnings.push(
            'externalConstantsMode=legacy is for before/after comparison only. '
            + 'Do not use as the runtime default.',
        );
    }

    // ── Check 5: resistanceOnly without ablation requires extra guard ─────────
    if (
        normalized.weakPlasticityMode === 'resistanceOnly'
        && normalized.weakPlasticityEnabled
        && !normalized.weakPlasticityAblationEnabled
    ) {
        if (normalized.safetyMode !== 'experimental') {
            errors.push(
                'weakPlasticityMode=resistanceOnly with ablation disabled requires safetyMode=experimental.',
            );
            normalized = { ...normalized, weakPlasticityAblationEnabled: true };
            valid = false;
        } else {
            warnings.push(
                '⚠ weakPlasticityMode=resistanceOnly with ablation disabled. '
                + 'Clamp range [minResistanceScale, maxResistanceScale] must be verified.',
            );
        }
    }

    // ── Check 6: longRunComparison in safe mode is fine but note it ───────────
    if (normalized.longRunComparisonEnabled && normalized.safetyMode === 'safe') {
        warnings.push(
            'longRunComparisonEnabled=true in safe mode. '
            + 'Long-run suite will use lightweight test profile.',
        );
    }

    // ── Check 7: observedRatios is always observer-side — no action needed ────
    // observedRatiosEnabled=true is always safe; it never feeds back to runtime.
    // We just document the guarantee here.

    return {
        valid,
        warnings,
        errors,
        normalizedConfig: normalized,
    };
}

/**
 * Convenience helper: returns the normalizedConfig for the given input,
 * applying safe normalization without needing to inspect the full result.
 */
export function normalizeAeternaNaturalConfig(
    config: AeternaNaturalRuntimeConfig,
): AeternaNaturalRuntimeConfig {
    return validateAeternaNaturalConfig(config).normalizedConfig;
}
