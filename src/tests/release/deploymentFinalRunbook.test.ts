/**
 * deploymentFinalRunbook.test.ts
 * AETERNA-NATURAL v2.3 — Deployment Final Runbook
 *
 * Verifies the end-to-end deployment readiness checks required by
 * docs/deployment-final-runbook-report.md:
 *
 *   Phase 3:  Public mode default safety (all danger flags off)
 *   Phase 5:  Super Observation system components exist
 *   Phase 6:  Live / Replay distinction is present
 *   Phase 7:  Lens-aware AI Guide defaults (ruleBased, no external API)
 *   Phase 8:  Export / Reproducibility guardrails exist
 *   Phase 9:  Scenario / Demo flow (nonGuaranteed notes, public-safe set)
 *   Phase 11: Key scripts / docs exist (build, release check, key docs)
 *   Phase 12: Deployment target (no hardcoded external API / Node bridge)
 *   Phase 17: runtime dynamics unchanged (dynamicCore has no LLM/API import)
 *   Phase 18: No fake result / fake event markers in release files
 *   Phase 19: Node bridge / external API not added
 *
 * All checks are structural (file existence, config values, source patterns).
 * No runtime simulation is performed.
 *
 * Reference: docs/deployment-final-runbook-report.md
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

import { defaultPublicResearchModeConfig } from '../../config/publicResearchModeConfig.js';
import { defaultReleaseEnvironmentConfig } from '../../config/releaseEnvironmentConfig.js';
import { defaultAeternaNaturalRuntimeConfig } from '../../config/aeternaNaturalRuntimeConfig.js';
import { defaultLensGuideConfig } from '../../config/lensGuideConfig.js';
import {
  PUBLIC_SAFE_SCENARIO_IDS,
  ADVANCED_SCENARIO_IDS,
} from '../../scenario/publicResearchScenarioSet.js';
import { RESEARCH_SCENARIO_REGISTRY } from '../../scenario/researchScenarioRegistry.js';
import {
  RESEARCH_INTERPRETATION_GUARDRAILS_EN,
  RESEARCH_INTERPRETATION_GUARDRAILS_JA,
} from '../../research/researchGuardrails.js';
import { validateReleaseSafety } from '../../release/validateReleaseSafety.js';

const ROOT = resolve(__dirname, '../../..');

function read(rel: string): string {
  const p = resolve(ROOT, rel);
  if (!existsSync(p)) return '';
  return readFileSync(p, 'utf-8');
}

function exists(rel: string): boolean {
  return existsSync(resolve(ROOT, rel));
}

// ── Phase 3: Public Mode Default Safety ───────────────────────────────────────

describe('v2.3 runbook phase 3 — public mode default safety', () => {
  it('defaultPublicResearchModeConfig.enabled is true', () => {
    expect(defaultPublicResearchModeConfig.enabled).toBe(true);
  });

  it('defaultPresetId is safeBaseline', () => {
    expect(defaultPublicResearchModeConfig.defaultPresetId).toBe('safeBaseline');
  });

  it('defaultScenarioId is quietBaseline', () => {
    expect(defaultPublicResearchModeConfig.defaultScenarioId).toBe('quietBaseline');
  });

  it('allowExperimentalMode is false', () => {
    expect(defaultPublicResearchModeConfig.allowExperimentalMode).toBe(false);
  });

  it('allowComplexRuntime is false', () => {
    expect(defaultPublicResearchModeConfig.allowComplexRuntime).toBe(false);
  });

  it('allowWeakPlasticityResistanceOnly is false', () => {
    expect(defaultPublicResearchModeConfig.allowWeakPlasticityResistanceOnly).toBe(false);
  });

  it('allowLegacyConstants is false', () => {
    expect(defaultPublicResearchModeConfig.allowLegacyConstants).toBe(false);
  });

  it('channel is publicResearch', () => {
    expect(defaultReleaseEnvironmentConfig.channel).toBe('publicResearch');
  });

  it('publicResearchModeEnabled is true', () => {
    expect(defaultReleaseEnvironmentConfig.publicResearchModeEnabled).toBe(true);
  });

  it('experimentalFeaturesEnabled is false', () => {
    expect(defaultReleaseEnvironmentConfig.experimentalFeaturesEnabled).toBe(false);
  });

  it('externalApiEnabled is false', () => {
    expect(defaultReleaseEnvironmentConfig.externalApiEnabled).toBe(false);
  });

  it('nodeBridgeEnabled is false', () => {
    expect(defaultReleaseEnvironmentConfig.nodeBridgeEnabled).toBe(false);
  });

  it('legacyConstantsAllowed is false', () => {
    expect(defaultReleaseEnvironmentConfig.legacyConstantsAllowed).toBe(false);
  });

  it('requireInterpretationNotes is true', () => {
    expect(defaultReleaseEnvironmentConfig.requireInterpretationNotes).toBe(true);
  });

  it('validateReleaseSafety passes on default configs', () => {
    const result = validateReleaseSafety({
      releaseConfig: defaultReleaseEnvironmentConfig,
      publicModeConfig: defaultPublicResearchModeConfig,
      naturalRuntimeConfig: defaultAeternaNaturalRuntimeConfig,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

// ── Phase 5: Super Observation system components ───────────────────────────────

describe('v2.3 runbook phase 5 — super observation system components exist', () => {
  it('ObservationWorkspace exists', () => {
    expect(exists('src/ui/observation/ObservationWorkspace.tsx')).toBe(true);
  });

  it('CellInspectorPanel exists', () => {
    expect(exists('src/ui/observation/CellInspectorPanel.tsx')).toBe(true);
  });

  it('MetricSpotlightPanel exists', () => {
    expect(exists('src/ui/observation/MetricSpotlightPanel.tsx')).toBe(true);
  });

  it('CausalTracePanel exists', () => {
    expect(exists('src/ui/observation/CausalTracePanel.tsx')).toBe(true);
  });

  it('LayerCorrelationPanel exists', () => {
    expect(exists('src/ui/observation/LayerCorrelationPanel.tsx')).toBe(true);
  });

  it('DifferenceViewPanel exists', () => {
    expect(exists('src/ui/observation/DifferenceViewPanel.tsx')).toBe(true);
  });

  it('metricLensRegistry exists', () => {
    expect(exists('src/ui/lens/metricLensRegistry.ts')).toBe(true);
  });

  it('LensAwareGuidePanel exists', () => {
    expect(exists('src/ui/guide/LensAwareGuidePanel.tsx')).toBe(true);
  });
});

// ── Phase 6: Live / Replay distinction ────────────────────────────────────────

describe('v2.3 runbook phase 6 — live / replay distinction', () => {
  const replaySrc = read('src/ui/replay/TimeReplayPanel.tsx');

  it('TimeReplayPanel exists', () => {
    expect(replaySrc).not.toBe('');
  });

  it('Replay Mode disclaimer mentions "recorded observation snapshots"', () => {
    expect(replaySrc).toContain('recorded observation snapshots');
  });

  it('Replay Mode disclaimer clarifies runtime is not moved backward', () => {
    expect(replaySrc.toLowerCase()).toContain('backward');
  });

  it('Return to Live button is present', () => {
    expect(replaySrc).toContain('Return to Live');
  });

  it('Live and Replay modes are named separately', () => {
    expect(replaySrc).toContain('Live');
    expect(replaySrc).toContain('Replay');
  });
});

// ── Phase 7: Lens-aware AI Guide defaults ─────────────────────────────────────

describe('v2.3 runbook phase 7 — lens-aware AI guide defaults', () => {
  it('default provider is ruleBased', () => {
    expect(defaultLensGuideConfig.provider).toBe('ruleBased');
  });

  it('allowExternalApi is false', () => {
    expect(defaultLensGuideConfig.allowExternalApi).toBe(false);
  });

  it('requireClaimGuard is true', () => {
    expect(defaultLensGuideConfig.requireClaimGuard).toBe(true);
  });

  it('requireCautionNotes is true', () => {
    expect(defaultLensGuideConfig.requireCautionNotes).toBe(true);
  });

  it('guardLensGuideResponse exists (claim guard implementation)', () => {
    expect(exists('src/guide/guardLensGuideResponse.ts')).toBe(true);
  });

  it('buildLensGuideContext does not reference raw field data directly', () => {
    const src = read('src/guide/buildLensGuideContext.ts');
    expect(src).not.toContain('dynamicCore');
    expect(src).not.toContain('rawField');
  });
});

// ── Phase 8: Export / Reproducibility ─────────────────────────────────────────

describe('v2.3 runbook phase 8 — export / reproducibility guardrails', () => {
  it('researchGuardrails.ts exists', () => {
    expect(exists('src/research/researchGuardrails.ts')).toBe(true);
  });

  it('RESEARCH_INTERPRETATION_GUARDRAILS_EN contains 5 required lines', () => {
    expect(RESEARCH_INTERPRETATION_GUARDRAILS_EN.length).toBeGreaterThanOrEqual(5);
  });

  it('RESEARCH_INTERPRETATION_GUARDRAILS_JA has matching count', () => {
    expect(RESEARCH_INTERPRETATION_GUARDRAILS_JA.length).toBe(
      RESEARCH_INTERPRETATION_GUARDRAILS_EN.length,
    );
  });

  it('guardrails include "not proof of consciousness"', () => {
    const combined = RESEARCH_INTERPRETATION_GUARDRAILS_EN.join(' ').toLowerCase();
    expect(combined).toContain('not proof of consciousness');
  });

  it('guardrails include "not minds or memories"', () => {
    const combined = RESEARCH_INTERPRETATION_GUARDRAILS_EN.join(' ').toLowerCase();
    expect(combined).toContain('not minds or memories');
  });

  it('guardrails include "valid observation" (absence of emergence note)', () => {
    const combined = RESEARCH_INTERPRETATION_GUARDRAILS_EN.join(' ').toLowerCase();
    expect(combined).toContain('valid observation');
  });

  it('exportResearchRunJson exists', () => {
    expect(exists('src/research/exportResearchRunJson.ts')).toBe(true);
  });

  it('exportResearchRunMarkdown exists', () => {
    expect(exists('src/research/exportResearchRunMarkdown.ts')).toBe(true);
  });

  it('exportResearchRunMarkdown references seed', () => {
    const src = read('src/research/exportResearchRunMarkdown.ts');
    expect(src.toLowerCase()).toContain('seed');
  });

  it('exportResearchRunMarkdown references scenarioId', () => {
    const src = read('src/research/exportResearchRunMarkdown.ts');
    expect(src).toContain('scenarioId');
  });
});

// ── Phase 9: Scenario / Demo flow ─────────────────────────────────────────────

describe('v2.3 runbook phase 9 — scenario / demo flow', () => {
  it('quietBaseline is in PUBLIC_SAFE_SCENARIO_IDS', () => {
    expect(PUBLIC_SAFE_SCENARIO_IDS).toContain('quietBaseline');
  });

  it('fullNaturalLongRun is in ADVANCED_SCENARIO_IDS (gated)', () => {
    expect(ADVANCED_SCENARIO_IDS).toContain('fullNaturalLongRun');
  });

  it('scenarios have nonGuaranteedNotes', () => {
    const withNotes = RESEARCH_SCENARIO_REGISTRY.filter(
      (s) => s.nonGuaranteedNotes && s.nonGuaranteedNotes.length > 0,
    );
    expect(withNotes.length).toBeGreaterThan(0);
  });

  it('RecommendedDemoFlow exists', () => {
    expect(exists('src/ui/public/RecommendedDemoFlow.tsx')).toBe(true);
  });

  it('RecommendedDemoFlow references Start Safe Observation', () => {
    const src = read('src/ui/public/RecommendedDemoFlow.tsx');
    expect(src).toContain('Start Safe Observation');
  });

  it('FirstRunGuide exists', () => {
    expect(exists('src/ui/onboarding/FirstRunGuide.tsx')).toBe(true);
  });
});

// ── Phase 11: Key scripts and docs exist ──────────────────────────────────────

describe('v2.3 runbook phase 11 — key scripts and docs', () => {
  it('check:release script file exists', () => {
    expect(exists('scripts/run-release-checks.ts')).toBe(true);
  });

  it('README.md exists', () => {
    expect(exists('README.md')).toBe(true);
  });

  it('docs/deployment-readiness.md exists', () => {
    expect(exists('docs/deployment-readiness.md')).toBe(true);
  });

  it('docs/manual-release-checklist.md exists', () => {
    expect(exists('docs/manual-release-checklist.md')).toBe(true);
  });

  it('docs/final-release-audit.md exists', () => {
    expect(exists('docs/final-release-audit.md')).toBe(true);
  });

  it('docs/public-demo-polish.md exists', () => {
    expect(exists('docs/public-demo-polish.md')).toBe(true);
  });

  it('docs/first-demo-checklist.md exists', () => {
    expect(exists('docs/first-demo-checklist.md')).toBe(true);
  });

  it('docs/super-observation-architecture.md exists', () => {
    expect(exists('docs/super-observation-architecture.md')).toBe(true);
  });

  it('docs/lens-aware-ai-guide.md exists', () => {
    expect(exists('docs/lens-aware-ai-guide.md')).toBe(true);
  });

  it('docs/implementation-language-guardrails.md exists', () => {
    expect(exists('docs/implementation-language-guardrails.md')).toBe(true);
  });

  it('docs/deployment-final-runbook-report.md exists', () => {
    expect(exists('docs/deployment-final-runbook-report.md')).toBe(true);
  });
});

// ── Phase 12: Deployment target safety ────────────────────────────────────────

describe('v2.3 runbook phase 12 — deployment target safety', () => {
  it('dynamicCore.ts does not import external API', () => {
    const src = read('src/core/dynamicCore.ts');
    expect(src).not.toMatch(/import.*fetch/);
    expect(src).not.toContain('openai');
    expect(src).not.toContain('externalApi');
  });

  it('dynamicCore.ts does not import Node bridge', () => {
    const src = read('src/core/dynamicCore.ts');
    expect(src).not.toContain('nodeBridge');
    expect(src).not.toContain('Node-AI-Z');
  });

  it('publicResearchModeConfig does not import external API', () => {
    const src = read('src/config/publicResearchModeConfig.ts');
    expect(src).not.toContain('externalApi');
    expect(src).not.toContain('nodeBridge');
  });
});

// ── Phase 17-20: Final safety assertions ──────────────────────────────────────

describe('v2.3 runbook phase 17-20 — final safety assertions', () => {
  it('validateReleaseSafety.ts exists', () => {
    expect(exists('src/release/validateReleaseSafety.ts')).toBe(true);
  });

  it('dynamicCore.ts does not import referenceRatios (runtime feedback guard)', () => {
    const src = read('src/core/dynamicCore.ts');
    expect(src).not.toContain('referenceRatios');
    expect(src).not.toContain('observedRatios');
  });

  it('no fakeResult / fakeEvent / fakeVisual in release config files', () => {
    const files = [
      'src/config/publicResearchModeConfig.ts',
      'src/config/releaseEnvironmentConfig.ts',
      'src/release/validateReleaseSafety.ts',
    ];
    for (const f of files) {
      const src = read(f).toLowerCase();
      expect(src).not.toContain('fakeresult');
      expect(src).not.toContain('fakeevent');
      expect(src).not.toContain('fakevisual');
    }
  });

  it('lensGuideProvider does not import external fetch or API SDK', () => {
    const src = read('src/guide/lensGuideProvider.ts');
    expect(src).not.toMatch(/import.*fetch/);
    expect(src).not.toContain('openai');
    expect(src).not.toContain('anthropic');
  });
});
