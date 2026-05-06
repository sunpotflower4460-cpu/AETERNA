/**
 * validateReleaseSafety.ts
 * AETERNA-NATURAL v1.5 — Release Safety Validator
 *
 * Cross-validates ReleaseEnvironmentConfig, PublicResearchModeConfig, and
 * AeternaNaturalRuntimeConfig for deployment safety.
 *
 * Design principles:
 * - publicResearch channel: dangerous settings are errors.
 * - preview channel: dangerous settings are warnings.
 * - experimental channel: dangerous settings are allowed (with warnings).
 * - No runtime dynamics are changed by this validator.
 * - No external API, Node bridge, LLM, or consciousness claims.
 *
 * Reference: docs/deployment-readiness.md §6
 */

import type { ReleaseEnvironmentConfig } from '../config/releaseEnvironmentConfig.js';
import type { PublicResearchModeConfig } from '../types/publicResearchMode.js';
import type { AeternaNaturalRuntimeConfig } from '../config/aeternaNaturalRuntimeConfig.js';

// ── Result type ────────────────────────────────────────────────────────────────

export interface ReleaseSafetyValidationResult {
  /** True when no errors were found. */
  valid: boolean;
  /** Fatal issues that must be fixed before deployment. */
  errors: string[];
  /** Non-fatal issues to review before deployment. */
  warnings: string[];
  /**
   * The normalized (safe) versions of each config, if normalization was applied.
   * Only present when normalization was needed.
   */
  normalized?: {
    releaseConfig: ReleaseEnvironmentConfig;
    publicModeConfig: PublicResearchModeConfig;
    naturalRuntimeConfig: AeternaNaturalRuntimeConfig;
  };
}

// ── Validator ──────────────────────────────────────────────────────────────────

/**
 * Validates the combined release configuration for deployment safety.
 *
 * Checks:
 * 1. publicResearch channel: experimentalFeaturesEnabled must be false
 * 2. publicResearch channel: complexRuntime must not be enabled
 * 3. publicResearch channel: weakPlasticityResistanceOnly must not be enabled
 * 4. publicResearch channel: legacyConstantsAllowed must be false
 * 5. publicResearch channel: externalApiEnabled must be false
 * 6. publicResearch channel: nodeBridgeEnabled must be false
 * 7. requireInterpretationNotes must be true in publicResearch
 * 8. defaultScenarioId must not be an experimental scenario
 * 9. allowFullLongRun should be false for public deployments
 */
