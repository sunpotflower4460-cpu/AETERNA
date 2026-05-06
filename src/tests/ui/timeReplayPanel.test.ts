/**
 * timeReplayPanel.test.ts
 * v1.7: Deep Inspector / Time Replay — TimeReplayPanel tests
 *
 * Verifies:
 * - TimeReplayPanel renders "Replay Mode" badge when in replay mode
 * - Live mode does NOT show "Replay Mode" badge
 * - Return to Live button is present
 * - Empty buffer shows "no snapshots" message
 * - Replay Mode disclaimer text is present
 * - No forbidden consciousness/life proof claims in rendered HTML
 * - Runtime is NOT rewound by replay mode (guardrail text present)
 */

import { describe, it, expect } from 'vitest';
import { renderTimeReplayPanelHTML } from '../../ui/replay/TimeReplayPanel.js';
import {
    createReplayBuffer,
    pushReplaySnapshot,
} from '../../replay/timeReplayBuffer.js';
import type { TimeReplaySnapshot, ReplayUIState } from '../../types/timeReplay.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSnap(tick: number): TimeReplaySnapshot {
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
    for (const t of ticks) {
        buf = pushReplaySnapshot(buf, makeSnap(t));
    }
    return buf;
}

const noop = () => {};

// ── Empty buffer ──────────────────────────────────────────────────────────────

describe('TimeReplayPanel: empty buffer', () => {
    it('shows no-data message for empty buffer', () => {
        const state: ReplayUIState = {
            mode: 'live',
            replayTick: null,
            liveTick: 0,
            snapshotAvailable: false,
        };
        const html = renderTimeReplayPanelHTML({
            replayState: state,
            buffer: createReplayBuffer(),
            onTickSelect: noop,
            onReturnToLive: noop,
        });
        expect(html).toContain('No snapshots recorded yet');
    });

    it('empty buffer panel contains replay disclaimer', () => {
        const state: ReplayUIState = {
            mode: 'live',
            replayTick: null,
            liveTick: 0,
            snapshotAvailable: false,
        };
        const html = renderTimeReplayPanelHTML({
            replayState: state,
            buffer: createReplayBuffer(),
            onTickSelect: noop,
            onReturnToLive: noop,
        });
        expect(html).toContain('does not imply the runtime itself has moved backward');
    });
});

// ── Replay mode badge ─────────────────────────────────────────────────────────

describe('TimeReplayPanel: Replay Mode badge', () => {
    it('shows "Replay Mode" badge when in replay mode', () => {
        const buffer = makeBuffer([10, 20, 30]);
        const state: ReplayUIState = {
            mode: 'replay',
            replayTick: 20,
            liveTick: 50,
            snapshotAvailable: true,
        };
        const html = renderTimeReplayPanelHTML({
            replayState: state,
            buffer,
            onTickSelect: noop,
            onReturnToLive: noop,
        });
        expect(html).toContain('Replay Mode');
    });

    it('shows "Live" badge in live mode (not Replay Mode)', () => {
        const buffer = makeBuffer([10, 20]);
        const state: ReplayUIState = {
            mode: 'live',
            replayTick: null,
            liveTick: 100,
            snapshotAvailable: false,
        };
        const html = renderTimeReplayPanelHTML({
            replayState: state,
            buffer,
            onTickSelect: noop,
            onReturnToLive: noop,
        });
        // Should show Live badge
        expect(html).toMatch(/Live/);
        // Should NOT show replay-badge--replay class in header for live mode
        expect(html).not.toContain('time-replay-panel__mode-badge--replay');
    });
});

// ── Return to Live ────────────────────────────────────────────────────────────

describe('TimeReplayPanel: Return to Live button', () => {
    it('contains Return to Live button', () => {
        const buffer = makeBuffer([10, 20]);
        const state: ReplayUIState = {
            mode: 'replay',
            replayTick: 10,
            liveTick: 50,
            snapshotAvailable: true,
        };
        const html = renderTimeReplayPanelHTML({
            replayState: state,
            buffer,
            onTickSelect: noop,
            onReturnToLive: noop,
        });
        expect(html).toContain('Return to Live');
    });
});

// ── Disclaimer text ───────────────────────────────────────────────────────────

describe('TimeReplayPanel: guardrail disclaimer', () => {
    it('contains replay mode disclaimer about not rewinding runtime', () => {
        const buffer = makeBuffer([5, 10]);
        const state: ReplayUIState = {
            mode: 'replay',
            replayTick: 5,
            liveTick: 20,
            snapshotAvailable: true,
        };
        const html = renderTimeReplayPanelHTML({
            replayState: state,
            buffer,
            onTickSelect: noop,
            onReturnToLive: noop,
        });
        expect(html.toLowerCase()).toContain('does not imply the runtime itself has moved backward');
    });
});

// ── No forbidden claims ───────────────────────────────────────────────────────

describe('TimeReplayPanel: no forbidden claims', () => {
    const forbiddenPhrases = [
        'proves consciousness',
        'is conscious',
        'aeterna remembers',
        'aeterna feels',
        'life proof',
        'intelligence emerged',
        'soul resonance',
        'memory formed',
    ];

    it('rendered HTML contains no forbidden consciousness/life claims', () => {
        const buffer = makeBuffer([10, 20, 30]);
        const state: ReplayUIState = {
            mode: 'replay',
            replayTick: 20,
            liveTick: 50,
            snapshotAvailable: true,
        };
        const html = renderTimeReplayPanelHTML({
            replayState: state,
            buffer,
            onTickSelect: noop,
            onReturnToLive: noop,
        }).toLowerCase();
        for (const phrase of forbiddenPhrases) {
            expect(html, `Panel should not contain: "${phrase}"`).not.toContain(phrase);
        }
    });
});
