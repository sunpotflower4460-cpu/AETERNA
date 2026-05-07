/**
 * causalTracePanel.test.ts
 * v1.8: Causal Trace / Layer Correlation — CausalTracePanel unit tests
 *
 * Verifies:
 * - Renders "not causal proof" disclaimer
 * - No forbidden consciousness/life/soul claims
 * - Shows signals when present
 * - Shows "no signals" when empty
 */

import { describe, it, expect } from 'vitest';
import { renderCausalTracePanelHTML } from '../../ui/observation/CausalTracePanel.js';
import type { CausalTraceResult, CausalTraceSignal } from '../../types/causalTrace.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSignal(id: string, label: string): CausalTraceSignal {
    return {
        id,
        sourceLayer: 'field',
        metricId: 'globalSummary.phaseCoherence',
        label,
        valueBefore: 0.3,
        valueAfter: 0.7,
        delta: 0.4,
        tickBefore: 9,
        tickAfter: 10,
        relatedCellIndices: [0],
        relatedEventIds: [],
        relationKind: 'same_cell',
        confidence: 'medium',
        caution: 'This is a possible contributing signal, not causal proof.',
    };
}

function makeResult(overrides: Partial<CausalTraceResult> = {}): CausalTraceResult {
    return {
        id: 'ct-1',
        targetCellIndex: 0,
        targetMetricId: null,
        activeLensId: null,
        currentTick: 10,
        comparedTick: 9,
        possibleContributingSignals: [],
        relatedObservations: [],
        strongestSignals: [],
        summary: ['No signals found.'],
        cautions: [
            'This is a possible contributing signal, not causal proof.',
            'Correlation between metrics is not evidence of causation.',
        ],
        confidence: 'low',
        generatedAt: Date.now(),
        ...overrides,
    };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CausalTracePanel: disclaimer', () => {
    it('renders "因果証明ではありません" disclaimer (Japanese-first, v2.4)', () => {
        const html = renderCausalTracePanelHTML({ result: makeResult() });
        expect(html).toContain('因果証明ではありません');
    });

    it('renders disclaimer even when result is null', () => {
        const html = renderCausalTracePanelHTML({ result: null });
        expect(html).toContain('因果証明ではありません');
    });
});

describe('CausalTracePanel: no forbidden claims', () => {
    const forbidden = [
        'proves consciousness',
        'is conscious',
        'aeterna feels',
        'aeterna remembers',
        'life proof',
        'intelligence emerged',
        'soul resonance',
    ];

    it('rendered HTML contains no forbidden consciousness/life claims', () => {
        const html = renderCausalTracePanelHTML({
            result: makeResult({
                possibleContributingSignals: [makeSignal('s1', 'Phase Coherence Change')],
                summary: ['1 signal found.'],
                confidence: 'medium',
            }),
        }).toLowerCase();
        for (const phrase of forbidden) {
            expect(html, `should not contain: "${phrase}"`).not.toContain(phrase);
        }
    });
});

describe('CausalTracePanel: signals', () => {
    it('shows signal label when signals are present', () => {
        const signal = makeSignal('s1', 'Phase Coherence Change');
        const html = renderCausalTracePanelHTML({
            result: makeResult({
                possibleContributingSignals: [signal],
                summary: ['1 signal found.'],
                confidence: 'medium',
            }),
        });
        expect(html).toContain('Phase Coherence Change');
    });

    it('shows "関連候補シグナルはありませんでした" message when possibleContributingSignals is empty', () => {
        const html = renderCausalTracePanelHTML({
            result: makeResult({ possibleContributingSignals: [] }),
        });
        expect(html).toContain('関連候補シグナルはありませんでした');
    });

    it('shows signal confidence badge', () => {
        const signal = makeSignal('s1', 'Test Signal');
        const html = renderCausalTracePanelHTML({
            result: makeResult({
                possibleContributingSignals: [signal],
                confidence: 'medium',
            }),
        });
        expect(html).toContain('medium');
    });
});

describe('CausalTracePanel: tick display', () => {
    it('shows current tick in the panel header', () => {
        const html = renderCausalTracePanelHTML({
            result: makeResult({ currentTick: 42 }),
        });
        expect(html).toContain('42');
    });
});
