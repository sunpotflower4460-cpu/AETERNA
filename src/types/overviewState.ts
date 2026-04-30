/**
 * overviewState.ts
 * U5: Overview / Now Summary / Event Timeline
 *
 * Defines the OverviewState and OverviewMetric types used to present
 * a compact, fact-based summary of AETERNA's current field state.
 *
 * Principles:
 * - overallStatus describes observable field conditions, NOT emotion or intent.
 * - "active" means field activity is elevated; it does NOT mean "conscious" or "aware".
 * - "quiet" means field activity is low; it does NOT mean "sleeping" or "lonely".
 * - No consciousness / emotion / self-awareness claims.
 * - valueKind distinguishes measured / derived / proxy / presentation-smoothed / check.
 *
 * Reference: docs/scientific-ui-ux-principles.md
 * Reference: docs/visualization-integrity-principles.md §2.4
 */

// ── OverviewMetric ─────────────────────────────────────────────────────────────

/**
 * How the metric value was produced.
 * - 'measured'              : direct observation from simulation buffer
 * - 'derived'               : computed from one or more measured values
 * - 'proxy'                 : indirect inference from correlated signals
 * - 'presentation-smoothed' : presentation-time smoothing applied to reduce jitter
 * - 'check'                 : a boolean or categorical safety/integrity check
 */
export type OverviewValueKind =
    | 'measured'
    | 'derived'
    | 'proxy'
    | 'presentation-smoothed'
    | 'check';

/**
 * Status labels for an Overview metric.
 * These are observation states, NOT emotions or intent.
 */
export type OverviewMetricStatus =
    | 'low'       // Below typical operating range
    | 'moderate'  // Within typical operating range
    | 'high'      // Above typical operating range
    | 'warning'   // Risk threshold exceeded — attention warranted
    | 'clear'     // Check passed (for safety / integrity checks)
    | 'unknown';  // Insufficient data to determine status

/**
 * A single Overview metric card entry.
 */
export interface OverviewMetric {
    /** Stable identifier for this metric */
    id: string;

    /** Human-readable label (no emotion / consciousness terms) */
    label: string;

    /**
     * Display value.
     * Numbers are formatted to 3 decimal places by the rendering layer.
     * String values are shown as-is.
     */
    value: number | string;

    /** Observation status (not an emotion label) */
    status: OverviewMetricStatus;

    /** How this value was produced */
    valueKind: OverviewValueKind;

    /** Which state / computation this metric originates from */
    source: string;
}

// ── OverviewState ──────────────────────────────────────────────────────────────

/**
 * Overall system-state descriptor.
 * These labels describe observable field conditions only.
 * They are NOT personality states, emotional states, or consciousness claims.
 *
 * - 'quiet'           : Field activity is low, no significant perturbation active
 * - 'active'          : Field activity elevated, perturbation or return in progress
 * - 'unstable'        : Mismatch / oscillation / collapse risk elevated
 * - 'saturated-risk'  : Echo / activity saturation risk elevated
 * - 'extinction-risk' : Field activity near collapse threshold
 * - 'unknown'         : Insufficient data for classification
 */
export type OverviewOverallStatus =
    | 'quiet'
    | 'active'
    | 'unstable'
    | 'saturated-risk'
    | 'extinction-risk'
    | 'unknown';

/**
 * A full overview state snapshot, intended for the Overview Panel.
 * Derived from existing simulation metrics — does NOT compute new runtime values.
 */
export interface OverviewState {
    /** Frame timestamp when this snapshot was taken */
    timestamp: number;

    /** Ordered list of metric cards to display */
    metrics: OverviewMetric[];

    /**
     * Compact overall field status.
     * Observation-based classification only — no emotion / consciousness mapping.
     */
    overallStatus: OverviewOverallStatus;

    /**
     * Confidence in this overview (0–1).
     * Reflects data availability; low when upstream states are missing.
     */
    confidence: number;
}
