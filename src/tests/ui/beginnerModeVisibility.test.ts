/**
 * beginnerModeVisibility.test.ts
 * v2.4: AETERNA-NATURAL Japanese-First UI — Beginner Mode Visibility tests
 *
 * Verifies that:
 * 1. Beginner mode hides internalIds.
 * 2. Beginner mode hides English labels.
 * 3. Researcher mode shows English labels.
 * 4. Developer mode shows internalIds.
 * 5. isTermVisibleInMode works correctly.
 * 6. ObservationDisplayModeConfig defaults to beginner.
 */

import { describe, it, expect } from 'vitest';
import {
    BEGINNER_DISPLAY_MODE_CONFIG,
    STANDARD_DISPLAY_MODE_CONFIG,
    RESEARCHER_DISPLAY_MODE_CONFIG,
    DEVELOPER_DISPLAY_MODE_CONFIG,
    defaultObservationDisplayModeConfig,
    OBSERVATION_DISPLAY_MODE_CONFIGS,
    getDisplayModeConfig,
    isTermVisibleInMode,
} from '../../config/observationDisplayModeConfig.ts';
import { renderObservationTermCardHTML } from '../../ui/terms/ObservationTermCard.tsx';
import { renderObservationGlossaryPanelHTML } from '../../ui/terms/ObservationGlossaryPanel.tsx';
import { getTermById } from '../../i18n/observationTermsJa.ts';

// ── Config defaults ───────────────────────────────────────────────────────────

describe('ObservationDisplayModeConfig: defaults', () => {
    it('default mode is beginner', () => {
        expect(defaultObservationDisplayModeConfig.mode).toBe('beginner');
    });

    it('beginner mode hides internalIds', () => {
        expect(BEGINNER_DISPLAY_MODE_CONFIG.showInternalIds).toBe(false);
    });

    it('beginner mode hides English labels', () => {
        expect(BEGINNER_DISPLAY_MODE_CONFIG.showEnglishLabels).toBe(false);
    });

    it('beginner mode hides raw diagnostics', () => {
        expect(BEGINNER_DISPLAY_MODE_CONFIG.showRawDiagnostics).toBe(false);
    });

    it('beginner mode hides advanced metrics', () => {
        expect(BEGINNER_DISPLAY_MODE_CONFIG.showAdvancedMetrics).toBe(false);
    });

    it('beginner mode hides developer warnings', () => {
        expect(BEGINNER_DISPLAY_MODE_CONFIG.showDeveloperWarnings).toBe(false);
    });
});

describe('ObservationDisplayModeConfig: researcher mode', () => {
    it('researcher mode shows English labels', () => {
        expect(RESEARCHER_DISPLAY_MODE_CONFIG.showEnglishLabels).toBe(true);
    });

    it('researcher mode hides internalIds', () => {
        expect(RESEARCHER_DISPLAY_MODE_CONFIG.showInternalIds).toBe(false);
    });

    it('researcher mode shows advanced metrics', () => {
        expect(RESEARCHER_DISPLAY_MODE_CONFIG.showAdvancedMetrics).toBe(true);
    });
});

describe('ObservationDisplayModeConfig: developer mode', () => {
    it('developer mode shows internalIds', () => {
        expect(DEVELOPER_DISPLAY_MODE_CONFIG.showInternalIds).toBe(true);
    });

    it('developer mode shows English labels', () => {
        expect(DEVELOPER_DISPLAY_MODE_CONFIG.showEnglishLabels).toBe(true);
    });

    it('developer mode shows raw diagnostics', () => {
        expect(DEVELOPER_DISPLAY_MODE_CONFIG.showRawDiagnostics).toBe(true);
    });

    it('developer mode shows developer warnings', () => {
        expect(DEVELOPER_DISPLAY_MODE_CONFIG.showDeveloperWarnings).toBe(true);
    });
});

describe('ObservationDisplayModeConfig: all modes available', () => {
    it('has beginner config', () => {
        expect(OBSERVATION_DISPLAY_MODE_CONFIGS.beginner).toBeDefined();
    });
    it('has standard config', () => {
        expect(OBSERVATION_DISPLAY_MODE_CONFIGS.standard).toBeDefined();
    });
    it('has researcher config', () => {
        expect(OBSERVATION_DISPLAY_MODE_CONFIGS.researcher).toBeDefined();
    });
    it('has developer config', () => {
        expect(OBSERVATION_DISPLAY_MODE_CONFIGS.developer).toBeDefined();
    });
});

