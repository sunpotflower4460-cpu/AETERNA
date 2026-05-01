/**
 * runLongRunComparisonCli.ts
 * N7: Long-Run Comparison Suite
 *
 * CLI entry point for manual long-run comparison runs.
 * Run with:
 *   npm run compare:longrun
 *   tsx src/comparison/runLongRunComparisonCli.ts
 *
 * Default: runs all 9 registered variants with a shared seed, 1000 ticks,
 * and the 'longRunNaturalEmergence' scenario.
 *
 * Outputs:
 * - Console summary
 * - comparison-result.json (in working directory)
 * - comparison-result.md (in working directory)
 *
 * Principles:
 * - No LLM / API calls.
 * - No runtime dynamics modification.
 * - observed ratios are not used as runtime feedback.
 * - Fake results are never produced.
 *
 * Reference: docs/long-run-comparison-suite.md §12
 */

import { writeFileSync } from 'node:fs';
import { LONG_RUN_COMPARISON_VARIANTS } from './longRunComparisonVariants.ts';
import { runLongRunComparisonSuite } from './runLongRunComparisonSuite.ts';
import {
    exportLongRunComparisonJson,
    exportLongRunComparisonMarkdown,
} from './exportLongRunComparison.ts';
import type { LongRunComparisonConfig } from '../types/longRunComparison.ts';

// ── Default config ─────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: LongRunComparisonConfig = {
    comparisonName: 'N7 Long-Run Comparison Suite',
    seed: 42,
    ticks: 1000,
    scenarioId: 'longRunNaturalEmergence',
    variants: LONG_RUN_COMPARISON_VARIANTS,
    sampleEveryTicks: 50,
    enableDetailedSnapshots: false,
    maxSnapshotsPerVariant: 100,
};

// ── Main ──────────────────────────────────────────────────────────────────────

function main(): void {
    console.log(`\n=== AETERNA N7: Long-Run Comparison Suite ===`);
    console.log(`Comparison: ${DEFAULT_CONFIG.comparisonName}`);
    console.log(`Seed:       ${DEFAULT_CONFIG.seed}`);
    console.log(`Ticks:      ${DEFAULT_CONFIG.ticks}`);
    console.log(`Scenario:   ${DEFAULT_CONFIG.scenarioId}`);
    console.log(`Variants:   ${DEFAULT_CONFIG.variants.length}`);
    console.log('');
    console.log('Running variants...');

    const result = runLongRunComparisonSuite(DEFAULT_CONFIG);

    console.log(`\nCompleted. Confidence: ${result.comparisonConfidence.toFixed(3)}`);
    console.log(`Variant summaries: ${result.variantSummaries.length}`);
    console.log(`Difference highlights: ${result.differenceHighlights.length}`);

    // Print per-variant overview
    console.log('\n--- Variant summary ---');
    for (const s of result.variantSummaries) {
        const skipped = s.notes.some(n => n.startsWith('SKIPPED'));
        const status = skipped ? '[SKIPPED]' : '[OK]';
        console.log(
            `${status} ${s.label.padEnd(45)} `
            + `vortex=${s.averageVortexCount.toFixed(1)} `
            + `closure=${s.averageClosureStability.toFixed(3)} `
            + `nan=${s.nanOrInfinityCount}`,
        );
    }

    // Print highlights
    if (result.differenceHighlights.length > 0) {
        console.log('\n--- Difference highlights ---');
        for (const h of result.differenceHighlights) {
            console.log(`  ${h.metric}: diff=${h.differenceMagnitude.toFixed(3)}`);
            console.log(`    strongest=${h.strongestVariantId} weakest=${h.weakestVariantId}`);
        }
    }

    // Export JSON
    const jsonOut = exportLongRunComparisonJson(result);
    writeFileSync('comparison-result.json', jsonOut, 'utf-8');
    console.log('\nExported: comparison-result.json');

    // Export Markdown
    const mdOut = exportLongRunComparisonMarkdown(result);
    writeFileSync('comparison-result.md', mdOut, 'utf-8');
    console.log('Exported: comparison-result.md');

    console.log('\n=== Done ===\n');
}

main();
