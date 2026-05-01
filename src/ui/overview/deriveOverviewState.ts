/**
 * deriveOverviewState.ts
 * U5: Overview / Now Summary / Event Timeline
 *
 * Derives an OverviewState from existing simulation metrics.
 * Does NOT compute new runtime dynamics — reads observer snapshots only.
 *
 * Principles:
 * - No LLM / API calls required.
 * - Graceful fallback when upstream state is missing.
 * - valueKind labels are assigned per metric.
 * - overallStatus is an observation category, not an emotion or consciousness claim.
 * - All metric labels are factual (no "生命力", "気分", "意識状態").
 *
 * Reference: docs/scientific-ui-ux-principles.md
 * Reference: docs/visualization-integrity-principles.md §2.4
 */

import type {
    OverviewState,
    OverviewMetric,
    OverviewMetricStatus,
    OverviewOverallStatus,
} from '../../types/overviewState.ts';
import type { DynamicViabilityState } from '../../types/dynamicViabilityState.ts';
import type { BodyWorldClosureState } from '../../types/bodyWorldClosureState.ts';
import type { LocalExcitabilityFieldState } from '../../types/localExcitabilityField.ts';
import type { MembraneObservationState } from '../../types/membraneObservation.ts';
import type { RepeatedFlowPathObservationState } from '../../types/repeatedFlowPath.ts';
import type { ProtoNetworkObservationState } from '../../types/protoNetworkCandidate.ts';

// ── Status helpers ─────────────────────────────────────────────────────────────

/**
 * Map a 0–1 value to an OverviewMetricStatus using standard thresholds.
 * @param v          Input value (0–1)
 * @param isRisk     If true, use risk-oriented thresholds (high = warning)
 */
function valueToStatus(v: number, isRisk = false): OverviewMetricStatus {
    if (!isFinite(v) || isNaN(v)) return 'unknown';
    if (isRisk) {
        if (v >= 0.65) return 'warning';
        if (v >= 0.3)  return 'high';
        if (v >= 0.05) return 'moderate';
        return 'low';
    }
    if (v >= 0.7)  return 'high';
    if (v >= 0.3)  return 'moderate';
    if (v >= 0.05) return 'low';
    return 'low';
}

function clamp01(v: number): number {
    if (!isFinite(v) || isNaN(v)) return 0;
    return Math.max(0, Math.min(1, v));
}

// ── Metric builders ────────────────────────────────────────────────────────────

function metricFromViability(
    id: string,
    label: string,
    value: number,
    source: string,
    isRisk = false
): OverviewMetric {
    return {
        id,
        label,
        value: clamp01(value),
        status: valueToStatus(clamp01(value), isRisk),
        valueKind: 'derived',
        source,
    };
}

function checkMetric(
    id: string,
    label: string,
    count: number,
    source: string
): OverviewMetric {
    return {
        id,
        label,
        value: count,
        status: count === 0 ? 'clear' : 'warning',
        valueKind: 'check',
        source,
    };
}

// ── deriveOverviewState ────────────────────────────────────────────────────────

export interface DeriveOverviewStateParams {
    viability?: DynamicViabilityState | null;
    closure?: BodyWorldClosureState | null;
    membraneObservation?: MembraneObservationState | null;
    localField?: LocalExcitabilityFieldState | null;
    repeatedFlowPaths?: RepeatedFlowPathObservationState | null;
    protoNetwork?: ProtoNetworkObservationState | null;
    /** Count of semantic layer violations (always 0 in AETERNA) */
    semanticLeakCount?: number;
    /** Count of NaN or Infinity values detected in field buffers */
    nanOrInfinityCount?: number;
    timestamp: number;
}

/**
 * Derive an OverviewState from available observation snapshots.
 *
 * Returns a valid OverviewState even when some upstream states are missing.
 * Missing states produce 'unknown' metrics with value 0.
 *
 * Does NOT modify any runtime state.
 */
