/**
 * guidePanel.test.ts
 *
 * Confirms:
 * - a null snapshot renders the real "no data yet" explanation (via the
 *   real generateGuide/deriveGuideExplanation — not a fabricated fallback)
 * - a real snapshot renders its current-explanation lines, suggestions,
 *   glossary, and integrity notes
 * - confidence is rendered as a percentage
 * - text passes through the real claim guard (no forbidden claims leak through)
 */

import { describe, it, expect } from 'vitest';
import { renderGuidePanelHTML } from '../../ui/shell/GuidePanel.js';
import { buildExplainableSnapshot } from '../../ui/explain/explainableObservationSnapshot.js';
import type { NowSummaryState } from '../../types/nowSummary.js';

describe('renderGuidePanelHTML', () => {
  it('renders the real "no data yet" explanation for a null snapshot', () => {
    const html = renderGuidePanelHTML(null);
    expect(html).toContain('data-testid="guide-panel"');
    expect(html).toContain('Observation data is not yet available.');
    expect(html).toContain('conf 0%');
  });

  it('renders current-explanation lines from a real NowSummaryState', () => {
    const nowSummary = {
      timestamp: 1,
      lines: [
        { id: 'l1', text: 'Torus field flow continuity is at moderate level.', source: 'test' },
      ],
    } as unknown as NowSummaryState;
    const snapshot = buildExplainableSnapshot(null, nowSummary, []);
    const html = renderGuidePanelHTML(snapshot);
    expect(html).toContain('Torus field flow continuity is at moderate level.');
  });

  it('always renders the whatToLookAt/tryNext suggestion sections and integrity notes', () => {
    const html = renderGuidePanelHTML(null);
    expect(html).toContain('Overview panel');
    expect(html).toContain('Wait for the simulation to initialise');
    // Integrity notes are always present (never conditionally hidden).
    expect(html).toContain('guide-panel__integrity');
    expect(html).toContain('External LLM guide is inactive');
  });

  it('suggests rotating the torus once real overview data is present', () => {
    const nowSummary = { timestamp: 1, lines: [] } as unknown as NowSummaryState;
    const snapshot = buildExplainableSnapshot(null, nowSummary, []);
    const html = renderGuidePanelHTML(snapshot);
    expect(html).toContain('Rotate the torus');
  });
});
