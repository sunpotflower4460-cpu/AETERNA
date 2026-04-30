/**
 * torusLayerRegistry.ts
 * U3: Scientific Torus Renderer — layer registry
 *
 * Defines the available observation layers for the torus renderer.
 * Each layer maps one observable quantity to a visual channel (color/opacity/line).
 *
 * Layers can be toggled on/off individually.
 * They are NOT mixed to produce composite values — overlaying is purely visual.
 *
 * For full layer visualization, see U4: Field Layer Visualization.
 * U3 establishes the registry; U4 completes per-layer rendering.
 *
 * No fake visual / fake energy / fake flow layers are defined here.
 * No semantic / non-observable claim layers are defined here.
 */

import { TORUS_COLOR_MAP } from './torusColorMap.js';

/**
 * Describes what kind of value a layer displays.
 * - 'raw'     : Value directly from field buffers
 * - 'derived' : Calculated from raw values (e.g. activity, trace)
 * - 'proxy'   : Indirect / approximated value (e.g. closure match, proto-network)
 * - 'smoothed': Presentation-smoothed version of a raw/derived value
 */
export type LayerValueType = 'raw' | 'derived' | 'proxy' | 'smoothed';

/** A single observation layer definition. */
export interface TorusLayer {
    /** Internal unique key */
    id: string;
    /** Human-readable display name */
    label: string;
    /** Short description of what this layer represents */
    description: string;
    /** Whether this layer is currently visible */
    visible: boolean;
    /** Primary color (hex) for this layer */
    colorHex: string;
    /** What type of value this layer uses */
    valueType: LayerValueType;
    /**
     * Whether this layer is available in the current build.
     * Layers that depend on future U4 full implementation are
     * marked available: false and shown as [planned].
     */
    available: boolean;
}

/** Mutable registry of all observation layers. */
const _layers: Record<string, TorusLayer> = {
    energy: {
        id: 'energy',
        label: 'Energy / Activity',
        description: 'Overall energy and activity level across the torus field.',
        visible: true,
        colorHex: TORUS_COLOR_MAP.flow.hex,
        valueType: 'derived',
        available: true,
    },
    trace: {
        id: 'trace',
        label: 'Trace / Residue',
        description: 'Spike trace residue accumulated in the field over time.',
        visible: false,
        colorHex: TORUS_COLOR_MAP.trace.hex,
        valueType: 'derived',
        available: true,
    },
    actuationPulse: {
        id: 'actuationPulse',
        label: 'Actuation Pulse',
        description: 'Outward actuation pulse emitted by the organism.',
        visible: false,
        colorHex: TORUS_COLOR_MAP.activity.hex,
        valueType: 'raw',
        available: true,
    },
    sensoryReturn: {
        id: 'sensoryReturn',
        label: 'Sensory Return',
        description: 'Incoming sensory return signal from the world medium.',
        visible: false,
        colorHex: TORUS_COLOR_MAP.sensoryReturn.hex,
        valueType: 'raw',
        available: true,
    },
    closureMatch: {
        id: 'closureMatch',
        label: 'Closure Match',
        description: 'Strength of actuation–return closure loop match (proxy value).',
        visible: false,
        colorHex: TORUS_COLOR_MAP.closure.hex,
        valueType: 'proxy',
        available: true,
    },
    localExcitability: {
        id: 'localExcitability',
        label: 'Local Excitability',
        description: 'Local excitability field: how easily each region can be activated.',
        visible: false,
        colorHex: TORUS_COLOR_MAP.excitability.hex,
        valueType: 'derived',
        available: true,
    },
    repeatedFlow: {
        id: 'repeatedFlow',
        label: 'Repeated Flow Path',
        description: 'Regions participating in a repeated flow path candidate.',
        visible: false,
        colorHex: TORUS_COLOR_MAP.repeatedFlow.hex,
        valueType: 'derived',
        available: true,
    },
    protoNetwork: {
        id: 'protoNetwork',
        label: 'Proto-Network Candidate',
        description: 'Regions associated with a proto-network candidate structure (proxy).',
        visible: false,
        colorHex: TORUS_COLOR_MAP.protoNetwork.hex,
        valueType: 'proxy',
        available: true,
    },
};

/** Return a copy of all registered layers. */
export function getAllLayers(): TorusLayer[] {
    return Object.values(_layers).map((l) => ({ ...l }));
}

/** Return a copy of a single layer by id, or undefined if not found. */
export function getLayer(id: string): TorusLayer | undefined {
    return _layers[id] ? { ..._layers[id] } : undefined;
}

/** Return all layers that are currently visible. */
export function getVisibleLayers(): TorusLayer[] {
    return Object.values(_layers)
        .filter((l) => l.visible && l.available)
        .map((l) => ({ ...l }));
}

/** Set the visibility of a layer by id. Returns false if the layer is not found. */
export function setLayerVisible(id: string, visible: boolean): boolean {
    if (!_layers[id]) return false;
    _layers[id].visible = visible;
    return true;
}

/** Toggle layer visibility. Returns the new visibility state, or undefined if not found. */
export function toggleLayer(id: string): boolean | undefined {
    if (!_layers[id]) return undefined;
    _layers[id].visible = !_layers[id].visible;
    return _layers[id].visible;
}

/** Reset all layers to their default visibility state (only 'energy' visible). */
export function resetLayerVisibility(): void {
    for (const id of Object.keys(_layers)) {
        _layers[id].visible = id === 'energy';
    }
}
