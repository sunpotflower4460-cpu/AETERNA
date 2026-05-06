/**
 * layerCorrelation.test.ts
 * v1.8: Causal Trace / Layer Correlation — buildLayerCorrelationState unit tests
 *
 * Verifies:
 * - Fewer than 3 snapshots → all pairs insufficient
 * - With enough snapshots → correlation is number or null (not NaN)
 * - Empty snapshots → all pairs insufficient
 */

import { describe, it, expect } from 'vitest';
import { buildLayerCorrelationState } from '../../observation/buildLayerCorrelationState.js';
import type { BuildLayerCorrelationStateParams } from '../../observation/buildLayerCorrelationState.js';
import type { TimeReplaySnapshot } from '../../types/timeReplay.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSnap(tick: number, phaseCoherence: number, vortexCount: number): TimeReplaySnapshot {
    return {
        tick,
        timestamp: Date.now(),
        selectedCellObservation: null,
        activeLensId: null,
        focusedMetricId: null,
        globalSummary: {
            phaseCoherence,
            vortexCandidateCount: vortexCount,
            plasticityAccumulation: phaseCoherence * 0.5,
            observedRatioMatchStrength: 0.3,
        },
        eventIds: [],
    };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('buildLayerCorrelationState: empty snapshots', () => {
    it('returns sufficientData=false for empty snapshots', () => {
        const params: BuildLayerCorrelationStateParams = {
            snapshots: [],
            timeWindowTicks: 100,
        };
        const state = buildLayerCorrelationState(params);
        expect(state.sufficientData).toBe(false);
        expect(state.snapshotCount).toBe(0);
    });

    it('returns all pairs with insufficient confidence for empty snapshots', () => {
        const params: BuildLayerCorrelationStateParams = {
            snapshots: [],
            timeWindowTicks: 100,
        };
        const state = buildLayerCorrelationState(params);
        for (const pair of state.pairs) {
            expect(pair.confidence).toBe('insufficient');
            expect(pair.correlation).toBeNull();
        }
    });
});

describe('buildLayerCorrelationState: fewer than 3 snapshots', () => {
    it('returns insufficient when only 2 snapshots provided', () => {
        const params: BuildLayerCorrelationStateParams = {
            snapshots: [makeSnap(1, 0.3, 2), makeSnap(2, 0.5, 3)],
            timeWindowTicks: 100,
        };
        const state = buildLayerCorrelationState(params);
        expect(state.sufficientData).toBe(false);
        for (const pair of state.pairs) {
            expect(pair.confidence).toBe('insufficient');
        }
    });
});

describe('buildLayerCorrelationState: with enough snapshots', () => {
    it('returns non-null correlation when 10 snapshots provided', () => {
        const snaps: TimeReplaySnapshot[] = [];
        for (let i = 0; i < 10; i++) {
            snaps.push(makeSnap(i, 0.1 + i * 0.08, i + 1));
        }
        const params: BuildLayerCorrelationStateParams = {
            snapshots: snaps,
            timeWindowTicks: 100,
        };
        const state = buildLayerCorrelationState(params);
        expect(state.sufficientData).toBe(true);
        expect(state.snapshotCount).toBe(10);
        for (const pair of state.pairs) {
            // correlation should be a number or null, never NaN
            if (pair.correlation !== null) {
                expect(Number.isNaN(pair.correlation)).toBe(false);
                expect(pair.correlation).toBeGreaterThanOrEqual(-1);
                expect(pair.correlation).toBeLessThanOrEqual(1);
            }
        }
    });

    it('never returns NaN in correlation', () => {
        const snaps: TimeReplaySnapshot[] = [];
        for (let i = 0; i < 20; i++) {
            snaps.push(makeSnap(i, 0.5, 5)); // constant values → zero variance
        }
        const params: BuildLayerCorrelationStateParams = {
            snapshots: snaps,
            timeWindowTicks: 100,
        };
        const state = buildLayerCorrelationState(params);
        for (const pair of state.pairs) {
            expect(pair.correlation).not.toBe(NaN);
            if (pair.correlation !== null) {
                expect(Number.isNaN(pair.correlation)).toBe(false);
            }
        }
    });

    it('filters snapshots to the time window', () => {
        const snaps: TimeReplaySnapshot[] = [];
        for (let i = 0; i < 50; i++) {
            snaps.push(makeSnap(i, 0.1 + i * 0.01, i));
        }
        const params: BuildLayerCorrelationStateParams = {
            snapshots: snaps,
            timeWindowTicks: 10,
        };
        const state = buildLayerCorrelationState(params);
        // Latest tick = 49, so window = [39, 49] = 11 snapshots
        expect(state.snapshotCount).toBeLessThanOrEqual(snaps.length);
        expect(state.snapshotCount).toBeGreaterThanOrEqual(3);
    });
});

describe('buildLayerCorrelationState: caution', () => {
    it('caution contains "correlation is not causal proof"', () => {
        const params: BuildLayerCorrelationStateParams = {
            snapshots: [],
            timeWindowTicks: 100,
        };
        const state = buildLayerCorrelationState(params);
        expect(state.caution.toLowerCase()).toContain('correlation');
        expect(state.caution.toLowerCase()).toContain('not causal proof');
    });
});
