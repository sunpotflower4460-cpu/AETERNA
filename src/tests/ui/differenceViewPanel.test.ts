/**
 * differenceViewPanel.test.ts
 * v1.8: Causal Trace / Layer Correlation — DifferenceViewPanel unit tests
 *
 * Verifies:
 * - Renders before/after/delta
 * - Shows tick range
 * - No forbidden claims
 */

import { describe, it, expect } from 'vitest';
import { renderDifferenceViewPanelHTML } from '../../ui/observation/DifferenceViewPanel.js';
import type { ObservationDifferenceState, ObservationDifferenceItem } from '../../types/observationDifference.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeItem(
    metricId: string,
    label: string,
    before: number | null,
    after: number | null,
): ObservationDifferenceItem {
    const delta = before !== null && after !== null ? after - before : null;
    const relativeDelta = delta !== null && before !== null && Math.abs(before) > 1e-12
        ? delta / Math.abs(before)
        : null;
    return {
        metricId,
        label,
        valueKind: 'Derived',
        valueBefore: before,
        valueAfter: after,
        delta,
        relativeDelta,
        sourceLayer: 'field',
    };
}

function makeState(overrides: Partial<ObservationDifferenceState> = {}): ObservationDifferenceState {
    const items = [
        makeItem('field.amplitude', 'Field Amplitude', 0.3, 0.7),
        makeItem('field.phase', 'Field Phase', 1.2, 1.5),
        makeItem('globalSummary.phaseCoherence', 'Phase Coherence', 0.4, 0.9),
    ];
    return {
        beforeTick: 10,
        afterTick: 20,
        activeLensId: null,
        items,
        largestChanges: [...items].sort((a, b) => Math.abs(b.delta ?? 0) - Math.abs(a.delta ?? 0)).slice(0, 5),
        cellObservationAvailable: false,
        globalSummaryAvailable: true,
        caution: 'Differences shown are observational deltas only.',
        generatedAt: Date.now(),
        ...overrides,
    };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('DifferenceViewPanel: tick range', () => {
    it('shows tick range in the panel', () => {
        const html = renderDifferenceViewPanelHTML({ state: makeState() });
        expect(html).toContain('10');
        expect(html).toContain('20');
    });

    it('shows "→" separator between before and after ticks', () => {
        const html = renderDifferenceViewPanelHTML({ state: makeState() });
        expect(html).toContain('→');
    });
});

describe('DifferenceViewPanel: before/after/delta', () => {
    it('renders metric label in the table', () => {
        const html = renderDifferenceViewPanelHTML({ state: makeState() });
        expect(html).toContain('Field Amplitude');
    });

    it('renders before value in the table', () => {
        const html = renderDifferenceViewPanelHTML({ state: makeState() });
        expect(html).toContain('0.30000');
    });

    it('renders after value in the table', () => {
        const html = renderDifferenceViewPanelHTML({ state: makeState() });
        expect(html).toContain('0.70000');
    });

    it('renders delta value in the table', () => {
        const html = renderDifferenceViewPanelHTML({ state: makeState() });
        expect(html).toContain('+0.40000');
    });
});

describe('DifferenceViewPanel: largestChanges', () => {
    it('shows largest changes section', () => {
        const html = renderDifferenceViewPanelHTML({ state: makeState() });
        expect(html.toLowerCase()).toContain('largest');
    });
});

describe('DifferenceViewPanel: null state', () => {
    it('shows empty message when state is null', () => {
        const html = renderDifferenceViewPanelHTML({ state: null });
        expect(html.toLowerCase()).toContain('no difference data');
    });
});

describe('DifferenceViewPanel: no forbidden claims', () => {
    const forbidden = [
        'proves consciousness',
        'is conscious',
        'life proof',
        'soul',
        'intelligence emerged',
        'aeterna feels',
    ];

    it('contains no forbidden consciousness/life claims', () => {
        const html = renderDifferenceViewPanelHTML({ state: makeState() }).toLowerCase();
        for (const phrase of forbidden) {
            expect(html, `should not contain: "${phrase}"`).not.toContain(phrase);
        }
    });
});
