/**
 * DifferencePanel.ts
 *
 * Context Panel Migration item 5/9 (Difference). Shown alongside the
 * Replay panel (item 4/9) on the 'history' route whenever a specific
 * tick is selected — compares that recorded tick ("before") against the
 * current live RuntimeSnapshot ("after"). Reuses no fabricated data:
 * a metric missing from either snapshot renders as "—", never 0.
 */

import type { RuntimeSnapshotDifference } from '../../app/replay/RuntimeSnapshotDifference.js';

export function renderDifferencePanelHTML(diff: RuntimeSnapshotDifference): string {
  const rows = diff.items
    .map((item) => {
      const delta =
        item.delta === null ? '—' : `${item.delta >= 0 ? '+' : ''}${item.delta.toFixed(4)}`;
      return `<tr class="difference-panel__row">
        <td class="difference-panel__cell difference-panel__cell--label">${item.label}</td>
        <td class="difference-panel__cell">${formatValue(item.before)}</td>
        <td class="difference-panel__cell">${formatValue(item.after)}</td>
        <td class="difference-panel__cell difference-panel__cell--delta">${delta}</td>
      </tr>`;
    })
    .join('');

  return `<div class="difference-panel" data-testid="difference-panel">
    <h3 class="difference-panel__title">差分 — tick ${diff.beforeTick ?? '—'} → ${diff.afterTick ?? '—'}（現在）</h3>
    <table class="difference-panel__table">
      <thead><tr>
        <th></th><th>記録時</th><th>現在</th><th>差</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

function formatValue(value: number | null): string {
  return value === null ? '—' : value.toFixed(4);
}
