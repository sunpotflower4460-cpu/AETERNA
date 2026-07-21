/**
 * ratioInvolvementPanel.test.ts
 *
 * Confirms:
 * - no cell selected: an honest "select a cell" empty state
 * - a cell selected but no ObservedRatiosState available: renders nothing
 *   by default (PR9 — implementation-status detail has no value to a
 *   general public user) and only the explicit "not yet connected" state
 *   when showRawDiagnostics (research/developer builds) is true
 * - a cell selected with a real ObservedRatiosState: renders via the real
 *   buildObservedRatioInvolvement, including its caution text (shown
 *   regardless of showRawDiagnostics — this is real observation content,
 *   not implementation-status detail)
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

  it('renders nothing by default when ObservedRatiosState is unavailable (Public build)', () => {
    const html = renderRatioInvolvementPanelHTML(null, 3);
    expect(html).toBe('');
  });

  it('shows an explicit "not yet connected" state when ObservedRatiosState is unavailable and showRawDiagnostics is true', () => {
    const html = renderRatioInvolvementPanelHTML(null, 3, true);
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
