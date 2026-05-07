/**
 * lensAwareGuideUx.test.ts
 * v2.0: AETERNA-NATURAL Observation UX Final Polish
 * — LensAwareGuidePanel and LensGuideResponseView tests
 */

import { describe, it, expect } from 'vitest';
import { renderLensAwareGuidePanelHTML } from '../../ui/guide/LensAwareGuidePanel.js';
import { renderLensGuideResponseViewHTML } from '../../ui/guide/LensGuideResponseView.js';
import type { LensGuideResponse } from '../../guide/lensGuideTypes.js';

// ── Stubs ─────────────────────────────────────────────────────────────────────

const shortResponse: LensGuideResponse = {
    mode: 'explain',
    answer: 'Short answer here.',
    observationFacts: ['Phase is 2.4 rad'],
    hypothesisCandidates: ['Possible vortex candidate nearby'],
    comparisonNotes: [],
    cautionNotes: ['Proxy only, not proof'],
    suggestedNextLenses: ['vortexConfidence'],
    suggestedNextPanels: ['CausalTrace'],
    confidence: 0.6,
    usedContextKinds: ['geometry'],
    claimGuardPassed: true,
    blockedClaims: [],
};

// Long answer (> 200 chars)
const longAnswer = 'A'.repeat(201);
const longResponse: LensGuideResponse = {
    ...shortResponse,
    answer: longAnswer,
};

const claimGuardFailedResponse: LensGuideResponse = {
    ...shortResponse,
    claimGuardPassed: false,
};

// ── LensAwareGuidePanel ───────────────────────────────────────────────────────

describe('LensAwareGuidePanel: null activeLensId', () => {
    it('shows Japanese "レンズ未選択" when activeLensId is null (v2.4)', () => {
        const html = renderLensAwareGuidePanelHTML({
            activeLensId: null,
            selectedCellIndex: null,
            activeMode: 'explain',
            response: null,
        });
        expect(html).toContain('レンズ未選択');
    });
});

describe('LensAwareGuidePanel: activeLensId set', () => {
    it('shows the lens ID when activeLensId is set', () => {
        const html = renderLensAwareGuidePanelHTML({
            activeLensId: 'gaussianCurvature',
            selectedCellIndex: null,
            activeMode: 'explain',
            response: null,
        });
        expect(html).toContain('gaussianCurvature');
    });
});

describe('LensAwareGuidePanel: guardrail note', () => {
    it('contains AETERNA 本体 guardrail note', () => {
        const html = renderLensAwareGuidePanelHTML({
            activeLensId: null,
            selectedCellIndex: null,
            activeMode: 'explain',
            response: null,
        });
        expect(html).toContain('AETERNA 本体');
    });
});

describe('LensAwareGuidePanel: public mode', () => {
    it('shows Japanese "ルールベース" and "外部LLM無効" in public mode (v2.4)', () => {
        const html = renderLensAwareGuidePanelHTML({
            activeLensId: null,
            selectedCellIndex: null,
            activeMode: 'explain',
            response: null,
            isPublicMode: true,
        });
        expect(html).toContain('ルールベース');
        expect(html).toContain('外部LLM無効');
    });
});

describe('LensAwareGuidePanel: question shortcuts', () => {
    it('contains これなに？ shortcut', () => {
        const html = renderLensAwareGuidePanelHTML({
            activeLensId: null,
            selectedCellIndex: null,
            activeMode: 'explain',
            response: null,
        });
        expect(html).toContain('これなに？');
    });

    it('contains 次どこを見る？ shortcut', () => {
        const html = renderLensAwareGuidePanelHTML({
            activeLensId: null,
            selectedCellIndex: null,
            activeMode: 'explain',
            response: null,
        });
        expect(html).toContain('次どこを見る？');
    });

    it('contains これは証明になる？ shortcut', () => {
        const html = renderLensAwareGuidePanelHTML({
            activeLensId: null,
            selectedCellIndex: null,
            activeMode: 'explain',
            response: null,
        });
        expect(html).toContain('これは証明になる？');
    });
});

describe('LensAwareGuidePanel: no forbidden claims', () => {
    const forbiddenPhrases = [
        'consciousness proved',
        'aeterna feels',
        'aeterna wants',
        'soul',
    ];

    it('contains no forbidden claims', () => {
        const html = renderLensAwareGuidePanelHTML({
            activeLensId: 'fieldAmplitude',
            selectedCellIndex: 3,
            activeMode: 'explain',
            response: shortResponse,
            isPublicMode: false,
        }).toLowerCase();
        for (const phrase of forbiddenPhrases) {
            expect(html, `should not contain: "${phrase}"`).not.toContain(phrase);
        }
    });
});

// ── LensGuideResponseView ─────────────────────────────────────────────────────

describe('LensGuideResponseView: null response', () => {
    it('shows "Guide is ready" when response is null', () => {
        const html = renderLensGuideResponseViewHTML({ response: null });
        expect(html).toContain('Guide is ready');
    });
});

describe('LensGuideResponseView: short answer', () => {
    it('renders answer as plain paragraph (no details/summary) for short text', () => {
        const html = renderLensGuideResponseViewHTML({ response: shortResponse });
        expect(html).toContain('Short answer here.');
        expect(html).not.toContain('<details');
    });
});

describe('LensGuideResponseView: long answer', () => {
    it('uses details/summary collapsible for answer > 200 chars', () => {
        const html = renderLensGuideResponseViewHTML({ response: longResponse });
        expect(html).toContain('<details');
        expect(html).toContain('<summary');
    });
});

describe('LensGuideResponseView: caution notes', () => {
    it('shows caution notes section when cautionNotes has items', () => {
        const html = renderLensGuideResponseViewHTML({ response: shortResponse });
        expect(html).toContain('Caution Notes');
        expect(html).toContain('Proxy only, not proof');
    });
});

describe('LensGuideResponseView: suggested next lenses', () => {
    it('shows suggested next lens buttons', () => {
        const html = renderLensGuideResponseViewHTML({ response: shortResponse });
        expect(html).toContain('vortexConfidence');
        expect(html).toContain('lens-guide-response-view__next-lens-btn');
    });
});

describe('LensGuideResponseView: observation facts', () => {
    it('shows observation facts section when present', () => {
        const html = renderLensGuideResponseViewHTML({ response: shortResponse });
        expect(html).toContain('Observation Facts');
        expect(html).toContain('Phase is 2.4 rad');
    });
});

describe('LensGuideResponseView: hypothesis candidates', () => {
    it('shows hypothesis candidates section when present', () => {
        const html = renderLensGuideResponseViewHTML({ response: shortResponse });
        expect(html).toContain('Hypothesis Candidates');
        expect(html).toContain('Possible vortex candidate nearby');
    });
});

describe('LensGuideResponseView: claim guard note', () => {
    it('shows claim guard note when claimGuardPassed=false', () => {
        const html = renderLensGuideResponseViewHTML({ response: claimGuardFailedResponse });
        expect(html).toContain('claim guard');
    });

    it('does not show claim guard note when claimGuardPassed=true', () => {
        const html = renderLensGuideResponseViewHTML({ response: shortResponse });
        expect(html).not.toContain('claim guard adjusted response');
    });
});
