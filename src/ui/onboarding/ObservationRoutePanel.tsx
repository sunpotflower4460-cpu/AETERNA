/**
 * ObservationRoutePanel.tsx
 * AETERNA-NATURAL v2.5 — Observation Route Panel
 *
 * Headless HTML-string renderer for the full observation route panel.
 * No JSX — pure template literal rendering.
 */

import type { OnboardingProgressState } from '../../state/onboardingProgressState.js';
import type { ObservationRouteStep } from '../../types/observationRoute.js';
import { renderObservationRouteStepCardHTML } from './ObservationRouteStepCard.js';
import { renderObservationRouteProgressHTML } from './ObservationRouteProgress.js';

export interface ObservationRoutePanelProps {
  state: OnboardingProgressState;
  steps: ObservationRouteStep[];
}

export function renderObservationRoutePanelHTML(props: ObservationRoutePanelProps): string {
  const { state, steps } = props;

  const currentStepIndex = Math.max(
    0,
    steps.findIndex(s => s.id === state.currentStepId),
  );
  const currentStep = steps[currentStepIndex] ?? steps[0];

  const progressHtml = renderObservationRouteProgressHTML({
    currentStepIndex,
    totalSteps: steps.length,
    completedCount: state.completedStepIds.length,
  });

  const stepCardHtml = currentStep
    ? renderObservationRouteStepCardHTML({
        step: currentStep,
        isActive: true,
        isCompleted: state.completedStepIds.includes(currentStep.id),
        beginnerMode: state.beginnerMode,
      })
    : '';

  return `<div class="observation-route-panel" role="region" aria-label="観測ルート">
  <h2 class="observation-route-panel__title">観測ルート</h2>
  ${progressHtml}
  <div class="observation-route-panel__step" role="list">
    ${stepCardHtml}
  </div>
  <div class="observation-route-panel__actions">
    <button class="observation-route-panel__skip" type="button" data-action="skip-step">スキップ</button>
    <button class="observation-route-panel__dismiss" type="button" data-action="dismiss">閉じる</button>
    <button class="observation-route-panel__restart" type="button" data-action="restart">最初から</button>
  </div>
  <div class="observation-route-panel__links">
    <a class="observation-route-panel__glossary-link" data-panel="glossary" href="#glossary" role="button">用語辞典を開く</a>
    <button class="observation-route-panel__safe-reset" type="button" data-action="safe-reset">迷ったら Safe Baseline に戻す</button>
  </div>
</div>`;
}


