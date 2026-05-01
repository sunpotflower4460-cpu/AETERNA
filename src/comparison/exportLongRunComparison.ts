/**
 * exportLongRunComparison.ts
 * N7: Long-Run Comparison Suite
 *
 * Export utilities for LongRunComparisonResult.
 *
 * Supports:
 * - JSON export (full result object)
 * - Markdown summary export (human-readable report)
 *
 * Principles:
 * - Exports are read-only snapshots. No runtime state is modified.
 * - Markdown output respects interpretation guardrails:
 *   high vortex count ≠ consciousness, etc.
 * - Fake results are never produced.
 *
 * Reference: docs/long-run-comparison-suite.md §8
 */

import type {
    LongRunComparisonResult,
    LongRunVariantSummary,
    LongRunDifferenceHighlight,
} from '../types/longRunComparison.ts';

// ── JSON export ────────────────────────────────────────────────────────────────

/**
 * Serialize a LongRunComparisonResult to a JSON string.
 * Suitable for writing to a file or sending over a network.
 */
export function exportLongRunComparisonJson(result: LongRunComparisonResult): string {
    return JSON.stringify(result, null, 2);
}

// ── Markdown export ────────────────────────────────────────────────────────────

/**
 * Format a number to a fixed number of decimal places, or 'N/A' for non-finite.
 */
function fmt(v: number, decimals = 3): string {
    return Number.isFinite(v) ? v.toFixed(decimals) : 'N/A';
}

/**
 * Generate a Markdown summary of a LongRunComparisonResult.
 *
 * Includes:
 * - Run metadata (name, seed, ticks, scenario)
 * - Per-variant summary table
 * - Difference highlights
 * - Interpretation guardrails
 *
 * The report is neutral and scientific. It does NOT contain:
 * - consciousness claims
 * - life proof claims
 * - mystical proof claims
 * - intelligence claims
 */
export function exportLongRunComparisonMarkdown(result: LongRunComparisonResult): string {
    const lines: string[] = [];

    // Header
    lines.push(`# Long-Run Comparison Suite: ${result.comparisonName}`);
    lines.push('');
    lines.push('> **Interpretation guardrails**');
    lines.push('> - High vortex count is a pre-semantic candidate count, not an emergence proof.');
    lines.push('> - High observed ratio match strength is an observational comparison result, not a proof of resonance.');
    lines.push('> - High plasticity accumulation is a trace residue measure, not semantic storage.');
    lines.push('> - High closure stability is a loop continuity proxy, not a self-awareness indicator.');
    lines.push('> - Absence of emergence is a valid observation, not a failure.');
    lines.push('');

    // Metadata
    lines.push('## Run metadata');
    lines.push('');
    lines.push(`| Field | Value |`);
    lines.push(`|---|---|`);
    lines.push(`| Comparison name | ${result.comparisonName} |`);
    lines.push(`| Seed | ${result.seed} |`);
    lines.push(`| Ticks | ${result.ticks} |`);
    lines.push(`| Scenario | ${result.scenarioId} |`);
    lines.push(`| Variants run | ${result.variantSummaries.length} |`);
    lines.push(`| Comparison confidence | ${fmt(result.comparisonConfidence)} |`);
    lines.push(`| Generated at | ${new Date(result.generatedAt).toISOString()} |`);
    lines.push('');

    // Per-variant summary table
    lines.push('## Variant summaries');
    lines.push('');
    lines.push(buildVariantTable(result.variantSummaries));
    lines.push('');

    // Difference highlights
    if (result.differenceHighlights.length > 0) {
        lines.push('## Difference highlights');
        lines.push('');
        for (const h of result.differenceHighlights) {
            lines.push(formatHighlight(h));
        }
        lines.push('');
    }

    // Per-variant notes
    const variantsWithNotes = result.variantSummaries.filter(s => s.notes.length > 0);
    if (variantsWithNotes.length > 0) {
        lines.push('## Variant notes');
        lines.push('');
        for (const s of variantsWithNotes) {
            lines.push(`### ${s.label}`);
            for (const note of s.notes) {
                lines.push(`- ${note}`);
            }
            lines.push('');
        }
    }

    // Footer
    lines.push('---');
    lines.push('');
    lines.push('*This comparison shows differences between runtime variants. '
        + 'Results are pre-semantic observations of field, vortex, trace, closure, '
        + 'and ratio dynamics. They are observational data only.*');

    return lines.join('\n');
}

// ── Table builders ─────────────────────────────────────────────────────────────

/** Key metrics to include in the summary table */
const TABLE_METRICS: Array<{ key: keyof LongRunVariantSummary; label: string }> = [
    { key: 'averageVortexCount',                label: 'Vortex count avg' },
    { key: 'averageVortexLifetime',             label: 'Vortex lifetime avg (ticks)' },
    { key: 'signedTotalChargeAbsMean',          label: 'Signed charge |mean|' },
    { key: 'averageCurvatureVortexCorrelation', label: 'Curvature–vortex corr.' },
    { key: 'averageClosureStability',           label: 'Closure stability avg' },
    { key: 'averageMembraneTwoSidedness',       label: 'Membrane two-sidedness avg' },
    { key: 'totalPlasticityAccumulation',       label: 'Plasticity accum. total' },
    { key: 'averageObservedRatioMatchStrength', label: 'Ratio match avg' },
    { key: 'maxSaturationRisk',                 label: 'Saturation risk max' },
    { key: 'semanticLeakCount',                 label: 'Semantic leak count' },
    { key: 'nanOrInfinityCount',                label: 'NaN/Infinity count' },
];

function buildVariantTable(summaries: LongRunVariantSummary[]): string {
    const header = ['Metric', ...summaries.map(s => s.label)];
    const rows: string[][] = TABLE_METRICS.map(({ key, label }) => {
        return [
            label,
            ...summaries.map(s => {
                const v = s[key];
                return typeof v === 'number' ? fmt(v) : String(v);
            }),
        ];
    });

    const renderRow = (cells: string[]): string =>
        `| ${cells.join(' | ')} |`;
    const separator = `|${header.map(() => '---').join('|')}|`;

    return [
        renderRow(header),
        separator,
        ...rows.map(renderRow),
    ].join('\n');
}

function formatHighlight(h: LongRunDifferenceHighlight): string {
    return [
        `**${h.metric}**`,
        `- Strongest: \`${h.strongestVariantId}\``,
        `- Weakest: \`${h.weakestVariantId}\``,
        `- Difference magnitude: ${fmt(h.differenceMagnitude)}`,
        `- ${h.interpretation}`,
        '',
    ].join('\n');
}
