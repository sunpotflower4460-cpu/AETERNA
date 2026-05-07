/**
 * observationDisplayModeConfig.ts
 * v2.4: AETERNA-NATURAL Japanese-First UI — Observation Display Mode Config
 *
 * Defines ObservationDisplayMode and ObservationDisplayModeConfig.
 * Controls visibility of internal IDs, English labels, raw diagnostics,
 * and advanced metrics per mode.
 *
 * Modes:
 *   beginner    — 初見ユーザー向け。専門語・internalId を隠す。
 *   standard    — 通常観測。日本語名 + 種別。
 *   researcher  — 研究者モード。日本語名 + 英語名。
 *   developer   — 開発者モード。日本語名 + 英語名 + internalId。
 *
 * Principles:
 * - No runtime dynamics changes.
 * - Display configuration only.
 * - No consciousness / life / intelligence proof claims.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type ObservationDisplayMode =
    | 'beginner'
    | 'standard'
    | 'researcher'
    | 'developer';

export interface ObservationDisplayModeConfig {
    mode: ObservationDisplayMode;
    /** Show internal code IDs (e.g. vortexCandidateConfidence) */
    showInternalIds: boolean;
    /** Show English labels alongside Japanese labels */
    showEnglishLabels: boolean;
    /** Show raw diagnostic logs */
    showRawDiagnostics: boolean;
    /** Show advanced metrics not shown in beginner/standard mode */
    showAdvancedMetrics: boolean;
    /** Show developer warnings and debug hints */
    showDeveloperWarnings: boolean;
}

// ── Mode presets ──────────────────────────────────────────────────────────────

export const BEGINNER_DISPLAY_MODE_CONFIG: ObservationDisplayModeConfig = {
    mode: 'beginner',
    showInternalIds: false,
    showEnglishLabels: false,
    showRawDiagnostics: false,
    showAdvancedMetrics: false,
    showDeveloperWarnings: false,
};

export const STANDARD_DISPLAY_MODE_CONFIG: ObservationDisplayModeConfig = {
    mode: 'standard',
    showInternalIds: false,
    showEnglishLabels: false,
    showRawDiagnostics: false,
    showAdvancedMetrics: true,
    showDeveloperWarnings: false,
};

export const RESEARCHER_DISPLAY_MODE_CONFIG: ObservationDisplayModeConfig = {
    mode: 'researcher',
    showInternalIds: false,
    showEnglishLabels: true,
    showRawDiagnostics: false,
    showAdvancedMetrics: true,
    showDeveloperWarnings: false,
};

export const DEVELOPER_DISPLAY_MODE_CONFIG: ObservationDisplayModeConfig = {
    mode: 'developer',
    showInternalIds: true,
    showEnglishLabels: true,
    showRawDiagnostics: true,
    showAdvancedMetrics: true,
    showDeveloperWarnings: true,
};

/** Default mode for new users */
export const defaultObservationDisplayModeConfig: ObservationDisplayModeConfig =
    BEGINNER_DISPLAY_MODE_CONFIG;

// ── All mode configs ──────────────────────────────────────────────────────────

export const OBSERVATION_DISPLAY_MODE_CONFIGS: Record<
    ObservationDisplayMode,
    ObservationDisplayModeConfig
> = {
    beginner:   BEGINNER_DISPLAY_MODE_CONFIG,
    standard:   STANDARD_DISPLAY_MODE_CONFIG,
    researcher: RESEARCHER_DISPLAY_MODE_CONFIG,
    developer:  DEVELOPER_DISPLAY_MODE_CONFIG,
};

// ── Helper ────────────────────────────────────────────────────────────────────

export function getDisplayModeConfig(
    mode: ObservationDisplayMode,
): ObservationDisplayModeConfig {
    return OBSERVATION_DISPLAY_MODE_CONFIGS[mode];
}

/**
 * Returns true if the given term should be visible in the given mode config.
 * @param beginnerVisible - whether the term is visible in beginner mode
 * @param researcherVisible - whether the term is visible in researcher/developer mode
 */
export function isTermVisibleInMode(
    config: ObservationDisplayModeConfig,
    beginnerVisible: boolean,
    researcherVisible: boolean,
): boolean {
    if (config.mode === 'beginner') return beginnerVisible;
    if (config.mode === 'standard') return true;
    if (config.mode === 'researcher') return researcherVisible;
    if (config.mode === 'developer') return true;
    return true;
}
