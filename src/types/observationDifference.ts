/**
 * observationDifference.ts
 * v1.8: Causal Trace / Layer Correlation — Difference View
 *
 * Defines ObservationDifferenceItem and ObservationDifferenceState
 * for the Difference View feature.
 *
 * Design principles:
 * - Shows before/after/delta for observation metrics between two ticks.
 * - No consciousness / emotion / life / mystical claims.
 * - Null/undefined values are handled gracefully — never substituted with 0.
 * - relativeDelta is null when beforeValue is 0 or unavailable.
 *
 * Reference: docs/causal-trace-layer-correlation.md §5
 */

// ── ObservationDifferenceItem ─────────────────────────────────────────────────

/**
 * A single metric difference between two observation snapshots.
 */
export interface ObservationDifferenceItem {
    /** Metric identifier (dot-separated path, e.g. "field.amplitude") */
    metricId: string;
    /** Human-readable label */
    label: string;
    /**
     * Epistemic kind of the value.
     * 'Raw' | 'Measured' | 'Derived' | 'Proxy' | 'Check' | 'Reference'
     */
    valueKind: 'Raw' | 'Measured' | 'Derived' | 'Proxy' | 'Check' | 'Reference';
    /** Value at the before tick (null if not available) */
    valueBefore: number | null;
    /** Value at the after tick (null if not available) */
    valueAfter: number | null;
    /** afterValue − beforeValue (null if either is unavailable) */
    delta: number | null;
    /**
     * delta / |beforeValue| (null if beforeValue is 0 or unavailable).
     * Expressed as a fraction, not a percentage.
     */
    relativeDelta: number | null;
    /** Source layer ('geometry' | 'field' | 'vortex' | etc.) */
    sourceLayer: string;
}

// ── ObservationDifferenceState ────────────────────────────────────────────────

/**
 * Full difference state between two observation snapshots.
 */
export interface ObservationDifferenceState {
    /** Tick of the before snapshot */
    beforeTick: number;
    /** Tick of the after snapshot */
    afterTick: number;
    /** Active lens ID at time of comparison (null if none) */
    activeLensId: string | null;
    /** All computed difference items */
    items: ObservationDifferenceItem[];
    /**
     * Top 5 items by |delta|, descending.
     * Empty when no items have a non-null delta.
     */
    largestChanges: ObservationDifferenceItem[];
    /** Whether a cell observation was available for comparison */
    cellObservationAvailable: boolean;
    /** Whether globalSummary data was available for comparison */
    globalSummaryAvailable: boolean;
    /** Caution note */
    caution: string;
    /** Wall-clock timestamp when this state was computed */
    generatedAt: number;
}
