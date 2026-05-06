/**
 * publicBuildSafety.test.ts
 * AETERNA-NATURAL v1.5 — Public Build Safety Tests
 *
 * Confirms:
 * - PublicBuildInfo does not expose secrets or API keys
 * - PublicBuildInfo does not contain forbidden proof claims
 * - Build channel is publicResearch
 * - Release environment and public mode configs are consistent
 * - Full long-run is not enabled in publicResearch default
 */

import { describe, it, expect } from 'vitest';

import {
  BUILD_APP_NAME,
  BUILD_VERSION,
  BUILD_RELEASE_CHANNEL,
  BUILD_MODE_LABEL,
  BUILD_STATUS_LABEL,
  BUILD_NO_PROOF_NOTE,
  getPublicBuildInfo,
  renderPublicBuildBadge,
  renderPublicBuildInfoText,
} from '../../ui/public/PublicBuildInfo.js';

import { defaultReleaseEnvironmentConfig } from '../../config/releaseEnvironmentConfig.js';
import { defaultPublicResearchModeConfig } from '../../config/publicResearchModeConfig.js';
import { defaultAeternaNaturalRuntimeConfig } from '../../config/aeternaNaturalRuntimeConfig.js';

const FORBIDDEN_CLAIMS = [
  'consciousness proved',
  'life proved',
  'intelligence proved',
  'healing proof',
  'soul resonance',
  'aeterna is alive',
  'aeterna understands',
  'aeterna feels',
  'aeterna wants',
];

function noForbiddenClaims(text: string): string | null {
  const lower = text.toLowerCase();
  for (const claim of FORBIDDEN_CLAIMS) {
    if (lower.includes(claim)) return claim;
  }
  return null;
}

// ── PublicBuildInfo content safety ────────────────────────────────────────────

describe('PublicBuildInfo — content safety', () => {
  it('app name contains no forbidden claims', () => {
    expect(noForbiddenClaims(BUILD_APP_NAME)).toBeNull();
  });

  it('version string contains no forbidden claims', () => {
    expect(noForbiddenClaims(BUILD_VERSION)).toBeNull();
  });

  it('release channel is publicResearch', () => {
    expect(BUILD_RELEASE_CHANNEL).toBe('publicResearch');
  });

  it('mode label contains no forbidden claims', () => {
    expect(noForbiddenClaims(BUILD_MODE_LABEL)).toBeNull();
  });

  it('status label contains no forbidden claims', () => {
    expect(noForbiddenClaims(BUILD_STATUS_LABEL)).toBeNull();
  });

  it('no-proof note contains "not proof"', () => {
    expect(BUILD_NO_PROOF_NOTE.toLowerCase()).toContain('not proof');
  });

  it('no-proof note contains no forbidden claims', () => {
    expect(noForbiddenClaims(BUILD_NO_PROOF_NOTE)).toBeNull();
  });
});

describe('getPublicBuildInfo', () => {
  it('returns build info without secrets', () => {
    const info = getPublicBuildInfo();
    // Should not contain any API key pattern
    const allText = Object.values(info).join('\n');
    expect(allText).not.toMatch(/sk-[a-zA-Z0-9]+/);
    expect(allText).not.toMatch(/api[_-]?key/i);
    expect(allText).not.toMatch(/password/i);
    expect(allText).not.toMatch(/secret/i);
  });

  it('returns appName as AETERNA-NATURAL', () => {
    expect(getPublicBuildInfo().appName).toBe('AETERNA-NATURAL');
  });

  it('returns releaseChannel as publicResearch', () => {
    expect(getPublicBuildInfo().releaseChannel).toBe('publicResearch');
  });
});

describe('renderPublicBuildBadge', () => {
  it('badge contains app name', () => {
    expect(renderPublicBuildBadge()).toContain('AETERNA-NATURAL');
  });

  it('badge contains mode label', () => {
    expect(renderPublicBuildBadge()).toContain('Public Research Mode');
  });

  it('badge contains no forbidden claims', () => {
    expect(noForbiddenClaims(renderPublicBuildBadge())).toBeNull();
  });
});

describe('renderPublicBuildInfoText', () => {
  it('contains no forbidden claims in any line', () => {
    for (const line of renderPublicBuildInfoText()) {
      expect(noForbiddenClaims(line)).toBeNull();
    }
  });
});

// ── Public build config consistency ──────────────────────────────────────────

describe('Public build config consistency', () => {
  it('defaultReleaseEnvironmentConfig channel matches BUILD_RELEASE_CHANNEL', () => {
    expect(defaultReleaseEnvironmentConfig.channel).toBe(BUILD_RELEASE_CHANNEL);
  });

  it('full long-run is disabled in publicResearch default', () => {
    expect(defaultReleaseEnvironmentConfig.allowFullLongRun).toBe(false);
    expect(defaultAeternaNaturalRuntimeConfig.longRunComparisonEnabled).toBe(false);
  });

  it('defaultPresetId is safeBaseline', () => {
    expect(defaultPublicResearchModeConfig.defaultPresetId).toBe('safeBaseline');
  });

  it('defaultScenarioId is quietBaseline', () => {
    expect(defaultPublicResearchModeConfig.defaultScenarioId).toBe('quietBaseline');
  });

  it('experimental features are disabled across all public configs', () => {
    expect(defaultReleaseEnvironmentConfig.experimentalFeaturesEnabled).toBe(false);
    expect(defaultPublicResearchModeConfig.allowExperimentalMode).toBe(false);
    expect(defaultAeternaNaturalRuntimeConfig.safetyMode).toBe('safe');
  });
});
