/**
 * torusRenderState.ts
 * U3: Scientific Torus Renderer — render state types
 *
 * These types define the renderer's display configuration.
 * They control how field values are translated into visual output.
 * They do NOT change runtime dynamics, field calculations, or energy/trace/return values.
 *
 * Renderer modes:
 *   raw        — Field values displayed with minimal processing. Debug/scientific check.
 *   smooth     — Presentation-smoothed display. Clearly labeled [S]. Does not create activity.
 *   overlay    — Multiple observation layers composited (Energy+Trace, Return+Closure, etc.)
 *   diagnostic — Grid / inactive surface / coverage / NaN / clipping warnings visible.
 */

/** Controls how field values are translated to visual output. */
export type TorusRenderMode =
    | 'raw'
    | 'smooth'
    | 'overlay'
    | 'diagnostic';

/**
 * Normalization range for color mapping.
 *   global — uses full dataset min/max. Good for whole-torus comparison.
 *   local  — uses currently visible min/max. Good for fine detail, but may exaggerate scale.
 *            When local is active, mode display must note "local normalization (presentation aid)".
 */
export type TorusNormalizationMode =
    | 'global'
    | 'local';

/**
 * Renderer performance budget.
 *   high       — Full mesh resolution + particles + subtle bloom.
 *   balanced   — Default. Standard mesh + reduced bloom.
 *   battery    — Low particle count + no bloom + reduced resolution.
 *   diagnostic — Minimal visual effects; value readability prioritised.
 *
 * Performance mode affects display quality only.
 * It does NOT change simulation tick rate or field dynamics.
 */
export type TorusPerformanceMode =
    | 'high'
    | 'balanced'
    | 'battery'
    | 'diagnostic';

/** Full renderer display state. */
export interface TorusRenderState {
    /** Current rendering mode. */
    mode: TorusRenderMode;
    /** Value normalization range. */
    normalization: TorusNormalizationMode;
    /** Renderer performance budget (display quality only). */
    performance: TorusPerformanceMode;
    /** Show subtle grid lines on the torus surface. */
    showGrid: boolean;
    /** Show faint backside of the torus (camera-occluded faces). */
    showBackside: boolean;
    /**
     * Keep inactive surface faintly visible so the full torus shape is
     * always discernible. Inactive regions are shown at low opacity;
     * they are NOT brightened or given fake energy.
     */
    showInactiveSurface: boolean;
    /** Show coverage map / coverage metrics overlay. */
    showCoverage: boolean;
    /**
     * Enable presentation smoothing on field values before color mapping.
     * When true, mode display must include "[S]" / "smoothed" label.
     * Smoothing does not create activity that does not exist in raw values.
     */
    smoothingEnabled: boolean;
}

/** Default render state. */
export const DEFAULT_TORUS_RENDER_STATE: TorusRenderState = {
    mode: 'smooth',
    normalization: 'global',
    performance: 'balanced',
    showGrid: false,
    showBackside: true,
    showInactiveSurface: true,
    showCoverage: false,
    smoothingEnabled: true,
};

/**
 * Coverage metrics snapshot.
 * Used to distinguish "actual partial activity" from "display artefact".
 */
export interface TorusCoverageMetrics {
    /** Number of torus regions with activity above threshold. */
    activeRegionCount: number;
    /** Number of torus regions with activity below threshold. */
    inactiveRegionCount: number;
    /** Fraction of total torus regions that are active (0–1). */
    activeCoverageRatio: number;
    /**
     * How concentrated the activity is.
     * 1.0 = perfectly uniform. 0 = all activity in a single region.
     */
    activeRegionConcentration: number;
    /** Index of the region with the highest current activity. */
    maxActivityRegion: number;
    /**
     * Fraction of torus surface currently visible from the camera.
     * Compare with activeCoverageRatio to separate display occlusion
     * from genuine field sparsity.
     */
    visibleCoverageRatio: number;
}

/**
 * Diagnostic warning flags.
 * Used in Diagnostic mode to surface renderer reliability issues.
 */
export interface TorusDiagnosticWarnings {
    /** Number of NaN values detected in the current field snapshot. */
    nanCount: number;
    /** Number of Infinity values detected. */
    infinityCount: number;
    /** Number of values clamped due to exceeding display range. */
    clippedCount: number;
    /** Number of regions rendered above the overbright threshold. */
    overbrightCount: number;
    /** True when significant backside area is hidden (not in faint pass). */
    hiddenBacksideWarning: boolean;
    /** True when activeCoverageRatio is below a low-coverage threshold. */
    coverageWarning: boolean;
}
