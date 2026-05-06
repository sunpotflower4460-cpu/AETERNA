/**
 * causalTrace.ts
 * v1.8: Causal Trace / Layer Correlation
 *
 * Defines CausalTraceSignal and CausalTraceResult for the Causal Trace feature.
 *
 * Design principles:
 * - Causal Trace is NOT causal proof. All signals are "possible contributing signals."
 * - No consciousness / emotion / intelligence / life / soul / mystical claims.
 * - No LLM or API calls — rule-based signal extraction only.
 * - Signals are only emitted when real data supports them.
 * - 'insufficient' confidence is returned when data is unavailable.
 *
 * Reference: docs/causal-trace-layer-correlation.md
 */

// ── CausalTraceConfidence ─────────────────────────────────────────────────────

export type CausalTraceConfidence = 'low' | 'medium' | 'high' | 'insufficient';

// ── CausalTraceSignal ─────────────────────────────────────────────────────────

/**
 * A single possible contributing signal identified by the Causal Trace system.
 *
 * IMPORTANT: This is a possible contributing signal, not causal proof.
 */
export interface CausalTraceSignal {
    id: string;
    sourceLayer:
        | 'geometry'
        | 'field'
        | 'vortex'
        | 'membrane'
        | 'plasticity'
        | 'ratios'
        | 'events'
        | 'diagnostics'
        | 'comparison';
    metricId: string;
    label: string;
    valueBefore?: number | null;
    valueAfter?: number | null;
    delta?: number | null;
    tickBefore?: number;
    tickAfter?: number;
    relatedCellIndices: number[];
    relatedEventIds: string[];
    relationKind:
        | 'temporal_nearby'
        | 'same_cell'
        | 'neighbor_cell'
        | 'same_region'
        | 'co_change'
        | 'threshold_near'
        | 'ratio_component'
        | 'comparison_difference';
    confidence: CausalTraceConfidence;
    caution: string;
}

// ── CausalTraceResult ─────────────────────────────────────────────────────────

/**
 * Result produced by buildCausalTrace().
 *
 * Contains possible contributing signals extracted from observation data.
 * IMPORTANT: All signals are candidate correlations only — not causal proof.
 */
export interface CausalTraceResult {
    id: string;
    targetCellIndex: number | null;
    targetMetricId: string | null;
    activeLensId: string | null;
    currentTick: number;
    comparedTick?: number | null;
    possibleContributingSignals: CausalTraceSignal[];
    relatedObservations: CausalTraceSignal[];
    strongestSignals: CausalTraceSignal[];
    summary: string[];
    cautions: string[];
    confidence: CausalTraceConfidence;
    generatedAt: number;
}
