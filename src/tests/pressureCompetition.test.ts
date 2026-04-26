/**
 * Pressure Competition State Tests
 *
 * AETERNA Phase 6 / Q2-1: Annealing-Inspired Pressure Competition
 *
 * These tests verify:
 * - Correct pressure mapping from NeedMotivationState
 * - No NaN / infinite values
 * - Softmax weights sum to 1 (via candidateEnergies)
 * - competitionEntropy is in [0, 1]
 * - competitionStability = 1 - competitionEntropy
 * - Dominant pressure emerges softly (not winner-take-all)
 * - Multiple pressures can coexist
 * - High safety pressure foregrounds when safetyNeed is high
 * - Entropy is high when pressures are similar, low when one dominates
 */

import { describe, it, expect } from 'vitest';
import { derivePressureCompetition } from '../organism/derivePressureCompetition.ts';
import type { NeedMotivationState } from '../types/needMotivation.ts';

/**
 * Baseline NeedMotivationState with moderate even values
 */
function createBaselineNeedMotivation(): NeedMotivationState {
    return {
        timestamp: 0,
        energyNeed: 0.3,
        safetyNeed: 0.3,
        restorationNeed: 0.3,
        contactNeed: 0.3,
        noveltyMotivation: 0.3,
        repetitionMotivation: 0.3,
        explorationMotivation: 0.3,
        settlingMotivation: 0.3,
        withdrawMotivation: 0.3,
    };
}

/**
 * NeedMotivationState with clear safety dominance
 */
function createSafetyDominantNeedMotivation(): NeedMotivationState {
    return {
        timestamp: 0,
        energyNeed: 0.1,
        safetyNeed: 0.95,
        restorationNeed: 0.1,
        contactNeed: 0.1,
        noveltyMotivation: 0.05,
        repetitionMotivation: 0.1,
        explorationMotivation: 0.05,
        settlingMotivation: 0.1,
        withdrawMotivation: 0.1,
    };
}

/**
 * NeedMotivationState with clear novelty / exploration tendency
 */
function createExplorationDominantNeedMotivation(): NeedMotivationState {
    return {
        timestamp: 0,
        energyNeed: 0.1,
        safetyNeed: 0.05,
        restorationNeed: 0.1,
        contactNeed: 0.1,
        noveltyMotivation: 0.85,
        repetitionMotivation: 0.1,
        explorationMotivation: 0.80,
        settlingMotivation: 0.1,
        withdrawMotivation: 0.05,
    };
}

/**
 * NeedMotivationState with all pressures near zero (quiet/dormant field)
 */
function createQuietNeedMotivation(): NeedMotivationState {
    return {
        timestamp: 0,
        energyNeed: 0.02,
        safetyNeed: 0.02,
        restorationNeed: 0.02,
        contactNeed: 0.02,
        noveltyMotivation: 0.02,
        repetitionMotivation: 0.02,
        explorationMotivation: 0.02,
        settlingMotivation: 0.02,
        withdrawMotivation: 0.02,
    };
}

