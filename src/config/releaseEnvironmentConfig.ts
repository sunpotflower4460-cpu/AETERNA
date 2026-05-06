/**
 * releaseEnvironmentConfig.ts
 * AETERNA-NATURAL v1.5 — Release Environment Config
 *
 * Defines the release channel / deployment environment configuration.
 * This layer sits above the runtime config and controls what is visible
 * and allowed in each deployment context.
 *
 * Design principles:
 * - publicResearch is the default and safe channel.
 * - experimental features, legacy constants, external API, and Node bridge
 *   are ALL disabled in publicResearch channel.
 * - Experimental channel is the only channel where dangerous features are allowed.
 * - No consciousness / life / intelligence / mystical claims.
 * - No Node bridge, LLM, or external API.
 *
 * Reference: docs/deployment-readiness.md
 */

// ── Release channel ────────────────────────────────────────────────────────────

/**
 * Release channel identifies the deployment context.
 *
 * 'local'            : local development
 * 'preview'          : preview / staging deployment
 * 'publicResearch'   : public research mode — safe defaults, no experimental
 * 'internalResearch' : internal research — some advanced features allowed with warnings
 * 'experimental'     : experimental build — all features allowed with warnings
 */
export type ReleaseChannel =
  | 'local'
  | 'preview'
  | 'publicResearch'
  | 'internalResearch'
  | 'experimental';

// ── Config interface ───────────────────────────────────────────────────────────

/**
 * Release environment configuration.
 *
 * Controls what features are accessible in each deployment context.
 * This is NOT a runtime dynamics config — it does not affect field update equations.
 * It controls UI visibility, feature gating, and deployment safety.
 */
export interface ReleaseEnvironmentConfig {
  /** Release channel. Default: 'publicResearch'. */
  channel: ReleaseChannel;

  /**
   * When true, public research mode is active.
   * Public mode enforces safe defaults and hides advanced / experimental panels.
   * Default: true.
   */
  publicResearchModeEnabled: boolean;

  /**
   * When true, experimental features (complexRuntime, resistanceOnly, etc.)
   * are unlockable via the UI.
   * MUST be false in publicResearch channel.
   * Default: false.
   */
  experimentalFeaturesEnabled: boolean;

  /**
   * When true, legacy constants mode (pre-N6) is allowed.
   * MUST be false in publicResearch channel.
   * Default: false.
   */
  legacyConstantsAllowed: boolean;

  /**
   * When true, external API calls would be allowed.
   * MUST be false in all channels (no external API is implemented).
   * Default: false.
   */
  externalApiEnabled: boolean;

  /**
   * When true, Node bridge would be active.
   * MUST be false in all channels (no Node bridge is implemented).
   * Default: false.
   */
  nodeBridgeEnabled: boolean;

  /**
   * When true, debug panels (raw diagnostics, full config dump) are shown.
   * Should be false in publicResearch channel.
   * Default: false.
   */
  showDebugPanels: boolean;

  /**
   * When true, raw field diagnostics are surfaced in the UI.
   * Should be false in publicResearch channel.
   * Default: false.
   */
  showRawDiagnostics: boolean;

  /**
   * When true, the full long-run comparison suite is allowed to run.
   * Should be false in publicResearch channel default to avoid heavy CI runs.
   * Default: false.
   */
  allowFullLongRun: boolean;

  /**
   * When true, interpretation notes are required to be visible.
   * MUST be true in publicResearch channel.
   * Default: true.
   */
  requireInterpretationNotes: boolean;
}

// ── Default config ─────────────────────────────────────────────────────────────

/**
 * Default release environment configuration — publicResearch channel.
 *
 * Safe defaults for public deployment:
 * - channel: publicResearch
 * - publicResearchModeEnabled: true
 * - experimentalFeaturesEnabled: false
 * - legacyConstantsAllowed: false
 * - externalApiEnabled: false     (no external API is implemented)
 * - nodeBridgeEnabled: false      (no Node bridge is implemented)
 * - showDebugPanels: false
 * - showRawDiagnostics: false
 * - allowFullLongRun: false
 * - requireInterpretationNotes: true
 */
export const defaultReleaseEnvironmentConfig: ReleaseEnvironmentConfig = {
  channel: 'publicResearch',
  publicResearchModeEnabled: true,
  experimentalFeaturesEnabled: false,
  legacyConstantsAllowed: false,
  externalApiEnabled: false,
  nodeBridgeEnabled: false,
  showDebugPanels: false,
  showRawDiagnostics: false,
  allowFullLongRun: false,
  requireInterpretationNotes: true,
};
