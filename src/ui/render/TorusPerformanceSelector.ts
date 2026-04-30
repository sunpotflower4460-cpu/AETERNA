/**
 * TorusPerformanceSelector.ts
 * U3: Scientific Torus Renderer — performance mode selector
 *
 * Controls the rendering quality budget.
 * Performance mode affects display quality only — it does NOT change
 * simulation tick rate, field dynamics, or observation values.
 *
 * Modes:
 *   high       — Full mesh resolution + particles + subtle bloom
 *   balanced   — Standard mesh + reduced bloom (default)
 *   battery    — Low particle count + no bloom + reduced resolution
 *   diagnostic — Minimal visual effects; value readability prioritised
 *
 * Each mode provides a RendererQualityConfig that describes the
 * intended mesh resolution, particle count, bloom strength, and
 * devicePixelRatio cap. Actual Three.js application is the
 * responsibility of the renderer that consumes this config.
 */

import type { TorusPerformanceMode } from '../../types/torusRenderState.js';

// ── Quality config ─────────────────────────────────────────────────────────

/** Renderer quality parameters. Applied to the Three.js scene only. */
export interface RendererQualityConfig {
    /** Torus mesh segments (radial × tubular). Higher = smoother geometry. */
    meshSegments: number;
    /** Maximum particle count for the field particle system. */
    maxParticleCount: number;
    /** Bloom strength (0 = off). Keep low so values remain readable. */
    bloomStrength: number;
    /** Bloom radius. */
    bloomRadius: number;
    /** Maximum devicePixelRatio (caps on high-DPI screens). */
    maxPixelRatio: number;
    /** Whether backside faint second-pass is rendered. */
    renderBacksidePass: boolean;
    /** Whether subtle grid lines are rendered. */
    renderGridLines: boolean;
    /** Inactive surface faint opacity. */
    inactiveSurfaceOpacity: number;
}

/** Quality configs for each performance mode. */
export const PERFORMANCE_QUALITY_CONFIGS: Record<TorusPerformanceMode, RendererQualityConfig> = {
    high: {
        meshSegments: 128,
        maxParticleCount: 8192,
        bloomStrength: 0.18,
        bloomRadius: 0.3,
        maxPixelRatio: 2.0,
        renderBacksidePass: true,
        renderGridLines: true,
        inactiveSurfaceOpacity: 0.08,
    },
    balanced: {
        meshSegments: 72,
        maxParticleCount: 5184,
        bloomStrength: 0.10,
        bloomRadius: 0.25,
        maxPixelRatio: 1.5,
        renderBacksidePass: true,
        renderGridLines: false,
        inactiveSurfaceOpacity: 0.07,
    },
    battery: {
        meshSegments: 48,
        maxParticleCount: 2048,
        bloomStrength: 0.0,
        bloomRadius: 0.0,
        maxPixelRatio: 1.0,
        renderBacksidePass: false,
        renderGridLines: false,
        inactiveSurfaceOpacity: 0.05,
    },
    diagnostic: {
        meshSegments: 64,
        maxParticleCount: 5184,
        bloomStrength: 0.0,
        bloomRadius: 0.0,
        maxPixelRatio: 1.5,
        renderBacksidePass: true,
        renderGridLines: true,
        inactiveSurfaceOpacity: 0.12,
    },
};

/** Human-readable labels for each performance mode. */
export const PERFORMANCE_MODE_LABELS: Record<TorusPerformanceMode, string> = {
    high:       'High Quality',
    balanced:   'Balanced',
    battery:    'Battery Saver',
    diagnostic: 'Diagnostic',
};

/** Short descriptions for tooltip / legend. */
export const PERFORMANCE_MODE_DESCRIPTIONS: Record<TorusPerformanceMode, string> = {
    high:
        'Full mesh resolution + particles + subtle bloom. ' +
        'Higher GPU load.',
    balanced:
        'Standard mesh and reduced bloom. Default setting.',
    battery:
        'Low particle count, no bloom, reduced resolution. ' +
        'Use on mobile or low-power devices.',
    diagnostic:
        'Minimal visual effects. Grid lines and backside faint pass enabled. ' +
        'Prioritises value readability over appearance.',
};

// ── DOM helpers ────────────────────────────────────────────────────────────

/**
 * Update the performance mode selector UI to reflect the current mode.
 *
 * @param containerSelector - CSS selector for the button container
 * @param activeMode        - Currently active performance mode
 */
export function syncPerformanceModeButtons(
    containerSelector: string,
    activeMode: TorusPerformanceMode
): void {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const buttons = container.querySelectorAll<HTMLElement>('[data-perf-mode]');
    buttons.forEach((btn) => {
        const btnMode = btn.dataset['perfMode'] as TorusPerformanceMode;
        btn.classList.toggle('perf-mode-active', btnMode === activeMode);
        btn.setAttribute('aria-pressed', btnMode === activeMode ? 'true' : 'false');
    });
}

/**
 * Build the HTML string for the performance mode selector.
 */
export function buildPerformanceSelectorHTML(): string {
    const modes: TorusPerformanceMode[] = ['high', 'balanced', 'battery', 'diagnostic'];
    const buttons = modes.map((m) => {
        const label = PERFORMANCE_MODE_LABELS[m];
        const active = m === 'balanced' ? ' perf-mode-active' : '';
        const pressed = m === 'balanced' ? 'true' : 'false';
        return `<button class="perf-mode-btn${active}" data-perf-mode="${m}" aria-pressed="${pressed}" title="${PERFORMANCE_MODE_DESCRIPTIONS[m]}" onclick="setPerformanceMode('${m}')">${label}</button>`;
    }).join('');
    return `<div id="perf-mode-selector" class="perf-mode-selector-group" aria-label="Performance Mode">${buttons}</div>`;
}

/**
 * Get the quality config for a given performance mode.
 * Use this config to apply rendering parameters to Three.js.
 */
export function getQualityConfig(mode: TorusPerformanceMode): RendererQualityConfig {
    return PERFORMANCE_QUALITY_CONFIGS[mode];
}
