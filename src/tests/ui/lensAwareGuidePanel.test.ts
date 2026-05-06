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
    expect(html).toContain('cell 5');
  });

  it('shows AI Guide header', () => {
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
    expect(html).toContain('AI Guide は観測補助です');
    expect(html).toContain('AETERNA 本体ではありません');
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

  it('shows "no lens active" when activeLensId is null', () => {
    const html = renderLensAwareGuidePanelHTML({
      activeLensId: null,
      selectedCellIndex: null,
      activeMode: 'explain',
      response: null,
    });
    expect(html).toContain('no lens active');
  });

  it('shows "no cell selected" when selectedCellIndex is null', () => {
    const html = renderLensAwareGuidePanelHTML({
      activeLensId: null,
      selectedCellIndex: null,
      activeMode: 'explain',
      response: null,
    });
    expect(html).toContain('no cell selected');
  });
});
