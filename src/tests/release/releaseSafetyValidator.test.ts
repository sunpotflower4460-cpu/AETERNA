/**
 * releaseSafetyValidator.test.ts
 * AETERNA-NATURAL v1.5 — Release Safety Validator Tests
 *
 * Confirms:
 * - validateReleaseSafety passes for default configs
 * - validateReleaseSafety errors on experimentalFeaturesEnabled in publicResearch
 * - validateReleaseSafety errors on complexRuntime in publicResearch
 * - validateReleaseSafety errors on resistanceOnly in publicResearch
 * - validateReleaseSafety errors on legacyConstantsAllowed in publicResearch
 * - validateReleaseSafety errors on externalApiEnabled in publicResearch
 * - validateReleaseSafety errors on nodeBridgeEnabled in publicResearch
 * - validateReleaseSafety errors on requireInterpretationNotes=false in publicResearch
 * - validateReleaseSafety errors on experimental defaultScenarioId in publicResearch
 * - validateReleaseSafety passes for experimental channel with dangerous settings
 * - normalized config is provided when normalization is needed
 */

import { describe, it, expect } from 'vitest';

import { validateReleaseSafety } from '../../release/validateReleaseSafety.js';
import { defaultReleaseEnvironmentConfig } from '../../config/releaseEnvironmentConfig.js';
import { defaultPublicResearchModeConfig } from '../../config/publicResearchModeConfig.js';
import { defaultAeternaNaturalRuntimeConfig } from '../../config/aeternaNaturalRuntimeConfig.js';
import type { ReleaseEnvironmentConfig } from '../../config/releaseEnvironmentConfig.js';
import type { PublicResearchModeConfig } from '../../types/publicResearchMode.js';
import type { AeternaNaturalRuntimeConfig } from '../../config/aeternaNaturalRuntimeConfig.js';

function makeParams(
  releaseOverride: Partial<ReleaseEnvironmentConfig> = {},
  publicOverride: Partial<PublicResearchModeConfig> = {},
  runtimeOverride: Partial<AeternaNaturalRuntimeConfig> = {},
) {
  return {
    releaseConfig: { ...defaultReleaseEnvironmentConfig, ...releaseOverride },
    publicModeConfig: { ...defaultPublicResearchModeConfig, ...publicOverride },
    naturalRuntimeConfig: { ...defaultAeternaNaturalRuntimeConfig, ...runtimeOverride },
  };
}

// ── Default configs: should pass ──────────────────────────────────────────────

describe('validateReleaseSafety — default configs', () => {
  it('passes with all defaults', () => {
    const result = validateReleaseSafety(makeParams());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('no normalized config when nothing was changed', () => {
    const result = validateReleaseSafety(makeParams());
    expect(result.normalized).toBeUndefined();
  });
});

// ── experimentalFeaturesEnabled in publicResearch ────────────────────────────

describe('validateReleaseSafety — experimentalFeaturesEnabled', () => {
  it('errors when experimentalFeaturesEnabled=true in publicResearch', () => {
    const result = validateReleaseSafety(
      makeParams({ experimentalFeaturesEnabled: true }),
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('experimentalFeaturesEnabled'))).toBe(true);
  });

  it('normalizes experimentalFeaturesEnabled to false in publicResearch', () => {
    const result = validateReleaseSafety(
      makeParams({ experimentalFeaturesEnabled: true }),
    );
    expect(result.normalized?.releaseConfig.experimentalFeaturesEnabled).toBe(false);
  });
});

// ── complexRuntime in publicResearch ─────────────────────────────────────────

describe('validateReleaseSafety — complexRuntime', () => {
  it('errors when fieldRuntimeMode=complexRuntime in publicResearch', () => {
    const result = validateReleaseSafety(
      makeParams({}, {}, { fieldRuntimeMode: 'complexRuntime' }),
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('complexRuntime'))).toBe(true);
  });

  it('normalizes complexRuntime to complexObserver in publicResearch', () => {
    const result = validateReleaseSafety(
      makeParams({}, {}, { fieldRuntimeMode: 'complexRuntime' }),
    );
    expect(result.normalized?.naturalRuntimeConfig.fieldRuntimeMode).toBe('complexObserver');
  });
});

