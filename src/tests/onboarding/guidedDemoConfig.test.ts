import { describe, it, expect } from 'vitest';
import { DEFAULT_GUIDED_DEMO_CONFIG } from '../../onboarding/guidedDemoConfig.js';

describe('guidedDemoConfig: 7 steps', () => {
  it('has exactly 7 steps', () => {
    expect(DEFAULT_GUIDED_DEMO_CONFIG.steps.length).toBe(7);
  });

  it('first step is Safe Baseline', () => {
    const first = DEFAULT_GUIDED_DEMO_CONFIG.steps[0];
    expect(first.titleJa).toContain('Safe Baseline');
  });

  it('has a disclaimer', () => {
    expect(DEFAULT_GUIDED_DEMO_CONFIG.disclaimerJa.length).toBeGreaterThan(0);
  });

  it('disclaimer does not guarantee results', () => {
    const d = DEFAULT_GUIDED_DEMO_CONFIG.disclaimerJa;
    expect(d).toContain('保証');
    expect(d).not.toContain('保証します');
  });

  it('each step has Japanese title', () => {
    for (const step of DEFAULT_GUIDED_DEMO_CONFIG.steps) {
      expect(step.titleJa.length).toBeGreaterThan(0);
    }
  });

  it('each step has action label', () => {
    for (const step of DEFAULT_GUIDED_DEMO_CONFIG.steps) {
      expect(step.actionLabelJa.length).toBeGreaterThan(0);
    }
  });
});
