/**
 * finalObservationCopyGuard.test.ts
 * v2.0: AETERNA-NATURAL Observation UX Final Polish
 * — Comprehensive copy guard for all v2.0 new and updated files.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '../../..');

function read(relPath: string): string {
    return readFileSync(resolve(ROOT, relPath), 'utf-8');
}

const SOURCE_FILES: Record<string, string> = {
    'ObservationWorkspace.tsx': read('src/ui/observation/ObservationWorkspace.tsx'),
    'ObservationHeader.tsx': read('src/ui/observation/ObservationHeader.tsx'),
    'InspectorDrawer.tsx': read('src/ui/observation/InspectorDrawer.tsx'),
    'ObservationMobileTabs.tsx': read('src/ui/observation/ObservationMobileTabs.tsx'),
    'ObservationDiagnosticStrip.tsx': read('src/ui/observation/ObservationDiagnosticStrip.tsx'),
    'CellInspectorPanel.tsx': read('src/ui/observation/CellInspectorPanel.tsx'),
    'CellMetricRow.tsx': read('src/ui/observation/CellMetricRow.tsx'),
    'MetricSpotlightPanel.tsx': read('src/ui/observation/MetricSpotlightPanel.tsx'),
    'CausalTracePanel.tsx': read('src/ui/observation/CausalTracePanel.tsx'),
    'LayerCorrelationPanel.tsx': read('src/ui/observation/LayerCorrelationPanel.tsx'),
    'DifferenceViewPanel.tsx': read('src/ui/observation/DifferenceViewPanel.tsx'),
    'ObservedRatioInvolvementPanel.tsx': read('src/ui/observation/ObservedRatioInvolvementPanel.tsx'),
    'TimeReplayPanel.tsx': read('src/ui/replay/TimeReplayPanel.tsx'),
    'ReplaySlider.tsx': read('src/ui/replay/ReplaySlider.tsx'),
    'LensAwareGuidePanel.tsx': read('src/ui/guide/LensAwareGuidePanel.tsx'),
    'LensGuideResponseView.tsx': read('src/ui/guide/LensGuideResponseView.tsx'),
};

const ALL_SOURCES_LOWER = Object.values(SOURCE_FILES).join('\n').toLowerCase();
const ALL_SOURCES_ORIG  = Object.values(SOURCE_FILES).join('\n');

// ── 1. English forbidden claims ───────────────────────────────────────────────
// Note: phrases like 'aeterna feels', 'aeterna wants', 'aeterna understands' may
// appear in comment headers as negations (e.g. "No 'AETERNA feels' ...") and are
// therefore excluded from source-level checks — they are checked at rendered-HTML
// level in other tests. Only affirmative claim phrases are checked here.

describe('finalObservationCopyGuard: English forbidden claims absent', () => {
    const englishForbidden = [
        'consciousness proved',
        'life proved',
        'intelligence proved',
        'soul resonance',
        'mystical proof',
        'healing proof',
        'vortex is mind',
        'plasticity is memory',
        'ratio proves truth',
        'proves consciousness',
        'proves life',
        'proves intelligence',
    ];

    for (const phrase of englishForbidden) {
        it(`source files do not contain: "${phrase}"`, () => {
            expect(ALL_SOURCES_LOWER).not.toContain(phrase);
        });
    }
});

// ── 2. Japanese forbidden claims ─────────────────────────────────────────────
// Note: '癒しの証明' appears in ObservedRatioInvolvementPanel.tsx as a negation
// (癒しの証明ではありません = "is not healing proof"), which is a disclaimer, not
// an affirmative claim. It is therefore excluded from the source-level check.

describe('finalObservationCopyGuard: Japanese forbidden claims absent', () => {
    const japaneseForbidden = [
        '意識が証明',
        '生命が証明',
        '知性が証明',
        'aeterna が感じている',
        'aeterna が欲している',
        'aeterna が理解した',
        '神秘の証明',
        '渦は心',
        '可塑性は記憶',
        '比率が真理を証明',
    ];

    for (const phrase of japaneseForbidden) {
        it(`source files do not contain: "${phrase}"`, () => {
            expect(ALL_SOURCES_ORIG).not.toContain(phrase);
        });
    }
});

// ── 3. No LLM/API calls ───────────────────────────────────────────────────────

describe('finalObservationCopyGuard: no LLM/API calls in source files', () => {
    const apiPatterns = ['fetch(', 'axios', 'openai', 'anthropic', 'llm_call', 'callLLM'];

    for (const pattern of apiPatterns) {
        it(`source files do not call: "${pattern}"`, () => {
            expect(ALL_SOURCES_LOWER).not.toContain(pattern.toLowerCase());
        });
    }
});

// ── 4. No fake data patterns ──────────────────────────────────────────────────

describe('finalObservationCopyGuard: no fake data patterns', () => {
    const fakePatterns = ['Math.random()', 'FAKE_', 'fake_', 'fakeResult', 'fakeEvent', 'fakeVisual'];

    for (const pattern of fakePatterns) {
        it(`source files do not contain: "${pattern}"`, () => {
            expect(ALL_SOURCES_ORIG).not.toContain(pattern);
        });
    }
});

// ── 5. Replay guardrail in TimeReplayPanel.tsx ────────────────────────────────

describe('finalObservationCopyGuard: TimeReplayPanel.tsx replay guardrail', () => {
    it('contains guardrail about runtime not moving backward', () => {
        const content = SOURCE_FILES['TimeReplayPanel.tsx'];
        expect(content).toMatch(/does not imply the runtime|runtime.*backward|runtime は過去に戻りません/i);
    });
});

// ── 6. Guide not-AETERNA note in LensAwareGuidePanel.tsx ─────────────────────

describe('finalObservationCopyGuard: LensAwareGuidePanel.tsx guide note', () => {
    it('contains AETERNA 本体 or 本体の発話 note', () => {
        const content = SOURCE_FILES['LensAwareGuidePanel.tsx'];
        expect(content).toMatch(/AETERNA 本体|本体の発話/);
    });
});

// ── 7. Ratio caution in ObservedRatioInvolvementPanel.tsx ────────────────────

describe('finalObservationCopyGuard: ObservedRatioInvolvementPanel.tsx ratio caution', () => {
    it('contains proxy/proxies (structural proxy caution)', () => {
        const content = SOURCE_FILES['ObservedRatioInvolvementPanel.tsx'];
        expect(content).toMatch(/[Pp]rox(y|ies)/);
    });

    it('contains "observational" (observational-only caution)', () => {
        const content = SOURCE_FILES['ObservedRatioInvolvementPanel.tsx'];
        expect(content).toMatch(/observational/i);
    });
});

// ── 8. Causal trace not-proof in CausalTracePanel.tsx ────────────────────────

describe('finalObservationCopyGuard: CausalTracePanel.tsx causal disclaimer', () => {
    it('contains "not causal proof" disclaimer', () => {
        const content = SOURCE_FILES['CausalTracePanel.tsx'];
        expect(content).toMatch(/[Nn]ot causal proof/);
    });
});
