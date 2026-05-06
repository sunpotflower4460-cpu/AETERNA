/**
 * lensGuideResponseView.test.ts
 * v1.9: Lens-aware AI Guide
 *
 * Tests for renderLensGuideResponseViewHTML.
 */

import { describe, it, expect } from 'vitest';
import { renderLensGuideResponseViewHTML } from '../../ui/guide/LensGuideResponseView.tsx';
import type { LensGuideResponse } from '../../guide/lensGuideTypes.ts';

function makeResponse(overrides?: Partial<LensGuideResponse>): LensGuideResponse {
  return {
    mode: 'explain',
    answer: 'The field amplitude is currently 0.55.',
    observationFacts: ['Field amplitude: 0.55', 'Phase coherence: 0.80'],
    hypothesisCandidates: [],
    comparisonNotes: [],
    cautionNotes: ['All values are observer-side measurements.'],
    suggestedNextLenses: ['vortexConfidence', 'phaseCoherence'],
    suggestedNextPanels: ['Cell Inspector', 'Metric Spotlight'],
    confidence: 0.7,
    usedContextKinds: ['lensContext'],
    claimGuardPassed: true,
    blockedClaims: [],
    ...overrides,
  };
}

describe('renderLensGuideResponseViewHTML', () => {
  it('renders null response as ready message', () => {
    const html = renderLensGuideResponseViewHTML({ response: null });
    expect(html).toContain('Guide is ready. Ask a question above.');
  });

  it('renders answer text', () => {
    const html = renderLensGuideResponseViewHTML({ response: makeResponse() });
    expect(html).toContain('The field amplitude is currently 0.55.');
  });

  it('renders observationFacts section', () => {
    const html = renderLensGuideResponseViewHTML({ response: makeResponse() });
    expect(html).toContain('Field amplitude: 0.55');
    expect(html).toContain('Phase coherence: 0.80');
    expect(html).toContain('Observation Facts');
  });

  it('does not render observationFacts section when empty', () => {
    const html = renderLensGuideResponseViewHTML({
      response: makeResponse({ observationFacts: [] }),
    });
    expect(html).not.toContain('Observation Facts');
  });

  it('renders hypothesisCandidates section when present', () => {
    const html = renderLensGuideResponseViewHTML({
      response: makeResponse({
        hypothesisCandidates: ['Vortex confidence elevated — transient organization possible. This is a hypothesis candidate.'],
      }),
    });
    expect(html).toContain('Hypothesis Candidates');
    expect(html).toContain('hypothesis candidate');
  });

  it('does not render hypothesisCandidates section when empty', () => {
    const html = renderLensGuideResponseViewHTML({ response: makeResponse() });
    expect(html).not.toContain('Hypothesis Candidates');
  });

  it('renders cautionNotes section', () => {
    const html = renderLensGuideResponseViewHTML({ response: makeResponse() });
    expect(html).toContain('All values are observer-side measurements.');
    expect(html).toContain('Caution Notes');
  });

  it('renders suggestedNextLenses section', () => {
    const html = renderLensGuideResponseViewHTML({ response: makeResponse() });
    expect(html).toContain('vortexConfidence');
    expect(html).toContain('phaseCoherence');
    expect(html).toContain('Suggested Next Lenses');
  });

  it('does not render suggestedNextLenses when empty', () => {
    const html = renderLensGuideResponseViewHTML({
      response: makeResponse({ suggestedNextLenses: [] }),
    });
    expect(html).not.toContain('Suggested Next Lenses');
  });

  it('renders suggestedNextPanels section', () => {
    const html = renderLensGuideResponseViewHTML({ response: makeResponse() });
    expect(html).toContain('Cell Inspector');
    expect(html).toContain('Metric Spotlight');
    expect(html).toContain('Suggested Next Panels');
  });

  it('renders claimGuardNote when claimGuardPassed=false', () => {
    const html = renderLensGuideResponseViewHTML({
      response: makeResponse({ claimGuardPassed: false }),
      showClaimGuardNote: true,
    });
    expect(html).toContain('claim guard adjusted response');
  });

  it('does not render claimGuardNote when claimGuardPassed=true', () => {
    const html = renderLensGuideResponseViewHTML({
      response: makeResponse({ claimGuardPassed: true }),
      showClaimGuardNote: true,
    });
    expect(html).not.toContain('claim guard adjusted response');
  });

  it('does not render claimGuardNote when showClaimGuardNote=false even if failed', () => {
    const html = renderLensGuideResponseViewHTML({
      response: makeResponse({ claimGuardPassed: false }),
      showClaimGuardNote: false,
    });
    expect(html).not.toContain('claim guard adjusted response');
  });

  it('renders comparisonNotes when present', () => {
    const html = renderLensGuideResponseViewHTML({
      response: makeResponse({
        comparisonNotes: ['Amplitude increased by +0.1 since tick 10.'],
      }),
    });
    expect(html).toContain('Comparison Notes');
    expect(html).toContain('Amplitude increased by +0.1');
  });

  it('XSS-escapes answer text', () => {
    const html = renderLensGuideResponseViewHTML({
      response: makeResponse({ answer: '<script>alert("xss")</script>' }),
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
