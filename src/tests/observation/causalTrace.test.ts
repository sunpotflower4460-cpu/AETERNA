/**
 * causalTrace.test.ts
 * v1.8: Causal Trace / Layer Correlation — buildCausalTrace unit tests
 *
 * Verifies:
 * - buildCausalTrace produces CausalTraceResult
 * - No snapshots → confidence is 'insufficient'
 * - Snapshots with cell change → produces same_cell signal
 * - caution text present and doesn't claim causal proof
 * - No fake signals when data is missing
 */

import { describe, it, expect } from 'vitest';
import { buildCausalTrace } from '../../observation/buildCausalTrace.js';
import type { BuildCausalTraceParams } from '../../observation/buildCausalTrace.js';
import type { TimeReplaySnapshot } from '../../types/timeReplay.js';
import type { CellObservation } from '../../types/cellObservation.js';
import type { LensContextPacket } from '../../ui/lens/lensContextPacket.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSnap(tick: number, phaseCoherence = 0.5): TimeReplaySnapshot {
    return {
        tick,
        timestamp: Date.now(),
        selectedCellObservation: null,
        activeLensId: null,
        focusedMetricId: null,
        globalSummary: { phaseCoherence, vortexCandidateCount: 2 },
        eventIds: [],
    };
}

function makeCellObs(cellIndex = 0): CellObservation {
    return {
        timestamp: Date.now(),
        tick: 10,
        cellIndex,
        segments: 4,
        geometry: {},
        field: {},
        vortex: {},
        membrane: {},
        plasticity: {},
        ratios: { involvedObservedRatioIds: [] },
        events: { recentEventIds: [], recentEventCount: 0 },
        diagnostics: {
            valueKinds: {
                geometry: 'unavailable',
                field: 'unavailable',
                vortex: 'unavailable',
                membrane: 'unavailable',
                plasticity: 'unavailable',
                ratios: 'unavailable',
                events: 'unavailable',
            },
            missingFieldCount: 0,
            hasUnavailableSource: false,
        },
    };
}

