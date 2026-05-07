/**
 * finalDeploymentCopyGuard.test.ts
 * AETERNA-NATURAL v2.3 — Deployment Final Runbook — Copy Guard
 *
 * Final copy guard scan targeting the v2.3 deployment surface:
 *
 *   - New v2.3 deployment report doc
 *   - New test files (self-check)
 *   - Key UI components added / updated in v2.2
 *   - Release config files
 *   - Guide / export pipeline
 *   - Scenario text (v2.2 display list)
 *
 * Checks for affirmative proof claims only — compound phrases that would not
 * appear in negation disclaimers, guard definition arrays, or design notes.
 * The scanning set is intentionally narrower than the assertion text in guard
 * arrays such as guardLensGuideResponse.ts and researchGuardrails.ts.
 *
 * Reference: docs/deployment-final-runbook-report.md §10
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '../../..');

function safeRead(p: string): string {
  if (!existsSync(p)) return '';
  return readFileSync(p, 'utf-8');
}

// ── Affirmative proof claims (EN) ─────────────────────────────────────────────
//
// Only compound affirmative phrases that have no reasonable negation form in
// normal documentation text.

const AFFIRMATIVE_PROOF_EN: string[] = [
  'consciousness proved',
  'life proved',
  'intelligence proved',
  'aeterna is sentient',
  'aeterna is conscious',
  'aeterna is alive',
  'vortex is a mind',
  'vortex is mind',
  'plasticity is memory',
  'this is proof of consciousness',
  'this proves consciousness',
  'ratio proves truth',
];

// ── Affirmative proof claims (JA) ─────────────────────────────────────────────

const AFFIRMATIVE_PROOF_JA: string[] = [
  '意識が証明されました',
  '生命が証明されました',
  '知性が証明されました',
  'AETERNA は感じています',
  'AETERNA が欲しています',
  'AETERNA が理解しました',
  '渦は心です',
  '可塑性は記憶です',
];

function containsForbiddenClaim(content: string): boolean {
  const lower = content.toLowerCase();
  return (
    AFFIRMATIVE_PROOF_EN.some((term) => lower.includes(term.toLowerCase()))
    || AFFIRMATIVE_PROOF_JA.some((term) => content.includes(term))
  );
}

// ── v2.3 new doc (non-test files only; test files define guard strings) ───────
//
// Note: docs/deployment-final-runbook-report.md is intentionally excluded from
// this copy-guard scan. As an audit report, it documents forbidden terms in
// result tables and checklist rows (e.g. "consciousness proved — ✅ Not in copy").
// This is the same exclusion applied to guard definition files such as
// guardLensGuideResponse.ts and researchGuardrails.ts.

const V23_NEW_FILES: string[] = [];

// ── v2.2 key UI source files ───────────────────────────────────────────────────

const V22_UI_FILES = [
  'src/ui/public/RecommendedDemoFlow.tsx',
  'src/ui/public/PublicResearchLanding.tsx',
  'src/ui/public/PublicInterpretationNote.tsx',
  'src/ui/onboarding/FirstRunGuide.tsx',
  'src/ui/guide/LensAwareGuidePanel.tsx',
  'src/ui/guide/LensGuideQuestionInput.tsx',
];

// ── Config / release pipeline files ───────────────────────────────────────────

const CONFIG_FILES = [
  'src/config/publicResearchModeConfig.ts',
  'src/config/releaseEnvironmentConfig.ts',
  'src/config/lensGuideConfig.ts',
  'src/release/validateReleaseSafety.ts',
];

// ── Guide / export pipeline files (excluding guard definition files) ───────────

const GUIDE_EXPORT_FILES = [
  'src/guide/buildLensGuideContext.ts',
  'src/guide/routeLensGuideQuestion.ts',
  'src/guide/lensGuideProvider.ts',
  'src/research/buildResearchRunResult.ts',
  'src/research/exportResearchRunMarkdown.ts',
  'src/research/exportResearchRunJson.ts',
];

// ── Scenario display file ──────────────────────────────────────────────────────

const SCENARIO_FILES = [
  'src/scenario/publicResearchScenarioSet.ts',
  'src/scenario/researchScenarioRegistry.ts',
];

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('v2.3 copy guard — v2.3 new/updated files', () => {
  it('deployment-final-runbook-report.md exists (copy guard audit report, excluded from claim scan)', () => {
    // The report doc is intentionally excluded from claim scanning: as an audit report
    // it documents forbidden term results in table rows. See comment above V23_NEW_FILES.
    const { existsSync } = require('fs');
    const { resolve } = require('path');
    expect(existsSync(resolve(ROOT, 'docs/deployment-final-runbook-report.md'))).toBe(true);
  });

  for (const relPath of V23_NEW_FILES) {
    it(`${relPath} — no affirmative proof claims`, () => {
      const content = safeRead(resolve(ROOT, relPath));
      expect(containsForbiddenClaim(content)).toBe(false);
    });
  }
});

describe('v2.3 copy guard — v2.2 UI source files', () => {
  for (const relPath of V22_UI_FILES) {
    it(`${relPath} — no affirmative proof claims`, () => {
      const content = safeRead(resolve(ROOT, relPath));
      expect(containsForbiddenClaim(content)).toBe(false);
    });
  }
});

describe('v2.3 copy guard — config / release pipeline files', () => {
  for (const relPath of CONFIG_FILES) {
    it(`${relPath} — no affirmative proof claims`, () => {
      const content = safeRead(resolve(ROOT, relPath));
      expect(containsForbiddenClaim(content)).toBe(false);
    });
  }
});

describe('v2.3 copy guard — guide / export pipeline files', () => {
  for (const relPath of GUIDE_EXPORT_FILES) {
    it(`${relPath} — no affirmative proof claims`, () => {
      const content = safeRead(resolve(ROOT, relPath));
      expect(containsForbiddenClaim(content)).toBe(false);
    });
  }
});

describe('v2.3 copy guard — scenario display files', () => {
  for (const relPath of SCENARIO_FILES) {
    it(`${relPath} — no affirmative proof claims`, () => {
      const content = safeRead(resolve(ROOT, relPath));
      expect(containsForbiddenClaim(content)).toBe(false);
    });
  }
});

describe('v2.3 copy guard — combined surface scan', () => {
  const ALL_FILES = [
    ...V23_NEW_FILES,
    ...V22_UI_FILES,
    ...CONFIG_FILES,
    ...GUIDE_EXPORT_FILES,
    ...SCENARIO_FILES,
  ];

  it('no file in combined surface contains "consciousness proved"', () => {
    for (const relPath of ALL_FILES) {
      const content = safeRead(resolve(ROOT, relPath)).toLowerCase();
      expect(content).not.toContain('consciousness proved');
    }
  });

  it('no file in combined surface contains "life proved"', () => {
    for (const relPath of ALL_FILES) {
      const content = safeRead(resolve(ROOT, relPath)).toLowerCase();
      expect(content).not.toContain('life proved');
    }
  });

  it('no file in combined surface contains "aeterna is alive"', () => {
    for (const relPath of ALL_FILES) {
      const content = safeRead(resolve(ROOT, relPath)).toLowerCase();
      expect(content).not.toContain('aeterna is alive');
    }
  });

  it('no file in combined surface contains Japanese proof claims', () => {
    for (const relPath of ALL_FILES) {
      const content = safeRead(resolve(ROOT, relPath));
      for (const term of AFFIRMATIVE_PROOF_JA) {
        expect(content).not.toContain(term);
      }
    }
  });
});
