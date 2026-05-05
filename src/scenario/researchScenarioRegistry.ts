/**
 * researchScenarioRegistry.ts
 * AETERNA-NATURAL v1.3 Research Scenarios / Preset Experiments
 *
 * Registry of all 10 named ResearchScenario definitions.
 * These are reproducible observation condition scenarios — they do NOT modify
 * runtime dynamics.
 *
 * Principles:
 * - All titles, descriptions, and notes are neutral / scientific.
 * - No desire / life / intelligence / spiritual claims in any field text.
 * - expectedObservationKinds are observation targets, not guaranteed results.
 * - nonGuaranteedNotes clarify what absence of emergence means (valid result).
 * - seed / ticks / sampleEveryTicks are explicit for reproducibility.
 *
 * Reference: docs/research-scenarios-preset-experiments.md
 */

import type { ResearchScenario, ResearchScenarioId } from '../types/researchScenario.ts';

// ── Registry ──────────────────────────────────────────────────────────────────

export const RESEARCH_SCENARIO_REGISTRY: ResearchScenario[] = [

    // ── 1. quietBaseline ──────────────────────────────────────────────────────

    {
        id: 'quietBaseline',
        title: 'Quiet Baseline',
        shortDescription:
            'Observe baseline field flow, dissipation, trace decay, and extinction risk '
            + 'with minimal external perturbation.',
        researchQuestion:
            'What is the resting-state field behaviour — flow continuity, energy '
            + 'throughput, trace residue decay, and extinction risk — in the absence '
            + 'of external perturbation?',
        observationGoal:
            'Establish a reproducible baseline measurement of field activity, flow '
            + 'continuity, trace residue decay, semanticLeakCount, and nanOrInfinityCount '
            + 'under quiet conditions.',
        defaultSeed: 1000,
        defaultTicks: 2000,
        sampleEveryTicks: 50,
        recommendedPresetId: 'safeBaseline',
        compatiblePresetIds: ['naturalObserverSuite'],
        recommendedLayers: ['energyActivity', 'traceResidue', 'riskOverlay'],
        recommendedPanels: ['overview', 'diagnostics'],
        expectedObservationKinds: [
            'flowContinuity',
            'energyThroughput',
            'traceResidue',
            'extinctionRisk',
            'semanticLeakCount',
            'nanOrInfinityCount',
        ],
        nonGuaranteedNotes: [
            'Low activity is a valid baseline observation.',
            'No emergence is expected or required in this scenario.',
            'semanticLeakCount = 0 is the required safety invariant.',
        ],
        safetyLevel: 'safe',
        exportTags: ['baseline', 'quiet', 'resting-state'],
    },

    // ── 2. singlePulseReturn ──────────────────────────────────────────────────

    {
        id: 'singlePulseReturn',
        title: 'Single Pulse Return',
        shortDescription:
            'Apply a single actuation pulse and observe WorldMedium, Membrane, '
            + 'SensoryReturn, and Closure responses.',
        researchQuestion:
            'How do WorldMedium, Membrane, SensoryReturn, and Closure respond to a '
            + 'single discrete actuation pulse?',
        observationGoal:
            'Measure actuationPulse propagation, sensoryReturn timing, returnStrength, '
            + 'closureStability, membraneDeformation, and actuationReturnOverlap '
            + 'following a single perturbation event.',
        defaultSeed: 1001,
        defaultTicks: 1000,
        sampleEveryTicks: 25,
        recommendedPresetId: 'naturalObserverSuite',
        compatiblePresetIds: ['safeBaseline'],
        recommendedLayers: ['actuationPulse', 'sensoryReturn', 'closureMatch'],
        recommendedPanels: ['field', 'world'],
        expectedObservationKinds: [
            'actuationPulse',
            'sensoryReturn',
            'returnStrength',
            'closureStability',
            'membraneDeformation',
            'actuationReturnOverlap',
        ],
        nonGuaranteedNotes: [
            'Return signal may be attenuated depending on medium resistance; absence is a valid observation.',
            'Closure stability change may not be detectable after a single pulse — this is a valid result.',
            'membraneDeformation is observer-side only — not fed back to runtime.',
        ],
        safetyLevel: 'research',
        exportTags: ['single-pulse', 'return', 'membrane', 'closure'],
    },

    // ── 3. repeatedGentlePulse ────────────────────────────────────────────────

    {
        id: 'repeatedGentlePulse',
        title: 'Repeated Gentle Pulse',
        shortDescription:
            'Apply weak repeated perturbations and observe trace residue, local '
            + 'excitability shifts, and repeated flow path candidates.',
        researchQuestion:
            'Do weak repeated perturbations produce observable trace accumulation, '
            + 'local excitability changes, or repeated flow path candidate formation?',
        observationGoal:
            'Observe whether traceResidue, localExcitability, repeatedFlowPathCandidate, '
            + 'and closureStability change over repeated weak perturbations.',
        defaultSeed: 1002,
        defaultTicks: 3000,
        sampleEveryTicks: 50,
        recommendedPresetId: 'naturalObserverSuite',
        compatiblePresetIds: ['plasticityObserveOnly'],
        recommendedLayers: ['traceResidue', 'localExcitability', 'repeatedFlowPath'],
        recommendedPanels: ['paths', 'overview'],
        expectedObservationKinds: [
            'traceResidue',
            'localExcitability',
            'repeatedFlowPathCandidate',
            'closureStability',
        ],
        nonGuaranteedNotes: [
            'Trace accumulation is observed, not learned behaviour.',
            'repeatedFlowPathCandidate formation is not guaranteed.',
            'No semantic memory or learning claim is made for any observation.',
        ],
        safetyLevel: 'research',
        exportTags: ['repeated-perturbation', 'trace', 'excitability', 'flow-path'],
    },

    // ── 4. phaseVortexEmergence ───────────────────────────────────────────────

    {
        id: 'phaseVortexEmergence',
        title: 'Phase Vortex Emergence',
        shortDescription:
            'Observe complex field phase and amplitude to detect vortex candidates, '
            + 'topological charge distribution, and phase coherence.',
        researchQuestion:
            'What vortex candidate count, topological charge distribution, and phase '
            + 'coherence are observed in the complex field over time?',
        observationGoal:
            'Measure phaseCoherence, vortexCandidateCount, signedTotalCharge, '
            + 'chargeDeviation, and averageVortexConfidence from the complex field observer.',
        defaultSeed: 1003,
        defaultTicks: 2000,
        sampleEveryTicks: 50,
        recommendedPresetId: 'complexObserverPreview',
        compatiblePresetIds: ['naturalObserverSuite'],
        recommendedLayers: ['fieldPhase', 'vortexCandidate', 'phaseCoherence'],
        recommendedPanels: ['field', 'vortex'],
        expectedObservationKinds: [
            'phaseCoherence',
            'vortexCandidateCount',
            'signedTotalCharge',
            'chargeDeviation',
            'averageVortexConfidence',
        ],
        nonGuaranteedNotes: [
            'Vortex candidates are phase defect candidates — not semantic centres or self-referential structures.',
            'signedTotalCharge near 0 is expected on a torus; deviation is noteworthy.',
            'Absence of vortex candidates is a valid observation.',
        ],
        safetyLevel: 'research',
        exportTags: ['complex-field', 'vortex', 'phase', 'topology'],
    },

    // ── 5. curvatureBiasObservation ───────────────────────────────────────────

    {
        id: 'curvatureBiasObservation',
        title: 'Curvature Bias Observation',
        shortDescription:
            'Observe whether vortex candidates, field activity, and trace accumulation '
            + 'are distributed asymmetrically across curvature regions of the curved torus.',
        researchQuestion:
            'Is vortex candidate density, field activity, or trace distribution '
            + 'biased toward inner rim, outer rim, or specific curvature bands on the '
            + 'curved torus?',
        observationGoal:
            'Measure gaussianCurvature distribution, curvatureAsymmetry, '
            + 'vortexDensityByCurvature, curvatureVortexCorrelation, and innerOuterBias.',
        defaultSeed: 1004,
        defaultTicks: 2000,
        sampleEveryTicks: 50,
        recommendedPresetId: 'geometryPreview',
        compatiblePresetIds: ['naturalObserverSuite'],
        recommendedLayers: ['curvatureVortexCoupling', 'fieldPhase', 'energyActivity'],
        recommendedPanels: ['field', 'curvature'],
        expectedObservationKinds: [
            'gaussianCurvature',
            'curvatureAsymmetry',
            'vortexDensityByCurvature',
            'curvatureVortexCorrelation',
            'innerOuterBias',
        ],
        nonGuaranteedNotes: [
            'Curvature bias may be weak or absent; this is a valid observation.',
            'Inner/outer rim distribution is a geometry effect, not a semantic effect.',
            'Flat-metric baseline should be run for comparison.',
        ],
        safetyLevel: 'research',
        exportTags: ['curvature', 'geometry', 'vortex', 'asymmetry'],
    },

    // ── 6. membraneOverlapObservation ─────────────────────────────────────────

    {
        id: 'membraneOverlapObservation',
        title: 'Membrane Overlap Observation',
        shortDescription:
            'Observe how actuation imprint and return imprint overlap on the Membrane '
            + 'surface under repeated perturbation.',
        researchQuestion:
            'To what degree do actuation imprint and return imprint overlap on the '
            + 'Membrane, and how does this change over repeated perturbation cycles?',
        observationGoal:
            'Measure membraneDeformation, actuationImprint, returnImprint, '
            + 'actuationReturnOverlap, twoSidedness, and membraneIntegrity.',
        defaultSeed: 1005,
        defaultTicks: 2000,
        sampleEveryTicks: 50,
        recommendedPresetId: 'naturalObserverSuite',
        compatiblePresetIds: ['safeBaseline'],
        recommendedLayers: ['membraneDeformation', 'actuationPulse', 'sensoryReturn'],
        recommendedPanels: ['world', 'membrane'],
        expectedObservationKinds: [
            'membraneDeformation',
            'actuationImprint',
            'returnImprint',
            'actuationReturnOverlap',
            'twoSidedness',
            'membraneIntegrity',
        ],
        nonGuaranteedNotes: [
            'twoSidedness is a field geometry property — not self-recognition.',
            'Membrane is observer-only in this preset; no runtime coupling.',
            'actuationReturnOverlap absence is a valid observation.',
        ],
        safetyLevel: 'research',
        exportTags: ['membrane', 'overlap', 'actuation', 'return'],
    },

    // ── 7. plasticityTraceObservation ─────────────────────────────────────────

    {
        id: 'plasticityTraceObservation',
        title: 'Plasticity Trace Observation',
        shortDescription:
            'Observe how weak plasticity trace accumulates in observeOnly mode '
            + 'over a long run without runtime resistance feedback.',
        researchQuestion:
            'How does weak plasticity trace accumulate in observeOnly mode, and which '
            + 'field regions show the most trace over a long run?',
        observationGoal:
            'Measure vortexTrace, repeatedFlowTrace, localExcitabilityTrace, '
            + 'membraneTrace, totalAccumulation, and affectedRegionCount from the '
            + 'weak plasticity observer.',
        defaultSeed: 1006,
        defaultTicks: 3000,
        sampleEveryTicks: 50,
        recommendedPresetId: 'plasticityObserveOnly',
        compatiblePresetIds: ['naturalObserverSuite'],
        recommendedLayers: ['weakPlasticityTrace', 'traceResidue', 'energyActivity'],
        recommendedPanels: ['plasticity', 'overview'],
        expectedObservationKinds: [
            'vortexTrace',
            'repeatedFlowTrace',
            'localExcitabilityTrace',
            'membraneTrace',
            'totalAccumulation',
            'affectedRegionCount',
        ],
        nonGuaranteedNotes: [
            'Plasticity trace is observer-side only — resistanceScale is NOT applied to runtime.',
            'Trace accumulation is not semantic memory or learning.',
            'Low or absent trace accumulation is a valid observation.',
        ],
        safetyLevel: 'research',
        exportTags: ['plasticity', 'trace', 'observe-only', 'accumulation'],
    },

    // ── 8. neutralVsLegacyConstants ───────────────────────────────────────────

    {
        id: 'neutralVsLegacyConstants',
        title: 'Neutral vs Legacy Constants',
        shortDescription:
            'Compare external constants mode neutral vs legacy to measure the '
            + 'observer-side effect of removing PHI_INV / SCHUMANN_RES from core dynamics.',
        researchQuestion:
            'Do observed ratios, emergentResonanceProxy, or field dynamics differ '
            + 'measurably between neutral and legacy external constants modes?',
        observationGoal:
            'Measure externalConstantsMode, observedRatios, referenceRatioDistance, '
            + 'matchStrength, and emergentResonanceProxy under neutral and legacy modes '
            + 'with the same seed.',
        defaultSeed: 1007,
        defaultTicks: 2000,
        sampleEveryTicks: 50,
        recommendedPresetId: 'naturalObserverSuite',
        compatiblePresetIds: ['legacyComparison'],
        recommendedLayers: ['energyActivity', 'fieldPhase'],
        recommendedPanels: ['overview', 'observedRatios'],
        expectedObservationKinds: [
            'externalConstantsMode',
            'observedRatios',
            'referenceRatioDistance',
            'matchStrength',
            'emergentResonanceProxy',
        ],
        nonGuaranteedNotes: [
            'Proximity to reference ratios is not proof of causal connection.',
            'PHI_INV / SCHUMANN_RES are not in the core causal path in neutral mode.',
            'Legacy mode is for comparison only — not the runtime default.',
            'Ratio match strength absence is a valid observation.',
        ],
        safetyLevel: 'research',
        exportTags: ['constants', 'neutral', 'legacy', 'observed-ratios'],
    },

    // ── 9. observedRatioSurvey ────────────────────────────────────────────────

    {
        id: 'observedRatioSurvey',
        title: 'Observed Ratio Survey',
        shortDescription:
            'Collect observed ratios from vortex spacing, phase coherence, repeated '
            + 'flow delay, and closure timing, then compare against reference ratios.',
        researchQuestion:
            'What observed ratios emerge from field dynamics metrics, and how close '
            + 'are they to reference ratios such as PHI or SCHUMANN?',
        observationGoal:
            'Survey observedRatio values from multiple field metric sources and '
            + 'measure referenceRatioMatch, relativeDistance, centsDistance, and '
            + 'averageMatchStrength.',
        defaultSeed: 1008,
        defaultTicks: 2000,
        sampleEveryTicks: 50,
        recommendedPresetId: 'naturalObserverSuite',
        compatiblePresetIds: ['complexObserverPreview', 'geometryPreview'],
        recommendedLayers: ['fieldPhase', 'vortexCandidate', 'traceResidue'],
        recommendedPanels: ['observedRatios', 'overview'],
        expectedObservationKinds: [
            'observedRatio',
            'referenceRatioMatch',
            'relativeDistance',
            'centsDistance',
            'averageMatchStrength',
        ],
        nonGuaranteedNotes: [
            'Observed ratios are measured, not caused by, reference constants.',
            'Reference ratio proximity is a descriptive comparison — not causal proof.',
            'Near-zero match strength is a valid observation.',
        ],
        safetyLevel: 'research',
        exportTags: ['observed-ratios', 'survey', 'reference', 'phi'],
    },

    // ── 10. longRunNaturalComparison ──────────────────────────────────────────

    {
        id: 'longRunNaturalComparison',
        title: 'Long-Run Natural Comparison',
        shortDescription:
            'Compare multiple N-series configuration variants over a long run with '
            + 'a shared seed, observing differences in vortex lifetime, closure '
            + 'stability, plasticity accumulation, and ratio match strength.',
        researchQuestion:
            'How do N-series configuration differences (flat/curved, scalar/complex, '
            + 'membrane, plasticity, neutral/legacy constants) affect observed field '
            + 'metrics over a long run with a shared seed?',
        observationGoal:
            'Compare variantSummary across all long-run comparison variants, '
            + 'measuring differenceHighlights for averageVortexLifetime, '
            + 'closureStability, plasticityAccumulation, observedRatioMatchStrength, '
            + 'semanticLeakCount, and nanOrInfinityCount.',
        defaultSeed: 1009,
        defaultTicks: 5000,
        sampleEveryTicks: 100,
        recommendedPresetId: 'naturalObserverSuite',
        compatiblePresetIds: [
            'safeBaseline',
            'geometryPreview',
            'complexObserverPreview',
            'plasticityObserveOnly',
            'legacyComparison',
        ],
        recommendedLayers: [
            'energyActivity',
            'traceResidue',
            'fieldPhase',
            'vortexCandidate',
            'curvatureVortexCoupling',
        ],
        recommendedPanels: ['comparison', 'overview', 'diagnostics'],
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
        nonGuaranteedNotes: [
            'High vortex lifetime does not indicate awareness or cognitive function.',
            'High ratio match strength is not causal proof of any external reference.',
            'High plasticity accumulation is not semantic memory.',
            'High closure stability is not self-awareness.',
            'Absence of observable differences between variants is a valid result.',
        ],
        safetyLevel: 'research',
        exportTags: ['long-run', 'comparison', 'variants', 'n-series'],
    },
];

// ── Lookup ─────────────────────────────────────────────────────────────────────

/**
 * Look up a ResearchScenario by its ID.
 * Returns undefined if the ID is not found.
 */
export function getResearchScenario(id: ResearchScenarioId): ResearchScenario | undefined {
    return RESEARCH_SCENARIO_REGISTRY.find(s => s.id === id);
}

/**
 * Return all research scenario IDs in canonical order.
 */
export function getAllResearchScenarioIds(): ResearchScenarioId[] {
    return RESEARCH_SCENARIO_REGISTRY.map(s => s.id);
}
