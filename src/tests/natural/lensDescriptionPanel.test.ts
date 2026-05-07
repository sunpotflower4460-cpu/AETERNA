/**
 * lensDescriptionPanel.test.ts
 * v2.4: AETERNA-NATURAL Japanese-First UI — LensDescriptionPanel tests
 */

import { describe, it, expect } from 'vitest';
import {
    renderLensDescriptionPanelHTML,
    LENS_DESCRIPTIONS,
} from '../../ui/natural/LensDescriptionPanel.tsx';
import { ALL_LENS_IDS } from '../../ui/lens/metricLensRegistry.ts';

// ── LENS_DESCRIPTIONS coverage ────────────────────────────────────────────────

describe('LENS_DESCRIPTIONS: completeness', () => {
    it('has a description for every lens ID in the registry', () => {
        for (const id of ALL_LENS_IDS) {
            expect(LENS_DESCRIPTIONS[id], `Missing description for lens: ${id}`).toBeDefined();
        }
    });

    it('every description has nameJp, whatItSees, whatItIsNot', () => {
        for (const [id, desc] of Object.entries(LENS_DESCRIPTIONS)) {
            expect(desc.nameJp, `${id}: missing nameJp`).toBeTruthy();
            expect(desc.whatItSees, `${id}: missing whatItSees`).toBeTruthy();
            expect(desc.whatItIsNot, `${id}: missing whatItIsNot`).toBeTruthy();
        }
    });
});

// ── renderLensDescriptionPanelHTML ────────────────────────────────────────────

describe('renderLensDescriptionPanelHTML: null lens', () => {
    it('renders empty state when lensId is null', () => {
        const html = renderLensDescriptionPanelHTML({ lensId: null });
        expect(html).toContain('lens-description-panel--empty');
        expect(html).toContain('レンズが選択されていません');
    });
});

describe('renderLensDescriptionPanelHTML: fieldPhase', () => {
    it('renders Japanese lens name', () => {
        const html = renderLensDescriptionPanelHTML({ lensId: 'fieldPhase' });
        expect(html).toContain('位相レンズ');
    });

    it('renders "何を見るか" section', () => {
        const html = renderLensDescriptionPanelHTML({ lensId: 'fieldPhase' });
        expect(html).toContain('何を見るか');
    });

    it('renders "何ではないか" section', () => {
        const html = renderLensDescriptionPanelHTML({ lensId: 'fieldPhase' });
        expect(html).toContain('何ではないか');
    });

    it('does not claim phase is consciousness', () => {
        const html = renderLensDescriptionPanelHTML({ lensId: 'fieldPhase' }).toLowerCase();
        expect(html).not.toContain('consciousness');
        expect(html).not.toContain('soul');
    });
});

describe('renderLensDescriptionPanelHTML: plasticityTrace', () => {
    it('contains "媒質履歴" in name', () => {
        const html = renderLensDescriptionPanelHTML({ lensId: 'plasticityTrace' });
        expect(html).toContain('媒質履歴');
    });

    it('clarifies it is not memory/learning', () => {
        const html = renderLensDescriptionPanelHTML({ lensId: 'plasticityTrace' });
        expect(html).toContain('学習');
    });
});

describe('renderLensDescriptionPanelHTML: vortexConfidence', () => {
    it('contains "渦候補" in name', () => {
        const html = renderLensDescriptionPanelHTML({ lensId: 'vortexConfidence' });
        expect(html).toContain('渦候補');
    });

    it('contains high/low value hints', () => {
        const html = renderLensDescriptionPanelHTML({ lensId: 'vortexConfidence' });
        expect(html).toContain('値が高いとき');
        expect(html).toContain('値が低いとき');
    });
});

describe('renderLensDescriptionPanelHTML: XSS safety', () => {
    it('escapes unknown lens ID', () => {
        const html = renderLensDescriptionPanelHTML({
            // @ts-expect-error intentionally invalid ID for XSS test
            lensId: '<script>xss</script>',
        });
        expect(html).not.toContain('<script>');
    });
});

describe('renderLensDescriptionPanelHTML: no forbidden claims', () => {
    const forbidden = [
        'proves consciousness',
        'is conscious',
        'aeterna feels',
        'life proof',
        'soul resonance',
        'intelligence emerged',
    ];

    it('no lens description contains forbidden claims', () => {
        for (const id of ALL_LENS_IDS) {
            const html = renderLensDescriptionPanelHTML({ lensId: id }).toLowerCase();
            for (const phrase of forbidden) {
                expect(html, `${id}: should not contain "${phrase}"`).not.toContain(phrase);
            }
        }
    });
});
