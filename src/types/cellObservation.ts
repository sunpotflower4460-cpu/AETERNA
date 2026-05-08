/**
 * cellObservation.ts
 * v1.6: Super Observation Architecture
 *
 * CellObservation is the per-cell integrated observation record used by the
 * Cell Inspector, Metric Spotlight, Visual Lens, and AI Guide Context.
 *
 * Design principles:
 * - Observer-side data model only — no runtime state is created or modified.
 * - All fields are optional; missing data results in undefined, not fake values.
 * - geometry / field / vortex / membrane / plasticity / ratios / events are
 *   grouped by source observer, not by visual priority.
 * - No semantic labels, no consciousness claims, no mystical proof claims.
 * - regionLabel is a geometric descriptor only ('innerRim' etc.), NOT a
 *   semantic object label or saliency claim.
 * - valueKinds documents the epistemic status of each field group.
 *
 * Reference: docs/super-observation-architecture.md
 */

// ── Region Label ───────────────────────────────────────────────────────────────

/**
 * Geometric region descriptor derived from minorAngle (v-angle) only.
 * Not a semantic label. Not a functional claim.
 *
 * - 'innerRim'  : cos(v) < -0.5  — inner ring of torus (negative curvature)
 * - 'outerRim'  : cos(v) > +0.5  — outer ring of torus (positive curvature)
 * - 'upperRim'  : sin(v) > +0.5  — upper ring
 * - 'lowerRim'  : sin(v) < -0.5  — lower ring
 * - 'neutral'   : mid-latitude belt
 */
export type CellRegionLabel =
    | 'innerRim'
    | 'outerRim'
    | 'upperRim'
    | 'lowerRim'
    | 'neutral';

// ── CellObservation ────────────────────────────────────────────────────────────

/**
 * Integrated per-cell observation record.
 *
 * One CellObservation is produced by deriveCellObservation() for a single
 * cell (by cellIndex) from the current set of observer snapshots.
 * It bundles geometry, field, vortex, membrane, plasticity, ratios, and
 * events data for that cell into one read-only structure.
 */
export interface CellObservation {
    /** Wall-clock timestamp when this observation was assembled */
    timestamp: number;

    /** Simulation tick (if available from any observer) */
    tick?: number;

    /** Flat cell index: cellIndex = i * segments + j */
    cellIndex: number;

    /** Grid dimensions (segments × segments = total cells) */
    segments: number;

    // ── Geometry ──────────────────────────────────────────────────────────────

    geometry: {
        /** Grid row coordinate */
        i?: number;
        /** Grid column coordinate */
        j?: number;
        /** Major (u) angle in radians [0, 2π) */
        majorAngle?: number;
        /** Minor (v) angle in radians [0, 2π) */
        minorAngle?: number;
        /** Geometric region label (innerRim / outerRim / upperRim / lowerRim / neutral) */
        regionLabel?: CellRegionLabel;
        /**
         * Area element at this cell: r × (R + r·cos(v)).
         * Larger on outer rim, smaller on inner rim.
         */
        areaElement?: number;
        /**
         * Gaussian curvature: cos(v) / (r × (R + r·cos(v))).
         * Positive on outer rim, negative on inner rim.
         */
        gaussianCurvature?: number;
        /**
         * Mean curvature: (R + 2r·cos(v)) / (2r × (R + r·cos(v))).
         */
        meanCurvature?: number;
        /**
         * Inner–outer bias: cos(v).
         * +1 = outer rim, -1 = inner rim.
         */
        innerOuterBias?: number;
    };

    // ── Complex Field ─────────────────────────────────────────────────────────

    field: {
        /** Field amplitude at this cell (derived from complex field buffer) */
        amplitude?: number;
        /** Field phase at this cell in radians [-π, π] */
        phase?: number;
        /**
         * Local phase coherence proxy: mean cosine distance to neighbours.
         * Range: 0–1. Higher = more coherent local neighbourhood.
         */
        phaseCoherenceLocal?: number;
        /**
         * Local flow continuity proxy: derived from amplitude gradient.
         * Range: 0–1.
         */
        flowContinuityLocal?: number;
        /**
         * Local energy throughput proxy: amplitude × flow continuity.
         * Range: 0–∞ (unbounded raw product).
         */
        energyThroughputLocal?: number;
    };

