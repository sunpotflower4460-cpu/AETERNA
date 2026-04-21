/**
 * Open-State Snapshot Tests
 *
 * AETERNA v0.5 / Quantum-Inspired Q1-1
 *
 * Verify that OpenStateSnapshot is correctly generated and valid.
 */

import { describe, it, expect } from 'vitest';
import { deriveOpenStateSnapshot } from '../organism/deriveOpenStateSnapshot.ts';
import type { FeltStateVector } from '../types/feltState.ts';
import type { ArousalAwarenessState } from '../types/arousalAwareness.ts';
import type { NeedMotivationState } from '../types/needMotivation.ts';

describe('Open-State Snapshot', () => {
    describe('deriveOpenStateSnapshot', () => {
        it('should generate valid OpenStateSnapshot from component states', () => {
            const feltState: FeltStateVector = {
                timestamp: 100,
                depletion: 0.3,
                overload: 0.2,
                coherence: 0.7,
                boundaryIntegrity: 0.8,
                restorationReadiness: 0.5,
                perturbationLoad: 0.3,
                openness: 0.6,
            };

            const arousalAwareness: ArousalAwarenessState = {
                timestamp: 100,
                arousalLevel: 0.4,
                awarenessWindow: 0.6,
                salienceOpenness: 0.5,
                foregroundPressure: 0.3,
                restDepth: 0.4,
                hyperreactivity: 0.2,
                settlingWindow: 0.5,
            };

            const needMotivation: NeedMotivationState = {
                timestamp: 100,
                energyNeed: 0.3,
                safetyNeed: 0.2,
                restorationNeed: 0.4,
                contactNeed: 0.2,
                noveltyMotivation: 0.5,
                repetitionMotivation: 0.3,
                explorationMotivation: 0.4,
                settlingMotivation: 0.5,
                withdrawMotivation: 0.1,
            };

            const snapshot = deriveOpenStateSnapshot(feltState, arousalAwareness, needMotivation);

            expect(snapshot.timestamp).toBe(100);
            expect(snapshot.feltMix.depletion).toBe(0.3);
            expect(snapshot.activationMix.arousalLevel).toBe(0.4);
            expect(snapshot.driveMix.energyNeed).toBe(0.3);
        });

        it('should produce finite stabilityIndex', () => {
            const feltState: FeltStateVector = {
                timestamp: 100,
                depletion: 0.2,
                overload: 0.3,
                coherence: 0.8,
                boundaryIntegrity: 0.7,
                restorationReadiness: 0.6,
                perturbationLoad: 0.2,
                openness: 0.5,
            };

            const arousalAwareness: ArousalAwarenessState = {
                timestamp: 100,
                arousalLevel: 0.3,
                awarenessWindow: 0.7,
                salienceOpenness: 0.6,
                foregroundPressure: 0.2,
                restDepth: 0.5,
                hyperreactivity: 0.1,
                settlingWindow: 0.6,
            };

            const needMotivation: NeedMotivationState = {
                timestamp: 100,
                energyNeed: 0.2,
                safetyNeed: 0.3,
                restorationNeed: 0.4,
                contactNeed: 0.2,
                noveltyMotivation: 0.4,
                repetitionMotivation: 0.3,
                explorationMotivation: 0.3,
                settlingMotivation: 0.6,
                withdrawMotivation: 0.2,
            };

            const snapshot = deriveOpenStateSnapshot(feltState, arousalAwareness, needMotivation);

            expect(Number.isFinite(snapshot.stabilityIndex)).toBe(true);
            expect(snapshot.stabilityIndex).toBeGreaterThanOrEqual(0);
            expect(snapshot.stabilityIndex).toBeLessThanOrEqual(1);
        });

        it('should produce finite mixtureEntropy', () => {
            const feltState: FeltStateVector = {
                timestamp: 100,
                depletion: 0.4,
                overload: 0.3,
                coherence: 0.6,
                boundaryIntegrity: 0.7,
                restorationReadiness: 0.5,
                perturbationLoad: 0.4,
                openness: 0.5,
            };

            const arousalAwareness: ArousalAwarenessState = {
                timestamp: 100,
                arousalLevel: 0.5,
                awarenessWindow: 0.5,
                salienceOpenness: 0.5,
                foregroundPressure: 0.4,
                restDepth: 0.4,
                hyperreactivity: 0.3,
                settlingWindow: 0.5,
            };

            const needMotivation: NeedMotivationState = {
                timestamp: 100,
                energyNeed: 0.4,
                safetyNeed: 0.3,
                restorationNeed: 0.3,
                contactNeed: 0.3,
                noveltyMotivation: 0.4,
                repetitionMotivation: 0.4,
                explorationMotivation: 0.4,
                settlingMotivation: 0.4,
                withdrawMotivation: 0.3,
            };

            const snapshot = deriveOpenStateSnapshot(feltState, arousalAwareness, needMotivation);

            expect(Number.isFinite(snapshot.mixtureEntropy)).toBe(true);
            expect(snapshot.mixtureEntropy).toBeGreaterThanOrEqual(0);
        });

        it('should detect overload-dominant pole', () => {
            const feltState: FeltStateVector = {
                timestamp: 100,
                depletion: 0.2,
                overload: 0.9, // High overload
                coherence: 0.5,
                boundaryIntegrity: 0.4,
                restorationReadiness: 0.3,
                perturbationLoad: 0.8,
                openness: 0.3,
            };

            const arousalAwareness: ArousalAwarenessState = {
                timestamp: 100,
                arousalLevel: 0.7,
                awarenessWindow: 0.3,
                salienceOpenness: 0.4,
                foregroundPressure: 0.8,
                restDepth: 0.2,
                hyperreactivity: 0.7,
                settlingWindow: 0.2,
            };

            const needMotivation: NeedMotivationState = {
                timestamp: 100,
                energyNeed: 0.3,
                safetyNeed: 0.9, // High safety need
                restorationNeed: 0.2,
                contactNeed: 0.1,
                noveltyMotivation: 0.1,
                repetitionMotivation: 0.2,
                explorationMotivation: 0.1,
                settlingMotivation: 0.2,
                withdrawMotivation: 0.8,
            };

            const snapshot = deriveOpenStateSnapshot(feltState, arousalAwareness, needMotivation);

            expect(snapshot.dominantPole).toBe('overload');
        });

        it('should detect restoration-dominant pole', () => {
            const feltState: FeltStateVector = {
                timestamp: 100,
                depletion: 0.2,
                overload: 0.1,
                coherence: 0.8,
                boundaryIntegrity: 0.8,
                restorationReadiness: 0.9, // High restoration readiness
                perturbationLoad: 0.1,
                openness: 0.6,
            };

            const arousalAwareness: ArousalAwarenessState = {
                timestamp: 100,
                arousalLevel: 0.2,
                awarenessWindow: 0.7,
                salienceOpenness: 0.5,
                foregroundPressure: 0.1,
                restDepth: 0.8,
                hyperreactivity: 0.1,
                settlingWindow: 0.8,
            };

            const needMotivation: NeedMotivationState = {
                timestamp: 100,
                energyNeed: 0.1,
                safetyNeed: 0.1,
                restorationNeed: 0.8, // High restoration need
                contactNeed: 0.2,
                noveltyMotivation: 0.1,
                repetitionMotivation: 0.3,
                explorationMotivation: 0.1,
                settlingMotivation: 0.8,
                withdrawMotivation: 0.1,
            };

            const snapshot = deriveOpenStateSnapshot(feltState, arousalAwareness, needMotivation);

            expect(snapshot.dominantPole).toBe('restoration');
        });

        it('should detect neutral-mixed state when no pole dominates', () => {
            const feltState: FeltStateVector = {
                timestamp: 100,
                depletion: 0.3,
                overload: 0.3,
                coherence: 0.6,
                boundaryIntegrity: 0.6,
                restorationReadiness: 0.5,
                perturbationLoad: 0.3,
                openness: 0.5,
            };

            const arousalAwareness: ArousalAwarenessState = {
                timestamp: 100,
                arousalLevel: 0.4,
                awarenessWindow: 0.5,
                salienceOpenness: 0.5,
                foregroundPressure: 0.3,
                restDepth: 0.4,
                hyperreactivity: 0.3,
                settlingWindow: 0.5,
            };

            const needMotivation: NeedMotivationState = {
                timestamp: 100,
                energyNeed: 0.3,
                safetyNeed: 0.3,
                restorationNeed: 0.3,
                contactNeed: 0.3,
                noveltyMotivation: 0.4,
                repetitionMotivation: 0.4,
                explorationMotivation: 0.4,
                settlingMotivation: 0.4,
                withdrawMotivation: 0.3,
            };

            const snapshot = deriveOpenStateSnapshot(feltState, arousalAwareness, needMotivation);

            expect(snapshot.dominantPole).toBe('neutral-mixed');
        });

        it('should never produce NaN values', () => {
            // Test with extreme values
            const feltState: FeltStateVector = {
                timestamp: 100,
                depletion: 1.5,
                overload: 1.5,
                coherence: 1.0,
                boundaryIntegrity: 1.0,
                restorationReadiness: 1.0,
                perturbationLoad: 1.5,
                openness: 1.0,
            };

            const arousalAwareness: ArousalAwarenessState = {
                timestamp: 100,
                arousalLevel: 1.0,
                awarenessWindow: 1.0,
                salienceOpenness: 1.0,
                foregroundPressure: 1.0,
                restDepth: 1.0,
                hyperreactivity: 1.0,
                settlingWindow: 1.0,
            };

            const needMotivation: NeedMotivationState = {
                timestamp: 100,
                energyNeed: 1.2,
                safetyNeed: 1.2,
                restorationNeed: 1.0,
                contactNeed: 1.0,
                noveltyMotivation: 1.0,
                repetitionMotivation: 1.0,
                explorationMotivation: 1.0,
                settlingMotivation: 1.0,
                withdrawMotivation: 1.0,
            };

            const snapshot = deriveOpenStateSnapshot(feltState, arousalAwareness, needMotivation);

            expect(Number.isNaN(snapshot.stabilityIndex)).toBe(false);
            expect(Number.isNaN(snapshot.mixtureEntropy)).toBe(false);
            expect(Number.isNaN(snapshot.feltMix.depletion)).toBe(false);
            expect(Number.isNaN(snapshot.activationMix.arousalLevel)).toBe(false);
            expect(Number.isNaN(snapshot.driveMix.energyNeed)).toBe(false);
        });

        it('should handle zero values gracefully', () => {
            const feltState: FeltStateVector = {
                timestamp: 100,
                depletion: 0,
                overload: 0,
                coherence: 0,
                boundaryIntegrity: 0,
                restorationReadiness: 0,
                perturbationLoad: 0,
                openness: 0,
            };

            const arousalAwareness: ArousalAwarenessState = {
                timestamp: 100,
                arousalLevel: 0,
                awarenessWindow: 0,
                salienceOpenness: 0,
                foregroundPressure: 0,
                restDepth: 0,
                hyperreactivity: 0,
                settlingWindow: 0,
            };

            const needMotivation: NeedMotivationState = {
                timestamp: 100,
                energyNeed: 0,
                safetyNeed: 0,
                restorationNeed: 0,
                contactNeed: 0,
                noveltyMotivation: 0,
                repetitionMotivation: 0,
                explorationMotivation: 0,
                settlingMotivation: 0,
                withdrawMotivation: 0,
            };

            const snapshot = deriveOpenStateSnapshot(feltState, arousalAwareness, needMotivation);

            expect(Number.isFinite(snapshot.stabilityIndex)).toBe(true);
            expect(Number.isFinite(snapshot.mixtureEntropy)).toBe(true);
            expect(snapshot.dominantPole).not.toBeNull();
        });

        it('should show higher stability with coherent state', () => {
            const coherentFelt: FeltStateVector = {
                timestamp: 100,
                depletion: 0.2,
                overload: 0.1,
                coherence: 0.9, // High coherence
                boundaryIntegrity: 0.9, // High boundary
                restorationReadiness: 0.7,
                perturbationLoad: 0.1,
                openness: 0.6,
            };

            const chaoticFelt: FeltStateVector = {
                timestamp: 100,
                depletion: 0.6,
                overload: 0.8, // High overload
                coherence: 0.3, // Low coherence
                boundaryIntegrity: 0.3, // Low boundary
                restorationReadiness: 0.3,
                perturbationLoad: 0.9,
                openness: 0.2,
            };

            const arousalAwareness: ArousalAwarenessState = {
                timestamp: 100,
                arousalLevel: 0.4,
                awarenessWindow: 0.5,
                salienceOpenness: 0.5,
                foregroundPressure: 0.3,
                restDepth: 0.4,
                hyperreactivity: 0.2,
                settlingWindow: 0.5,
            };

            const needMotivation: NeedMotivationState = {
                timestamp: 100,
                energyNeed: 0.3,
                safetyNeed: 0.3,
                restorationNeed: 0.3,
                contactNeed: 0.3,
                noveltyMotivation: 0.4,
                repetitionMotivation: 0.4,
                explorationMotivation: 0.4,
                settlingMotivation: 0.4,
                withdrawMotivation: 0.3,
            };

            const coherentSnapshot = deriveOpenStateSnapshot(coherentFelt, arousalAwareness, needMotivation);
            const chaoticSnapshot = deriveOpenStateSnapshot(chaoticFelt, arousalAwareness, needMotivation);

            expect(coherentSnapshot.stabilityIndex).toBeGreaterThan(chaoticSnapshot.stabilityIndex);
        });
    });
});
