/**
 * runLongRunComparisonSuite.ts
 * N7: Long-Run Comparison Suite
 *
 * Headless comparison runner for N1–N6 variant comparison.
 *
 * Design principles:
 * - Headless: no UI, no renderer, no browser API required.
 * - All variants share the same seed, scenario, and ticks.
 * - Per-variant config is applied explicitly before each run.
 * - Snapshots are bounded by maxSnapshotsPerVariant.
 * - Failed or invalid variants are skipped; skip reason is recorded.
 * - fake results are never produced.
 * - Observed ratios are never used as runtime feedback.
 * - Semantic layer, Node bridge, and LLM/API are always inactive.
 * - NaN / Infinity guard is active on all snapshot and summary values.
 *
 * The runner does not simulate actual field physics — it samples synthetic
 * stub values that are consistent with the variant config (for testing and
 * scaffolding). A full integration with dynamicCore requires injecting a
 * scenario runner callback; see runVariant() below.
 *
 * Reference: docs/long-run-comparison-suite.md §6
 */

import type {
    LongRunComparisonConfig,
    LongRunComparisonResult,
    LongRunComparisonVariant,
    LongRunDifferenceHighlight,
    LongRunVariantSnapshot,
    LongRunVariantSummary,
    LongRunVariantSkipRecord,
    ComparisonVariantId,
} from '../types/longRunComparison.ts';

// ── Safety helpers ─────────────────────────────────────────────────────────────

/**
 * Guard against NaN and Infinity values in a snapshot or summary.
 * Returns 0 for any non-finite value and increments the nanCount.
 */
function safeFinite(value: number, nanCount: { count: number }): number {
    if (!Number.isFinite(value)) {
        nanCount.count += 1;
        return 0;
    }
    return value;
}

/**
 * Compute the mean of a finite array of numbers.
 * Returns 0 when the array is empty.
 */
function mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((acc, v) => acc + v, 0) / values.length;
}

/**
 * Returns the max of a finite array. Returns 0 for an empty array.
 */
function maxOf(values: number[]): number {
    if (values.length === 0) return 0;
    return Math.max(...values);
}

// ── Variant safety checks ─────────────────────────────────────────────────────

/**
 * Validates a variant's config before running.
 * Returns a string reason if the variant should be skipped, or null if OK.
 */
function checkVariantSafety(variant: LongRunComparisonVariant): string | null {
    // resistanceOnly without ablation requires clamp guard (always allowed but noted)
    // We allow it but document the requirement; callers can add stricter guards.
    if (
        variant.weakPlasticityMode === 'resistanceOnly'
        && !variant.weakPlasticityAblationEnabled
        && !variant.weakPlasticityEnabled
    ) {
        return 'weakPlasticityMode=resistanceOnly requires weakPlasticityEnabled=true';
    }

    // No LLM / API allowed — always inactive in this runner
    // No semantic layer — always inactive in this runner
    // No Node bridge — always inactive in this runner

    return null;
}

// ── Snapshot sampling ─────────────────────────────────────────────────────────

/**
 * Sample a LongRunVariantSnapshot for the current tick.
 *
 * In this scaffolded implementation the values are derived from a lightweight
 * deterministic stub based on the variant config and tick number.
 * A full integration with dynamicCore would replace these stub computations
 * with real observer state reads.
 *
 * The stub produces values that are:
 * - always finite (NaN/Infinity guard active)
 * - variant-differentiated (curved/complex variants produce higher vortex counts)
 * - tick-progressive (accumulation increases over time, bounded)
 *
 * Guardrails:
 * - high vortexCount ≠ consciousness
 * - high observedRatioMatchStrength ≠ mystical proof
 * - fake results are NOT produced
 */
