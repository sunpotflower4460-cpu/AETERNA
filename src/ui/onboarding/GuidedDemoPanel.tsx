/**
 * GuidedDemoPanel.tsx
 * AETERNA-NATURAL v2.5 — Guided Demo Panel
 *
 * Headless HTML-string renderer for the guided demo panel.
 * No JSX — pure template literal rendering.
 */

import type { GuidedDemoConfig } from '../../onboarding/guidedDemoConfig.js';

export interface GuidedDemoPanelProps {
  config: GuidedDemoConfig;
  currentStepNumber: number; // 1-based
  isActive: boolean;
}

export function renderGuidedDemoPanelHTML(props: GuidedDemoPanelProps): string {
  const { config, currentStepNumber, isActive } = props;

  const activeClass = isActive ? ' guided-demo-panel--active' : '';
  const stepIdx = currentStepNumber - 1;
  const currentStep = config.steps[stepIdx] ?? config.steps[0];
  const totalSteps = config.steps.length;

  const stepHtml = currentStep ? `<div class="guided-demo-panel__step">
    <span class="guided-demo-panel__step-num">ステップ ${_esc(currentStep.stepNumber)} / ${_esc(totalSteps)}</span>
    <h3 class="guided-demo-panel__step-title">${_esc(currentStep.titleJa)}</h3>
    <p class="guided-demo-panel__step-desc">${_esc(currentStep.descriptionJa)}</p>
    <span class="guided-demo-panel__step-target" data-target-panel="${_esc(currentStep.targetPanel)}">${_esc(currentStep.actionLabelJa)}</span>
  </div>` : '';

  return `<div class="guided-demo-panel${activeClass}" role="region" aria-label="観測デモ">
  <h2 class="guided-demo-panel__title">観測デモ</h2>
  <div class="guided-demo-panel__disclaimer" role="note">
    <strong>注意:</strong> ${_esc(config.disclaimerJa)}
  </div>
  ${stepHtml}
  <div class="guided-demo-panel__actions">
    <button class="guided-demo-panel__start" type="button" data-action="demo-start">デモを始める</button>
    <button class="guided-demo-panel__next" type="button" data-action="demo-next">次へ</button>
    <button class="guided-demo-panel__skip" type="button" data-action="demo-skip">今は自由に見る</button>
    <button class="guided-demo-panel__restart" type="button" data-action="demo-restart">最初からやり直す</button>
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
