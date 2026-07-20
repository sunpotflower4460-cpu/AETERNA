/**
 * runtimeCapabilities.test.ts
 *
 * Confirms:
 * - deriveRuntimeCapabilities fails closed (all false) when no config resolved yet
 * - deriveRuntimeCapabilities mirrors the resolved ReleaseEnvironmentConfig's
 *   externalApiEnabled / nodeBridgeEnabled / showDebugPanels / showRawDiagnostics
 */

import { describe, it, expect } from 'vitest';
import { deriveRuntimeCapabilities } from '../../app/runtime/RuntimeCapabilities.js';
import { defaultReleaseEnvironmentConfig } from '../../config/releaseEnvironmentConfig.js';

describe('deriveRuntimeCapabilities', () => {
  it('fails closed when no release config has been resolved yet', () => {
    expect(deriveRuntimeCapabilities(null)).toEqual({
      externalApiEnabled: false,
      nodeBridgeEnabled: false,
      showDebugPanels: false,
      showRawDiagnostics: false,
    });
  });

  it('mirrors the publicResearch default config (everything off)', () => {
    expect(deriveRuntimeCapabilities(defaultReleaseEnvironmentConfig)).toEqual({
      externalApiEnabled: false,
      nodeBridgeEnabled: false,
      showDebugPanels: false,
      showRawDiagnostics: false,
    });
  });

  it('mirrors an opted-in config with the gates open', () => {
    const opened = {
      ...defaultReleaseEnvironmentConfig,
      channel: 'local' as const,
      externalApiEnabled: true,
      nodeBridgeEnabled: true,
      showDebugPanels: true,
      showRawDiagnostics: true,
    };
    expect(deriveRuntimeCapabilities(opened)).toEqual({
      externalApiEnabled: true,
      nodeBridgeEnabled: true,
      showDebugPanels: true,
      showRawDiagnostics: true,
    });
  });
});