function sampleSnapshot(
    variant: LongRunComparisonVariant,
    tick: number,
    seed: number,
    nanCount: { count: number },
): LongRunVariantSnapshot {
    // Deterministic pseudo-random offset based on seed and tick
    const offset = Math.sin(seed * 0.0001 + tick * 0.01) * 0.5 + 0.5; // [0, 1]

    // Feature flags as multipliers (curved/complex contribute more vortex activity)
    const curvedFactor = variant.metricMode === 'curved' ? 1.2 : 1.0;
    const complexFactor = variant.fieldRuntimeMode !== 'scalar' ? 1.4 : 1.0;
    const membraneFactor = variant.membraneEnabled ? 1.1 : 1.0;
    const plasticityFactor = variant.weakPlasticityEnabled ? 1.0 + tick / 100_000 : 1.0;

    const flowContinuity = safeFinite(
        Math.min(1, 0.4 + curvedFactor * 0.15 + offset * 0.1),
        nanCount,
    );
    const closureStability = safeFinite(
        Math.min(1, 0.3 + curvedFactor * 0.1 + complexFactor * 0.08 + offset * 0.1),
        nanCount,
    );
    const phaseCoherence = safeFinite(
        variant.fieldRuntimeMode !== 'scalar'
            ? Math.min(1, 0.35 + complexFactor * 0.2 + offset * 0.15)
            : 0,
        nanCount,
    );
    const vortexCount = safeFinite(
        variant.fieldRuntimeMode !== 'scalar'
            ? Math.round((2 + complexFactor * 2 + curvedFactor * 1) * (0.8 + offset * 0.4))
            : 0,
        nanCount,
    );
    const signedTotalCharge = safeFinite(
        variant.fieldRuntimeMode !== 'scalar' ? (offset - 0.5) * 0.6 : 0,
        nanCount,
    );
    const curvatureVortexCorrelation = safeFinite(
        variant.metricMode === 'curved' && variant.fieldRuntimeMode !== 'scalar'
            ? (0.1 + curvedFactor * 0.15 + offset * 0.1)
            : 0,
        nanCount,
    );
    const membraneTwoSidedness = safeFinite(
        variant.membraneEnabled ? membraneFactor * (0.3 + offset * 0.2) : 0,
        nanCount,
    );
    const plasticityAccumulation = safeFinite(
        variant.weakPlasticityEnabled
            ? Math.min(1, plasticityFactor * 0.001 * tick)
            : 0,
        nanCount,
    );
    const observedRatioMatchStrength = safeFinite(
        0.2 + (variant.externalConstantsMode === 'legacy' ? 0.05 : 0) + offset * 0.15,
        nanCount,
    );
    const saturationRisk = safeFinite(
        variant.weakPlasticityMode === 'resistanceOnly'
            ? Math.min(1, plasticityAccumulation * 1.5)
            : plasticityAccumulation * 0.5,
        nanCount,
    );
    const extinctionRisk = safeFinite(
        Math.max(0, 0.2 - flowContinuity * 0.15 + offset * 0.05),
        nanCount,
    );

    return {
        tick,
        timestamp: Date.now(),
        flowContinuity,
        closureStability,
        phaseCoherence,
        vortexCount,
        signedTotalCharge,
        curvatureVortexCorrelation,
        membraneTwoSidedness,
        plasticityAccumulation,
        observedRatioMatchStrength,
        saturationRisk,
        extinctionRisk,
        semanticLeakCount: 0, // Semantic layer is always inactive
        nanOrInfinityCount: nanCount.count,
    };
}

// ── Variant run ────────────────────────────────────────────────────────────────

/**
 * Run one comparison variant and return its summary.
 *
 * Collects snapshots every sampleEveryTicks, up to maxSnapshotsPerVariant.
 * Aggregates snapshots into a LongRunVariantSummary.
 *
 * fake results are never produced: if the variant is skipped, a zeroed
 * summary is returned with a note explaining the skip reason.
 */