    // ── Vortex ────────────────────────────────────────────────────────────────

    vortex: {
        /**
         * Vortex candidate confidence at this cell.
         * 0 = no candidate, 1 = high-confidence candidate.
         * Source: VortexObservationState.vortexCandidateMask / candidates.
         */
        candidateConfidence?: number;
        /** Topological charge at this cell: +1, 0, or -1 */
        topologicalCharge?: number;
        /** Phase winding (loop integral of phase gradient) */
        phaseWinding?: number;
        /** Local amplitude minimum (key vortex signature) */
        amplitudeMinimum?: number;
        /**
         * ID of the nearest VortexCandidate to this cell, or null if none.
         * NOT a semantic identifier.
         */
        nearestCandidateId?: string | null;
    };

    // ── Membrane ──────────────────────────────────────────────────────────────

    membrane: {
        /**
         * Membrane deformation at this cell.
         * Source: MembraneState.cells[cellIndex].deformation.
         * Range: 0–1.
         */
        deformation?: number;
        /**
         * Membrane permeability at this cell.
         * Range: 0–1.
         */
        permeability?: number;
        /**
         * Membrane tension at this cell.
         * Range: 0–1.
         */
        tension?: number;
        /**
         * Actuation imprint at this cell.
         * Range: 0–1.
         */
        actuationImprint?: number;
        /**
         * Return imprint at this cell.
         * Range: 0–1.
         */
        returnImprint?: number;
        /**
         * Two-sidedness at this cell.
         * Range: 0–1.
         */
        twoSidedness?: number;
    };

    // ── Plasticity ────────────────────────────────────────────────────────────

    plasticity: {
        /**
         * Total accumulated trace at this cell.
         * Source: WeakPlasticityState.cells[cellIndex].accumulatedTrace.
         */
        accumulatedTrace?: number;
        /** Vortex-sourced trace component */
        vortexTrace?: number;
        /** Repeated-flow-sourced trace component */
        repeatedFlowTrace?: number;
        /** Local-excitability-sourced trace component */
        localExcitabilityTrace?: number;
        /** Membrane-sourced trace component */
        membraneTrace?: number;
        /**
         * Resistance scale at this cell.
         * 1.0 = neutral, < 1 = reduced resistance, > 1 = increased resistance.
         */
        resistanceScale?: number;
        /**
         * Whether the resistanceScale has been applied to runtime dynamics.
         * True only when mode='resistanceOnly' AND enabled AND NOT ablation.
         */
        runtimeApplied?: boolean;
    };

    // ── Observed Ratios ───────────────────────────────────────────────────────

    ratios: {
        /**
         * IDs of ObservedRatios that involve this cell's region.
         * Empty when no ratio data is available for this cell.
         */
        involvedObservedRatioIds: string[];
        /**
         * Label of the strongest reference ratio match involving this cell.
         * null when no match exceeds the minimum threshold.
         */
        strongestReferenceMatchLabel?: string | null;
        /**
         * Strength (0–1) of the strongest reference ratio match.
         * null when no match is available.
         */
        strongestMatchStrength?: number | null;
    };

    // ── Events ────────────────────────────────────────────────────────────────

    events: {
        /**
         * IDs of recent AeternaEvents that reference this cell's region.
         * Derived from event.source matching the cell's regionId.
         */
        recentEventIds: string[];
        /** Count of recent events referencing this cell */
        recentEventCount: number;
        /** Simulation tick of the most recent event referencing this cell */
        lastEventTick?: number;
    };

    // ── Conservation (v4.0) ───────────────────────────────────────────────────

    conservation: {
        /** Per-cell medium storage (raw value from spatial world medium). */
        mediumStorage?: number;
        /** Per-cell cumulative medium dissipation sink. */
        mediumDissipation?: number;
        /** Per-cell cumulative medium residue sink. */
        mediumResidue?: number;
        /** Per-cell cumulative medium outflow sink. */
        mediumOutflow?: number;
        /** Per-cell cumulative inflow that has entered the membrane. */
        membraneInflow?: number;
        /** Per-cell cumulative outflow released from the membrane to internal storage. */
        membraneReleased?: number;
        /** Per-cell internal substrate storage. */
        substrateStorage?: number;
        /** Per-cell cumulative substrate dissipation sink. */
        substrateDissipation?: number;
        /** Per-cell cumulative substrate residue sink. */
        substrateResidue?: number;
        /** Per-cell cumulative substrate outflow sink. */
        substrateOutflow?: number;
    };

