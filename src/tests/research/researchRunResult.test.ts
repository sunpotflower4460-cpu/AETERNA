import { describe, expect, it } from 'vitest';
import { buildResearchRunResult } from '../../research/buildResearchRunResult.js';
import type { ResearchRunMetadata } from '../../types/researchRun.js';

const metadata: ResearchRunMetadata = {
    id: 'run-1',
    title: 'Observation run',
    createdAt: 1000,
    seed: 42,
    scenarioId: 'quietObservation',
    ticks: 120,
    sampleEveryTicks: 20,
    runtimeConfig: { metricMode: 'flat' },
    safetyMode: 'safe',
    externalConstantsMode: 'neutral',
    semanticLeakCount: 0,
    nanOrInfinityCount: 0,
};

describe('buildResearchRunResult', () => {
    it('builds summary metrics from snapshots', () => {
        const result = buildResearchRunResult({
            metadata,
            snapshots: [
                {
                    tick: 20,
                    timestamp: 1,
                    runtimeMode: {
                        metricMode: 'flat',
                        fieldRuntimeMode: 'scalar',
                        membraneMode: 'observerOnly',
                        weakPlasticityMode: 'off',
                        externalConstantsMode: 'neutral',
                        safetyMode: 'safe',
                    },
                    field: { flowContinuity: 0.4, phaseCoherence: 0.1 },
                    vortex: { candidateCount: 1 },
                    geometry: {},
                    membrane: {},
                    plasticity: { totalAccumulation: 0.05, saturationRisk: 0.1 },
                    ratios: { averageMatchStrength: 0.3, emergentResonanceProxy: 0.2 },
                    diagnostics: { semanticLeakCount: 0, nanOrInfinityCount: 0 },
                },
                {
                    tick: 120,
                    timestamp: 2,
                    runtimeMode: {
                        metricMode: 'flat',
                        fieldRuntimeMode: 'scalar',
                        membraneMode: 'observerOnly',
                        weakPlasticityMode: 'off',
                        externalConstantsMode: 'neutral',
                        safetyMode: 'safe',
                    },
                    field: { flowContinuity: 0.6, phaseCoherence: 0.3 },
                    vortex: { candidateCount: 3 },
                    geometry: {},
                    membrane: {},
                    plasticity: { totalAccumulation: 0.4, saturationRisk: 0.2 },
                    ratios: { averageMatchStrength: 0.7, emergentResonanceProxy: 0.8 },
                    diagnostics: { semanticLeakCount: 0, nanOrInfinityCount: 1 },
                },
            ],
            interpretationNotes: ['Observation only'],
            limitations: ['seed/scenario dependent'],
        });

        expect(result.summary.snapshotCount).toBe(2);
        expect(result.summary.finalTick).toBe(120);
        expect(result.summary.averageFlowContinuity).toBeCloseTo(0.5);
        expect(result.summary.averageVortexCount).toBeCloseTo(2);
        expect(result.summary.maxPlasticityAccumulation).toBeCloseTo(0.4);
        expect(result.summary.nanOrInfinityCount).toBe(1);
    });
});
