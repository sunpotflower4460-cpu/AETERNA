import { describe, it, expect } from 'vitest';
import { DEFAULT_OBSERVATION_ROUTE_STEPS } from '../../onboarding/defaultObservationRoute.js';

describe('defaultObservationRoute: has 10 steps', () => {
  it('has exactly 10 steps', () => { expect(DEFAULT_OBSERVATION_ROUTE_STEPS.length).toBe(10); });
  it('has all required step IDs', () => {
    const ids = DEFAULT_OBSERVATION_ROUTE_STEPS.map(s => s.id);
    expect(ids).toContain('intro');
    expect(ids).toContain('startSafeObservation');
    expect(ids).toContain('lookAtField');
    expect(ids).toContain('selectCell');
    expect(ids).toContain('inspectCell');
    expect(ids).toContain('openLens');
    expect(ids).toContain('useReplay');
    expect(ids).toContain('checkRelatedSignals');
    expect(ids).toContain('askGuide');
    expect(ids).toContain('exportResult');
  });
  it('each step has Japanese title', () => {
    for (const step of DEFAULT_OBSERVATION_ROUTE_STEPS) {
      expect(step.titleJa.length).toBeGreaterThan(0);
    }
  });
  it('each step has Japanese short description', () => {
    for (const step of DEFAULT_OBSERVATION_ROUTE_STEPS) {
      expect(step.shortDescriptionJa.length).toBeGreaterThan(0);
    }
  });
  it('each step has completionCondition', () => {
    for (const step of DEFAULT_OBSERVATION_ROUTE_STEPS) {
      expect(step.completionCondition).toBeTruthy();
    }
  });
  it('each step has beginnerVisible boolean', () => {
    for (const step of DEFAULT_OBSERVATION_ROUTE_STEPS) {
      expect(typeof step.beginnerVisible).toBe('boolean');
    }
  });
});
