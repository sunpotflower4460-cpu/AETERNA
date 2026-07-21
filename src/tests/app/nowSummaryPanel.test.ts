/**
 * nowSummaryPanel.test.ts
 *
 * Confirms:
 * - renderNowSummaryPanelHTML shows a waiting message when summary is null
 * - lines are sorted by priority ascending and capped at 5
 * - text is escaped
 * - each line's real `source` field is hidden by default (Public build)
 *   and shown only when showRawDiagnostics is true (PR9)
 */

import { describe, it, expect } from 'vitest';
import { renderNowSummaryPanelHTML } from '../../ui/shell/NowSummaryPanel.js';
import type { NowSummaryState } from '../../types/nowSummary.js';

function makeLine(id: string, priority: number, text: string) {
  return { id, priority, text, source: 'test', valueKind: 'derived' as const };
}

describe('renderNowSummaryPanelHTML', () => {
  it('shows a waiting message when summary is null', () => {
    const html = renderNowSummaryPanelHTML(null);
    expect(html).toContain('観測データを待機中');
  });

  it('sorts lines by priority ascending and caps at 5', () => {
    const summary: NowSummaryState = {
      timestamp: 0,
      confidence: 1,
      lines: [
        makeLine('a', 3, 'third'),
        makeLine('b', 1, 'first'),
        makeLine('c', 2, 'second'),
        makeLine('d', 4, 'fourth'),
        makeLine('e', 5, 'fifth'),
        makeLine('f', 6, 'sixth-should-be-cut'),
      ],
    };
    const html = renderNowSummaryPanelHTML(summary);
    const order = ['first', 'second', 'third', 'fourth', 'fifth'].map((t) => html.indexOf(t));
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(order.every((i) => i !== -1)).toBe(true);
    expect(html).not.toContain('sixth-should-be-cut');
  });

  it('escapes line text', () => {
    const summary: NowSummaryState = {
      timestamp: 0,
      confidence: 1,
      lines: [makeLine('a', 1, '<script>alert(1)</script>')],
    };
    const html = renderNowSummaryPanelHTML(summary);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('hides each line\'s source by default', () => {
    const summary: NowSummaryState = {
      timestamp: 0,
      confidence: 1,
      lines: [{ id: 'a', priority: 1, text: 'x', source: 'DynamicViabilityState.saturationRisk', valueKind: 'derived' }],
    };
    const html = renderNowSummaryPanelHTML(summary);
    expect(html).not.toContain('DynamicViabilityState.saturationRisk');
  });

  it('shows each line\'s real source when showRawDiagnostics is true', () => {
    const summary: NowSummaryState = {
      timestamp: 0,
      confidence: 1,
      lines: [{ id: 'a', priority: 1, text: 'x', source: 'DynamicViabilityState.saturationRisk', valueKind: 'derived' }],
    };
    const html = renderNowSummaryPanelHTML(summary, true);
    expect(html).toContain('DynamicViabilityState.saturationRisk');
  });
});
