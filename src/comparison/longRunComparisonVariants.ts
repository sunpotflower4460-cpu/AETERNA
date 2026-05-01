/**
 * longRunComparisonVariants.ts
 * N7: Long-Run Comparison Suite
 *
 * Registry of all comparison variants.
 * Each variant has a fully explicit configuration so that comparisons are
 * reproducible and unambiguous.
 *
 * Principles:
 * - No variant is called "bad" or "broken" — all are reference points.
 * - 'legacyFlatScalar' is the pre-N-series baseline, not a worse version.
 * - 'legacyConstantsFullNatural' is comparison-only — not the default runtime.
 * - Variant configs must not be used to alter runtime dynamics.
 * - observed ratio is never used as runtime feedback.
 *
 * Reference: docs/long-run-comparison-suite.md §3
 */

import type {
    LongRunComparisonVariant,
    ComparisonVariantId,
} from '../types/longRunComparison.ts';

// ── Variant definitions ────────────────────────────────────────────────────────

/**
 * legacyFlatScalar
 *
 * Pre-N-series baseline for comparison reference.
 * - flat metric
 * - scalar field
 * - membrane off
 * - weak plasticity off
 * - legacy external constants
 *
 * This is a comparison reference point, not a "worse" variant.
 */
const legacyFlatScalar: LongRunComparisonVariant = {
    id: 'legacyFlatScalar',
    label: 'Legacy Flat Scalar',
    description:
        'Pre-N-series comparison baseline. Flat metric, scalar field, membrane off, '
        + 'weak plasticity off, legacy external constants. '
        + 'All N1–N6 features are disabled.',
    metricMode: 'flat',
    fieldRuntimeMode: 'scalar',
    membraneEnabled: false,
    membraneMode: 'off',
    weakPlasticityEnabled: false,
    weakPlasticityMode: 'off',
    weakPlasticityAblationEnabled: true,
    externalConstantsMode: 'legacy',
    notes: [
        'Comparison reference only — not labelled as inferior.',
        'Use to establish pre-N-series baseline for all metrics.',
    ],
};

/**
 * curvedOnly
 *
 * Isolates the effect of the N1 curved torus metric.
 * - curved metric
 * - scalar field
 * - membrane off
 * - weak plasticity off
 * - neutral constants (recommended for N-series comparison)
 *
 * Observe: curvature asymmetry, active region distribution,
 *          closure stability, trace distribution.
 */
const curvedOnly: LongRunComparisonVariant = {
    id: 'curvedOnly',
    label: 'Curved Only',
    description:
        'N1 curved torus metric in isolation. Scalar field, membrane off, '
        + 'weak plasticity off, neutral constants. '
        + 'Designed to isolate curvature effects on field dynamics.',
    metricMode: 'curved',
    fieldRuntimeMode: 'scalar',
    membraneEnabled: false,
    membraneMode: 'off',
    weakPlasticityEnabled: false,
    weakPlasticityMode: 'off',
    weakPlasticityAblationEnabled: true,
    externalConstantsMode: 'neutral',
    notes: [
        'Observe: curvature asymmetry, active region distribution, closure stability, trace distribution.',
        'Compare against legacyFlatScalar to isolate curvature contribution.',
    ],
};

/**
 * complexOnly
 *
 * Isolates the effect of the N2 complex scalar field.
 * - flat metric
 * - complex field (observer mode)
 * - membrane off
 * - weak plasticity off
 * - neutral constants
 *
 * Observe: vortex count, phase coherence, signed total charge, vortex lifetime.
 */
const complexOnly: LongRunComparisonVariant = {
    id: 'complexOnly',
    label: 'Complex Only',
    description:
        'N2 complex field in isolation. Flat metric, complex field (observer mode), '
        + 'membrane off, weak plasticity off, neutral constants. '
        + 'Designed to isolate complex field / vortex effects.',
    metricMode: 'flat',
    fieldRuntimeMode: 'complexObserver',
    membraneEnabled: false,
    membraneMode: 'off',
    weakPlasticityEnabled: false,
    weakPlasticityMode: 'off',
    weakPlasticityAblationEnabled: true,
    externalConstantsMode: 'neutral',
    notes: [
        'Observe: vortex count, phase coherence, signed total charge, vortex lifetime.',
        'Compare against legacyFlatScalar to isolate complex field contribution.',
    ],
};

/**
 * curvedComplex
 *
 * N1 + N2 combination: curved torus metric with complex field.
 * - curved metric
 * - complex field (observer mode)
 * - membrane off
 * - weak plasticity off
 * - neutral constants
 *
 * Observe: curvature-vortex correlation, vortex density by curvature,
 *          inner/outer rim vortex stats, signed total charge.
 */
