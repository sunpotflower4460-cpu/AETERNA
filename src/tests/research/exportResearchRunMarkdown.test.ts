import { describe, expect, it } from 'vitest';
import { buildResearchRunResult } from '../../research/buildResearchRunResult.js';
import { exportResearchRunMarkdown } from '../../research/exportResearchRunMarkdown.js';
import type { ResearchRunMetadata } from '../../types/researchRun.js';

const metadata: ResearchRunMetadata = {
    id: 'run-md',
    title: 'Markdown export run',
    createdAt: 1000,
    seed: 11,
    scenarioId: 'longRunNaturalEmergence',
    ticks: 200,
    sampleEveryTicks: 20,
    runtimeConfig: { metricMode: 'curved', fieldRuntimeMode: 'complexObserver' },
    safetyMode: 'research',
    externalConstantsMode: 'neutral',
    semanticLeakCount: 0,
    nanOrInfinityCount: 0,
};

describe('exportResearchRunMarkdown', () => {
    it('includes metadata, summary, limitations, and interpretation guardrails', () => {
        const result = buildResearchRunResult({
            metadata,
            snapshots: [],
            interpretationNotes: ['Observation only note'],
        });
        const markdown = exportResearchRunMarkdown(result);

        expect(markdown).toContain('## Metadata');
        expect(markdown).toContain('## Summary Metrics');
        expect(markdown).toContain('## Limitations');
        expect(markdown).toContain('## Interpretation guardrails');
        expect(markdown).toContain('## 解釈ガード');
        expect(markdown).toContain('These results are observation metrics, not proof of consciousness.');
    });

    it('does not include prohibited affirmative proof claims', () => {
        const result = buildResearchRunResult({
            metadata,
            snapshots: [],
            interpretationNotes: ['Observation only'],
        });
        const markdown = exportResearchRunMarkdown(result).toLowerCase();

        [
            'consciousness proved',
            'life proved',
            'intelligence emerged',
            'soul resonance',
            'healing proof',
            'memory formed',
            'learned meaning',
        ].forEach((term) => {
            expect(markdown).not.toContain(term);
        });
    });
});
