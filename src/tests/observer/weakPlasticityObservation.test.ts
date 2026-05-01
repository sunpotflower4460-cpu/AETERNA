/**
 * weakPlasticityObservation.test.ts
 * N5: Weak Plasticity Channel — observer derivation tests
 */

import { describe, it, expect } from 'vitest';
import { deriveWeakPlasticityObservation } from '../../observer/deriveWeakPlasticityObservation.js';
import { createWeakPlasticityState } from '../../plasticity/weakPlasticity.js';
import type { WeakPlasticityState } from '../../types/weakPlasticity.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeState(overrides: Partial<WeakPlasticityState> = {}): WeakPlasticityState {
    const base = createWeakPlasticityState({ segments: 4, timestamp: 1000, tick: 0 });
    return { ...base, ...overrides };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('deriveWeakPlasticityObservation: basic', () => {
    it('returns zero-accumulation observation for fresh state in off mode', () => {
        const state = makeState({ mode: 'off' });
        const obs = deriveWeakPlasticityObservation(state);
        expect(obs.totalAccumulation).toBe(0);
        expect(obs.averageAccumulation).toBe(0);
        expect(obs.maxAccumulation).toBe(0);
        expect(obs.observationConfidence).toBe(0);
    });

    it('passes mode and ablationEnabled through', () => {
        const state = makeState({ mode: 'observeOnly', ablationEnabled: true });
        const obs = deriveWeakPlasticityObservation(state);
        expect(obs.mode).toBe('observeOnly');
        expect(obs.ablationEnabled).toBe(true);
    });

    it('produces finite values for all fields', () => {
        const state = makeState({ mode: 'observeOnly', ablationEnabled: true });
        const obs = deriveWeakPlasticityObservation(state);
        for (const [key, val] of Object.entries(obs)) {
            if (typeof val === 'number') {
                expect(isFinite(val), `${key} should be finite`).toBe(true);
            }
        }
    });
});

describe('deriveWeakPlasticityObservation: accumulation stats', () => {
    it('computes totalAccumulation correctly', () => {
        const state = makeState({ mode: 'observeOnly' });
        // Manually set two cells to have non-zero accumulatedTrace
        const cells = state.cells.map((c, i) =>
            i === 0 ? { ...c, accumulatedTrace: 0.002, resistanceScale: 0.999 } :
            i === 1 ? { ...c, accumulatedTrace: 0.001, resistanceScale: 0.9995 } :
            c
        );
        const modifiedState = { ...state, cells };
        const obs = deriveWeakPlasticityObservation(modifiedState);
        expect(obs.totalAccumulation).toBeCloseTo(0.003, 6);
    });

    it('counts affectedRegionCount correctly', () => {
        const state = makeState({ mode: 'observeOnly' });
        const cells = state.cells.map((c, i) =>
            i < 3 ? { ...c, accumulatedTrace: 0.001 } : c
        );
        const modifiedState = { ...state, cells };
        const obs = deriveWeakPlasticityObservation(modifiedState);
        expect(obs.affectedRegionCount).toBe(3);
    });

    it('detects maxAccumulation correctly', () => {
        const state = makeState({ mode: 'observeOnly' });
        const cells = state.cells.map((c, i) =>
            i === 5 ? { ...c, accumulatedTrace: 0.005 } :
            i === 2 ? { ...c, accumulatedTrace: 0.002 } :
            c
        );
        const modifiedState = { ...state, cells };
        const obs = deriveWeakPlasticityObservation(modifiedState);
        expect(obs.maxAccumulation).toBeCloseTo(0.005, 6);
    });
});

describe('deriveWeakPlasticityObservation: resistanceScale stats', () => {
    it('averageResistanceScale is close to 1.0 when traces are near zero', () => {
        const state = makeState({ mode: 'observeOnly' });
        const obs = deriveWeakPlasticityObservation(state);
        expect(obs.averageResistanceScale).toBeCloseTo(1.0, 3);
    });

    it('minResistanceScale and maxResistanceScale default to 1.0 for zero state', () => {
        const state = makeState({ mode: 'observeOnly' });
        const obs = deriveWeakPlasticityObservation(state);
        expect(obs.minResistanceScale).toBeCloseTo(1.0, 3);
        expect(obs.maxResistanceScale).toBeCloseTo(1.0, 3);
    });
});

describe('deriveWeakPlasticityObservation: contribution fractions', () => {
    it('vortexContribution is 1.0 when only vortex traces are non-zero', () => {
        const state = makeState({ mode: 'observeOnly' });
        const cells = state.cells.map((c, i) =>
            i === 0 ? { ...c, vortexTrace: 0.001, accumulatedTrace: 0.001 } : c
        );
        const modifiedState = { ...state, cells };
        const obs = deriveWeakPlasticityObservation(modifiedState);
        expect(obs.vortexContribution).toBeCloseTo(1.0, 3);
        expect(obs.repeatedFlowContribution).toBeCloseTo(0, 3);
    });

    it('all contribution fractions are in [0, 1]', () => {
        const state = makeState({ mode: 'observeOnly' });
        const obs = deriveWeakPlasticityObservation(state);
        expect(obs.vortexContribution).toBeGreaterThanOrEqual(0);
        expect(obs.vortexContribution).toBeLessThanOrEqual(1);
        expect(obs.repeatedFlowContribution).toBeGreaterThanOrEqual(0);
        expect(obs.localExcitabilityContribution).toBeGreaterThanOrEqual(0);
        expect(obs.membraneContribution).toBeGreaterThanOrEqual(0);
    });
});

describe('deriveWeakPlasticityObservation: risk proxies', () => {
    it('plasticitySaturationRisk is 0 when traces are zero', () => {
        const state = makeState({ mode: 'observeOnly' });
        const obs = deriveWeakPlasticityObservation(state);
        expect(obs.plasticitySaturationRisk).toBe(0);
    });

    it('plasticityDormancyRisk is 1 when accumulation is zero', () => {
        const state = makeState({ mode: 'observeOnly' });
        const obs = deriveWeakPlasticityObservation(state);
        expect(obs.plasticityDormancyRisk).toBe(1);
    });

    it('plasticitySaturationRisk increases toward 1 as maxAcc approaches 4', () => {
        const state = makeState({ mode: 'observeOnly' });
        const cells = state.cells.map((c, i) =>
            i === 0 ? { ...c, accumulatedTrace: 3.8 } : c
        );
        const modifiedState = { ...state, cells };
        const obs = deriveWeakPlasticityObservation(modifiedState);
        expect(obs.plasticitySaturationRisk).toBeGreaterThan(0.9);
    });
});

describe('deriveWeakPlasticityObservation: NaN guard', () => {
    it('passes nanOrInfinityCount from state', () => {
        const state = makeState({ mode: 'observeOnly', nanOrInfinityCount: 2 });
        const obs = deriveWeakPlasticityObservation(state);
        expect(obs.nanOrInfinityCount).toBe(2);
    });
});
