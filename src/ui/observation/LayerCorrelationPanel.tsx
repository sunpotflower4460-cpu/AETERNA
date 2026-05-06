/**
 * LayerCorrelationPanel.tsx
 * v1.8: Causal Trace / Layer Correlation
 *
 * Renders the Layer Correlation panel as an HTML string.
 * Shows correlation pairs as table rows with correlation value and confidence.
 *
 * Design principles:
 * - "Correlation is not causal proof" disclaimer is always shown.
 * - NaN is never displayed (null → "—").
 * - No consciousness / emotion / life / soul / mystical claims.
 * - All output is XSS-safe via _esc().
 *
 * Reference: docs/causal-trace-layer-correlation.md §4
 */

import type { LayerCorrelationState, LayerCorrelationPair } from '../../types/layerCorrelation.ts';

// ── LayerCorrelationPanelProps ────────────────────────────────────────────────

export interface LayerCorrelationPanelProps {
    state: LayerCorrelationState | null;
}

// ── _esc ──────────────────────────────────────────────────────────────────────

function _esc(s: string | number | undefined | null): string {
    if (s === undefined || s === null) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ── Pair row renderer ─────────────────────────────────────────────────────────

function renderPairRowHTML(pair: LayerCorrelationPair): string {
    const corrStr = pair.correlation !== null && pair.correlation !== undefined
        ? pair.correlation.toFixed(4)
        : '—';
    const samplesStr = pair.sampleCount < 3 ? '(insufficient samples)' : String(pair.sampleCount);

    return `<tr class="layer-correlation-panel__row layer-correlation-panel__row--${_esc(pair.confidence)}">
  <td class="layer-correlation-panel__cell">${_esc(pair.labelA)}</td>
  <td class="layer-correlation-panel__cell">${_esc(pair.labelB)}</td>
  <td class="layer-correlation-panel__cell layer-correlation-panel__cell--corr">${_esc(corrStr)}</td>
  <td class="layer-correlation-panel__cell">${_esc(pair.confidence)}</td>
  <td class="layer-correlation-panel__cell layer-correlation-panel__cell--samples">${_esc(samplesStr)}</td>
</tr>`;
}

// ── renderLayerCorrelationPanelHTML ───────────────────────────────────────────

/**
 * Render the Layer Correlation panel as an HTML string.
 *
 * @param props - LayerCorrelationPanelProps
 * @returns HTML string
 */
export function renderLayerCorrelationPanelHTML(props: LayerCorrelationPanelProps): string {
    const { state } = props;

    const disclaimer = `<div class="layer-correlation-panel__disclaimer">
  <strong>⚠ Correlation is not causal proof.</strong>
  Statistical correlations between layers show patterns only.
  They do not imply that one metric causes another.
  No consciousness, life, or intelligence claims are made.
</div>`;

    if (!state) {
        return `<div class="layer-correlation-panel layer-correlation-panel--empty">
  ${disclaimer}
  <p class="layer-correlation-panel__empty-msg">No layer correlation data available.</p>
</div>`;
    }

    const { pairs, timeWindowTicks, snapshotCount, earliestTick, latestTick, sufficientData } = state;

    const windowInfo = earliestTick !== null && latestTick !== null
        ? `Ticks ${_esc(earliestTick)}–${_esc(latestTick)} (window: ${_esc(timeWindowTicks)} ticks, ${_esc(snapshotCount)} snapshots)`
        : `Window: ${_esc(timeWindowTicks)} ticks, ${_esc(snapshotCount)} snapshots`;

    const insufficientNote = !sufficientData
        ? `<div class="layer-correlation-panel__insufficient">Insufficient data for correlation (need ≥ 3 snapshots).</div>`
        : '';

    const pairsHtml = pairs.length > 0
        ? `<table class="layer-correlation-panel__table">
  <thead>
    <tr>
      <th>Metric A</th>
      <th>Metric B</th>
      <th>Pearson r</th>
      <th>Confidence</th>
      <th>Samples (min 3)</th>
    </tr>
  </thead>
  <tbody>
    ${pairs.map(renderPairRowHTML).join('\n')}
  </tbody>
</table>`
        : '<p class="layer-correlation-panel__no-pairs">No correlation pairs configured.</p>';

    return `<div class="layer-correlation-panel">
  <div class="layer-correlation-panel__header">
    <span class="layer-correlation-panel__title">Layer Correlation</span>
    <span class="layer-correlation-panel__window">${windowInfo}</span>
  </div>
  ${disclaimer}
  ${insufficientNote}
  <div class="layer-correlation-panel__table-container">
    ${pairsHtml}
  </div>
  <div class="layer-correlation-panel__caution">${_esc(state.caution)}</div>
</div>`;
}
