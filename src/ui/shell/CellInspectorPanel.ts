/**
 * CellInspectorPanel.ts
 *
 * Context Panel Migration items 2/9 and 3/9 (master spec §8's PR8 order:
 * Cell Inspector, then Lens). Shows the currently-selected cell's real
 * per-node values (RuntimeAdapter's getCellValue — a read-only accessor,
 * selection never mutates Runtime state, see
 * src/perception/pointerHandlers.js's 'inspect' branch) and lets the
 * user pick a lens (src/app/state/UiState.ts's LensId) to emphasize one
 * of them — each row is itself the clickable lens selector
 * (data-lens="currentValue"/"spikeTrace"), not a separate control.
 */

import type { CellObservationValue } from '../../app/runtime/RuntimeAdapter.js';
import type { LensId } from '../../app/state/UiState.js';

export function renderCellInspectorPanelHTML(
  cell: CellObservationValue | null,
  activeLensId: LensId | null
): string {
  if (!cell) {
    return `<div class="cell-inspector-panel" data-testid="cell-inspector-panel">
      <p class="cell-inspector-panel__empty">セルが選択されていません。観測モードを「調べる」にしてトーラスをタップしてください。</p>
    </div>`;
  }
  const row = (lensId: LensId, valueKind: string, label: string, value: number) => {
    const active = activeLensId === lensId;
    return `<li
      class="cell-inspector-panel__row${active ? ' cell-inspector-panel__row--active' : ''}"
      data-value-kind="${valueKind}"
      data-lens="${lensId}"
      role="button"
      tabindex="0"
      aria-pressed="${active}"
    >
      <span class="cell-inspector-panel__label">${label}</span>
      <span class="cell-inspector-panel__value">${value.toFixed(4)}</span>
    </li>`;
  };
  return `<div class="cell-inspector-panel" data-testid="cell-inspector-panel">
    <h3 class="cell-inspector-panel__title">セル観測 — #${cell.cellId}</h3>
    <ul class="cell-inspector-panel__rows">
      ${row('currentValue', 'measured', '場の値 (raw)', cell.currentValue)}
      ${row('spikeTrace', 'derived', 'スパイク痕跡', cell.spikeTrace)}
    </ul>
    <p class="cell-inspector-panel__lens-hint">行をクリックしてレンズを選択</p>
  </div>`;
}
