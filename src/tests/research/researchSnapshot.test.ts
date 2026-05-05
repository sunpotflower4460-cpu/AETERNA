import { describe, expect, it } from 'vitest';
import { createResearchSnapshot } from '../../research/createResearchSnapshot.js';

describe('createResearchSnapshot', () => {
    it('creates a lightweight snapshot from available observer state', () => {
        const snapshot = createResearchSnapshot({
            tick: 50,
            timestamp: 1000,
            runtimeConfig: {
                metricMode: 'curved',
                fieldRuntimeMode: 'complexObserver',
                membraneMode: 'observerOnly',
                weakPlasticityMode: 'observeOnly',
                externalConstantsMode: 'neutral',
                safetyMode: 'research',
            },
            overview: {
                metrics: [
                    { id: 'flowContinuity', value: 0.6 },
                    { id: 'energyThroughput', value: 0.4 },
                    { id: 'saturationRisk', value: 0.2 },
                ],
            },
            complexField: {
                phaseCoherence: 0.7,
                maxAmplitude: 1.2,
                averageAmplitude: 0.8,
            },
            vortexObservation: {
                candidateCount: 4,
                positiveChargeCount: 2,
                negativeChargeCount: 2,
                totalTopologicalCharge: 0,
                averageConfidence: 0.5,
            },
            curvatureVortexCoupling: {
                chargeDeviation: 0.1,
                curvatureVortexCorrelation: 0.25,
                curvatureBiasStrength: 0.3,
            },
            membraneObservation: {
                averageTwoSidedness: 0.44,
                actuationReturnOverlap: 0.22,
                membraneIntegrity: 0.9,
            },
            weakPlasticityObservation: {
                totalAccumulation: 0.13,
                affectedRegionCount: 5,
                averageResistanceScale: 1.01,
                plasticitySaturationRisk: 0.09,
            },
            observedRatios: {
                averageMatchStrength: 0.52,
                emergentResonanceProxy: 0.31,
                strongestMatch: { referenceRatioId: 'phi' },
            },
            diagnostics: {
                semanticLeakCount: 0,
                totalNanOrInfinityCount: 0,
                clampEventCount: 1,
                safetyWarnings: ['watch saturation'],
            },
        });

        expect(snapshot.runtimeMode.metricMode).toBe('curved');
        expect(snapshot.field.flowContinuity).toBe(0.6);
        expect(snapshot.vortex.candidateCount).toBe(4);
        expect(snapshot.ratios.strongestReferenceMatchLabel).toBe('phi');
        expect(snapshot.diagnostics.clampEventCount).toBe(1);
    });

    it('does not throw when observer state is missing', () => {
        expect(() => createResearchSnapshot({
            tick: 10,
            timestamp: 100,
            runtimeConfig: {},
        })).not.toThrow();
    });

    it('does not export NaN / Infinity values directly', () => {
        const snapshot = createResearchSnapshot({
            tick: 5,
            timestamp: 50,
            runtimeConfig: {},
            complexField: {
                phaseCoherence: Number.NaN,
                maxAmplitude: Number.POSITIVE_INFINITY,
                averageAmplitude: 0.5,
            },
            diagnostics: {
                totalNanOrInfinityCount: 2,
            },
        });

        expect(snapshot.field.phaseCoherence).toBeUndefined();
        expect(snapshot.field.maxAmplitude).toBeUndefined();
        expect(snapshot.diagnostics.nanOrInfinityCount).toBeGreaterThanOrEqual(2);
        expect(JSON.parse(JSON.stringify(snapshot)).field.phaseCoherence).toBeUndefined();
        expect(JSON.parse(JSON.stringify(snapshot)).field.maxAmplitude).toBeUndefined();
    });
});
