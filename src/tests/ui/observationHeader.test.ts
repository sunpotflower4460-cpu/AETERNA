/**
 * observationHeader.test.ts
 * v2.0: AETERNA-NATURAL Observation UX Final Polish — ObservationHeader tests
 */

import { describe, it, expect } from 'vitest';
import { renderObservationHeaderHTML } from '../../ui/observation/ObservationHeader.js';

describe('ObservationHeader: live mode', () => {
    it('shows Live badge', () => {
        const html = renderObservationHeaderHTML({
            liveTick: 50,
            replayTick: null,
            isReplayMode: false,
            selectedCellIndex: null,
            activeLensId: null,
        });
        expect(html).toContain('observation-header__mode-badge--live');
        expect(html).toContain('>Live<');
    });

    it('does NOT show Replay badge in live mode', () => {
        const html = renderObservationHeaderHTML({
            liveTick: 50,
            replayTick: null,
            isReplayMode: false,
            selectedCellIndex: null,
            activeLensId: null,
        });
        expect(html).not.toContain('observation-header__mode-badge--replay');
    });
});

describe('ObservationHeader: replay mode', () => {
    it('shows Replay badge', () => {
        const html = renderObservationHeaderHTML({
            liveTick: 100,
            replayTick: 42,
            isReplayMode: true,
            selectedCellIndex: null,
            activeLensId: null,
        });
        expect(html).toContain('observation-header__mode-badge--replay');
        expect(html).toContain('>Replay<');
    });

    it('shows replay tick value', () => {
        const html = renderObservationHeaderHTML({
            liveTick: 100,
            replayTick: 42,
            isReplayMode: true,
            selectedCellIndex: null,
            activeLensId: null,
        });
        expect(html).toContain('42');
    });

    it('shows Japanese note about snapshot vs runtime', () => {
        const html = renderObservationHeaderHTML({
            liveTick: 100,
            replayTick: 42,
            isReplayMode: true,
            selectedCellIndex: null,
            activeLensId: null,
        });
        expect(html).toContain('過去に戻った');
    });
});

describe('ObservationHeader: cell display', () => {
    it('shows cell index when selected', () => {
        const html = renderObservationHeaderHTML({
            liveTick: 0,
            replayTick: null,
            isReplayMode: false,
            selectedCellIndex: 7,
            activeLensId: null,
        });
        expect(html).toContain('Cell 7');
    });

    it('shows (no cell) when no cell is selected', () => {
        const html = renderObservationHeaderHTML({
            liveTick: 0,
            replayTick: null,
            isReplayMode: false,
            selectedCellIndex: null,
            activeLensId: null,
        });
        expect(html).toContain('(no cell)');
    });
});

describe('ObservationHeader: lens display', () => {
    it('shows active lens ID', () => {
        const html = renderObservationHeaderHTML({
            liveTick: 0,
            replayTick: null,
            isReplayMode: false,
            selectedCellIndex: null,
            activeLensId: 'gaussianCurvature',
        });
        expect(html).toContain('gaussianCurvature');
    });
});

describe('ObservationHeader: safety mode', () => {
    it('shows Experimental Safety badge for experimental safety mode', () => {
        const html = renderObservationHeaderHTML({
            liveTick: 0,
            replayTick: null,
            isReplayMode: false,
            selectedCellIndex: null,
            activeLensId: null,
            safetyMode: 'experimental',
        });
        expect(html).toContain('Experimental Safety');
    });
});

describe('ObservationHeader: title', () => {
    it('contains AETERNA-NATURAL title', () => {
        const html = renderObservationHeaderHTML({
            liveTick: 0,
            replayTick: null,
            isReplayMode: false,
            selectedCellIndex: null,
            activeLensId: null,
        });
        expect(html).toContain('AETERNA-NATURAL');
    });
});

describe('ObservationHeader: no forbidden claims', () => {
    const forbiddenPhrases = [
        'consciousness proved',
        'life proved',
        'aeterna feels',
        'aeterna wants',
        'soul',
    ];

    it('contains no forbidden claims', () => {
        const html = renderObservationHeaderHTML({
            liveTick: 100,
            replayTick: 42,
            isReplayMode: true,
            selectedCellIndex: 3,
            activeLensId: 'fieldAmplitude',
            safetyMode: 'experimental',
            researchMode: 'experimental',
        }).toLowerCase();
        for (const phrase of forbiddenPhrases) {
            expect(html, `should not contain: "${phrase}"`).not.toContain(phrase);
        }
    });
});
