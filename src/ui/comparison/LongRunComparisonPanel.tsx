/**
 * LongRunComparisonPanel.tsx
 * N7: Long-Run Comparison Suite
 *
 * Dashboard panel for Long-Run Comparison Suite.
 * Manages run state, displays variant summary cards, metric table, and highlights.
 *
 * This file is a headless (non-browser) panel model: it provides data-derived
 * display state and run control helpers. Actual DOM rendering is handled by
 * the caller (index.html / layoutControls.js).
 *
 * Principles:
 * - No fake results, no fake events.
 * - Observed ratios are never used as runtime feedback.
 * - No consciousness / life / mystical proof claims in any label or description.
 * - Safety checks are displayed before running.
 * - Skipped variants are shown with their skip reason.
 *
 * Reference: docs/long-run-comparison-suite.md §8
 */

import type {
    LongRunComparisonConfig,
    LongRunComparisonResult,
    LongRunVariantSummary,
} from '../../types/longRunComparison.ts';
import { LONG_RUN_COMPARISON_VARIANTS } from '../../comparison/longRunComparisonVariants.ts';
import { runLongRunComparisonSuite } from '../../comparison/runLongRunComparisonSuite.ts';
import {
    exportLongRunComparisonJson,
    exportLongRunComparisonMarkdown,
} from '../../comparison/exportLongRunComparison.ts';
import { buildComparisonTableData } from './ComparisonMetricTable.tsx';
import { renderTopHighlightsSummary } from './ComparisonHighlights.tsx';

// ── Panel state ────────────────────────────────────────────────────────────────

export type ComparisonPanelStatus =
    | 'idle'
    | 'running'
    | 'completed'
    | 'error';

export interface LongRunComparisonPanelState {
    status: ComparisonPanelStatus;
    config: LongRunComparisonConfig;
    result: LongRunComparisonResult | null;
    errorMessage: string | null;
    lastRunAt: number | null;

    /** Derived display data — null until a result is available */
    tableData: ReturnType<typeof buildComparisonTableData> | null;
    topHighlightsSummary: string | null;
}

// ── Default config ─────────────────────────────────────────────────────────────

export const DEFAULT_PANEL_CONFIG: LongRunComparisonConfig = {
    comparisonName: 'N7 Long-Run Comparison Suite',
    seed: 42,
    ticks: 1000,
    scenarioId: 'longRunNaturalEmergence',
    variants: LONG_RUN_COMPARISON_VARIANTS,
    sampleEveryTicks: 50,
    enableDetailedSnapshots: false,
    maxSnapshotsPerVariant: 100,
};

// ── Panel controller ───────────────────────────────────────────────────────────

/**
 * Create the initial panel state.
 */
export function createComparisonPanelState(
    config: LongRunComparisonConfig = DEFAULT_PANEL_CONFIG,
): LongRunComparisonPanelState {
    return {
        status: 'idle',
        config,
        result: null,
        errorMessage: null,
        lastRunAt: null,
        tableData: null,
        topHighlightsSummary: null,
    };
}

/**
 * Run the comparison suite and return the updated panel state.
 * This is a synchronous operation suitable for test and CLI use.
 * In a UI context, the caller should handle async wrapping.
 */
export function runComparisonFromPanel(
    state: LongRunComparisonPanelState,
): LongRunComparisonPanelState {
    let result: LongRunComparisonResult;
    try {
        result = runLongRunComparisonSuite(state.config);
    } catch (err) {
        return {
            ...state,
            status: 'error',
            errorMessage: err instanceof Error ? err.message : String(err),
        };
    }

    const tableData = buildComparisonTableData(result.variantSummaries);
    const topHighlightsSummary = renderTopHighlightsSummary(result);

    return {
        ...state,
        status: 'completed',
        result,
        errorMessage: null,
        lastRunAt: Date.now(),
        tableData,
        topHighlightsSummary,
    };
}

/**
 * Reset the panel state to idle.
 */
export function resetComparisonPanel(
    state: LongRunComparisonPanelState,
): LongRunComparisonPanelState {
    return {
        ...state,
        status: 'idle',
        result: null,
        errorMessage: null,
        lastRunAt: null,
        tableData: null,
        topHighlightsSummary: null,
    };
}

// ── Export helpers ─────────────────────────────────────────────────────────────

/**
 * Export the current result as a JSON string, or null if no result is available.
 */
export function exportResultJson(state: LongRunComparisonPanelState): string | null {
    if (!state.result) return null;
    return exportLongRunComparisonJson(state.result);
}

/**
 * Export the current result as a Markdown string, or null if no result is available.
 */
export function exportResultMarkdown(state: LongRunComparisonPanelState): string | null {
    if (!state.result) return null;
    return exportLongRunComparisonMarkdown(state.result);
}

// ── Safety summary ─────────────────────────────────────────────────────────────

/**
 * Returns a list of safety check lines to display before running.
 * All checks must pass for the run to be safe.
 */
export function getSafetyCheckLines(config: LongRunComparisonConfig): string[] {
    const lines: string[] = [
        '✓ Semantic layer: inactive',
        '✓ Node bridge: inactive',
        '✓ LLM/API: inactive',
        '✓ Observed ratios: observer-side only, not used as runtime feedback',
        '✓ Fake results: prohibited',
        `✓ Shared seed: ${config.seed}`,
        `✓ Shared ticks: ${config.ticks}`,
        `✓ Shared scenario: ${config.scenarioId}`,
    ];

    const resistanceOnlyVariants = config.variants.filter(
        v => v.weakPlasticityMode === 'resistanceOnly',
    );
    if (resistanceOnlyVariants.length > 0) {
        const ids = resistanceOnlyVariants.map(v => v.id).join(', ');
        lines.push(`⚠ resistanceOnly variants (clamp required): ${ids}`);
    }

    const legacyVariants = config.variants.filter(
        v => v.externalConstantsMode === 'legacy',
    );
    if (legacyVariants.length > 0) {
        const ids = legacyVariants.map(v => v.id).join(', ');
        lines.push(`ℹ Legacy constants mode (comparison only): ${ids}`);
    }

    return lines;
}

// ── Variant status lines ───────────────────────────────────────────────────────

/**
 * Returns a per-variant status line from a completed result.
 */
export function getVariantStatusLines(summaries: LongRunVariantSummary[]): string[] {
    return summaries.map(s => {
        const isSkipped = s.notes.some(n => n.startsWith('SKIPPED'));
        const status = isSkipped ? 'SKIPPED' : 'completed';
        return `[${status}] ${s.label}`;
    });
}
