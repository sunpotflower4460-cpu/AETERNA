/**
 * ObservationRouteProgress.tsx
 * AETERNA-NATURAL v2.5 — Observation Route Progress Indicator
 *
 * Headless HTML-string renderer for the progress bar.
 * No JSX — pure template literal rendering.
 */

export interface ObservationRouteProgressProps {
  currentStepIndex: number; // 0-based
  totalSteps: number;
  completedCount: number;
}

export function renderObservationRouteProgressHTML(props: ObservationRouteProgressProps): string {
  const { currentStepIndex, totalSteps, completedCount } = props;
  const stepLabel = _esc(currentStepIndex + 1);
  const totalLabel = _esc(totalSteps);
  const completedLabel = _esc(completedCount);
  const pct = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  return `<div class="observation-route-progress" role="status" aria-label="観測ルート進捗">
  <span class="observation-route-progress__step-label">ステップ ${stepLabel} / ${totalLabel}</span>
  <span class="observation-route-progress__completed-label">${completedLabel} 完了</span>
  <div class="observation-route-progress__bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
    <div class="observation-route-progress__bar-fill" style="width:${pct}%"></div>
  </div>
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
