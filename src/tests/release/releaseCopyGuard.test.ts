/**
 * releaseCopyGuard.test.ts
 * AETERNA-NATURAL v1.5 — Release Copy Guard Tests
 *
 * Extended copy guard for v1.5 deployment readiness.
 * Checks key source files, UI components, and docs for forbidden proof claims.
 *
 * Prohibited claims (English + Japanese):
 *   consciousness proved, life proved, intelligence proved,
 *   healing proof, mystical proof, soul resonance,
 *   AETERNA is alive, AETERNA understands, AETERNA feels, AETERNA wants,
 *   proves consciousness, proves life, proves intelligence,
 *   意識が証明, 生命が証明, 知性が証明, 癒しの証明, 神秘の証明, 魂の共鳴
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '../../..');

const PROHIBITED_CLAIMS = [
  'consciousness proved',
  'life proved',
  'intelligence proved',
  'healing proof',
  'soul resonance',
  'ai became alive',
  'aeterna is conscious',
  'aeterna wants',
  'aeterna feels',
  'aeterna is alive',
  'aeterna understands',
  '意識が証明',
  '生命が証明',
  '知性が証明',
  '癒しの証明',
  '神秘の証明',
  '魂の共鳴',
];

function containsProhibitedClaim(text: string): string | null {
  const lower = text.toLowerCase();
  for (const claim of PROHIBITED_CLAIMS) {
    if (lower.includes(claim.toLowerCase())) return claim;
  }
  return null;
}

function checkFile(filePath: string): void {
  const fileName = filePath.replace(ROOT + '/', '');

  it(`${fileName} exists`, () => {
    expect(existsSync(filePath)).toBe(true);
  });

  it(`${fileName} — no forbidden proof claims`, () => {
    if (!existsSync(filePath)) return;
    const content = readFileSync(filePath, 'utf-8');
    const hit = containsProhibitedClaim(content);
    expect(hit).toBeNull();
  });
}

// ── Docs files ────────────────────────────────────────────────────────────────

describe('release copy guard — docs', () => {
  checkFile(resolve(ROOT, 'README.md'));
  checkFile(resolve(ROOT, 'docs/public-research-mode.md'));
  checkFile(resolve(ROOT, 'docs/first-release-notes.md'));
  checkFile(resolve(ROOT, 'docs/deployment-readiness.md'));
  checkFile(resolve(ROOT, 'docs/manual-release-checklist.md'));
  checkFile(resolve(ROOT, 'docs/performance-smoke-check.md'));
});

// ── UI components ─────────────────────────────────────────────────────────────

describe('release copy guard — UI components', () => {
  checkFile(resolve(ROOT, 'src/ui/public/PublicResearchLanding.tsx'));
  checkFile(resolve(ROOT, 'src/ui/public/PublicInterpretationNote.tsx'));
  checkFile(resolve(ROOT, 'src/ui/public/PublicBuildInfo.tsx'));
  checkFile(resolve(ROOT, 'src/ui/onboarding/FirstRunGuide.tsx'));
  checkFile(resolve(ROOT, 'src/ui/system/AppErrorBoundary.tsx'));
  checkFile(resolve(ROOT, 'src/ui/system/FallbackScreen.tsx'));
  checkFile(resolve(ROOT, 'src/ui/system/SafeResetButton.tsx'));
});

// ── Config files ──────────────────────────────────────────────────────────────

describe('release copy guard — config files', () => {
  checkFile(resolve(ROOT, 'src/config/releaseEnvironmentConfig.ts'));
  checkFile(resolve(ROOT, 'src/config/publicResearchModeConfig.ts'));
  checkFile(resolve(ROOT, 'src/config/aeternaNaturalRuntimeConfig.ts'));
  checkFile(resolve(ROOT, 'src/config/aeternaNaturalPresets.ts'));
});

// ── Release files ─────────────────────────────────────────────────────────────

describe('release copy guard — release files', () => {
  checkFile(resolve(ROOT, 'src/release/validateReleaseSafety.ts'));
});
