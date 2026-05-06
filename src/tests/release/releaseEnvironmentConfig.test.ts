/**
 * releaseEnvironmentConfig.test.ts
 * AETERNA-NATURAL v1.5 — Release Environment Config Tests
 *
 * Confirms:
 * - defaultReleaseEnvironmentConfig channel is 'publicResearch'
 * - publicResearch disables experimental features
 * - publicResearch disables legacy constants
 * - publicResearch disables external API
 * - publicResearch disables Node bridge
 * - publicResearch enables interpretation notes
 * - publicResearch enables public research mode
 * - publicResearch disables debug panels and raw diagnostics
 * - publicResearch disables full long-run
 */

import { describe, it, expect } from 'vitest';

import {
  defaultReleaseEnvironmentConfig,
} from '../../config/releaseEnvironmentConfig.js';

describe('defaultReleaseEnvironmentConfig', () => {
  it("channel is 'publicResearch'", () => {
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
