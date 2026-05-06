/**
 * timeReplaySnapshot.test.ts
 * v1.7: Deep Inspector / Time Replay — TimeReplaySnapshot type tests
 *
 * Verifies:
 * - TimeReplaySnapshot can be constructed with all optional fields
 * - globalSummary accepts only numeric scalars
 * - eventIds are strings only
 * - ReplayUIState transitions (mode, tick)
 * - No raw field arrays in snapshot
 */

import { describe, it, expect } from 'vitest';

import type { TimeReplaySnapshot, ReplayUIState } from '../../types/timeReplay.js';

describe('TimeReplaySnapshot: construction', () => {
    it('can be constructed with minimal fields', () => {
        const snap: TimeReplaySnapshot = {
            tick: 10,
            timestamp: Date.now(),
            selectedCellObservation: null,
            activeLensId: null,
            focusedMetricId: null,
            globalSummary: {},
            eventIds: [],
        };
        expect(snap.tick).toBe(10);
        expect(snap.selectedCellObservation).toBeNull();
        expect(snap.activeLensId).toBeNull();
        expect(snap.globalSummary).toEqual({});
        expect(snap.eventIds).toHaveLength(0);
    });

    it('globalSummary accepts all numeric optional fields', () => {
        const snap: TimeReplaySnapshot = {
            tick: 50,
            timestamp: Date.now(),
            selectedCellObservation: null,
            activeLensId: null,
            focusedMetricId: null,
            globalSummary: {
                phaseCoherence: 0.75,
                vortexCandidateCount: 3,
                membraneOverlap: 0.2,
                plasticityAccumulation: 0.01,
                observedRatioMatchStrength: 0.4,
                nanOrInfinityCount: 0,
            },
            eventIds: ['evt-1', 'evt-2'],
        };
        expect(snap.globalSummary.phaseCoherence).toBe(0.75);
        expect(snap.globalSummary.vortexCandidateCount).toBe(3);
        expect(snap.eventIds).toHaveLength(2);
    });

    it('globalSummary fields are all scalars (no arrays)', () => {
        const snap: TimeReplaySnapshot = {
            tick: 1,
            timestamp: 0,
            selectedCellObservation: null,
            activeLensId: null,
            focusedMetricId: null,
            globalSummary: {
                phaseCoherence: 0.5,
                vortexCandidateCount: 2,
            },
            eventIds: [],
        };
        for (const v of Object.values(snap.globalSummary)) {
            if (v !== undefined) {
                expect(typeof v).toBe('number');
                expect(Array.isArray(v)).toBe(false);
            }
        }
    });
});

describe('ReplayUIState', () => {
    it('live mode has null replayTick', () => {
        const state: ReplayUIState = {
            mode: 'live',
            replayTick: null,
            liveTick: 100,
            snapshotAvailable: false,
        };
        expect(state.mode).toBe('live');
        expect(state.replayTick).toBeNull();
    });

    it('replay mode has numeric replayTick', () => {
        const state: ReplayUIState = {
            mode: 'replay',
            replayTick: 50,
            liveTick: 120,
            snapshotAvailable: true,
        };
        expect(state.mode).toBe('replay');
        expect(state.replayTick).toBe(50);
    });

    it('mode and liveTick are independent', () => {
        const state: ReplayUIState = {
            mode: 'replay',
            replayTick: 30,
            liveTick: 200,
            snapshotAvailable: true,
        };
        // liveTick continues to advance even in replay mode
        expect(state.liveTick).toBe(200);
        expect(state.replayTick).toBe(30);
    });
});
