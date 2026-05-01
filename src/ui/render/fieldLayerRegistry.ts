/**
 * fieldLayerRegistry.ts
 * U4: Field Layer Visualization — field layer registry
 *
 * Defines the canonical set of observation layers for the Field Layer
 * Visualization system.  Each layer maps one observable field quantity
 * (or a well-defined proxy thereof) to a visual channel.
 *
 * Principles:
 * - Layers are translations of actual observation values, NOT decorations.
 * - No fake energy / fake trace / fake flow layers are defined here.
 * - No semantic / consciousness / emotion claim layers are defined here.
 * - Each layer carries a `valueKind` that documents how the displayed value
 *   relates to the underlying field data.
 * - Proto-Network Candidate layer is NOT a semantic network — it is an
 *   observer-side pre-semantic candidate.
 *
 * Layer names intentionally avoid: emotion, thought, will, consciousness,
 * self-awareness, memory, meaning, concept, relation.
 *
 * Reference: docs/visualization-integrity-principles.md §2.1–2.4
 */

// ── Value Kind ────────────────────────────────────────────────────────────────

/**
 * Describes how a layer's displayed value relates to underlying field data.
 *
 * - 'measured'              : Value read directly from a field buffer or packet
 *                             without transformation (raw measurement).
 * - 'derived'               : Calculated from one or more raw values
 *                             (e.g. activity = f(currentBuffer), trace = f(salienceResidue)).
 * - 'proxy'                 : Indirect / approximated estimate of a phenomenon
 *                             (e.g. closure match, proto-network candidate confidence).
 * - 'presentation-smoothed' : A raw or derived value that has been temporally
 *                             or spatially smoothed for display legibility.
 *                             MUST be labelled [S] in the UI when active.
 */
export type FieldLayerValueKind =
    | 'measured'
    | 'derived'
    | 'proxy'
    | 'presentation-smoothed';

// ── Layer ID ──────────────────────────────────────────────────────────────────

/**
 * Canonical identifiers for all defined field layers.
 */
export type FieldLayerId =
    | 'energyActivity'
    | 'traceResidue'
    | 'actuationPulse'
    | 'sensoryReturn'
    | 'closureMatch'
    | 'mediumEchoDelay'
    | 'localExcitability'
    | 'repeatedFlowPath'
    | 'protoNetworkCandidate'
    | 'riskOverlay';

// ── Layer Definition ──────────────────────────────────────────────────────────

/**
 * Full definition of a single observation layer.
 */
export interface FieldLayerDefinition {
    /** Canonical identifier */
    id: FieldLayerId;

    /** Human-readable label shown in the UI */
    label: string;

    /**
     * Short description of what observable quantity this layer shows.
     * Must NOT include semantic / consciousness / emotion claims.
     */
    description: string;

    /**
     * Scientific disclaimer / tooltip text.
     * Clarifies what this layer does NOT represent.
     */
    disclaimer: string;

    /**
     * How the displayed value relates to underlying field data.
     */
    valueKind: FieldLayerValueKind;

    /**
     * Whether this layer is visible by default when the UI starts.
     */
    defaultVisible: boolean;

    /**
     * Primary color role key referencing TORUS_COLOR_MAP.
     */
    colorRole: string;

    /**
     * Which render modes allow this layer to be shown.
     * In 'raw' mode, presentation-smoothed layers should show raw values instead.
     */
    allowedModes: Array<'raw' | 'smooth' | 'overlay' | 'diagnostic'>;

    /**
     * Source state / metrics from which this layer's value is derived.
     * Listed for documentation / auditability only.  The UI reads these
     * from the organism observation pipeline; it does NOT create or modify them.
     */
    sourceStates: string[];
}

// ── Registry ──────────────────────────────────────────────────────────────────

/**
 * Registry of all U4 field layers.
 * Ordered by display priority (higher = shown on top when overlapping).
 */
