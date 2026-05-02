/**
 * ComparisonHighlights.tsx
 * N7: Long-Run Comparison Suite
 *
 * Renders difference highlights from a LongRunComparisonResult.
 *
 * Principles:
 * - Highlights are observational only — no consciousness / life / mystical proof claims.
 * - Forbidden text: "consciousness increased", "intelligence emerged",
 *   "soul resonance detected", "life was proven".
 * - Every highlight includes its interpretation, which must be neutral.
 *
 * Reference: docs/long-run-comparison-suite.md §7
 */

import type {
    LongRunDifferenceHighlight,
    LongRunComparisonResult,
} from '../../types/longRunComparison.ts';

// ── Highlight rendering ────────────────────────────────────────────────────────

/**
 * Render a single difference highlight as a plain-text block.
 */
export function renderHighlightText(h: LongRunDifferenceHighlight): string[] {
    return [
        `Metric: ${h.metric}`,
        `  Highest observed value: ${h.strongestVariantId}`,
        `  Lowest observed value:  ${h.weakestVariantId}`,
        `  Observed spread:        ${h.differenceMagnitude.toFixed(4)}`,
        `  Interpretation:    ${h.interpretation}`,
        `  Note:              Read this with risk and safety checks; it is not a winner label.`,
    ];
}

/**
 * Render all difference highlights for a comparison result.
 * Returns an array of text blocks, one per highlight.
 */
export function renderAllHighlightsText(result: LongRunComparisonResult): string[][] {
    return result.differenceHighlights.map(renderHighlightText);
}

/**
 * Render difference highlights as a Markdown bulleted list.
 */
export function renderHighlightsMarkdown(result: LongRunComparisonResult): string {
    if (result.differenceHighlights.length === 0) {
        return '_No notable differences observed across variants._';
    }

    const lines: string[] = [];
    lines.push('> Difference highlights are observational comparisons only. They do not identify a winner or causal proof.');
    lines.push('');
    for (const h of result.differenceHighlights) {
        lines.push(`### ${h.metric}`);
        lines.push('');
        lines.push(`- **Highest observed value:** \`${h.strongestVariantId}\``);
        lines.push(`- **Lowest observed value:** \`${h.weakestVariantId}\``);
        lines.push(`- **Observed spread:** ${h.differenceMagnitude.toFixed(4)}`);
        lines.push(`- ${h.interpretation}`);
        lines.push(`- Read together with safety checks, saturation risk, and NaN / Infinity counts.`);
        lines.push('');
    }

    return lines.join('\n');
}

/**
 * Returns a compact summary string listing the top N highlights by magnitude.
 */
export function renderTopHighlightsSummary(
    result: LongRunComparisonResult,
    topN = 3,
): string {
    const sorted = [...result.differenceHighlights].sort(
        (a, b) => b.differenceMagnitude - a.differenceMagnitude,
    );
    const top = sorted.slice(0, topN);

    if (top.length === 0) {
        return 'No notable differences observed.';
    }

    return ['Observation-only spread summary (not a winner board).', ...top
        .map(h =>
            `${h.metric}: diff=${h.differenceMagnitude.toFixed(3)}`
            + ` (${h.strongestVariantId} vs ${h.weakestVariantId})`,
        )
    ].join('\n');
}
