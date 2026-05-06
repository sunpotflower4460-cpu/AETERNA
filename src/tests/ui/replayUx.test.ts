/**
 * replayUx.test.ts
 * v2.0: AETERNA-NATURAL Observation UX Final Polish — TimeReplayPanel UX tests
 */

import { describe, it, expect } from 'vitest';
import { renderTimeReplayPanelHTML } from '../../ui/replay/TimeReplayPanel.js';
import {
    createReplayBuffer,
    pushReplaySnapshot,
} from '../../replay/timeReplayBuffer.js';
import type { ReplayUIState } from '../../types/timeReplay.js';

function makeSnap(tick: number) {
    return {
        tick,
        timestamp: Date.now(),
        selectedCellObservation: null,
        activeLensId: null,
        focusedMetricId: null,
        globalSummary: { phaseCoherence: 0.5, vortexCandidateCount: 2 },
        eventIds: [],
    };
}

function makeBuffer(ticks: number[]) {
    let buf = createReplayBuffer(100);
    for (const t of ticks) buf = pushReplaySnapshot(buf, makeSnap(t));
    return buf;
}

const noop = () => {};

describe('TimeReplayPanel: replay mode badge', () => {
    it('shows replay mode badge when isReplayMode', () => {
        const buffer = makeBuffer([10, 20, 30]);
        const state: ReplayUIState = { mode: 'replay', replayTick: 20, liveTick: 50, snapshotAvailable: true };
        const html = renderTimeReplayPanelHTML({ replayState: state, buffer, onTickSelect: noop, onReturnToLive: noop });
        expect(html).toContain('time-replay-panel__mode-badge--replay');
        expect(html).toContain('Replay Mode');
    });

    it('shows Live badge when not in replay mode', () => {
        const buffer = makeBuffer([10, 20]);
        const state: ReplayUIState = { mode: 'live', replayTick: null, liveTick: 100, snapshotAvailable: false };
        const html = renderTimeReplayPanelHTML({ replayState: state, buffer, onTickSelect: noop, onReturnToLive: noop });
        expect(html).toContain('time-replay-panel__mode-badge--live');
        expect(html).toContain('>Live<');
    });
});

describe('TimeReplayPanel: Return to Live button', () => {
    it('Return to Live button is present in replay mode', () => {
        const buffer = makeBuffer([10, 20]);
        const state: ReplayUIState = { mode: 'replay', replayTick: 10, liveTick: 50, snapshotAvailable: true };
        const html = renderTimeReplayPanelHTML({ replayState: state, buffer, onTickSelect: noop, onReturnToLive: noop });
        expect(html).toContain('Return to Live');
    });

    it('Return to Live bar is rendered in live mode too', () => {
        const buffer = makeBuffer([10, 20]);
        const state: ReplayUIState = { mode: 'live', replayTick: null, liveTick: 100, snapshotAvailable: false };
        const html = renderTimeReplayPanelHTML({ replayState: state, buffer, onTickSelect: noop, onReturnToLive: noop });
        expect(html).toContain('Return to Live');
    });
});

describe('TimeReplayPanel: snapshot unavailable', () => {
    it('shows "snapshot" in unavailable message when replay mode has no snapshot', () => {
        // Use a tick that doesn't exist in the buffer
        const buffer = makeBuffer([10, 20]);
        const state: ReplayUIState = { mode: 'replay', replayTick: 99, liveTick: 100, snapshotAvailable: false };
        const html = renderTimeReplayPanelHTML({ replayState: state, buffer, onTickSelect: noop, onReturnToLive: noop });
        expect(html.toLowerCase()).toContain('snapshot');
    });
});

describe('TimeReplayPanel: Japanese caution note', () => {
    it('shows Japanese caution note about snapshot vs runtime in replay mode', () => {
        const buffer = makeBuffer([10, 20]);
        const state: ReplayUIState = { mode: 'replay', replayTick: 10, liveTick: 50, snapshotAvailable: true };
        const html = renderTimeReplayPanelHTML({ replayState: state, buffer, onTickSelect: noop, onReturnToLive: noop });
        expect(html).toContain('runtime');
        expect(html).toContain('snapshot');
    });
});

describe('TimeReplayPanel: guardrail disclaimer', () => {
    it('disclaimer about not implying runtime moved backward is present', () => {
        const buffer = makeBuffer([5, 10]);
        const state: ReplayUIState = { mode: 'replay', replayTick: 5, liveTick: 20, snapshotAvailable: true };
        const html = renderTimeReplayPanelHTML({ replayState: state, buffer, onTickSelect: noop, onReturnToLive: noop });
        // The disclaimer should be present somewhere in the document
        // Check for the replay caution text or the disclaimer text
        expect(html).toMatch(/does not imply the runtime itself has moved backward|runtime は過去に戻りません/);
    });
});

describe('TimeReplayPanel: no forbidden claims', () => {
    const forbiddenPhrases = [
        'consciousness proved',
        'life proved',
        'aeterna feels',
        'aeterna wants',
        'soul resonance',
        'mystical proof',
    ];

    it('rendered HTML contains no forbidden claims', () => {
        const buffer = makeBuffer([10, 20, 30]);
        const state: ReplayUIState = { mode: 'replay', replayTick: 20, liveTick: 50, snapshotAvailable: true };
        const html = renderTimeReplayPanelHTML({ replayState: state, buffer, onTickSelect: noop, onReturnToLive: noop }).toLowerCase();
        for (const phrase of forbiddenPhrases) {
            expect(html, `should not contain: "${phrase}"`).not.toContain(phrase);
        }
    });
});
