/**
 * ReplayPanel.ts
 *
 * Context Panel Migration item 4/9 (Replay), shown on the 'history'
 * route. Re-displays previously captured RuntimeSnapshot readings
 * (src/app/replay/RuntimeSnapshotHistory.ts) — observation replay only,
 * never rewinds the live Runtime (master spec §9's Replay principle,
 * same guarantee as the existing unconnected src/replay/timeReplayBuffer.ts).
 */

import type { RuntimeSnapshotHistory } from '../../app/replay/RuntimeSnapshotHistory.js';
import type { RuntimeSnapshot } from '../../app/runtime/RuntimeSnapshot.js';

export function renderReplayPanelHTML(
  history: RuntimeSnapshotHistory,
  selectedTick: number | null
): string {
  if (history.snapshots.length === 0) {
    return `<div class="replay-panel" data-testid="replay-panel">
      <p class="replay-panel__empty">まだ記録がありません。しばらく観測を続けてください。</p>
    </div>`;
  }

  const ascending = [...history.snapshots].sort((a, b) => a.tick - b.tick);
  const shown: RuntimeSnapshot =
    (selectedTick !== null ? history.snapshots.find((s) => s.tick === selectedTick) : null) ??
    ascending[ascending.length - 1];
  const isLive = selectedTick === null;

  const options = ascending
    .map(
      (s) =>
        `<option value="${s.tick}"${s.tick === shown.tick ? ' selected' : ''}>tick ${s.tick}</option>`
    )
    .join('');

  return `<div class="replay-panel" data-testid="replay-panel">
    <h3 class="replay-panel__title">履歴再生${isLive ? '（ライブ）' : '（記録 — tick ' + shown.tick + '）'}</h3>
    <select class="replay-panel__select" data-testid="replay-tick-select">${options}</select>
    <ul class="replay-panel__rows">
      <li class="replay-panel__row"><span class="replay-panel__label">σ</span><span class="replay-panel__value">${formatValue(shown.sigma)}</span></li>
      <li class="replay-panel__row"><span class="replay-panel__label">φ</span><span class="replay-panel__value">${formatValue(shown.phi)}</span></li>
      <li class="replay-panel__row"><span class="replay-panel__label">energy</span><span class="replay-panel__value">${formatValue(shown.energy)}</span></li>
    </ul>
    ${isLive ? '' : '<button type="button" class="replay-panel__live-button" data-action="replay-return-to-live">ライブに戻る</button>'}
    <p class="replay-panel__note">再生は記録済みの観測値を表示するのみで、Runtimeは巻き戻されません。</p>
  </div>`;
}

function formatValue(value: number | null): string {
  return value === null ? '—' : value.toFixed(4);
}
