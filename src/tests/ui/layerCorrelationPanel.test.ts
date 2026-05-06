/**
 * layerCorrelationPanel.test.ts
 * v1.8: Causal Trace / Layer Correlation — LayerCorrelationPanel unit tests
 *
 * Verifies:
 * - Renders correlation table
 * - Shows "correlation is not causal proof"
 * - No forbidden claims
 */

import { describe, it, expect } from 'vitest';
import { renderLayerCorrelationPanelHTML } from '../../ui/observation/LayerCorrelationPanel.js';
import type { LayerCorrelationState } from '../../types/layerCorrelation.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeState(overrides: Partial<LayerCorrelationState> = {}): LayerCorrelationState {
    return {
        pairs: [
            {
                id: 'curvature×vortex',
                labelA: 'Phase Coherence',
                metricKeyA: 'phaseCoherence',
                labelB: 'Vortex Candidate Count',
                metricKeyB: 'vortexCandidateCount',
                correlation: 0.78,
                sampleCount: 20,
                confidence: 'medium',
                caution: 'Correlation is not causal proof.',
            },
        ],
        timeWindowTicks: 100,
        snapshotCount: 20,
        earliestTick: 1,
        latestTick: 100,
        sufficientData: true,
        caution: 'Layer correlation shows statistical patterns only. Correlation is not causal proof.',
        generatedAt: Date.now(),
        ...overrides,
    };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('LayerCorrelationPanel: disclaimer', () => {
    it('shows "correlation is not causal proof"', () => {
        const html = renderLayerCorrelationPanelHTML({ state: makeState() });
        expect(html.toLowerCase()).toContain('correlation is not causal proof');
    });

    it('shows disclaimer even when state is null', () => {
        const html = renderLayerCorrelationPanelHTML({ state: null });
        expect(html.toLowerCase()).toContain('correlation is not causal proof');
    });
});

describe('LayerCorrelationPanel: table', () => {
    it('renders a table with the pair labels', () => {
        const html = renderLayerCorrelationPanelHTML({ state: makeState() });
        expect(html).toContain('Phase Coherence');
        expect(html).toContain('Vortex Candidate Count');
    });

    it('shows the correlation value', () => {
        const html = renderLayerCorrelationPanelHTML({ state: makeState() });
        expect(html).toContain('0.7800');
    });

    it('shows "—" when correlation is null', () => {
        const html = renderLayerCorrelationPanelHTML({
            state: makeState({
                pairs: [{
                    id: 'test',
                    labelA: 'A',
                    metricKeyA: 'a',
                    labelB: 'B',
                    metricKeyB: 'b',
                    correlation: null,
                    sampleCount: 1,
                    confidence: 'insufficient',
                    caution: 'Insufficient.',
                }],
            }),
        });
        expect(html).toContain('—');
    });

    it('shows confidence level in row', () => {
        const html = renderLayerCorrelationPanelHTML({ state: makeState() });
        expect(html).toContain('medium');
    });
});

describe('LayerCorrelationPanel: insufficient data', () => {
    it('shows insufficient note when sufficientData is false', () => {
        const html = renderLayerCorrelationPanelHTML({
            state: makeState({ sufficientData: false, snapshotCount: 1 }),
        });
        expect(html.toLowerCase()).toContain('insufficient');
    });
});

describe('LayerCorrelationPanel: no forbidden claims', () => {
    const forbidden = [
        'proves consciousness',
        'is conscious',
        'life proof',
        'soul',
        'intelligence emerged',
        'aeterna feels',
    ];

    it('contains no forbidden consciousness/life claims', () => {
        const html = renderLayerCorrelationPanelHTML({ state: makeState() }).toLowerCase();
        for (const phrase of forbidden) {
            expect(html, `should not contain: "${phrase}"`).not.toContain(phrase);
        }
    });
});
