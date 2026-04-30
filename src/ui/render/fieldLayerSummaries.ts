/**
 * fieldLayerSummaries.ts
 * U4: Field Layer Visualization — per-layer status summaries
 *
 * Provides a lightweight summary of each layer's current observation status.
 * These summaries are intended for U5 Now Summary integration and for the
 * Layer Legend / HUD display.
 *
 * Principles:
 * - shortText is an observation description, NOT an emotion / consciousness claim.
 * - status ('inactive' | 'low' | 'moderate' | 'high' | 'warning') reflects
 *   the magnitude of the underlying field observation, NOT a subjective state.
 * - This module does NOT create, modify, or read runtime dynamics.
 * - All values passed in are read-only observer snapshots.
 *
 * Reference: docs/visualization-integrity-principles.md §2.4
 */

import type { FieldLayerId, FieldLayerValueKind } from './fieldLayerRegistry.js';

// ── Types ─────────────────────────────────────────────────────────────────────

/** Observation status levels for a field layer. */
export type FieldLayerStatus =
    | 'inactive'    // No meaningful signal detected
    | 'low'         // Signal present but below typical operating range
    | 'moderate'    // Signal within typical operating range
    | 'high'        // Signal above typical operating range
    | 'warning';    // Signal indicates a risk condition (Risk Overlay only)

/**
 * Compact status summary for a single field layer.
 * Intended for Now Summary (U5) and Layer Legend display.
 */
export interface FieldLayerSummary {
    /** Layer identifier */
    layerId: FieldLayerId;

    /** Whether this layer is currently visible */
    visible: boolean;

    /** Observation status */
    status: FieldLayerStatus;

    /**
     * Short observation text for display.
     * Describes the current field state in neutral terms.
     * Must NOT include emotion / consciousness / semantic claims.
     */
    shortText: string;

    /** How the displayed value was derived */
    valueKind: FieldLayerValueKind;

    /** Normalised magnitude 0–1 (best available proxy for the layer) */
    magnitude: number;
}

// ── Status helpers ────────────────────────────────────────────────────────────

/**
 * Map a normalised 0–1 magnitude to a FieldLayerStatus.
 * Risk Overlay uses a separate threshold.
 */
function magnitudeToStatus(
    magnitude: number,
    isRisk = false
): FieldLayerStatus {
    if (isRisk) {
        if (magnitude >= 0.65) return 'warning';
        if (magnitude >= 0.35) return 'moderate';
        if (magnitude >= 0.05) return 'low';
        return 'inactive';
    }
    if (magnitude >= 0.75) return 'high';
    if (magnitude >= 0.35) return 'moderate';
    if (magnitude >= 0.05) return 'low';
    return 'inactive';
}

// ── Per-layer summary builders ────────────────────────────────────────────────

/**
 * Build an Energy / Activity layer summary from available observation values.
 *
 * @param visible          Whether the layer is currently toggled on
 * @param flowContinuity   DynamicViabilityState.flowContinuity  (0–1)
 * @param energyThroughput DynamicViabilityState.energyThroughput (0–1)
 * @param meanActivity     Mean absolute value of organism.currentBuffer (0–any, normalised)
 */
export function buildEnergyActivitySummary(
    visible: boolean,
    flowContinuity: number,
    energyThroughput: number,
    meanActivity: number
): FieldLayerSummary {
    const magnitude = Math.min(1, (flowContinuity + energyThroughput + Math.min(1, meanActivity)) / 3);
    const status = magnitudeToStatus(magnitude);
    const shortText =
        status === 'inactive' ? 'Field activity below detection threshold' :
        status === 'low'      ? 'Low field activity detected' :
        status === 'moderate' ? 'Field activity at moderate level' :
                                'High field activity observed';
    return { layerId: 'energyActivity', visible, status, shortText, valueKind: 'derived', magnitude };
}

/**
 * Build a Trace / Residue layer summary.
 *
 * @param visible         Whether the layer is currently toggled on
 * @param traceStrength   TraceState.traceStrength  (0–1)
 * @param salienceResidue TraceState.salienceResidue (0–1)
 */
export function buildTraceResidueSummary(
    visible: boolean,
    traceStrength: number,
    salienceResidue: number
): FieldLayerSummary {
    const magnitude = Math.min(1, (traceStrength + salienceResidue) / 2);
    const status = magnitudeToStatus(magnitude);
    const shortText =
        status === 'inactive' ? 'No field residue detected' :
        status === 'low'      ? 'Low field residue present' :
        status === 'moderate' ? 'Moderate field residue observed' :
                                'High field residue — strong past-flow trace';
    return { layerId: 'traceResidue', visible, status, shortText, valueKind: 'derived', magnitude };
}

/**
 * Build an Actuation Pulse layer summary.
 *
 * @param visible    Whether the layer is currently toggled on
 * @param intensity  ActuationPulse.intensity  (0–1)
 * @param coherence  ActuationPulse.coherence  (0–1)
 */
