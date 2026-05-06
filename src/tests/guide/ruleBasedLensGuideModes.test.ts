/**
 * ruleBasedLensGuideModes.test.ts
 * v1.9: Lens-aware AI Guide
 *
 * Tests for answerLensGuideRequest across all 5 modes.
 */

import { describe, it, expect } from 'vitest';
import { answerLensGuideRequest } from '../../guide/ruleBasedLensGuide.ts';
import { hasForbiddenClaim } from '../../ui/guide/guideClaimGuard.ts';
import type { LensGuideRequest } from '../../guide/lensGuideTypes.ts';
import type { LensContextPacket } from '../../ui/lens/lensContextPacket.ts';
import type { CellObservation } from '../../types/cellObservation.ts';

function makeCellObservation(): CellObservation {
  return {
    timestamp: 1000,
    tick: 42,
    cellIndex: 5,
    segments: 16,
    geometry: {
      i: 0, j: 5,
      majorAngle: 0.2, minorAngle: 0.3,
      regionLabel: 'outerRim',
      areaElement: 1.2,
      gaussianCurvature: 0.04,
      meanCurvature: 0.1,
      innerOuterBias: 0.7,
    },
    field: {
      amplitude: 0.55,
      phase: 1.2,
      phaseCoherenceLocal: 0.8,
      flowContinuityLocal: 0.6,
      energyThroughputLocal: 0.33,
    },
    vortex: { candidateConfidence: 0.7, topologicalCharge: 1, phaseWinding: 6.28 },
    membrane: { deformation: 0.3, tension: 0.2, permeability: 0.5, returnImprint: 0.1, twoSidedness: 0.4 },
    plasticity: { accumulatedTrace: 0.15, resistanceScale: 1.05 },
    ratios: { strongestMatchId: null, strongestMatchStrength: 0.6 },
    events: { recentEventIds: [], recentEventCount: 0 },
    diagnostics: {
      valueKinds: {
        geometry: 'measured', field: 'derived', vortex: 'proxy',
        membrane: 'proxy', plasticity: 'proxy', ratios: 'proxy', events: 'measured',
      },
      missingFieldCount: 0,
      hasUnavailableSource: false,
    },
  } as CellObservation;
}

function makeRequest(mode: LensGuideRequest['mode']): LensGuideRequest {
  const obs = makeCellObservation();
  const lensContext: LensContextPacket = {
    timestamp: Date.now(),
    tick: 42,
    cellObservation: obs,
    activeLens: null,
    highlightedMetricValue: undefined,
    contextSummary: 'cell index=5 — full cell overview',
    epistemicNote: 'Multiple observer-side metrics shown.',
    isReplayMode: false,
  };
  return {
    mode,
    userQuestion: 'test question',
    lensContext,
  };
}

// Collect all text output from a response for claim checking
function allResponseText(r: ReturnType<typeof answerLensGuideRequest>): string {
  return [
    r.answer,
    ...r.observationFacts,
    ...r.hypothesisCandidates,
    ...r.comparisonNotes,
    ...r.cautionNotes,
    ...r.suggestedNextLenses,
    ...r.suggestedNextPanels,
  ].join(' ');
}

