/**
 * RuntimeCapabilities.ts
 *
 * What the UI is allowed to surface, derived from the resolved
 * ReleaseEnvironmentConfig (src/release/resolveReleaseEnvironment.ts).
 * A thin, UI-facing view over that config — kept separate so UI code
 * depends on capability flags, not the full release config shape.
 */

import type { ReleaseEnvironmentConfig } from '../../config/releaseEnvironmentConfig.js';

export interface RuntimeCapabilities {
  externalApiEnabled: boolean;
  nodeBridgeEnabled: boolean;
  showDebugPanels: boolean;
  showRawDiagnostics: boolean;
}

export function deriveRuntimeCapabilities(
  releaseConfig: ReleaseEnvironmentConfig | null
): RuntimeCapabilities {
  if (!releaseConfig) {
    // No config resolved yet — fail closed, not open.
    return {
      externalApiEnabled: false,
      nodeBridgeEnabled: false,
      showDebugPanels: false,
      showRawDiagnostics: false,
    };
  }
  return {
    externalApiEnabled: releaseConfig.externalApiEnabled,
    nodeBridgeEnabled: releaseConfig.nodeBridgeEnabled,
    showDebugPanels: releaseConfig.showDebugPanels,
    showRawDiagnostics: releaseConfig.showRawDiagnostics,
  };
}