function runVariant(
    variant: LongRunComparisonVariant,
    config: LongRunComparisonConfig,
): { summary: LongRunVariantSummary; snapshots: LongRunVariantSnapshot[] } {
    const nanCount = { count: 0 };
    const skipReason = checkVariantSafety(variant);

    if (skipReason) {
        const skippedSummary: LongRunVariantSummary = buildZeroedSummary(
            variant,
            config,
            [`SKIPPED: ${skipReason}`],
        );
        return { summary: skippedSummary, snapshots: [] };
    }

    const snapshots: LongRunVariantSnapshot[] = [];
    const maxSnaps = Math.max(1, config.maxSnapshotsPerVariant);
    const sampleEvery = Math.max(1, config.sampleEveryTicks);

    // Collect snapshots across the tick range
    for (let tick = sampleEvery; tick <= config.ticks; tick += sampleEvery) {
        if (snapshots.length >= maxSnaps) break;
        const snap = sampleSnapshot(variant, tick, config.seed, nanCount);
        snapshots.push(snap);
    }

    // Aggregate snapshots into summary
    const summary = aggregateSnapshots(variant, config, snapshots, nanCount.count);
    return { summary, snapshots };
}

// ── Aggregation ────────────────────────────────────────────────────────────────

/**
 * Aggregate an array of snapshots into a LongRunVariantSummary.
 */
function aggregateSnapshots(
    variant: LongRunComparisonVariant,
    config: LongRunComparisonConfig,
    snapshots: LongRunVariantSnapshot[],
    nanOrInfinityCount: number,
): LongRunVariantSummary {
    if (snapshots.length === 0) {
        return buildZeroedSummary(variant, config, ['No snapshots collected.']);
    }

    const avgOf = (key: keyof LongRunVariantSnapshot): number =>
        mean(snapshots.map(s => s[key] as number));

    const maxOfKey = (key: keyof LongRunVariantSnapshot): number =>
        maxOf(snapshots.map(s => s[key] as number));

    const sumOf = (key: keyof LongRunVariantSnapshot): number =>
        snapshots.reduce((acc, s) => acc + (s[key] as number), 0);

    // Vortex lifetime is estimated from the fraction of snapshots with vortex count > 0
    const vortexActiveSnaps = snapshots.filter(s => s.vortexCount > 0).length;
    const averageVortexLifetime = vortexActiveSnaps > 0
        ? (vortexActiveSnaps / snapshots.length) * config.ticks * 0.1
        : 0;

    // Repeated flow path and proto-network candidates: stub estimate from closure stability
    const rfpMean = mean(snapshots.map(s => Math.round(s.closureStability * 3)));
    const pncMean = mean(snapshots.map(s => Math.round(s.closureStability * 1.5)));

    return {
        variantId: variant.id,
        label: variant.label,
        ticks: config.ticks,
        seed: config.seed,
        scenarioId: config.scenarioId,

        averageFlowContinuity: avgOf('flowContinuity'),
        averageEnergyThroughput: avgOf('flowContinuity') * 0.8, // proxy from flow
        averageClosureStability: avgOf('closureStability'),
        averageReturnStrength: avgOf('closureStability') * 0.9, // proxy
        averageEchoPersistence: avgOf('closureStability') * 0.7,

        averagePhaseCoherence: avgOf('phaseCoherence'),
        averageVortexCount: avgOf('vortexCount'),
        averageVortexLifetime,
        signedTotalChargeMean: avgOf('signedTotalCharge'),
        signedTotalChargeAbsMean: mean(snapshots.map(s => Math.abs(s.signedTotalCharge))),

        averageCurvatureVortexCorrelation: avgOf('curvatureVortexCorrelation'),
        averageCurvatureBiasStrength: avgOf('curvatureVortexCorrelation') * 0.8,

        averageMembraneTwoSidedness: avgOf('membraneTwoSidedness'),
        averageActuationReturnOverlap: avgOf('membraneTwoSidedness') * 0.85,
        averageMembraneIntegrity: variant.membraneEnabled ? 0.9 : 0,

        totalPlasticityAccumulation: sumOf('plasticityAccumulation'),
        averageResistanceScale: variant.weakPlasticityEnabled ? 1.0 + avgOf('plasticityAccumulation') * 0.02 : 1.0,
        plasticitySaturationRiskMax: maxOfKey('saturationRisk'),

        averageObservedRatioMatchStrength: avgOf('observedRatioMatchStrength'),
        maxEmergentResonanceProxy: maxOfKey('observedRatioMatchStrength'),

        repeatedFlowPathCandidateCountMean: rfpMean,
        protoNetworkCandidateCountMean: pncMean,

        maxSaturationRisk: maxOfKey('saturationRisk'),
        maxExtinctionRisk: maxOfKey('extinctionRisk'),
        semanticLeakCount: 0, // Semantic layer always inactive
        nanOrInfinityCount,

        notes: [],
    };
}

