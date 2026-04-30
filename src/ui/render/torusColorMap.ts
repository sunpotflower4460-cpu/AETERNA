/**
 * torusColorMap.ts
 * U3: Scientific Torus Renderer — fixed color mapping
 *
 * Defines the canonical mapping from observation value types to display colors.
 * Color assignments are fixed and reflect observable field quantities,
 * not aesthetics or semantic meaning.
 *
 * Principles (from docs/visualization-integrity-principles.md §2.3):
 * - Blue / Cyan  → flow / ongoing activity
 * - Green        → recovery / dynamic viability range
 * - White        → high coherent activity
 * - Purple       → trace / residue
 * - Orange       → sensory return / echo
 * - Red          → saturation / overload risk ONLY
 * - Dark         → low activity / low return
 *
 * Red must NOT be used for normal activity states.
 * Colors reflect observation values, not subjective states.
 */

export interface TorusColorEntry {
    /** CSS hex color string */
    hex: string;
    /** RGB components 0-1 */
    r: number;
    g: number;
    b: number;
    /** Observable quantity this color represents */
    observationLabel: string;
    /** Value type (raw / derived / proxy / smoothed) */
    valueType: 'raw' | 'derived' | 'proxy' | 'smoothed';
    /** Human-readable description */
    description: string;
}

/** Canonical color assignments for U3 Scientific Torus Renderer. */
export const TORUS_COLOR_MAP: Record<string, TorusColorEntry> = {
    flow: {
        hex: '#22d3ee',
        r: 0.133, g: 0.827, b: 0.933,
        observationLabel: 'Flow / Ongoing Activity',
        valueType: 'derived',
        description: 'Ongoing flow and activity. Blue / Cyan.',
    },
    activity: {
        hex: '#38bdf8',
        r: 0.220, g: 0.741, b: 0.973,
        observationLabel: 'Activity (derived)',
        valueType: 'derived',
        description: 'Local activity magnitude. Blue.',
    },
    recovery: {
        hex: '#34d399',
        r: 0.204, g: 0.827, b: 0.600,
        observationLabel: 'Recovery / Viability Range',
        valueType: 'derived',
        description: 'Recovery progress and dynamic viability range. Green.',
    },
    coherentActivity: {
        hex: '#f0f9ff',
        r: 0.941, g: 0.976, b: 1.000,
        observationLabel: 'High Coherent Activity',
        valueType: 'derived',
        description: 'High and coherent field activity. White / near-white.',
    },
    trace: {
        hex: '#a78bfa',
        r: 0.655, g: 0.545, b: 0.980,
        observationLabel: 'Trace / Residue',
        valueType: 'derived',
        description: 'Spike trace residue remaining in the field. Purple.',
    },
    sensoryReturn: {
        hex: '#fb923c',
        r: 0.984, g: 0.573, b: 0.235,
        observationLabel: 'Sensory Return / Echo',
        valueType: 'raw',
        description: 'Incoming sensory return signal and echo influence. Orange.',
    },
    closure: {
        hex: '#c084fc',
        r: 0.753, g: 0.518, b: 0.988,
        observationLabel: 'Closure Match (proxy)',
        valueType: 'proxy',
        description: 'Actuation-return closure match strength. Light purple.',
    },
    excitability: {
        hex: '#4ade80',
        r: 0.290, g: 0.871, b: 0.502,
        observationLabel: 'Local Excitability',
        valueType: 'derived',
        description: 'Local excitability / propagation tendency of field region. Green.',
    },
    repeatedFlow: {
        hex: '#67e8f9',
        r: 0.404, g: 0.910, b: 0.976,
        observationLabel: 'Repeated Flow Path',
        valueType: 'derived',
        description: 'Region participating in a repeated flow path candidate. Cyan.',
    },
    protoNetwork: {
        hex: '#818cf8',
        r: 0.506, g: 0.549, b: 0.973,
        observationLabel: 'Proto-Network Candidate',
        valueType: 'proxy',
        description: 'Region associated with a proto-network candidate. Indigo-purple.',
    },
    saturation: {
        hex: '#ef4444',
        r: 0.937, g: 0.267, b: 0.267,
        observationLabel: 'Saturation / Overload Risk',
        valueType: 'raw',
        description: 'Saturation or overload risk indicator. Red — used ONLY for risk states.',
    },
    inactiveSurface: {
        hex: '#1e293b',
        r: 0.118, g: 0.161, b: 0.231,
        observationLabel: 'Inactive Surface (faint)',
        valueType: 'raw',
        description: 'Very low activity surface shown faintly to preserve torus shape. Dark.',
    },
    backsideFaint: {
        hex: '#0f172a',
        r: 0.059, g: 0.090, b: 0.165,
        observationLabel: 'Backside (faint)',
        valueType: 'raw',
        description: 'Torus surface facing away from camera shown at low opacity. Very dark.',
    },
    grid: {
        hex: '#334155',
        r: 0.200, g: 0.255, b: 0.333,
        observationLabel: 'Torus Grid',
        valueType: 'raw',
        description: 'Subtle torus grid lines for shape reference. Dark slate.',
    },
};

