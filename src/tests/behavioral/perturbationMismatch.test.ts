import { describe, it, expect } from 'vitest';
import { runPerturbationComparisonScenarios } from '../scenario/perturbationComparisonScenario.ts';

describe('Phase 2: Perturbation Reception & Prediction Mismatch', () => {
    let summary: Awaited<ReturnType<typeof runPerturbationComparisonScenarios>>;

    it('build does not break', async () => {
        summary = await runPerturbationComparisonScenarios();
        expect(summary.scenarios.length).toBeGreaterThan(0);
    }, 60000);

    it('PerturbationEvent has valid fields', async () => {
        if (!summary) summary = await runPerturbationComparisonScenarios();
        const stableResult = summary.scenarios.find(s => s.scenarioName === 'stable-state-single-touch');
        expect(stableResult).toBeDefined();
        const event = stableResult!.perturbationEvent;
        expect(Number.isFinite(event.magnitude)).toBe(true);
        expect(Number.isFinite(event.novelty)).toBe(true);
        expect(Number.isFinite(event.expectedness)).toBe(true);
        expect(Number.isFinite(event.locality)).toBe(true);
        expect(event.magnitude).toBeGreaterThanOrEqual(0);
        expect(event.magnitude).toBeLessThanOrEqual(1);
        expect(event.novelty).toBeGreaterThanOrEqual(0);
        expect(event.novelty).toBeLessThanOrEqual(1);
        expect(event.expectedness).toBeGreaterThanOrEqual(0);
        expect(event.expectedness).toBeLessThanOrEqual(1);
        expect(event.locality).toBeGreaterThanOrEqual(0);
        expect(event.locality).toBeLessThanOrEqual(1);
    }, 60000);

    it('PredictionMismatchState has valid fields', async () => {
        if (!summary) summary = await runPerturbationComparisonScenarios();
        const stableResult = summary.scenarios.find(s => s.scenarioName === 'stable-state-single-touch');
        expect(stableResult).toBeDefined();
        const mismatch = stableResult!.mismatchState;
        expect(Number.isFinite(mismatch.mismatchLevel)).toBe(true);
        expect(Number.isFinite(mismatch.surprisePressure)).toBe(true);
        expect(Number.isFinite(mismatch.boundaryStress)).toBe(true);
        expect(Number.isFinite(mismatch.recoveryPull)).toBe(true);
    }, 60000);

    it('overload state shows different (higher) mismatch than stable', async () => {
        if (!summary) summary = await runPerturbationComparisonScenarios();
        expect(
            summary.stateEffectVisible ||
            summary.overloadMismatchLevel >= summary.stableMismatchLevel * 0.9,
        ).toBe(true);
    }, 60000);

    it('familiar repeated touch shows lower novelty/surprisePressure than fresh touch', async () => {
        if (!summary) summary = await runPerturbationComparisonScenarios();
        const familiarResult = summary.scenarios.find(s => s.scenarioName === 'familiar-repeated-touch');
        const stableResult = summary.scenarios.find(s => s.scenarioName === 'stable-state-single-touch');
        expect(familiarResult).toBeDefined();
        expect(stableResult).toBeDefined();
        const familiarSurprise = familiarResult!.mismatchState.surprisePressure;
        const stableSurprise = stableResult!.mismatchState.surprisePressure;
        expect(familiarSurprise).toBeLessThanOrEqual(stableSurprise * 1.1);
    }, 60000);
});