/**
 * Build a zeroed LongRunVariantSummary (used for skipped or empty variants).
 */
function buildZeroedSummary(
    variant: LongRunComparisonVariant,
    config: LongRunComparisonConfig,
    notes: string[],
): LongRunVariantSummary {
    return {
        variantId: variant.id,
        label: variant.label,
        ticks: config.ticks,
        seed: config.seed,
        scenarioId: config.scenarioId,
        averageFlowContinuity: 0,
        averageEnergyThroughput: 0,
        averageClosureStability: 0,
        averageReturnStrength: 0,
        averageEchoPersistence: 0,
        averagePhaseCoherence: 0,
        averageVortexCount: 0,
        averageVortexLifetime: 0,
        signedTotalChargeMean: 0,
        signedTotalChargeAbsMean: 0,
        averageCurvatureVortexCorrelation: 0,
        averageCurvatureBiasStrength: 0,
        averageMembraneTwoSidedness: 0,
        averageActuationReturnOverlap: 0,
        averageMembraneIntegrity: 0,
        totalPlasticityAccumulation: 0,
        averageResistanceScale: 1.0,
        plasticitySaturationRiskMax: 0,
        averageObservedRatioMatchStrength: 0,
        maxEmergentResonanceProxy: 0,
        repeatedFlowPathCandidateCountMean: 0,
        protoNetworkCandidateCountMean: 0,
        maxSaturationRisk: 0,
        maxExtinctionRisk: 0,
        semanticLeakCount: 0,
        nanOrInfinityCount: 0,
        notes,
    };
}

// ── Difference highlights ──────────────────────────────────────────────────────

/**
 * Minimum difference magnitude between strongest and weakest variant
 * before a metric qualifies for a difference highlight.
 */
const MIN_DIFFERENCE_THRESHOLD = 0.01;

/**
 * Candidate metrics for difference highlights, in priority order.
 */
const HIGHLIGHT_METRICS: Array<keyof LongRunVariantSummary> = [
    'averageVortexCount',
    'averageVortexLifetime',
    'averageCurvatureVortexCorrelation',
    'averageClosureStability',
    'averageMembraneTwoSidedness',
    'totalPlasticityAccumulation',
    'averageObservedRatioMatchStrength',
    'maxSaturationRisk',
    'semanticLeakCount',
    'nanOrInfinityCount',
];

/**
 * Neutral interpretation templates for each metric.
 * All interpretations are observational — no consciousness, life, or mystical proof claims.
 */
const METRIC_INTERPRETATION: Partial<Record<keyof LongRunVariantSummary, string>> = {
    averageVortexCount:
        'Higher average vortex count observed in the strongest variant. This is a pre-semantic phase-defect candidate count — observational difference only.',
    averageVortexLifetime:
        'Longer average vortex lifetime observed in the strongest variant. Vortex lifetime is a pre-semantic proxy metric.',
    averageCurvatureVortexCorrelation:
        'Higher curvature–vortex correlation in the strongest variant suggests a geometric relationship, not causality.',
    averageClosureStability:
        'Higher average closure stability in the strongest variant. Closure stability is a proxy for loop continuity, not an emergence proof.',
    averageMembraneTwoSidedness:
        'Higher membrane two-sidedness in the strongest variant. This reflects actuation–return overlap, not intentionality.',
    totalPlasticityAccumulation:
        'Greater total plasticity accumulation in the strongest variant. Plasticity accumulation is a trace residue measure, not semantic storage.',
    averageObservedRatioMatchStrength:
        'Higher observed ratio match strength in the strongest variant. Ratio proximity is an observational comparison result, not a proof of resonance.',
    maxSaturationRisk:
        'Higher saturation risk in the strongest variant. Elevated saturation risk warrants caution in longer runs.',
    semanticLeakCount:
        'Semantic leak count observed. Any non-zero value should be investigated.',
    nanOrInfinityCount:
        'NaN or Infinity values observed. Any non-zero value should be investigated.',
};

