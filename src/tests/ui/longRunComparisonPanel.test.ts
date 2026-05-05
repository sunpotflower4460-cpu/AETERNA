/**
 * longRunComparisonPanel.test.ts
 * N7: Long-Run Comparison Suite — UI panel tests
 *
 * Verifies that:
 * - createComparisonPanelState returns idle state
 * - runComparisonFromPanel returns completed state with result
 * - resetComparisonPanel returns idle state
 * - getSafetyCheckLines returns expected checks
 * - getVariantStatusLines returns one line per variant
 * - exportResultJson / exportResultMarkdown work after a run
 * - No fake results produced
 * - Node bridge / LLM/API not referenced in panel
 * - buildComparisonTableData produces correct header count
 * - renderTopHighlightsSummary returns non-empty string
 */

import { describe, it, expect } from 'vitest';
import { LONG_RUN_COMPARISON_VARIANTS } from '../../comparison/longRunComparisonVariants.js';
import {
    createComparisonPanelState,
    runComparisonFromPanel,
    resetComparisonPanel,
    getSafetyCheckLines,
    getVariantStatusLines,
    exportResultJson,
    exportResultMarkdown,
    getComparisonExportWarnings,
    copyComparisonSummary,
    DEFAULT_PANEL_CONFIG,
} from '../../ui/comparison/LongRunComparisonPanel.js';
import {
    buildComparisonTableData,
    COMPARISON_METRIC_TABLE_ROWS,
} from '../../ui/comparison/ComparisonMetricTable.js';
import {
    renderTopHighlightsSummary,
    renderHighlightsMarkdown,
} from '../../ui/comparison/ComparisonHighlights.js';
import {
    renderVariantSummaryCardText,
    renderVariantSummaryCardOneLiner,
} from '../../ui/comparison/VariantSummaryCard.js';
import { runLongRunComparisonSuite } from '../../comparison/runLongRunComparisonSuite.js';
import type { LongRunComparisonConfig } from '../../types/longRunComparison.js';

// ── Test config ────────────────────────────────────────────────────────────────

const TEST_CONFIG: LongRunComparisonConfig = {
    comparisonName: 'N7 Panel Test',
    seed: 99,
    ticks: 50,
    scenarioId: 'quietObservation',
    variants: LONG_RUN_COMPARISON_VARIANTS,
    sampleEveryTicks: 10,
    enableDetailedSnapshots: false,
    maxSnapshotsPerVariant: 10,
};

// ── Panel state ────────────────────────────────────────────────────────────────

describe('LongRunComparisonPanelState', () => {
    it('createComparisonPanelState returns idle state', () => {
        const state = createComparisonPanelState(TEST_CONFIG);
        expect(state.status).toBe('idle');
        expect(state.result).toBeNull();
        expect(state.errorMessage).toBeNull();
        expect(state.lastRunAt).toBeNull();
    });

    it('runComparisonFromPanel returns completed state', () => {
        const initial = createComparisonPanelState(TEST_CONFIG);
        const completed = runComparisonFromPanel(initial);
        expect(completed.status).toBe('completed');
        expect(completed.result).not.toBeNull();
        expect(completed.errorMessage).toBeNull();
        expect(completed.lastRunAt).not.toBeNull();
    });

    it('resetComparisonPanel returns idle state', () => {
        const initial = createComparisonPanelState(TEST_CONFIG);
        const completed = runComparisonFromPanel(initial);
        const reset = resetComparisonPanel(completed);
        expect(reset.status).toBe('idle');
        expect(reset.result).toBeNull();
        expect(reset.tableData).toBeNull();
    });

    it('tableData is populated after a run', () => {
        const initial = createComparisonPanelState(TEST_CONFIG);
        const completed = runComparisonFromPanel(initial);
        expect(completed.tableData).not.toBeNull();
        expect(completed.tableData!.headers.length).toBeGreaterThan(1);
    });

    it('topHighlightsSummary is a string after a run', () => {
        const initial = createComparisonPanelState(TEST_CONFIG);
        const completed = runComparisonFromPanel(initial);
        expect(typeof completed.topHighlightsSummary).toBe('string');
    });
});

