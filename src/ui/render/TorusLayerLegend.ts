/**
 * TorusLayerLegend.ts
 * U3: Scientific Torus Renderer — layer legend UI helper
 *
 * Renders a color legend showing which color corresponds to which
 * observation value. Colors are fixed (see torusColorMap.ts).
 *
 * The legend distinguishes:
 *   - raw vs derived vs proxy vs smoothed values
 *   - which layers are currently visible
 *
 * This module does NOT modify runtime dynamics, field values, or energy.
 */

import { TORUS_COLOR_LEGEND, type ColorLegendEntry } from './torusColorMap.js';
import { getVisibleLayers, TORUS_LAYER_REGISTRY, type TorusLayerId } from './torusLayerRegistry.js';
import type { TorusRenderMode } from '../../types/torusRenderState.js';

// ── Value type badges ──────────────────────────────────────────────────────

/** Short badge text for each value type. */
const VALUE_TYPE_BADGE: Record<string, string> = {
    raw:      'raw',
    derived:  'derived',
    proxy:    'proxy',
    smoothed: 'smoothed [S]',
};

// ── DOM helpers ────────────────────────────────────────────────────────────

/**
 * Render the full color legend into a DOM element.
 *
 * @param elementId   - ID of the container element
 * @param renderMode  - Current render mode (shown in the legend header)
 */
export function renderColorLegend(
    elementId: string,
    renderMode: TorusRenderMode
): void {
    const el = document.getElementById(elementId);
    if (!el) return;

    const modeNote = renderMode === 'smooth'
        ? '<span class="legend-note">[S] = presentation-smoothed</span>'
        : '';

    const rows = TORUS_COLOR_LEGEND.map((entry) => buildLegendRow(entry)).join('');
    el.innerHTML = `
        <div class="legend-header">Color / Value Legend ${modeNote}</div>
        <div class="legend-rows">${rows}</div>
    `;
}

/**
 * Render only the currently visible layers in the legend.
 *
 * @param elementId   - ID of the container element
 * @param renderMode  - Current render mode
 */
export function renderVisibleLayersLegend(
    elementId: string,
    renderMode: TorusRenderMode
): void {
    const el = document.getElementById(elementId);
    if (!el) return;

    const visibleLayers = getVisibleLayers();
    if (visibleLayers.length === 0) {
        el.innerHTML = '<div class="legend-empty">No layers visible</div>';
        return;
    }

    const modeNote = renderMode === 'smooth'
        ? ' <span class="legend-note">[S]</span>'
        : '';

    const rows = visibleLayers.map((layer) => {
        const entry: ColorLegendEntry = {
            hex: layer.colorHex,
            label: layer.label,
            valueType: layer.valueType as ColorLegendEntry['valueType'],
        };
        return buildLegendRow(entry);
    }).join('');

    el.innerHTML = `
        <div class="legend-header">Active Layers${modeNote}</div>
        <div class="legend-rows">${rows}</div>
    `;
}

/**
 * Build HTML for a single legend row (color swatch + label + type badge).
 */
function buildLegendRow(entry: ColorLegendEntry): string {
    const badge = VALUE_TYPE_BADGE[entry.valueType] ?? entry.valueType;
    return `
        <div class="legend-row">
            <span class="legend-swatch" style="background:${entry.hex}"></span>
            <span class="legend-label">${entry.label}</span>
            <span class="legend-type">${badge}</span>
        </div>
    `;
}

/**
 * Build the layer visibility toggle HTML for use in the Overlay / Diagnostic panels.
 * Buttons toggle layer visibility; they do NOT modify field values.
 */
export function buildLayerToggleHTML(): string {
    const layers = Object.values(TORUS_LAYER_REGISTRY);
    const rows = layers.map((layer) => {
        const available = layer.availableInU3
            ? ''
            : ' disabled title="Available in U4"';
        const defaultChecked = layer.defaultVisible ? ' checked' : '';
        return `
            <label class="layer-toggle-row">
                <input type="checkbox" class="layer-toggle-cb"
                    data-layer-id="${layer.id}"
                    onchange="toggleTorusLayer('${layer.id}', this.checked)"${defaultChecked}${available}>
                <span class="layer-toggle-swatch" style="background:${layer.colorHex}"></span>
                <span class="layer-toggle-label">${layer.label}</span>
                <span class="layer-toggle-type">${VALUE_TYPE_BADGE[layer.valueType] ?? layer.valueType}</span>
                ${!layer.availableInU3 ? '<span class="layer-u4-badge">U4</span>' : ''}
            </label>
        `;
    }).join('');

    return `<div id="layer-toggle-panel" class="layer-toggle-panel">${rows}</div>`;
}

/**
 * Sync layer toggle checkboxes to current visibility state.
 *
 * @param layerVisibility - Map of layer id → boolean
 */
export function syncLayerToggleUI(layerVisibility: Partial<Record<TorusLayerId, boolean>>): void {
    const checkboxes = document.querySelectorAll<HTMLInputElement>('.layer-toggle-cb[data-layer-id]');
    checkboxes.forEach((cb) => {
        const id = cb.dataset['layerId'] as TorusLayerId | undefined;
        if (id !== undefined && id in layerVisibility) {
            cb.checked = layerVisibility[id] ?? false;
        }
    });
}
