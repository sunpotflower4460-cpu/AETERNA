import { describe, it, expect } from 'vitest';
import { renderObservationRoutePanelHTML } from '../../ui/onboarding/ObservationRoutePanel.js';
import { DEFAULT_OBSERVATION_ROUTE_STEPS } from '../../onboarding/defaultObservationRoute.js';
import { DEFAULT_ONBOARDING_PROGRESS_STATE } from '../../state/onboardingProgressState.js';

const baseState = DEFAULT_ONBOARDING_PROGRESS_STATE;
const steps = DEFAULT_OBSERVATION_ROUTE_STEPS;

describe('ObservationRoutePanel: renders current step', () => {
  it('renders the panel container', () => {
    const html = renderObservationRoutePanelHTML({ state: baseState, steps });
    expect(html).toContain('observation-route-panel');
  });

  it('renders the current step title', () => {
    const html = renderObservationRoutePanelHTML({ state: baseState, steps });
    expect(html).toContain('はじめに');
  });

  it('renders progress indicator', () => {
    const html = renderObservationRoutePanelHTML({ state: baseState, steps });
    expect(html).toContain('observation-route-progress');
  });
});

describe('ObservationRoutePanel: buttons', () => {
  it('renders skip button with data-action="skip-step"', () => {
    const html = renderObservationRoutePanelHTML({ state: baseState, steps });
    expect(html).toContain('data-action="skip-step"');
  });

  it('renders dismiss button with data-action="dismiss"', () => {
    const html = renderObservationRoutePanelHTML({ state: baseState, steps });
    expect(html).toContain('data-action="dismiss"');
  });

  it('renders restart button with data-action="restart"', () => {
    const html = renderObservationRoutePanelHTML({ state: baseState, steps });
    expect(html).toContain('data-action="restart"');
  });
});

describe('ObservationRoutePanel: links', () => {
  it('renders glossary link with data-panel="glossary"', () => {
    const html = renderObservationRoutePanelHTML({ state: baseState, steps });
    expect(html).toContain('data-panel="glossary"');
  });

  it('renders safe baseline button with data-action="safe-reset"', () => {
    const html = renderObservationRoutePanelHTML({ state: baseState, steps });
    expect(html).toContain('data-action="safe-reset"');
  });
});
