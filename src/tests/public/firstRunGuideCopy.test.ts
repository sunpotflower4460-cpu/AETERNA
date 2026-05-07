/**
 * firstRunGuideCopy.test.ts
 * AETERNA-NATURAL v2.2 — First Run Guide Copy Tests
 *
 * Tests that FirstRunGuide has the correct v2.2 structure and copy.
 */

import { describe, it, expect } from 'vitest';
import {
  FIRST_RUN_GUIDE_STEPS,
  createFirstRunGuideState,
  advanceGuideStep,
  dismissGuide,
  getCurrentStep,
  renderFullGuideText,
  renderFullGuideMarkdown,
} from '../../ui/onboarding/FirstRunGuide.tsx';

describe('FirstRunGuide — v2.2', () => {
  it('has exactly 5 steps', () => {
    expect(FIRST_RUN_GUIDE_STEPS.length).toBe(5);
  });

  it('step numbers are 1 through 5', () => {
    for (let i = 0; i < 5; i++) {
      expect(FIRST_RUN_GUIDE_STEPS[i].stepNumber).toBe(i + 1);
    }
  });

  it('step 1 explains what the system is and what it is not', () => {
    const step = FIRST_RUN_GUIDE_STEPS[0];
    const body = step.bodyLines.join('\n').toLowerCase();
    expect(body).toContain('observation lab');
    expect(body).toContain('not');
    expect(body).toContain('consciousness');
  });

  it('step 1 does not claim consciousness/life/intelligence proof', () => {
    const step = FIRST_RUN_GUIDE_STEPS[0];
    const body = step.bodyLines.join('\n').toLowerCase();
    // The step says "not a proof of X" — that is correct negation.
    // Check that it does not claim "X proved" or "X is proof"
    expect(body).not.toMatch(/consciousness\s+proved|consciousness\s+is\s+proof/);
    expect(body).not.toMatch(/life\s+proved|life\s+is\s+proof/);
    expect(body).not.toMatch(/intelligence\s+proved|intelligence\s+is\s+proof/);
  });

  it('step 3 mentions Cell Inspector', () => {
    const step = FIRST_RUN_GUIDE_STEPS[2];
    const body = step.bodyLines.join('\n');
    expect(body).toContain('Cell Inspector');
  });

  it('step 4 mentions Replay as snapshot display, not time travel', () => {
    const step = FIRST_RUN_GUIDE_STEPS[3];
    const body = step.bodyLines.join('\n').toLowerCase();
    expect(body).toContain('replay');
    expect(body).toContain('snapshot');
  });

  it('step 5 mentions the Observation Guide shortcuts', () => {
    const step = FIRST_RUN_GUIDE_STEPS[4];
    const body = step.bodyLines.join('\n');
    expect(body).toContain('これなに');
    expect(body).toContain('どう仮説');
  });

  it('step 5 includes caution for "これは証明になる？"', () => {
    const step = FIRST_RUN_GUIDE_STEPS[4];
    const body = step.bodyLines.join('\n');
    expect(body).toContain('証明ではありません');
  });

  it('no step uses LLM or external API', () => {
    for (const step of FIRST_RUN_GUIDE_STEPS) {
      const body = step.bodyLines.join('\n').toLowerCase();
      // "no llm / api" or "has no llm" is fine (negation) — just not "uses llm" or "via api"
      expect(body).not.toMatch(/\buses llm\b|\bvia api\b|\bcalls external llm\b/i);
    }
  });

  it('state machine starts at step 1', () => {
    const state = createFirstRunGuideState();
    expect(state.currentStep).toBe(1);
    expect(state.dismissed).toBe(false);
  });

  it('state machine advances through all steps and then dismisses', () => {
    let state = createFirstRunGuideState();
    for (let i = 0; i < 5; i++) {
      state = advanceGuideStep(state);
    }
    expect(state.dismissed).toBe(true);
  });

  it('dismissGuide sets dismissed=true immediately', () => {
    const state = createFirstRunGuideState();
    expect(dismissGuide(state).dismissed).toBe(true);
  });

  it('getCurrentStep returns the correct step', () => {
    const state = createFirstRunGuideState();
    const step = getCurrentStep(state);
    expect(step).not.toBeNull();
    expect(step!.stepNumber).toBe(1);
  });

  it('renderFullGuideText includes all step titles', () => {
    const text = renderFullGuideText().join('\n');
    for (const step of FIRST_RUN_GUIDE_STEPS) {
      expect(text).toContain(step.title);
    }
  });

  it('renderFullGuideMarkdown includes AETERNA-NATURAL header', () => {
    const md = renderFullGuideMarkdown();
    expect(md).toContain('# AETERNA-NATURAL');
  });
});
