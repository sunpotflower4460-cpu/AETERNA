/**
 * VariantSummaryCard.tsx
 * N7: Long-Run Comparison Suite
 *
 * Displays a summary card for a single comparison variant.
 *
 * Principles:
 * - All values are presented as neutral observational data.
 * - No consciousness / intelligence / life / mystical proof claims.
 * - high vortex count ≠ consciousness.
 * - high ratio match ≠ mystical proof.
 * - Semantic leak count is always shown; non-zero requires attention.
 *
 * Reference: docs/long-run-comparison-suite.md §9
 */

import type { LongRunVariantSummary, LongRunComparisonVariant } from '../../types/longRunComparison.ts';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface VariantSummaryCardData {
    summary: LongRunVariantSummary;
    variant: LongRunComparisonVariant;
}

// ── Render helper ──────────────────────────────────────────────────────────────

/**
 * Returns a plain-text (no HTML) representation of a variant summary card.
 * Used for console display, export, and test assertions.
 * A full HTML renderer can use this data structure for display.
 */
export function renderVariantSummaryCardText(data: VariantSummaryCardData): string[] {
    const { summary, variant } = data;
    const isSkipped = summary.notes.some(n => n.startsWith('SKIPPED'));

    const fmt = (v: number, d = 3): string =>
        Number.isFinite(v) ? v.toFixed(d) : 'N/A';

    const lines: string[] = [
        `=== ${summary.label} ===`,
        `Status:             ${isSkipped ? 'SKIPPED' : 'completed'}`,
        `Metric mode:        ${variant.metricMode}`,
        `Field mode:         ${variant.fieldRuntimeMode}`,
        `Membrane:           ${variant.membraneEnabled ? variant.membraneMode : 'off'}`,
        `Plasticity:         ${variant.weakPlasticityEnabled ? variant.weakPlasticityMode : 'off'}`,
        `Constants:          ${variant.externalConstantsMode}`,
        `Ticks:              ${summary.ticks}`,
        `Seed:               ${summary.seed}`,
        ``,
        `--- Vortex / complex field ---`,
        `Vortex count avg:       ${fmt(summary.averageVortexCount, 1)}`,
        `Vortex lifetime avg:    ${fmt(summary.averageVortexLifetime, 1)} ticks`,
        `Phase coherence avg:    ${fmt(summary.averagePhaseCoherence)}`,
        `Signed charge |mean|:   ${fmt(summary.signedTotalChargeAbsMean)}`,
        ``,
        `--- Curvature ---`,
        `Curvature-vortex corr:  ${fmt(summary.averageCurvatureVortexCorrelation)}`,
        `Curvature bias:         ${fmt(summary.averageCurvatureBiasStrength)}`,
        ``,
        `--- Closure ---`,
        `Closure stability avg:  ${fmt(summary.averageClosureStability)}`,
        `Return strength avg:    ${fmt(summary.averageReturnStrength)}`,
        ``,
        `--- Membrane ---`,
        `Two-sidedness avg:      ${fmt(summary.averageMembraneTwoSidedness)}`,
        `Membrane integrity:     ${fmt(summary.averageMembraneIntegrity)}`,
        ``,
        `--- Plasticity ---`,
        `Plasticity accum total: ${fmt(summary.totalPlasticityAccumulation)}`,
        `Saturation risk max:    ${fmt(summary.plasticitySaturationRiskMax)}`,
        ``,
        `--- Observed ratios ---`,
        `Ratio match avg:        ${fmt(summary.averageObservedRatioMatchStrength)}`,
        `Resonance proxy max:    ${fmt(summary.maxEmergentResonanceProxy)}`,
        ``,
        `--- Safety / integrity ---`,
        `Semantic leak count:    ${summary.semanticLeakCount}`,
        `NaN/Infinity count:     ${summary.nanOrInfinityCount}`,
        `Max saturation risk:    ${fmt(summary.maxSaturationRisk)}`,
        `Max extinction risk:    ${fmt(summary.maxExtinctionRisk)}`,
    ];

    if (summary.notes.length > 0) {
        lines.push('');
        lines.push('--- Notes ---');
        for (const note of summary.notes) {
            lines.push(`  ${note}`);
        }
    }

    return lines;
}

/**
 * Returns a compact single-line summary for list display.
 */
export function renderVariantSummaryCardOneLiner(data: VariantSummaryCardData): string {
    const { summary } = data;
    const isSkipped = summary.notes.some(n => n.startsWith('SKIPPED'));
    const status = isSkipped ? '[SKIPPED]' : '[OK]';
    return (
        `${status} ${summary.label.padEnd(45)}`
        + ` vortex=${summary.averageVortexCount.toFixed(1)}`
        + ` closure=${summary.averageClosureStability.toFixed(3)}`
        + ` semantic_leak=${summary.semanticLeakCount}`
        + ` nan=${summary.nanOrInfinityCount}`
    );
}
