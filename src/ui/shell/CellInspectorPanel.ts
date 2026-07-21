/**
 * CellInspectorPanel.ts
 *
 * Context Panel Migration item 2/9 (master spec §8's PR8 order). Shows
 * the currently-selected cell's real per-node values (RuntimeAdapter's
 * getCellValue — a read-only accessor, selection never mutates Runtime
 * state, see src/perception/pointerHandlers.js's 'inspect' branch).
 */

import type { CellObservationValue } from '../../app/runtime/RuntimeAdapter.js';

export function renderCellInspectorPanelHTML(cell: CellObservationValue | null): string {
  if (!cell) {
    return `<div class="cell-inspector-panel" data-testid="cell-inspector-panel">
      <p class="cell-inspector-panel__empty">セルが選択されていません。観測モードを「調べる」にしてトーラスをタップしてください。</p>
    </div>`;
  }
  return `<div class="cell-inspector-panel" data-testid="cell-inspector-panel">
    <h3 class="cell-inspector-panel__title">セル観測 — #${cell.cellId}</h3>
    <ul class="cell-inspector-panel__rows">
      <li class="cell-inspector-panel__row" data-value-kind="measured">
        <span class="cell-inspector-panel__label">場の値 (raw)</span>
        <span class="cell-inspector-panel__value">${cell.currentValue.toFixed(4)}</span>
      </li>
      <li class="cell-inspector-panel__row" data-value-kind="derived">
        <span class="cell-inspector-panel__label">スパイク痕跡</span>
        <span class="cell-inspector-panel__value">${cell.spikeTrace.toFixed(4)}</span>
      </li>
    </ul>
  </div>`;
}
