/**
 * observationDifference.test.ts
 * v1.8: Causal Trace / Layer Correlation — buildObservationDifference unit tests
 *
 * Verifies:
 * - buildObservationDifference produces before/after/delta
 * - delta = afterValue - beforeValue
 * - relativeDelta computed correctly
 * - largestChanges sorted by |delta|
 */

import { describe, it, expect } from 'vitest';
import { buildObservationDifference } from '../../observation/buildObservationDifference.js';
import type { BuildObservationDifferenceParams } from '../../observation/buildObservationDifference.js';
import type { TimeReplaySnapshot } from '../../types/timeReplay.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSnap(
    tick: number,
    phaseCoherence: number,
    vortexCount: number,
): TimeReplaySnapshot {
    return {
        tick,
        timestamp: Date.now(),
        selectedCellObservation: null,
        activeLensId: null,
        focusedMetricId: null,
        globalSummary: {
            phaseCoherence,
            vortexCandidateCount: vortexCount,
            plasticityAccumulation: 0.2,
            observedRatioMatchStrength: 0.4,
            membraneOverlap: 0.3,
        },
        eventIds: [],
    };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('buildObservationDifference: basic', () => {
    it('produces an ObservationDifferenceState', () => {
        const params: BuildObservationDifferenceParams = {
            beforeSnapshot: makeSnap(10, 0.3, 2),
            afterSnapshot: makeSnap(20, 0.7, 5),
            beforeCell: null,
            afterCell: null,
            activeLensId: null,
        };
        const state = buildObservationDifference(params);
        expect(state).toBeDefined();
        expect(state.beforeTick).toBe(10);
        expect(state.afterTick).toBe(20);
        expect(state.items).toBeInstanceOf(Array);
        expect(state.items.length).toBeGreaterThan(0);
    });

    it('computes correct delta for phaseCoherence', () => {
        const params: BuildObservationDifferenceParams = {
            beforeSnapshot: makeSnap(10, 0.3, 2),
            afterSnapshot: makeSnap(20, 0.7, 2),
            beforeCell: null,
            afterCell: null,
            activeLensId: null,
        };
        const state = buildObservationDifference(params);
        const item = state.items.find((it) => it.metricId === 'globalSummary.phaseCoherence');
        expect(item).toBeDefined();
        expect(item!.valueBefore).toBeCloseTo(0.3, 5);
        expect(item!.valueAfter).toBeCloseTo(0.7, 5);
        expect(item!.delta).toBeCloseTo(0.4, 5);
    });

    it('delta equals afterValue minus beforeValue', () => {
        const params: BuildObservationDifferenceParams = {
            beforeSnapshot: makeSnap(10, 0.2, 3),
            afterSnapshot: makeSnap(20, 0.8, 3),
            beforeCell: null,
            afterCell: null,
            activeLensId: null,
        };
        const state = buildObservationDifference(params);
        for (const item of state.items) {
            if (item.valueBefore !== null && item.valueAfter !== null && item.delta !== null) {
                expect(item.delta).toBeCloseTo(item.valueAfter - item.valueBefore, 10);
            }
        }
    });
});

describe('buildObservationDifference: relativeDelta', () => {
    it('relativeDelta = delta / |beforeValue|', () => {
        const params: BuildObservationDifferenceParams = {
            beforeSnapshot: makeSnap(10, 0.4, 2),
            afterSnapshot: makeSnap(20, 0.6, 2),
            beforeCell: null,
            afterCell: null,
            activeLensId: null,
        };
        const state = buildObservationDifference(params);
        const item = state.items.find((it) => it.metricId === 'globalSummary.phaseCoherence');
        expect(item).toBeDefined();
        expect(item!.relativeDelta).not.toBeNull();
        expect(item!.relativeDelta!).toBeCloseTo(0.2 / 0.4, 5);
    });

    it('relativeDelta is null when beforeValue is 0', () => {
        const params: BuildObservationDifferenceParams = {
            beforeSnapshot: makeSnap(10, 0, 2),
            afterSnapshot: makeSnap(20, 0.5, 2),
            beforeCell: null,
            afterCell: null,
            activeLensId: null,
        };
        const state = buildObservationDifference(params);
        const item = state.items.find((it) => it.metricId === 'globalSummary.phaseCoherence');
        expect(item).toBeDefined();
        expect(item!.relativeDelta).toBeNull();
    });
});

describe('buildObservationDifference: largestChanges', () => {
    it('largestChanges contains at most 5 items', () => {
        const params: BuildObservationDifferenceParams = {
            beforeSnapshot: makeSnap(10, 0.1, 1),
            afterSnapshot: makeSnap(20, 0.9, 9),
            beforeCell: null,
            afterCell: null,
            activeLensId: null,
        };
        const state = buildObservationDifference(params);
        expect(state.largestChanges.length).toBeLessThanOrEqual(5);
    });

    it('largestChanges is sorted by |delta| descending', () => {
        const params: BuildObservationDifferenceParams = {
            beforeSnapshot: makeSnap(10, 0.1, 1),
            afterSnapshot: makeSnap(20, 0.9, 9),
            beforeCell: null,
            afterCell: null,
            activeLensId: null,
        };
        const state = buildObservationDifference(params);
        const deltas = state.largestChanges
            .filter((it) => it.delta !== null)
            .map((it) => Math.abs(it.delta!));
        for (let i = 1; i < deltas.length; i++) {
            expect(deltas[i]).toBeLessThanOrEqual(deltas[i - 1]);
        }
    });
});

describe('buildObservationDifference: null handling', () => {
    it('handles null snapshots gracefully', () => {
        const params: BuildObservationDifferenceParams = {
            beforeSnapshot: null,
            afterSnapshot: null,
            beforeCell: null,
            afterCell: null,
            activeLensId: null,
        };
        const state = buildObservationDifference(params);
        expect(state).toBeDefined();
        expect(state.items).toBeInstanceOf(Array);
        expect(state.globalSummaryAvailable).toBe(false);
    });
});