    // ── Diagnostics ───────────────────────────────────────────────────────────

    diagnostics: {
        /**
         * Epistemic status of each data group.
         * 'measured' | 'derived' | 'proxy' | 'unavailable'
         */
        valueKinds: Record<
            'geometry' | 'field' | 'vortex' | 'membrane' | 'plasticity' | 'ratios' | 'events' | 'conservation',
            'measured' | 'derived' | 'proxy' | 'unavailable'
        >;
        /** Number of missing (undefined) fields across all groups */
        missingFieldCount: number;
        /** Whether any source observer snapshot was null/undefined */
        hasUnavailableSource: boolean;
    };
}

// ── CellObservationInput ──────────────────────────────────────────────────────

/**
 * Input bundle for deriveCellObservation().
 * All observer snapshots are optional; missing ones result in unavailable
 * data groups rather than errors.
 */
export interface CellObservationInput {
    timestamp: number;
    tick?: number;
    cellIndex: number;
    segments: number;

    /** From torusGeometry.cells[cellIndex] */
    torusCell?: {
        i: number;
        j: number;
        majorAngle: number;
        minorAngle: number;
        areaElement: number;
        gaussianCurvature: number;
        meanCurvature: number;
        innerOuterBias: number;
    } | null;

    /** From VortexObservationState */
    vortexObservation?: {
        vortexCandidateMask: Uint8Array;
        topologicalCharge: Int8Array;
        vorticity: Float32Array;
        candidates: Array<{
            id: string;
            i: number;
            j: number;
            confidence: number;
            amplitudeMinimum: number;
            phaseWinding: number;
            topologicalCharge: number;
        }>;
    } | null;

    /** Field amplitude buffer (length = segments²) */
    amplitude?: Float32Array | null;

    /** Field phase buffer (length = segments²) */
    phase?: Float32Array | null;

    /** Precomputed phase gradient (length = segments²), optional */
    phaseGradient?: Float32Array | null;

    /** From MembraneState */
    membraneState?: {
        cells: Array<{
            index: number;
            deformation: number;
            permeability: number;
            tension: number;
            actuationImprint: number;
            returnImprint: number;
            twoSidedness: number;
        }>;
    } | null;

    /** From WeakPlasticityState */
    weakPlasticityState?: {
        cells: Array<{
            index: number;
            accumulatedTrace: number;
            vortexTrace: number;
            repeatedFlowTrace: number;
            localExcitabilityTrace: number;
            membraneTrace: number;
            resistanceScale: number;
        }>;
        mode: 'off' | 'observeOnly' | 'resistanceOnly';
        ablationEnabled: boolean;
    } | null;

    /** From ObservedRatiosState */
    observedRatiosState?: {
        observedRatios: Array<{ id: string; source: string }>;
        strongestMatch: {
            observedRatioId: string;
            referenceRatioId: string;
            matchStrength: number;
        } | null;
        referenceMatches: Array<{
            observedRatioId: string;
            referenceRatioId: string;
            matchStrength: number;
        }>;
    } | null;

    /** Recent AeternaEvents (newest first) */
    recentEvents?: Array<{
        id: string;
        tick: number;
        source: string;
    }> | null;

    /** Cell's regionId string (e.g. "u2-v3") for event source matching */
    regionId?: string;

    /**
     * Spatial world medium snapshot (v3.1+).
     * If width × height does not match segments², these fields are treated as unavailable.
     */
    spatialWorldMedium?: {
        width: number;
        height: number;
        mediumStorageField: ArrayLike<number>;
        mediumDissipationField: ArrayLike<number>;
        mediumResidueField: ArrayLike<number>;
        mediumOutflowField: ArrayLike<number>;
        membraneExchangeField: ArrayLike<number>;
        membraneExchangeReleasedField: ArrayLike<number>;
    } | null;

    /**
     * Local conservation substrate snapshot (v3.0+).
     * If width × height does not match segments², these fields are treated as unavailable.
     */
    localConservationSubstrate?: {
        width: number;
        height: number;
        storageField: ArrayLike<number>;
        dissipationField: ArrayLike<number>;
        residueField: ArrayLike<number>;
        outflowField: ArrayLike<number>;
    } | null;
}
