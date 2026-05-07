/**
 * finalPublicDemoFlow.test.ts
 * AETERNA-NATURAL v2.3 — Deployment Final Runbook — Public Demo Flow
 *
 * Verifies the startup / initial navigation flow for public research demo:
 *
 *   Step 1: PublicResearchLanding is present and has correct content
 *   Step 2: FirstRunGuide is present
 *   Step 3: "Start Safe Observation" action exists in RecommendedDemoFlow
 *   Step 4: PublicInterpretationNote is present
 *   Step 5: ObservationWorkspace container is present
 *   Step 6: ObservationHeader is present
 *   Step 7: Runtime Mode Bar / HUD indicator is referenced
 *   Step 8: Safe Baseline preset is defined
 *   Step 9: Landing "What this is not" section exists
 *   Step 10: No "proof" language in landing text
 *
 * All checks are structural (source text / export value checks).
 * No browser / React rendering is performed.
 *
 * Reference: docs/deployment-final-runbook-report.md §4
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

import { AETERNA_NATURAL_PRESETS } from '../../config/aeternaNaturalPresets.js';
import {
  PUBLIC_LANDING_NO_PROOF_NOTE,
  LANDING_WHAT_THIS_IS_NOT_EN,
} from '../../ui/public/PublicResearchLanding.js';
import { FIRST_RUN_GUIDE_STEPS } from '../../ui/onboarding/FirstRunGuide.js';
import { RECOMMENDED_DEMO_FLOW } from '../../ui/public/RecommendedDemoFlow.js';
import { PUBLIC_SCENARIO_DISPLAY_LIST } from '../../scenario/publicResearchScenarioSet.js';

const ROOT = resolve(__dirname, '../../..');

function read(rel: string): string {
  const p = resolve(ROOT, rel);
  if (!existsSync(p)) return '';
  return readFileSync(p, 'utf-8');
}

function exists(rel: string): boolean {
  return existsSync(resolve(ROOT, rel));
}

// ── Step 1: PublicResearchLanding ──────────────────────────────────────────────

describe('v2.3 demo flow — step 1: PublicResearchLanding content', () => {
  it('PublicResearchLanding.tsx exists', () => {
    expect(exists('src/ui/public/PublicResearchLanding.tsx')).toBe(true);
  });

  it('PUBLIC_LANDING_NO_PROOF_NOTE is defined and non-empty', () => {
    expect(typeof PUBLIC_LANDING_NO_PROOF_NOTE).toBe('string');
    expect(PUBLIC_LANDING_NO_PROOF_NOTE.length).toBeGreaterThan(10);
  });

  it('No-proof note mentions "not proof"', () => {
    expect(PUBLIC_LANDING_NO_PROOF_NOTE.toLowerCase()).toContain('not proof');
  });

  it('LANDING_WHAT_THIS_IS_NOT_EN has at least 3 items', () => {
    expect(LANDING_WHAT_THIS_IS_NOT_EN.length).toBeGreaterThanOrEqual(3);
  });

  it('"What this is not" includes "Not a proof of consciousness"', () => {
    const combined = LANDING_WHAT_THIS_IS_NOT_EN.join(' ').toLowerCase();
    expect(combined).toContain('not a proof of consciousness');
  });

  it('"What this is not" includes "Not a proof of life"', () => {
    const combined = LANDING_WHAT_THIS_IS_NOT_EN.join(' ').toLowerCase();
    expect(combined).toContain('not a proof of life');
  });

  it('"What this is not" does not use affirmative proof claims', () => {
    const combined = LANDING_WHAT_THIS_IS_NOT_EN.join(' ').toLowerCase();
    expect(combined).not.toContain('consciousness proved');
    expect(combined).not.toContain('life proved');
  });
});

// ── Step 2: FirstRunGuide ──────────────────────────────────────────────────────

describe('v2.3 demo flow — step 2: FirstRunGuide', () => {
  it('FirstRunGuide.tsx exists', () => {
    expect(exists('src/ui/onboarding/FirstRunGuide.tsx')).toBe(true);
  });

  it('FIRST_RUN_GUIDE_STEPS has at least 3 steps', () => {
    expect(FIRST_RUN_GUIDE_STEPS.length).toBeGreaterThanOrEqual(3);
  });

  it('First step title is defined and non-empty', () => {
    expect(FIRST_RUN_GUIDE_STEPS[0].title).toBeTruthy();
  });

  it('No guide step contains affirmative proof language', () => {
    for (const step of FIRST_RUN_GUIDE_STEPS) {
      const text = (step.title + ' ' + step.bodyLines.join(' ')).toLowerCase();
      expect(text).not.toContain('consciousness proved');
      expect(text).not.toContain('life proved');
      expect(text).not.toContain('aeterna is alive');
    }
  });
});

// ── Step 3: RecommendedDemoFlow ────────────────────────────────────────────────

describe('v2.3 demo flow — step 3: RecommendedDemoFlow', () => {
  it('RecommendedDemoFlow.tsx exists', () => {
    expect(exists('src/ui/public/RecommendedDemoFlow.tsx')).toBe(true);
  });

  it('RECOMMENDED_DEMO_FLOW has at least 5 steps', () => {
    expect(RECOMMENDED_DEMO_FLOW.length).toBeGreaterThanOrEqual(5);
  });

  it('Start Safe Observation step is present', () => {
    const actions = RECOMMENDED_DEMO_FLOW.map((s) => s.action);
    expect(actions.some((a) => a.includes('Start Safe Observation'))).toBe(true);
  });

  it('No step action contains "proof"', () => {
    for (const step of RECOMMENDED_DEMO_FLOW) {
      const text = (step.action + ' ' + step.detail).toLowerCase();
      expect(text).not.toContain('proves');
      expect(text).not.toContain('proved');
    }
  });
});

// ── Step 4: PublicInterpretationNote ──────────────────────────────────────────

describe('v2.3 demo flow — step 4: PublicInterpretationNote', () => {
  it('PublicInterpretationNote.tsx exists', () => {
    expect(exists('src/ui/public/PublicInterpretationNote.tsx')).toBe(true);
  });

  it('Source contains "observation" language', () => {
    const src = read('src/ui/public/PublicInterpretationNote.tsx');
    expect(src.toLowerCase()).toContain('observation');
  });

  it('Source does not contain affirmative proof claim "consciousness proved"', () => {
    const src = read('src/ui/public/PublicInterpretationNote.tsx');
    expect(src).not.toContain('consciousness proved');
  });
});

// ── Step 5-6: ObservationWorkspace / ObservationHeader ────────────────────────

describe('v2.3 demo flow — steps 5-6: ObservationWorkspace / ObservationHeader', () => {
  it('ObservationWorkspace.tsx exists', () => {
    expect(exists('src/ui/observation/ObservationWorkspace.tsx')).toBe(true);
  });

  it('ObservationHeader.tsx exists', () => {
    expect(exists('src/ui/observation/ObservationHeader.tsx')).toBe(true);
  });

  it('ObservationWorkspace references field-view container', () => {
    const src = read('src/ui/observation/ObservationWorkspace.tsx');
    expect(src).toContain('field-view');
  });
});

// ── Step 7: Runtime Mode Bar ───────────────────────────────────────────────────

describe('v2.3 demo flow — step 7: runtime mode indicator', () => {
  it('index.html contains Runtime Mode HUD (nm-chip)', () => {
    const src = read('index.html');
    expect(src).toContain('nm-chip');
  });
});

// ── Step 8: Safe Baseline preset ──────────────────────────────────────────────

describe('v2.3 demo flow — step 8: safe baseline preset', () => {
  it('safeBaseline preset is defined', () => {
    const preset = AETERNA_NATURAL_PRESETS.find((p) => p.id === 'safeBaseline');
    expect(preset).toBeDefined();
  });

  it('safeBaseline preset description does not contain proof claim', () => {
    const preset = AETERNA_NATURAL_PRESETS.find((p) => p.id === 'safeBaseline');
    if (preset) {
      const text = (preset.name + ' ' + preset.description).toLowerCase();
      expect(text).not.toContain('consciousness proved');
      expect(text).not.toContain('life proved');
    }
  });
});

// ── Step 9-10: Scenario display list ──────────────────────────────────────────

describe('v2.3 demo flow — step 9-10: public scenario display', () => {
  it('PUBLIC_SCENARIO_DISPLAY_LIST has beginner group', () => {
    const beginners = PUBLIC_SCENARIO_DISPLAY_LIST.filter((e) => e.group === 'beginner');
    expect(beginners.length).toBeGreaterThan(0);
  });

  it('PUBLIC_SCENARIO_DISPLAY_LIST has observation group', () => {
    const obs = PUBLIC_SCENARIO_DISPLAY_LIST.filter((e) => e.group === 'observation');
    expect(obs.length).toBeGreaterThan(0);
  });

  it('Scenario descriptions do not contain affirmative proof claims', () => {
    for (const entry of PUBLIC_SCENARIO_DISPLAY_LIST) {
      const text = entry.oneLineDescription.toLowerCase();
      expect(text).not.toContain('consciousness proved');
      expect(text).not.toContain('life proved');
      expect(text).not.toContain('aeterna is alive');
    }
  });
});