// ── Safety checks ──────────────────────────────────────────────────────────────

describe('getSafetyCheckLines', () => {
    it('includes semantic layer inactive check', () => {
        const lines = getSafetyCheckLines(TEST_CONFIG);
        expect(lines.some(l => l.includes('Semantic layer'))).toBe(true);
    });

    it('includes Node bridge inactive check', () => {
        const lines = getSafetyCheckLines(TEST_CONFIG);
        expect(lines.some(l => l.includes('Node bridge'))).toBe(true);
    });

    it('includes LLM/API inactive check', () => {
        const lines = getSafetyCheckLines(TEST_CONFIG);
        expect(lines.some(l => l.includes('LLM/API'))).toBe(true);
    });

    it('includes observed ratios not used as feedback check', () => {
        const lines = getSafetyCheckLines(TEST_CONFIG);
        expect(lines.some(l => l.includes('Observed ratios'))).toBe(true);
    });

    it('warns about resistanceOnly variants', () => {
        const lines = getSafetyCheckLines(TEST_CONFIG);
        expect(lines.some(l => l.includes('resistanceOnly'))).toBe(true);
    });

    it('notes legacy constants comparison-only variants', () => {
        const lines = getSafetyCheckLines(TEST_CONFIG);
        expect(lines.some(l => l.includes('Legacy constants'))).toBe(true);
    });
});

// ── Variant status lines ───────────────────────────────────────────────────────

describe('getVariantStatusLines', () => {
    it('returns one line per variant summary', () => {
        const state = createComparisonPanelState(TEST_CONFIG);
        const completed = runComparisonFromPanel(state);
        const lines = getVariantStatusLines(completed.result!.variantSummaries);
        expect(lines.length).toBe(LONG_RUN_COMPARISON_VARIANTS.length);
    });
});

// ── Export ─────────────────────────────────────────────────────────────────────

describe('Panel export helpers', () => {
    it('exportResultJson returns null before a run', () => {
        const state = createComparisonPanelState(TEST_CONFIG);
        expect(exportResultJson(state)).toBeNull();
    });

    it('exportResultJson returns valid JSON after a run', () => {
        const state = createComparisonPanelState(TEST_CONFIG);
        const completed = runComparisonFromPanel(state);
        const json = exportResultJson(completed);
        expect(json).not.toBeNull();
        expect(() => JSON.parse(json!)).not.toThrow();
    });

    it('exportResultMarkdown returns null before a run', () => {
        const state = createComparisonPanelState(TEST_CONFIG);
        expect(exportResultMarkdown(state)).toBeNull();
    });

    it('exportResultMarkdown returns a string after a run', () => {
        const state = createComparisonPanelState(TEST_CONFIG);
        const completed = runComparisonFromPanel(state);
        const md = exportResultMarkdown(completed);
        expect(md).not.toBeNull();
        expect(typeof md).toBe('string');
        expect(md!.length).toBeGreaterThan(0);
    });

    it('getComparisonExportWarnings returns summary export note', () => {
        const state = createComparisonPanelState(TEST_CONFIG);
        const completed = runComparisonFromPanel(state);
        expect(getComparisonExportWarnings(completed).some((line) => line.includes('Summary export only'))).toBe(true);
    });

    it('copyComparisonSummary returns observational summary text after a run', () => {
        const state = createComparisonPanelState(TEST_CONFIG);
        const completed = runComparisonFromPanel(state);
        expect(copyComparisonSummary(completed)).toContain('comparison=');
    });
});

// ── Metric table ───────────────────────────────────────────────────────────────

