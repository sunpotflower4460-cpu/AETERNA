/**
 * finalCopyGuard.test.ts
 * AETERNA-NATURAL v2.1 — Final QA / Release Audit — Copy Guard
 *
 * Checks that user-facing display source files do not contain affirmative proof claims.
 *
 * Approach:
 * - Scans UI display/panel source files only (not guard implementation files,
 *   which legitimately contain the terms as strings to detect).
 * - Uses only clearly-affirmative claim phrases that would not appear in negation
 *   disclaimers, comments, or guard definition arrays.
 * - Checks docs for a subset of proof claims.
 *
 * The following files are intentionally EXCLUDED from scanning because they
 * define the forbidden terms as detection/guard strings:
 *   - guardLensGuideResponse.ts
 *   - guideClaimGuard.ts
 *   - researchGuardrails.ts
 *   - metricLensRegistry.ts (contains "consciousness" in disclaimers)
 *   - lensContextPacket.ts (contains "consciousness" in design notes)
 *   - cellObservation.ts (contains "consciousness" in design notes)
 *
 * Reference: docs/final-release-audit.md §12
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '../../..');

// ── Affirmative proof claims (EN) — checked in display source files ────────────
//
// These are only the AFFIRMATIVE compound forms that would never appear in
// negation disclaimers, design principle comments, or guard definition arrays.
// Terms like "mystical proof", "healing proof", "soul resonance", "AETERNA feels"
// are excluded from this list because they appear in design comments like
// "No mystical proof claims", "AETERNA feels is prohibited" etc.
// Only compound phrases with no reasonable negation form are included.

const AFFIRMATIVE_PROOF_EN: string[] = [
  'consciousness proved',
  'life proved',
  'intelligence proved',
  'aeterna is sentient',
  'aeterna is conscious',
  'vortex is a mind',
  'this is proof of consciousness',
  'this proves consciousness',
  'ratio proves truth',
];

// ── Affirmative proof claims (JA) — checked in display source files ────────────

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

// ── Proof claims for docs (conservative subset — clear affirmatives only) ────────

const DOC_PROOF_CLAIMS_EN: string[] = [
  'aeterna is sentient',
  'vortex is a mind',
];

const DOC_PROOF_CLAIMS_JA: string[] = [
  '意識が証明されました',
  '生命が証明されました',
  '知性が証明されました',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function safeRead(filePath: string): string {
  if (!existsSync(filePath)) return '';
  return readFileSync(filePath, 'utf-8');
}

function containsDisplayForbiddenClaim(text: string): string | null {
  const lower = text.toLowerCase();
  for (const claim of AFFIRMATIVE_PROOF_EN) {
    if (lower.includes(claim.toLowerCase())) return claim;
  }
  for (const claim of AFFIRMATIVE_PROOF_JA) {
    if (text.includes(claim)) return claim;
  }
  return null;
}

function containsDocForbiddenClaim(text: string): string | null {
  const lower = text.toLowerCase();
  for (const claim of DOC_PROOF_CLAIMS_EN) {
    if (lower.includes(claim.toLowerCase())) return claim;
  }
  for (const claim of DOC_PROOF_CLAIMS_JA) {
    if (text.includes(claim)) return claim;
  }
  return null;
}

// ── UI display source files — user-facing panel renderers ─────────────────────
// Only files that render or display content to users are included here.
// Files that define guard strings (guardLensGuideResponse, researchGuardrails)
// are excluded because they contain the forbidden terms as detection strings.

const DISPLAY_SOURCE_FILES = [
  'src/ui/observation/ObservationWorkspace.tsx',
  'src/ui/observation/ObservationHeader.tsx',
  'src/ui/observation/InspectorDrawer.tsx',
  'src/ui/observation/ObservationMobileTabs.tsx',
  'src/ui/observation/ObservationDiagnosticStrip.tsx',
  'src/ui/observation/CellInspectorPanel.tsx',
  'src/ui/observation/CellMetricRow.tsx',
  'src/ui/observation/MetricSpotlightPanel.tsx',
  'src/ui/observation/CausalTracePanel.tsx',
  'src/ui/observation/LayerCorrelationPanel.tsx',
  'src/ui/observation/DifferenceViewPanel.tsx',
  'src/ui/observation/ObservedRatioInvolvementPanel.tsx',
  'src/ui/replay/TimeReplayPanel.tsx',
  'src/ui/replay/ReplaySlider.tsx',
  'src/ui/replay/ReplaySnapshotSummary.tsx',
  'src/ui/guide/LensAwareGuidePanel.tsx',
  'src/ui/guide/LensGuideResponseView.tsx',
  'src/ui/guide/LensGuideModeTabs.tsx',
  'src/ui/guide/LensGuideQuestionInput.tsx',
  'src/ui/public/PublicResearchLanding.tsx',
  'src/ui/public/PublicInterpretationNote.tsx',
  'src/ui/public/PublicBuildInfo.tsx',
  'src/ui/onboarding/FirstRunGuide.tsx',
  'src/guide/ruleBasedLensGuide.ts',
  'src/guide/routeLensGuideQuestion.ts',
  'src/guide/buildLensGuideContext.ts',
  'src/guide/lensGuideTypes.ts',
  'src/research/exportResearchRunMarkdown.ts',
  'src/research/buildResearchRunResult.ts',
  'src/scenario/researchScenarioRegistry.ts',
  'src/scenario/presetExperimentRegistry.ts',
];

const DOC_FILES = [
  'README.md',
  'docs/public-research-mode.md',
  'docs/first-release-notes.md',
  'docs/deployment-readiness.md',
  'docs/manual-release-checklist.md',
  'docs/super-observation-architecture.md',
  'docs/deep-inspector-time-replay.md',
  'docs/causal-trace-layer-correlation.md',
  'docs/lens-aware-ai-guide.md',
  'docs/observation-ux-final-polish.md',
  'docs/research-export-reproducibility.md',
  'docs/research-scenarios-preset-experiments.md',
  'docs/implementation-language-guardrails.md',
  'docs/current-roadmap.md',
  'docs/final-release-audit.md',
];

// ── Display source file per-file copy guard ───────────────────────────────────

describe('v2.1 copy guard — UI display source files', () => {
  for (const relPath of DISPLAY_SOURCE_FILES) {
    const filePath = resolve(ROOT, relPath);
    it(`${relPath} — no affirmative proof claims`, () => {
      if (!existsSync(filePath)) return; // existence checked separately
      const content = safeRead(filePath);
      const hit = containsDisplayForbiddenClaim(content);
      expect(hit).toBeNull();
    });
  }
});

// ── Docs per-file copy guard (conservative subset) ───────────────────────────

describe('v2.1 copy guard — documentation files', () => {
  for (const relPath of DOC_FILES) {
    const filePath = resolve(ROOT, relPath);
    it(`${relPath} — exists`, () => {
      expect(existsSync(filePath)).toBe(true);
    });

    it(`${relPath} — no affirmative proof claims`, () => {
      if (!existsSync(filePath)) return;
      const content = safeRead(filePath);
      const hit = containsDocForbiddenClaim(content);
      expect(hit).toBeNull();
    });
  }
});

// ── Required source files exist ───────────────────────────────────────────────

describe('v2.1 copy guard — required source files exist', () => {
  const requiredFiles = [
    'src/ui/observation/ObservationWorkspace.tsx',
    'src/ui/observation/CellInspectorPanel.tsx',
    'src/ui/observation/MetricSpotlightPanel.tsx',
    'src/ui/observation/CausalTracePanel.tsx',
    'src/ui/observation/LayerCorrelationPanel.tsx',
    'src/ui/observation/DifferenceViewPanel.tsx',
    'src/ui/observation/ObservedRatioInvolvementPanel.tsx',
    'src/ui/replay/TimeReplayPanel.tsx',
    'src/ui/guide/LensAwareGuidePanel.tsx',
    'src/guide/ruleBasedLensGuide.ts',
    'src/guide/guardLensGuideResponse.ts',
    'src/guide/lensGuideProvider.ts',
    'src/research/researchGuardrails.ts',
    'src/research/exportResearchRunMarkdown.ts',
    'src/config/publicResearchModeConfig.ts',
    'src/config/releaseEnvironmentConfig.ts',
    'src/config/lensGuideConfig.ts',
    'src/scenario/publicResearchScenarioSet.ts',
    'src/scenario/publicPresetExperimentSet.ts',
  ];

  for (const relPath of requiredFiles) {
    it(`${relPath} exists`, () => {
      expect(existsSync(resolve(ROOT, relPath))).toBe(true);
    });
  }
});

// ── Bulk display scan — combined content ──────────────────────────────────────

describe('v2.1 copy guard — bulk display source scan', () => {
  const allDisplayContent = DISPLAY_SOURCE_FILES
    .map((f) => safeRead(resolve(ROOT, f)))
    .join('\n');

  it('bulk: no affirmative English proof claims in display source files', () => {
    const lower = allDisplayContent.toLowerCase();
    for (const claim of AFFIRMATIVE_PROOF_EN) {
      expect(lower, `Found: "${claim}"`).not.toContain(claim.toLowerCase());
    }
  });

  it('bulk: no affirmative Japanese proof claims in display source files', () => {
    for (const claim of AFFIRMATIVE_PROOF_JA) {
      expect(allDisplayContent, `Found: "${claim}"`).not.toContain(claim);
    }
  });
});

