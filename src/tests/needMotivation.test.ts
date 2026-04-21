/**
 * Need / Motivation State Tests
 *
 * AETERNA v0.5 / A4: Need / Motivation Split
 *
 * These tests verify that need and motivation are properly separated:
 * - Need comes from deficiency/damage/depletion
 * - Motivation comes from arousal/awareness/replay/history
 * - They can vary independently
 * - High need doesn't guarantee high motivation
 */

import { describe, it, expect } from 'vitest';
import { deriveNeedMotivation } from '../organism/deriveNeedMotivation.ts';
import type { NeedMotivationState } from '../types/needMotivation.ts';
import type { FeltStateVector } from '../types/feltState.ts';
import type { ArousalAwarenessState } from '../types/arousalAwareness.ts';
import type { ReplayState } from '../types/replayState.ts';
import type { OrganismSnapshot } from '../types/organismSnapshot.ts';
import type { OrganismLivingState, OrganismEnergyState, OrganismHomeostaticState } from '../types/organismState.ts';

/**
 * Create minimal test state
 */
function createTestSnapshot(): OrganismSnapshot {
    return {
        timestamp: 0,
        energy: 1.0,
        overload: 0.0,
        coherence: 0.8,
        boundary: 0.8,
        modeState: 'wake',
        touchExpectationConfidence: 0.5,
        recentPerturbationPressure: 0.0,
        meanPredictionError: 0.0,
        restorationBias: 0.5,
        coherenceMemory: 0.7,
        recentTouchActivity: 0.0,
        currentActivity: 0.3,
        ignitionRatio: 0.2,
        recentTouchSurprise: 0.0,
    };
}

function createTestFeltState(): FeltStateVector {
    return {
        timestamp: 0,
        depletion: 0.0,
        overload: 0.0,
        coherence: 0.8,
        boundaryIntegrity: 0.8,
        restorationReadiness: 0.5,
        perturbationLoad: 0.0,
        openness: 0.6,
    };
}

function createTestArousalAwareness(): ArousalAwarenessState {
    return {
        timestamp: 0,
        arousalLevel: 0.3,
        awarenessWindow: 0.6,
        salienceOpenness: 0.5,
        foregroundPressure: 0.2,
        restDepth: 0.4,
        hyperreactivity: 0.1,
        settlingWindow: 0.5,
    };
}

function createTestReplayState(): ReplayState {
    return {
        timestamp: 0,
        replayPressure: 0.3,
        replayReadiness: 0.4,
        consolidationGain: 0.1,
        activeReplayCount: 0,
        recentReplaySalience: 0.0,
        restConsolidationDepth: 0.3,
        replaySuppression: 0.0,
        lastReplayCategory: null,
    };
}

function createTestLivingState(): OrganismLivingState {
    return {
        fatigue: 0.0,
        coherenceMemory: 0.7,
        preferredErgodicity: 0.5,
        longBaselineTone: 0.0,
        recentHistoryBias: 0.0,
        residueBias: 0.0,
        predictionSensitivity: 0.5,
        touchNeedBaseline: 0.4,
    };
}

function createTestEnergyState(): OrganismEnergyState {
    return {
        energyReserve: 1.0,
        energyInflow: 0.1,
        energyOutflow: 0.05,
        maintenanceCost: 0.03,
        activityCost: 0.02,
        rewriteCost: 0.0,
        structuralIntegrity: 0.95,
        lowEnergyPressure: 0.0,
        recoveryDrive: 0.0,
        wasDormantByEnergy: false,
    };
}

function createTestHomeostaticState(): OrganismHomeostaticState {
    return {
        stabilityIndex: 0.8,
        boundaryIntegrity: 0.8,
        selfPreservationBias: 0.5,
        irritabilityLevel: 0.0,
        restorationBias: 0.5,
        collapseRisk: 0.0,
        homeostaticStress: 0.0,
        preferredStabilityBand: 0.7,
        consecutiveQuietFrames: 0,
    };
}

