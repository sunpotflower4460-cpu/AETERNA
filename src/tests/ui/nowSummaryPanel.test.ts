/**
 * nowSummaryPanel.test.ts
 * AETERNA-NATURAL v2.7 — Tests for renderNowSummaryPanelV27HTML
 *
 * Verifies:
 * - Beginner mode shows shorter output
 * - Researcher mode shows all sections
 * - claimGuardJa is always shown
 * - No forbidden consciousness proof claims
 * - Safe Baseline button is rendered
 */

import { describe, it, expect } from 'vitest';
import { renderNowSummaryPanelV27HTML } from '../../ui/observation/NowSummaryPanel.tsx';
import { deriveNowSummaryPanel } from '../../observer/deriveNowSummary.ts';
import type { NowSummaryPanelState } from '../../types/nowSummary.ts';

function makeState(overrides: Partial<NowSummaryPanelState> = {}): NowSummaryPanelState {
    return deriveNowSummaryPanel({ timestamp: 1234, ...{} });
}

describe('renderNowSummaryPanelV27HTML', () => {
    it('renders in beginner mode without error', () => {
        const state = makeState();
        const html = renderNowSummaryPanelV27HTML({ state, displayMode: 'beginner' });
        expect(html).toBeTruthy();
        expect(html).toContain('now-summary-panel-v27--beginner');
    });

    it('beginner mode shows overallOneLineJa', () => {
        const state = makeState();
        const html = renderNowSummaryPanelV27HTML({ state, displayMode: 'beginner' });
        expect(html).toContain(state.overallOneLineJa);
    });

    it('beginner mode shows beginnerSummaryJa', () => {
        const state = makeState();
        const html = renderNowSummaryPanelV27HTML({ state, displayMode: 'beginner' });
        // beginnerSummaryJa is shown in the panel
        expect(html).toContain('now-summary-panel-v27__beginner-summary');
    });

    it('beginner mode only shows vitalStem and bodyWorldLoop sections', () => {
        const state = makeState();
        const html = renderNowSummaryPanelV27HTML({ state, displayMode: 'beginner' });
        // Should show vitalStem and bodyWorldLoop section cards
        expect(html).toContain('now-summary-section-card--vitalStem');
        expect(html).toContain('now-summary-section-card--bodyWorldLoop');
        // Should NOT show torusLifeField section card (beginner only shows 2)
        expect(html).not.toContain('now-summary-section-card--torusLifeField');
    });

    it('researcher mode shows all 8 sections', () => {
        const state = makeState();
        const html = renderNowSummaryPanelV27HTML({ state, displayMode: 'researcher' });
        expect(html).toContain('now-summary-section-card--torusLifeField');
        expect(html).toContain('now-summary-section-card--vitalStem');
        expect(html).toContain('now-summary-section-card--bodyWorldLoop');
        expect(html).toContain('now-summary-section-card--history');
        expect(html).toContain('now-summary-section-card--emergenceCandidates');
        expect(html).toContain('now-summary-section-card--risks');
        expect(html).toContain('now-summary-section-card--signalExchange');
        expect(html).toContain('now-summary-section-card--consciousnessCandidateConditions');
    });

    it('claimGuardJa is always shown in beginner mode', () => {
        const state = makeState();
        const html = renderNowSummaryPanelV27HTML({ state, displayMode: 'beginner' });
        expect(html).toContain(state.claimGuardJa);
    });

    it('claimGuardJa is always shown in researcher mode', () => {
        const state = makeState();
        const html = renderNowSummaryPanelV27HTML({ state, displayMode: 'researcher' });
        expect(html).toContain(state.claimGuardJa);
    });

    it('Safe Baseline button is rendered in beginner mode', () => {
        const state = makeState();
        const html = renderNowSummaryPanelV27HTML({ state, displayMode: 'beginner' });
        expect(html).toContain('Safe Baseline');
        expect(html).toContain('nowSummary:safeBaselineCompare');
    });

    it('Safe Baseline button is rendered in researcher mode', () => {
        const state = makeState();
        const html = renderNowSummaryPanelV27HTML({ state, displayMode: 'researcher' });
        expect(html).toContain('Safe Baseline');
        expect(html).toContain('nowSummary:safeBaselineCompare');
    });

    it('does not contain forbidden consciousness proof claims', () => {
        const state = makeState();
        const htmlBeginner = renderNowSummaryPanelV27HTML({ state, displayMode: 'beginner' });
        const htmlResearcher = renderNowSummaryPanelV27HTML({ state, displayMode: 'researcher' });

        for (const html of [htmlBeginner, htmlResearcher]) {
            expect(html).not.toContain('AETERNAは意識がある');
            expect(html).not.toContain('AETERNA is conscious');
            expect(html).not.toContain('AETERNA は生きている');
            expect(html).not.toContain('AETERNA is alive');
        }
    });

    it('HTML output is XSS-safe for special characters', () => {
        const state = deriveNowSummaryPanel({ timestamp: 0, modeState: '<script>alert(1)</script>' });
        // In researcher mode, detailsJa is shown (including modeState)
        const html = renderNowSummaryPanelV27HTML({ state, displayMode: 'researcher' });
        expect(html).not.toContain('<script>alert(1)</script>');
        expect(html).toContain('&lt;script&gt;');
    });

    it('default displayMode is beginner', () => {
        const state = makeState();
        const html = renderNowSummaryPanelV27HTML({ state });
        expect(html).toContain('now-summary-panel-v27--beginner');
    });

    it('researcher mode shows researcherSummaryJa', () => {
        const state = makeState();
        const html = renderNowSummaryPanelV27HTML({ state, displayMode: 'researcher' });
        expect(html).toContain('now-summary-panel-v27__researcher-summary');
    });

    it('suggestedNextObservations are shown', () => {
        const state = makeState();
        const html = renderNowSummaryPanelV27HTML({ state, displayMode: 'beginner' });
        expect(html).toContain('Safe Baseline');
        expect(html).toContain('セル観測を見る');
    });
});
