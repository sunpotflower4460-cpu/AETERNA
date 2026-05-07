/**
 * ObservationRouteStepCard.tsx
 * AETERNA-NATURAL v2.5 — Observation Route Step Card
 *
 * Headless HTML-string renderer for a single observation route step card.
 * No JSX — pure template literal rendering.
 */

import type { ObservationRouteStep } from '../../types/observationRoute.js';

export interface ObservationRouteStepCardProps {
  step: ObservationRouteStep;
  isActive: boolean;
  isCompleted: boolean;
  beginnerMode: boolean;
}

export function renderObservationRouteStepCardHTML(props: ObservationRouteStepCardProps): string {
  const { step, isActive, isCompleted, beginnerMode } = props;

  const activeClass = isActive ? ' observation-route-step-card--active' : '';
  const completedClass = isCompleted ? ' observation-route-step-card--completed' : '';
  const statusLabel = isCompleted ? '✓ 完了' : isActive ? '▶ 進行中' : '';

  const cautionHtml = step.cautionJa && beginnerMode
    ? `<p class="observation-route-step-card__caution" role="note">⚠ ${_esc(step.cautionJa)}</p>`
    : '';

  return `<div
  class="observation-route-step-card${activeClass}${completedClass}"
  data-step-id="${_esc(step.id)}"
  role="listitem"
>
  <div class="observation-route-step-card__header">
    <span class="observation-route-step-card__id">${_esc(step.id)}</span>
    ${statusLabel ? `<span class="observation-route-step-card__status">${statusLabel}</span>` : ''}
  </div>
  <h3 class="observation-route-step-card__title">${_esc(step.titleJa)}</h3>
  <p class="observation-route-step-card__desc">${_esc(step.shortDescriptionJa)}</p>
  <button
    class="observation-route-step-card__action"
    data-step-action="${_esc(step.id)}"
    type="button"
  >${_esc(step.actionLabelJa)}</button>
  ${cautionHtml}
</div>`;
}

function _esc(s: string | number | undefined | null): string {
  if (s === undefined || s === null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
