/**
 * MetricSpotlightPanel.tsx
 * v1.7: Deep Inspector / Time Replay — Metric Spotlight Panel
 *
 * Displays detailed information about the currently active Metric Visual Lens,
 * including its description, value, preferred field layers, and epistemic note.
 *
 * Design principles:
 * - Shows real lens definition data only.
 * - Preferred field layer suggestion is advisory — no automatic layer switching.
 * - If a preferred layer doesn't exist, "layer unavailable" is shown.
 * - No fake lens data, no consciousness claims.
 *
 * Reference: docs/deep-inspector-time-replay.md §5
 */

import { getLens, type MetricLens, type MetricLensId } from '../lens/metricLensRegistry.ts';
import type { CellObservation } from '../../types/cellObservation.ts';
import { resolveObservationPath } from '../lens/lensContextPacket.ts';
import type { FieldLayerId } from '../render/fieldLayerRegistry.ts';

// ── Lens → preferred field layer mapping ──────────────────────────────────────

/**
 * Maps MetricLensId to zero or more preferred FieldLayerIds.
 * These are advisory hints; the user decides whether to activate them.
 */
const LENS_PREFERRED_LAYERS: Partial<Record<MetricLensId, FieldLayerId[]>> = {
    gaussianCurvature:    ['torusCurvature'],
    areaElement:          ['torusCurvature'],
    innerOuterBias:       ['torusCurvature'],
    fieldAmplitude:       ['energyActivity'],
    fieldPhase:           ['fieldPhase'],
    phaseCoherence:       ['fieldPhase'],
    flowContinuity:       ['energyActivity'],
    energyThroughput:     ['energyActivity'],
    vortexConfidence:     ['vortexCandidate'],
    topologicalCharge:    ['vortexCandidate'],
    membraneDeformation:  ['membraneState'],
    membraneTension:      ['membraneState'],
    membranePermeability: ['membraneState'],
    twoSidedness:         ['membraneState'],
    plasticityTrace:      ['weakPlasticityTrace'],
    resistanceScale:      ['weakPlasticityTrace'],
    observedRatioMatch:   [],
};

// ── MetricSpotlightPanelProps ─────────────────────────────────────────────────

export interface MetricSpotlightPanelProps {
    /** Active lens ID, or null */
    activeLensId: MetricLensId | null;
    /** Current cell observation for value display */
    observation: CellObservation | null;
    /** Called when user clicks "Show recommended layer" */
    onShowLayer?: (layerId: FieldLayerId) => void;
    /** Set of layer IDs that are currently available in the field layer registry */
    availableLayerIds?: Set<FieldLayerId>;
}

// ── renderMetricSpotlightPanelHTML ────────────────────────────────────────────

/**
 * Render the Metric Spotlight panel as an HTML string.
 */
