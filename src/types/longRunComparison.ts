/**
 * longRunComparison.ts
 * N7: Long-Run Comparison Suite
 *
 * Type definitions for the Long-Run Comparison Suite.
 * This suite compares N1–N6 variants over a shared seed / scenario / ticks run.
 *
 * Design principles:
 * - No behavior change to runtime dynamics.
 * - Comparison is observation-only: pre-semantic field, vortex, trace, closure, ratio,
 *   and candidate structure statistics.
 * - Results are never fed back to runtime.
 * - Fake results and fake events are prohibited.
 * - high vortex count ≠ consciousness.
 * - high ratio match ≠ mystical proof.
 * - high plasticity accumulation ≠ memory.
 * - high closure stability ≠ self-awareness.
 * - Absence of emergence is a valid observation.
 *
 * Reference: docs/long-run-comparison-suite.md
 */

// ── Variant IDs ────────────────────────────────────────────────────────────────

/**
 * Identifies a comparison variant.
 * Each variant has a fully explicit configuration so that comparisons are
 * reproducible and unambiguous.
 */
export type ComparisonVariantId =
    | 'legacyFlatScalar'
    | 'curvedOnly'
    | 'complexOnly'
    | 'curvedComplex'
    | 'curvedComplexMembrane'
    | 'curvedComplexPlasticityObserveOnly'
    | 'curvedComplexPlasticityResistanceOnly'
    | 'neutralConstantsFullNatural'
    | 'legacyConstantsFullNatural';

// ── Variant definition ─────────────────────────────────────────────────────────

/**
 * Fully explicit configuration for one comparison variant.
 *
 * Each field corresponds directly to a runtime config parameter introduced in
 * N1–N6 so that every variant's setup is unambiguous and deterministic.
 */
export interface LongRunComparisonVariant {
    /** Stable identifier for this variant */
    id: ComparisonVariantId;

    /** Human-readable label (used in UI cards and Markdown tables) */
    label: string;

    /** Short description of what this variant is designed to isolate */
    description: string;

    /**
     * Torus metric mode.
     * 'flat'   : default flat periodic 2-D grid (pre-N1 baseline)
     * 'curved' : N1 curved torus metric with area-normalised update
     */
    metricMode: 'flat' | 'curved';

    /**
     * Field runtime mode.
     * 'scalar'          : real scalar field (pre-N2 baseline)
     * 'complexObserver' : complex field tracked observer-side only
     * 'complexRuntime'  : complex field fed back to runtime (experimental)
     */
    fieldRuntimeMode: 'scalar' | 'complexObserver' | 'complexRuntime';

    /** Whether the membrane layer is active in this variant */
    membraneEnabled: boolean;

    /**
     * Membrane mode.
     * 'off'          : membrane is inactive
     * 'observerOnly' : N4 default — membrane observes, does not couple to runtime
     * 'weakCoupling' : membrane weakly coupled to runtime dynamics
     */
    membraneMode: 'off' | 'observerOnly' | 'weakCoupling';

    /** Whether weak plasticity is enabled in this variant */
    weakPlasticityEnabled: boolean;

    /**
     * Weak plasticity mode.
     * 'off'             : plasticity inactive
     * 'observeOnly'     : accumulation computed, resistanceScale never applied
     * 'resistanceOnly'  : resistanceScale may be weakly applied (clamp required)
     */
    weakPlasticityMode: 'off' | 'observeOnly' | 'resistanceOnly';

    /**
     * When true, weak plasticity resistanceScale is computed but never returned
     * to the runtime, even in resistanceOnly mode.
     * Required when mode='resistanceOnly' for safety validation.
     */
    weakPlasticityAblationEnabled: boolean;

    /**
     * External constants mode (N6).
     * 'neutral' : core dynamics uses only explicit config parameters (default)
     * 'legacy'  : restores pre-N6 code path — comparison use ONLY
     */
    externalConstantsMode: 'legacy' | 'neutral';

    /** Informational notes about this variant's purpose or safety requirements */
    notes: string[];
}

// ── Comparison config ──────────────────────────────────────────────────────────

/**
 * Configuration for a single long-run comparison run.
 * All variants share the same seed, ticks, and scenarioId so that
 * differences are attributable to variant config alone.
 */
export interface LongRunComparisonConfig {
    /** Name used in report headers and exports */
    comparisonName: string;

    /** Shared random seed — must be the same for all variants */
    seed: number;

    /** Shared number of ticks per variant run */
    ticks: number;

    /** Shared scenario identifier (from ScenarioPresetId) */
    scenarioId: string;

    /** Variants to run in this comparison */
    variants: LongRunComparisonVariant[];

    /** Take a snapshot every N ticks per variant */
    sampleEveryTicks: number;

    /** When true, richer per-snapshot data is recorded (still bounded by maxSnapshotsPerVariant) */
    enableDetailedSnapshots: boolean;

    /** Hard limit on stored snapshots per variant to avoid memory bloat */
    maxSnapshotsPerVariant: number;
}

