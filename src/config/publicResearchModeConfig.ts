/**
 * publicResearchModeConfig.ts
 * AETERNA-NATURAL v1.4 — Public Research Mode Default Config
 *
 * Conservative defaults for the public release:
 * - Safe preset / scenario entry points only
 * - Experimental, complex-runtime, resistanceOnly, and legacy modes off
 * - Export and long-run comparison visible for reproducibility
 * - Warning required before unlocking experimental options
 *
 * Reference: docs/public-research-mode.md §2
 */

import type { PublicResearchModeConfig } from '../types/publicResearchMode.js';

export const defaultPublicResearchModeConfig: PublicResearchModeConfig = {
  enabled: true,
  defaultPresetId: 'safeBaseline',
  defaultScenarioId: 'quietBaseline',
  allowExperimentalMode: false,
  allowComplexRuntime: false,
  allowWeakPlasticityResistanceOnly: false,
  allowLegacyConstants: false,
  showAdvancedPanels: false,
  showRawDiagnostics: false,
  showExportActions: true,
  showLongRunComparison: true,
  requireWarningBeforeExperimental: true,
};