const curvedComplex: LongRunComparisonVariant = {
    id: 'curvedComplex',
    label: 'Curved + Complex',
    description:
        'N1 curved metric combined with N2 complex field. '
        + 'Membrane off, weak plasticity off, neutral constants. '
        + 'Designed to observe curvature–vortex interaction.',
    metricMode: 'curved',
    fieldRuntimeMode: 'complexObserver',
    membraneEnabled: false,
    membraneMode: 'off',
    weakPlasticityEnabled: false,
    weakPlasticityMode: 'off',
    weakPlasticityAblationEnabled: true,
    externalConstantsMode: 'neutral',
    notes: [
        'Observe: curvature-vortex correlation, vortex density by curvature, inner/outer rim vortex stats.',
        'Key cross-variant comparison: does curvature affect where vortices form?',
    ],
};

/**
 * curvedComplexMembrane
 *
 * N1 + N2 + N4 membrane layer.
 * - curved metric
 * - complex field (observer mode)
 * - membrane observerOnly (N4 default)
 * - weak plasticity off
 * - neutral constants
 *
 * Observe: actuationReturnOverlap, twoSidedness, membraneIntegrity,
 *          closure stability, return delay.
 */
const curvedComplexMembrane: LongRunComparisonVariant = {
    id: 'curvedComplexMembrane',
    label: 'Curved + Complex + Membrane',
    description:
        'N1 + N2 + N4 (membrane observerOnly). '
        + 'Weak plasticity off, neutral constants. '
        + 'Designed to observe whether the membrane layer affects closure loop observation.',
    metricMode: 'curved',
    fieldRuntimeMode: 'complexObserver',
    membraneEnabled: true,
    membraneMode: 'observerOnly',
    weakPlasticityEnabled: false,
    weakPlasticityMode: 'off',
    weakPlasticityAblationEnabled: true,
    externalConstantsMode: 'neutral',
    notes: [
        'Observe: actuationReturnOverlap, twoSidedness, membraneIntegrity, closure stability, return delay.',
        'Membrane is in observerOnly mode — it does not alter runtime dynamics.',
    ],
};

/**
 * curvedComplexPlasticityObserveOnly
 *
 * N1 + N2 + N4 + N5 (plasticity observeOnly, ablation on).
 * - curved metric
 * - complex field (observer mode)
 * - membrane observerOnly
 * - weak plasticity observeOnly + ablation on
 * - neutral constants
 *
 * Observe: plasticity accumulation, affected region count,
 *          resistanceScale computed but not applied, vortex trace accumulation,
 *          repeated flow trace accumulation.
 */
const curvedComplexPlasticityObserveOnly: LongRunComparisonVariant = {
    id: 'curvedComplexPlasticityObserveOnly',
    label: 'Curved + Complex + Plasticity (observe-only)',
    description:
        'N1 + N2 + N4 + N5 (plasticity observeOnly, ablation enabled). '
        + 'Neutral constants. '
        + 'Plasticity trace accumulates but is never fed back to runtime. '
        + 'Designed to observe whether trace builds without runtime influence.',
    metricMode: 'curved',
    fieldRuntimeMode: 'complexObserver',
    membraneEnabled: true,
    membraneMode: 'observerOnly',
    weakPlasticityEnabled: true,
    weakPlasticityMode: 'observeOnly',
    weakPlasticityAblationEnabled: true,
    externalConstantsMode: 'neutral',
    notes: [
        'Observe: plasticity accumulation, affected region count, trace growth over time.',
        'resistanceScale is computed but never applied (ablation is on).',
        'Absence of runtime effect confirms observer-only isolation.',
    ],
};

/**
 * curvedComplexPlasticityResistanceOnly
 *
 * N1 + N2 + N4 + N5 (plasticity resistanceOnly, ablation off).
 * - curved metric
 * - complex field (observer mode)
 * - membrane observerOnly or weakCoupling
 * - weak plasticity resistanceOnly + ablation off
 * - neutral constants
 *
 * SAFETY NOTE: This is the highest-risk variant.
 * clamp / safety guards must be verified before running.
 *
 * Observe: vortex lifetime, repeated flow path stability,
 *          trace persistence, closure stability,
 *          saturation risk, plasticity saturation risk.
 */
