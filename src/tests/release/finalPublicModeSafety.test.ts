/**
 * finalPublicModeSafety.test.ts
 * AETERNA-NATURAL v2.1 — Final QA / Release Audit — Public Mode Safety
 *
 * Confirms that:
 * - defaultPublicResearchModeConfig has all dangerous flags disabled
 * - defaultReleaseEnvironmentConfig defaults to publicResearch channel
 * - validateReleaseSafety passes on default configs
 * - allowExternalApi is false
 * - nodeBridgeEnabled is false
 * - experimentalFeaturesEnabled is false in publicResearch
 * - complexRuntime is not the default fieldRuntimeMode
 * - weakPlasticityMode is not 'resistanceOnly' in public default
 * - LensGuideConfig default provider is 'ruleBased'
 * - LensGuideConfig allowExternalApi is false in default
 * - requireInterpretationNotes is true in publicResearch channel
 *
 * Reference: docs/final-release-audit.md §2
 */

import { describe, it, expect } from 'vitest';

import { defaultPublicResearchModeConfig } from '../../config/publicResearchModeConfig.js';
import { defaultReleaseEnvironmentConfig } from '../../config/releaseEnvironmentConfig.js';
import { defaultAeternaNaturalRuntimeConfig } from '../../config/aeternaNaturalRuntimeConfig.js';
import { defaultLensGuideConfig } from '../../config/lensGuideConfig.js';
import { validateReleaseSafety } from '../../release/validateReleaseSafety.js';

// ── Public Research Mode Config ────────────────────────────────────────────────

describe('v2.1 public mode safety — defaultPublicResearchModeConfig', () => {
  it('enabled is true', () => {
    expect(defaultPublicResearchModeConfig.enabled).toBe(true);
  });

  it('defaultPresetId is safeBaseline', () => {
    expect(defaultPublicResearchModeConfig.defaultPresetId).toBe('safeBaseline');
  });

  it('defaultScenarioId is quietBaseline', () => {
    expect(defaultPublicResearchModeConfig.defaultScenarioId).toBe('quietBaseline');
  });

  it('allowExperimentalMode is false', () => {
    expect(defaultPublicResearchModeConfig.allowExperimentalMode).toBe(false);
  });

  it('allowComplexRuntime is false', () => {
    expect(defaultPublicResearchModeConfig.allowComplexRuntime).toBe(false);
  });

  it('allowWeakPlasticityResistanceOnly is false', () => {
    expect(defaultPublicResearchModeConfig.allowWeakPlasticityResistanceOnly).toBe(false);
  });

  it('allowLegacyConstants is false', () => {
    expect(defaultPublicResearchModeConfig.allowLegacyConstants).toBe(false);
  });

  it('requireWarningBeforeExperimental is true', () => {
    expect(defaultPublicResearchModeConfig.requireWarningBeforeExperimental).toBe(true);
  });
});

// ── Release Environment Config ─────────────────────────────────────────────────

describe('v2.1 public mode safety — defaultReleaseEnvironmentConfig', () => {
  it('channel is publicResearch', () => {
    expect(defaultReleaseEnvironmentConfig.channel).toBe('publicResearch');
  });

  it('publicResearchModeEnabled is true', () => {
    expect(defaultReleaseEnvironmentConfig.publicResearchModeEnabled).toBe(true);
  });

  it('experimentalFeaturesEnabled is false', () => {
    expect(defaultReleaseEnvironmentConfig.experimentalFeaturesEnabled).toBe(false);
  });

  it('legacyConstantsAllowed is false', () => {
    expect(defaultReleaseEnvironmentConfig.legacyConstantsAllowed).toBe(false);
  });

  it('externalApiEnabled is false', () => {
    expect(defaultReleaseEnvironmentConfig.externalApiEnabled).toBe(false);
  });

  it('nodeBridgeEnabled is false', () => {
    expect(defaultReleaseEnvironmentConfig.nodeBridgeEnabled).toBe(false);
  });

  it('showDebugPanels is false', () => {
    expect(defaultReleaseEnvironmentConfig.showDebugPanels).toBe(false);
  });

  it('showRawDiagnostics is false', () => {
    expect(defaultReleaseEnvironmentConfig.showRawDiagnostics).toBe(false);
  });

  it('allowFullLongRun is false', () => {
    expect(defaultReleaseEnvironmentConfig.allowFullLongRun).toBe(false);
  });

  it('requireInterpretationNotes is true', () => {
    expect(defaultReleaseEnvironmentConfig.requireInterpretationNotes).toBe(true);
  });
});

// ── Runtime Config public safety ───────────────────────────────────────────────

