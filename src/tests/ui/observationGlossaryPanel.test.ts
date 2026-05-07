/**
 * observationGlossaryPanel.test.ts
 * v2.4: AETERNA-NATURAL Japanese-First UI — ObservationGlossaryPanel tests
 *
 * Verifies that:
 * 1. Glossary panel renders with Japanese title.
 * 2. Glossary panel renders term cards.
 * 3. Filter functionality works.
 * 4. Mode-based visibility works.
 * 5. ObservationTermCard renders required sections.
 * 6. TermTooltip renders required sections.
 */

import { describe, it, expect } from 'vitest';
import { renderObservationGlossaryPanelHTML } from '../../ui/terms/ObservationGlossaryPanel.tsx';
import { renderObservationTermCardHTML } from '../../ui/terms/ObservationTermCard.tsx';
import { renderTermTooltipHTML } from '../../ui/terms/TermTooltip.tsx';
import {
    BEGINNER_DISPLAY_MODE_CONFIG,
    RESEARCHER_DISPLAY_MODE_CONFIG,
    DEVELOPER_DISPLAY_MODE_CONFIG,
    STANDARD_DISPLAY_MODE_CONFIG,
} from '../../config/observationDisplayModeConfig.ts';
import { getTermById } from '../../i18n/observationTermsJa.ts';

// ── GlossaryPanel rendering ───────────────────────────────────────────────────

describe('ObservationGlossaryPanel: renders', () => {
    it('renders glossary panel HTML', () => {
        const html = renderObservationGlossaryPanelHTML({
            config: BEGINNER_DISPLAY_MODE_CONFIG,
        });
        expect(typeof html).toBe('string');
        expect(html.length).toBeGreaterThan(0);
    });

    it('shows "観測用語辞典" title', () => {
        const html = renderObservationGlossaryPanelHTML({
            config: STANDARD_DISPLAY_MODE_CONFIG,
        });
        expect(html).toContain('観測用語辞典');
    });

    it('shows non-consciousness disclaimer note', () => {
        const html = renderObservationGlossaryPanelHTML({
            config: STANDARD_DISPLAY_MODE_CONFIG,
        });
        expect(html).toContain('意識・生命・知性・神秘的真理を証明するものではありません');
    });

    it('has aria-label="観測用語辞典"', () => {
        const html = renderObservationGlossaryPanelHTML({
            config: BEGINNER_DISPLAY_MODE_CONFIG,
        });
        expect(html).toContain('aria-label="観測用語辞典"');
    });

    it('includes data-mode attribute', () => {
        const html = renderObservationGlossaryPanelHTML({
            config: BEGINNER_DISPLAY_MODE_CONFIG,
        });
        expect(html).toContain('data-mode="beginner"');
    });
});

describe('ObservationGlossaryPanel: beginner mode', () => {
    it('shows beginner-visible terms', () => {
        const html = renderObservationGlossaryPanelHTML({
            config: BEGINNER_DISPLAY_MODE_CONFIG,
        });
        expect(html).toContain('渦候補');
        expect(html).toContain('振幅');
        expect(html).toContain('位相');
    });

    it('shows mode label はじめて見る', () => {
        const html = renderObservationGlossaryPanelHTML({
            config: BEGINNER_DISPLAY_MODE_CONFIG,
        });
        expect(html).toContain('はじめて見る');
    });
});

describe('ObservationGlossaryPanel: researcher mode', () => {
    it('shows more terms than beginner', () => {
        const beginnerHtml = renderObservationGlossaryPanelHTML({
            config: BEGINNER_DISPLAY_MODE_CONFIG,
        });
        const researcherHtml = renderObservationGlossaryPanelHTML({
            config: RESEARCHER_DISPLAY_MODE_CONFIG,
        });
        // researcher mode shows more terms, so longer HTML
        expect(researcherHtml.length).toBeGreaterThan(beginnerHtml.length);
    });

    it('shows English labels in researcher mode', () => {
        const html = renderObservationGlossaryPanelHTML({
            config: RESEARCHER_DISPLAY_MODE_CONFIG,
            expandAll: true,
        });
        // English labels should appear
        expect(html).toContain('Vortex Candidate');
    });
});