const curvedComplexPlasticityResistanceOnly: LongRunComparisonVariant = {
    id: 'curvedComplexPlasticityResistanceOnly',
    label: 'Curved + Complex + Plasticity (resistance-only)',
    description:
        'N1 + N2 + N4 + N5 (plasticity resistanceOnly, ablation disabled). '
        + 'Neutral constants. '
        + 'resistanceScale is weakly applied to runtime. '
        + 'Designed to observe whether weak resistance feedback affects trace persistence.',
    metricMode: 'curved',
    fieldRuntimeMode: 'complexObserver',
    membraneEnabled: true,
    membraneMode: 'observerOnly',
    weakPlasticityEnabled: true,
    weakPlasticityMode: 'resistanceOnly',
    weakPlasticityAblationEnabled: false,
    externalConstantsMode: 'neutral',
    notes: [
        'HIGHEST RISK VARIANT: clamp and saturation guard must be verified before running.',
        'Observe: vortex lifetime, trace persistence, closure stability, saturation risk.',
        'Any saturation risk > 0.8 should be noted in results.',
        'Compare against curvedComplexPlasticityObserveOnly to see runtime effect.',
    ],
};

/**
 * neutralConstantsFullNatural
 *
 * Full N1+N2+N4+N5+N6 natural variant with neutral constants.
 * - curved metric
 * - complex field (observer mode)
 * - membrane observerOnly
 * - weak plasticity observeOnly (safe default)
 * - neutral constants (N6 default)
 *
 * Observe: observed ratios, reference ratio distance,
 *          emergent resonance proxy, long-run stability.
 */
const neutralConstantsFullNatural: LongRunComparisonVariant = {
    id: 'neutralConstantsFullNatural',
    label: 'Full Natural (neutral constants)',
    description:
        'All N1–N6 features enabled with neutral external constants (N6 default). '
        + 'Curved metric, complex field, membrane observerOnly, '
        + 'weak plasticity observeOnly, neutral constants. '
        + 'Long-run stability and ratio observation variant.',
    metricMode: 'curved',
    fieldRuntimeMode: 'complexObserver',
    membraneEnabled: true,
    membraneMode: 'observerOnly',
    weakPlasticityEnabled: true,
    weakPlasticityMode: 'observeOnly',
    weakPlasticityAblationEnabled: true,
    externalConstantsMode: 'neutral',
    notes: [
        'Observe: observed ratio match strength, emergent resonance proxy, long-run stability.',
        'Default N-series configuration — most representative of intended behaviour.',
        'Compare against legacyConstantsFullNatural to isolate constants effect.',
    ],
};

/**
 * legacyConstantsFullNatural
 *
 * Same as neutralConstantsFullNatural but with legacy external constants.
 * For N6 before/after comparison only — NOT the default runtime.
 *
 * Observe: same metrics as neutralConstantsFullNatural.
 * Compare: does removing legacy constants change observed ratio match strength?
 */
const legacyConstantsFullNatural: LongRunComparisonVariant = {
    id: 'legacyConstantsFullNatural',
    label: 'Full Natural (legacy constants)',
    description:
        'All N1–N6 features enabled with legacy external constants (pre-N6). '
        + 'Curved metric, complex field, membrane observerOnly, '
        + 'weak plasticity observeOnly, legacy constants. '
        + 'Comparison counterpart to neutralConstantsFullNatural. '
        + 'NOT the default runtime — comparison use only.',
    metricMode: 'curved',
    fieldRuntimeMode: 'complexObserver',
    membraneEnabled: true,
    membraneMode: 'observerOnly',
    weakPlasticityEnabled: true,
    weakPlasticityMode: 'observeOnly',
    weakPlasticityAblationEnabled: true,
    externalConstantsMode: 'legacy',
    notes: [
        'COMPARISON ONLY — do not set as default runtime.',
        'Observe: observed ratio match strength vs neutralConstantsFullNatural.',
        'Are legacy constants solely responsible for observed ratio proximity?',
    ],
};

// ── Registry ───────────────────────────────────────────────────────────────────

/**
 * All comparison variants in canonical order.
 * The order is chosen for logical progression: baseline → individual features
 * → combined features → full natural variants.
 */
export const LONG_RUN_COMPARISON_VARIANTS: LongRunComparisonVariant[] = [
    legacyFlatScalar,
    curvedOnly,
    complexOnly,
    curvedComplex,
    curvedComplexMembrane,
    curvedComplexPlasticityObserveOnly,
    curvedComplexPlasticityResistanceOnly,
    neutralConstantsFullNatural,
    legacyConstantsFullNatural,
];

// ── Lookup helpers ─────────────────────────────────────────────────────────────

/**
 * Look up a comparison variant by its ID.
 * Returns undefined if the ID is not found.
 */
export function getLongRunVariant(id: ComparisonVariantId): LongRunComparisonVariant | undefined {
    return LONG_RUN_COMPARISON_VARIANTS.find(v => v.id === id);
}

/**
 * Return all registered variant IDs in canonical order.
 */
export function getAllVariantIds(): ComparisonVariantId[] {
    return LONG_RUN_COMPARISON_VARIANTS.map(v => v.id);
}
