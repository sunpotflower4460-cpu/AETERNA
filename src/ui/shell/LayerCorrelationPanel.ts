/**
 * LayerCorrelationPanel.ts
 *
 * Context Panel Migration item 7/9 (Layer Correlation). Shown on the
 * 'history' route, independent of tick selection — this describes a
 * relationship across the whole captured history, not a single before/
 * after comparison (contrast with Difference/Causal Trace, PR8e-f).
 */

import type { LayerCorrelationResult } from '../../app/replay/computeLayerCorrelation.js';

const LABELS: Record<string, string> = { sigma: 'σ', phi: 'φ', energy: 'energy', arousal: 'arousal' };

export function renderLayerCorrelationPanelHTML(result: LayerCorrelationResult): string {
  const rows = result.pairs
    .map((pair) => {
      const value = pair.correlation === null ? '—' : pair.correlation.toFixed(3);
      return `<tr class="layer-correlation-panel__row">
        <td class="layer-correlation-panel__cell layer-correlation-panel__cell--label">${LABELS[pair.metricA]} × ${LABELS[pair.metricB]}</td>
        <td class="layer-correlation-panel__cell">${value}</td>
        <td class="layer-correlation-panel__cell layer-correlation-panel__cell--n">n=${pair.sampleSize}</td>
      </tr>`;
    })
    .join('');

  return `<div class="layer-correlation-panel" data-testid="layer-correlation-panel">
    <h3 class="layer-correlation-panel__title">レイヤー相関（記録区間）</h3>
    <table class="layer-correlation-panel__table">
      <thead><tr><th>指標の組</th><th>相関係数</th><th>標本数</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p class="layer-correlation-panel__caution">相関は因果関係を示すものではありません。標本数が少ない場合、値は不安定です。</p>
  </div>`;
}