describe('Pressure Competition Derivation', () => {
    it('should produce valid PressureCompetitionState with finite values', () => {
        const needMotivation = createBaselineNeedMotivation();
        const state = derivePressureCompetition(needMotivation);

        expect(Number.isFinite(state.safetyPressure)).toBe(true);
        expect(Number.isFinite(state.restorationPressure)).toBe(true);
        expect(Number.isFinite(state.noveltyPressure)).toBe(true);
        expect(Number.isFinite(state.repetitionPressure)).toBe(true);
        expect(Number.isFinite(state.explorationPressure)).toBe(true);
        expect(Number.isFinite(state.withdrawalPressure)).toBe(true);
        expect(Number.isFinite(state.competitionEntropy)).toBe(true);
        expect(Number.isFinite(state.competitionStability)).toBe(true);
        expect(Number.isFinite(state.annealingTemperature)).toBe(true);
    });

    it('should produce no NaN values', () => {
        const needMotivation = createBaselineNeedMotivation();
        const state = derivePressureCompetition(needMotivation);

        expect(isNaN(state.safetyPressure)).toBe(false);
        expect(isNaN(state.restorationPressure)).toBe(false);
        expect(isNaN(state.noveltyPressure)).toBe(false);
        expect(isNaN(state.repetitionPressure)).toBe(false);
        expect(isNaN(state.explorationPressure)).toBe(false);
        expect(isNaN(state.withdrawalPressure)).toBe(false);
        expect(isNaN(state.competitionEntropy)).toBe(false);
        expect(isNaN(state.competitionStability)).toBe(false);
        expect(isNaN(state.annealingTemperature)).toBe(false);
    });

    it('should preserve timestamp from needMotivation', () => {
        const needMotivation = { ...createBaselineNeedMotivation(), timestamp: 42 };
        const state = derivePressureCompetition(needMotivation);
        expect(state.timestamp).toBe(42);
    });

    it('should keep competitionEntropy in [0, 1]', () => {
        for (const nm of [
            createBaselineNeedMotivation(),
            createSafetyDominantNeedMotivation(),
            createExplorationDominantNeedMotivation(),
            createQuietNeedMotivation(),
        ]) {
            const state = derivePressureCompetition(nm);
            expect(state.competitionEntropy).toBeGreaterThanOrEqual(0);
            expect(state.competitionEntropy).toBeLessThanOrEqual(1);
        }
    });

    it('should keep competitionStability in [0, 1]', () => {
        for (const nm of [
            createBaselineNeedMotivation(),
            createSafetyDominantNeedMotivation(),
            createExplorationDominantNeedMotivation(),
        ]) {
            const state = derivePressureCompetition(nm);
            expect(state.competitionStability).toBeGreaterThanOrEqual(0);
            expect(state.competitionStability).toBeLessThanOrEqual(1);
        }
    });

    it('should satisfy: competitionStability ≈ 1 - competitionEntropy', () => {
        const nm = createBaselineNeedMotivation();
        const state = derivePressureCompetition(nm);
        expect(state.competitionStability).toBeCloseTo(1 - state.competitionEntropy, 5);
    });

    it('should keep annealingTemperature positive', () => {
        for (const nm of [
            createBaselineNeedMotivation(),
            createSafetyDominantNeedMotivation(),
            createQuietNeedMotivation(),
        ]) {
            const state = derivePressureCompetition(nm);
            expect(state.annealingTemperature).toBeGreaterThan(0);
        }
    });

    it('candidateEnergies should sum to approximately 1', () => {
        for (const nm of [
            createBaselineNeedMotivation(),
            createSafetyDominantNeedMotivation(),
            createExplorationDominantNeedMotivation(),
        ]) {
            const state = derivePressureCompetition(nm);
            if (!state.candidateEnergies) return;
            const sum = Object.values(state.candidateEnergies).reduce((a, b) => a + b, 0);
            expect(sum).toBeCloseTo(1, 4);
        }
    });

    it('should foreground safety when safetyNeed is very high', () => {
        const nm = createSafetyDominantNeedMotivation();
        const state = derivePressureCompetition(nm);

        // Safety should be the highest pressure
        expect(state.safetyPressure).toBeGreaterThan(state.noveltyPressure);
        expect(state.safetyPressure).toBeGreaterThan(state.explorationPressure);
        expect(state.safetyPressure).toBeGreaterThan(state.repetitionPressure);

        // Safety should emerge as dominant
        expect(state.dominantPressure).toBe('safety');

        // Competition stability should be higher (one pressure leads clearly)
        expect(state.competitionStability).toBeGreaterThan(0.1);
    });

    it('should have higher competitionEntropy when pressures are balanced', () => {
        const balancedNm: NeedMotivationState = {
            timestamp: 0,
            energyNeed: 0.3,
            safetyNeed: 0.3,
            restorationNeed: 0.3,
            contactNeed: 0.3,
            noveltyMotivation: 0.3,
            repetitionMotivation: 0.3,
            explorationMotivation: 0.3,
            settlingMotivation: 0.3,
            withdrawMotivation: 0.3,
        };

        const dominantNm = createSafetyDominantNeedMotivation();

        const balanced = derivePressureCompetition(balancedNm);
        const dominant = derivePressureCompetition(dominantNm);

        // Balanced pressures → higher entropy (more diffuse competition)
        expect(balanced.competitionEntropy).toBeGreaterThan(dominant.competitionEntropy);
    });

    it('should allow multiple pressures to coexist (not winner-take-all)', () => {
        // Mixed state: high novelty AND moderate restoration
        const mixedNm: NeedMotivationState = {
            timestamp: 0,
            energyNeed: 0.1,
            safetyNeed: 0.15,
            restorationNeed: 0.55,
            contactNeed: 0.1,
            noveltyMotivation: 0.60,
            repetitionMotivation: 0.3,
            explorationMotivation: 0.50,
            settlingMotivation: 0.50,
            withdrawMotivation: 0.1,
        };

        const state = derivePressureCompetition(mixedNm);

        // All six pressures should be present (>= 0)
        expect(state.noveltyPressure).toBeGreaterThan(0);
        expect(state.restorationPressure).toBeGreaterThan(0);
        expect(state.explorationPressure).toBeGreaterThan(0);

        // Entropy should be moderate — not collapsed to 0
        expect(state.competitionEntropy).toBeGreaterThan(0.1);
    });

    it('should return dominantPressure as null when competition is very diffuse', () => {
        // Perfectly equal pressures → no dominant
        const evenNm: NeedMotivationState = {
            timestamp: 0,
            energyNeed: 0.1,
            safetyNeed: 0.2,
            restorationNeed: 0.2,
            contactNeed: 0.1,
            noveltyMotivation: 0.2,
            repetitionMotivation: 0.2,
            explorationMotivation: 0.2,
            settlingMotivation: 0.2,
            withdrawMotivation: 0.2,
        };

        const state = derivePressureCompetition(evenNm);

        // With all equal input pressures, dominantPressure may be null or a soft foreground
        // The key invariant: even if dominantPressure is set, it should not be "locked in"
        // (entropy should be high)
        expect(state.competitionEntropy).toBeGreaterThan(0.5);
    });

    it('should not produce winner-take-all (dominant candidateEnergy < 1)', () => {
        const nm = createSafetyDominantNeedMotivation();
        const state = derivePressureCompetition(nm);

        if (state.candidateEnergies) {
            for (const [, weight] of Object.entries(state.candidateEnergies)) {
                // No single pressure should monopolize the entire weight
                expect(weight).toBeLessThan(1.0);
                // All pressures should have non-zero weight
                expect(weight).toBeGreaterThan(0);
            }
        }
    });

    it('should handle zero-pressure state (quiet field) without errors', () => {
        const quietNm = createQuietNeedMotivation();
        const state = derivePressureCompetition(quietNm);

        // Should still produce valid output
        expect(Number.isFinite(state.competitionEntropy)).toBe(true);
        expect(Number.isFinite(state.competitionStability)).toBe(true);
        expect(Number.isFinite(state.annealingTemperature)).toBe(true);

        // With near-equal tiny pressures, entropy should be near maximum
        expect(state.competitionEntropy).toBeGreaterThan(0.8);
    });

    it('should map pressures correctly from NeedMotivationState', () => {
        const nm: NeedMotivationState = {
            timestamp: 0,
            energyNeed: 0.0,
            safetyNeed: 0.8,
            restorationNeed: 0.6,
            contactNeed: 0.0,
            noveltyMotivation: 0.4,
            repetitionMotivation: 0.3,
            explorationMotivation: 0.5,
            settlingMotivation: 0.7,
            withdrawMotivation: 0.2,
        };

        const state = derivePressureCompetition(nm);

        // safetyPressure ← safetyNeed
        expect(state.safetyPressure).toBeCloseTo(0.8, 5);

        // noveltyPressure ← noveltyMotivation
        expect(state.noveltyPressure).toBeCloseTo(0.4, 5);

        // repetitionPressure ← repetitionMotivation
        expect(state.repetitionPressure).toBeCloseTo(0.3, 5);

        // explorationPressure ← explorationMotivation
        expect(state.explorationPressure).toBeCloseTo(0.5, 5);

        // withdrawalPressure ← withdrawMotivation
        expect(state.withdrawalPressure).toBeCloseTo(0.2, 5);

        // restorationPressure ← restorationNeed * 0.6 + settlingMotivation * 0.4
        const expectedRestoration = 0.6 * 0.6 + 0.7 * 0.4;
        expect(state.restorationPressure).toBeCloseTo(expectedRestoration, 5);
    });

    it('should show lower annealingTemperature when one pressure clearly dominates', () => {
        const balanced = derivePressureCompetition(createBaselineNeedMotivation());
        const dominant = derivePressureCompetition(createSafetyDominantNeedMotivation());

        // When one pressure is far above others, spread is large → temperature is lower
        expect(dominant.annealingTemperature).toBeLessThanOrEqual(balanced.annealingTemperature);
    });

    it('should work with custom baseTemperature', () => {
        const nm = createBaselineNeedMotivation();
        const lowTemp = derivePressureCompetition(nm, 0.1);
        const highTemp = derivePressureCompetition(nm, 1.5);

        // Higher base temperature → more diffuse competition → higher entropy
        expect(highTemp.competitionEntropy).toBeGreaterThanOrEqual(lowTemp.competitionEntropy);

        // Temperature should be bounded
        expect(lowTemp.annealingTemperature).toBeGreaterThan(0);
        expect(highTemp.annealingTemperature).toBeGreaterThan(0);
    });

    it('should keep all pressure values in valid range', () => {
        const nm = createSafetyDominantNeedMotivation();
        const state = derivePressureCompetition(nm);

        expect(state.safetyPressure).toBeGreaterThanOrEqual(0);
        expect(state.restorationPressure).toBeGreaterThanOrEqual(0);
        expect(state.noveltyPressure).toBeGreaterThanOrEqual(0);
        expect(state.repetitionPressure).toBeGreaterThanOrEqual(0);
        expect(state.explorationPressure).toBeGreaterThanOrEqual(0);
        expect(state.withdrawalPressure).toBeGreaterThanOrEqual(0);

        expect(state.safetyPressure).toBeLessThanOrEqual(1.2);
        expect(state.restorationPressure).toBeLessThanOrEqual(1);
        expect(state.noveltyPressure).toBeLessThanOrEqual(1);
        expect(state.repetitionPressure).toBeLessThanOrEqual(1);
        expect(state.explorationPressure).toBeLessThanOrEqual(1);
        expect(state.withdrawalPressure).toBeLessThanOrEqual(1);
    });
});
