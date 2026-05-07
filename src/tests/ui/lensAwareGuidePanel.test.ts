/**
 * lensAwareGuidePanel.test.ts
 * v1.9: Lens-aware AI Guide
 *
 * Tests for renderLensAwareGuidePanelHTML.
 */

import { describe, it, expect } from 'vitest';
import { renderLensAwareGuidePanelHTML } from '../../ui/guide/LensAwareGuidePanel.tsx';
import type { LensGuideResponse } from '../../guide/lensGuideTypes.ts';

function makeResponse(): LensGuideResponse {
  return {
    mode: 'explain',
    answer: 'The field amplitude is 0.55.',
    observationFacts: ['Field amplitude: 0.55'],
    hypothesisCandidates: [],
    comparisonNotes: [],
    cautionNotes: ['All values are observer-side measurements.'],
    suggestedNextLenses: ['vortexConfidence'],
    suggestedNextPanels: ['Cell Inspector'],
    confidence: 0.7,
    usedContextKinds: ['lensContext'],
    claimGuardPassed: true,
    blockedClaims: [],
  };
}

describe('renderLensAwareGuidePanelHTML', () => {
  it('renders without errors when no observation', () => {
    const html = renderLensAwareGuidePanelHTML({
      activeLensId: null,
      selectedCellIndex: null,
      activeMode: 'explain',
      response: null,
    });
    expect(html).toBeDefined();
    expect(html.length).toBeGreaterThan(0);
  });

  it('renders with active lens and cell', () => {
    const html = renderLensAwareGuidePanelHTML({
      activeLensId: 'vortexConfidence',
      selectedCellIndex: 5,
      activeMode: 'explain',
      response: makeResponse(),
    });
    expect(html).toContain('vortexConfidence');
    expect(html).toContain('セル 5');
  });

  it('shows 観測ガイド header (Japanese-first, v2.4)', () => {
    const html = renderLensAwareGuidePanelHTML({
      activeLensId: null,
      selectedCellIndex: null,
      activeMode: 'explain',
      response: null,
    });
    expect(html).toContain('観測ガイド');
  });

  it('retains English "(AI Guide)" reference', () => {
    const html = renderLensAwareGuidePanelHTML({
      activeLensId: null,
      selectedCellIndex: null,
      activeMode: 'explain',
      response: null,
    });
    expect(html).toContain('AI Guide');
  });

  it('shows guardrail note in Japanese', () => {
    const html = renderLensAwareGuidePanelHTML({
      activeLensId: null,
      selectedCellIndex: null,
      activeMode: 'explain',
      response: null,
    });
    expect(html).toContain('観測結果を読む補助');
    expect(html).toContain('AETERNA 本体の発話ではありません');
  });

  it('renders mode tabs', () => {
    const html = renderLensAwareGuidePanelHTML({
      activeLensId: null,
      selectedCellIndex: null,
      activeMode: 'explain',
      response: null,
    });
    expect(html).toContain('説明');
    expect(html).toContain('仮説');
    expect(html).toContain('比較');
  });

  it('renders question input', () => {
    const html = renderLensAwareGuidePanelHTML({
      activeLensId: null,
      selectedCellIndex: null,
      activeMode: 'explain',
      response: null,
    });
    expect(html).toContain('これなに？');
  });

  it('renders response view when response is provided', () => {
    const html = renderLensAwareGuidePanelHTML({
      activeLensId: 'vortexConfidence',
      selectedCellIndex: 5,
      activeMode: 'explain',
      response: makeResponse(),
    });
    expect(html).toContain('The field amplitude is 0.55.');
  });

  it('renders "ready" message when response is null', () => {
    const html = renderLensAwareGuidePanelHTML({
      activeLensId: null,
      selectedCellIndex: null,
      activeMode: 'explain',
      response: null,
    });
    expect(html).toContain('Guide is ready. Ask a question above.');
  });

  it('shows Japanese "レンズ未選択" when activeLensId is null (v2.4)', () => {
    const html = renderLensAwareGuidePanelHTML({
      activeLensId: null,
      selectedCellIndex: null,
      activeMode: 'explain',
      response: null,
    });
    expect(html).toContain('レンズ未選択');
  });

  it('shows Japanese "セル未選択" when selectedCellIndex is null (v2.4)', () => {
    const html = renderLensAwareGuidePanelHTML({
      activeLensId: null,
      selectedCellIndex: null,
      activeMode: 'explain',
      response: null,
    });
    expect(html).toContain('セル未選択');
  });
});