export function deriveOverviewState(params: DeriveOverviewStateParams): OverviewState {
    const {
        viability,
        closure,
        membraneObservation,
        localField,
        repeatedFlowPaths,
        protoNetwork,
        semanticLeakCount = 0,
        nanOrInfinityCount = 0,
        timestamp,
    } = params;

    const metrics: OverviewMetric[] = [];
    let dataCount = 0; // how many non-null upstream states are available

    // ── Flow Continuity (derived from DynamicViabilityState) ─────────────────
    const flowContinuity = viability?.flowContinuity ?? 0;
    metrics.push(metricFromViability(
        'flowContinuity',
        'Flow Continuity',
        flowContinuity,
        'DynamicViabilityState.flowContinuity'
    ));
    if (viability) dataCount++;

    // ── Energy Throughput ─────────────────────────────────────────────────────
    const energyThroughput = viability?.energyThroughput ?? 0;
    metrics.push(metricFromViability(
        'energyThroughput',
        'Energy Throughput',
        energyThroughput,
        'DynamicViabilityState.energyThroughput'
    ));

    // ── Boundary Exchange ─────────────────────────────────────────────────────
    const boundaryExchange = viability?.boundaryExchange ?? 0;
    metrics.push(metricFromViability(
        'boundaryExchange',
        'Boundary Exchange',
        boundaryExchange,
        'DynamicViabilityState.boundaryExchange'
    ));

    // ── Return Strength (closure) ─────────────────────────────────────────────
    const returnStrength = closure?.returnStrength ?? viability?.returnContinuity ?? 0;
    metrics.push({
        id: 'returnStrength',
        label: 'Return Strength',
        value: clamp01(returnStrength),
        status: valueToStatus(clamp01(returnStrength)),
        valueKind: 'derived',
        source: closure ? 'BodyWorldClosureState.returnStrength' : 'DynamicViabilityState.returnContinuity',
    });
    if (closure) dataCount++;

    // ── Echo Persistence ─────────────────────────────────────────────────────
    const echoPersistence = viability ? 1 - clamp01(viability.dissipationBalance) : 0;
    metrics.push({
        id: 'echoPersistence',
        label: 'Echo Persistence',
        value: clamp01(echoPersistence),
        status: valueToStatus(clamp01(echoPersistence)),
        valueKind: 'derived',
        source: 'DynamicViabilityState.dissipationBalance (inverted proxy)',
    });

    // ── Closure Stability (proxy) ─────────────────────────────────────────────
    const closureStability = closure?.closureStability ?? 0;
    metrics.push({
        id: 'closureStability',
        label: 'Closure Stability',
        value: clamp01(closureStability),
        status: valueToStatus(clamp01(closureStability)),
        valueKind: 'proxy',
        source: 'BodyWorldClosureState.closureStability',
    });

    if (membraneObservation) {
        metrics.push({
            id: 'membraneDeformation',
            label: 'Membrane Deformation',
            value: clamp01(membraneObservation.averageDeformation),
            status: valueToStatus(clamp01(membraneObservation.averageDeformation)),
            valueKind: 'derived',
            source: 'MembraneObservationState.averageDeformation',
        });
        metrics.push({
            id: 'membraneTwoSidedness',
            label: 'Membrane Two-sidedness',
            value: clamp01(membraneObservation.averageTwoSidedness),
            status: valueToStatus(clamp01(membraneObservation.averageTwoSidedness)),
            valueKind: 'proxy',
            source: 'MembraneObservationState.averageTwoSidedness',
        });
        metrics.push({
            id: 'membraneOverlap',
            label: 'Actuation / Return Overlap',
            value: clamp01(membraneObservation.actuationReturnOverlap),
            status: valueToStatus(clamp01(membraneObservation.actuationReturnOverlap)),
            valueKind: 'proxy',
            source: 'MembraneObservationState.actuationReturnOverlap',
        });
        metrics.push({
            id: 'membraneIntegrity',
            label: 'Membrane Integrity',
            value: clamp01(membraneObservation.membraneIntegrity),
            status: valueToStatus(clamp01(membraneObservation.membraneIntegrity)),
            valueKind: 'proxy',
            source: 'MembraneObservationState.membraneIntegrity',
        });
        dataCount++;
    }

    // ── Saturation Risk (risk metric) ─────────────────────────────────────────
    const saturationRisk = viability?.saturationRisk ?? 0;
    metrics.push({
        id: 'saturationRisk',
        label: 'Saturation Risk',
        value: clamp01(saturationRisk),
        status: valueToStatus(clamp01(saturationRisk), true),
        valueKind: 'proxy',
        source: 'DynamicViabilityState.saturationRisk',
    });

    // ── Extinction Risk (risk metric) ─────────────────────────────────────────
    const extinctionRisk = viability?.extinctionRisk ?? 0;
    metrics.push({
        id: 'extinctionRisk',
        label: 'Extinction Risk',
        value: clamp01(extinctionRisk),
        status: valueToStatus(clamp01(extinctionRisk), true),
        valueKind: 'proxy',
        source: 'DynamicViabilityState.extinctionRisk',
    });

    // ── Semantic Leak (check — always 0 in AETERNA) ───────────────────────────
    metrics.push(checkMetric(
        'semanticLeak',
        'Semantic Leak',
        semanticLeakCount,
        'integrity check'
    ));

    // ── NaN / Infinity diagnostic (check) ────────────────────────────────────
    metrics.push(checkMetric(
        'nanOrInfinity',
        'NaN / Infinity',
        nanOrInfinityCount,
        'diagnostic check'
    ));

    // ── Optional: Active Coverage Ratio ──────────────────────────────────────
    if (localField) {
        const activeCoverageRatio = localField.highExcitabilityRegionCount / Math.max(1, localField.regionCount);
        metrics.push({
            id: 'activeCoverageRatio',
            label: 'Active Coverage Ratio',
            value: clamp01(activeCoverageRatio),
            status: valueToStatus(clamp01(activeCoverageRatio)),
            valueKind: 'derived',
            source: 'LocalExcitabilityFieldState',
        });
        dataCount++;
    }

    // ── Optional: Local Excitability Count ───────────────────────────────────
    if (localField) {
        metrics.push({
            id: 'localExcitabilityCount',
            label: 'High Excitability Regions',
            value: localField.highExcitabilityRegionCount,
            status: localField.highExcitabilityRegionCount > 0 ? 'moderate' : 'low',
            valueKind: 'derived',
            source: 'LocalExcitabilityFieldState.highExcitabilityRegionCount',
        });
    }

    // ── Optional: Repeated Flow Path Count ───────────────────────────────────
    if (repeatedFlowPaths) {
        metrics.push({
            id: 'repeatedFlowPathCount',
            label: 'Repeated Flow Path Candidates',
            value: repeatedFlowPaths.pathCandidateCount,
            status: repeatedFlowPaths.pathCandidateCount > 0 ? 'moderate' : 'low',
            valueKind: 'derived',
            source: 'RepeatedFlowPathObservationState.pathCandidateCount',
        });
        dataCount++;
    }

    // ── Optional: Proto-Network Candidate Count ───────────────────────────────
    if (protoNetwork) {
        metrics.push({
            id: 'protoNetworkCandidateCount',
            label: 'Proto-Network Candidates',
            value: protoNetwork.networkCandidateCount,
            status: protoNetwork.networkCandidateCount > 0 ? 'moderate' : 'low',
            valueKind: 'proxy',
            source: 'ProtoNetworkObservationState.networkCandidateCount',
        });
        dataCount++;
    }

    // ── LLM Teacher / Node Bridge checks (always inactive) ───────────────────
    metrics.push({
        id: 'llmTeacher',
        label: 'LLM Teacher',
        value: 'inactive',
        status: 'clear',
        valueKind: 'check',
        source: 'integrity check',
    });
    metrics.push({
        id: 'nodeBridge',
        label: 'Node Bridge',
        value: 'inactive',
        status: 'clear',
        valueKind: 'check',
        source: 'integrity check',
    });

    // ── Overall status classification ─────────────────────────────────────────
    const overallStatus = _classifyOverallStatus(
        saturationRisk, extinctionRisk, flowContinuity, closureStability, nanOrInfinityCount
    );

    // ── Confidence ────────────────────────────────────────────────────────────
    // Confidence degrades when upstream states are missing.
    const maxDataSources = 4;
    const confidence = Math.min(1, dataCount / maxDataSources + 0.25);

    return { timestamp, metrics, overallStatus, confidence };
}

/**
 * Classify the overall observable field status.
 * Not an emotion — describes field conditions.
 */
function _classifyOverallStatus(
    saturationRisk: number,
    extinctionRisk: number,
    flowContinuity: number,
    closureStability: number,
    nanCount: number
): OverviewOverallStatus {
    if (nanCount > 0) return 'unstable';
    if (saturationRisk >= 0.65) return 'saturated-risk';
    if (extinctionRisk >= 0.65) return 'extinction-risk';
    if (saturationRisk >= 0.35 || extinctionRisk >= 0.35) return 'unstable';
    if (flowContinuity >= 0.3 || closureStability >= 0.3) return 'active';
    return 'quiet';
}
