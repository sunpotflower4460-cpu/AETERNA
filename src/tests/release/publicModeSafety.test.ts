/**
 * publicModeSafety.test.ts
 * AETERNA-NATURAL v1.4 — Public Mode Safety Tests
 *
 * Confirms:
 * - Public landing component text does not assert proof claims
 * - PublicInterpretationNote mentions "not proof" or equivalent
 * - isPublicSafeScenario('quietBaseline') === true
 * - isPublicSafeScenario('fullNaturalLongRun') === false
 * - isAdvancedExperiment('E14_longRunNaturalComparison') === true
 */

import { describe, it, expect } from 'vitest';

import {
  PUBLIC_LANDING_TITLE,
  PUBLIC_LANDING_NO_PROOF_NOTE,
  PUBLIC_LANDING_DESCRIPTION_EN,
  renderPublicLandingText,
} from '../../ui/public/PublicResearchLanding.js';

import {
  INTERPRETATION_NOTE_LINES,
  renderInterpretationNoteText,
} from '../../ui/public/PublicInterpretationNote.js';

import {
  isPublicSafeScenario,
  PUBLIC_SAFE_SCENARIO_IDS,
  ADVANCED_SCENARIO_IDS,
} from '../../scenario/publicResearchScenarioSet.js';

import {
  isAdvancedExperiment,
  ADVANCED_EXPERIMENT_IDS,
} from '../../scenario/publicPresetExperimentSet.js';

// ── Forbidden proof claim patterns ─────────────────────────────────────────────

const FORBIDDEN_PROOF_CLAIMS = [
  'consciousness proved',
  'life proved',
  'intelligence proved',
  'healing proof',
  'mystical proof',
  'soul resonance',
  'ai became alive',
  'aeterna is conscious',
  'aeterna wants',
  'aeterna feels',
  'proves consciousness',
  'proves life',
  'proves intelligence',
];

function containsProhibitedClaim(text: string): string | null {
  const lower = text.toLowerCase();
  for (const claim of FORBIDDEN_PROOF_CLAIMS) {
    if (lower.includes(claim)) return claim;
  }
  return null;
}

// ── PublicResearchLanding copy safety ─────────────────────────────────────────

describe('PublicResearchLanding — no proof claims', () => {
  it('title contains no proof claims', () => {
    expect(containsProhibitedClaim(PUBLIC_LANDING_TITLE)).toBeNull();
  });

  it('no-proof note does not assert proof', () => {
    expect(containsProhibitedClaim(PUBLIC_LANDING_NO_PROOF_NOTE)).toBeNull();
  });

  it('description EN contains no proof claims', () => {
    expect(containsProhibitedClaim(PUBLIC_LANDING_DESCRIPTION_EN)).toBeNull();
  });

  it('rendered landing text contains no proof claims', () => {
    const lines = renderPublicLandingText();
    for (const line of lines) {
      const hit = containsProhibitedClaim(line);
      expect(hit).toBeNull();
    }
  });

  it('no-proof note mentions "not proof" or equivalent', () => {
    const lower = PUBLIC_LANDING_NO_PROOF_NOTE.toLowerCase();
    const mentionsNegation =
      lower.includes('not proof') ||
      lower.includes('not a proof') ||
      lower.includes('observations are observations');
    expect(mentionsNegation).toBe(true);
  });
});

// ── PublicInterpretationNote — "not proof" content ────────────────────────────

describe('PublicInterpretationNote — not proof content', () => {
  it('interpretation note lines contain "not proof" or equivalent', () => {
    const allText = INTERPRETATION_NOTE_LINES.map(l => l.text).join('\n').toLowerCase();
    const mentionsNegation =
      allText.includes('not proof') ||
      allText.includes('not a proof') ||
      allText.includes('not proof of') ||
      allText.includes('are not proof');
    expect(mentionsNegation).toBe(true);
  });

  it('rendered interpretation note contains no proof claims', () => {
    const lines = renderInterpretationNoteText();
    for (const line of lines) {
      const hit = containsProhibitedClaim(line);
      expect(hit).toBeNull();
    }
  });

  it('at least one note line mentions "not proof"', () => {
    const hasNotProof = INTERPRETATION_NOTE_LINES.some(
      l => l.text.toLowerCase().includes('not proof'),
    );
    expect(hasNotProof).toBe(true);
  });
});

// ── Scenario classification safety ────────────────────────────────────────────

describe('isPublicSafeScenario', () => {
  it('quietBaseline is public safe', () => {
    expect(isPublicSafeScenario('quietBaseline')).toBe(true);
  });

  it('fullNaturalLongRun is not public safe', () => {
    expect(isPublicSafeScenario('fullNaturalLongRun')).toBe(false);
  });

  it('no advanced scenario ID is in PUBLIC_SAFE_SCENARIO_IDS', () => {
    for (const id of ADVANCED_SCENARIO_IDS) {
      expect(PUBLIC_SAFE_SCENARIO_IDS).not.toContain(id);
    }
  });
});

// ── Experiment classification safety ──────────────────────────────────────────

describe('isAdvancedExperiment', () => {
  it('E14_longRunNaturalComparison is advanced', () => {
    expect(isAdvancedExperiment('E14_longRunNaturalComparison')).toBe(true);
  });

  it('ADVANCED_EXPERIMENT_IDS contains E14_longRunNaturalComparison', () => {
    expect(ADVANCED_EXPERIMENT_IDS).toContain('E14_longRunNaturalComparison');
  });
});
