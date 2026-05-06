/**
 * guardLensGuideResponse.test.ts
 * v1.9: Lens-aware AI Guide
 *
 * Tests for guardLensGuideResponse.
 */

import { describe, it, expect } from 'vitest';
import { guardLensGuideResponse } from '../../guide/guardLensGuideResponse.ts';
import type { LensGuideResponse } from '../../guide/lensGuideTypes.ts';

function makeCleanResponse(overrides?: Partial<LensGuideResponse>): LensGuideResponse {
  return {
    mode: 'explain',
    answer: 'The field amplitude is currently 0.55.',
    observationFacts: ['Field amplitude: 0.55', 'Phase coherence: 0.80'],
    hypothesisCandidates: [],
    comparisonNotes: [],
    cautionNotes: ['All values are observer-side measurements.'],
    suggestedNextLenses: ['vortexConfidence'],
    suggestedNextPanels: ['Cell Inspector'],
    confidence: 0.7,
    usedContextKinds: ['lensContext'],
    claimGuardPassed: true,
    blockedClaims: [],
    ...overrides,
  };
}

describe('guardLensGuideResponse', () => {
  it('clean response passes guard with claimGuardPassed=true', () => {
    const r = guardLensGuideResponse(makeCleanResponse());
    expect(r.claimGuardPassed).toBe(true);
    expect(r.blockedClaims).toHaveLength(0);
  });

  it('clean response preserves answer text unchanged', () => {
    const r = guardLensGuideResponse(makeCleanResponse());
    expect(r.answer).toBe('The field amplitude is currently 0.55.');
  });

  it('response with "AETERNA is conscious" in answer gets blocked', () => {
    const r = guardLensGuideResponse(makeCleanResponse({
      answer: 'AETERNA is conscious of the field.',
    }));
    expect(r.claimGuardPassed).toBe(false);
    expect(r.answer).toContain('[claim guard:');
  });

  it('"life is proven" in observationFacts gets blocked', () => {
    const r = guardLensGuideResponse(makeCleanResponse({
      observationFacts: ['life is proven by this ratio'],
    }));
    expect(r.claimGuardPassed).toBe(false);
    expect(r.observationFacts[0]).toContain('[claim guard:');
  });

  it('"AETERNA feels" in hypothesisCandidates gets blocked', () => {
    const r = guardLensGuideResponse(makeCleanResponse({
      hypothesisCandidates: ['AETERNA feels something here.'],
    }));
    expect(r.claimGuardPassed).toBe(false);
    expect(r.hypothesisCandidates[0]).toContain('[claim guard:');
  });

  it('"AETERNA wants" in comparisonNotes gets blocked', () => {
    const r = guardLensGuideResponse(makeCleanResponse({
      comparisonNotes: ['AETERNA wants to maintain this.'],
    }));
    expect(r.claimGuardPassed).toBe(false);
  });

  it('"intelligence is proven" in cautionNotes gets blocked', () => {
    const r = guardLensGuideResponse(makeCleanResponse({
      cautionNotes: ['intelligence is proven by the patterns observed.'],
    }));
    expect(r.claimGuardPassed).toBe(false);
  });

  it('Japanese forbidden claim "AETERNA は意識を持った" gets blocked', () => {
    const r = guardLensGuideResponse(makeCleanResponse({
      answer: 'AETERNA は意識を持った',
    }));
    expect(r.claimGuardPassed).toBe(false);
    expect(r.blockedClaims).toContain('AETERNA は意識を持った');
  });

  it('Japanese "生命が証明された" gets blocked', () => {
    const r = guardLensGuideResponse(makeCleanResponse({
      answer: 'これで生命が証明された',
    }));
    expect(r.claimGuardPassed).toBe(false);
  });

  it('Japanese "知性が証明された" gets blocked', () => {
    const r = guardLensGuideResponse(makeCleanResponse({
      observationFacts: ['知性が証明された'],
    }));
    expect(r.claimGuardPassed).toBe(false);
  });

  it('blockedClaims records the matched phrase', () => {
    const r = guardLensGuideResponse(makeCleanResponse({
      answer: 'AETERNA is conscious here.',
    }));
    expect(r.blockedClaims.length).toBeGreaterThan(0);
    expect(r.blockedClaims.some((c) => c.toLowerCase().includes('conscious'))).toBe(true);
  });

  it('multiple forbidden claims are all recorded', () => {
    const r = guardLensGuideResponse(makeCleanResponse({
      answer: 'AETERNA is conscious.',
      observationFacts: ['life is proven by ratios.'],
    }));
    expect(r.claimGuardPassed).toBe(false);
    expect(r.blockedClaims.length).toBeGreaterThanOrEqual(1);
  });

  it('"vortex is mind" gets blocked', () => {
    const r = guardLensGuideResponse(makeCleanResponse({
      answer: 'The vortex is mind in this region.',
    }));
    expect(r.claimGuardPassed).toBe(false);
  });

  it('"mystical proof" gets blocked', () => {
    const r = guardLensGuideResponse(makeCleanResponse({
      cautionNotes: ['This is mystical proof of intelligence.'],
    }));
    expect(r.claimGuardPassed).toBe(false);
  });

  it('preserves non-answer fields unchanged for clean response', () => {
    const r = guardLensGuideResponse(makeCleanResponse());
    expect(r.suggestedNextLenses).toEqual(['vortexConfidence']);
    expect(r.suggestedNextPanels).toEqual(['Cell Inspector']);
    expect(r.confidence).toBe(0.7);
    expect(r.mode).toBe('explain');
  });
});