describe('Need / Motivation Derivation', () => {
    it('should generate valid NeedMotivationState', () => {
        const snapshot = createTestSnapshot();
        const feltState = createTestFeltState();
        const arousalAwareness = createTestArousalAwareness();
        const replayState = createTestReplayState();
        const livingState = createTestLivingState();
        const energyState = createTestEnergyState();
        const homeostaticState = createTestHomeostaticState();

        const needMotivation = deriveNeedMotivation(
            snapshot,
            feltState,
            arousalAwareness,
            replayState,
            livingState,
            energyState,
            homeostaticState,
            null
        );

        // Should produce valid state
        expect(needMotivation.timestamp).toBe(0);
        expect(Number.isFinite(needMotivation.energyNeed)).toBe(true);
        expect(Number.isFinite(needMotivation.safetyNeed)).toBe(true);
        expect(Number.isFinite(needMotivation.restorationNeed)).toBe(true);
        expect(Number.isFinite(needMotivation.contactNeed)).toBe(true);
        expect(Number.isFinite(needMotivation.noveltyMotivation)).toBe(true);
        expect(Number.isFinite(needMotivation.repetitionMotivation)).toBe(true);
        expect(Number.isFinite(needMotivation.explorationMotivation)).toBe(true);
        expect(Number.isFinite(needMotivation.settlingMotivation)).toBe(true);
        expect(Number.isFinite(needMotivation.withdrawMotivation)).toBe(true);
    });

    it('should produce no NaN values', () => {
        const snapshot = createTestSnapshot();
        const feltState = createTestFeltState();
        const arousalAwareness = createTestArousalAwareness();
        const replayState = createTestReplayState();
        const livingState = createTestLivingState();
        const energyState = createTestEnergyState();
        const homeostaticState = createTestHomeostaticState();

        const needMotivation = deriveNeedMotivation(
            snapshot,
            feltState,
            arousalAwareness,
            replayState,
            livingState,
            energyState,
            homeostaticState,
            null
        );

        expect(isNaN(needMotivation.energyNeed)).toBe(false);
        expect(isNaN(needMotivation.safetyNeed)).toBe(false);
        expect(isNaN(needMotivation.restorationNeed)).toBe(false);
        expect(isNaN(needMotivation.contactNeed)).toBe(false);
        expect(isNaN(needMotivation.noveltyMotivation)).toBe(false);
        expect(isNaN(needMotivation.repetitionMotivation)).toBe(false);
        expect(isNaN(needMotivation.explorationMotivation)).toBe(false);
        expect(isNaN(needMotivation.settlingMotivation)).toBe(false);
        expect(isNaN(needMotivation.withdrawMotivation)).toBe(false);
    });

    it('should increase energyNeed with high depletion', () => {
        const snapshot = createTestSnapshot();
        const feltState = createTestFeltState();
        const arousalAwareness = createTestArousalAwareness();
        const replayState = createTestReplayState();
        const livingState = createTestLivingState();
        const energyState = createTestEnergyState();
        const homeostaticState = createTestHomeostaticState();

        // Low depletion baseline
        const baseline = deriveNeedMotivation(
            snapshot,
            feltState,
            arousalAwareness,
            replayState,
            livingState,
            energyState,
            homeostaticState,
            null
        );

        // High depletion
        const depletedFeltState = { ...feltState, depletion: 0.9 };
        const depletedEnergyState = { ...energyState, energyReserve: 0.2 };
        const depletedLivingState = { ...livingState, fatigue: 0.8 };

        const depleted = deriveNeedMotivation(
            snapshot,
            depletedFeltState,
            arousalAwareness,
            replayState,
            depletedLivingState,
            depletedEnergyState,
            homeostaticState,
            null
        );

        expect(depleted.energyNeed).toBeGreaterThan(baseline.energyNeed);
        expect(depleted.energyNeed).toBeGreaterThan(0.3);
    });

    it('should increase safetyNeed with high overload', () => {
        const snapshot = createTestSnapshot();
        const feltState = createTestFeltState();
        const arousalAwareness = createTestArousalAwareness();
        const replayState = createTestReplayState();
        const livingState = createTestLivingState();
        const energyState = createTestEnergyState();
        const homeostaticState = createTestHomeostaticState();

        // Low overload baseline
        const baseline = deriveNeedMotivation(
            snapshot,
            feltState,
            arousalAwareness,
            replayState,
            livingState,
            energyState,
            homeostaticState,
            null
        );

        // High overload
        const overloadedFeltState = {
            ...feltState,
            overload: 1.0,
            boundaryIntegrity: 0.3,
            perturbationLoad: 0.8,
        };
        const overloadedHomeostaticState = { ...homeostaticState, stabilityIndex: 0.2 };

        const overloaded = deriveNeedMotivation(
            snapshot,
            overloadedFeltState,
            arousalAwareness,
            replayState,
            livingState,
            energyState,
            overloadedHomeostaticState,
            null
        );

        expect(overloaded.safetyNeed).toBeGreaterThan(baseline.safetyNeed);
        expect(overloaded.safetyNeed).toBeGreaterThan(0.4);
    });

    it('should show moderate noveltyMotivation with appropriate arousal/awareness', () => {
        const snapshot = createTestSnapshot();
        const feltState = createTestFeltState();
        const replayState = createTestReplayState();
        const livingState = createTestLivingState();
        const energyState = createTestEnergyState();
        const homeostaticState = createTestHomeostaticState();

        // Favorable conditions: moderate arousal + awareness
        const favorableArousal = {
            ...createTestArousalAwareness(),
            arousalLevel: 0.5,
            awarenessWindow: 0.7,
            salienceOpenness: 0.6,
        };
        const favorableFeltState = {
            ...feltState,
            perturbationLoad: 0.4,
            overload: 0.2,
        };

        const result = deriveNeedMotivation(
            snapshot,
            favorableFeltState,
            favorableArousal,
            replayState,
            livingState,
            energyState,
            homeostaticState,
            null
        );

        expect(result.noveltyMotivation).toBeGreaterThan(0.2);
        expect(result.noveltyMotivation).toBeLessThan(0.8);
    });

    it('should show repetitionMotivation with replay activity', () => {
        const snapshot = createTestSnapshot();
        const feltState = createTestFeltState();
        const arousalAwareness = createTestArousalAwareness();
        const livingState = createTestLivingState();
        const energyState = createTestEnergyState();
        const homeostaticState = createTestHomeostaticState();

        // No replay baseline
        const noReplayState = createTestReplayState();
        const baseline = deriveNeedMotivation(
            snapshot,
            feltState,
            arousalAwareness,
            noReplayState,
            livingState,
            energyState,
            homeostaticState,
            null
        );

        // With replay activity
        const withReplayState = {
            ...createTestReplayState(),
            recentReplaySalience: 0.7,
            restConsolidationDepth: 0.6,
        };
        const withReplay = deriveNeedMotivation(
            snapshot,
            { ...feltState, coherence: 0.9 },
            { ...arousalAwareness, settlingWindow: 0.7 },
            withReplayState,
            livingState,
            energyState,
            homeostaticState,
            null
        );

        expect(withReplay.repetitionMotivation).toBeGreaterThan(baseline.repetitionMotivation);
    });

    it('should NOT always align need and motivation', () => {
        const snapshot = createTestSnapshot();
        const replayState = createTestReplayState();
        const livingState = createTestLivingState();

        // High energy need BUT low exploration motivation
        // (depleted state with low arousal/awareness)
        const depletedFeltState = {
            ...createTestFeltState(),
            depletion: 0.9,
            overload: 0.1,
            openness: 0.2,
        };
        const depletedEnergyState = { ...createTestEnergyState(), energyReserve: 0.2 };
        const lowArousalAwareness = {
            ...createTestArousalAwareness(),
            arousalLevel: 0.15,
            awarenessWindow: 0.3,
            salienceOpenness: 0.2,
        };
        const homeostaticState = createTestHomeostaticState();

        const result = deriveNeedMotivation(
            snapshot,
            depletedFeltState,
            lowArousalAwareness,
            replayState,
            livingState,
            depletedEnergyState,
            homeostaticState,
            null
        );

        // Should have high energy need
        expect(result.energyNeed).toBeGreaterThan(0.3);

        // But low exploration motivation (because low arousal/awareness/openness)
        expect(result.explorationMotivation).toBeLessThan(0.4);

        // This demonstrates independence
    });

    it('should allow high motivation with low need', () => {
        const snapshot = createTestSnapshot();
        const replayState = createTestReplayState();
        const livingState = createTestLivingState();

        // Low energy need (well-rested) BUT moderate novelty motivation
        const restedFeltState = {
            ...createTestFeltState(),
            depletion: 0.1,
            overload: 0.2,
            openness: 0.7,
            perturbationLoad: 0.3,
        };
        const restedEnergyState = { ...createTestEnergyState(), energyReserve: 0.9 };
        const moderateArousalAwareness = {
            ...createTestArousalAwareness(),
            arousalLevel: 0.5,
            awarenessWindow: 0.7,
            salienceOpenness: 0.6,
        };
        const homeostaticState = createTestHomeostaticState();

        const result = deriveNeedMotivation(
            snapshot,
            restedFeltState,
            moderateArousalAwareness,
            replayState,
            livingState,
            restedEnergyState,
            homeostaticState,
            null
        );

        // Should have low energy need
        expect(result.energyNeed).toBeLessThan(0.3);

        // But moderate novelty/exploration motivation
        expect(result.noveltyMotivation).toBeGreaterThan(0.2);
        expect(result.explorationMotivation).toBeGreaterThan(0.2);

        // This demonstrates independence
    });

    it('should show withdrawMotivation under high safetyNeed and overload', () => {
        const snapshot = createTestSnapshot();
        const replayState = createTestReplayState();
        const livingState = createTestLivingState();
        const energyState = createTestEnergyState();
        const arousalAwareness = createTestArousalAwareness();

        // High overload / boundary threat
        const threatenedFeltState = {
            ...createTestFeltState(),
            overload: 1.2,
            boundaryIntegrity: 0.3,
            perturbationLoad: 0.9,
        };
        const threatenedHomeostaticState = {
            ...createTestHomeostaticState(),
            stabilityIndex: 0.2,
        };

        const result = deriveNeedMotivation(
            snapshot,
            threatenedFeltState,
            arousalAwareness,
            replayState,
            livingState,
            energyState,
            threatenedHomeostaticState,
            null
        );

        expect(result.safetyNeed).toBeGreaterThan(0.5);
        expect(result.withdrawMotivation).toBeGreaterThan(0.4);
    });

    it('should show settlingMotivation with restoration readiness', () => {
        const snapshot = createTestSnapshot();
        const replayState = createTestReplayState();
        const livingState = createTestLivingState();
        const energyState = createTestEnergyState();
        const homeostaticState = createTestHomeostaticState();

        // High restoration readiness
        const restorativeFeltState = {
            ...createTestFeltState(),
            restorationReadiness: 0.8,
            coherence: 0.85,
        };
        const restorativeArousalAwareness = {
            ...createTestArousalAwareness(),
            settlingWindow: 0.7,
            restDepth: 0.6,
        };

        const result = deriveNeedMotivation(
            snapshot,
            restorativeFeltState,
            restorativeArousalAwareness,
            replayState,
            livingState,
            energyState,
            homeostaticState,
            null
        );

        expect(result.settlingMotivation).toBeGreaterThan(0.4);
    });

    it('should show competition between motivations', () => {
        const snapshot = createTestSnapshot();
        const replayState = {
            ...createTestReplayState(),
            recentReplaySalience: 0.6,
        };
        const livingState = createTestLivingState();
        const energyState = createTestEnergyState();
        const homeostaticState = createTestHomeostaticState();

        // Conditions favorable to both novelty AND repetition
        const mixedFeltState = {
            ...createTestFeltState(),
            coherence: 0.75,
            perturbationLoad: 0.4,
            openness: 0.6,
        };
        const mixedArousalAwareness = {
            ...createTestArousalAwareness(),
            arousalLevel: 0.5,
            awarenessWindow: 0.6,
            salienceOpenness: 0.55,
            settlingWindow: 0.6,
        };

        const result = deriveNeedMotivation(
            snapshot,
            mixedFeltState,
            mixedArousalAwareness,
            replayState,
            livingState,
            energyState,
            homeostaticState,
            null
        );

        // Both should be present (not mutually exclusive)
        expect(result.noveltyMotivation).toBeGreaterThan(0.15);
        expect(result.repetitionMotivation).toBeGreaterThan(0.15);

        // They need not be equal
        // This is a valid outcome
    });
});
