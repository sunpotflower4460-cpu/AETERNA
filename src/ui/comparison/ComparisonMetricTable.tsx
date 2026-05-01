/**
 * ComparisonMetricTable.tsx
 * N7: Long-Run Comparison Suite
 *
 * Produces a metric comparison table from multiple LongRunVariantSummary objects.
 *
 * Table structure:
 * - Rows: key metrics (vortex count, lifetime, closure, etc.)
 * - Columns: one per variant
 * - Additional 'Difference' column: max − min across variants
 *
 * Principles:
 * - No consciousness / life / mystical proof claims in cell labels.
 * - All numeric values are rounded to 3 decimal places.
 * - Non-finite values are shown as 'N/A'.
 *
 * Reference: docs/long-run-comparison-suite.md §10
 */

import type { LongRunVariantSummary } from '../../types/longRunComparison.ts';

// ── Table row definitions ──────────────────────────────────────────────────────

export interface MetricTableRow {
    label: string;
    metric: keyof LongRunVariantSummary;
    decimals?: number;
}

/**
 * Canonical rows for the comparison metric table.
 * Labels are neutral and observational.
 */
export const COMPARISON_METRIC_TABLE_ROWS: MetricTableRow[] = [
    { label: 'Vortex Count avg',            metric: 'averageVortexCount',                decimals: 1 },
    { label: 'Vortex Lifetime avg (ticks)',  metric: 'averageVortexLifetime',             decimals: 1 },
    { label: 'Phase Coherence avg',          metric: 'averagePhaseCoherence',             decimals: 3 },
    { label: 'Signed Charge |mean|',         metric: 'signedTotalChargeAbsMean',          decimals: 3 },
    { label: 'Curvature–Vortex Corr.',       metric: 'averageCurvatureVortexCorrelation', decimals: 3 },
    { label: 'Curvature Bias',               metric: 'averageCurvatureBiasStrength',      decimals: 3 },
    { label: 'Closure Stability avg',        metric: 'averageClosureStability',           decimals: 3 },
    { label: 'Return Strength avg',          metric: 'averageReturnStrength',             decimals: 3 },
    { label: 'Membrane Two-Sidedness avg',   metric: 'averageMembraneTwoSidedness',       decimals: 3 },
    { label: 'Actuation Return Overlap avg', metric: 'averageActuationReturnOverlap',     decimals: 3 },
    { label: 'Plasticity Accum. total',      metric: 'totalPlasticityAccumulation',       decimals: 4 },
    { label: 'Saturation Risk max',          metric: 'plasticitySaturationRiskMax',       decimals: 3 },
    { label: 'Ratio Match avg',              metric: 'averageObservedRatioMatchStrength', decimals: 3 },
    { label: 'Resonance Proxy max',          metric: 'maxEmergentResonanceProxy',         decimals: 3 },
    { label: 'RepeatedFlow Cand. mean',      metric: 'repeatedFlowPathCandidateCountMean', decimals: 1 },
    { label: 'ProtoNetwork Cand. mean',      metric: 'protoNetworkCandidateCountMean',    decimals: 1 },
    { label: 'Max Saturation Risk',          metric: 'maxSaturationRisk',                decimals: 3 },
    { label: 'Max Extinction Risk',          metric: 'maxExtinctionRisk',                decimals: 3 },
    { label: 'Semantic Leak Count',          metric: 'semanticLeakCount',                decimals: 0 },
    { label: 'NaN/Infinity Count',           metric: 'nanOrInfinityCount',               decimals: 0 },
];

// ── Cell rendering ─────────────────────────────────────────────────────────────

function fmtCell(v: number, decimals: number): string {
    return Number.isFinite(v) ? v.toFixed(decimals) : 'N/A';
}

// ── Table data structure ───────────────────────────────────────────────────────

export interface ComparisonTableCell {
    value: string;
    isMax: boolean;
    isMin: boolean;
    isNonZeroWarning: boolean; // for semantic leak / nan count
}

export interface ComparisonTableRow {
    label: string;
    metric: string;
    cells: ComparisonTableCell[];
    differenceValue: string;
}

export interface ComparisonTableData {
    headers: string[];
    rows: ComparisonTableRow[];
}

// ── Build table ────────────────────────────────────────────────────────────────

/**
 * Build a ComparisonTableData from an array of variant summaries.
 * Column order matches the summaries array order.
 * The last column is 'Difference' (max − min).
 */
export function buildComparisonTableData(
    summaries: LongRunVariantSummary[],
): ComparisonTableData {
    const headers = ['Metric', ...summaries.map(s => s.label), 'Difference'];

    const rows: ComparisonTableRow[] = COMPARISON_METRIC_TABLE_ROWS.map(({ label, metric, decimals = 3 }) => {
        const values = summaries.map(s => {
            const v = s[metric];
            return typeof v === 'number' ? v : 0;
        });

        const maxVal = Math.max(...values);
        const minVal = Math.min(...values);
        const diff = maxVal - minVal;

        const cells: ComparisonTableCell[] = values.map(v => ({
            value: fmtCell(v, decimals),
            isMax: v === maxVal && diff > 0.0001,
            isMin: v === minVal && diff > 0.0001,
            isNonZeroWarning:
                (metric === 'semanticLeakCount' || metric === 'nanOrInfinityCount') && v > 0,
        }));

        return {
            label,
            metric: metric as string,
            cells,
            differenceValue: fmtCell(diff, decimals),
        };
    });

    return { headers, rows };
}

/**
 * Render the comparison table as a Markdown string.
 */
export function renderComparisonTableMarkdown(data: ComparisonTableData): string {
    const lines: string[] = [];
    const renderRow = (cells: string[]): string => `| ${cells.join(' | ')} |`;
    const separator = `|${data.headers.map(() => '---').join('|')}|`;

    lines.push(renderRow(data.headers));
    lines.push(separator);

    for (const row of data.rows) {
        const cellStrings = row.cells.map(c => {
            let val = c.value;
            if (c.isNonZeroWarning) val = `⚠️ ${val}`;
            return val;
        });
        lines.push(renderRow([row.label, ...cellStrings, row.differenceValue]));
    }

    return lines.join('\n');
}
