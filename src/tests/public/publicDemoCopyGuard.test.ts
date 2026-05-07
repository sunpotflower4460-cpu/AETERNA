/**
 * publicDemoCopyGuard.test.ts
 * AETERNA-NATURAL v2.2 — Public Demo Copy Guard Tests
 *
 * Tests that all public-facing copy files do not contain forbidden claims.
 *
 * Checks:
 * - PublicResearchLanding
 * - PublicInterpretationNote
 * - FirstRunGuide
 * - RecommendedDemoFlow
 * - publicResearchScenarioSet
 */

import { describe, it, expect } from 'vitest';
import { renderPublicLandingMarkdown } from '../../ui/public/PublicResearchLanding.tsx';
import { renderInterpretationNoteMarkdown } from '../../ui/public/PublicInterpretationNote.tsx';
import { renderFullGuideMarkdown } from '../../ui/onboarding/FirstRunGuide.tsx';
import { renderRecommendedDemoFlowMarkdown } from '../../ui/public/RecommendedDemoFlow.tsx';
import { PUBLIC_SCENARIO_DISPLAY_LIST } from '../../scenario/publicResearchScenarioSet.ts';

const FORBIDDEN_CLAIMS_EN = [
  'consciousness proved',
  'life proved',
  'intelligence proved',
  'aeterna is alive',
  'aeterna feels',
  'aeterna wants',
  'mystical proof',
  'healing proof',
  'vortex is mind',
  'plasticity is memory',
  'ratio proves truth',
];

const FORBIDDEN_CLAIMS_JA = [
  '意識が証明',
  '生命が証明',
  '知性が証明',
  'aeterna は生きている',
  'aeterna が感じている',
  'aeterna が欲している',
  '神秘の証明',
  '癒しの証明',
  '渦は心',
  '可塑性は記憶',
  '比率が真理を証明',
];

function assertNoClaim(text: string, claims: string[], source: string): void {
  const lower = text.toLowerCase();
  for (const claim of claims) {
    expect(lower, `"${claim}" found in ${source}`).not.toContain(claim.toLowerCase());
  }
}

describe('publicDemoCopyGuard — v2.2', () => {
  it('PublicResearchLanding has no forbidden EN claims', () => {
    const md = renderPublicLandingMarkdown();
    assertNoClaim(md, FORBIDDEN_CLAIMS_EN, 'PublicResearchLanding');
  });

  it('PublicResearchLanding has no forbidden JA claims', () => {
    const md = renderPublicLandingMarkdown();
    assertNoClaim(md, FORBIDDEN_CLAIMS_JA, 'PublicResearchLanding');
  });

  it('PublicInterpretationNote has no forbidden EN claims', () => {
    const md = renderInterpretationNoteMarkdown();
    assertNoClaim(md, FORBIDDEN_CLAIMS_EN, 'PublicInterpretationNote');
  });

  it('FirstRunGuide has no forbidden EN claims', () => {
    const md = renderFullGuideMarkdown();
    assertNoClaim(md, FORBIDDEN_CLAIMS_EN, 'FirstRunGuide');
  });

  it('FirstRunGuide has no forbidden JA claims', () => {
    const md = renderFullGuideMarkdown();
    assertNoClaim(md, FORBIDDEN_CLAIMS_JA, 'FirstRunGuide');
  });

  it('RecommendedDemoFlow has no forbidden EN claims', () => {
    const md = renderRecommendedDemoFlowMarkdown();
    assertNoClaim(md, FORBIDDEN_CLAIMS_EN, 'RecommendedDemoFlow');
  });

  it('RecommendedDemoFlow has no forbidden JA claims', () => {
    const md = renderRecommendedDemoFlowMarkdown();
    assertNoClaim(md, FORBIDDEN_CLAIMS_JA, 'RecommendedDemoFlow');
  });

  it('public scenario display list has no forbidden EN claims', () => {
    const combined = PUBLIC_SCENARIO_DISPLAY_LIST
      .map(e => `${e.oneLineDescription}`)
      .join('\n');
    assertNoClaim(combined, FORBIDDEN_CLAIMS_EN, 'publicScenarioDisplayList');
  });

  it('public scenario display list has no forbidden JA claims', () => {
    const combined = PUBLIC_SCENARIO_DISPLAY_LIST
      .map(e => `${e.oneLineDescriptionJa}`)
      .join('\n');
    assertNoClaim(combined, FORBIDDEN_CLAIMS_JA, 'publicScenarioDisplayList');
  });
});
