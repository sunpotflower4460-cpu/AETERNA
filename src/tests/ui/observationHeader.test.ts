/**
 * observationHeader.test.ts
 * v2.0: AETERNA-NATURAL Observation UX Final Polish — ObservationHeader tests
 */

import { describe, it, expect } from 'vitest';
import { renderObservationHeaderHTML } from '../../ui/observation/ObservationHeader.js';

describe('ObservationHeader: live mode', () => {
    it('shows ライブ badge', () => {
        const html = renderObservationHeaderHTML({
            liveTick: 50,
            replayTick: null,
            isReplayMode: false,
            selectedCellIndex: null,
            activeLensId: null,
        });
        expect(html).toContain('observation-header__mode-badge--live');
        expect(html).toContain('>ライブ<');
    });

    it('does NOT show 再生 badge in live mode', () => {
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
    it('shows 再生 badge', () => {
        const html = renderObservationHeaderHTML({
            liveTick: 100,
            replayTick: 42,
            isReplayMode: true,
            selectedCellIndex: null,
            activeLensId: null,
        });
        expect(html).toContain('observation-header__mode-badge--replay');
        expect(html).toContain('>再生<');
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
    it('shows セル index when selected', () => {
        const html = renderObservationHeaderHTML({
            liveTick: 0,
            replayTick: null,
            isReplayMode: false,
            selectedCellIndex: 7,
            activeLensId: null,
        });
        expect(html).toContain('セル 7');
    });

    it('shows （未選択） when no cell is selected', () => {
        const html = renderObservationHeaderHTML({
            liveTick: 0,
            replayTick: null,
            isReplayMode: false,
            selectedCellIndex: null,
            activeLensId: null,
        });
        expect(html).toContain('（未選択）');
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
    it('shows 実験的安全モード badge for experimental safety mode', () => {
        const html = renderObservationHeaderHTML({
            liveTick: 0,
            replayTick: null,
            isReplayMode: false,
            selectedCellIndex: null,
            activeLensId: null,
            safetyMode: 'experimental',
        });
        expect(html).toContain('実験的安全モード');
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
