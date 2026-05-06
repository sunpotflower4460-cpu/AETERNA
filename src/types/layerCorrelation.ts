/**
 * layerCorrelation.ts
 * v1.8: Causal Trace / Layer Correlation
 *
 * Defines LayerCorrelationPair and LayerCorrelationState.
 *
 * Design principles:
 * - Correlation is NOT causal proof.
 * - NaN is never returned — use null for unavailable correlation values.
 * - 'insufficient' confidence when sampleCount < 3.
 * - No consciousness / emotion / life / soul / mystical claims.
 *
 * Reference: docs/causal-trace-layer-correlation.md §4
 */

import type { CausalTraceConfidence } from './causalTrace.ts';

// ── LayerCorrelationPair ──────────────────────────────────────────────────────

/**
 * A computed Pearson correlation between two globalSummary metrics over a time window.
 *
 * IMPORTANT: Correlation is not causal proof.
 */
export interface LayerCorrelationPair {
    /** Unique identifier for this pair (e.g. "curvature×vortex") */
    id: string;
    /** Human-readable label for the first metric */
    labelA: string;
    /** globalSummary key for the first metric */
    metricKeyA: string;
    /** Human-readable label for the second metric */
    labelB: string;
    /** globalSummary key for the second metric */
    metricKeyB: string;
    /**
     * Pearson correlation coefficient, or null when insufficient data.
     * Range: [-1, 1]. Never NaN.
     */
    correlation: number | null;
    /** Number of tick samples used for computation */
    sampleCount: number;
    /** Confidence level based on sample count and variance */
    confidence: CausalTraceConfidence;
    /** Caution note — always present */
    caution: string;
}

// ── LayerCorrelationState ─────────────────────────────────────────────────────

/**
 * Collection of correlation pairs computed over a sliding time window.
 */
export interface LayerCorrelationState {
    /** Correlation pairs computed for this window */
    pairs: LayerCorrelationPair[];
    /** Number of ticks in the time window */
    timeWindowTicks: number;
    /** Actual number of snapshots used */
    snapshotCount: number;
    /** Tick of earliest snapshot in window */
    earliestTick: number | null;
    /** Tick of latest snapshot in window */
    latestTick: number | null;
    /** Whether enough data was available for meaningful correlation */
    sufficientData: boolean;
    /** Top-level caution */
    caution: string;
    /** Wall-clock timestamp when this state was computed */
    generatedAt: number;
}