export const FIELD_LAYER_REGISTRY: Record<FieldLayerId, FieldLayerDefinition> = {

    energyActivity: {
        id: 'energyActivity',
        label: 'Energy / Activity',
        description:
            'Ongoing energy flow and activity level across the torus field. ' +
            'Derived from currentBuffer mean activity, flowContinuity, and energyThroughput.',
        disclaimer:
            'This layer shows derived field activity values. ' +
            'It maps activity distribution only.',
        valueKind: 'derived',
        defaultVisible: true,
        colorRole: 'flow',
        allowedModes: ['raw', 'smooth', 'overlay', 'diagnostic'],
        sourceStates: [
            'DynamicViabilityState.flowContinuity',
            'DynamicViabilityState.energyThroughput',
            'organism.currentBuffer (mean absolute activity)',
        ],
    },

    traceResidue: {
        id: 'traceResidue',
        label: 'Trace / Residue',
        description:
            'Residue left by past flow, perturbation, and return activity in the field. ' +
            'Derived from TraceState.traceStrength, salienceResidue, and local field traceResidue.',
        disclaimer:
            'This layer shows pre-semantic field residue from prior activity. ' +
            'It is a persistence map for earlier field flow, not a semantic record.',
        valueKind: 'derived',
        defaultVisible: true,
        colorRole: 'trace',
        allowedModes: ['raw', 'smooth', 'overlay', 'diagnostic'],
        sourceStates: [
            'TraceState.traceStrength',
            'TraceState.salienceResidue',
            'LocalExcitabilityCell.traceResidue (per region)',
            'RepeatedFlowPathCandidate.traceSupport',
        ],
    },

    actuationPulse: {
        id: 'actuationPulse',
        label: 'Actuation Pulse',
        description:
            'Outward actuation pulse emitted from AETERNA into the World Medium. ' +
            'Shows pulse intensity and locality as a brief outward wave.',
        disclaimer:
            'This layer shows the actuation output signal. ' +
            'It maps outward signal intensity and locality only.',
        valueKind: 'measured',
        defaultVisible: false,
        colorRole: 'activity',
        allowedModes: ['raw', 'smooth', 'overlay', 'diagnostic'],
        sourceStates: [
            'ActuationPulse.intensity',
            'ActuationPulse.coherence',
            'ActuationPulse.locality',
            'ActuationPulse.outputReadiness',
        ],
    },

    sensoryReturn: {
        id: 'sensoryReturn',
        label: 'Sensory Return',
        description:
            'Incoming return signals from the World Medium back into AETERNA. ' +
            'Orange lines/waves show return intensity and direction.',
        disclaimer:
            'This layer shows incoming pre-semantic signals from the simulated world. ' +
            'It is NOT a message, answer, or semantic input. ' +
            'Reafference attribution (self-caused vs world-caused) is shown in Closure Match.',
        valueKind: 'measured',
        defaultVisible: true,
        colorRole: 'sensoryReturn',
        allowedModes: ['raw', 'smooth', 'overlay', 'diagnostic'],
        sourceStates: [
            'SensoryReturnPacket.intensity',
            'SensoryReturnPacket.returnDelayHint',
            'SensoryReturnPacket.worldOriginStrength',
            'ReafferenceComparisonState.actualReturn',
        ],
    },

    closureMatch: {
        id: 'closureMatch',
        label: 'Closure Match',
        description:
            'Proxy measure of how strongly actuation pulses and sensory returns form a closed loop. ' +
            'Thin arcs connect pulse region to return region; opacity reflects match strength.',
        disclaimer:
            'This is a reafference comparison proxy. ' +
            '"Closure Match" indicates pulse-return correspondence only. ' +
            'Value kind: proxy.',
        valueKind: 'proxy',
        defaultVisible: false,
        colorRole: 'closure',
        allowedModes: ['overlay', 'diagnostic'],
        sourceStates: [
            'ReafferenceComparisonState.selfCausedMatch',
            'ReafferenceComparisonState.returnMismatch',
            'BodyWorldClosureState.selfCausedMatch',
            'BodyWorldClosureState.closureStability',
            'BodyWorldClosureState.worldMismatch',
            'BodyWorldClosureState.unresolvedReturn',
        ],
    },

    mediumEchoDelay: {
        id: 'mediumEchoDelay',
        label: 'Medium Echo / Delay',
        description:
            'Echo persistence, delay profile, and resistance conditions of the World Medium. ' +
            'Shown as a faint outer shell / ring on the torus surface boundary.',
        disclaimer:
            'This layer shows World Medium conditions — echo, delay, resistance. ' +
            'It maps medium conditions only.',
        valueKind: 'derived',
        defaultVisible: false,
        colorRole: 'sensoryReturn',
        allowedModes: ['overlay', 'diagnostic'],
        sourceStates: [
            'MediumProfileState.echo (EchoProfileState)',
            'MediumProfileState.delay (DelayProfileState)',
            'MediumProfileState.resistance (ResistanceProfileState)',
            'WorldMediumState.echoLevel',
            'WorldMediumState.feedbackDelay',
            'WorldMediumState.surfaceResistance',
        ],
    },

    localExcitability: {
        id: 'localExcitability',
        label: 'Local Excitability',
        description:
            'Per-region excitability profile: how easily each torus region can be activated. ' +
            'Green highlights = near-threshold; recovering regions are marked separately.',
        disclaimer:
            'This layer shows pre-neural field conditions — NOT neurons, neuron firing, ' +
            'or "where meaning is located." ' +
            'Region IDs are spatial coordinates, not semantic labels.',
        valueKind: 'derived',
        defaultVisible: false,
        colorRole: 'excitability',
        allowedModes: ['raw', 'smooth', 'overlay', 'diagnostic'],
        sourceStates: [
            'LocalExcitabilityCell.excitability (per region)',
            'LocalExcitabilityCell.thresholdProximity',
            'LocalExcitabilityCell.refractoryDepth',
            'LocalExcitabilityCell.recoveryProgress',
            'LocalExcitabilityFieldState.averageExcitability',
            'LocalExcitabilityFieldState.nearThresholdRegionCount',
        ],
    },

    repeatedFlowPath: {
        id: 'repeatedFlowPath',
        label: 'Repeated Flow Path',
        description:
            'Thin lines connecting region pairs that have repeatedly shown sequential activation. ' +
            'Opacity reflects candidate confidence; dashed = high replay affinity.',
        disclaimer:
            'These are pre-semantic flow path observations — NOT semantic relations, ' +
            'memory routes, concept links, or runtime graph edges. ' +
            'fromRegionId / toRegionId are spatial coordinates only.',
        valueKind: 'derived',
        defaultVisible: false,
        colorRole: 'repeatedFlow',
        allowedModes: ['overlay', 'diagnostic'],
        sourceStates: [
            'RepeatedFlowPathCandidate.recurrenceStrength',
            'RepeatedFlowPathCandidate.propagationConsistency',
            'RepeatedFlowPathCandidate.confidence',
            'RepeatedFlowPathCandidate.traceSupport',
            'RepeatedFlowPathCandidate.replayAffinity',
            'RepeatedFlowPathObservationState.candidates',
        ],
    },

    protoNetworkCandidate: {
        id: 'protoNetworkCandidate',
        label: 'Proto-Network Candidate',
        description:
            'Very faint overlay showing groups of regions and paths observed co-activating ' +
            'and co-recurring in network-like patterns. Low opacity; shown only at moderate confidence.',
        disclaimer:
            'This is a pre-semantic network-like observation — NOT a knowledge graph, ' +
            'semantic network, neural network, memory structure, or concept graph. ' +
            'No runtime edges or graph structures are created by this layer. ' +
            'This is an observer-side candidate classification only.',
        valueKind: 'proxy',
        defaultVisible: false,
        colorRole: 'protoNetwork',
        allowedModes: ['overlay', 'diagnostic'],
        sourceStates: [
            'ProtoNetworkCandidate.coActivationStrength',
            'ProtoNetworkCandidate.propagationStrength',
            'ProtoNetworkCandidate.recurrenceStrength',
            'ProtoNetworkCandidate.confidence',
            'ProtoNetworkObservationState.candidates',
            'ProtoNetworkObservationState.averageConfidence',
        ],
    },

    riskOverlay: {
        id: 'riskOverlay',
        label: 'Risk Overlay',
        description:
            'Thin red/amber warning overlay shown when saturation, extinction, ' +
            'over-coupling, or feedback saturation risk exceeds threshold. ' +
            'Normally invisible or very faint.',
        disclaimer:
            'This layer shows research-grade risk indicators derived from DynamicViabilityState. ' +
            'It does NOT predict collapse or system failure with certainty. ' +
            '"Risk" here is a proxy threshold observation, not a danger alarm.',
        valueKind: 'proxy',
        defaultVisible: true,
        colorRole: 'saturation',
        allowedModes: ['raw', 'smooth', 'overlay', 'diagnostic'],
        sourceStates: [
            'DynamicViabilityState.saturationRisk',
            'DynamicViabilityState.extinctionRisk',
            'DynamicViabilityState.overCouplingRisk',
            'DynamicViabilityState.underCouplingRisk',
            'BodyWorldClosureState.feedbackSaturationRisk',
        ],
    },
};

// ── Registry helpers ──────────────────────────────────────────────────────────

/** Return all layer definitions as an ordered array. */
export function getAllFieldLayerDefinitions(): FieldLayerDefinition[] {
    return Object.values(FIELD_LAYER_REGISTRY);
}

/** Return a single layer definition by id, or undefined. */
export function getFieldLayerDefinition(id: FieldLayerId): FieldLayerDefinition | undefined {
    return FIELD_LAYER_REGISTRY[id];
}

/** Return the default visibility map (id → boolean). */
export function getDefaultFieldLayerVisibility(): Record<FieldLayerId, boolean> {
    const result = {} as Record<FieldLayerId, boolean>;
    for (const def of Object.values(FIELD_LAYER_REGISTRY)) {
        result[def.id] = def.defaultVisible;
    }
    return result;
}

/**
 * Return layer definitions that are allowed in the given render mode.
 */
export function getFieldLayersForMode(
    mode: 'raw' | 'smooth' | 'overlay' | 'diagnostic'
): FieldLayerDefinition[] {
    return Object.values(FIELD_LAYER_REGISTRY).filter((def) =>
        def.allowedModes.includes(mode)
    );
}
