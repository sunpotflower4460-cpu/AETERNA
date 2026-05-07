/**
 * nowSummaryPanel.test.ts
 * v2.4: AETERNA-NATURAL Japanese-First UI — NowSummaryPanel tests
 */

import { describe, it, expect } from 'vitest';
import {
    renderNowSummaryPanelHTML,
    buildNowSummaryLines,
    type NowSummaryContext,
} from '../../ui/natural/NowSummaryPanel.tsx';

// ── buildNowSummaryLines ──────────────────────────────────────────────────────

describe('buildNowSummaryLines: safe mode', () => {
    it('includes safe mode note when isSafeMode is not false', () => {
        const lines = buildNowSummaryLines({ isSafeMode: true });
        expect(lines.some((l) => l.includes('安全'))).toBe(true);
    });

    it('includes replay note when isReplayMode is true', () => {
        const lines = buildNowSummaryLines({ isReplayMode: true });
        expect(lines.some((l) => l.includes('再生モード'))).toBe(true);
    });
});

describe('buildNowSummaryLines: field status', () => {
    it('mentions field is active when fieldIsActive is true', () => {
        const lines = buildNowSummaryLines({ fieldIsActive: true });
        expect(lines.some((l) => l.includes('活動状態'))).toBe(true);
    });

    it('mentions field is quiet when fieldIsActive is false', () => {
        const lines = buildNowSummaryLines({ fieldIsActive: false });
        expect(lines.some((l) => l.includes('静止状態'))).toBe(true);
    });
});

describe('buildNowSummaryLines: NaN warning', () => {
    it('includes NaN warning when nanDetected is true', () => {
        const lines = buildNowSummaryLines({ nanDetected: true });
        expect(lines.some((l) => l.includes('NaN'))).toBe(true);
    });

    it('does not include NaN warning when nanDetected is false', () => {
        const lines = buildNowSummaryLines({ nanDetected: false });
        expect(lines.some((l) => l.includes('NaN'))).toBe(false);
    });
});

describe('buildNowSummaryLines: cell selection', () => {
    it('mentions selected cell index', () => {
        const lines = buildNowSummaryLines({ selectedCellIndex: 7 });
        expect(lines.some((l) => l.includes('7'))).toBe(true);
    });

    it('does not mention cell when none selected', () => {
        const lines = buildNowSummaryLines({ selectedCellIndex: null });
        expect(lines.some((l) => l.includes('セル'))).toBe(false);
    });
});

describe('buildNowSummaryLines: vortex candidate', () => {
    it('mentions high vortex confidence', () => {
        const lines = buildNowSummaryLines({ vortexCandidateConfidence: 0.9 });
        expect(lines.some((l) => l.includes('渦候補'))).toBe(true);
    });

    it('mentions low vortex confidence', () => {
        const lines = buildNowSummaryLines({ vortexCandidateConfidence: 0.1 });
        expect(lines.some((l) => l.includes('渦候補'))).toBe(true);
    });
});

// ── renderNowSummaryPanelHTML ─────────────────────────────────────────────────

describe('renderNowSummaryPanelHTML: structure', () => {
    it('renders the panel title "今起きていること"', () => {
        const html = renderNowSummaryPanelHTML({ context: {} });
        expect(html).toContain('今起きていること');
    });

    it('renders at least one summary line', () => {
        const html = renderNowSummaryPanelHTML({
            context: { isSafeMode: true, fieldIsActive: true },
        });
        expect(html).toContain('now-summary-panel__line');
    });

    it('renders disclaimer about observations not being proof', () => {
        const html = renderNowSummaryPanelHTML({ context: {} });
        expect(html).toContain('断定ではなく');
    });
});

describe('renderNowSummaryPanelHTML: XSS safety', () => {
    it('escapes XSS in extraLines', () => {
        const html = renderNowSummaryPanelHTML({
            context: {},
            extraLines: ['<script>alert(1)</script>'],
        });
        expect(html).not.toContain('<script>');
        expect(html).toContain('&lt;script&gt;');
    });
});

describe('renderNowSummaryPanelHTML: no forbidden claims', () => {
    const forbidden = [
        'consciousness proved',
        'aeterna feels',
        'aeterna wants',
        'soul',
        'life proved',
        'intelligence emerged',
    ];

    it('contains no forbidden consciousness/life claims', () => {
        const ctx: NowSummaryContext = {
            isSafeMode: true,
            fieldIsActive: true,
            vortexCandidateConfidence: 0.8,
            selectedCellIndex: 5,
            activeLensId: 'fieldPhase',
        };
        const html = renderNowSummaryPanelHTML({ context: ctx }).toLowerCase();
        for (const phrase of forbidden) {
            expect(html, `should not contain: "${phrase}"`).not.toContain(phrase);
        }
    });
});
