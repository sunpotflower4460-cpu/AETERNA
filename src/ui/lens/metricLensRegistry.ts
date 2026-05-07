/**
 * metricLensRegistry.ts
 * v1.6: Super Observation Architecture — Metric Visual Lens Registry
 *
 * Defines the available Metric Visual Lenses for the Cell Inspector.
 * Each lens maps one CellObservation metric group to a distinct visual mode.
 *
 * Design principles:
 * - Lenses are visual translations of actual observation values, NOT decorations.
 * - No fake glow, fake vortex, fake deformation layers.
 * - Each lens has a valueKind documenting how the displayed value relates to data.
 * - Activating a lens does NOT change runtime dynamics.
 * - Activating a lens creates a LensContextPacket for the AI Guide interface.
 * - No semantic / consciousness / mystical proof claim lenses defined here.
 *
 * Reference: docs/super-observation-architecture.md
 */

// ── MetricLensId ──────────────────────────────────────────────────────────────

/**
 * Canonical identifiers for all defined Metric Visual Lenses.
 * Each lens corresponds to one metric group in CellObservation.
 */
export type MetricLensId =
    | 'gaussianCurvature'
    | 'areaElement'
    | 'innerOuterBias'
    | 'fieldAmplitude'
    | 'fieldPhase'
    | 'phaseCoherence'
    | 'flowContinuity'
    | 'energyThroughput'
    | 'vortexConfidence'
    | 'topologicalCharge'
    | 'membraneDeformation'
    | 'membraneTension'
    | 'membranePermeability'
    | 'twoSidedness'
    | 'plasticityTrace'
    | 'resistanceScale'
    | 'observedRatioMatch';

// ── MetricLensValueKind ───────────────────────────────────────────────────────

/**
 * Epistemic status of the value shown by a lens.
 * - 'measured'  : Direct field buffer or state value.
 * - 'derived'   : Computed from one or more raw values.
 * - 'proxy'     : Indirect / approximated estimate.
 */
export type MetricLensValueKind = 'measured' | 'derived' | 'proxy';

// ── MetricLens ────────────────────────────────────────────────────────────────

/**
 * Definition of a single Metric Visual Lens.
 */
export interface MetricLens {
    /** Canonical identifier */
    id: MetricLensId;

    /** Human-readable display label (English) */
    label: string;

    /** Japanese display label — primary display in Japanese-first UI */
    labelJp: string;

    /**
     * Short description of what observable quantity this lens visualises.
     * Must NOT include semantic / consciousness / emotion claims.
     */
    description: string;

    /**
     * Scientific disclaimer.
     * Clarifies what this lens does NOT represent.
     */
    disclaimer: string;

    /** Epistemic status of the value displayed by this lens */
    valueKind: MetricLensValueKind;

    /**
     * CellObservation field path for the primary value shown.
     * E.g. 'geometry.gaussianCurvature', 'field.amplitude'.
     */
    observationPath: string;

    /**
     * Metric group within CellObservation that this lens is part of.
     * Used to group lenses in the UI.
     */
    group: 'geometry' | 'field' | 'vortex' | 'membrane' | 'plasticity' | 'ratios';

    /**
     * Primary color hex for this lens (from TORUS_COLOR_MAP conventions).
     * Does NOT imply semantic meaning.
     */
    colorHex: string;

    /**
     * Expected value range for display scaling.
     * null means the range is dynamic / unbounded.
     */
    displayRange: [number, number] | null;

    /**
     * Short label for the unit of the value (e.g. 'rad', 'norm', 'ratio').
     * 'norm' = normalised 0–1, 'raw' = raw field value.
     */
    unit: string;

    /**
     * Whether this lens is available in the current build.
     * Lenses that require future renderer integration may be marked false.
     */
    available: boolean;
}

// ── Registry ──────────────────────────────────────────────────────────────────

