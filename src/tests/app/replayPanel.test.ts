/**
 * replayPanel.test.ts
 *
 * Confirms:
 * - renderReplayPanelHTML shows a waiting message when history is empty
 * - with no selectedTick, shows the latest (highest-tick) snapshot, labeled live
 * - with a selectedTick, shows that snapshot's values, labeled as a recording,
 *   and includes a "return to live" button
 * - a selectedTick with no matching snapshot falls back to the latest (no fabrication)
 * - the tick <select> lists all recorded ticks in ascending order
 */

import { describe, it, expect } from 'vitest';
import { renderReplayPanelHTML } from '../../ui/shell/ReplayPanel.js';
import {
  createRuntimeSnapshotHistory,
  pushRuntimeSnapshot,
} from '../../app/replay/RuntimeSnapshotHistory.js';
import type { RuntimeSnapshot } from '../../app/runtime/RuntimeSnapshot.js';

function makeSnapshot(tick: number, sigma: number): RuntimeSnapshot {
  return {
    tick,
    timestamp: tick * 100,
    engineState: 'NEUTRAL',
    sigma,
    phi: null,
    energy: null,
    arousal: null,
    viability: null,
    closure: null,
    membrane: null,
    localField: null,
    repeatedFlowPaths: null,
    protoNetwork: null,
    observedRatios: null,
  };
}

describe('renderReplayPanelHTML', () => {
  it('shows a waiting message when history is empty', () => {
    const html = renderReplayPanelHTML(createRuntimeSnapshotHistory(), null);
    expect(html).toContain('まだ記録がありません');
  });

  it('shows the latest snapshot and is labeled live when no tick is selected', () => {
    let h = createRuntimeSnapshotHistory();
    h = pushRuntimeSnapshot(h, makeSnapshot(1, 1.0));
    h = pushRuntimeSnapshot(h, makeSnapshot(2, 1.5));
    const html = renderReplayPanelHTML(h, null);
    expect(html).toContain('ライブ');
    expect(html).toContain('1.5000');
    expect(html).not.toContain('replay-return-to-live');
  });

  it('shows the selected snapshot, labels it as a recording, and offers a return-to-live control', () => {
    let h = createRuntimeSnapshotHistory();
    h = pushRuntimeSnapshot(h, makeSnapshot(1, 1.0));
    h = pushRuntimeSnapshot(h, makeSnapshot(2, 1.5));
    const html = renderReplayPanelHTML(h, 1);
    expect(html).toContain('1.0000');
    expect(html).not.toContain('（ライブ）');
    expect(html).toContain('tick 1');
    expect(html).toContain('data-action="replay-return-to-live"');
  });

  it('falls back to the latest snapshot for a selectedTick with no match (no fabrication)', () => {
    let h = createRuntimeSnapshotHistory();
    h = pushRuntimeSnapshot(h, makeSnapshot(1, 1.0));
    const html = renderReplayPanelHTML(h, 999);
    expect(html).toContain('1.0000');
  });

  it('lists all recorded ticks in ascending order in the select', () => {
    let h = createRuntimeSnapshotHistory();
    for (const tick of [5, 1, 3]) h = pushRuntimeSnapshot(h, makeSnapshot(tick, tick));
    const html = renderReplayPanelHTML(h, null);
    const order = [1, 3, 5].map((t) => html.indexOf(`tick ${t}`));
    expect(order.every((i) => i !== -1)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });
});