export function validateReleaseSafety(params: {
  releaseConfig: ReleaseEnvironmentConfig;
  publicModeConfig: PublicResearchModeConfig;
  naturalRuntimeConfig: AeternaNaturalRuntimeConfig;
}): ReleaseSafetyValidationResult {
  const { releaseConfig, publicModeConfig, naturalRuntimeConfig } = params;
  const errors: string[] = [];
  const warnings: string[] = [];
  let valid = true;
  let normalizationApplied = false;

  const channel = releaseConfig.channel;
  const isPublic = channel === 'publicResearch';
  const isPreview = channel === 'preview';
  const isLocal = channel === 'local';
  const isExperimental = channel === 'experimental';

  // Normalized copies (mutated below when normalization is needed)
  let normReleaseConfig: ReleaseEnvironmentConfig = { ...releaseConfig };
  let normPublicModeConfig: PublicResearchModeConfig = { ...publicModeConfig };
  let normRuntimeConfig: AeternaNaturalRuntimeConfig = { ...naturalRuntimeConfig };

  // ── Check 1: experimentalFeaturesEnabled ──────────────────────────────────
  if (releaseConfig.experimentalFeaturesEnabled) {
    if (isPublic) {
      errors.push(
        `experimentalFeaturesEnabled=true is not allowed in publicResearch channel. `
        + `Set experimentalFeaturesEnabled=false.`,
      );
      normReleaseConfig = { ...normReleaseConfig, experimentalFeaturesEnabled: false };
      normalizationApplied = true;
      valid = false;
    } else if (isPreview) {
      warnings.push(
        `experimentalFeaturesEnabled=true in preview channel. `
        + `Confirm this is intentional before promoting to publicResearch.`,
      );
    }
    // local / internalResearch / experimental: allowed
  }

  // ── Check 2: complexRuntime in publicResearch ─────────────────────────────
  if (naturalRuntimeConfig.fieldRuntimeMode === 'complexRuntime') {
    if (isPublic) {
      errors.push(
        'fieldRuntimeMode=complexRuntime is not allowed in publicResearch channel. '
        + 'Normalize to complexObserver or scalar.',
      );
      normRuntimeConfig = { ...normRuntimeConfig, fieldRuntimeMode: 'complexObserver' };
      normalizationApplied = true;
      valid = false;
    } else if (isPreview) {
      warnings.push(
        'fieldRuntimeMode=complexRuntime in preview channel. '
        + 'Confirm this is intentional.',
      );
    }
  }

  // ── Check 3: weakPlasticityResistanceOnly in publicResearch ──────────────
  if (publicModeConfig.allowWeakPlasticityResistanceOnly && (isPublic || isPreview)) {
    const level = isPublic ? 'error' : 'warning';
    const msg =
      'allowWeakPlasticityResistanceOnly=true is not allowed in publicResearch/preview channel. '
      + 'Set allowWeakPlasticityResistanceOnly=false.';
    if (level === 'error') {
      errors.push(msg);
      normPublicModeConfig = { ...normPublicModeConfig, allowWeakPlasticityResistanceOnly: false };
      normalizationApplied = true;
      valid = false;
    } else {
      warnings.push(msg);
    }
  }

  if (naturalRuntimeConfig.weakPlasticityMode === 'resistanceOnly') {
    if (isPublic) {
      errors.push(
        'weakPlasticityMode=resistanceOnly is not allowed in publicResearch channel. '
        + 'Normalize to observeOnly or off.',
      );
      normRuntimeConfig = { ...normRuntimeConfig, weakPlasticityMode: 'observeOnly' };
      normalizationApplied = true;
      valid = false;
    } else if (isPreview) {
      warnings.push(
        'weakPlasticityMode=resistanceOnly in preview channel. '
        + 'Confirm ablation guard is active.',
      );
    }
  }

  // ── Check 4: legacyConstantsAllowed ──────────────────────────────────────
  if (releaseConfig.legacyConstantsAllowed) {
    if (isPublic) {
      errors.push(
        'legacyConstantsAllowed=true is not allowed in publicResearch channel. '
        + 'Set legacyConstantsAllowed=false.',
      );
      normReleaseConfig = { ...normReleaseConfig, legacyConstantsAllowed: false };
      normalizationApplied = true;
      valid = false;
    } else if (isPreview) {
      warnings.push(
        'legacyConstantsAllowed=true in preview channel. '
        + 'Confirm this is for comparison purposes only.',
      );
    }
  }

  if (publicModeConfig.allowLegacyConstants && (isPublic || isPreview)) {
    const level = isPublic ? 'error' : 'warning';
    const msg =
      'allowLegacyConstants=true is not allowed in publicResearch/preview channel.';
    if (level === 'error') {
      errors.push(msg);
      normPublicModeConfig = { ...normPublicModeConfig, allowLegacyConstants: false };
      normalizationApplied = true;
      valid = false;
    } else {
      warnings.push(msg);
    }
  }

  // ── Check 5: externalApiEnabled ───────────────────────────────────────────
  if (releaseConfig.externalApiEnabled) {
    if (isPublic || isPreview) {
      errors.push(
        'externalApiEnabled=true is not allowed in publicResearch/preview channel. '
        + 'No external API is implemented in AETERNA-NATURAL.',
      );
      normReleaseConfig = { ...normReleaseConfig, externalApiEnabled: false };
      normalizationApplied = true;
      valid = false;
    } else {
      warnings.push(
        'externalApiEnabled=true detected. '
        + 'No external API is implemented — this flag should remain false.',
      );
    }
  }

  // ── Check 6: nodeBridgeEnabled ────────────────────────────────────────────
  if (releaseConfig.nodeBridgeEnabled) {
    if (isPublic || isPreview) {
      errors.push(
        'nodeBridgeEnabled=true is not allowed in publicResearch/preview channel. '
        + 'No Node bridge is implemented in AETERNA-NATURAL.',
      );
      normReleaseConfig = { ...normReleaseConfig, nodeBridgeEnabled: false };
      normalizationApplied = true;
      valid = false;
    } else {
      warnings.push(
        'nodeBridgeEnabled=true detected. '
        + 'No Node bridge is implemented — this flag should remain false.',
      );
    }
  }

  // ── Check 7: requireInterpretationNotes ──────────────────────────────────
  if (!releaseConfig.requireInterpretationNotes && (isPublic || isPreview)) {
    const level = isPublic ? 'error' : 'warning';
    const msg =
      'requireInterpretationNotes=false in publicResearch/preview channel. '
      + 'Interpretation notes must be visible in public mode.';
    if (level === 'error') {
      errors.push(msg);
      normReleaseConfig = { ...normReleaseConfig, requireInterpretationNotes: true };
      normalizationApplied = true;
      valid = false;
    } else {
      warnings.push(msg);
    }
  }

  // ── Check 8: default scenario must not be experimental ───────────────────
  const EXPERIMENTAL_SCENARIO_IDS = ['fullNaturalLongRun', 'longRunNaturalComparison'];
  if (EXPERIMENTAL_SCENARIO_IDS.includes(publicModeConfig.defaultScenarioId)) {
    if (isPublic) {
      errors.push(
        `defaultScenarioId='${publicModeConfig.defaultScenarioId}' is an experimental scenario. `
        + "Use 'quietBaseline' as the default in publicResearch channel.",
      );
      normPublicModeConfig = { ...normPublicModeConfig, defaultScenarioId: 'quietBaseline' };
      normalizationApplied = true;
      valid = false;
    } else if (isPreview || isLocal) {
      warnings.push(
        `defaultScenarioId='${publicModeConfig.defaultScenarioId}' is an experimental scenario. `
        + 'Confirm this is intentional.',
      );
    }
  }

  // ── Check 9: allowFullLongRun in public / preview ─────────────────────────
  if (releaseConfig.allowFullLongRun && (isPublic || isPreview)) {
    warnings.push(
      'allowFullLongRun=true in publicResearch/preview channel. '
      + 'Full long-run suite is expensive. '
      + 'Confirm this is intentional and will not be included in CI default.',
    );
  }

  // ── Determine if normalization was applied ────────────────────────────────
  const wasNormalized = normalizationApplied;

  return {
    valid,
    errors,
    warnings,
    ...(wasNormalized
      ? {
          normalized: {
            releaseConfig: normReleaseConfig,
            publicModeConfig: normPublicModeConfig,
            naturalRuntimeConfig: normRuntimeConfig,
          },
        }
      : undefined),
  };
}
