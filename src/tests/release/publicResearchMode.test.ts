/**
 * publicResearchMode.test.ts
 * AETERNA-NATURAL v1.4 — Public Research Mode Tests
 *
 * Confirms:
 * - defaultPublicResearchModeConfig has correct safe defaults
 * - PUBLIC_SAFE_SCENARIO_IDS includes expected safe scenarios
 * - PUBLIC_SAFE_SCENARIO_IDS excludes advanced scenarios
 * - PUBLIC_SAFE_EXPERIMENT_IDS includes expected safe experiments
 * - ADVANCED_EXPERIMENT_IDS includes expected advanced experiments
 */

import { describe, it, expect } from 'vitest';

import { defaultPublicResearchModeConfig } from '../../config/publicResearchModeConfig.js';
import {
  PUBLIC_SAFE_SCENARIO_IDS,
  ADVANCED_SCENARIO_IDS,
} from '../../scenario/publicResearchScenarioSet.js';
import {
  PUBLIC_SAFE_EXPERIMENT_IDS,
  ADVANCED_EXPERIMENT_IDS,
} from '../../scenario/publicPresetExperimentSet.js';

// ── defaultPublicResearchModeConfig safety ─────────────────────────────────────

describe('defaultPublicResearchModeConfig', () => {
  it('defaultPresetId is safeBaseline', () => {
    expect(defaultPublicResearchModeConfig.defaultPresetId).toBe('safeBaseline');
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

  it('showExportActions is true', () => {
    expect(defaultPublicResearchModeConfig.showExportActions).toBe(true);
  });

  it('showLongRunComparison is true', () => {
    expect(defaultPublicResearchModeConfig.showLongRunComparison).toBe(true);
  });

  it('requireWarningBeforeExperimental is true', () => {
    expect(defaultPublicResearchModeConfig.requireWarningBeforeExperimental).toBe(true);
  });
});

// ── Public-safe scenario IDs ───────────────────────────────────────────────────

describe('PUBLIC_SAFE_SCENARIO_IDS', () => {
  it('includes quietBaseline', () => {
    expect(PUBLIC_SAFE_SCENARIO_IDS).toContain('quietBaseline');
  });

  it('does not include fullNaturalLongRun', () => {
    expect(PUBLIC_SAFE_SCENARIO_IDS).not.toContain('fullNaturalLongRun');
  });

  it('does not include any advanced scenario IDs', () => {
    for (const id of ADVANCED_SCENARIO_IDS) {
      expect(PUBLIC_SAFE_SCENARIO_IDS).not.toContain(id);
    }
  });
});

// ── Public-safe experiment IDs ─────────────────────────────────────────────────

describe('PUBLIC_SAFE_EXPERIMENT_IDS', () => {
  it('includes E01_quietBaselineSafe', () => {
    expect(PUBLIC_SAFE_EXPERIMENT_IDS).toContain('E01_quietBaselineSafe');
  });
});

// ── Advanced experiment IDs ────────────────────────────────────────────────────

describe('ADVANCED_EXPERIMENT_IDS', () => {
  it('includes E10_plasticityTraceLongRun', () => {
    expect(ADVANCED_EXPERIMENT_IDS).toContain('E10_plasticityTraceLongRun');
  });
});
