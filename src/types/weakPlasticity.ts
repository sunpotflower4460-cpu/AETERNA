/**
 * weakPlasticity.ts
 * N5: Weak Plasticity Channel — core types
 *
 * Design principles:
 * - These types capture observer-side accumulation and derived resistance deltas.
 * - No semantic labels, no learning claims, no runtime graph nodes.
 * - regionId values are spatial / geometry coordinate strings only.
 * - All values are finite numbers; NaN / Infinity are guarded at derivation.
 * - resistanceScale is clamped to [minResistanceScale, maxResistanceScale].
 * - Runtime exposure is conditional on mode='resistanceOnly' AND enabled AND NOT ablation.
 *
 * Reference: docs/weak-plasticity-channel.md
 */

/**
 * Per-cell weak plasticity trace record.
 *
 * Each cell corresponds to one (i, j) coarse region on the torus.
 * It accumulates four independent trace channels plus a combined total,
 * and derives a resistance delta for optional (config-gated) runtime feedback.
 */
export interface WeakPlasticityCellTrace {
    /** Spatial region identifier (e.g. "u2-v3"). NOT a semantic label. */
    regionId: string;

    /** Linear index into the flat cells array: index = i * segments + j */
    index: number;

    /**
     * Accumulated trace from vortex candidate activity near this region.
     * Increased when a vortex candidate with confidence >= requireConfidenceAbove
     * is located in this region. Decays over time.
     * Range: 0–1. NOT a "consciousness centre" marker.
     */
    vortexTrace: number;

    /**
     * Accumulated trace from repeated-flow-path candidates that include this
     * region as from or to endpoint.
     * Range: 0–1. NOT a semantic memory route.
     */
    repeatedFlowTrace: number;

    /**
     * Accumulated trace from local excitability conditions in this region.
     * Increased when excitability and thresholdProximity are both high and
     * refractoryDepth is not excessive.
     * Range: 0–1. NOT a neuron placement signal.
     */
    localExcitabilityTrace: number;

    /**
     * Accumulated trace from membrane observation.
     * Increased weakly when global actuationReturnOverlap or twoSidedness is high.
     * Range: 0–1. Applied globally when region-level membrane data is not available.
     */
    membraneTrace: number;

    /**
     * Sum of all four trace channels for this cell.
     * accumulatedTrace = vortexTrace + repeatedFlowTrace
     *                  + localExcitabilityTrace + membraneTrace
     * Range: 0–(saturated by clamp).
     */
    accumulatedTrace: number;

    /**
     * Signed resistance delta derived from accumulatedTrace.
     * Negative = local resistance is slightly reduced (flow was concentrated here).
     * Small magnitude: ≤ maxDeltaPerTick accumulation per tick.
     */
    resistanceDelta: number;

    /**
     * Multiplicative scale factor for local resistance.
     * Clamped to [minResistanceScale, maxResistanceScale].
     * effectiveResistance = baseResistance * resistanceScale
     * Only fed to runtime when mode='resistanceOnly' AND enabled AND NOT ablation.
     */
    resistanceScale: number;

    /** Tick at which this cell was last modified. Optional for diagnostics. */
    lastUpdatedTick?: number;

    /**
     * Confidence in the trace values for this cell.
     * Derived from the maximum candidate confidence that contributed this tick.
     * Range: 0–1.
     */
    confidence: number;
}

/**
 * Aggregate weak plasticity state snapshot for one tick.
 *
 * This is an observer-side record. It does NOT represent a runtime graph,
 * a learned structure, a semantic memory, or a consciousness indicator.
 */
export interface WeakPlasticityState {
    /** Wall-clock timestamp */
    timestamp: number;

    /** Simulation tick */
    tick: number;

    /** Grid size (segments × segments = cells.length) */
    segments: number;

    /** Per-cell trace records; length === segments * segments */
    cells: WeakPlasticityCellTrace[];

    /** Sum of accumulatedTrace across all cells */
    totalAccumulation: number;

    /** Mean accumulatedTrace across all cells */
    averageAccumulation: number;

    /** Maximum accumulatedTrace across all cells */
    maxAccumulation: number;

    /** Mean resistanceDelta across all cells */
    averageResistanceDelta: number;

    /** Maximum absolute resistanceDelta across all cells */
    maxResistanceDelta: number;

    /**
     * Number of cells with accumulatedTrace > 0 (any region that has been touched).
     */
    affectedRegionCount: number;

    /** Operating mode at the time of this snapshot */
    mode: 'off' | 'observeOnly' | 'resistanceOnly';

    /** Whether ablation was active at the time of this snapshot */
    ablationEnabled: boolean;

    /**
     * Count of cells that produced NaN or Infinity values during update.
     * Should always be 0. Used for diagnostic integrity checks.
     */
    nanOrInfinityCount: number;
}