describe('v2.1 public mode safety — runtime config defaults', () => {
  it('fieldRuntimeMode is not complexRuntime by default', () => {
    expect(defaultAeternaNaturalRuntimeConfig.fieldRuntimeMode).not.toBe('complexRuntime');
  });

  it('weakPlasticityMode is not resistanceOnly by default', () => {
    expect(defaultAeternaNaturalRuntimeConfig.weakPlasticityMode).not.toBe('resistanceOnly');
  });

  it('weakPlasticityAblationEnabled is true by default', () => {
    expect(defaultAeternaNaturalRuntimeConfig.weakPlasticityAblationEnabled).toBe(true);
  });

  it('weakPlasticityEnabled is false by default', () => {
    expect(defaultAeternaNaturalRuntimeConfig.weakPlasticityEnabled).toBe(false);
  });
});

// ── Lens Guide Config ─────────────────────────────────────────────────────────

describe('v2.1 public mode safety — defaultLensGuideConfig', () => {
  it('provider is ruleBased by default', () => {
    expect(defaultLensGuideConfig.provider).toBe('ruleBased');
  });

  it('allowExternalApi is false by default', () => {
    expect(defaultLensGuideConfig.allowExternalApi).toBe(false);
  });

  it('requireClaimGuard is true by default', () => {
    expect(defaultLensGuideConfig.requireClaimGuard).toBe(true);
  });

  it('requireCautionNotes is true by default', () => {
    expect(defaultLensGuideConfig.requireCautionNotes).toBe(true);
  });

  it('enabled is true by default', () => {
    expect(defaultLensGuideConfig.enabled).toBe(true);
  });
});

// ── validateReleaseSafety — default configs pass ───────────────────────────────

describe('v2.1 public mode safety — validateReleaseSafety with defaults', () => {
  const result = validateReleaseSafety({
    releaseConfig: defaultReleaseEnvironmentConfig,
    publicModeConfig: defaultPublicResearchModeConfig,
    naturalRuntimeConfig: defaultAeternaNaturalRuntimeConfig,
  });

  it('default configs pass validateReleaseSafety', () => {
    expect(result.valid).toBe(true);
  });

  it('no errors from default configs', () => {
    expect(result.errors).toHaveLength(0);
  });

  it('no normalized configs returned (no normalization needed)', () => {
    expect(result.normalized).toBeUndefined();
  });
});

// ── Dangerous config combinations — should fail ────────────────────────────────

describe('v2.1 public mode safety — dangerous config combinations flagged as errors', () => {
  it('experimentalFeaturesEnabled=true in publicResearch channel → error', () => {
    const result = validateReleaseSafety({
      releaseConfig: { ...defaultReleaseEnvironmentConfig, experimentalFeaturesEnabled: true },
      publicModeConfig: defaultPublicResearchModeConfig,
      naturalRuntimeConfig: defaultAeternaNaturalRuntimeConfig,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('complexRuntime in publicResearch channel → error', () => {
    const result = validateReleaseSafety({
      releaseConfig: defaultReleaseEnvironmentConfig,
      publicModeConfig: defaultPublicResearchModeConfig,
      naturalRuntimeConfig: {
        ...defaultAeternaNaturalRuntimeConfig,
        fieldRuntimeMode: 'complexRuntime',
      },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('externalApiEnabled=true in publicResearch channel → error', () => {
    const result = validateReleaseSafety({
      releaseConfig: { ...defaultReleaseEnvironmentConfig, externalApiEnabled: true },
      publicModeConfig: defaultPublicResearchModeConfig,
      naturalRuntimeConfig: defaultAeternaNaturalRuntimeConfig,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('nodeBridgeEnabled=true in publicResearch channel → error', () => {
    const result = validateReleaseSafety({
      releaseConfig: { ...defaultReleaseEnvironmentConfig, nodeBridgeEnabled: true },
      publicModeConfig: defaultPublicResearchModeConfig,
      naturalRuntimeConfig: defaultAeternaNaturalRuntimeConfig,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('requireInterpretationNotes=false in publicResearch channel → error', () => {
    const result = validateReleaseSafety({
      releaseConfig: { ...defaultReleaseEnvironmentConfig, requireInterpretationNotes: false },
      publicModeConfig: defaultPublicResearchModeConfig,
      naturalRuntimeConfig: defaultAeternaNaturalRuntimeConfig,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('allowWeakPlasticityResistanceOnly=true in publicResearch channel → error', () => {
    const result = validateReleaseSafety({
      releaseConfig: defaultReleaseEnvironmentConfig,
      publicModeConfig: {
        ...defaultPublicResearchModeConfig,
        allowWeakPlasticityResistanceOnly: true,
      },
      naturalRuntimeConfig: defaultAeternaNaturalRuntimeConfig,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('experimental defaultScenarioId in publicResearch channel → error', () => {
    const result = validateReleaseSafety({
      releaseConfig: defaultReleaseEnvironmentConfig,
      publicModeConfig: {
        ...defaultPublicResearchModeConfig,
        defaultScenarioId: 'fullNaturalLongRun',
      },
      naturalRuntimeConfig: defaultAeternaNaturalRuntimeConfig,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
