/**
 * observedRatios.ts
 * N6: External Constants Removal / Observed Ratios
 *
 * Types for observed ratio computation and reference ratio comparison.
 *
 * Design principles:
 * - ObservedRatio is derived from field dynamics (amplitude peaks, vortex
 *   spacing, flow delay, closure timing, phase coherence).
 * - ReferenceRatioMatch is an observer-side comparison only.
 * - No observed ratio is fed back into runtime dynamics.
 * - A high matchStrength is NOT a proof of meaning, life, or consciousness.
 * - A low matchStrength is NOT an error or failure.
 * - NaN / Infinity are guarded; nanOrInfinityCount tracks violations.
 *
 * Reference: docs/observed-ratios.md
 */

/**
 * A single ratio observed from field dynamics.
 */
export interface ObservedRatio {
    /** Unique identifier for this observed ratio */
    id: string;
    /** Human-readable label */
    label: string;
    /** Numerator of the ratio (raw value) */
    numerator: number;
    /** Denominator of the ratio (raw value) */
    denominator: number;
    /**
     * Computed ratio: numerator / denominator.
     * Guarded against division by zero and non-finite values.
     */
    value: number;
    /** Source of the ratio */
    source: 'amplitudePeak' | 'vortexSpacing' | 'flowDelay' | 'closureTiming' | 'phaseCoherence' | 'other';
    /**
     * Confidence in this ratio estimate.
     * Range: 0–1. Low confidence means the source data was sparse or uncertain.
     */
    confidence: number;
}

/**
 * A comparison between one observed ratio and one reference ratio.
 */
export interface ReferenceRatioMatch {
    /** ID of the ObservedRatio */
    observedRatioId: string;
    /** ID of the ReferenceRatio */
    referenceRatioId: string;
    /** The observed ratio value */
    observedValue: number;
    /** The reference ratio value */
    referenceValue: number;
    /** |observed − reference| */
    absoluteDistance: number;
    /** |observed − reference| / |reference|  (relative error) */
    relativeDistance: number;
    /**
     * Distance in cents: 1200 × log₂(observed / reference).
     * Only defined when both observed and reference are finite and positive.
     * null when undefined.
     */
    centsDistance: number | null;
    /**
     * Match strength: 1 − clamp(relativeDistance / tolerance, 0, 1).
     * Range: 0–1. 1 = exact match. 0 = beyond tolerance.
     *
     * A high matchStrength is an observational fact only.
     * It does NOT prove meaning, life, consciousness, or mystical resonance.
     */
    matchStrength: number;
}

/**
 * Complete observed ratios state for one observation cycle.
 */
export interface ObservedRatiosState {
    /** Wall-clock timestamp of this observation */
    timestamp: number;

    /** All observed ratios derived from available field states */
    observedRatios: ObservedRatio[];

    /** All reference ratio matches (cross product of observed × reference) */
    referenceMatches: ReferenceRatioMatch[];

    /**
     * The single match with the highest matchStrength.
     * null when no matches are available.
     *
     * NOTE: The strongest match is an observational fact only.
     * It does NOT prove anything about the system.
     */
    strongestMatch: ReferenceRatioMatch | null;

    /**
     * Average matchStrength across all reference matches with confidence > 0.
     * Range: 0–1.
     */
    averageMatchStrength: number;

    /**
     * Proxy: fraction of top-N matches whose matchStrength exceeds a threshold.
     * Range: 0–1.
     *
     * CAUTION: This is a similarity proxy only.
     * It is NOT a proof of resonance, life, or consciousness.
     * It is NOT fed back into runtime dynamics.
     */
    emergentResonanceProxy: number;

    /**
     * Average confidence across all observed ratios.
     * Range: 0–1. Low when source data was sparse or unavailable.
     */
    observationConfidence: number;

    /**
     * Count of NaN or Infinity values encountered during derivation.
     * Should always be 0.
     */
    nanOrInfinityCount: number;

    /**
     * Mode used for core dynamics constants when this observation was derived.
     * 'neutral' or 'legacy'.
     */
    externalConstantsMode: 'neutral' | 'legacy';
}
