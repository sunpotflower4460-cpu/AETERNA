/**
 * observationWorkspace.test.ts
 * v2.0: AETERNA-NATURAL Observation UX Final Polish — ObservationWorkspace tests
 */

import { describe, it, expect } from 'vitest';
import { renderObservationWorkspaceHTML } from '../../ui/observation/ObservationWorkspace.js';
import { createReplayBuffer } from '../../replay/timeReplayBuffer.js';
import type { ReplayUIState } from '../../types/timeReplay.js';

const buffer = createReplayBuffer(100);
const replayState: ReplayUIState = {
    mode: 'live',
    replayTick: null,
    liveTick: 0,
    snapshotAvailable: false,
};

const minProps = {
    observation: null,
    activeLensId: null,
    selectedMetricId: null,
    selectedCellIndex: null,
    isReplayMode: false,
    replayState,
    buffer,
    causalTraceResult: null,
    correlationState: null,
    differenceState: null,
    ratioInvolvements: [],
    guideResponse: null,
    guideMode: 'explain' as const,
    isPublicMode: false,
    warnings: [],
    nanDetected: false,
};

describe('ObservationWorkspace: null observation (empty state)', () => {
    it('renders observation-workspace container', () => {
        const html = renderObservationWorkspaceHTML(minProps);
        expect(html).toContain('observation-workspace');
    });
});

describe('ObservationWorkspace: replay mode indicator', () => {
    it('shows replay mode indicator when isReplayMode=true', () => {
        const replayProps = {
            ...minProps,
            isReplayMode: true,
            replayState: {
                mode: 'replay' as const,
                replayTick: 42,
                liveTick: 100,
                snapshotAvailable: false,
            },
        };
        const html = renderObservationWorkspaceHTML(replayProps);
        expect(html).toContain('Replay');
    });
});

describe('ObservationWorkspace: mobile tabs', () => {
    it('renders observation-mobile-tabs', () => {
        const html = renderObservationWorkspaceHTML(minProps);
        expect(html).toContain('observation-mobile-tabs');
    });
});

describe('ObservationWorkspace: inspector drawer', () => {
    it('renders inspector-drawer', () => {
        const html = renderObservationWorkspaceHTML(minProps);
        expect(html).toContain('inspector-drawer');
    });
});

describe('ObservationWorkspace: guide panel section', () => {
    it('renders lens-aware-guide-panel', () => {
        const html = renderObservationWorkspaceHTML(minProps);
        expect(html).toContain('lens-aware-guide-panel');
    });
});

describe('ObservationWorkspace: nav hint', () => {
    it('contains navigation hint text referencing cell navigation', () => {
        const html = renderObservationWorkspaceHTML(minProps);
        expect(html.toLowerCase()).toContain('cell');
    });
});

describe('ObservationWorkspace: AI guide note', () => {
    it('contains AETERNA 本体 note in guide area', () => {
        const html = renderObservationWorkspaceHTML(minProps);
        expect(html).toContain('AETERNA 本体');
    });
});
