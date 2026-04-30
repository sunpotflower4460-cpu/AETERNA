/**
 * torusRenderState.ts
 * U3: Scientific Torus Renderer — type definitions
 *
 * Defines the render mode, normalization mode, performance mode,
 * and full render state for the torus scientific renderer.
 *
 * These types control ONLY the renderer / presentation layer.
 * They do NOT affect runtime dynamics, field calculation, energy,
 * trace, or return values.
 *
 * No fake energy / fake flow / fake trace types are defined here.
 * No semantic label / LLM binding / organism-awareness claim types are defined here.
 */

/**
 * Renderer display mode.
 *
 * - 'raw'        : Field values displayed as-is. Minimal smoothing. For scientific checking.
 * - 'smooth'     : Presentation-smoothed display (must be labeled [S] in UI).
 *                  Smoothing does not create activity that does not exist in the field.
 * - 'overlay'    : Multiple observation layers overlaid (Energy + Trace, Return + Closure, etc.).
 * - 'diagnostic' : Shows torus grid, coverage, inactive surface, NaN/Infinity warnings,
 *                  raw sample points, and min/max values.
 */
export type TorusRenderMode = 'raw' | 'smooth' | 'overlay' | 'diagnostic';

/**
 * Normalization mode for activity/value display scaling.
 *
 * - 'global' : Scale relative to the global max value across all regions.
 *              Recommended for comparing regions. May suppress subtle local changes.
 * - 'local'  : Scale relative to the currently visible max value.
 *              Reveals subtle local variation, but may make small values appear large.
 *              Labeled [local norm] in UI when active.
 */
export type TorusNormalizationMode = 'global' | 'local';

/**
 * Performance / display quality mode.
 *
 * - 'high'       : Higher mesh resolution, particles, glow. For powerful hardware.
 * - 'balanced'   : Standard quality. Default.
 * - 'battery'    : Reduced particle count, bloom, and resolution for low-power devices.
 * - 'diagnostic' : Prioritizes value accuracy over visual quality. Disables bloom/glow.
 *
 * Performance mode controls ONLY display quality.
 * It does NOT change simulation tick rate, field dynamics, or calculation values.
 */
export type TorusPerformanceMode = 'high' | 'balanced' | 'battery' | 'diagnostic';

/**
 * Full torus render state.
 * All fields here are presentation-layer controls only.
 */
export interface TorusRenderState {
    /** Current display mode */
    mode: TorusRenderMode;
    /** Value normalization strategy */
    normalization: TorusNormalizationMode;
    /** Display quality / performance tier */
    performance: TorusPerformanceMode;
    /** Show subtle torus grid lines (longitude / latitude) */
    showGrid: boolean;
    /** Show faint backside of torus (faces away from camera) */
    showBackside: boolean;
    /** Show faint inactive surface (regions with near-zero activity) */
    showInactiveSurface: boolean;
    /** Show coverage map overlay (active / inactive region statistics) */
    showCoverage: boolean;
    /** Enable presentation smoothing on field values (must be labeled [S] in UI) */
    smoothingEnabled: boolean;
    /** Show value legend / color mapping key */
    showLegend: boolean;
    /** Show diagnostic warning indicators (NaN, Infinity, clipping, overbright) */
    showDiagnosticWarnings: boolean;
}

/** Default render state. Balanced mode, raw display, global normalization. */
export const DEFAULT_TORUS_RENDER_STATE: TorusRenderState = {
    mode: 'raw',
    normalization: 'global',
    performance: 'balanced',
    showGrid: false,
    showBackside: true,
    showInactiveSurface: true,
    showCoverage: false,
    smoothingEnabled: false,
    showLegend: true,
    showDiagnosticWarnings: false,
};
