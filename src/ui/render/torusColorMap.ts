/**
 * torusColorMap.ts
 * U3: Scientific Torus Renderer — fixed color mapping
 *
 * Colors map to observation values, not aesthetics or emotions.
 * The same color always means the same thing.
 *
 * Palette (fixed):
 *   Blue / Cyan  → flow / ongoing activity
 *   Green        → recovery / dynamic viability range
 *   White        → high coherent activity
 *   Purple       → trace / residue
 *   Orange       → sensory return / echo
 *   Red          → saturation / overload risk ONLY
 *   Dark         → low activity / low return
 *
 * Red is intentionally reserved for saturation/overload.
 * Normal operating state uses blue / cyan / green / white / purple.
 *
 * This file does NOT modify runtime dynamics, field values, or energy.
 * It only translates observation values to RGB for display purposes.
 */

/** An RGB color with components in the [0, 1] range. */
export interface RGBColor {
    r: number;
    g: number;
    b: number;
}

// ── Palette constants ──────────────────────────────────────────────────────

/** Blue/Cyan — flow / ongoing activity */
export const COLOR_FLOW_CYAN: RGBColor = { r: 0.13, g: 0.83, b: 0.93 };    // #22d3ee
/** Cyan variant — flow secondary */
export const COLOR_FLOW_BLUE: RGBColor = { r: 0.09, g: 0.56, b: 0.98 };    // #178ffb (approx)
/** Green — recovery / dynamic viability range */
export const COLOR_RECOVERY_GREEN: RGBColor = { r: 0.20, g: 0.83, b: 0.60 }; // #34d399
/** White — high coherent activity */
export const COLOR_COHERENT_WHITE: RGBColor = { r: 0.95, g: 0.97, b: 1.00 };
/** Purple — trace / residue */
export const COLOR_TRACE_PURPLE: RGBColor = { r: 0.65, g: 0.54, b: 0.98 };  // #a78bfa
/** Light purple — trace secondary */
export const COLOR_TRACE_PURPLE_LIGHT: RGBColor = { r: 0.75, g: 0.51, b: 0.99 }; // #c084fc
/** Orange — sensory return / echo */
export const COLOR_RETURN_ORANGE: RGBColor = { r: 0.98, g: 0.57, b: 0.24 }; // #fb923c
/** Red — saturation / overload risk ONLY */
export const COLOR_SATURATION_RED: RGBColor = { r: 0.94, g: 0.27, b: 0.27 }; // #ef4444
/** Dark — low activity / low return (inactive surface faint base) */
export const COLOR_INACTIVE_DARK: RGBColor = { r: 0.04, g: 0.05, b: 0.08 };
/** Faint grid line color */
export const COLOR_GRID_FAINT: RGBColor = { r: 0.20, g: 0.22, b: 0.30 };

// ── Color legend ───────────────────────────────────────────────────────────

/**
 * Human-readable legend entries for the current color scheme.
 * Used by TorusLayerLegend to render a consistent legend.
 */
export interface ColorLegendEntry {
    /** Hex color string for display. */
    hex: string;
    /** What observation value this color represents. */
    label: string;
    /** Whether the value is raw, derived, proxy, or presentation-smoothed. */
    valueType: 'raw' | 'derived' | 'proxy' | 'smoothed';
}

export const TORUS_COLOR_LEGEND: ColorLegendEntry[] = [
    { hex: '#22d3ee', label: 'Flow / Ongoing Activity',       valueType: 'derived'  },
    { hex: '#34d399', label: 'Recovery / Viability Range',    valueType: 'derived'  },
    { hex: '#f4f6ff', label: 'High Coherent Activity',        valueType: 'derived'  },
    { hex: '#a78bfa', label: 'Trace / Residue',               valueType: 'derived'  },
    { hex: '#fb923c', label: 'Sensory Return / Echo',         valueType: 'derived'  },
    { hex: '#ef4444', label: 'Saturation / Overload Risk',    valueType: 'derived'  },
    { hex: '#0a0d14', label: 'Low Activity / Inactive',       valueType: 'raw'      },
];

// ── Color mapping functions ────────────────────────────────────────────────

