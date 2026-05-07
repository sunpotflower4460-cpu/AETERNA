/**
 * NextObservationHint.tsx
 * AETERNA-NATURAL v2.5 — Next Observation Hint
 *
 * Headless HTML-string renderer for the next observation hint.
 * No JSX — pure template literal rendering.
 */

import type { NextObservationHint } from '../../onboarding/deriveNextObservationHint.js';

export interface NextObservationHintProps {
  hint: NextObservationHint | null;
}

export function renderNextObservationHintHTML(props: NextObservationHintProps): string {
  const { hint } = props;
  if (!hint) return '';

  const panelAttr = hint.targetPanel
    ? ` data-panel="${_esc(hint.targetPanel)}"`
    : '';

  return `<div class="next-observation-hint"${panelAttr} role="complementary" aria-label="次のステップのヒント">
  <h4 class="next-observation-hint__title">${_esc(hint.titleJa)}</h4>
  <p class="next-observation-hint__desc">${_esc(hint.descriptionJa)}</p>
  <button class="next-observation-hint__action" type="button" data-hint-action="${_esc(hint.actionLabelJa)}"${panelAttr}>${_esc(hint.actionLabelJa)}</button>
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