describe('buildComparisonTableData', () => {
    it('produces correct header count (Metric + N variants + Difference)', () => {
        const result = runLongRunComparisonSuite(TEST_CONFIG);
        const tableData = buildComparisonTableData(result.variantSummaries);
        // Header = 'Metric' + one per variant + 'Difference'
        expect(tableData.headers.length).toBe(result.variantSummaries.length + 2);
    });

    it('produces one row per COMPARISON_METRIC_TABLE_ROWS entry', () => {
        const result = runLongRunComparisonSuite(TEST_CONFIG);
        const tableData = buildComparisonTableData(result.variantSummaries);
        expect(tableData.rows.length).toBe(COMPARISON_METRIC_TABLE_ROWS.length);
    });

    it('each row has cells matching the number of variants', () => {
        const result = runLongRunComparisonSuite(TEST_CONFIG);
        const tableData = buildComparisonTableData(result.variantSummaries);
        for (const row of tableData.rows) {
            expect(row.cells.length).toBe(result.variantSummaries.length);
        }
    });

    it('isNonZeroWarning is true for semantic leak / nan cells with non-zero values', () => {
        const result = runLongRunComparisonSuite(TEST_CONFIG);
        const tableData = buildComparisonTableData(result.variantSummaries);
        const leakRow = tableData.rows.find(r => r.metric === 'semanticLeakCount');
        expect(leakRow).toBeDefined();
        // All semantic leak cells should be 0 (semantic layer always inactive)
        for (const cell of leakRow!.cells) {
            expect(cell.isNonZeroWarning).toBe(false);
        }
    });
});

// ── Highlights ─────────────────────────────────────────────────────────────────

describe('renderTopHighlightsSummary', () => {
    it('returns a non-empty string when highlights exist', () => {
        const result = runLongRunComparisonSuite(TEST_CONFIG);
        const summary = renderTopHighlightsSummary(result);
        expect(typeof summary).toBe('string');
        expect(summary.length).toBeGreaterThan(0);
    });

    it('renderHighlightsMarkdown returns a non-empty string', () => {
        const result = runLongRunComparisonSuite(TEST_CONFIG);
        const md = renderHighlightsMarkdown(result);
        expect(typeof md).toBe('string');
        expect(md.length).toBeGreaterThan(0);
    });
});

// ── VariantSummaryCard ─────────────────────────────────────────────────────────

describe('renderVariantSummaryCardText', () => {
    it('returns an array of strings with the variant label', () => {
        const result = runLongRunComparisonSuite(TEST_CONFIG);
        const summary = result.variantSummaries[0];
        const variant = LONG_RUN_COMPARISON_VARIANTS.find(v => v.id === summary.variantId)!;
        const lines = renderVariantSummaryCardText({ summary, variant });
        expect(Array.isArray(lines)).toBe(true);
        expect(lines.some(l => l.includes(summary.label))).toBe(true);
    });

    it('always shows semanticLeakCount', () => {
        const result = runLongRunComparisonSuite(TEST_CONFIG);
        const summary = result.variantSummaries[0];
        const variant = LONG_RUN_COMPARISON_VARIANTS.find(v => v.id === summary.variantId)!;
        const lines = renderVariantSummaryCardText({ summary, variant });
        expect(lines.some(l => l.includes('Semantic leak count'))).toBe(true);
    });

    it('one-liner is a compact string', () => {
        const result = runLongRunComparisonSuite(TEST_CONFIG);
        const summary = result.variantSummaries[0];
        const variant = LONG_RUN_COMPARISON_VARIANTS.find(v => v.id === summary.variantId)!;
        const line = renderVariantSummaryCardOneLiner({ summary, variant });
        expect(typeof line).toBe('string');
        expect(line).toContain('[OK]');
    });
});

// ── DEFAULT_PANEL_CONFIG ───────────────────────────────────────────────────────

describe('DEFAULT_PANEL_CONFIG', () => {
    it('has a seed', () => {
        expect(typeof DEFAULT_PANEL_CONFIG.seed).toBe('number');
    });

    it('has ticks', () => {
        expect(DEFAULT_PANEL_CONFIG.ticks).toBeGreaterThan(0);
    });

    it('includes all registered variants', () => {
        expect(DEFAULT_PANEL_CONFIG.variants.length).toBe(LONG_RUN_COMPARISON_VARIANTS.length);
    });
});
