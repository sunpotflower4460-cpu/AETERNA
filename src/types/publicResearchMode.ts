/**
 * publicResearchMode.ts
 * AETERNA-NATURAL v1.4 — Public Research Mode Types
 *
 * Defines configuration shape for the public research mode.
 * Public mode defaults are conservative: safe preset, no experimental
 * options, no legacy constants, and prominent interpretation guardrails.
 *
 * Reference: docs/public-research-mode.md
 */

export interface PublicResearchModeConfig {
  enabled: boolean;
  defaultPresetId: string;
  defaultScenarioId: string;
  allowExperimentalMode: boolean;
  allowComplexRuntime: boolean;
  allowWeakPlasticityResistanceOnly: boolean;
  allowLegacyConstants: boolean;
  showAdvancedPanels: boolean;
  showRawDiagnostics: boolean;
  showExportActions: boolean;
  showLongRunComparison: boolean;
  requireWarningBeforeExperimental: boolean;
}