/** Linear interpolation between two RGB colors. */
function lerpColor(a: RGBColor, b: RGBColor, t: number): RGBColor {
    const ct = Math.max(0, Math.min(1, t));
    return {
        r: a.r + (b.r - a.r) * ct,
        g: a.g + (b.g - a.g) * ct,
        b: a.b + (b.b - a.b) * ct,
    };
}

/**
 * Map a normalised activity value (0–1) to the flow/activity color ramp.
 * 0 = inactive dark → 0.5 = cyan → 1.0 = white (high coherent).
 * Does NOT add energy where none exists.
 */
export function mapActivityToColor(normalizedValue: number): RGBColor {
    const v = Math.max(0, Math.min(1, normalizedValue));
    if (v < 0.5) {
        // dark → cyan
        return lerpColor(COLOR_INACTIVE_DARK, COLOR_FLOW_CYAN, v * 2);
    } else {
        // cyan → white
        return lerpColor(COLOR_FLOW_CYAN, COLOR_COHERENT_WHITE, (v - 0.5) * 2);
    }
}

/**
 * Map a normalised trace/residue value (0–1) to the trace color ramp.
 * 0 = dark → 1 = purple.
 */
export function mapTraceToColor(normalizedValue: number): RGBColor {
    const v = Math.max(0, Math.min(1, normalizedValue));
    return lerpColor(COLOR_INACTIVE_DARK, COLOR_TRACE_PURPLE, v);
}

/**
 * Map a normalised sensory-return / echo value (0–1) to the return color ramp.
 * 0 = dark → 1 = orange.
 */
export function mapReturnToColor(normalizedValue: number): RGBColor {
    const v = Math.max(0, Math.min(1, normalizedValue));
    return lerpColor(COLOR_INACTIVE_DARK, COLOR_RETURN_ORANGE, v);
}

/**
 * Map a normalised recovery/viability value (0–1).
 * 0 = dark → 1 = green.
 */
export function mapRecoveryToColor(normalizedValue: number): RGBColor {
    const v = Math.max(0, Math.min(1, normalizedValue));
    return lerpColor(COLOR_INACTIVE_DARK, COLOR_RECOVERY_GREEN, v);
}

/**
 * Map a normalised saturation risk value (0–1).
 * Should only be used for overload/saturation indicators.
 * 0 = dark → 1 = red.
 */
export function mapSaturationToColor(normalizedValue: number): RGBColor {
    const v = Math.max(0, Math.min(1, normalizedValue));
    return lerpColor(COLOR_INACTIVE_DARK, COLOR_SATURATION_RED, v);
}

/**
 * Compute inactive-surface faint color.
 * Used for torus surface areas with no current activity.
 * The surface remains faintly visible so the overall torus shape is clear.
 * Opacity should be kept low (e.g. 0.05–0.12) — the surface is NOT brightened.
 */
export function getInactiveSurfaceColor(): RGBColor {
    return COLOR_INACTIVE_DARK;
}

/**
 * Convert an RGBColor to a CSS hex string.
 */
export function rgbToHex(c: RGBColor): string {
    const r = Math.round(Math.max(0, Math.min(1, c.r)) * 255).toString(16).padStart(2, '0');
    const g = Math.round(Math.max(0, Math.min(1, c.g)) * 255).toString(16).padStart(2, '0');
    const b = Math.round(Math.max(0, Math.min(1, c.b)) * 255).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
}

// ── Documented color meanings (for legend / transparency) ─────────────────

/**
 * All color hex values and their fixed meanings.
 * These meanings do not change between render modes.
 */
export const TORUS_COLOR_MEANINGS: Record<string, string> = {
    '#22d3ee': 'Flow / Ongoing Activity (cyan)',
    '#34d399': 'Recovery / Dynamic Viability Range (green)',
    '#f4f6ff': 'High Coherent Activity (white)',
    '#a78bfa': 'Trace / Residue (purple)',
    '#c084fc': 'Trace Secondary / Replay Residue (light purple)',
    '#fb923c': 'Sensory Return / Echo (orange)',
    '#ef4444': 'Saturation / Overload Risk (red) — reserved for risk only',
    '#0a0d14': 'Low Activity / Inactive Surface (dark)',
};
