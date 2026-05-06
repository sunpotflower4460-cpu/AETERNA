/**
 * PublicBuildInfo.tsx
 * AETERNA-NATURAL v1.5 — Public Build Info Display
 *
 * Headless TypeScript model for the public build info banner.
 * No JSX / no DOM rendering — caller is responsible for rendering.
 *
 * Displays:
 * - App name
 * - Version
 * - Release channel
 * - Mode label (Public Research Mode)
 * - Status label (Prototype / Research Preview)
 *
 * Principles:
 * - No API keys, secrets, or sensitive environment data.
 * - No consciousness / life / intelligence claims.
 * - No debug diagnostics in public build.
 *
 * Reference: docs/deployment-readiness.md §4
 */

// ── Build info ─────────────────────────────────────────────────────────────────

export const BUILD_APP_NAME = 'AETERNA-NATURAL';
export const BUILD_VERSION = '1.5.0-research-preview';
export const BUILD_RELEASE_CHANNEL = 'publicResearch';
export const BUILD_MODE_LABEL = 'Public Research Mode';
export const BUILD_STATUS_LABEL = 'Prototype / Research Preview';

export const BUILD_NO_PROOF_NOTE =
  'This system is not proof of consciousness, life, intelligence, or mystical truth. ' +
  'Observations are observations — not proof.';

// ── Build info type ────────────────────────────────────────────────────────────

export interface PublicBuildInfoData {
  appName: string;
  version: string;
  releaseChannel: string;
  modeLabel: string;
  statusLabel: string;
  noProofNote: string;
}

// ── Build info factory ─────────────────────────────────────────────────────────

/**
 * Returns the public build info data for display.
 *
 * Safe to render in public mode:
 * - No secrets, API keys, or sensitive environment data.
 * - No internal diagnostics or raw config dumps.
 */
export function getPublicBuildInfo(): PublicBuildInfoData {
  return {
    appName: BUILD_APP_NAME,
    version: BUILD_VERSION,
    releaseChannel: BUILD_RELEASE_CHANNEL,
    modeLabel: BUILD_MODE_LABEL,
    statusLabel: BUILD_STATUS_LABEL,
    noProofNote: BUILD_NO_PROOF_NOTE,
  };
}

/**
 * Returns the build info as plain-text lines for display.
 */
export function renderPublicBuildInfoText(): string[] {
  return [
    BUILD_APP_NAME,
    `Version: ${BUILD_VERSION}`,
    BUILD_MODE_LABEL,
    BUILD_STATUS_LABEL,
  ];
}

/**
 * Returns a compact single-line build badge string.
 */
export function renderPublicBuildBadge(): string {
  return `${BUILD_APP_NAME} · ${BUILD_MODE_LABEL} · ${BUILD_STATUS_LABEL}`;
}
