import { describe, expect, it } from 'vitest';
import { buildResearchRunResult } from '../../research/buildResearchRunResult.js';
import { exportResearchRunJson } from '../../research/exportResearchRunJson.js';
import type { ResearchRunMetadata } from '../../types/researchRun.js';

const metadata: ResearchRunMetadata = {
    id: 'run-json',
    title: 'JSON export run',
    createdAt: 1000,
    seed: 7,
    scenarioId: 'quietObservation',
    ticks: 40,
    sampleEveryTicks: 10,
    runtimeConfig: { metricMode: 'flat', fieldRuntimeMode: 'scalar' },
    safetyMode: 'safe',
    externalConstantsMode: 'neutral',
    semanticLeakCount: 0,
    nanOrInfinityCount: 0,
};

describe('exportResearchRunJson', () => {
    it('returns valid JSON', () => {
        const result = buildResearchRunResult({
            metadata,
            snapshots: [],
        });
        const json = exportResearchRunJson(result);
        expect(() => JSON.parse(json)).not.toThrow();
        expect(JSON.parse(json).metadata.seed).toBe(7);
    });
});
