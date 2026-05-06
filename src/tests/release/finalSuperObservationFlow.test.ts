/**
 * finalSuperObservationFlow.test.ts
 * AETERNA-NATURAL v2.1 — Final QA / Release Audit — Super Observation Flow
 *
 * Verifies that the full Super Observation flow is present and coherent:
 *
 *   1.  Torus visible (field renderer)
 *   2.  Cell tappable (CellInspectorPanel / useCellPicking)
 *   3.  Selected cell marker exists (SelectedCellMarker)
 *   4.  Cell Inspector shows real data (no fake 0)
 *   5.  Metric row → active lens switch (CellMetricRow / findLensForMetric)
 *   6.  Metric Spotlight updates with active lens (MetricSpotlightPanel)
 *   7.  Recommended layer visible in MetricSpotlightPanel
 *   8.  Time Replay panel (Live / Replay distinction)
 *   9.  Causal Trace / Difference / Correlation panels
 *   10. AI Guide panel (observation-auxiliary, not AETERNA itself)
 *   11. Export with guardrails
 *
 * Checks are structural (import / type / export checks), not runtime simulation.
 *
 * Reference: docs/final-release-audit.md §4
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '../../..');

function read(rel: string): string {
  const p = resolve(ROOT, rel);
  if (!existsSync(p)) return '';
  return readFileSync(p, 'utf-8');
}

// ── Step 1: Field view container ───────────────────────────────────────────────

describe('super observation flow — step 1: torus field view', () => {
  const workspaceSrc = read('src/ui/observation/ObservationWorkspace.tsx');

  it('ObservationWorkspace renders a field-view container', () => {
    expect(workspaceSrc).toContain('observation-content__field-view');
  });

  it('Field view is labelled for accessibility', () => {
    expect(workspaceSrc).toContain('aria-label="Field View"');
  });
});

// ── Step 2: Cell picking ───────────────────────────────────────────────────────

describe('super observation flow — step 2: cell picking', () => {
  const pickingSrc = read('src/ui/render/cellPicking.ts');
  const usePicking = read('src/ui/observation/useCellPicking.ts');

  it('cellPicking.ts exists', () => {
    expect(existsSync(resolve(ROOT, 'src/ui/render/cellPicking.ts'))).toBe(true);
  });

  it('cellPicking exports a pick function', () => {
    expect(pickingSrc).toMatch(/export.*function|export.*=>/);
  });

  it('useCellPicking.ts exists', () => {
    expect(existsSync(resolve(ROOT, 'src/ui/observation/useCellPicking.ts'))).toBe(true);
  });

  it('useCellPicking exports a hook or function', () => {
    expect(usePicking).toMatch(/export/);
  });
});

// ── Step 3: Selected cell marker ──────────────────────────────────────────────

describe('super observation flow — step 3: selected cell marker', () => {
  const markerSrc = read('src/ui/render/SelectedCellMarker.tsx');

  it('SelectedCellMarker.tsx exists', () => {
    expect(existsSync(resolve(ROOT, 'src/ui/render/SelectedCellMarker.tsx'))).toBe(true);
  });

  it('SelectedCellMarker exports a render function', () => {
    expect(markerSrc).toMatch(/export/);
  });

  it('SelectedCellMarker references selectedCellIndex or similar', () => {
    expect(markerSrc).toMatch(/selected|cellIndex|cell.*index/i);
  });
});

// ── Step 4: Cell Inspector — real data, no fake zeros ─────────────────────────

describe('super observation flow — step 4: cell inspector', () => {
  const inspectorSrc = read('src/ui/observation/CellInspectorPanel.tsx');

  it('CellInspectorPanel.tsx exists', () => {
    expect(existsSync(resolve(ROOT, 'src/ui/observation/CellInspectorPanel.tsx'))).toBe(true);
  });

  it('CellInspectorPanel shows "(not observed)" for undefined values', () => {
    expect(inspectorSrc).toMatch(/not observed|未観測/i);
  });

  it('CellInspectorPanel shows geometry fields', () => {
    expect(inspectorSrc).toMatch(/gaussianCurvature|curvature/i);
  });

  it('CellInspectorPanel shows field amplitude and phase', () => {
    expect(inspectorSrc).toMatch(/amplitude|phase/i);
  });

  it('CellInspectorPanel shows vortex candidate info', () => {
    expect(inspectorSrc).toMatch(/vortex/i);
  });

  it('CellInspectorPanel shows membrane info', () => {
    expect(inspectorSrc).toMatch(/membrane/i);
  });

  it('CellInspectorPanel shows plasticity trace', () => {
    expect(inspectorSrc).toMatch(/plasticity/i);
  });

  it('CellInspectorPanel shows recent events', () => {
    expect(inspectorSrc).toMatch(/recentEvents|recent.*event/i);
  });

  it('CellInspectorPanel does not show fake zeros for missing data', () => {
    // Must not assign 0 as default for unobserved — should use undefined / null / "(not observed)"
    expect(inspectorSrc).not.toMatch(/value\s*=\s*0\s*(\/\/.*not observed|\/\/.*missing)/i);
  });
});

// ── Step 5: Metric row → lens switch ──────────────────────────────────────────

describe('super observation flow — step 5: metric row to lens', () => {
  const metricRowSrc = read('src/ui/observation/CellMetricRow.tsx');
  const registrySrc = read('src/ui/lens/metricLensRegistry.ts');

  it('CellMetricRow.tsx exists', () => {
    expect(existsSync(resolve(ROOT, 'src/ui/observation/CellMetricRow.tsx'))).toBe(true);
  });

  it('CellMetricRow exports render function', () => {
    expect(metricRowSrc).toMatch(/export.*function.*render|export.*CellMetricRow/i);
  });

  it('CellMetricRow has a lens-link mechanism', () => {
    expect(metricRowSrc).toMatch(/lensId|activateLens|findLens|lens/i);
  });

  it('metricLensRegistry exports findLensForMetric', () => {
    expect(registrySrc).toMatch(/export.*findLensForMetric/);
  });

  it('metricLensRegistry has valueKind field', () => {
    expect(registrySrc).toMatch(/valueKind/);
  });
});

// ── Step 6 + 7: Metric Spotlight ──────────────────────────────────────────────

describe('super observation flow — steps 6+7: metric spotlight', () => {
  const spotlightSrc = read('src/ui/observation/MetricSpotlightPanel.tsx');

  it('MetricSpotlightPanel.tsx exists', () => {
    expect(existsSync(resolve(ROOT, 'src/ui/observation/MetricSpotlightPanel.tsx'))).toBe(true);
  });

  it('MetricSpotlightPanel takes activeLensId', () => {
    expect(spotlightSrc).toMatch(/activeLensId/);
  });

  it('MetricSpotlightPanel shows recommended layer info', () => {
    expect(spotlightSrc).toMatch(/preferredFieldLayer|layer|recommended/i);
  });

  it('MetricSpotlightPanel shows caution/disclaimer', () => {
    expect(spotlightSrc).toMatch(/caution|disclaimer|not proof|not a proof/i);
  });
});

// ── Step 8: Time Replay ────────────────────────────────────────────────────────

describe('super observation flow — step 8: time replay', () => {
  const replayPanelSrc = read('src/ui/replay/TimeReplayPanel.tsx');
  const replayTypeSrc = read('src/types/timeReplay.ts');
  const replayBufSrc = read('src/replay/timeReplayBuffer.ts');

  it('TimeReplayPanel.tsx exists', () => {
    expect(existsSync(resolve(ROOT, 'src/ui/replay/TimeReplayPanel.tsx'))).toBe(true);
  });

  it('TimeReplayPanel clearly distinguishes Live and Replay Mode', () => {
    expect(replayPanelSrc).toMatch(/live.*mode|replay.*mode|Live Mode|Replay Mode/i);
  });

  it('TimeReplayPanel shows a "Return to Live" mechanism', () => {
    expect(replayPanelSrc).toMatch(/return.*live|returnToLive|Live に戻る/i);
  });

  it('TimeReplayPanel includes the mandatory disclaimer about runtime not rewinding', () => {
    expect(replayPanelSrc).toMatch(
      /does not imply the runtime|runtime.*not.*moved|not.*rewind|Replay Mode.*recorded/i,
    );
  });

  it('TimeReplaySnapshot does not store raw field buffers', () => {
    // Extract the TimeReplaySnapshot interface body (not comments) and check for raw buffer types
    const interfaceMatch = replayTypeSrc.match(/export interface TimeReplaySnapshot\s*\{([^}]+)\}/s);
    const interfaceBody = interfaceMatch ? interfaceMatch[1] : replayTypeSrc;
    // The interface body should not declare Float32Array or Uint8Array as field types
    expect(interfaceBody).not.toMatch(/:\s*Float32Array|:\s*Uint8Array/i);
  });

  it('TimeReplayBuffer enforces maxSnapshots', () => {
    expect(replayBufSrc).toMatch(/maxSnapshots/);
  });

  it('Replay mode state has live and replay variants', () => {
    expect(replayTypeSrc).toMatch(/'live'.*'replay'|'replay'.*'live'/i);
  });
});

// ── Step 9: Causal Trace / Correlation / Difference ───────────────────────────

describe('super observation flow — step 9: causal trace, correlation, difference', () => {
  const causalSrc = read('src/ui/observation/CausalTracePanel.tsx');
  const correlSrc = read('src/ui/observation/LayerCorrelationPanel.tsx');
  const diffSrc = read('src/ui/observation/DifferenceViewPanel.tsx');
  const ratioSrc = read('src/ui/observation/ObservedRatioInvolvementPanel.tsx');
  const causalTypeSrc = read('src/types/causalTrace.ts');

  it('CausalTracePanel.tsx exists', () => {
    expect(existsSync(resolve(ROOT, 'src/ui/observation/CausalTracePanel.tsx'))).toBe(true);
  });

  it('CausalTracePanel shows possibleContributingSignals', () => {
    expect(causalSrc).toMatch(/possibleContributing|possible.*contributing|contributing.*signal/i);
  });

  it('CausalTracePanel shows "not proof" caution', () => {
    expect(causalSrc).toMatch(/not.*proof|causal.*proof.*not|not.*causal.*proof|caution/i);
  });

  it('LayerCorrelationPanel.tsx exists', () => {
    expect(existsSync(resolve(ROOT, 'src/ui/observation/LayerCorrelationPanel.tsx'))).toBe(true);
  });

  it('LayerCorrelationPanel shows insufficient notice when sampleCount low', () => {
    expect(correlSrc).toMatch(/insufficient|sample.*count|not.*enough/i);
  });

  it('DifferenceViewPanel.tsx exists', () => {
    expect(existsSync(resolve(ROOT, 'src/ui/observation/DifferenceViewPanel.tsx'))).toBe(true);
  });

  it('DifferenceViewPanel shows before/after/delta', () => {
    expect(diffSrc).toMatch(/before|after|delta/i);
  });

  it('ObservedRatioInvolvementPanel shows components', () => {
    expect(ratioSrc).toMatch(/component|involvement|ratio/i);
  });

  it('CausalTraceResult.cautions field exists', () => {
    expect(causalTypeSrc).toMatch(/cautions/);
  });

  it('CausalTrace is not described as causal proof in types', () => {
    // Should contain "not causal proof" or similar disclaimer — affirming it's NOT proof
    expect(causalTypeSrc).toMatch(/NOT causal proof|not.*causal.*proof|causal.*proof.*NOT/i);
    // Should NOT contain affirmative "is causal proof" or "proves cause"
    expect(causalTypeSrc).not.toMatch(/\bis causal proof\b|\bproves the cause\b/i);
  });
});

// ── Step 10: AI Guide ─────────────────────────────────────────────────────────

describe('super observation flow — step 10: AI guide', () => {
  const guidePanelSrc = read('src/ui/guide/LensAwareGuidePanel.tsx');
  const guideProviderSrc = read('src/guide/lensGuideProvider.ts');
  const guideTypeSrc = read('src/guide/lensGuideTypes.ts');
  const guardSrc = read('src/guide/guardLensGuideResponse.ts');

  it('LensAwareGuidePanel.tsx exists', () => {
    expect(existsSync(resolve(ROOT, 'src/ui/guide/LensAwareGuidePanel.tsx'))).toBe(true);
  });

  it('Guide panel shows "not AETERNA itself" disclaimer', () => {
    expect(guidePanelSrc).toMatch(
      /AI Guide.*not.*AETERNA|観測.*補助.*AETERNA.*ではない|AETERNA 本体.*ではありません|auxiliary/i,
    );
  });

  it('Guide provider default is ruleBased', () => {
    expect(guideProviderSrc).toMatch(/ruleBasedLensGuideProvider/);
    expect(guideProviderSrc).not.toMatch(/externalLlm.*return.*provider(?!.*reject)/i);
  });

  it('External LLM provider rejects all calls (stub)', () => {
    expect(guideProviderSrc).toMatch(/Promise\.reject|not enabled/i);
  });

  it('LensGuideResponse has observationFacts field', () => {
    expect(guideTypeSrc).toMatch(/observationFacts/);
  });

  it('LensGuideResponse has hypothesisCandidates field', () => {
    expect(guideTypeSrc).toMatch(/hypothesisCandidates/);
  });

  it('LensGuideResponse has cautionNotes field', () => {
    expect(guideTypeSrc).toMatch(/cautionNotes/);
  });

  it('LensGuideResponse has suggestedNextLenses field', () => {
    expect(guideTypeSrc).toMatch(/suggestedNextLens/i);
  });

  it('guardLensGuideResponse guards all response fields', () => {
    expect(guardSrc).toMatch(/observationFacts/);
    expect(guardSrc).toMatch(/hypothesisCandidates/);
    expect(guardSrc).toMatch(/cautionNotes/);
    expect(guardSrc).toMatch(/claimGuardPassed/);
  });
});

// ── Step 11: Export with guardrails ───────────────────────────────────────────

describe('super observation flow — step 11: export with guardrails', () => {
  const guardrailsSrc = read('src/research/researchGuardrails.ts');
  const markdownExportSrc = read('src/research/exportResearchRunMarkdown.ts');

  it('researchGuardrails.ts exists', () => {
    expect(existsSync(resolve(ROOT, 'src/research/researchGuardrails.ts'))).toBe(true);
  });

  it('RESEARCH_INTERPRETATION_GUARDRAILS_EN contains "not proof of consciousness"', () => {
    expect(guardrailsSrc).toMatch(/not proof of consciousness/i);
  });

  it('RESEARCH_INTERPRETATION_GUARDRAILS_EN contains vortex candidate disclaimer', () => {
    expect(guardrailsSrc).toMatch(/vortex.*candidate.*not.*mind|phase-defect.*candidate/i);
  });

  it('RESEARCH_INTERPRETATION_GUARDRAILS_EN contains plasticity trace disclaimer', () => {
    expect(guardrailsSrc).toMatch(/plasticity.*trace.*not.*semantic.*memory|medium-history.*proxy/i);
  });

  it('RESEARCH_INTERPRETATION_GUARDRAILS_EN contains observed ratio disclaimer', () => {
    expect(guardrailsSrc).toMatch(/observed.*ratio.*not.*causal.*proof|ratio.*not.*mystical/i);
  });

  it('RESEARCH_INTERPRETATION_GUARDRAILS_EN states no-emergence is valid', () => {
    expect(guardrailsSrc).toMatch(/No emergence is a valid observation/i);
  });

  it('RESEARCH_INTERPRETATION_GUARDRAILS_JA has Japanese equivalents', () => {
    expect(guardrailsSrc).toMatch(/RESEARCH_INTERPRETATION_GUARDRAILS_JA/);
    expect(guardrailsSrc).toMatch(/意識の証明ではありません|意識.*証明/);
  });

  it('exportResearchRunMarkdown includes interpretation guardrails', () => {
    expect(markdownExportSrc).toMatch(/RESEARCH_INTERPRETATION_GUARDRAILS_EN/);
    expect(markdownExportSrc).toMatch(/RESEARCH_INTERPRETATION_GUARDRAILS_JA/);
  });

  it('exportResearchRunMarkdown exports seed', () => {
    expect(markdownExportSrc).toMatch(/seed/i);
  });

  it('exportResearchRunMarkdown exports scenarioId', () => {
    expect(markdownExportSrc).toMatch(/scenarioId|Scenario/i);
  });

  it('exportResearchRunMarkdown exports safetyMode', () => {
    expect(markdownExportSrc).toMatch(/safetyMode|Safety mode/i);
  });

  it('exportResearchRunMarkdown does not export raw field buffers', () => {
    expect(markdownExportSrc).not.toMatch(/Float32Array|rawField|fieldBuffer/i);
  });
});

// ── ObservationWorkspace — full panel integration ─────────────────────────────

describe('super observation flow — ObservationWorkspace integration', () => {
  const workspaceSrc = read('src/ui/observation/ObservationWorkspace.tsx');

  it('ObservationWorkspace imports all required panels', () => {
    expect(workspaceSrc).toMatch(/ObservationHeader/);
    expect(workspaceSrc).toMatch(/InspectorDrawer/);
    expect(workspaceSrc).toMatch(/MetricSpotlightPanel/);
    expect(workspaceSrc).toMatch(/TimeReplayPanel/);
    expect(workspaceSrc).toMatch(/CausalTracePanel/);
    expect(workspaceSrc).toMatch(/LayerCorrelationPanel/);
    expect(workspaceSrc).toMatch(/DifferenceViewPanel/);
    expect(workspaceSrc).toMatch(/ObservedRatioInvolvementPanel/);
    expect(workspaceSrc).toMatch(/LensAwareGuidePanel/);
    expect(workspaceSrc).toMatch(/ObservationMobileTabs/);
  });

  it('ObservationWorkspace renders mobile tabs', () => {
    expect(workspaceSrc).toMatch(/ObservationMobileTabs|mobile.*tab/i);
  });

  it('ObservationWorkspace renders navigation hint', () => {
    expect(workspaceSrc).toMatch(/observation-nav-hint|Tap a cell/i);
  });

  it('ObservationWorkspace shows "not AETERNA" guide note', () => {
    expect(workspaceSrc).toMatch(/AETERNA 本体.*ではありません|guide.*observation.*auxiliary/i);
  });

  it('ObservationWorkspace exposes isPublicMode prop', () => {
    expect(workspaceSrc).toMatch(/isPublicMode/);
  });
});
