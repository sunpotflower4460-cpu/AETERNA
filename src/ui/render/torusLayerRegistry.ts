/**
 * torusLayerRegistry.ts
 * U3: Scientific Torus Renderer — observation layer registry
 *
 * Defines the set of observation layers that can be rendered on the torus.
 * Each layer maps to a real field value; no fake visual layers are included.
 *
 * This registry is the foundation for U4: Field Layer Visualization.
 * In U3, we define the structure and defaults — full rendering is U4.
 *
 * Layers:
 *   energy_activity       — Energy / Activity field
 *   trace_residue         — Trace / Residue map
 *   actuation_pulse       — Actuation Pulse output
 *   sensory_return        — Sensory Return / Echo
 *   closure_match         — Closure Match proxy
 *   local_excitability    — Local Excitability field
 *   repeated_flow_path    — Repeated Flow Path candidates
 *   proto_network         — Proto-Network Candidate overlay
 *
 * Runtime dynamics, field calculations, and energy values are NOT changed here.
 */

import {
    COLOR_FLOW_CYAN,
    COLOR_TRACE_PURPLE,
    COLOR_RETURN_ORANGE,
    COLOR_RECOVERY_GREEN,
    COLOR_COHERENT_WHITE,
    COLOR_TRACE_PURPLE_LIGHT,
    rgbToHex,
    type RGBColor,
} from './torusColorMap.js';

/** Layer identifier type. */
export type TorusLayerId =
    | 'energy_activity'
    | 'trace_residue'
    | 'actuation_pulse'
    | 'sensory_return'
    | 'closure_match'
    | 'local_excitability'
    | 'repeated_flow_path'
    | 'proto_network';

/** Value classification for transparency in the legend. */
export type LayerValueType = 'raw' | 'derived' | 'proxy' | 'smoothed';

/** A single entry in the layer registry. */
export interface TorusLayerEntry {
    /** Unique layer identifier. */
    id: TorusLayerId;
    /** Human-readable label for the legend. */
    label: string;
    /** Short description of what this layer shows. */
    description: string;
    /** Primary color (RGBColor) for this layer. */
    color: RGBColor;
    /** Hex representation of the primary color (for CSS use). */
    colorHex: string;
    /** Classification of the value type. */
    valueType: LayerValueType;
    /** Whether this layer is visible by default. */
    defaultVisible: boolean;
    /**
     * Whether this layer is available in U3.
     * Layers marked false are registered for U4 but not yet rendered.
     */
    availableInU3: boolean;
}

/** Full layer registry. */
export const TORUS_LAYER_REGISTRY: Record<TorusLayerId, TorusLayerEntry> = {
    energy_activity: {
        id: 'energy_activity',
        label: 'Energy / Activity',
        description: 'Ongoing field activity layer. Blue/cyan = active flow.',
        color: COLOR_FLOW_CYAN,
        colorHex: rgbToHex(COLOR_FLOW_CYAN),
        valueType: 'derived',
        defaultVisible: true,
        availableInU3: true,
    },
    trace_residue: {
        id: 'trace_residue',
        label: 'Trace / Residue',
        description: 'Spike trace residue remaining after activity. Purple = trace.',
        color: COLOR_TRACE_PURPLE,
        colorHex: rgbToHex(COLOR_TRACE_PURPLE),
        valueType: 'derived',
        defaultVisible: false,
        availableInU3: true,
    },
    actuation_pulse: {
        id: 'actuation_pulse',
        label: 'Actuation Pulse',
        description: 'Outward actuation pulse from organism to world.',
        color: COLOR_COHERENT_WHITE,
        colorHex: rgbToHex(COLOR_COHERENT_WHITE),
        valueType: 'derived',
        defaultVisible: false,
        availableInU3: true,
    },
    sensory_return: {
        id: 'sensory_return',
        label: 'Sensory Return / Echo',
        description: 'Return signal / echo arriving back from world medium. Orange = return.',
        color: COLOR_RETURN_ORANGE,
        colorHex: rgbToHex(COLOR_RETURN_ORANGE),
        valueType: 'derived',
        defaultVisible: false,
        availableInU3: true,
    },
    closure_match: {
        id: 'closure_match',
        label: 'Closure Match',
        description: 'Body-world closure match proxy. Green = recovery/viability range.',
        color: COLOR_RECOVERY_GREEN,
        colorHex: rgbToHex(COLOR_RECOVERY_GREEN),
        valueType: 'proxy',
        defaultVisible: false,
        availableInU3: true,
    },
    local_excitability: {
        id: 'local_excitability',
        label: 'Local Excitability',
        description: 'Region-level excitability field (pre-neural, pre-semantic).',
        color: COLOR_RECOVERY_GREEN,
        colorHex: rgbToHex(COLOR_RECOVERY_GREEN),
        valueType: 'derived',
        defaultVisible: false,
        availableInU3: false, // Full rendering deferred to U4
    },
    repeated_flow_path: {
        id: 'repeated_flow_path',
        label: 'Repeated Flow Path',
        description: 'Candidate paths formed by repeated sequential activation.',
        color: COLOR_TRACE_PURPLE_LIGHT,
        colorHex: rgbToHex(COLOR_TRACE_PURPLE_LIGHT),
        valueType: 'proxy',
        defaultVisible: false,
        availableInU3: false, // Full rendering deferred to U4
    },
    proto_network: {
        id: 'proto_network',
        label: 'Proto-Network Candidate',
        description: 'Pre-semantic network-like structure candidates (observer-side only).',
        color: COLOR_COHERENT_WHITE,
        colorHex: rgbToHex(COLOR_COHERENT_WHITE),
        valueType: 'proxy',
        defaultVisible: false,
        availableInU3: false, // Full rendering deferred to U4
    },
};

/** Ordered list of layer IDs (for display). */
export const TORUS_LAYER_ORDER: TorusLayerId[] = [
    'energy_activity',
    'trace_residue',
    'actuation_pulse',
    'sensory_return',
    'closure_match',
    'local_excitability',
    'repeated_flow_path',
    'proto_network',
];

/** Runtime visibility flags. Starts from defaultVisible values. */
const _layerVisible: Record<TorusLayerId, boolean> = {} as Record<TorusLayerId, boolean>;
for (const id of TORUS_LAYER_ORDER) {
    _layerVisible[id] = TORUS_LAYER_REGISTRY[id].defaultVisible;
}

/** Get current visibility of a layer. */
export function isLayerVisible(id: TorusLayerId): boolean {
    return _layerVisible[id] ?? false;
}

/** Set visibility of a layer. */
export function setLayerVisible(id: TorusLayerId, visible: boolean): void {
    _layerVisible[id] = visible;
}

/** Toggle visibility of a layer. Returns new visibility state. */
export function toggleLayerVisible(id: TorusLayerId): boolean {
    _layerVisible[id] = !_layerVisible[id];
    return _layerVisible[id];
}

/** Return all layer entries that are currently visible. */
export function getVisibleLayers(): TorusLayerEntry[] {
    return TORUS_LAYER_ORDER
        .filter((id) => _layerVisible[id])
        .map((id) => TORUS_LAYER_REGISTRY[id]);
}

/** Return all layer entries available in U3. */
export function getU3Layers(): TorusLayerEntry[] {
    return TORUS_LAYER_ORDER
        .map((id) => TORUS_LAYER_REGISTRY[id])
        .filter((entry) => entry.availableInU3);
}