describe('ObservationGlossaryPanel: developer mode shows internalIds', () => {
    it('shows internal IDs in developer mode', () => {
        const html = renderObservationGlossaryPanelHTML({
            config: DEVELOPER_DISPLAY_MODE_CONFIG,
            expandAll: true,
        });
        expect(html).toContain('vortexCandidateConfidence');
    });

    it('does NOT show internal IDs in beginner mode', () => {
        const html = renderObservationGlossaryPanelHTML({
            config: BEGINNER_DISPLAY_MODE_CONFIG,
            expandAll: true,
        });
        // internalId should not appear as code in beginner mode
        const termCard = html.match(/class="term-card__internal-id"/);
        expect(termCard).toBeNull();
    });
});

describe('ObservationGlossaryPanel: filter', () => {
    it('filters terms by Japanese label', () => {
        const html = renderObservationGlossaryPanelHTML({
            config: RESEARCHER_DISPLAY_MODE_CONFIG,
            filterText: '渦候補',
        });
        expect(html).toContain('渦候補');
    });

    it('shows empty message when no match', () => {
        const html = renderObservationGlossaryPanelHTML({
            config: RESEARCHER_DISPLAY_MODE_CONFIG,
            filterText: '__nomatchxyz__',
        });
        expect(html).toContain('該当する用語が見つかりませんでした');
    });
});

// ── ObservationTermCard ───────────────────────────────────────────────────────

describe('ObservationTermCard: renders', () => {
    it('renders term card HTML', () => {
        const term = getTermById('vortexCandidateConfidence')!;
        const html = renderObservationTermCardHTML({
            term,
            config: STANDARD_DISPLAY_MODE_CONFIG,
        });
        expect(typeof html).toBe('string');
        expect(html.length).toBeGreaterThan(0);
    });

    it('shows Japanese label', () => {
        const term = getTermById('vortexCandidateConfidence')!;
        const html = renderObservationTermCardHTML({ term, config: STANDARD_DISPLAY_MODE_CONFIG });
        expect(html).toContain('渦候補の強さ');
    });

    it('shows whatItShowsJa', () => {
        const term = getTermById('vortexCandidateConfidence')!;
        const html = renderObservationTermCardHTML({ term, config: STANDARD_DISPLAY_MODE_CONFIG });
        expect(html).toContain('何を見る値か');
    });

    it('shows whatItIsNotJa', () => {
        const term = getTermById('vortexCandidateConfidence')!;
        const html = renderObservationTermCardHTML({ term, config: STANDARD_DISPLAY_MODE_CONFIG });
        expect(html).toContain('何ではないか');
    });

    it('shows value kind badge', () => {
        const term = getTermById('vortexCandidateConfidence')!;
        const html = renderObservationTermCardHTML({ term, config: STANDARD_DISPLAY_MODE_CONFIG });
        expect(html).toContain('補助指標');
    });

    it('shows internalId in developer mode', () => {
        const term = getTermById('vortexCandidateConfidence')!;
        const html = renderObservationTermCardHTML({
            term,
            config: DEVELOPER_DISPLAY_MODE_CONFIG,
        });
        expect(html).toContain('内部ID');
        expect(html).toContain('vortexCandidateConfidence');
    });

    it('hides internalId in beginner mode', () => {
        const term = getTermById('vortexCandidateConfidence')!;
        const html = renderObservationTermCardHTML({
            term,
            config: BEGINNER_DISPLAY_MODE_CONFIG,
        });
        expect(html).not.toContain('内部ID');
    });
});

// ── TermTooltip ───────────────────────────────────────────────────────────────

describe('TermTooltip: renders', () => {
    it('renders tooltip HTML', () => {
        const term = getTermById('causalTrace')!;
        const html = renderTermTooltipHTML({ term });
        expect(typeof html).toBe('string');
        expect(html.length).toBeGreaterThan(0);
    });

    it('shows Japanese label', () => {
        const term = getTermById('causalTrace')!;
        const html = renderTermTooltipHTML({ term });
        expect(html).toContain('関連候補');
    });

    it('shows whatItIsNot section', () => {
        const term = getTermById('causalTrace')!;
        const html = renderTermTooltipHTML({ term });
        expect(html).toContain('何ではないか');
    });

    it('shows glossary hint by default', () => {
        const term = getTermById('causalTrace')!;
        const html = renderTermTooltipHTML({ term });
        expect(html).toContain('用語辞典');
    });

    it('has role="tooltip"', () => {
        const term = getTermById('causalTrace')!;
        const html = renderTermTooltipHTML({ term });
        expect(html).toContain('role="tooltip"');
    });

    it('hides glossary hint when showGlossaryHint=false', () => {
        const term = getTermById('causalTrace')!;
        const html = renderTermTooltipHTML({ term, showGlossaryHint: false });
        expect(html).not.toContain('term-tooltip__glossary-hint');
    });
});