const LENSES: Record<MetricLensId, MetricLens> = {
    gaussianCurvature: {
        id: 'gaussianCurvature',
        label: 'Gaussian Curvature',
        labelJp: 'ガウス曲率レンズ',
        description: 'cos(v) / (r × (R + r·cos(v))). Positive on outer rim, negative on inner rim.',
        disclaimer: 'Purely geometric quantity. Does not represent activity, consciousness, or energy.',
        valueKind: 'measured',
        observationPath: 'geometry.gaussianCurvature',
        group: 'geometry',
        colorHex: '#34d399',
        displayRange: null,
        unit: 'm⁻²',
        available: true,
    },
    areaElement: {
        id: 'areaElement',
        label: 'Area Element',
        labelJp: '面積要素レンズ',
        description: 'r × (R + r·cos(v)). The local surface area per grid cell. Larger on outer rim.',
        disclaimer: 'Geometric metric only. Not a flow or energy value.',
        valueKind: 'measured',
        observationPath: 'geometry.areaElement',
        group: 'geometry',
        colorHex: '#a3e635',
        displayRange: null,
        unit: 'norm',
        available: true,
    },
    innerOuterBias: {
        id: 'innerOuterBias',
        label: 'Inner–Outer Bias',
        labelJp: '内外バイアスレンズ',
        description: 'cos(v). +1 = outer rim, −1 = inner rim. Captures torus ring position.',
        disclaimer: 'Geometric position measure. Not a semantic or saliency indicator.',
        valueKind: 'measured',
        observationPath: 'geometry.innerOuterBias',
        group: 'geometry',
        colorHex: '#60a5fa',
        displayRange: [-1, 1],
        unit: 'norm',
        available: true,
    },
    fieldAmplitude: {
        id: 'fieldAmplitude',
        label: 'Field Amplitude',
        labelJp: '場の振幅レンズ',
        description: 'Amplitude of the complex scalar field at this cell.',
        disclaimer: 'Raw field value. Not "activity level" in a biological or conscious sense.',
        valueKind: 'measured',
        observationPath: 'field.amplitude',
        group: 'field',
        colorHex: '#38bdf8',
        displayRange: null,
        unit: 'raw',
        available: true,
    },
    fieldPhase: {
        id: 'fieldPhase',
        label: 'Field Phase',
        labelJp: '位相レンズ',
        description: 'Phase angle of the complex scalar field at this cell, in radians [−π, π].',
        disclaimer: 'Phase angle. No semantic or temporal meaning assigned.',
        valueKind: 'measured',
        observationPath: 'field.phase',
        group: 'field',
        colorHex: '#e879f9',
        displayRange: [-Math.PI, Math.PI],
        unit: 'rad',
        available: true,
    },
    phaseCoherence: {
        id: 'phaseCoherence',
        label: 'Local Phase Coherence',
        labelJp: '局所位相コヒーレンスレンズ',
        description: 'Mean cosine similarity of this cell\'s phase to its 4 periodic neighbours. Range: 0–1.',
        disclaimer: 'Derived coherence proxy. High coherence is not consciousness or synchrony.',
        valueKind: 'derived',
        observationPath: 'field.phaseCoherenceLocal',
        group: 'field',
        colorHex: '#c084fc',
        displayRange: [0, 1],
        unit: 'norm',
        available: true,
    },
    flowContinuity: {
        id: 'flowContinuity',
        label: 'Local Flow Continuity',
        labelJp: '局所流れ連続性レンズ',
        description: 'Proxy for local amplitude gradient smoothness. High = gradual amplitude change.',
        disclaimer: 'Derived proxy. Not biological or conscious flow.',
        valueKind: 'derived',
        observationPath: 'field.flowContinuityLocal',
        group: 'field',
        colorHex: '#22d3ee',
        displayRange: [0, 1],
        unit: 'norm',
        available: true,
    },
    energyThroughput: {
        id: 'energyThroughput',
        label: 'Local Energy Throughput',
        labelJp: '局所エネルギー通量レンズ',
        description: 'Amplitude × flow continuity proxy. Larger where amplitude is high and flow is smooth.',
        disclaimer: 'Derived proxy. Not biological or conscious energy.',
        valueKind: 'derived',
        observationPath: 'field.energyThroughputLocal',
        group: 'field',
        colorHex: '#fbbf24',
        displayRange: null,
        unit: 'raw',
        available: true,
    },
    vortexConfidence: {
        id: 'vortexConfidence',
        label: 'Vortex Candidate Confidence',
        labelJp: '渦候補レンズ',
        description: 'Observer-side confidence that a phase-defect candidate is located at or near this cell.',
        disclaimer: 'Observer-side proxy. Not a guaranteed vortex. Not a consciousness centre.',
        valueKind: 'proxy',
        observationPath: 'vortex.candidateConfidence',
        group: 'vortex',
        colorHex: '#f472b6',
        displayRange: [0, 1],
        unit: 'norm',
        available: true,
    },
    topologicalCharge: {
        id: 'topologicalCharge',
        label: 'Topological Charge',
        labelJp: 'トポロジカル電荷レンズ',
        description: 'Phase-winding topological charge at this cell: +1, 0, or −1.',
        disclaimer: 'Topological index derived from phase winding. Not a semantic or electrostatic charge.',
        valueKind: 'derived',
        observationPath: 'vortex.topologicalCharge',
        group: 'vortex',
        colorHex: '#fb923c',
        displayRange: [-1, 1],
        unit: 'int',
        available: true,
    },
    membraneDeformation: {
        id: 'membraneDeformation',
        label: 'Membrane Deformation',
        labelJp: '膜変形レンズ',
        description: 'Local membrane deformation at this cell. Range: 0–1.',
        disclaimer: 'Observer-side state value. Not biological membrane deformation.',
        valueKind: 'measured',
        observationPath: 'membrane.deformation',
        group: 'membrane',
        colorHex: '#f87171',
        displayRange: [0, 1],
        unit: 'norm',
        available: true,
    },
    membraneTension: {
        id: 'membraneTension',
        label: 'Membrane Tension',
        labelJp: '膜張力レンズ',
        description: 'Local membrane tension at this cell. Range: 0–1.',
        disclaimer: 'Observer-side state value. Not physical tension.',
        valueKind: 'measured',
        observationPath: 'membrane.tension',
        group: 'membrane',
        colorHex: '#fca5a5',
        displayRange: [0, 1],
        unit: 'norm',
        available: true,
    },
    membranePermeability: {
        id: 'membranePermeability',
        label: 'Membrane Permeability',
        labelJp: '膜透過性レンズ',
        description: 'Local membrane permeability at this cell. Range: 0–1.',
        disclaimer: 'Observer-side state value. Not biological permeability.',
        valueKind: 'measured',
        observationPath: 'membrane.permeability',
        group: 'membrane',
        colorHex: '#fde68a',
        displayRange: [0, 1],
        unit: 'norm',
        available: true,
    },
    twoSidedness: {
        id: 'twoSidedness',
        label: 'Two-Sidedness',
        labelJp: '二面性レンズ',
        description: 'Membrane two-sidedness at this cell: overlap between actuation and return imprints.',
        disclaimer: 'Derived metric. Not a biological membrane property claim.',
        valueKind: 'measured',
        observationPath: 'membrane.twoSidedness',
        group: 'membrane',
        colorHex: '#d9f99d',
        displayRange: [0, 1],
        unit: 'norm',
        available: true,
    },
    plasticityTrace: {
        id: 'plasticityTrace',
        label: 'Plasticity Trace',
        labelJp: '媒質履歴レンズ',
        description: 'Total accumulated weak plasticity trace at this cell (all channels summed).',
        disclaimer: 'Observer-side trace accumulation. Not learning, memory, or synaptic weight.',
        valueKind: 'derived',
        observationPath: 'plasticity.accumulatedTrace',
        group: 'plasticity',
        colorHex: '#a78bfa',
        displayRange: [0, 1],
        unit: 'norm',
        available: true,
    },
    resistanceScale: {
        id: 'resistanceScale',
        label: 'Resistance Scale',
        labelJp: '抵抗スケールレンズ',
        description: 'Multiplicative resistance scale factor at this cell. 1.0 = neutral.',
        disclaimer: 'Derived scale factor. Not a physical resistance or memory weight.',
        valueKind: 'derived',
        observationPath: 'plasticity.resistanceScale',
        group: 'plasticity',
        colorHex: '#818cf8',
        displayRange: null,
        unit: 'ratio',
        available: true,
    },
    observedRatioMatch: {
        id: 'observedRatioMatch',
        label: 'Observed Ratio Match',
        labelJp: '観測比率レンズ',
        description: 'Strongest reference ratio match strength for this observation context. Range: 0–1.',
        disclaimer: 'Similarity proxy only. High matchStrength is NOT proof of resonance, life, or consciousness.',
        valueKind: 'proxy',
        observationPath: 'ratios.strongestMatchStrength',
        group: 'ratios',
        colorHex: '#f9a8d4',
        displayRange: [0, 1],
        unit: 'norm',
        available: true,
    },
};

// ── Registry API ──────────────────────────────────────────────────────────────

/** All defined lens IDs, in registration order. */
export const ALL_LENS_IDS: MetricLensId[] = Object.keys(LENSES) as MetricLensId[];

/** Return all defined lenses. */
export function getAllLenses(): MetricLens[] {
    return Object.values(LENSES);
}

/** Return all available lenses (available === true). */
export function getAvailableLenses(): MetricLens[] {
    return Object.values(LENSES).filter((l) => l.available);
}

/** Return a specific lens by ID, or null if not found. */
export function getLens(id: MetricLensId): MetricLens | null {
    return LENSES[id] ?? null;
}

/** Return all lenses for a specific metric group. */
export function getLensesByGroup(
    group: MetricLens['group'],
): MetricLens[] {
    return Object.values(LENSES).filter((l) => l.group === group);
}

/**
 * Find the lens whose observationPath best matches a given metric path string.
 * Returns null when no match is found.
 *
 * @param metricPath - CellObservation field path, e.g. 'geometry.gaussianCurvature'
 */
export function findLensForMetric(metricPath: string): MetricLens | null {
    return Object.values(LENSES).find((l) => l.observationPath === metricPath) ?? null;
}
