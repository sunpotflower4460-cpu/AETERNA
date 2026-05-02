/**
 * naturalDiagnosticState.ts
 * AETERNA-NATURAL v1.0 Stabilization
 *
 * Unified diagnostic state for all N-series subsystems.
 * Aggregates NaN / Infinity / saturation / clamp warnings from N1–N7 into a
 * single observable snapshot.
 *
 * Design principles:
 * - Pure data — no runtime feedback, no side effects.
 * - All count fields default to 0; all string arrays default to [].
 * - validForLongRun=false means the current state has too many warnings for
 *   long-run comparison to be reliable.
 * - No semantic node, Node bridge, LLM, or API.
 *
 * Reference: docs/aeterna-natural-v1-stabilization.md §8
 */

// ── NaturalDiagnosticState ─────────────────────────────────────────────────────

/**
 * Unified diagnostic snapshot for the N-series subsystems.
 *
 * Each warnings array records human-readable messages from the corresponding
 * subsystem.  Counts (totalNanOrInfinityCount, clampEventCount) are running
 * totals since the last reset.
 *
 * Interpretation guardrails:
 * - high vortex count ≠ consciousness
 * - high clamp count ≠ life activity
 * - warnings do not indicate failure — absence of warnings is not success either
 * - validForLongRun=true does not imply emergence
 */
export interface NaturalDiagnosticState {
    /** Unix timestamp (ms) when this snapshot was derived. */
    timestamp: number;

    /**
     * Total number of NaN or Infinity values encountered across all N-series
     * subsystems since last reset.
     */
    totalNanOrInfinityCount: number;

    // ── N1: Geometry ───────────────────────────────────────────────────────────

    /** Warnings from torus geometry validation (N1). */
    geometryWarnings: string[];

    // ── N2 / N3: Complex field / vortex ────────────────────────────────────────

    /** Warnings from complex field amplitude / phase / NaN checks (N2). */
    complexFieldWarnings: string[];

    /** Warnings from vortex candidate detection (N2 / N3). */
    vortexWarnings: string[];

    // ── N4: Membrane ───────────────────────────────────────────────────────────

    /** Warnings from membrane observation (N4). */
    membraneWarnings: string[];

    // ── N5: Weak plasticity ────────────────────────────────────────────────────

    /** Warnings from weak plasticity channel (N5). */
    plasticityWarnings: string[];

    // ── N6: Observed ratios ────────────────────────────────────────────────────

    /** Warnings from observed ratio computation (N6). */
    observedRatioWarnings: string[];

    // ── N7: Long-run comparison ────────────────────────────────────────────────

    /** Warnings from long-run comparison suite (N7). */
    comparisonWarnings: string[];

    // ── Saturation / clamp ─────────────────────────────────────────────────────

    /**
     * Maximum saturation risk value seen across all subsystems [0, 1].
     * Values above 0.8 should trigger a safetyWarning.
     */
    saturationRiskMax: number;

    /**
     * Total number of clamp events fired across all N-series subsystems
     * since last reset.
     */
    clampEventCount: number;

    // ── Cross-system safety ────────────────────────────────────────────────────

    /**
     * Safety warnings derived from cross-system checks
     * (e.g. high saturation in multiple subsystems simultaneously).
     */
    safetyWarnings: string[];

    /**
     * True when no subsystem is reporting warnings that would make long-run
     * comparison results unreliable.
     *
     * Becomes false when:
     * - totalNanOrInfinityCount > 0
     * - saturationRiskMax > 0.8
     * - any safetyWarnings are present
     */
    validForLongRun: boolean;
}

// ── Empty / default ────────────────────────────────────────────────────────────

/**
 * Returns a freshly zeroed NaturalDiagnosticState.
 * Used as the initial value before any ticks have run.
 */
export function emptyNaturalDiagnosticState(timestamp?: number): NaturalDiagnosticState {
    return {
        timestamp: timestamp ?? Date.now(),
        totalNanOrInfinityCount: 0,
        geometryWarnings: [],
        complexFieldWarnings: [],
        vortexWarnings: [],
        membraneWarnings: [],
        plasticityWarnings: [],
        observedRatioWarnings: [],
        comparisonWarnings: [],
        saturationRiskMax: 0,
        clampEventCount: 0,
        safetyWarnings: [],
        validForLongRun: true,
    };
}