// ── Snapshots ─────────────────────────────────────────────────────────────────

/**
 * A lightweight per-tick sample taken every sampleEveryTicks.
 * Heavy raw field data is NOT stored here — only derived scalar metrics.
 */
export interface LongRunVariantSnapshot {
    tick: number;
    timestamp: number;
    flowContinuity: number;
    closureStability: number;
    phaseCoherence: number;
    vortexCount: number;
    signedTotalCharge: number;
    curvatureVortexCorrelation: number;
    membraneTwoSidedness: number;
    plasticityAccumulation: number;
    observedRatioMatchStrength: number;
    saturationRisk: number;
    extinctionRisk: number;
    semanticLeakCount: number;
    nanOrInfinityCount: number;
}

// ── Variant summary ────────────────────────────────────────────────────────────

/**
 * Aggregated summary statistics for one completed variant run.
 * All averages are computed over the full ticks run at sampleEveryTicks resolution.
 *
 * Interpretation guardrails (must be respected in all UIs and docs):
 * - high averageVortexCount   ≠ consciousness
 * - high averageObservedRatioMatchStrength ≠ mystical proof
 * - high totalPlasticityAccumulation ≠ memory
 * - high averageClosureStability ≠ self-awareness
 * - low values / absence of emergence = valid observation
 */
export interface LongRunVariantSummary {
    variantId: ComparisonVariantId;
    label: string;
    ticks: number;
    seed: number;
    scenarioId: string;

    // Flow / energy
    averageFlowContinuity: number;
    averageEnergyThroughput: number;

    // Closure
    averageClosureStability: number;
    averageReturnStrength: number;
    averageEchoPersistence: number;

    // Vortex / complex field
    averagePhaseCoherence: number;
    averageVortexCount: number;
    averageVortexLifetime: number;
    signedTotalChargeMean: number;
    signedTotalChargeAbsMean: number;

    // Curvature
    averageCurvatureVortexCorrelation: number;
    averageCurvatureBiasStrength: number;

    // Membrane
    averageMembraneTwoSidedness: number;
    averageActuationReturnOverlap: number;
    averageMembraneIntegrity: number;

    // Plasticity
    totalPlasticityAccumulation: number;
    averageResistanceScale: number;
    plasticitySaturationRiskMax: number;

    // Observed ratios / emergent proxy
    averageObservedRatioMatchStrength: number;
    maxEmergentResonanceProxy: number;

    // Candidates
    repeatedFlowPathCandidateCountMean: number;
    protoNetworkCandidateCountMean: number;

    // Safety / integrity
    maxSaturationRisk: number;
    maxExtinctionRisk: number;
    semanticLeakCount: number;
    nanOrInfinityCount: number;

    /** Optional notes from the run (e.g. skipped reason) */
    notes: string[];
}

// ── Difference highlights ──────────────────────────────────────────────────────

/**
 * A highlight of a notable cross-variant difference for a single metric.
 * interpretation must be neutral and observational — no consciousness,
 * life, intelligence, or mystical proof claims.
 */
export interface LongRunDifferenceHighlight {
    /** Name of the metric (matches a field on LongRunVariantSummary) */
    metric: string;

    /** Variant that showed the highest value for this metric */
    strongestVariantId: ComparisonVariantId;

    /** Variant that showed the lowest value for this metric */
    weakestVariantId: ComparisonVariantId;

    /** Absolute magnitude of the difference (strongest − weakest) */
    differenceMagnitude: number;

    /**
     * Neutral observational interpretation.
     * Example: "Curved + complex variants showed higher vortex lifetime than flat scalar baseline."
     * Forbidden: "consciousness increased", "intelligence emerged", "life was proven".
     */
    interpretation: string;
}

// ── Comparison result ──────────────────────────────────────────────────────────

/**
 * The full result of a Long-Run Comparison Suite run.
 * Contains per-variant summaries and cross-variant difference highlights.
 */
export interface LongRunComparisonResult {
    comparisonName: string;
    seed: number;
    ticks: number;
    scenarioId: string;

    /** Summary for each variant (including skipped variants with empty metrics) */
    variantSummaries: LongRunVariantSummary[];

    /** Cross-variant difference highlights for notable metrics */
    differenceHighlights: LongRunDifferenceHighlight[];

    /** Unix timestamp (ms) when this result was generated */
    generatedAt: number;

    /**
     * Confidence score for the comparison [0, 1].
     * Accounts for run length, snapshot count, and nan/infinity incidence.
     * Lower confidence = shorter run or higher nan/infinity rate.
     */
    comparisonConfidence: number;
}

// ── Skipped variant record ─────────────────────────────────────────────────────

/**
 * Records why a variant was skipped rather than run.
 * A skipped variant produces a zeroed LongRunVariantSummary with a skipped note.
 */
export interface LongRunVariantSkipRecord {
    variantId: ComparisonVariantId;
    reason: string;
}
