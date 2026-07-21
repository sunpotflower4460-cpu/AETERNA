/**
 * differencePanel.test.ts
 *
 * Confirms:
 * - shows the before/after tick range in the title
 * - shows before/after/delta for each metric, with a +/- sign on positive/negative deltas
 * - shows "—" for a metric with a null delta, not "0" (no fabrication)
 */

import { describe, it, expect } from 'vitest';
import { renderDifferencePanelHTML } from '../../ui/shell/DifferencePanel.js';
import { buildRuntimeSnapshotDifference } from '../../app/replay/RuntimeSnapshotDifference.js';
import type { RuntimeSnapshot } from '../../app/runtime/RuntimeSnapshot.js';

function makeSnapshot(tick: number, overrides: Partial<RuntimeSnapshot> = {}): RuntimeSnapshot {
  return {
    tick,
    timestamp: tick * 100,
    engineState: 'NEUTRAL',
    sigma: 1,
    phi: 0.001,
    energy: 0.5,
    arousal: 0.02,
    viability: null,
    closure: null,
    membrane: null,
    localField: null,
    repeatedFlowPaths: null,
    protoNetwork: null,
    observedRatios: null,
    ...overrides,
  };
}

describe('renderDifferencePanelHTML', () => {
  it('shows the before/after tick range in the title', () => {
    const diff = buildRuntimeSnapshotDifference(makeSnapshot(3), makeSnapshot(9));
    const html = renderDifferencePanelHTML(diff);
    expect(html).toContain('tick 3');
    expect(html).toContain('9');
  });

  it('shows a + sign for a positive delta and no sign issue for a negative one', () => {
    const before = makeSnapshot(1, { sigma: 1.0 });
    const after = makeSnapshot(2, { sigma: 1.08 });
    const html = renderDifferencePanelHTML(buildRuntimeSnapshotDifference(before, after));
    expect(html).toContain('+0.0800');

    const decreasing = renderDifferencePanelHTML(
      buildRuntimeSnapshotDifference(makeSnapshot(1, { sigma: 1.0 }), makeSnapshot(2, { sigma: 0.9 }))
    );
    expect(decreasing).toContain('-0.1000');
  });

  it('shows "—" for a null delta, not "0"', () => {
    const before = makeSnapshot(1, { energy: null });
    const after = makeSnapshot(2, { energy: 0.6 });
    const html = renderDifferencePanelHTML(buildRuntimeSnapshotDifference(before, after));
    expect(html).toContain('—');
  });
});
