import { describe, expect, it } from 'vitest';

import { LONG_RUN_COMPARISON_VARIANTS } from '../../comparison/longRunComparisonVariants.js';
import { runLongRunComparisonSuite } from '../../comparison/runLongRunComparisonSuite.js';
import { renderHighlightText, renderTopHighlightsSummary } from '../../ui/comparison/ComparisonHighlights.js';
import { COMPARISON_METRIC_TABLE_ROWS } from '../../ui/comparison/ComparisonMetricTable.js';
import { renderVariantSummaryCardText } from '../../ui/comparison/VariantSummaryCard.js';

const result = runLongRunComparisonSuite({
    comparisonName: 'ux polish',
    seed: 7,
    ticks: 50,
    scenarioId: 'quietObservation',
    variants: LONG_RUN_COMPARISON_VARIANTS,
    sampleEveryTicks: 10,
    enableDetailedSnapshots: false,
    maxSnapshotsPerVariant: 10,
});

describe('long-run comparison UX copy', () => {
    it('keeps highlight copy observational instead of announcing winners', () => {
        const lines = renderHighlightText(result.differenceHighlights[0]).join('\n');
        expect(lines).toContain('Highest observed value');
        expect(lines).toContain('not a winner label');
    });

    it('keeps the compact summary observational', () => {
        const summary = renderTopHighlightsSummary(result);
        expect(summary).toContain('Observation-only spread summary');
        expect(summary).not.toContain('winner');
    });

    it('expands variant cards with scenario and safety context', () => {
        const summary = result.variantSummaries[0];
        const variant = LONG_RUN_COMPARISON_VARIANTS.find((entry) => entry.id === summary.variantId)!;
        const lines = renderVariantSummaryCardText({ summary, variant }).join('\n');

        expect(lines).toContain('Scenario:');
        expect(lines).toContain('Constants mode:');
        expect(lines).toContain('Semantic leak count');
        expect(lines).toContain('NaN/Infinity count');
    });

    it('prioritizes observation-oriented metric labels', () => {
        const labels = COMPARISON_METRIC_TABLE_ROWS.map((row) => row.label);
        expect(labels).toContain('Vortex Candidate Count avg');
        expect(labels).toContain('Membrane Overlap avg');
        expect(labels).toContain('Observed Ratio Match avg');
    });
});
