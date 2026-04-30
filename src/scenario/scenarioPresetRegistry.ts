/**
 * scenarioPresetRegistry.ts
 * U7: Scenario UX
 *
 * Registry of all named ScenarioPreset definitions.
 * These are observation condition presets — they do NOT modify runtime dynamics.
 *
 * Principles:
 * - All titles and descriptions are neutral / scientific.
 * - No emotion / desire / learning claims. All text is neutral and scientific.
 * - Expected signals are possible, not guaranteed.
 * - Recommended layers are non-empty and correspond to real field layer IDs.
 *
 * Reference: docs/scientific-ui-ux-principles.md
 */

import type { ScenarioPreset, ScenarioPresetId } from '../types/scenarioPreset.ts';

// ── Registry ──────────────────────────────────────────────────────────────────

export const SCENARIO_PRESET_REGISTRY: ScenarioPreset[] = [
    {
        id: 'quietObservation',
        title: 'Quiet Observation',
        shortDescription: 'Observe baseline field flow, dissipation, extinction risk, and trace decay without perturbation.',
        observationGoal: 'Establish a baseline measurement of field activity, flow continuity, trace residue decay, and extinction risk under resting conditions.',
        expectedSignals: [
            'flowContinuity',
            'extinctionRisk',
            'traceResiduDecay',
            'semanticLeak=0',
        ],
        recommendedLayers: ['energyActivity', 'traceResidue', 'riskOverlay'],
        recommendedPanel: 'overview',
        durationHint: 'medium',
    },
    {
        id: 'singleTouch',
        title: 'Single Touch',
        shortDescription: 'Apply a single perturbation and observe the resulting actuation pulse, world medium response, sensory return, and reafference comparison.',
        observationGoal: 'Observe the field response to a single discrete perturbation: actuation pulse propagation, sensory return timing, and reafference mismatch.',
        expectedSignals: [
            'actuationPulse',
            'worldMediumResponse',
            'sensoryReturn',
            'reafferenceComparison',
        ],
        recommendedLayers: ['actuationPulse', 'sensoryReturn', 'closureMatch'],
        recommendedPanel: 'field',
        durationHint: 'short',
    },
    {
        id: 'repeatedGentleTouch',
        title: 'Repeated Gentle Touch',
        shortDescription: 'Apply weak repeated perturbations and observe trace accumulation, local excitability shifts, and repeated flow path candidates.',
        observationGoal: 'Observe whether repeated weak perturbations produce trace accumulation, local excitability elevation, or repeated flow path candidate formation.',
        expectedSignals: [
            'traceAccumulation',
            'localExcitabilityElevation',
            'repeatedFlowPathCandidate',
        ],
        recommendedLayers: ['traceResidue', 'localExcitability', 'repeatedFlowPath'],
        recommendedPanel: 'paths',
        durationHint: 'medium',
        safetyNote: 'Trace accumulation is observed, not learned behavior.',
    },
    {
        id: 'holdAndRelease',
        title: 'Hold and Release',
        shortDescription: 'Apply a sustained perturbation followed by release, and observe field recovery, residue, and return.',
        observationGoal: 'Observe field recovery dynamics: energy dissipation during hold, residue after release, and return signal strength following perturbation removal.',
        expectedSignals: [
            'energyAccumulation',
            'releaseRecovery',
            'traceResidue',
            'returnStrength',
        ],
        recommendedLayers: ['energyActivity', 'traceResidue', 'riskOverlay'],
        recommendedPanel: 'field',
        durationHint: 'short',
    },
    {
        id: 'delayedReturn',
        title: 'Delayed Return',
        shortDescription: 'Observe field behaviour when the return signal is delayed: delay profile, closure drift, and unresolved return metrics.',
        observationGoal: 'Measure the effect of delayed sensory return on closure stability, closure drift, and unresolved return accumulation.',
        expectedSignals: [
            'delayProfile',
            'closureDrift',
            'unresolvedReturn',
        ],
        recommendedLayers: ['sensoryReturn', 'closureMatch', 'mediumEchoDelay'],
        recommendedPanel: 'world',
        durationHint: 'short',
    },
    {
        id: 'highResistanceWorld',
        title: 'High Resistance World',
        shortDescription: 'Observe field behaviour under high world medium resistance: return attenuation, under-coupling, and extinction risk.',
        observationGoal: 'Observe how high world medium resistance attenuates return signals, increases under-coupling risk, and elevates extinction risk.',
        expectedSignals: [
            'returnAttenuation',
            'underCouplingRisk',
            'extinctionRisk',
        ],
        recommendedLayers: ['mediumEchoDelay', 'riskOverlay', 'energyActivity'],
        recommendedPanel: 'world',
        durationHint: 'medium',
    },
    {
        id: 'lowResistanceWorld',
        title: 'Low Resistance World',
        shortDescription: 'Observe field behaviour under low world medium resistance: over-coupling, echo saturation, and feedback saturation risk.',
        observationGoal: 'Observe whether low resistance produces over-coupling, echo saturation, or feedback saturation risk in the closure loop.',
        expectedSignals: [
            'overCouplingRisk',
            'echoSaturation',
            'feedbackSaturationRisk',
        ],
        recommendedLayers: ['sensoryReturn', 'closureMatch', 'riskOverlay'],
        recommendedPanel: 'world',
        durationHint: 'medium',
    },
    {
        id: 'slowEchoWorld',
        title: 'Slow Echo World',
        shortDescription: 'Observe field behaviour with long echo delay: trace residue buildup, echo delay profile, and repeated flow path candidates.',
        observationGoal: 'Observe how long echo delay affects trace accumulation, residue persistence, and the likelihood of repeated flow path candidate formation.',
        expectedSignals: [
            'traceResidue',
            'echoDelayProfile',
            'repeatedFlowPathCandidate',
        ],
        recommendedLayers: ['traceResidue', 'mediumEchoDelay', 'repeatedFlowPath'],
        recommendedPanel: 'paths',
        durationHint: 'medium',
    },
    {
        id: 'fastEchoWorld',
        title: 'Fast Echo World',
        shortDescription: 'Observe field behaviour with rapid echo decay: trace persistence, repeated flow path stability, and proto-network candidate formation.',
        observationGoal: 'Observe whether fast echo decay prevents or reduces trace persistence, and how this affects repeated flow path and proto-network candidate counts.',
        expectedSignals: [
            'traceDecay',
            'repeatedFlowPathStability',
            'protoNetworkCandidate',
        ],
        recommendedLayers: ['mediumEchoDelay', 'traceResidue'],
        recommendedPanel: 'overview',
        durationHint: 'medium',
    },
    {
        id: 'longRunNaturalEmergence',
        title: 'Long-Run Natural Emergence',
        shortDescription: 'Run an extended observation to measure all field metrics and observe whether pre-semantic structural candidates arise under natural conditions.',
        observationGoal: 'Measure all field metrics over a long run and observe whether local excitability gradients, repeated flow path candidates, or proto-network candidates arise naturally.',
        expectedSignals: [
            'flowContinuity',
            'energyThroughput',
            'localExcitabilityGradient',
            'repeatedFlowPathCandidate',
            'protoNetworkCandidate',
            'extinctionRisk',
        ],
        recommendedLayers: [
            'energyActivity',
            'traceResidue',
            'localExcitability',
            'repeatedFlowPath',
            'protoNetworkCandidate',
            'riskOverlay',
        ],
        recommendedPanel: 'overview',
        durationHint: 'long',
        safetyNote: 'Emergence is not guaranteed. Absence of emergence is a valid observation.',
    },
];

// ── Lookup ─────────────────────────────────────────────────────────────────────

/**
 * Look up a ScenarioPreset by its ID.
 * Returns undefined if the ID is not found.
 */
export function getScenarioPreset(id: ScenarioPresetId): ScenarioPreset | undefined {
    return SCENARIO_PRESET_REGISTRY.find(p => p.id === id);
}
