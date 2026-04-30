/**
 * torusRenderModeManager.ts
 * U3: Scientific Torus Renderer — render mode state + DOM sync
 *
 * Manages the TorusRenderState and provides DOM synchronization helpers
 * for the mode toggle, normalization selector, performance selector,
 * and diagnostic panel.
 *
 * This module is the vanilla-JS equivalent of the React components
 * described in the U3 spec. It follows the same pattern as
 * useTorusCameraControls.ts (U2).
 *
 * No runtime dynamics are modified here.
 * All state changes are presentation-layer only.
 */

import type { TorusRenderMode, TorusNormalizationMode, TorusPerformanceMode, TorusRenderState } from '../../types/torusRenderState.js';
import { DEFAULT_TORUS_RENDER_STATE } from '../../types/torusRenderState.js';

// ── Internal State ──────────────────────────────────────────────────────────

const _state: TorusRenderState = { ...DEFAULT_TORUS_RENDER_STATE };

/** Return a read-only snapshot of the current render state. */
export function getTorusRenderState(): Readonly<TorusRenderState> {
    return { ..._state };
}

// ── Mode Setters ─────────────────────────────────────────────────────────────

/** Set the renderer display mode and sync the UI. */
export function setRenderMode(mode: TorusRenderMode): void {
    _state.mode = mode;
    // Diagnostic mode always shows diagnostic warnings and inactive surface
    if (mode === 'diagnostic') {
        _state.showDiagnosticWarnings = true;
        _state.showInactiveSurface = true;
        _state.showGrid = true;
        _state.showBackside = true;
    }
    // Smooth mode enables smoothing
    _state.smoothingEnabled = mode === 'smooth';
    syncRenderModeUI();
}

/** Set the normalization mode and sync the UI. */
export function setNormalizationMode(mode: TorusNormalizationMode): void {
    _state.normalization = mode;
    syncNormalizationUI();
}

/** Set the performance mode and sync the UI. */
export function setPerformanceMode(mode: TorusPerformanceMode): void {
    _state.performance = mode;
    syncPerformanceModeUI();
}

/** Toggle a boolean render state flag and return the new value. */
export function toggleRenderFlag(flag: keyof Pick<TorusRenderState,
    'showGrid' | 'showBackside' | 'showInactiveSurface' | 'showCoverage' |
    'smoothingEnabled' | 'showLegend' | 'showDiagnosticWarnings'>
): boolean {
    (_state as Record<string, unknown>)[flag] = !(_state as Record<string, unknown>)[flag];
    syncRenderModeUI();
    return (_state as Record<string, unknown>)[flag] as boolean;
}

// ── DOM Sync ─────────────────────────────────────────────────────────────────

/** Return a DOM element safely (returns null in non-browser environments). */
function getEl(id: string): HTMLElement | null {
    if (typeof document === 'undefined') return null;
    return document.getElementById(id);
}

/**
 * Sync all render mode buttons in the DOM.
 * Expects elements with id="render-mode-{mode}" and class "render-mode-active".
 */
export function syncRenderModeUI(): void {
    const modes: TorusRenderMode[] = ['raw', 'smooth', 'overlay', 'diagnostic'];
    for (const mode of modes) {
        const btn = getEl(`render-mode-${mode}`);
        if (btn) btn.classList.toggle('render-mode-active', _state.mode === mode);
    }

    // Show [S] label when smoothing is active
    const smoothLabel = getEl('render-smooth-label');
    if (smoothLabel) {
        smoothLabel.style.display = _state.smoothingEnabled ? 'inline' : 'none';
    }

    // Show [local norm] label when local normalization is active
    const normLabel = getEl('render-norm-label');
    if (normLabel) {
        normLabel.textContent = _state.normalization === 'local' ? '[local norm]' : '';
    }

    // Show mode indicator text
    const modeIndicator = getEl('render-mode-indicator');
    if (modeIndicator) {
        const modeLabel = renderModeLabel(_state.mode);
        const smoothSuffix = _state.smoothingEnabled ? ' [S]' : '';
        const normSuffix = _state.normalization === 'local' ? ' [local norm]' : '';
        modeIndicator.textContent = `${modeLabel}${smoothSuffix}${normSuffix}`;
    }
}

/** Sync normalization toggle buttons in the DOM. */
export function syncNormalizationUI(): void {
    const globalBtn = getEl('render-norm-global');
    const localBtn  = getEl('render-norm-local');
    if (globalBtn) globalBtn.classList.toggle('render-mode-active', _state.normalization === 'global');
    if (localBtn)  localBtn.classList.toggle('render-mode-active', _state.normalization === 'local');
    syncRenderModeUI();
}

/** Sync performance mode selector in the DOM. */
export function syncPerformanceModeUI(): void {
    const modes: TorusPerformanceMode[] = ['high', 'balanced', 'battery', 'diagnostic'];
    for (const mode of modes) {
        const btn = getEl(`render-perf-${mode}`);
        if (btn) btn.classList.toggle('render-mode-active', _state.performance === mode);
    }
}

/** Human-readable label for a render mode. */
export function renderModeLabel(mode: TorusRenderMode): string {
    switch (mode) {
        case 'raw':        return 'Raw';
        case 'smooth':     return 'Scientific Smooth';
        case 'overlay':    return 'Layer Overlay';
        case 'diagnostic': return 'Diagnostic';
    }
}

/** Human-readable label for a normalization mode. */
export function normalizationModeLabel(mode: TorusNormalizationMode): string {
    switch (mode) {
        case 'global': return 'Global Norm';
        case 'local':  return 'Local Norm [presentation aid]';
    }
}

/** Human-readable label for a performance mode. */
export function performanceModeLabel(mode: TorusPerformanceMode): string {
    switch (mode) {
        case 'high':       return 'High Quality';
        case 'balanced':   return 'Balanced';
        case 'battery':    return 'Battery Saver';
        case 'diagnostic': return 'Diagnostic';
    }
}

/**
 * Return mesh resolution factor for a given performance mode.
 * Higher = more torus mesh detail.
 * These affect ONLY mesh density, not field calculations.
 */
export function getMeshResolutionFactor(mode: TorusPerformanceMode): number {
    switch (mode) {
        case 'high':       return 1.5;
        case 'balanced':   return 1.0;
        case 'battery':    return 0.6;
        case 'diagnostic': return 0.8;
    }
}

/**
 * Return bloom intensity multiplier for a given performance mode.
 * Values <= 1.0. Diagnostic mode uses 0 (no bloom).
 * Bloom is a presentation aid; it does not represent field values.
 */
export function getBloomIntensity(mode: TorusPerformanceMode): number {
    switch (mode) {
        case 'high':       return 0.6;
        case 'balanced':   return 0.35;
        case 'battery':    return 0.15;
        case 'diagnostic': return 0.0;
    }
}

/**
 * Return particle count factor for a given performance mode.
 * 1.0 = standard particle count.
 */
export function getParticleCountFactor(mode: TorusPerformanceMode): number {
    switch (mode) {
        case 'high':       return 1.5;
        case 'balanced':   return 1.0;
        case 'battery':    return 0.4;
        case 'diagnostic': return 0.5;
    }
}
