import { describe, expect, it } from 'vitest';
import { createResearchExportPanelState } from '../../ui/research/ResearchExportPanel.js';
import { createReproducibilityPanelState } from '../../ui/research/ReproducibilityPanel.js';
import { buildResearchRunResult } from '../../research/buildResearchRunResult.js';
import { runLongRunComparisonSuite } from '../../comparison/runLongRunComparisonSuite.js';
import { LONG_RUN_COMPARISON_VARIANTS } from '../../comparison/longRunComparisonVariants.js';
import type { ResearchRunMetadata } from '../../types/researchRun.js';
import type { LongRunComparisonConfig } from '../../types/longRunComparison.js';

const metadata: ResearchRunMetadata = {
    id: 'run-ui',
    title: 'UI export run',
    createdAt: 1000,
    seed: 21,
    scenarioId: 'quietObservation',
    ticks: 100,
    sampleEveryTicks: 25,
    runtimeConfig: {
        metricMode: 'flat',
        fieldRuntimeMode: 'scalar',
        membraneMode: 'observerOnly',
        weakPlasticityMode: 'off',
    },
    presetId: 'safeBaseline',
    safetyMode: 'safe',
    externalConstantsMode: 'neutral',
    semanticLeakCount: 0,
    nanOrInfinityCount: 0,
};

const comparisonConfig: LongRunComparisonConfig = {
    comparisonName: 'Research export panel',
    seed: 21,
    ticks: 50,
    scenarioId: 'quietObservation',
    variants: LONG_RUN_COMPARISON_VARIANTS,
    sampleEveryTicks: 10,
    enableDetailedSnapshots: false,
    maxSnapshotsPerVariant: 5,
};

describe('ResearchExportPanel', () => {
    it('builds export state with summary exports and mobile actions', () => {
        const result = buildResearchRunResult({
            metadata,
            snapshots: [],
            interpretationNotes: ['Observation only'],
        });
        const comparisonResult = runLongRunComparisonSuite(comparisonConfig);
        const state = createResearchExportPanelState({ result, comparisonResult });

        expect(state.warningLines.some((line) => line.includes('Summary export only'))).toBe(true);
        expect(state.buttons.map((button) => button.label)).toEqual([
            'Export JSON',
            'Export Markdown',
            'Copy Summary',
            'Download Research Run',
        ]);
        expect(state.mobileButtons.map((button) => button.label)).toEqual([
            'Export',
            'Copy',
            'Share text',
        ]);
        expect(state.researchRunJson).toContain('"metadata"');
        expect(state.comparisonMarkdown).toContain('Interpretation guardrails');
    });

    it('builds reproducibility state with a config hash and rerun preparation', () => {
        const state = createReproducibilityPanelState(metadata);
        expect(state.configHash).toHaveLength(8);
        expect(state.items.some((item) => item.label === 'Config hash')).toBe(true);
        expect(state.rerunStatus).toBe('Re-run config prepared');
        expect(state.preparedRunConfig.seed).toBe(metadata.seed);
    });
});