export function renderMetricSpotlightPanelHTML(props: MetricSpotlightPanelProps): string {
    const { activeLensId, observation, availableLayerIds } = props;

    if (!activeLensId) {
        return `<div class="metric-spotlight-panel metric-spotlight-panel--empty">
  <p class="metric-spotlight-panel__empty-msg">Click a metric row in the Cell Inspector to activate a lens.</p>
</div>`;
    }

    const lens = getLens(activeLensId);
    if (!lens) {
        return `<div class="metric-spotlight-panel metric-spotlight-panel--error">
  <p>Lens "${_esc(activeLensId)}" not found in registry.</p>
</div>`;
    }

    const valueStr = observation
        ? _formatLensValue(lens, observation)
        : '(no observation)';

    const proxyNoteHtml = lens.valueKind === 'proxy'
        ? `<span class="metric-spotlight-panel__note">
  Proxy: 観測補助指標。証明ではありません。
</span>`
        : '';

    const preferredLayers = LENS_PREFERRED_LAYERS[activeLensId] ?? [];
    const layerSuggestionsHtml = _renderLayerSuggestions(preferredLayers, availableLayerIds ?? new Set());

    return `<div class="metric-spotlight-panel">
  <div class="metric-spotlight-panel__header">
    <span class="metric-spotlight-panel__lens-label"
          style="color:${_esc(lens.colorHex)}"
    >${_esc(lens.label)}</span>
    <span class="metric-spotlight-panel__value-kind">[${_esc(lens.valueKind)}]</span>
  </div>
  <div class="metric-spotlight-panel__context">
    Lens: <strong>${_esc(lens.label)}</strong> | Kind: <span>[${_esc(lens.valueKind)}]</span>
  </div>
  <div class="metric-spotlight-panel__value">
    <span class="metric-spotlight-panel__value-number">${_esc(valueStr)}</span>
    ${proxyNoteHtml}
  </div>
  <p class="metric-spotlight-panel__description">${_esc(lens.description)}</p>
  <p class="metric-spotlight-panel__disclaimer">ℹ️ ${_esc(lens.disclaimer)}</p>
  <div class="metric-spotlight-panel__guide-actions">
    <button onclick="window.dispatchEvent(new CustomEvent('guide:ask',{detail:{question:'これなに？',mode:'explain'}}))">これなに？</button>
    <button onclick="window.dispatchEvent(new CustomEvent('guide:ask',{detail:{question:'どう仮説できる？',mode:'hypothesis'}}))">どう仮説できる？</button>
    <button onclick="window.dispatchEvent(new CustomEvent('guide:ask',{detail:{question:'次どこ見る？',mode:'next'}}))">次どこ見る？</button>
    <button onclick="window.dispatchEvent(new CustomEvent('guide:ask',{detail:{question:'注意点は？',mode:'caution'}}))">注意点は？</button>
  </div>
  ${layerSuggestionsHtml}
</div>`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _formatLensValue(lens: MetricLens, obs: CellObservation): string {
    const raw = resolveObservationPath(obs, lens.observationPath);
    if (raw === undefined || raw === null) return '(not observed)';
    if (typeof raw === 'number') {
        if (!Number.isFinite(raw)) return '(non-finite)';
        const digits = lens.displayRange ? 4 : 6;
        return `${raw.toFixed(digits)} ${lens.unit}`;
    }
    return String(raw);
}

function _renderLayerSuggestions(
    preferredLayers: FieldLayerId[],
    availableLayerIds: Set<FieldLayerId>,
): string {
    if (preferredLayers.length === 0) {
        return `<div class="metric-spotlight-panel__layers">
  <span class="metric-spotlight-panel__layers-label">Recommended layers:</span>
  <span class="metric-spotlight-panel__layer-none">None specified</span>
</div>`;
    }

    const items = preferredLayers.map((layerId) => {
        const available = availableLayerIds.has(layerId);
        if (!available) {
            return `<span class="metric-spotlight-panel__layer metric-spotlight-panel__layer--unavailable">${_esc(layerId)} (layer unavailable)</span>`;
        }
        return `<button
  class="metric-spotlight-panel__layer-btn"
  data-layer-id="${_esc(layerId)}"
  onclick="window.dispatchEvent(new CustomEvent('spotlight:showLayer',{detail:{layerId:'${_esc(layerId)}'}}))">
  Show ${_esc(layerId)}
</button>`;
    }).join('');

    return `<div class="metric-spotlight-panel__layers">
  <span class="metric-spotlight-panel__layers-label">Recommended layers:</span>
  ${items}
</div>`;
}

function _esc(s: string | undefined | null): string {
    if (s === undefined || s === null) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ── getPreferredLayersForLens ─────────────────────────────────────────────────

/**
 * Return the preferred field layer IDs for a given lens.
 * Returns an empty array when no preferred layers are defined.
 */
export function getPreferredLayersForLens(lensId: MetricLensId): FieldLayerId[] {
    return LENS_PREFERRED_LAYERS[lensId] ?? [];
}
