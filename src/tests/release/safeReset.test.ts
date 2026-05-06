/**
 * safeReset.test.ts
 * AETERNA-NATURAL v1.5 — Safe Reset Tests
 *
 * Confirms:
 * - getSafeResetState returns presetId=safeBaseline
 * - getSafeResetState returns scenarioId=quietBaseline
 * - getSafeResetState returns safetyMode=safe
 * - getSafeResetState disables experimental settings
 * - isAtSafeBaseline returns true for default config
 * - isAtSafeBaseline returns false for experimental config
 * - SAFE_RESET_LABEL_EN and SAFE_RESET_LABEL_JA are defined
 * - renderSafeResetDescription contains no forbidden claims
 */

import { describe, it, expect } from 'vitest';

import {
  getSafeResetState,
  isAtSafeBaseline,
  SAFE_RESET_LABEL_EN,
  SAFE_RESET_LABEL_JA,
  renderSafeResetDescription,
} from '../../ui/system/SafeResetButton.js';

import { defaultAeternaNaturalRuntimeConfig } from '../../config/aeternaNaturalRuntimeConfig.js';
import type { AeternaNaturalRuntimeConfig } from '../../config/aeternaNaturalRuntimeConfig.js';

const FORBIDDEN_CLAIMS = [
  'consciousness proved',
  'life proved',
  'healing proof',
  'aeterna is alive',
  'aeterna feels',
];

function noForbiddenClaims(text: string): string | null {
  const lower = text.toLowerCase();
  for (const claim of FORBIDDEN_CLAIMS) {
    if (lower.includes(claim)) return claim;
  }
  return null;
}

// ── getSafeResetState ─────────────────────────────────────────────────────────

describe('getSafeResetState', () => {
  it('returns presetId=safeBaseline', () => {
    expect(getSafeResetState().presetId).toBe('safeBaseline');
  });

  it('returns scenarioId=quietBaseline', () => {
    expect(getSafeResetState().scenarioId).toBe('quietBaseline');
  });

  it('returns safetyMode=safe', () => {
    expect(getSafeResetState().runtimeConfig.safetyMode).toBe('safe');
  });

  it('returns fieldRuntimeMode=scalar', () => {
    expect(getSafeResetState().runtimeConfig.fieldRuntimeMode).toBe('scalar');
  });

  it('returns weakPlasticityMode=off', () => {
    expect(getSafeResetState().runtimeConfig.weakPlasticityMode).toBe('off');
  });

  it('returns weakPlasticityEnabled=false', () => {
    expect(getSafeResetState().runtimeConfig.weakPlasticityEnabled).toBe(false);
  });

  it('returns externalConstantsMode=neutral', () => {
    expect(getSafeResetState().runtimeConfig.externalConstantsMode).toBe('neutral');
  });

  it('returns longRunComparisonEnabled=false', () => {
    expect(getSafeResetState().runtimeConfig.longRunComparisonEnabled).toBe(false);
  });

  it('public mode config has allowExperimentalMode=false', () => {
    expect(getSafeResetState().publicModeConfig.allowExperimentalMode).toBe(false);
  });

  it('public mode config has allowWeakPlasticityResistanceOnly=false', () => {
    expect(getSafeResetState().publicModeConfig.allowWeakPlasticityResistanceOnly).toBe(false);
  });

  it('public mode config has allowLegacyConstants=false', () => {
    expect(getSafeResetState().publicModeConfig.allowLegacyConstants).toBe(false);
  });
});

// ── isAtSafeBaseline ──────────────────────────────────────────────────────────

describe('isAtSafeBaseline', () => {
  it('returns true for defaultAeternaNaturalRuntimeConfig', () => {
    expect(isAtSafeBaseline(defaultAeternaNaturalRuntimeConfig)).toBe(true);
  });

  it('returns true for getSafeResetState().runtimeConfig', () => {
    expect(isAtSafeBaseline(getSafeResetState().runtimeConfig)).toBe(true);
  });

  it('returns false for experimental config', () => {
    const experimental: AeternaNaturalRuntimeConfig = {
      ...defaultAeternaNaturalRuntimeConfig,
      safetyMode: 'experimental',
      fieldRuntimeMode: 'complexRuntime',
    };
    expect(isAtSafeBaseline(experimental)).toBe(false);
  });

  it('returns false when weakPlasticityMode=resistanceOnly', () => {
    const config: AeternaNaturalRuntimeConfig = {
      ...defaultAeternaNaturalRuntimeConfig,
      weakPlasticityMode: 'resistanceOnly',
    };
    expect(isAtSafeBaseline(config)).toBe(false);
  });
});

// ── Label safety ──────────────────────────────────────────────────────────────

describe('SafeResetButton labels', () => {
  it('SAFE_RESET_LABEL_EN is defined', () => {
    expect(SAFE_RESET_LABEL_EN).toBeTruthy();
  });

  it('SAFE_RESET_LABEL_JA is defined', () => {
    expect(SAFE_RESET_LABEL_JA).toBeTruthy();
  });

  it('SAFE_RESET_LABEL_EN contains no forbidden claims', () => {
    expect(noForbiddenClaims(SAFE_RESET_LABEL_EN)).toBeNull();
  });

  it('SAFE_RESET_LABEL_JA contains no forbidden claims', () => {
    expect(noForbiddenClaims(SAFE_RESET_LABEL_JA)).toBeNull();
  });

  it('renderSafeResetDescription contains no forbidden claims', () => {
    const lines = renderSafeResetDescription();
    for (const line of lines) {
      expect(noForbiddenClaims(line)).toBeNull();
    }
  });
});
