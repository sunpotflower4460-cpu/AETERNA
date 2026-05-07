import { describe, it, expect } from 'vitest';
import {
  DEFAULT_ONBOARDING_PROGRESS_STATE,
  startOnboarding,
  completeStep,
  nextStep,
  dismissOnboarding,
  resetOnboarding,
  isStepCompleted,
  getCompletionFraction,
  goToStep,
} from '../../state/onboardingProgressState.js';

const base = DEFAULT_ONBOARDING_PROGRESS_STATE;

describe('startOnboarding', () => {
  it('resets to intro step and enables onboarding', () => {
    const s = startOnboarding({ ...base, currentStepId: 'openLens', dismissed: true });
    expect(s.currentStepId).toBe('intro');
    expect(s.enabled).toBe(true);
    expect(s.dismissed).toBe(false);
  });
});

describe('completeStep', () => {
  it('adds step to completedStepIds', () => {
    const s = completeStep(base, 'intro');
    expect(s.completedStepIds).toContain('intro');
  });

  it('does not duplicate if already completed', () => {
    const s = completeStep(completeStep(base, 'intro'), 'intro');
    expect(s.completedStepIds.filter(id => id === 'intro').length).toBe(1);
  });
});

describe('nextStep', () => {
  it('advances from intro to startSafeObservation', () => {
    const s = nextStep({ ...base, currentStepId: 'intro' });
    expect(s.currentStepId).toBe('startSafeObservation');
  });

  it('marks firstVisitCompleted when at last step', () => {
    const s = nextStep({ ...base, currentStepId: 'exportResult' });
    expect(s.firstVisitCompleted).toBe(true);
  });
});

describe('dismissOnboarding', () => {
  it('sets dismissed to true', () => {
    const s = dismissOnboarding(base);
    expect(s.dismissed).toBe(true);
  });
});

describe('resetOnboarding', () => {
  it('resets to default state preserving beginnerMode', () => {
    const modified = { ...base, currentStepId: 'openLens' as const, beginnerMode: false };
    const s = resetOnboarding(modified);
    expect(s.currentStepId).toBe('intro');
    expect(s.beginnerMode).toBe(false);
    expect(s.completedStepIds).toHaveLength(0);
  });
});

describe('isStepCompleted', () => {
  it('returns false for uncompleted step', () => {
    expect(isStepCompleted(base, 'intro')).toBe(false);
  });

  it('returns true for completed step', () => {
    const s = completeStep(base, 'intro');
    expect(isStepCompleted(s, 'intro')).toBe(true);
  });
});

describe('getCompletionFraction', () => {
  it('returns 0 when no steps completed', () => {
    expect(getCompletionFraction(base)).toBe(0);
  });

  it('returns 0.5 when 5 steps completed', () => {
    let s = base;
    const ids = ['intro', 'startSafeObservation', 'lookAtField', 'selectCell', 'inspectCell'] as const;
    for (const id of ids) s = completeStep(s, id);
    expect(getCompletionFraction(s)).toBe(0.5);
  });
});

describe('goToStep', () => {
  it('sets currentStepId to given step', () => {
    const s = goToStep(base, 'openLens');
    expect(s.currentStepId).toBe('openLens');
  });
});
