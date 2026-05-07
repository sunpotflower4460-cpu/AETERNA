/**
 * onboardingProgressState.ts
 * AETERNA-NATURAL v2.5 — Onboarding Progress State
 */

import type { ObservationRouteStepId } from '../types/observationRoute.js';

export interface OnboardingProgressState {
  enabled: boolean;
  currentStepId: ObservationRouteStepId;
  completedStepIds: ObservationRouteStepId[];
  firstVisitCompleted: boolean;
  dismissed: boolean;
  beginnerMode: boolean;
  lastUpdatedAt?: number;
}

const STEP_ORDER: ObservationRouteStepId[] = [
  'intro', 'startSafeObservation', 'lookAtField', 'selectCell', 'inspectCell',
  'openLens', 'useReplay', 'checkRelatedSignals', 'askGuide', 'exportResult',
];

export const DEFAULT_ONBOARDING_PROGRESS_STATE: OnboardingProgressState = {
  enabled: true,
  currentStepId: 'intro',
  completedStepIds: [],
  firstVisitCompleted: false,
  dismissed: false,
  beginnerMode: true,
};

export function startOnboarding(state: OnboardingProgressState): OnboardingProgressState {
  return { ...state, enabled: true, dismissed: false, currentStepId: 'intro' };
}

export function completeStep(state: OnboardingProgressState, stepId: ObservationRouteStepId): OnboardingProgressState {
  if (state.completedStepIds.includes(stepId)) return state;
  return {
    ...state,
    completedStepIds: [...state.completedStepIds, stepId],
    lastUpdatedAt: Date.now(),
  };
}

export function goToStep(state: OnboardingProgressState, stepId: ObservationRouteStepId): OnboardingProgressState {
  return { ...state, currentStepId: stepId, lastUpdatedAt: Date.now() };
}

export function nextStep(state: OnboardingProgressState): OnboardingProgressState {
  const idx = STEP_ORDER.indexOf(state.currentStepId);
  if (idx < 0 || idx >= STEP_ORDER.length - 1) {
    return { ...state, firstVisitCompleted: true, lastUpdatedAt: Date.now() };
  }
  return { ...state, currentStepId: STEP_ORDER[idx + 1], lastUpdatedAt: Date.now() };
}

export function dismissOnboarding(state: OnboardingProgressState): OnboardingProgressState {
  return { ...state, dismissed: true, lastUpdatedAt: Date.now() };
}

export function resetOnboarding(state: OnboardingProgressState): OnboardingProgressState {
  return {
    ...DEFAULT_ONBOARDING_PROGRESS_STATE,
    beginnerMode: state.beginnerMode,
    lastUpdatedAt: Date.now(),
  };
}

export function saveOnboardingProgress(state: OnboardingProgressState): void {
  try {
    localStorage.setItem('aeterna_onboarding', JSON.stringify(state));
  } catch (_) { /* ignore */ }
}

export function loadOnboardingProgress(): OnboardingProgressState | null {
  try {
    const raw = localStorage.getItem('aeterna_onboarding');
    if (!raw) return null;
    return JSON.parse(raw) as OnboardingProgressState;
  } catch (_) { return null; }
}

export function isStepCompleted(state: OnboardingProgressState, stepId: ObservationRouteStepId): boolean {
  return state.completedStepIds.includes(stepId);
}

export function getCompletionFraction(state: OnboardingProgressState): number {
  return state.completedStepIds.length / STEP_ORDER.length;
}