describe('getDisplayModeConfig: lookup', () => {
    it('returns beginner config', () => {
        const config = getDisplayModeConfig('beginner');
        expect(config.mode).toBe('beginner');
        expect(config.showInternalIds).toBe(false);
    });

    it('returns developer config', () => {
        const config = getDisplayModeConfig('developer');
        expect(config.mode).toBe('developer');
        expect(config.showInternalIds).toBe(true);
    });
});

describe('isTermVisibleInMode', () => {
    it('beginner mode: shows beginnerVisible=true term', () => {
        expect(isTermVisibleInMode(BEGINNER_DISPLAY_MODE_CONFIG, true, true)).toBe(true);
    });

    it('beginner mode: hides beginnerVisible=false term', () => {
        expect(isTermVisibleInMode(BEGINNER_DISPLAY_MODE_CONFIG, false, true)).toBe(false);
    });

    it('standard mode: shows all terms', () => {
        expect(isTermVisibleInMode(STANDARD_DISPLAY_MODE_CONFIG, false, false)).toBe(true);
        expect(isTermVisibleInMode(STANDARD_DISPLAY_MODE_CONFIG, true, false)).toBe(true);
    });

    it('researcher mode: shows researcherVisible=true term', () => {
        expect(isTermVisibleInMode(RESEARCHER_DISPLAY_MODE_CONFIG, false, true)).toBe(true);
    });

    it('researcher mode: hides researcherVisible=false term', () => {
        expect(isTermVisibleInMode(RESEARCHER_DISPLAY_MODE_CONFIG, false, false)).toBe(false);
    });

    it('developer mode: shows all terms', () => {
        expect(isTermVisibleInMode(DEVELOPER_DISPLAY_MODE_CONFIG, false, false)).toBe(true);
    });
});

// ── TermCard beginner/researcher visibility ────────────────────────────────────

describe('TermCard: beginner mode hides internalId', () => {
    it('vortexCandidateConfidence: beginner mode does NOT show internalId', () => {
        const term = getTermById('vortexCandidateConfidence')!;
        const html = renderObservationTermCardHTML({
            term,
            config: BEGINNER_DISPLAY_MODE_CONFIG,
        });
        expect(html).not.toContain('内部ID');
        expect(html).not.toContain('term-card__code');
    });

    it('vortexCandidateConfidence: developer mode shows internalId', () => {
        const term = getTermById('vortexCandidateConfidence')!;
        const html = renderObservationTermCardHTML({
            term,
            config: DEVELOPER_DISPLAY_MODE_CONFIG,
        });
        expect(html).toContain('内部ID');
        expect(html).toContain('vortexCandidateConfidence');
    });
});

describe('TermCard: beginner mode hides English labels', () => {
    it('beginner mode does NOT show English label', () => {
        const term = getTermById('causalTrace')!;
        const html = renderObservationTermCardHTML({
            term,
            config: BEGINNER_DISPLAY_MODE_CONFIG,
        });
        expect(html).not.toContain('Causal Trace');
    });

    it('researcher mode shows English label', () => {
        const term = getTermById('causalTrace')!;
        const html = renderObservationTermCardHTML({
            term,
            config: RESEARCHER_DISPLAY_MODE_CONFIG,
        });
        expect(html).toContain('Causal Trace');
    });
});

// ── GlossaryPanel beginner/researcher ────────────────────────────────────────

describe('GlossaryPanel: beginner mode fewer terms than researcher mode', () => {
    it('beginner shows fewer or equal terms than researcher', () => {
        // Count term-card occurrences
        const bHtml = renderObservationGlossaryPanelHTML({ config: BEGINNER_DISPLAY_MODE_CONFIG });
        const rHtml = renderObservationGlossaryPanelHTML({ config: RESEARCHER_DISPLAY_MODE_CONFIG });
        const bCount = (bHtml.match(/class="term-card"/g) ?? []).length;
        const rCount = (rHtml.match(/class="term-card"/g) ?? []).length;
        expect(bCount).toBeLessThanOrEqual(rCount);
    });
});