export type TorusColorKey = keyof typeof TORUS_COLOR_MAP;

/**
 * Get the color entry for a given observation key.
 * Returns the inactive surface color if the key is unknown.
 */
export function getTorusColor(key: TorusColorKey | string): TorusColorEntry {
    return (TORUS_COLOR_MAP as Record<string, TorusColorEntry>)[key]
        ?? TORUS_COLOR_MAP.inactiveSurface;
}

/**
 * Interpolate between two color entries by factor t (0 = c1, 1 = c2).
 * Used for value-to-color mapping within a range.
 */
export function lerpTorusColor(
    c1: TorusColorEntry,
    c2: TorusColorEntry,
    t: number
): { r: number; g: number; b: number } {
    const s = Math.max(0, Math.min(1, t));
    return {
        r: c1.r + (c2.r - c1.r) * s,
        g: c1.g + (c2.g - c1.g) * s,
        b: c1.b + (c2.b - c1.b) * s,
    };
}

/**
 * Map a normalized value (0–1) to a color along the scientific palette:
 * dark → activity (blue/cyan) → coherent (white) → saturation (red)
 *
 * The red (saturation) end is only reached at very high values (> 0.9).
 * Normal operation stays in the dark→blue→white range.
 */
export function mapActivityToColor(normalizedValue: number): { r: number; g: number; b: number } {
    const v = Math.max(0, Math.min(1, normalizedValue));
    if (v < 0.15) {
        // Dark (inactive) → activity blue
        return lerpTorusColor(TORUS_COLOR_MAP.inactiveSurface, TORUS_COLOR_MAP.activity, v / 0.15);
    } else if (v < 0.6) {
        // Activity blue → flow cyan
        return lerpTorusColor(TORUS_COLOR_MAP.activity, TORUS_COLOR_MAP.flow, (v - 0.15) / 0.45);
    } else if (v < 0.9) {
        // Flow cyan → coherent white
        return lerpTorusColor(TORUS_COLOR_MAP.flow, TORUS_COLOR_MAP.coherentActivity, (v - 0.6) / 0.3);
    } else {
        // Coherent white → saturation red (overload zone only)
        return lerpTorusColor(TORUS_COLOR_MAP.coherentActivity, TORUS_COLOR_MAP.saturation, (v - 0.9) / 0.1);
    }
}

/** Color legend entries for display in the UI. */
export const TORUS_COLOR_LEGEND: Array<{ key: string; label: string; hex: string; valueType: string }> = [
    { key: 'flow',           label: 'Flow / Activity',          hex: TORUS_COLOR_MAP.flow.hex,           valueType: 'Derived' },
    { key: 'recovery',       label: 'Recovery / Viability',     hex: TORUS_COLOR_MAP.recovery.hex,       valueType: 'Derived' },
    { key: 'coherentActivity', label: 'High Coherent Activity', hex: TORUS_COLOR_MAP.coherentActivity.hex, valueType: 'Derived' },
    { key: 'trace',          label: 'Trace Residue',            hex: TORUS_COLOR_MAP.trace.hex,          valueType: 'Derived' },
    { key: 'sensoryReturn',  label: 'Sensory Return / Echo',    hex: TORUS_COLOR_MAP.sensoryReturn.hex,  valueType: 'Raw' },
    { key: 'closure',        label: 'Closure Match',            hex: TORUS_COLOR_MAP.closure.hex,        valueType: 'Proxy' },
    { key: 'excitability',   label: 'Local Excitability',       hex: TORUS_COLOR_MAP.excitability.hex,   valueType: 'Derived' },
    { key: 'repeatedFlow',   label: 'Repeated Flow Path',       hex: TORUS_COLOR_MAP.repeatedFlow.hex,   valueType: 'Derived' },
    { key: 'protoNetwork',   label: 'Proto-Network Candidate',  hex: TORUS_COLOR_MAP.protoNetwork.hex,   valueType: 'Proxy' },
    { key: 'saturation',     label: 'Saturation / Overload Risk', hex: TORUS_COLOR_MAP.saturation.hex,  valueType: 'Raw' },
];