describe('answerLensGuideRequest', () => {
  describe('explain mode', () => {
    it('returns observationFacts', () => {
      const r = answerLensGuideRequest(makeRequest('explain'));
      expect(r.observationFacts.length).toBeGreaterThan(0);
    });

    it('returns cautionNotes', () => {
      const r = answerLensGuideRequest(makeRequest('explain'));
      expect(r.cautionNotes.length).toBeGreaterThan(0);
    });

    it('mode is explain', () => {
      const r = answerLensGuideRequest(makeRequest('explain'));
      expect(r.mode).toBe('explain');
    });

    it('suggests next panels', () => {
      const r = answerLensGuideRequest(makeRequest('explain'));
      expect(r.suggestedNextPanels).toContain('Cell Inspector');
    });
  });

  describe('hypothesis mode', () => {
    it('returns hypothesisCandidates', () => {
      const r = answerLensGuideRequest(makeRequest('hypothesis'));
      expect(r.hypothesisCandidates.length).toBeGreaterThan(0);
    });

    it('hypothesisCandidates include "not a conclusion" language', () => {
      const r = answerLensGuideRequest(makeRequest('hypothesis'));
      const allHyp = r.hypothesisCandidates.join(' ');
      expect(allHyp.toLowerCase()).toContain('not a conclusion');
    });

    it('cautionNotes say hypotheses are not proof', () => {
      const r = answerLensGuideRequest(makeRequest('hypothesis'));
      const allCaution = r.cautionNotes.join(' ');
      expect(allCaution.toLowerCase()).toContain('not proof');
    });

    it('suggests Causal Trace panel', () => {
      const r = answerLensGuideRequest(makeRequest('hypothesis'));
      expect(r.suggestedNextPanels).toContain('Causal Trace');
    });
  });

  describe('compare mode', () => {
    it('returns comparisonNotes (may be empty without diff context)', () => {
      const r = answerLensGuideRequest(makeRequest('compare'));
      expect(Array.isArray(r.comparisonNotes)).toBe(true);
    });

    it('cautionNotes include correlation-is-not-causation', () => {
      const r = answerLensGuideRequest(makeRequest('compare'));
      const allCaution = r.cautionNotes.join(' ');
      expect(allCaution.toLowerCase()).toContain('causation');
    });

    it('suggests Difference View panel', () => {
      const r = answerLensGuideRequest(makeRequest('compare'));
      expect(r.suggestedNextPanels).toContain('Difference View');
    });
  });

  describe('caution mode', () => {
    it('returns cautionNotes with no-proof language', () => {
      const r = answerLensGuideRequest(makeRequest('caution'));
      const allCaution = r.cautionNotes.join(' ');
      expect(allCaution).toContain('NOT direct proof');
    });

    it('cautionNotes include no consciousness/life/intelligence claims statement', () => {
      const r = answerLensGuideRequest(makeRequest('caution'));
      const allCaution = r.cautionNotes.join(' ');
      expect(allCaution.toLowerCase()).toContain('consciousness');
    });

    it('suggests Causal Trace panel', () => {
      const r = answerLensGuideRequest(makeRequest('caution'));
      expect(r.suggestedNextPanels).toContain('Causal Trace');
    });
  });

  describe('nextObservation mode', () => {
    it('returns suggestedNextLenses', () => {
      const r = answerLensGuideRequest(makeRequest('nextObservation'));
      expect(r.suggestedNextLenses.length).toBeGreaterThan(0);
    });

    it('returns suggestedNextPanels', () => {
      const r = answerLensGuideRequest(makeRequest('nextObservation'));
      expect(r.suggestedNextPanels.length).toBeGreaterThan(0);
    });

    it('cautionNotes note suggestions only', () => {
      const r = answerLensGuideRequest(makeRequest('nextObservation'));
      const allCaution = r.cautionNotes.join(' ');
      expect(allCaution.toLowerCase()).toContain('suggestion');
    });
  });

  describe('no forbidden claims in any mode', () => {
    const modes: LensGuideRequest['mode'][] = ['explain', 'hypothesis', 'compare', 'caution', 'nextObservation'];
    for (const mode of modes) {
      it(`${mode} mode produces no forbidden claims`, () => {
        const r = answerLensGuideRequest(makeRequest(mode));
        const text = allResponseText(r);
        expect(hasForbiddenClaim(text)).toBe(false);
      });
    }

    it('no "consciousness" claim in any mode', () => {
      for (const mode of modes) {
        const r = answerLensGuideRequest(makeRequest(mode));
        const text = allResponseText(r);
        // "consciousness" is allowed only in a denial context ("no claims about consciousness")
        // hasForbiddenClaim checks for specific forbidden patterns
        expect(hasForbiddenClaim(text)).toBe(false);
      }
    });
  });

  describe('claimGuardPassed', () => {
    it('is true by default for all modes', () => {
      const modes: LensGuideRequest['mode'][] = ['explain', 'hypothesis', 'compare', 'caution', 'nextObservation'];
      for (const mode of modes) {
        const r = answerLensGuideRequest(makeRequest(mode));
        expect(r.claimGuardPassed).toBe(true);
      }
    });
  });

  describe('confidence', () => {
    it('is 0.7 (rule-based default)', () => {
      const r = answerLensGuideRequest(makeRequest('explain'));
      expect(r.confidence).toBe(0.7);
    });
  });
});
