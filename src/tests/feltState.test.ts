/**
 * Felt-State Tests
 *
 * AETERNA v0.5 / A1: Felt-State / Interoception Expansion
 *
 * Tests for FeltStateVector derivation and interoception integration.
 */

import { describe, it, expect } from 'vitest';
import { deriveFeltState } from '../organism/deriveFeltState.ts';
import type { FeltStateVector } from '../types/feltState.ts';
import type { OrganismSnapshot } from '../types/organismSnapshot.ts';
import type { OrganismLivingState, OrganismHomeostaticState, OrganismEnergyState } from '../types/organismState.ts';
import type { SelfWorldModelPacket } from '../types/selfWorldModel.ts';

describe('Felt-State Vector', () => {
    it('should derive felt-state from typical organism state', () => {
        const snapshot: OrganismSnapshot = {
            timestamp: 100,
            energy: 0.7,
            overload: 0.3,
            coherence: 0.8,
            boundary: 0.75,
            modeState: 'wake',
            touchExpectationConfidence: 0.6,
            recentPerturbationPressure: 0.2,
            meanPredictionError: 0.15,
            restorationBias: 0.5,
            coherenceMemory: 0.7,
            recentTouchActivity: 0.4,
        };

        const livingState: OrganismLivingState = {
            fatigue: 0.2,
            coherenceMemory: 0.7,
            preferredErgodicity: 0.5,
            longBaselineTone: 0.12,
            recentHistoryBias: 0.1,
            residueBias: 0.5,
            predictionSensitivity: 0.5,
            touchNeedBaseline: 0.6,
            lastMajorPerturbationAt: 0,
            stabilityMemory: 0.7,
            overloadMemory: 0.2,
        };

        const homeostaticState: OrganismHomeostaticState = {
            stabilityIndex: 0.8,
            boundaryIntegrity: 0.75,
            selfPreservationBias: 0.5,
            irritabilityLevel: 0.3,
            restorationBias: 0.5,
            collapseRisk: 0.1,
            homeostaticStress: 0.3,
            preferredStabilityBand: 0.6,
            consecutiveQuietFrames: 50,
        };

        const energyState: OrganismEnergyState = {
            energyReserve: 0.7,
            energyInflow: 0.05,
            energyOutflow: 0.03,
            maintenanceCost: 0.02,
            activityCost: 0.01,
            rewriteCost: 0.005,
            structuralIntegrity: 0.9,
            lowEnergyPressure: 0.2,
            recoveryDrive: 0.4,
            wasDormantByEnergy: false,
        };

        const feltState = deriveFeltState(snapshot, livingState, homeostaticState, energyState);

        expect(feltState.timestamp).toBe(100);
        expect(feltState.depletion).toBeGreaterThanOrEqual(0);
        expect(feltState.depletion).toBeLessThan(1);
        expect(feltState.overload).toBeGreaterThanOrEqual(0);
        expect(feltState.overload).toBeLessThan(1.5);
        expect(feltState.coherence).toBeGreaterThanOrEqual(0);
        expect(feltState.coherence).toBeLessThanOrEqual(1);
        expect(feltState.boundaryIntegrity).toBeGreaterThanOrEqual(0);
        expect(feltState.boundaryIntegrity).toBeLessThanOrEqual(1);
        expect(feltState.restorationReadiness).toBeGreaterThanOrEqual(0);
        expect(feltState.restorationReadiness).toBeLessThanOrEqual(1);
        expect(feltState.perturbationLoad).toBeGreaterThanOrEqual(0);
        expect(feltState.perturbationLoad).toBeLessThan(1.5);
        expect(feltState.openness).toBeGreaterThanOrEqual(0);
        expect(feltState.openness).toBeLessThanOrEqual(1);
    });

    it('should handle low-energy depleted state', () => {
        const snapshot: OrganismSnapshot = {
            timestamp: 200,
            energy: 0.1,
            overload: 0.2,
            coherence: 0.5,
            boundary: 0.6,
            modeState: 'wake',
            touchExpectationConfidence: 0.5,
            recentPerturbationPressure: 0.1,
            meanPredictionError: 0.1,
            restorationBias: 0.7,
            coherenceMemory: 0.5,
            recentTouchActivity: 0.1,
        };

        const livingState: OrganismLivingState = {
            fatigue: 0.7,
            coherenceMemory: 0.5,
            preferredErgodicity: 0.5,
            longBaselineTone: 0.12,
            recentHistoryBias: 0,
            residueBias: 0.5,
            predictionSensitivity: 0.5,
            touchNeedBaseline: 0.5,
            lastMajorPerturbationAt: 0,
            stabilityMemory: 0.5,
            overloadMemory: 0.1,
        };

        const homeostaticState: OrganismHomeostaticState = {
            stabilityIndex: 0.6,
            boundaryIntegrity: 0.6,
            selfPreservationBias: 0.5,
            irritabilityLevel: 0.2,
            restorationBias: 0.7,
            collapseRisk: 0.3,
            homeostaticStress: 0.2,
            preferredStabilityBand: 0.6,
            consecutiveQuietFrames: 30,
        };

        const energyState: OrganismEnergyState = {
            energyReserve: 0.1,
            energyInflow: 0.02,
            energyOutflow: 0.08,
            maintenanceCost: 0.02,
            activityCost: 0.03,
            rewriteCost: 0.01,
            structuralIntegrity: 0.7,
            lowEnergyPressure: 0.8,
            recoveryDrive: 0.7,
            wasDormantByEnergy: false,
        };

        const feltState = deriveFeltState(snapshot, livingState, homeostaticState, energyState);

        // Low energy + high fatigue should result in high depletion
        expect(feltState.depletion).toBeGreaterThan(0.5);

        // Restoration readiness should be relatively high
        expect(feltState.restorationReadiness).toBeGreaterThan(0.4);

        // No NaN values
        expect(Number.isNaN(feltState.depletion)).toBe(false);
        expect(Number.isNaN(feltState.overload)).toBe(false);
        expect(Number.isNaN(feltState.coherence)).toBe(false);
    });

    it('should handle high-overload stressed state', () => {
        const snapshot: OrganismSnapshot = {
            timestamp: 300,
            energy: 0.6,
            overload: 0.9,
            coherence: 0.3,
            boundary: 0.4,
            modeState: 'wake',
            touchExpectationConfidence: 0.4,
            recentPerturbationPressure: 0.8,
            meanPredictionError: 0.7,
            restorationBias: 0.3,
            coherenceMemory: 0.3,
            recentTouchActivity: 0.9,
        };

        const livingState: OrganismLivingState = {
            fatigue: 0.5,
            coherenceMemory: 0.3,
            preferredErgodicity: 0.5,
            longBaselineTone: 0.12,
            recentHistoryBias: 0.4,
            residueBias: 0.5,
            predictionSensitivity: 0.7,
            touchNeedBaseline: 0.4,
            lastMajorPerturbationAt: 250,
            stabilityMemory: 0.3,
            overloadMemory: 0.7,
        };

        const homeostaticState: OrganismHomeostaticState = {
            stabilityIndex: 0.3,
            boundaryIntegrity: 0.4,
            selfPreservationBias: 0.7,
            irritabilityLevel: 0.8,
            restorationBias: 0.3,
            collapseRisk: 0.6,
            homeostaticStress: 0.8,
            preferredStabilityBand: 0.6,
            consecutiveQuietFrames: 0,
        };

        const energyState: OrganismEnergyState = {
            energyReserve: 0.6,
            energyInflow: 0.04,
            energyOutflow: 0.06,
            maintenanceCost: 0.02,
            activityCost: 0.03,
            rewriteCost: 0.01,
            structuralIntegrity: 0.5,
            lowEnergyPressure: 0.3,
            recoveryDrive: 0.3,
            wasDormantByEnergy: false,
        };

        const feltState = deriveFeltState(snapshot, livingState, homeostaticState, energyState);

        // High overload + high irritability should result in high felt overload
        expect(feltState.overload).toBeGreaterThan(0.5);

        // High perturbation should result in high perturbation load
        expect(feltState.perturbationLoad).toBeGreaterThan(0.4);

        // Low coherence should be reflected
        expect(feltState.coherence).toBeLessThan(0.5);

        // Boundary integrity should be low
        expect(feltState.boundaryIntegrity).toBeLessThan(0.6);

        // No NaN values
        expect(Number.isNaN(feltState.overload)).toBe(false);
        expect(Number.isNaN(feltState.perturbationLoad)).toBe(false);
        expect(Number.isNaN(feltState.boundaryIntegrity)).toBe(false);
    });

    it('should handle quiet recovery state', () => {
        const snapshot: OrganismSnapshot = {
            timestamp: 400,
            energy: 0.8,
            overload: 0.1,
            coherence: 0.85,
            boundary: 0.85,
            modeState: 'sleep',
            touchExpectationConfidence: 0.7,
            recentPerturbationPressure: 0.05,
            meanPredictionError: 0.05,
            restorationBias: 0.8,
            coherenceMemory: 0.85,
            recentTouchActivity: 0.05,
        };

        const livingState: OrganismLivingState = {
            fatigue: 0.15,
            coherenceMemory: 0.85,
            preferredErgodicity: 0.5,
            longBaselineTone: 0.12,
            recentHistoryBias: 0,
            residueBias: 0.5,
            predictionSensitivity: 0.4,
            touchNeedBaseline: 0.5,
            lastMajorPerturbationAt: 100,
            stabilityMemory: 0.85,
            overloadMemory: 0.05,
        };

        const homeostaticState: OrganismHomeostaticState = {
            stabilityIndex: 0.9,
            boundaryIntegrity: 0.85,
            selfPreservationBias: 0.5,
            irritabilityLevel: 0.1,
            restorationBias: 0.8,
            collapseRisk: 0.05,
            homeostaticStress: 0.1,
            preferredStabilityBand: 0.6,
            consecutiveQuietFrames: 150,
        };

        const energyState: OrganismEnergyState = {
            energyReserve: 0.8,
            energyInflow: 0.05,
            energyOutflow: 0.02,
            maintenanceCost: 0.02,
            activityCost: 0.005,
            rewriteCost: 0.001,
            structuralIntegrity: 0.95,
            lowEnergyPressure: 0.1,
            recoveryDrive: 0.6,
            wasDormantByEnergy: false,
        };

        const feltState = deriveFeltState(snapshot, livingState, homeostaticState, energyState);

        // Low depletion in recovery state
        expect(feltState.depletion).toBeLessThan(0.4);

        // Low overload
        expect(feltState.overload).toBeLessThan(0.3);

        // High coherence
        expect(feltState.coherence).toBeGreaterThan(0.7);

        // High boundary integrity
        expect(feltState.boundaryIntegrity).toBeGreaterThan(0.7);

        // High restoration readiness
        expect(feltState.restorationReadiness).toBeGreaterThan(0.6);

        // Low perturbation load
        expect(feltState.perturbationLoad).toBeLessThan(0.3);
    });

    it('should integrate with self-world packet for richer felt-state', () => {
        const snapshot: OrganismSnapshot = {
            timestamp: 500,
            energy: 0.7,
            overload: 0.3,
            coherence: 0.75,
            boundary: 0.7,
            modeState: 'wake',
            touchExpectationConfidence: 0.6,
            recentPerturbationPressure: 0.2,
            meanPredictionError: 0.15,
            restorationBias: 0.5,
            coherenceMemory: 0.7,
            recentTouchActivity: 0.5,
        };

        const livingState: OrganismLivingState = {
            fatigue: 0.2,
            coherenceMemory: 0.7,
            preferredErgodicity: 0.5,
            longBaselineTone: 0.12,
            recentHistoryBias: 0.1,
            residueBias: 0.5,
            predictionSensitivity: 0.5,
            touchNeedBaseline: 0.6,
            lastMajorPerturbationAt: 0,
            stabilityMemory: 0.7,
            overloadMemory: 0.2,
        };

        const homeostaticState: OrganismHomeostaticState = {
            stabilityIndex: 0.75,
            boundaryIntegrity: 0.7,
            selfPreservationBias: 0.5,
            irritabilityLevel: 0.3,
            restorationBias: 0.5,
            collapseRisk: 0.15,
            homeostaticStress: 0.3,
            preferredStabilityBand: 0.6,
            consecutiveQuietFrames: 40,
        };

        const energyState: OrganismEnergyState = {
            energyReserve: 0.7,
            energyInflow: 0.05,
            energyOutflow: 0.03,
            maintenanceCost: 0.02,
            activityCost: 0.01,
            rewriteCost: 0.005,
            structuralIntegrity: 0.85,
            lowEnergyPressure: 0.2,
            recoveryDrive: 0.4,
            wasDormantByEnergy: false,
        };

        const selfWorldPacket: SelfWorldModelPacket = {
            timestamp: 500,
            selfCoherence: 0.8,
            selfContinuity: 0.75,
            worldPressure: 0.3,
            relationEngagement: 0.7,
        };

        const feltStateWithSelfWorld = deriveFeltState(
            snapshot,
            livingState,
            homeostaticState,
            energyState,
            selfWorldPacket
        );

        const feltStateWithoutSelfWorld = deriveFeltState(
            snapshot,
            livingState,
            homeostaticState,
            energyState,
            null
        );

        // With self-world packet, coherence should incorporate selfCoherence
        expect(feltStateWithSelfWorld.coherence).toBeDefined();
        expect(feltStateWithoutSelfWorld.coherence).toBeDefined();

        // Openness should be influenced by relationEngagement
        expect(feltStateWithSelfWorld.openness).toBeDefined();
        expect(feltStateWithoutSelfWorld.openness).toBeDefined();

        // Both should be valid
        expect(Number.isNaN(feltStateWithSelfWorld.coherence)).toBe(false);
        expect(Number.isNaN(feltStateWithoutSelfWorld.coherence)).toBe(false);
    });

    it('should not produce NaN values with extreme inputs', () => {
        const snapshot: OrganismSnapshot = {
            timestamp: 600,
            energy: 0,
            overload: 2.0,
            coherence: 0,
            boundary: 0,
            modeState: 'wake',
            touchExpectationConfidence: 0,
            recentPerturbationPressure: 2.0,
            meanPredictionError: 2.0,
            restorationBias: 0,
            coherenceMemory: 0,
            recentTouchActivity: 0,
        };

        const livingState: OrganismLivingState = {
            fatigue: 0.8,
            coherenceMemory: 0,
            preferredErgodicity: 0.5,
            longBaselineTone: 0.12,
            recentHistoryBias: 0,
            residueBias: 0.5,
            predictionSensitivity: 0.5,
            touchNeedBaseline: 0,
            lastMajorPerturbationAt: 0,
            stabilityMemory: 0,
            overloadMemory: 0.8,
        };

        const homeostaticState: OrganismHomeostaticState = {
            stabilityIndex: 0,
            boundaryIntegrity: 0,
            selfPreservationBias: 0.5,
            irritabilityLevel: 1.0,
            restorationBias: 0,
            collapseRisk: 1.0,
            homeostaticStress: 1.0,
            preferredStabilityBand: 0.6,
            consecutiveQuietFrames: 0,
        };

        const energyState: OrganismEnergyState = {
            energyReserve: 0,
            energyInflow: 0,
            energyOutflow: 0.1,
            maintenanceCost: 0.02,
            activityCost: 0.05,
            rewriteCost: 0.02,
            structuralIntegrity: 0.2,
            lowEnergyPressure: 1.0,
            recoveryDrive: 0,
            wasDormantByEnergy: true,
        };

        const feltState = deriveFeltState(snapshot, livingState, homeostaticState, energyState);

        // All values should be finite
        expect(Number.isFinite(feltState.depletion)).toBe(true);
        expect(Number.isFinite(feltState.overload)).toBe(true);
        expect(Number.isFinite(feltState.coherence)).toBe(true);
        expect(Number.isFinite(feltState.boundaryIntegrity)).toBe(true);
        expect(Number.isFinite(feltState.restorationReadiness)).toBe(true);
        expect(Number.isFinite(feltState.perturbationLoad)).toBe(true);
        expect(Number.isFinite(feltState.openness)).toBe(true);

        // No NaN
        expect(Number.isNaN(feltState.depletion)).toBe(false);
        expect(Number.isNaN(feltState.overload)).toBe(false);
        expect(Number.isNaN(feltState.coherence)).toBe(false);
        expect(Number.isNaN(feltState.boundaryIntegrity)).toBe(false);
        expect(Number.isNaN(feltState.restorationReadiness)).toBe(false);
        expect(Number.isNaN(feltState.perturbationLoad)).toBe(false);
        expect(Number.isNaN(feltState.openness)).toBe(false);
    });
});
