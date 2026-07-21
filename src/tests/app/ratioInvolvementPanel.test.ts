/**
 * ratioInvolvementPanel.test.ts
 *
 * Confirms:
 * - no cell selected: an honest "select a cell" empty state
 * - a cell selected but no ObservedRatiosState available: an explicit
 *   "not yet connected" state (this is the real, current production state
 *   — RuntimeSnapshot.observedRatios is always null today)
 * - a cell selected with a real ObservedRatiosState: renders via the real
 *   buildObservedRatioInvolvement, including its caution text
 * - a cell with no involved ratios: an honest "no ratios" empty state
 */

import { describe, it, expect } from 'vitest';
import { renderRatioInvolvementPanelHTML } from '../../ui/shell/RatioInvolvementPanel.js';
import type { ObservedRatiosStateInput } from '../../observation/buildObservedRatioInvolvement.js';

describe('renderRatioInvolvementPanelHTML', () => {
  it('shows an empty state when no cell is selected', () => {
    const html = renderRatioInvolvementPanelHTML(null, null);
    expect(html).toContain('セルが選択されていません');
  });

  it('shows an explicit "not yet connected" state when ObservedRatiosState is unavailable', () => {
    const html = renderRatioInvolvementPanelHTML(null, 3);
    expect(html).toContain('data-testid="ratio-involvement-panel__unavailable"');
    expect(html).toContain('#3');
  });

  it('renders real involvement entries when ObservedRatiosState is available', () => {
    const state: ObservedRatiosStateInput = {
      observedRatios: [
        {
          id: 'amplitudePeakToAverage',
          source: 'amplitudePeak',
          value: 1.5,
          componentCellIndices: [3, 7],
        },
      ],
      strongestMatch: {
        observedRatioId: 'amplitudePeakToAverage',
        referenceRatioId: 'octave',
        matchStrength: 0.8,
      },
      referenceMatches: [],
    };
    const html = renderRatioInvolvementPanelHTML(state, 3);
    expect(html).toContain('1.5000');
    expect(html).toContain('match 0.80');
    expect(html).toContain('not causal proof');
  });

  it('shows an empty state when the cell is involved in no observed ratios', () => {
    const state: ObservedRatiosStateInput = {
      observedRatios: [
        {
          id: 'amplitudePeakToAverage',
          source: 'amplitudePeak',
          value: 1.5,
          componentCellIndices: [7],
        },
      ],
      strongestMatch: null,
      referenceMatches: [],
    };
    const html = renderRatioInvolvementPanelHTML(state, 3);
    expect(html).toContain('関与する観測比率はありません');
  });
});