export function buildActuationPulseSummary(
    visible: boolean,
    intensity: number,
    coherence: number
): FieldLayerSummary {
    const magnitude = Math.min(1, (intensity + coherence) / 2);
    const status = magnitudeToStatus(magnitude);
    const shortText =
        status === 'inactive' ? 'No actuation pulse active' :
        status === 'low'      ? 'Low-intensity actuation pulse' :
        status === 'moderate' ? 'Actuation pulse at moderate intensity' :
                                'Strong actuation pulse active';
    return { layerId: 'actuationPulse', visible, status, shortText, valueKind: 'measured', magnitude };
}

/**
 * Build a Sensory Return layer summary.
 *
 * @param visible        Whether the layer is currently toggled on
 * @param returnStrength Mean intensity of SensoryReturnPackets received (0–1)
 * @param delayHint      Mean returnDelayHint (0–1)
 */
export function buildSensoryReturnSummary(
    visible: boolean,
    returnStrength: number,
    delayHint: number
): FieldLayerSummary {
    const magnitude = Math.min(1, returnStrength);
    const status = magnitudeToStatus(magnitude);
    const delayNote = delayHint > 0.5 ? ' [delayed]' : '';
    const shortText =
        status === 'inactive' ? 'No sensory return detected' :
        status === 'low'      ? `Low sensory return signal${delayNote}` :
        status === 'moderate' ? `Moderate sensory return${delayNote}` :
                                `Strong sensory return${delayNote}`;
    return { layerId: 'sensoryReturn', visible, status, shortText, valueKind: 'measured', magnitude };
}

/**
 * Build a Closure Match layer summary.
 *
 * @param visible          Whether the layer is currently toggled on
 * @param selfCausedMatch  ReafferenceComparisonState.selfCausedMatch (0–1)
 * @param returnMismatch   ReafferenceComparisonState.returnMismatch  (0–1)
 */
export function buildClosureMatchSummary(
    visible: boolean,
    selfCausedMatch: number,
    returnMismatch: number
): FieldLayerSummary {
    const magnitude = Math.min(1, selfCausedMatch);
    const status = magnitudeToStatus(magnitude);
    const mismatchNote = returnMismatch > 0.5 ? ' [high mismatch]' : '';
    const shortText =
        status === 'inactive' ? 'No closure loop detected' :
        status === 'low'      ? `Weak pulse-return correspondence${mismatchNote} [proxy]` :
        status === 'moderate' ? `Moderate closure loop match${mismatchNote} [proxy]` :
                                `Strong pulse-return closure match${mismatchNote} [proxy]`;
    return { layerId: 'closureMatch', visible, status, shortText, valueKind: 'proxy', magnitude };
}

/**
 * Build a Medium Echo / Delay layer summary.
 *
 * @param visible     Whether the layer is currently toggled on
 * @param echoLevel   WorldMediumState.echoLevel        (0–1)
 * @param delayLevel  WorldMediumState.feedbackDelay    (0–1)
 * @param resistance  WorldMediumState.surfaceResistance (0–1)
 */
export function buildMediumEchoDelaySummary(
    visible: boolean,
    echoLevel: number,
    delayLevel: number,
    resistance: number
): FieldLayerSummary {
    const magnitude = Math.min(1, (echoLevel + delayLevel + resistance) / 3);
    const status = magnitudeToStatus(magnitude);
    const shortText =
        status === 'inactive' ? 'Medium conditions near baseline' :
        status === 'low'      ? 'Low echo / delay in world medium' :
        status === 'moderate' ? 'Moderate echo and delay conditions' :
                                'High echo / delay / resistance in world medium';
    return { layerId: 'mediumEchoDelay', visible, status, shortText, valueKind: 'derived', magnitude };
}

/**
 * Build a Local Excitability layer summary.
 *
 * @param visible                Whether the layer is currently toggled on
 * @param averageExcitability    LocalExcitabilityFieldState.averageExcitability (0–1)
 * @param nearThresholdCount     LocalExcitabilityFieldState.nearThresholdRegionCount
 * @param totalRegionCount       LocalExcitabilityFieldState.regionCount
 */
export function buildLocalExcitabilitySummary(
    visible: boolean,
    averageExcitability: number,
    nearThresholdCount: number,
    totalRegionCount: number
): FieldLayerSummary {
    const magnitude = Math.min(1, averageExcitability);
    const status = magnitudeToStatus(magnitude);
    const nearThresholdRatio = totalRegionCount > 0 ? nearThresholdCount / totalRegionCount : 0;
    const nearNote = nearThresholdRatio > 0.2 ? ` (${nearThresholdCount} near-threshold regions)` : '';
    const shortText =
        status === 'inactive' ? 'Field excitability at baseline' :
        status === 'low'      ? `Low regional excitability${nearNote}` :
        status === 'moderate' ? `Moderate regional excitability${nearNote}` :
                                `High regional excitability${nearNote}`;
    return { layerId: 'localExcitability', visible, status, shortText, valueKind: 'derived', magnitude };
}

