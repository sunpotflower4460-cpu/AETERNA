/**
 * weakPlasticity.test.ts
 * N5: Weak Plasticity Channel — unit tests
 */

import { describe, it, expect } from 'vitest';
import {
    createWeakPlasticityState,
    updateWeakPlasticityState,
    getResistanceScale,
} from '../../plasticity/weakPlasticity.js';
import {
    defaultWeakPlasticityConfig,
    type WeakPlasticityConfig,
} from '../../config/weakPlasticityConfig.js';
import type { VortexObservationState, VortexCandidate } from '../../types/vortexCandidate.js';
import type { RepeatedFlowPathObservationState, RepeatedFlowPathCandidate } from '../../types/repeatedFlowPath.js';
import type { LocalExcitabilityFieldState, LocalExcitabilityCell } from '../../types/localExcitabilityField.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeConfig(overrides: Partial<WeakPlasticityConfig> = {}): WeakPlasticityConfig {
    return { ...defaultWeakPlasticityConfig, ...overrides };
}

function makeInitialState(segments = 4) {
    return createWeakPlasticityState({ segments, timestamp: 1000, tick: 0 });
}

function makeVortexCandidate(i: number, j: number, confidence: number): VortexCandidate {
    return {
        id: `v-${i}-${j}`,
        timestamp: 1000,
        regionId: `u${i}-v${j}`,
        i, j,
        amplitudeMinimum: 0.1,
        phaseWinding: 1,
        topologicalCharge: 1,
        confidence,
    };
}

function makeVortexObs(candidates: VortexCandidate[]): VortexObservationState {
    return {
        timestamp: 1000,
        candidateCount: candidates.length,
        positiveChargeCount: 1,
        negativeChargeCount: 0,
        totalTopologicalCharge: 1,
        averageConfidence: 0.8,
        maxConfidence: 0.9,
        averagePhaseGradient: 0.1,
        averageVorticity: 0.1,
        phaseUnwrapWarningCount: 0,
        candidates,
        observationConfidence: 0.8,
        vorticity: new Float32Array(16),
        topologicalCharge: new Int8Array(16),
        vortexCandidateMask: new Uint8Array(16),
    };
}

function makeFlowPath(fromI: number, fromJ: number, toI: number, toJ: number): RepeatedFlowPathCandidate {
    return {
        id: `u${fromI}-v${fromJ}->u${toI}-v${toJ}`,
        timestamp: 1000,
        fromRegionId: `u${fromI}-v${fromJ}`,
        toRegionId: `u${toI}-v${toJ}`,
        flowCount: 10,
        recurrenceStrength: 0.8,
        propagationConsistency: 0.7,
        delayConsistency: 0.7,
        traceSupport: 0.6,
        resistanceShift: 0.1,
        dissipationShift: 0.1,
        replayAffinity: 0.5,
        closureCoupling: 0.3,
        confidence: 0.8,
    };
}

function makeRfpObs(candidates: RepeatedFlowPathCandidate[]): RepeatedFlowPathObservationState {
    return {
        timestamp: 1000,
        pathCandidateCount: candidates.length,
        stablePathCandidateCount: candidates.length,
        averageConfidence: 0.8,
        maxConfidence: 0.9,
        averageRecurrenceStrength: 0.8,
        averagePropagationConsistency: 0.7,
        averageTraceSupport: 0.6,
        averageClosureCoupling: 0.3,
        candidates,
        observationConfidence: 0.8,
    };
}

function makeExcitabilityCell(i: number, j: number): LocalExcitabilityCell {
    return {
        regionId: `u${i}-v${j}`,
        activationLevel: 0.8,
        excitability: 0.75,
        thresholdProximity: 0.7,
        refractoryDepth: 0.1,
        recoveryProgress: 0.9,
        traceResidue: 0.3,
        returnInfluence: 0.2,
        propagationTendency: 0.5,
        localResistance: 0.3,
        localDissipation: 0.2,
        confidence: 0.8,
    };
}

