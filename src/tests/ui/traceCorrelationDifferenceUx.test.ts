/**
 * traceCorrelationDifferenceUx.test.ts
 * v2.0: AETERNA-NATURAL Observation UX Final Polish
 * — CausalTracePanel, LayerCorrelationPanel, DifferenceViewPanel tests
 */

import { describe, it, expect } from 'vitest';
import { renderCausalTracePanelHTML } from '../../ui/observation/CausalTracePanel.js';
import { renderLayerCorrelationPanelHTML } from '../../ui/observation/LayerCorrelationPanel.js';
import { renderDifferenceViewPanelHTML } from '../../ui/observation/DifferenceViewPanel.js';
import type { CausalTraceResult } from '../../types/causalTrace.js';
import type { LayerCorrelationState } from '../../types/layerCorrelation.js';
import type { ObservationDifferenceState } from '../../types/observationDifference.js';

// ── Stubs ─────────────────────────────────────────────────────────────────────

const mockResult: CausalTraceResult = {
    id: 'test-trace-1',
    targetCellIndex: 5,
    targetMetricId: null,
    activeLensId: null,
    currentTick: 100,
    comparedTick: null,
    possibleContributingSignals: [],
    relatedObservations: [],
    strongestSignals: [],
    summary: ['Phase changed near tick 95'],
    cautions: ['Correlation only, not causation'],
    confidence: 'low',
    generatedAt: Date.now(),
};

const mockState: LayerCorrelationState = {
    pairs: [{
        id: 'phase-amplitude',
        labelA: 'Phase',
        labelB: 'Amplitude',
        metricKeyA: 'phaseCoherence',
        metricKeyB: 'amplitudeCoherence',
        correlation: 0.4,
        confidence: 'low',
        sampleCount: 2,
        caution: 'low sample count',
    }],
    timeWindowTicks: 50,
    snapshotCount: 2,
    earliestTick: 50,
    latestTick: 100,
    sufficientData: false,
    caution: 'Insufficient data',
    generatedAt: Date.now(),
};

const mockDiff: ObservationDifferenceState = {
    beforeTick: 90,
    afterTick: 100,
    activeLensId: null,
    items: [{
        metricId: 'field.amplitude',
        label: 'Field Amplitude',
        valueKind: 'Derived',
        valueBefore: 0.4,
        valueAfter: 0.5,
        delta: 0.1,
        relativeDelta: 0.25,
        sourceLayer: 'field',
    }],
    largestChanges: [{
        metricId: 'field.amplitude',
        label: 'Field Amplitude',
        valueKind: 'Derived',
        valueBefore: 0.4,
        valueAfter: 0.5,
        delta: 0.1,
        relativeDelta: 0.25,
        sourceLayer: 'field',
    }],
    cellObservationAvailable: true,
    globalSummaryAvailable: true,
    caution: 'delta only, not improvement',
    generatedAt: Date.now(),
};

// ── CausalTracePanel ──────────────────────────────────────────────────────────

describe('CausalTracePanel: null result', () => {
    it('shows Japanese disclaimer "因果証明ではありません" (v2.4)', () => {
        const html = renderCausalTracePanelHTML({ result: null });
        expect(html).toContain('因果証明ではありません');
    });

    it('shows Japanese empty message when no result', () => {
        const html = renderCausalTracePanelHTML({ result: null });
        expect(html).toContain('関連候補データがありません');
    });
});

describe('CausalTracePanel: with result', () => {
    it('shows "関連候補シグナル" heading (Japanese-first, v2.4)', () => {
        const html = renderCausalTracePanelHTML({ result: mockResult });
        expect(html).toContain('関連候補シグナル');
    });

    it('disclaimer "因果証明ではありません" is always present (v2.4)', () => {
        const html = renderCausalTracePanelHTML({ result: mockResult });
        expect(html).toContain('因果証明ではありません');
    });

    it('signals note shows "（関連・近接候補 — 因果証明ではありません）" (v2.4)', () => {
        const html = renderCausalTracePanelHTML({ result: mockResult });
        expect(html).toContain('関連・近接候補');
    });
});

describe('CausalTracePanel: no forbidden claims', () => {
    const forbiddenPhrases = ['proves consciousness', 'aeterna feels', 'aeterna wants'];

    it('does not contain forbidden phrases', () => {
        const html = renderCausalTracePanelHTML({ result: mockResult }).toLowerCase();
        for (const phrase of forbiddenPhrases) {
            expect(html, `should not contain: "${phrase}"`).not.toContain(phrase);
        }
    });
});

// ── LayerCorrelationPanel ─────────────────────────────────────────────────────

describe('LayerCorrelationPanel: null state', () => {
    it('shows Japanese "相関は因果ではありません" disclaimer (v2.4)', () => {
        const html = renderLayerCorrelationPanelHTML({ state: null });
        expect(html).toContain('相関は因果ではありません');
    });
});

describe('LayerCorrelationPanel: with state', () => {
    it('renders table when pairs are present', () => {
        const html = renderLayerCorrelationPanelHTML({ state: mockState });
        expect(html).toContain('<table');
    });

    it('shows "(insufficient samples)" for sampleCount < 3', () => {
        const html = renderLayerCorrelationPanelHTML({ state: mockState });
        expect(html).toContain('(insufficient samples)');
    });

    it('header shows Japanese "サンプル数（最低3）" (v2.4)', () => {
        const html = renderLayerCorrelationPanelHTML({ state: mockState });
        expect(html).toContain('サンプル数');
    });
});

// ── DifferenceViewPanel ───────────────────────────────────────────────────────

describe('DifferenceViewPanel: null state', () => {
    it('shows empty message for null state', () => {
        const html = renderDifferenceViewPanelHTML({ state: null });
        expect(html).toContain('No difference data available');
    });
});

describe('DifferenceViewPanel: with state', () => {
    it('renders "Largest Observed Changes" heading', () => {
        const html = renderDifferenceViewPanelHTML({ state: mockDiff });
        expect(html).toContain('Largest Observed Changes');
    });

    it('caution-intro note about 改善 is present', () => {
        const html = renderDifferenceViewPanelHTML({ state: mockDiff });
        expect(html).toContain('改善');
    });

    it('delta value is shown', () => {
        const html = renderDifferenceViewPanelHTML({ state: mockDiff });
        // delta = 0.1 → shown as "+0.10000"
        expect(html).toContain('+0.10000');
    });
});
