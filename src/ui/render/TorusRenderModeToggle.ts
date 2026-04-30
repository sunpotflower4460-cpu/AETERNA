/**
 * TorusRenderModeToggle.ts
 * U3: Scientific Torus Renderer — render mode toggle UI helper
 *
 * Provides functions to build and update the render mode toggle UI.
 * The toggle lets the user switch between:
 *   Raw / Scientific Smooth / Layer Overlay / Diagnostic
 *
 * Current mode is always displayed in the HUD so the user knows whether
 * they are looking at raw values or presentation-smoothed output.
 *
 * This module does NOT modify runtime dynamics, field values, or energy.
 * It is purely a display / observation-aid control.
 */

import type { TorusRenderMode, TorusNormalizationMode } from '../../types/torusRenderState.js';

// ── Mode labels ────────────────────────────────────────────────────────────

/** Human-readable labels for each render mode. */
export const RENDER_MODE_LABELS: Record<TorusRenderMode, string> = {
    raw:        'Raw',
    smooth:     'Smooth [S]',
    overlay:    'Layer Overlay',
    diagnostic: 'Diagnostic',
};

/** Short description of each mode shown in the HUD. */
export const RENDER_MODE_DESCRIPTIONS: Record<TorusRenderMode, string> = {
    raw:
        'Raw field values with minimal processing. ' +
        'Rougher appearance; suitable for scientific verification.',
    smooth:
        'Presentation-smoothed display [S]. ' +
        'Easier to observe; does not add activity that is not in raw values.',
    overlay:
        'Multiple observation layers composited. ' +
        'Layer visibility toggles control which values are shown.',
    diagnostic:
        'grid lines / inactive surface / coverage / NaN / clipping warnings. ' +
        'Use to separate display artefacts from genuine field state.',
};

/** Normalization mode labels. */
export const NORMALIZATION_LABELS: Record<TorusNormalizationMode, string> = {
    global: 'Global Norm',
    local:  'Local Norm [L]',
};

/** Normalization descriptions. */
export const NORMALIZATION_DESCRIPTIONS: Record<TorusNormalizationMode, string> = {
    global:
        'Color range uses global min/max. Suitable for whole-torus comparison.',
    local:
        'Color range uses currently visible min/max [L]. ' +
        'Fine detail is more visible, but values may appear exaggerated. ' +
        'This is a presentation aid — raw values are unchanged.',
};

// ── DOM helpers ────────────────────────────────────────────────────────────

/**
 * Update the render-mode HUD element to reflect the current mode.
 * Shows "[S]" when smoothing is active and "[L]" when local normalization is on.
 *
 * @param elementId   - DOM element id to update (e.g. 'render-mode-hud')
 * @param mode        - Current render mode
 * @param normalization - Current normalization mode
 */
export function syncRenderModeHUD(
    elementId: string,
    mode: TorusRenderMode,
    normalization: TorusNormalizationMode
): void {
    const el = document.getElementById(elementId);
    if (!el) return;

    const modeLabel = RENDER_MODE_LABELS[mode];
    const normLabel = normalization === 'local' ? ' · Local Norm [L]' : '';
    el.textContent = `Render: ${modeLabel}${normLabel}`;
}

/**
 * Update active state on render mode toggle buttons.
 * Expects buttons with data attributes: data-render-mode="raw|smooth|overlay|diagnostic"
 *
 * @param containerSelector - CSS selector for the button container
 * @param activeMode        - Currently active mode
 */
export function syncRenderModeButtons(
    containerSelector: string,
    activeMode: TorusRenderMode
): void {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const buttons = container.querySelectorAll<HTMLElement>('[data-render-mode]');
    buttons.forEach((btn) => {
        const btnMode = btn.dataset['renderMode'] as TorusRenderMode;
        btn.classList.toggle('render-mode-active', btnMode === activeMode);
        btn.setAttribute('aria-pressed', btnMode === activeMode ? 'true' : 'false');
    });
}

/**
 * Update active state on normalization toggle buttons.
 * Expects buttons with data attributes: data-norm-mode="global|local"
 *
 * @param containerSelector - CSS selector for the button container
 * @param activeNorm        - Currently active normalization mode
 */
export function syncNormModeButtons(
    containerSelector: string,
    activeNorm: TorusNormalizationMode
): void {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const buttons = container.querySelectorAll<HTMLElement>('[data-norm-mode]');
    buttons.forEach((btn) => {
        const btnNorm = btn.dataset['normMode'] as TorusNormalizationMode;
        btn.classList.toggle('norm-mode-active', btnNorm === activeNorm);
        btn.setAttribute('aria-pressed', btnNorm === activeNorm ? 'true' : 'false');
    });
}

/**
 * Build the HTML string for the render mode toggle group.
 * Can be inserted into index.html or injected dynamically.
 */
export function buildRenderModeToggleHTML(): string {
    const modes: TorusRenderMode[] = ['raw', 'smooth', 'overlay', 'diagnostic'];
    const buttons = modes.map((m) => {
        const label = RENDER_MODE_LABELS[m];
        const active = m === 'smooth' ? ' render-mode-active' : '';
        const pressed = m === 'smooth' ? 'true' : 'false';
        return `<button class="render-mode-btn${active}" data-render-mode="${m}" aria-pressed="${pressed}" title="${RENDER_MODE_DESCRIPTIONS[m]}" onclick="setRenderMode('${m}')">${label}</button>`;
    }).join('');
    return `<div id="render-mode-toggle" class="render-mode-toggle-group" aria-label="Render Mode">${buttons}</div>`;
}

/**
 * Build the HTML string for the normalization toggle group.
 */
export function buildNormModeToggleHTML(): string {
    const modes: TorusNormalizationMode[] = ['global', 'local'];
    const buttons = modes.map((m) => {
        const label = NORMALIZATION_LABELS[m];
        const active = m === 'global' ? ' norm-mode-active' : '';
        const pressed = m === 'global' ? 'true' : 'false';
        return `<button class="norm-mode-btn${active}" data-norm-mode="${m}" aria-pressed="${pressed}" title="${NORMALIZATION_DESCRIPTIONS[m]}" onclick="setNormMode('${m}')">${label}</button>`;
    }).join('');
    return `<div id="norm-mode-toggle" class="norm-mode-toggle-group" aria-label="Normalization">${buttons}</div>`;
}