function makeLensContext(): LensContextPacket {
    return {
        timestamp: Date.now(),
        tick: 10,
        cellObservation: makeCellObs(),
        activeLens: null,
        contextSummary: 'cell index=0 — full cell overview',
        epistemicNote: 'observational data only',
    };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('buildCausalTrace: no snapshot → insufficient', () => {
    it('returns insufficient confidence when no snapshots provided', () => {
        const params: BuildCausalTraceParams = {
            lensContext: makeLensContext(),
            currentSnapshot: null,
            previousSnapshot: null,
            recentEvents: [],
            cellObservation: null,
        };
        const result = buildCausalTrace(params);
        expect(result.confidence).toBe('insufficient');
        expect(result.possibleContributingSignals).toHaveLength(0);
    });

    it('returns a CausalTraceResult even with no data', () => {
        const params: BuildCausalTraceParams = {
            lensContext: makeLensContext(),
            currentSnapshot: null,
            previousSnapshot: null,
            recentEvents: [],
            cellObservation: null,
        };
        const result = buildCausalTrace(params);
        expect(result).toBeDefined();
        expect(result.id).toBeTruthy();
        expect(result.summary).toBeInstanceOf(Array);
        expect(result.cautions).toBeInstanceOf(Array);
    });
});

describe('buildCausalTrace: same_cell delta signal', () => {
    it('produces same_cell signal when globalSummary metric changed', () => {
        const prev = makeSnap(9, 0.3);
        const curr = makeSnap(10, 0.7);
        const params: BuildCausalTraceParams = {
            lensContext: makeLensContext(),
            currentSnapshot: curr,
            previousSnapshot: prev,
            recentEvents: [],
            cellObservation: makeCellObs(),
        };
        const result = buildCausalTrace(params);
        const sameCellSignals = result.possibleContributingSignals.filter(
            (s) => s.relationKind === 'same_cell',
        );
        expect(sameCellSignals.length).toBeGreaterThan(0);
        const phaseSignal = sameCellSignals.find((s) => s.metricId === 'globalSummary.phaseCoherence');
        expect(phaseSignal).toBeDefined();
        expect(phaseSignal!.delta).toBeCloseTo(0.4, 4);
    });

    it('does not produce same_cell signal when metrics unchanged', () => {
        const prev = makeSnap(9, 0.5);
        const curr = makeSnap(10, 0.5);
        const params: BuildCausalTraceParams = {
            lensContext: makeLensContext(),
            currentSnapshot: curr,
            previousSnapshot: prev,
            recentEvents: [],
            cellObservation: makeCellObs(),
        };
        const result = buildCausalTrace(params);
        const sameCellSignals = result.possibleContributingSignals.filter(
            (s) => s.relationKind === 'same_cell' && s.metricId === 'globalSummary.phaseCoherence',
        );
        expect(sameCellSignals).toHaveLength(0);
    });
});

describe('buildCausalTrace: temporal_nearby signal', () => {
    it('produces temporal_nearby signal when events are near current tick', () => {
        const curr = makeSnap(100);
        const params: BuildCausalTraceParams = {
            lensContext: makeLensContext(),
            currentSnapshot: curr,
            previousSnapshot: null,
            recentEvents: [
                { id: 'ev1', tick: 95 },
                { id: 'ev2', tick: 105 },
            ],
            cellObservation: makeCellObs(),
        };
        const result = buildCausalTrace(params);
        const nearbySignals = result.possibleContributingSignals.filter(
            (s) => s.relationKind === 'temporal_nearby',
        );
        expect(nearbySignals.length).toBeGreaterThan(0);
        expect(nearbySignals[0].relatedEventIds).toContain('ev1');
    });

    it('does not produce temporal_nearby signal when events are far away', () => {
        const curr = makeSnap(100);
        const params: BuildCausalTraceParams = {
            lensContext: makeLensContext(),
            currentSnapshot: curr,
            previousSnapshot: null,
            recentEvents: [{ id: 'ev1', tick: 50 }],
            cellObservation: makeCellObs(),
        };
        const result = buildCausalTrace(params);
        const nearbySignals = result.possibleContributingSignals.filter(
            (s) => s.relationKind === 'temporal_nearby',
        );
        expect(nearbySignals).toHaveLength(0);
    });
});

describe('buildCausalTrace: caution text', () => {
    it('caution text says "possible contributing signal, not causal proof"', () => {
        const prev = makeSnap(9, 0.3);
        const curr = makeSnap(10, 0.7);
        const params: BuildCausalTraceParams = {
            lensContext: makeLensContext(),
            currentSnapshot: curr,
            previousSnapshot: prev,
            recentEvents: [],
            cellObservation: makeCellObs(),
        };
        const result = buildCausalTrace(params);
        const allCautions = [
            ...result.cautions,
            ...result.possibleContributingSignals.map((s) => s.caution),
        ].join(' ').toLowerCase();
        expect(allCautions).toContain('possible contributing signal');
        expect(allCautions).toContain('not causal proof');
    });

    it('result cautions do not claim consciousness, life, or intelligence', () => {
        const params: BuildCausalTraceParams = {
            lensContext: makeLensContext(),
            currentSnapshot: makeSnap(10),
            previousSnapshot: null,
            recentEvents: [],
            cellObservation: makeCellObs(),
        };
        const result = buildCausalTrace(params);
        const allText = [
            ...result.cautions,
            ...result.summary,
            ...result.possibleContributingSignals.map((s) => s.caution + ' ' + s.label),
        ].join(' ').toLowerCase();
        expect(allText).not.toContain('proves consciousness');
        expect(allText).not.toContain('is conscious');
        expect(allText).not.toContain('life proof');
        expect(allText).not.toContain('soul');
    });
});

describe('buildCausalTrace: no fake signals', () => {
    it('produces no signals when only currentSnapshot present (no prev, no events, no cell data)', () => {
        const params: BuildCausalTraceParams = {
            lensContext: makeLensContext(),
            currentSnapshot: makeSnap(10, 0.5),
            previousSnapshot: null,
            recentEvents: [],
            cellObservation: makeCellObs(),
        };
        const result = buildCausalTrace(params);
        // No same_cell signals (no prev snapshot)
        const sameCellSignals = result.possibleContributingSignals.filter(
            (s) => s.relationKind === 'same_cell',
        );
        expect(sameCellSignals).toHaveLength(0);
        // No temporal_nearby signals (no events)
        const nearbySignals = result.possibleContributingSignals.filter(
            (s) => s.relationKind === 'temporal_nearby',
        );
        expect(nearbySignals).toHaveLength(0);
    });
});