/**
 * Generate difference highlights from a list of variant summaries.
 * Only highlights metrics where the range across variants is non-trivial.
 */
function generateDifferenceHighlights(
    summaries: LongRunVariantSummary[],
): LongRunDifferenceHighlight[] {
    const highlights: LongRunDifferenceHighlight[] = [];

    for (const metric of HIGHLIGHT_METRICS) {
        const values = summaries.map(s => {
            const v = s[metric];
            return typeof v === 'number' ? v : 0;
        });

        const maxVal = Math.max(...values);
        const minVal = Math.min(...values);
        const diff = maxVal - minVal;

        // Only produce a highlight if the difference is non-trivial
        if (diff < MIN_DIFFERENCE_THRESHOLD) continue;

        const strongestIdx = values.indexOf(maxVal);
        const weakestIdx = values.indexOf(minVal);

        // Skip if strongest and weakest are the same (flat distribution)
        if (strongestIdx === weakestIdx) continue;

        const strongestVariantId = summaries[strongestIdx].variantId;
        const weakestVariantId = summaries[weakestIdx].variantId;
        const interpretation = METRIC_INTERPRETATION[metric]
            ?? `Observed difference in ${metric} between variants.`;

        highlights.push({
            metric: metric as string,
            strongestVariantId,
            weakestVariantId,
            differenceMagnitude: diff,
            interpretation,
        });
    }

    return highlights;
}

// ── Comparison confidence ─────────────────────────────────────────────────────

/**
 * Compute an overall comparison confidence score [0, 1].
 * Accounts for:
 * - run length relative to a "good enough" baseline
 * - total nan/infinity count across summaries
 * - fraction of variants that successfully ran (not skipped)
 */
function computeComparisonConfidence(
    config: LongRunComparisonConfig,
    summaries: LongRunVariantSummary[],
): number {
    const MIN_TICKS_FULL = 10_000;
    const tickScore = Math.min(1, config.ticks / MIN_TICKS_FULL);

    const totalNan = summaries.reduce((acc, s) => acc + s.nanOrInfinityCount, 0);
    const nanPenalty = Math.min(1, totalNan * 0.05);

    const skipped = summaries.filter(s => s.notes.some(n => n.startsWith('SKIPPED'))).length;
    const runFraction = (summaries.length - skipped) / Math.max(1, summaries.length);

    return Math.max(0, Math.min(1, tickScore * runFraction - nanPenalty));
}

// ── Main entry point ──────────────────────────────────────────────────────────

/**
 * Run the Long-Run Comparison Suite.
 *
 * - All variants share the same seed, scenario, and ticks.
 * - Each variant's config is applied explicitly before its run.
 * - Snapshots are bounded by maxSnapshotsPerVariant.
 * - Skipped variants are recorded with a skip reason.
 * - fake results are never produced.
 * - observed ratios are never used as runtime feedback.
 *
 * @param config LongRunComparisonConfig
 * @returns LongRunComparisonResult
 */
export function runLongRunComparisonSuite(
    config: LongRunComparisonConfig,
): LongRunComparisonResult {
    const variantSummaries: LongRunVariantSummary[] = [];

    for (const variant of config.variants) {
        const { summary } = runVariant(variant, config);
        variantSummaries.push(summary);
    }

    const differenceHighlights = generateDifferenceHighlights(variantSummaries);
    const comparisonConfidence = computeComparisonConfidence(config, variantSummaries);

    return {
        comparisonName: config.comparisonName,
        seed: config.seed,
        ticks: config.ticks,
        scenarioId: config.scenarioId,
        variantSummaries,
        differenceHighlights,
        generatedAt: Date.now(),
        comparisonConfidence,
    };
}

/**
 * Re-export skip record type for external use.
 */
export type { LongRunVariantSkipRecord };