// ── resistanceOnly in publicResearch ─────────────────────────────────────────

describe('validateReleaseSafety — resistanceOnly', () => {
  it('errors when weakPlasticityMode=resistanceOnly in publicResearch', () => {
    const result = validateReleaseSafety(
      makeParams({}, {}, { weakPlasticityMode: 'resistanceOnly' }),
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('resistanceOnly'))).toBe(true);
  });

  it('errors when allowWeakPlasticityResistanceOnly=true in publicResearch', () => {
    const result = validateReleaseSafety(
      makeParams({}, { allowWeakPlasticityResistanceOnly: true }),
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('allowWeakPlasticityResistanceOnly'))).toBe(true);
  });
});

// ── legacyConstants in publicResearch ────────────────────────────────────────

describe('validateReleaseSafety — legacyConstants', () => {
  it('errors when legacyConstantsAllowed=true in publicResearch', () => {
    const result = validateReleaseSafety(
      makeParams({ legacyConstantsAllowed: true }),
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('legacyConstantsAllowed'))).toBe(true);
  });

  it('errors when allowLegacyConstants=true in publicResearch', () => {
    const result = validateReleaseSafety(
      makeParams({}, { allowLegacyConstants: true }),
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('allowLegacyConstants'))).toBe(true);
  });
});

// ── externalApiEnabled in publicResearch ──────────────────────────────────────

describe('validateReleaseSafety — externalApiEnabled', () => {
  it('errors when externalApiEnabled=true in publicResearch', () => {
    const result = validateReleaseSafety(
      makeParams({ externalApiEnabled: true }),
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('externalApiEnabled'))).toBe(true);
  });
});

// ── nodeBridgeEnabled in publicResearch ───────────────────────────────────────

describe('validateReleaseSafety — nodeBridgeEnabled', () => {
  it('errors when nodeBridgeEnabled=true in publicResearch', () => {
    const result = validateReleaseSafety(
      makeParams({ nodeBridgeEnabled: true }),
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('nodeBridgeEnabled'))).toBe(true);
  });
});

// ── requireInterpretationNotes in publicResearch ──────────────────────────────

describe('validateReleaseSafety — requireInterpretationNotes', () => {
  it('errors when requireInterpretationNotes=false in publicResearch', () => {
    const result = validateReleaseSafety(
      makeParams({ requireInterpretationNotes: false }),
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('requireInterpretationNotes'))).toBe(true);
  });
});

// ── Experimental default scenario in publicResearch ──────────────────────────

describe('validateReleaseSafety — experimental defaultScenarioId', () => {
  it('errors when defaultScenarioId is fullNaturalLongRun in publicResearch', () => {
    const result = validateReleaseSafety(
      makeParams({}, { defaultScenarioId: 'fullNaturalLongRun' }),
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('defaultScenarioId'))).toBe(true);
  });

  it('normalizes defaultScenarioId to quietBaseline in publicResearch', () => {
    const result = validateReleaseSafety(
      makeParams({}, { defaultScenarioId: 'fullNaturalLongRun' }),
    );
    expect(result.normalized?.publicModeConfig.defaultScenarioId).toBe('quietBaseline');
  });
});

// ── Experimental channel allows dangerous settings ────────────────────────────

describe('validateReleaseSafety — experimental channel', () => {
  it('passes for experimental channel with complexRuntime', () => {
    const result = validateReleaseSafety({
      releaseConfig: {
        ...defaultReleaseEnvironmentConfig,
        channel: 'experimental',
        experimentalFeaturesEnabled: true,
      },
      publicModeConfig: defaultPublicResearchModeConfig,
      naturalRuntimeConfig: {
        ...defaultAeternaNaturalRuntimeConfig,
        fieldRuntimeMode: 'complexRuntime',
        safetyMode: 'experimental',
      },
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