function makeExcitabilityObs(cells: LocalExcitabilityCell[]): LocalExcitabilityFieldState {
    return {
        timestamp: 1000,
        regionCount: cells.length,
        averageExcitability: 0.75,
        maxExcitability: 0.9,
        averageThresholdProximity: 0.7,
        averageTraceResidue: 0.3,
        averageReturnInfluence: 0.2,
        averagePropagationTendency: 0.5,
        highExcitabilityRegionCount: 2,
        nearThresholdRegionCount: 2,
        recoveringRegionCount: 0,
        cells,
        fieldConfidence: 0.8,
    };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('createWeakPlasticityState', () => {
    it('creates state with correct cell count', () => {
        const state = makeInitialState(4);
        expect(state.cells.length).toBe(16);
        expect(state.segments).toBe(4);
    });

    it('initialises all traces to zero', () => {
        const state = makeInitialState(4);
        for (const cell of state.cells) {
            expect(cell.vortexTrace).toBe(0);
            expect(cell.repeatedFlowTrace).toBe(0);
            expect(cell.localExcitabilityTrace).toBe(0);
            expect(cell.membraneTrace).toBe(0);
            expect(cell.accumulatedTrace).toBe(0);
            expect(cell.resistanceDelta).toBe(0);
        }
    });

    it('initialises resistanceScale to 1.0', () => {
        const state = makeInitialState(4);
        for (const cell of state.cells) {
            expect(cell.resistanceScale).toBe(1.0);
        }
    });

    it('uses uI-vJ regionId convention', () => {
        const state = makeInitialState(3);
        const ids = state.cells.map(c => c.regionId);
        expect(ids).toContain('u0-v0');
        expect(ids).toContain('u2-v2');
        expect(ids).not.toContain('x0-y0');
    });

    it('has no semantic labels in regionId', () => {
        const state = makeInitialState(4);
        for (const cell of state.cells) {
            expect(cell.regionId).not.toMatch(/conscious|memory|meaning|emotion|self/i);
        }
    });

    it('sets nanOrInfinityCount to 0', () => {
        const state = makeInitialState(4);
        expect(state.nanOrInfinityCount).toBe(0);
    });
});

describe('defaultWeakPlasticityConfig', () => {
    it('is disabled by default', () => {
        expect(defaultWeakPlasticityConfig.enabled).toBe(false);
    });

    it('has ablation enabled by default', () => {
        expect(defaultWeakPlasticityConfig.ablationEnabled).toBe(true);
    });

    it('is in observeOnly mode by default', () => {
        expect(defaultWeakPlasticityConfig.mode).toBe('observeOnly');
    });

    it('has learningRate at 10^-4 order', () => {
        expect(defaultWeakPlasticityConfig.learningRate).toBeLessThanOrEqual(0.001);
        expect(defaultWeakPlasticityConfig.learningRate).toBeGreaterThan(0);
    });

    it('has maxDeltaPerTick at 10^-4 order', () => {
        expect(defaultWeakPlasticityConfig.maxDeltaPerTick).toBeLessThanOrEqual(0.001);
        expect(defaultWeakPlasticityConfig.maxDeltaPerTick).toBeGreaterThan(0);
    });

    it('has resistanceScale bounds close to 1.0', () => {
        expect(defaultWeakPlasticityConfig.minResistanceScale).toBeGreaterThanOrEqual(0.9);
        expect(defaultWeakPlasticityConfig.maxResistanceScale).toBeLessThanOrEqual(1.1);
    });
});

describe('updateWeakPlasticityState: no-op when disabled', () => {
    it('returns unchanged state when enabled=false', () => {
        const initial = makeInitialState(4);
        const config = makeConfig({ enabled: false });
        const result = updateWeakPlasticityState({
            previous: initial,
            config,
            timestamp: 2000,
            tick: 1,
            dt: 1,
        });
        // All traces unchanged
        for (let i = 0; i < result.cells.length; i++) {
            expect(result.cells[i].vortexTrace).toBe(initial.cells[i].vortexTrace);
            expect(result.cells[i].resistanceScale).toBe(initial.cells[i].resistanceScale);
        }
    });

    it('returns unchanged state when mode=off', () => {
        const initial = makeInitialState(4);
        const config = makeConfig({ enabled: true, mode: 'off' });
        const result = updateWeakPlasticityState({
            previous: initial,
            config,
            timestamp: 2000,
            tick: 1,
            dt: 1,
        });
        for (let i = 0; i < result.cells.length; i++) {
            expect(result.cells[i].vortexTrace).toBe(initial.cells[i].vortexTrace);
        }
    });
});

describe('updateWeakPlasticityState: vortex trace', () => {
    it('increases vortexTrace when a high-confidence vortex candidate is present', () => {
        const initial = makeInitialState(4);
        const config = makeConfig({ enabled: true, mode: 'observeOnly', ablationEnabled: true });
        const vortexObs = makeVortexObs([makeVortexCandidate(1, 2, 0.9)]);

        const result = updateWeakPlasticityState({
            previous: initial,
            vortexObservation: vortexObs,
            config,
            timestamp: 2000,
            tick: 1,
            dt: 1,
        });

        const targetIdx = 1 * 4 + 2; // i=1, j=2 in 4x4 grid
        expect(result.cells[targetIdx].vortexTrace).toBeGreaterThan(0);
    });

    it('does NOT increase vortexTrace when confidence is below threshold', () => {
        const initial = makeInitialState(4);
        const config = makeConfig({
            enabled: true,
            mode: 'observeOnly',
            ablationEnabled: true,
            requireConfidenceAbove: 0.6,
        });
        const vortexObs = makeVortexObs([makeVortexCandidate(1, 2, 0.3)]);

        const result = updateWeakPlasticityState({
            previous: initial,
            vortexObservation: vortexObs,
            config,
            timestamp: 2000,
            tick: 1,
            dt: 1,
        });

        const targetIdx = 1 * 4 + 2;
        expect(result.cells[targetIdx].vortexTrace).toBe(0);
    });

    it('vortexTrace increment does not exceed maxDeltaPerTick', () => {
        const initial = makeInitialState(4);
        const config = makeConfig({
            enabled: true,
            mode: 'observeOnly',
            ablationEnabled: true,
            maxDeltaPerTick: 0.0001,
        });
        const vortexObs = makeVortexObs([makeVortexCandidate(0, 0, 1.0)]);

        const result = updateWeakPlasticityState({
            previous: initial,
            vortexObservation: vortexObs,
            config,
            timestamp: 2000,
            tick: 1,
            dt: 1,
        });

        expect(result.cells[0].vortexTrace).toBeLessThanOrEqual(0.0001 + 1e-9);
    });
});

describe('updateWeakPlasticityState: repeatedFlow trace', () => {
    it('increases repeatedFlowTrace at from/to regions', () => {
        const initial = makeInitialState(4);
        const config = makeConfig({ enabled: true, mode: 'observeOnly', ablationEnabled: true });
        const rfpObs = makeRfpObs([makeFlowPath(0, 0, 2, 3)]);

        const result = updateWeakPlasticityState({
            previous: initial,
            repeatedFlowPaths: rfpObs,
            config,
            timestamp: 2000,
            tick: 1,
            dt: 1,
        });

        const fromIdx = 0 * 4 + 0;
        const toIdx   = 2 * 4 + 3;
        expect(result.cells[fromIdx].repeatedFlowTrace).toBeGreaterThan(0);
        expect(result.cells[toIdx].repeatedFlowTrace).toBeGreaterThan(0);
    });
});

describe('updateWeakPlasticityState: localExcitability trace', () => {
    it('increases localExcitabilityTrace for high-excitability cells', () => {
        const initial = makeInitialState(4);
        const config = makeConfig({ enabled: true, mode: 'observeOnly', ablationEnabled: true });
        const lexObs = makeExcitabilityObs([makeExcitabilityCell(1, 1)]);

        const result = updateWeakPlasticityState({
            previous: initial,
            localExcitability: lexObs,
            config,
            timestamp: 2000,
            tick: 1,
            dt: 1,
        });

        const idx = 1 * 4 + 1;
        expect(result.cells[idx].localExcitabilityTrace).toBeGreaterThan(0);
    });
});

describe('updateWeakPlasticityState: trace decay', () => {
    it('decays all trace channels over time', () => {
        // First tick: build up some trace
        const initial = makeInitialState(4);
        const config = makeConfig({ enabled: true, mode: 'observeOnly', ablationEnabled: true });
        const vortexObs = makeVortexObs([makeVortexCandidate(0, 0, 0.9)]);

        const afterBuild = updateWeakPlasticityState({
            previous: initial,
            vortexObservation: vortexObs,
            config,
            timestamp: 2000,
            tick: 1,
            dt: 1,
        });

        const traceAfterBuild = afterBuild.cells[0].vortexTrace;
        expect(traceAfterBuild).toBeGreaterThan(0);

        // Second tick: no new input, should decay
        const afterDecay = updateWeakPlasticityState({
            previous: afterBuild,
            config,
            timestamp: 3000,
            tick: 2,
            dt: 1,
        });

        expect(afterDecay.cells[0].vortexTrace).toBeLessThan(traceAfterBuild);
    });

    it('does not decay to NaN or Infinity', () => {
        const initial = makeInitialState(4);
        const config = makeConfig({ enabled: true, mode: 'observeOnly', ablationEnabled: true });

        let state = initial;
        for (let tick = 0; tick < 100; tick++) {
            state = updateWeakPlasticityState({
                previous: state,
                config,
                timestamp: 1000 + tick,
                tick,
                dt: 1,
            });
        }

        for (const cell of state.cells) {
            expect(isFinite(cell.vortexTrace)).toBe(true);
            expect(isFinite(cell.accumulatedTrace)).toBe(true);
            expect(isFinite(cell.resistanceScale)).toBe(true);
        }
        expect(state.nanOrInfinityCount).toBe(0);
    });
});

describe('updateWeakPlasticityState: resistanceDelta / resistanceScale', () => {
    it('derives resistanceDelta from accumulatedTrace', () => {
        const initial = makeInitialState(4);
        const config = makeConfig({ enabled: true, mode: 'observeOnly', ablationEnabled: true });
        const vortexObs = makeVortexObs([makeVortexCandidate(0, 0, 0.9)]);

        const result = updateWeakPlasticityState({
            previous: initial,
            vortexObservation: vortexObs,
            config,
            timestamp: 2000,
            tick: 1,
            dt: 1,
        });

        // resistanceDelta should be ≤ 0 (slightly more permeable)
        expect(result.cells[0].resistanceDelta).toBeLessThanOrEqual(0);
    });

    it('clamps resistanceScale to [minResistanceScale, maxResistanceScale]', () => {
        const initial = makeInitialState(4);
        const config = makeConfig({
            enabled: true,
            mode: 'observeOnly',
            ablationEnabled: true,
            minResistanceScale: 0.95,
            maxResistanceScale: 1.05,
        });
        const vortexObs = makeVortexObs([makeVortexCandidate(0, 0, 0.9)]);

        const result = updateWeakPlasticityState({
            previous: initial,
            vortexObservation: vortexObs,
            config,
            timestamp: 2000,
            tick: 1,
            dt: 1,
        });

        for (const cell of result.cells) {
            expect(cell.resistanceScale).toBeGreaterThanOrEqual(0.95 - 1e-9);
            expect(cell.resistanceScale).toBeLessThanOrEqual(1.05 + 1e-9);
        }
    });
});

describe('updateWeakPlasticityState: ablation', () => {
    it('computes resistanceScale even with ablation on (for observation)', () => {
        const initial = makeInitialState(4);
        const config = makeConfig({
            enabled: true,
            mode: 'observeOnly',
            ablationEnabled: true,
        });
        const vortexObs = makeVortexObs([makeVortexCandidate(0, 0, 0.9)]);

        const result = updateWeakPlasticityState({
            previous: initial,
            vortexObservation: vortexObs,
            config,
            timestamp: 2000,
            tick: 1,
            dt: 1,
        });

        // resistanceScale is computed but NOT exposed to runtime
        expect(typeof result.cells[0].resistanceScale).toBe('number');
        expect(isFinite(result.cells[0].resistanceScale)).toBe(true);
    });
});

describe('getResistanceScale: runtime access guard', () => {
    it('returns 1.0 when enabled=false', () => {
        const state = makeInitialState(4);
        const config = makeConfig({ enabled: false });
        expect(getResistanceScale(state, config, 0)).toBe(1.0);
    });

    it('returns 1.0 when ablationEnabled=true', () => {
        const state = makeInitialState(4);
        const config = makeConfig({ enabled: true, ablationEnabled: true, mode: 'resistanceOnly' });
        expect(getResistanceScale(state, config, 0)).toBe(1.0);
    });

    it('returns 1.0 when mode=observeOnly', () => {
        const state = makeInitialState(4);
        const config = makeConfig({ enabled: true, ablationEnabled: false, mode: 'observeOnly' });
        expect(getResistanceScale(state, config, 0)).toBe(1.0);
    });

    it('returns cell resistanceScale when all gates are open', () => {
        const initial = makeInitialState(4);
        const config = makeConfig({
            enabled: true,
            ablationEnabled: false,
            mode: 'resistanceOnly',
        });
        const vortexObs = makeVortexObs([makeVortexCandidate(0, 0, 0.9)]);

        const result = updateWeakPlasticityState({
            previous: initial,
            vortexObservation: vortexObs,
            config,
            timestamp: 2000,
            tick: 1,
            dt: 1,
        });

        // Should return a finite number close to 1.0 (very small change)
        const scale = getResistanceScale(result, config, 0);
        expect(isFinite(scale)).toBe(true);
        expect(scale).toBeGreaterThanOrEqual(0.5);
        expect(scale).toBeLessThanOrEqual(2.0);
    });

    it('returns 1.0 for out-of-range cell index', () => {
        const state = makeInitialState(4);
        const config = makeConfig({ enabled: true, ablationEnabled: false, mode: 'resistanceOnly' });
        expect(getResistanceScale(state, config, 9999)).toBe(1.0);
    });
});

describe('WeakPlasticityState: no runtime graph or semantic content', () => {
    it('does not create any graph edges', () => {
        const initial = makeInitialState(4);
        const config = makeConfig({ enabled: true, mode: 'observeOnly', ablationEnabled: true });
        const vortexObs = makeVortexObs([makeVortexCandidate(1, 2, 0.9)]);

        const result = updateWeakPlasticityState({
            previous: initial,
            vortexObservation: vortexObs,
            config,
            timestamp: 2000,
            tick: 1,
            dt: 1,
        });

        // Result has no 'edges', 'graph', 'nodes', 'semantic' properties
        expect((result as Record<string, unknown>).edges).toBeUndefined();
        expect((result as Record<string, unknown>).graph).toBeUndefined();
        expect((result as Record<string, unknown>).nodes).toBeUndefined();
    });

    it('regionId values are coordinate strings, not semantic labels', () => {
        const state = makeInitialState(4);
        for (const cell of state.cells) {
            expect(cell.regionId).toMatch(/^u\d+-v\d+$/);
        }
    });
});
