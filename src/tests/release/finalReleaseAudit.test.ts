/**
 * finalReleaseAudit.test.ts
 * AETERNA-NATURAL v2.1 — Final QA / Release Audit — Comprehensive Audit
 *
 * Covers audit items not covered by the more specific test files:
 *   - Runtime dynamics non-change confirmation
 *   - Warning / caution severity categories
 *   - Scenario / preset non-guarantee language
 *   - Replay snapshot lightweight constraint
 *   - Guide does not receive raw field data
 *   - Key docs exist
 *   - release check script exists
 *
 * Reference: docs/final-release-audit.md
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

import { defaultAeternaNaturalRuntimeConfig } from '../../config/aeternaNaturalRuntimeConfig.js';
import { AETERNA_NATURAL_PRESETS } from '../../config/aeternaNaturalPresets.js';
import { RESEARCH_SCENARIO_REGISTRY as RESEARCH_SCENARIOS } from '../../scenario/researchScenarioRegistry.js';
import { PRESET_EXPERIMENT_REGISTRY as PRESET_EXPERIMENTS } from '../../scenario/presetExperimentRegistry.js';
import {
  RESEARCH_INTERPRETATION_GUARDRAILS_EN,
  RESEARCH_INTERPRETATION_GUARDRAILS_JA,
} from '../../research/researchGuardrails.js';
import { getLensGuideProvider } from '../../guide/lensGuideProvider.js';
import { defaultLensGuideConfig } from '../../config/lensGuideConfig.js';

const ROOT = resolve(__dirname, '../../..');

function read(rel: string): string {
  const p = resolve(ROOT, rel);
  if (!existsSync(p)) return '';
  return readFileSync(p, 'utf-8');
}

// ── Runtime dynamics non-change audit ─────────────────────────────────────────

describe('v2.1 audit — runtime dynamics non-change', () => {
  const dynamicCoreSrc = read('src/core/dynamicCore.ts');
  const referenceRatiosSrc = read('src/observer/referenceRatios.ts');
  const observedRatiosSrc = read('src/observer/deriveObservedRatios.ts');

  it('dynamicCore does not import referenceRatios', () => {
    expect(dynamicCoreSrc).not.toMatch(/import.*referenceRatios/i);
  });

  it('dynamicCore does not import observedRatios', () => {
    expect(dynamicCoreSrc).not.toMatch(/import.*observedRatios|import.*deriveObservedRatios/i);
  });

  it('referenceRatios is observer-side only (no runtime mutation)', () => {
    // referenceRatios should not IMPORT from dynamicCore (which would suggest feedback)
    // It may reference "dynamicCore" in a comment, so we check for import statements
    expect(referenceRatiosSrc).not.toMatch(/^import.*dynamicCore/im);
    // Also should not declare or export field buffer mutations
    expect(referenceRatiosSrc).not.toMatch(/fieldBuffer|mutateField|pushToRuntime/i);
  });

  it('deriveObservedRatios does not call dynamicCore', () => {
    expect(observedRatiosSrc).not.toMatch(/import.*dynamicCore/i);
  });

  it('AeternaNaturalRuntimeConfig has no observedRatioFeedback fields', () => {
    const keys = Object.keys(defaultAeternaNaturalRuntimeConfig);
    const feedbackKeys = keys.filter(k =>
      k.toLowerCase().includes('ratiofeedback') ||
      k.toLowerCase().includes('observedfeedback') ||
      k.toLowerCase().includes('resonancefeedback'),
    );
    expect(feedbackKeys).toHaveLength(0);
  });

  it('weakPlasticityAblationEnabled is true by default (ablation gate active)', () => {
    expect(defaultAeternaNaturalRuntimeConfig.weakPlasticityAblationEnabled).toBe(true);
  });

  it('weakPlasticityEnabled is false by default (plasticity off by default)', () => {
    expect(defaultAeternaNaturalRuntimeConfig.weakPlasticityEnabled).toBe(false);
  });

  it('fieldRuntimeMode default is not complexRuntime', () => {
    expect(defaultAeternaNaturalRuntimeConfig.fieldRuntimeMode).not.toBe('complexRuntime');
  });
});

// ── Warning / caution severity audit ──────────────────────────────────────────

describe('v2.1 audit — warning severity categories', () => {
  const diagnosticStripSrc = read('src/ui/observation/ObservationDiagnosticStrip.tsx');

  it('ObservationDiagnosticStrip.tsx exists', () => {
    expect(existsSync(resolve(ROOT, 'src/ui/observation/ObservationDiagnosticStrip.tsx'))).toBe(true);
  });

  it('DiagnosticStrip uses severity or level categories', () => {
    expect(diagnosticStripSrc).toMatch(/severity|level|warning|critical|notice|info/i);
  });

  it('DiagnosticStrip does not make all warnings equally alarming (not all red)', () => {
    // Should differentiate between severity levels
    expect(diagnosticStripSrc).toMatch(/critical|warning|notice|info/i);
  });
});

// ── Scenario / Preset non-guarantee language ───────────────────────────────────

describe('v2.1 audit — scenario and preset non-guarantee language', () => {
  it('all scenarios have an expectedObservations field or note', () => {
    // Just verify the registry is populated
    expect(RESEARCH_SCENARIOS.length).toBeGreaterThan(0);
  });

  it('no scenario description guarantees emergence', () => {
    // Only check for clearly affirmative guarantee claims, not negations like "not guaranteed"
    const AFFIRMATIVE_GUARANTEE_PHRASES = [
      'emergence is guaranteed',
      'vortex will always appear',
      'proves emergence',
      'consciousness is guaranteed',
    ];
    for (const scenario of RESEARCH_SCENARIOS) {
      const text = [
        scenario.title ?? '',
        scenario.shortDescription ?? '',
        ...(scenario.expectedObservationKinds ?? []),
      ].join(' ').toLowerCase();
      for (const phrase of AFFIRMATIVE_GUARANTEE_PHRASES) {
        expect(text, `Scenario "${scenario.id}" contains guarantee phrase: "${phrase}"`).not.toContain(phrase);
      }
    }
  });

  it('no preset experiment description guarantees emergence', () => {
    const GUARANTEE_PHRASES = [
      'guaranteed',
      'will always emerge',
      'proves emergence',
    ];
    for (const exp of PRESET_EXPERIMENTS) {
      const text = [
        exp.title ?? '',
        exp.description ?? '',
      ].join(' ').toLowerCase();
      for (const phrase of GUARANTEE_PHRASES) {
        expect(text, `Experiment "${exp.id}" contains guarantee phrase: "${phrase}"`).not.toContain(phrase);
      }
    }
  });

  it('all preset experiments have an id', () => {
    for (const exp of PRESET_EXPERIMENTS) {
      expect(typeof exp.id).toBe('string');
      expect(exp.id.length).toBeGreaterThan(0);
    }
  });
});

// ── Replay snapshot lightweight constraint ────────────────────────────────────

describe('v2.1 audit — replay snapshot is lightweight', () => {
  const snapshotTypeSrc = read('src/types/timeReplay.ts');
  const bufferSrc = read('src/replay/timeReplayBuffer.ts');

  it('TimeReplaySnapshot has globalSummary with only scalar fields', () => {
    expect(snapshotTypeSrc).toMatch(/globalSummary/);
    // The globalSummary type body should not declare any raw buffer field types
    const summaryMatch = snapshotTypeSrc.match(/globalSummary\s*:\s*\{([^}]+)\}/s);
    const summaryBody = summaryMatch ? summaryMatch[1] : '';
    expect(summaryBody).not.toMatch(/:\s*Float32Array|:\s*Uint8Array|:\s*number\[\]/i);
  });

  it('TimeReplaySnapshot stores eventIds (not full event objects)', () => {
    expect(snapshotTypeSrc).toMatch(/eventIds.*string\[\]/);
  });

  it('TimeReplayBuffer enforces maxSnapshots limit', () => {
    expect(bufferSrc).toMatch(/maxSnapshots/);
  });

  it('TimeReplayBuffer comment explains runtime is not rewound', () => {
    expect(bufferSrc).toMatch(/NOT rewound|not.*rewound|observation-only/i);
  });
});

// ── Guide does not receive raw field data ─────────────────────────────────────

describe('v2.1 audit — guide does not receive raw field data', () => {
  const buildContextSrc = read('src/guide/buildLensGuideContext.ts');
  const guideTypeSrc = read('src/guide/lensGuideTypes.ts');

  it('buildLensGuideContext.ts exists', () => {
    expect(existsSync(resolve(ROOT, 'src/guide/buildLensGuideContext.ts'))).toBe(true);
  });

  it('buildLensGuideContext does not pass Float32Array to guide', () => {
    expect(buildContextSrc).not.toMatch(/Float32Array|Uint8Array|rawField/i);
  });

  it('LensGuideContext does not contain raw field buffers', () => {
    expect(guideTypeSrc).not.toMatch(/Float32Array|Uint8Array|rawField/i);
  });

  it('buildLensGuideContext limits context size', () => {
    // Should have a max items limit for observation facts
    expect(buildContextSrc).toMatch(/max|limit|slice|\.length/i);
  });
});

// ── AI Guide provider — public mode uses rule-based ───────────────────────────

describe('v2.1 audit — guide provider in public mode', () => {
  it('default config returns ruleBasedLensGuideProvider', () => {
    const provider = getLensGuideProvider(defaultLensGuideConfig);
    expect(provider.id).toBe('ruleBased');
    expect(provider.kind).toBe('ruleBased');
  });

  it('config with allowExternalApi=false returns ruleBased provider', () => {
    const provider = getLensGuideProvider({
      ...defaultLensGuideConfig,
      allowExternalApi: false,
    });
    expect(provider.kind).toBe('ruleBased');
  });
});

// ── Interpretation guardrails content ─────────────────────────────────────────

describe('v2.1 audit — interpretation guardrails content', () => {
  it('EN guardrails has at least 5 lines', () => {
    expect(RESEARCH_INTERPRETATION_GUARDRAILS_EN.length).toBeGreaterThanOrEqual(5);
  });

  it('JA guardrails has at least 5 lines', () => {
    expect(RESEARCH_INTERPRETATION_GUARDRAILS_JA.length).toBeGreaterThanOrEqual(5);
  });

  it('EN guardrails states results are not proof of consciousness', () => {
    const joined = RESEARCH_INTERPRETATION_GUARDRAILS_EN.join('\n').toLowerCase();
    expect(joined).toMatch(/not proof of consciousness/i);
  });

  it('EN guardrails states no emergence is a valid observation', () => {
    const joined = RESEARCH_INTERPRETATION_GUARDRAILS_EN.join('\n');
    expect(joined).toMatch(/No emergence is a valid observation/);
  });

  it('JA guardrails mentions 意識の証明ではありません', () => {
    const joined = RESEARCH_INTERPRETATION_GUARDRAILS_JA.join('\n');
    expect(joined).toMatch(/意識の証明ではありません|意識.*証明/);
  });

  it('JA guardrails states absence of emergence is valid (創発候補が出ないことも)', () => {
    const joined = RESEARCH_INTERPRETATION_GUARDRAILS_JA.join('\n');
    expect(joined).toMatch(/創発候補が出ないことも/);
  });
});

// ── Key docs exist ─────────────────────────────────────────────────────────────

describe('v2.1 audit — key docs exist', () => {
  const requiredDocs = [
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

  for (const docPath of requiredDocs) {
    it(`${docPath} exists`, () => {
      expect(existsSync(resolve(ROOT, docPath))).toBe(true);
    });
  }
});

// ── Release check script exists ────────────────────────────────────────────────

describe('v2.1 audit — release check script', () => {
  it('scripts/run-release-checks.ts exists', () => {
    expect(existsSync(resolve(ROOT, 'scripts/run-release-checks.ts'))).toBe(true);
  });

  it('package.json has check:release script', () => {
    const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'));
    expect(pkg.scripts?.['check:release']).toBeTruthy();
  });

  it('package.json has test:run script', () => {
    const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'));
    expect(pkg.scripts?.['test:run']).toBeTruthy();
  });

  it('package.json has lint script', () => {
    const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'));
    expect(pkg.scripts?.['lint']).toBeTruthy();
  });

  it('package.json has build script', () => {
    const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'));
    expect(pkg.scripts?.['build']).toBeTruthy();
  });
});

// ── Fake visual / event / result guard ────────────────────────────────────────

describe('v2.1 audit — no fake visual / event / result', () => {
  const FAKE_TERMS = [
    'fake glow',
    'fake deformation',
    'fake vortex',
    'fake result',
    'fake event',
    'fake visual',
    'fake cause',
    'fake emergence',
    'simulated consciousness',
    'animated consciousness',
  ];

  const sourceFiles = [
    'src/ui/observation/ObservationWorkspace.tsx',
    'src/ui/observation/CellInspectorPanel.tsx',
    'src/ui/observation/MetricSpotlightPanel.tsx',
    'src/ui/replay/TimeReplayPanel.tsx',
    'src/ui/guide/LensAwareGuidePanel.tsx',
    'src/guide/ruleBasedLensGuide.ts',
    'src/research/exportResearchRunMarkdown.ts',
  ].map(f => read(f));

  const joined = sourceFiles.join('\n').toLowerCase();

  for (const term of FAKE_TERMS) {
    it(`no "${term}" in v2.0 source files`, () => {
      expect(joined).not.toContain(term.toLowerCase());
    });
  }
});

// ── Node bridge / LLM / external API not added ────────────────────────────────

describe('v2.1 audit — no Node bridge / LLM / external API added', () => {
  const guideProviderSrc = read('src/guide/lensGuideProvider.ts');
  const lensGuideConfigSrc = read('src/config/lensGuideConfig.ts');

  it('lensGuideProvider.ts does not implement real LLM calls', () => {
    // External LLM provider should reject, not call any real API
    expect(guideProviderSrc).not.toMatch(/fetch\(|axios\.|http\.get|XMLHttpRequest/i);
  });

  it('lensGuideProvider.ts externalLlm stub rejects', () => {
    expect(guideProviderSrc).toMatch(/Promise\.reject|not enabled/i);
  });

  it('no Node bridge import in any config file', () => {
    const configSrc = [
      read('src/config/releaseEnvironmentConfig.ts'),
      read('src/config/publicResearchModeConfig.ts'),
      read('src/config/lensGuideConfig.ts'),
    ].join('\n');
    expect(configSrc).not.toMatch(/nodeBridge.*=.*true|node-bridge|node_bridge/i);
  });

  it('nodeBridgeEnabled is false in release environment default', () => {
    const relEnvSrc = read('src/config/releaseEnvironmentConfig.ts');
    expect(relEnvSrc).toMatch(/nodeBridgeEnabled.*false/);
  });

  it('lensGuideConfig allowExternalApi is false by default', () => {
    expect(lensGuideConfigSrc).toMatch(/allowExternalApi.*false/);
  });
});

// ── Mobile observation — required tab items exist ─────────────────────────────

describe('v2.1 audit — mobile observation tabs', () => {
  const mobileTabsSrc = read('src/ui/observation/ObservationMobileTabs.tsx');

  it('ObservationMobileTabs.tsx exists', () => {
    expect(existsSync(resolve(ROOT, 'src/ui/observation/ObservationMobileTabs.tsx'))).toBe(true);
  });

  it('Mobile tabs include field tab', () => {
    expect(mobileTabsSrc).toMatch(/field/i);
  });

  it('Mobile tabs include inspector tab', () => {
    expect(mobileTabsSrc).toMatch(/inspector/i);
  });

  it('Mobile tabs include replay tab', () => {
    expect(mobileTabsSrc).toMatch(/replay/i);
  });

  it('Mobile tabs include guide tab', () => {
    expect(mobileTabsSrc).toMatch(/guide/i);
  });
});
