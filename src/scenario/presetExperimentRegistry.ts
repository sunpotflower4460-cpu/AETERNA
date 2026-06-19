/**
 * presetExperimentRegistry.ts
 * AETERNA-NATURAL v1.3 Research Scenarios / Preset Experiments
 *
 * Registry of all named PresetExperiment definitions.
 * Each experiment is a concrete, reproducible observation unit binding a
 * ResearchScenario to a runtime preset, seed, ticks, and sampleEveryTicks.
 *
 * Principles:
 * - All descriptions and notes are neutral / scientific.
 * - No desire / life / intelligence / spiritual claims in any field text.
 * - expectedObservationKinds are observation targets, not guaranteed results.
 * - seed / ticks / sampleEveryTicks are explicit for reproducibility.
 * - runtimeConfigOverrides, when present, never activate runtime feedback paths
 *   in 'safe' or 'research' safetyLevel experiments.
 *
 * Reference: docs/research-scenarios-preset-experiments.md
 */

import type { PresetExperiment } from '../types/presetExperiment.ts';

// ── Registry ──────────────────────────────────────────────────────────────────

export const PRESET_EXPERIMENT_REGISTRY: PresetExperiment[] = [

    // ── E01: Quiet Baseline (safe) ────────────────────────────────────────────

    {
        id: 'E01_quietBaselineSafe',
        experimentKind: 'observation',
        title: 'Quiet Baseline — Safe',
        description:
            'Resting-state observation using safeBaseline preset. '
            + 'Flat metric, scalar field, plasticity off, neutral constants. '
            + 'Establishes a reference for flow continuity, trace decay, and extinction risk.',
        scenarioId: 'quietBaseline',
        seed: 1000,
        ticks: 2000,
        sampleEveryTicks: 50,
        runtimePresetId: 'safeBaseline',
        expectedObservationKinds: [
            'flowContinuity',
            'energyThroughput',
            'traceResidue',
            'extinctionRisk',
            'semanticLeakCount',
            'nanOrInfinityCount',
        ],
        safetyLevel: 'safe',
        exportTags: ['baseline', 'quiet', 'safe'],
        notes: [
            'No perturbation is applied. Low activity is a valid result.',
            'semanticLeakCount must equal 0.',
        ],
    },

    // ── E02: Quiet Baseline (natural observer) ────────────────────────────────

    {
        id: 'E02_quietBaselineNatural',
        experimentKind: 'observation',
        title: 'Quiet Baseline — Natural Observer Suite',
        description:
            'Resting-state observation using naturalObserverSuite preset. '
            + 'Curved metric, complex observer, plasticity observeOnly, neutral constants. '
            + 'Compares resting field metrics against safeBaseline reference (E01).',
        scenarioId: 'quietBaseline',
        seed: 1000,
        ticks: 2000,
        sampleEveryTicks: 50,
        runtimePresetId: 'naturalObserverSuite',
        expectedObservationKinds: [
            'flowContinuity',
            'energyThroughput',
            'traceResidue',
            'extinctionRisk',
            'phaseCoherence',
            'vortexCandidateCount',
            'semanticLeakCount',
            'nanOrInfinityCount',
        ],
        safetyLevel: 'research',
        exportTags: ['baseline', 'quiet', 'natural-observer'],
        notes: [
            'Run with the same seed as E01 to enable direct comparison.',
            'No runtime feedback paths are active.',
        ],
    },

    // ── E03: Single Pulse Return ──────────────────────────────────────────────

    {
        id: 'E03_singlePulseReturn',
        experimentKind: 'observation',
        title: 'Single Pulse Return',
        description:
            'Single-perturbation observation using naturalObserverSuite. '
            + 'Measures how WorldMedium, Membrane, SensoryReturn, and Closure '
            + 'respond to one discrete actuation pulse.',
        scenarioId: 'singlePulseReturn',
        seed: 1001,
        ticks: 1000,
        sampleEveryTicks: 25,
        runtimePresetId: 'naturalObserverSuite',
        expectedObservationKinds: [
            'actuationPulse',
            'sensoryReturn',
            'returnStrength',
            'closureStability',
            'membraneDeformation',
            'actuationReturnOverlap',
        ],
        safetyLevel: 'research',
        exportTags: ['single-pulse', 'return', 'membrane'],
        notes: [
            'Membrane is observer-only; no runtime coupling.',
            'Return signal absence is a valid observation.',
        ],
    },

    // ── E04: Repeated Gentle Pulse ────────────────────────────────────────────

    {
        id: 'E04_repeatedGentlePulse',
        experimentKind: 'observation',
        title: 'Repeated Gentle Pulse',
        description:
            'Repeated weak-perturbation observation using naturalObserverSuite. '
            + 'Observes whether trace residue, local excitability, and repeated flow '
            + 'path candidates change under sustained gentle perturbation.',
        scenarioId: 'repeatedGentlePulse',
        seed: 1002,
        ticks: 3000,
        sampleEveryTicks: 50,
        runtimePresetId: 'naturalObserverSuite',
        expectedObservationKinds: [
            'traceResidue',
            'localExcitability',
            'repeatedFlowPathCandidate',
            'closureStability',
        ],
        safetyLevel: 'research',
        exportTags: ['repeated-perturbation', 'trace', 'flow-path'],
        notes: [
            'Trace accumulation is observer-side only — not semantic memory.',
            'Path candidate formation is not guaranteed.',
        ],
    },

    // ── E05: Repeated Gentle Pulse — Plasticity ObserveOnly ──────────────────

    {
        id: 'E05_repeatedGentlePulsePlasticity',
        experimentKind: 'observation',
        title: 'Repeated Gentle Pulse — Plasticity Observe-Only',
        description:
            'Repeated weak-perturbation observation using plasticityObserveOnly preset. '
            + 'Focuses on weak plasticity trace accumulation under repeated perturbation. '
            + 'resistanceScale is computed but never applied to runtime.',
        scenarioId: 'repeatedGentlePulse',
        seed: 1002,
        ticks: 3000,
        sampleEveryTicks: 50,
        runtimePresetId: 'plasticityObserveOnly',
        expectedObservationKinds: [
            'traceResidue',
            'localExcitability',
            'repeatedFlowPathCandidate',
            'totalAccumulation',
            'affectedRegionCount',
        ],
        safetyLevel: 'research',
        exportTags: ['repeated-perturbation', 'plasticity', 'trace'],
        notes: [
            'Run with same seed as E04 for direct comparison.',
            'Plasticity is observe-only — no runtime feedback.',
        ],
    },

    // ── E06: Phase Vortex Emergence ───────────────────────────────────────────

    {
        id: 'E06_phaseVortexEmergence',
        experimentKind: 'observation',
        title: 'Phase Vortex Emergence',
        description:
            'Complex field phase observation using complexObserverPreview. '
            + 'Detects vortex candidates, topological charge distribution, and phase '
            + 'coherence without runtime feedback from the complex field.',
        scenarioId: 'phaseVortexEmergence',
        seed: 1003,
        ticks: 2000,
        sampleEveryTicks: 50,
        runtimePresetId: 'complexObserverPreview',
        expectedObservationKinds: [
            'phaseCoherence',
            'vortexCandidateCount',
            'signedTotalCharge',
            'chargeDeviation',
            'averageVortexConfidence',
        ],
        safetyLevel: 'research',
        exportTags: ['complex-field', 'vortex', 'phase', 'topology'],
        notes: [
            'Complex field is observer-side only — not fed back to runtime.',
            'Vortex candidates are phase defect candidates, not semantic centres.',
        ],
    },

    // ── E07: Phase Vortex — Natural Observer Suite ────────────────────────────

    {
        id: 'E07_phaseVortexNatural',
        experimentKind: 'observation',
        title: 'Phase Vortex — Natural Observer Suite',
        description:
            'Complex field vortex observation using naturalObserverSuite (curved metric). '
            + 'Compares vortex candidate counts and charge distribution against E06 '
            + 'to isolate the effect of curved torus metric.',
        scenarioId: 'phaseVortexEmergence',
        seed: 1003,
        ticks: 2000,
        sampleEveryTicks: 50,
        runtimePresetId: 'naturalObserverSuite',
        expectedObservationKinds: [
            'phaseCoherence',
            'vortexCandidateCount',
            'signedTotalCharge',
            'curvatureVortexCorrelation',
            'innerOuterBias',
        ],
        safetyLevel: 'research',
        exportTags: ['complex-field', 'vortex', 'curvature', 'curved'],
        notes: [
            'Run with same seed as E06 to isolate curvature effect.',
            'No runtime feedback paths are active.',
        ],
    },

    // ── E08: Curvature Bias — Geometry Preview ────────────────────────────────

    {
        id: 'E08_curvatureBiasGeometry',
        experimentKind: 'observation',
        title: 'Curvature Bias — Geometry Preview',
        description:
            'Curvature asymmetry observation using geometryPreview (N1 curved metric, '
            + 'scalar field). Observes whether field activity and trace distribution '
            + 'are biased across curvature bands.',
        scenarioId: 'curvatureBiasObservation',
        seed: 1004,
        ticks: 2000,
        sampleEveryTicks: 50,
        runtimePresetId: 'geometryPreview',
        expectedObservationKinds: [
            'gaussianCurvature',
            'curvatureAsymmetry',
            'vortexDensityByCurvature',
            'curvatureVortexCorrelation',
            'innerOuterBias',
        ],
        safetyLevel: 'research',
        exportTags: ['curvature', 'geometry', 'asymmetry'],
        notes: [
            'Baseline flat comparison: run E01 with same seed.',
            'Curvature bias absence is a valid observation.',
        ],
    },

    // ── E09: Membrane Overlap Observation ─────────────────────────────────────

    {
        id: 'E09_membraneOverlap',
        experimentKind: 'observation',
        title: 'Membrane Overlap Observation',
        description:
            'Actuation/return imprint overlap observation using naturalObserverSuite. '
            + 'Measures how actuation and return imprints overlap on the Membrane over '
            + 'repeated perturbation cycles.',
        scenarioId: 'membraneOverlapObservation',
        seed: 1005,
        ticks: 2000,
        sampleEveryTicks: 50,
        runtimePresetId: 'naturalObserverSuite',
        expectedObservationKinds: [
            'membraneDeformation',
            'actuationImprint',
            'returnImprint',
            'actuationReturnOverlap',
            'twoSidedness',
            'membraneIntegrity',
        ],
        safetyLevel: 'research',
        exportTags: ['membrane', 'overlap', 'actuation', 'return'],
        notes: [
            'Membrane is observer-only; no runtime coupling.',
            'twoSidedness is a field property, not self-recognition.',
        ],
    },

    // ── E10: Plasticity Trace — Long Run ──────────────────────────────────────

    {
        id: 'E10_plasticityTraceLongRun',
        experimentKind: 'observation',
        title: 'Plasticity Trace — Long Run',
        description:
            'Long-run weak plasticity trace observation using plasticityObserveOnly. '
            + 'Measures trace accumulation, affected region count, and saturation '
            + 'risk over an extended run without applying resistanceScale.',
        scenarioId: 'plasticityTraceObservation',
        seed: 1006,
        ticks: 3000,
        sampleEveryTicks: 50,
        runtimePresetId: 'plasticityObserveOnly',
        expectedObservationKinds: [
            'vortexTrace',
            'repeatedFlowTrace',
            'localExcitabilityTrace',
            'membraneTrace',
            'totalAccumulation',
            'affectedRegionCount',
        ],
        safetyLevel: 'research',
        exportTags: ['plasticity', 'trace', 'long-run', 'observe-only'],
        notes: [
            'resistanceScale is computed but never returned to runtime.',
            'Trace accumulation is not semantic memory or learning.',
        ],
    },

    // ── E11: Neutral vs Legacy Constants ──────────────────────────────────────

    {
        id: 'E11_neutralConstants',
        experimentKind: 'observation',
        title: 'Neutral Constants Baseline',
        description:
            'Observed ratio survey using naturalObserverSuite (neutral constants). '
            + 'Establishes the observer-side ratio distribution with PHI_INV / '
            + 'SCHUMANN_RES removed from core dynamics.',
        scenarioId: 'neutralVsLegacyConstants',
        seed: 1007,
        ticks: 2000,
        sampleEveryTicks: 50,
        runtimePresetId: 'naturalObserverSuite',
        expectedObservationKinds: [
            'observedRatios',
            'referenceRatioDistance',
            'matchStrength',
            'emergentResonanceProxy',
        ],
        safetyLevel: 'research',
        exportTags: ['constants', 'neutral', 'observed-ratios'],
        notes: [
            'PHI_INV / SCHUMANN_RES are not in the core causal path in neutral mode.',
            'Run E12 with same seed for legacy comparison.',
        ],
    },

    // ── E12: Legacy Constants Comparison ─────────────────────────────────────

    {
        id: 'E12_legacyConstants',
        experimentKind: 'observation',
        title: 'Legacy Constants Comparison',
        description:
            'Observed ratio survey using legacyComparison preset. '
            + 'Restores pre-N6 external constants for before/after comparison. '
            + 'COMPARISON USE ONLY — do not set as default.',
        scenarioId: 'neutralVsLegacyConstants',
        seed: 1007,
        ticks: 2000,
        sampleEveryTicks: 50,
        runtimePresetId: 'legacyComparison',
        expectedObservationKinds: [
            'observedRatios',
            'referenceRatioDistance',
            'matchStrength',
            'emergentResonanceProxy',
        ],
        safetyLevel: 'research',
        exportTags: ['constants', 'legacy', 'comparison', 'observed-ratios'],
        notes: [
            'Legacy mode is for comparison only — not the runtime default.',
            'Ratio proximity to reference values is not causal proof.',
        ],
    },

    // ── E13: Observed Ratio Survey ────────────────────────────────────────────

    {
        id: 'E13_observedRatioSurvey',
        experimentKind: 'observation',
        title: 'Observed Ratio Survey',
        description:
            'Comprehensive observed ratio collection using naturalObserverSuite. '
            + 'Surveys ratio values from vortex spacing, phase coherence, repeated '
            + 'flow delay, and closure timing, then measures reference ratio proximity.',
        scenarioId: 'observedRatioSurvey',
        seed: 1008,
        ticks: 2000,
        sampleEveryTicks: 50,
        runtimePresetId: 'naturalObserverSuite',
        expectedObservationKinds: [
            'observedRatio',
            'referenceRatioMatch',
            'relativeDistance',
            'centsDistance',
            'averageMatchStrength',
        ],
        safetyLevel: 'research',
        exportTags: ['observed-ratios', 'survey', 'natural-observer'],
        notes: [
            'Observed ratios are measured, not caused by, reference constants.',
            'Near-zero match strength is a valid observation.',
        ],
    },

    // ── E14: Long-Run Natural Comparison ─────────────────────────────────────

    {
        id: 'E14_longRunNaturalComparison',
        experimentKind: 'scout',
        title: 'Long-Run Natural Comparison',
        description:
            'Extended multi-variant comparison using all long-run comparison '
            + 'variants with a shared seed. Identifies differences in vortex lifetime, '
            + 'closure stability, plasticity accumulation, and ratio match strength '
            + 'attributable to N-series configuration differences.',
        scenarioId: 'longRunNaturalComparison',
        seed: 1009,
        ticks: 5000,
        sampleEveryTicks: 100,
        runtimePresetId: 'naturalObserverSuite',
        expectedObservationKinds: [
            'variantSummary',
            'differenceHighlights',
            'averageVortexLifetime',
            'closureStability',
            'plasticityAccumulation',
            'observedRatioMatchStrength',
            'semanticLeakCount',
            'nanOrInfinityCount',
        ],
        safetyLevel: 'research',
        exportTags: ['long-run', 'comparison', 'variants', 'n-series'],
        notes: [
            'High vortex lifetime does not indicate awareness or cognitive function.',
            'High ratio match is not causal proof of any external reference.',
            'Absence of observable differences is a valid result.',
            'semanticLeakCount must equal 0 for all variants.',
        ],
    },
];

// ── Lookup helpers ─────────────────────────────────────────────────────────────

/**
 * Look up a PresetExperiment by its ID.
 * Returns undefined if not found.
 */
export function getPresetExperiment(id: string): PresetExperiment | undefined {
    return PRESET_EXPERIMENT_REGISTRY.find(e => e.id === id);
}

/**
 * Return all preset experiments for a given ResearchScenarioId.
 */
export function getExperimentsForScenario(scenarioId: string): PresetExperiment[] {
    return PRESET_EXPERIMENT_REGISTRY.filter(e => e.scenarioId === scenarioId);
}

/**
 * Return all preset experiment IDs in canonical order.
 */
export function getAllPresetExperimentIds(): string[] {
    return PRESET_EXPERIMENT_REGISTRY.map(e => e.id);
}