/**
 * Build a Repeated Flow Path layer summary.
 *
 * @param visible            Whether the layer is currently toggled on
 * @param pathCandidateCount RepeatedFlowPathObservationState.pathCandidateCount
 * @param averageConfidence  RepeatedFlowPathObservationState.averageConfidence (0–1)
 */
export function buildRepeatedFlowPathSummary(
    visible: boolean,
    pathCandidateCount: number,
    averageConfidence: number
): FieldLayerSummary {
    const magnitude = Math.min(1, averageConfidence);
    const status = magnitudeToStatus(magnitude);
    const countNote = pathCandidateCount > 0 ? ` (${pathCandidateCount} candidate(s))` : '';
    const shortText =
        status === 'inactive' ? 'No repeated flow path candidates observed' :
        status === 'low'      ? `Low-confidence flow path candidates${countNote}` :
        status === 'moderate' ? `Moderate-confidence flow path candidates${countNote}` :
                                `High-confidence repeated flow paths observed${countNote}`;
    return { layerId: 'repeatedFlowPath', visible, status, shortText, valueKind: 'derived', magnitude };
}

/**
 * Build a Proto-Network Candidate layer summary.
 *
 * @param visible               Whether the layer is currently toggled on
 * @param networkCandidateCount ProtoNetworkObservationState.networkCandidateCount
 * @param averageConfidence     ProtoNetworkObservationState.averageConfidence (0–1)
 */
export function buildProtoNetworkCandidateSummary(
    visible: boolean,
    networkCandidateCount: number,
    averageConfidence: number
): FieldLayerSummary {
    const magnitude = Math.min(1, averageConfidence);
    const status = magnitudeToStatus(magnitude);
    const countNote = networkCandidateCount > 0 ? ` (${networkCandidateCount} candidate(s))` : '';
    const shortText =
        status === 'inactive'
            ? 'No proto-network candidates observed [pre-semantic proxy]'
            : status === 'low'
            ? `Low-confidence proto-network candidates${countNote} [pre-semantic proxy]`
            : status === 'moderate'
            ? `Moderate-confidence pre-semantic network candidates${countNote} [proxy]`
            : `High-confidence pre-semantic network candidates${countNote} [proxy]`;
    return { layerId: 'protoNetworkCandidate', visible, status, shortText, valueKind: 'proxy', magnitude };
}

/**
 * Build a Risk Overlay layer summary.
 *
 * @param visible          Whether the layer is currently toggled on
 * @param saturationRisk   DynamicViabilityState.saturationRisk  (0–1)
 * @param extinctionRisk   DynamicViabilityState.extinctionRisk  (0–1)
 * @param overCouplingRisk DynamicViabilityState.overCouplingRisk (0–1)
 */
export function buildRiskOverlaySummary(
    visible: boolean,
    saturationRisk: number,
    extinctionRisk: number,
    overCouplingRisk: number
): FieldLayerSummary {
    const magnitude = Math.min(1, Math.max(saturationRisk, extinctionRisk, overCouplingRisk));
    const status = magnitudeToStatus(magnitude, true);
    const shortText =
        status === 'inactive' ? 'Risk indicators within normal range' :
        status === 'low'      ? 'Minor risk indicators — monitoring' :
        status === 'moderate' ? 'Elevated risk indicators — check field state' :
        status === 'warning'  ? 'Risk threshold exceeded — research caution advised' :
                                'Risk indicators within normal range';
    return { layerId: 'riskOverlay', visible, status, shortText, valueKind: 'proxy', magnitude };
}

// ── Event Strip event descriptions ───────────────────────────────────────────

/**
 * Generate a terse, neutral event description string for the Event Strip
 * when a layer's status changes.
 *
 * @param layerId   The layer that changed
 * @param newStatus The new status of that layer
 * @param tick      The current simulation tick
 */
export function formatLayerEventStripText(
    layerId: FieldLayerId,
    newStatus: FieldLayerStatus,
    tick: number
): string {
    const labels: Record<FieldLayerId, string> = {
        energyActivity:       'Energy / Activity',
        traceResidue:         'Trace / Residue',
        actuationPulse:       'Actuation Pulse',
        sensoryReturn:        'Sensory Return',
        closureMatch:         'Closure Match',
        mediumEchoDelay:      'Medium Echo / Delay',
        localExcitability:    'Local Excitability',
        repeatedFlowPath:     'Repeated Flow Path',
        protoNetworkCandidate:'Proto-Network Candidate',
        riskOverlay:          'Risk Overlay',
    };
    const label = labels[layerId] ?? layerId;
    return `tick ${tick}: ${label} layer — status → ${newStatus}`;
}
