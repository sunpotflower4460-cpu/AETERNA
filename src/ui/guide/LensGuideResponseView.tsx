/**
 * LensGuideResponseView.tsx
 * v1.9: Lens-aware AI Guide
 *
 * Renders the LensGuideResponse as an HTML string.
 *
 * Design principles:
 * - Pure HTML string rendering.
 * - Shows all response sections when present.
 * - Claim guard note shown when claimGuardPassed=false.
 * - No LLM / API calls.
 * - All output is XSS-safe via _esc().
 *
 * Reference: docs/lens-aware-ai-guide.md §8
 */

import type { LensGuideResponse } from '../../guide/lensGuideTypes.ts';

// ── LensGuideResponseViewProps ────────────────────────────────────────────────

export interface LensGuideResponseViewProps {
  response: LensGuideResponse | null;
  showClaimGuardNote?: boolean;
}

// ── renderLensGuideResponseViewHTML ───────────────────────────────────────────

/**
 * Render the guide response as an HTML string.
 *
 * @param props - LensGuideResponseViewProps
 * @returns HTML string
 */
export function renderLensGuideResponseViewHTML(props: LensGuideResponseViewProps): string {
  const { response, showClaimGuardNote = true } = props;

  if (!response) {
    return `<div class="lens-guide-response-view lens-guide-response-view--empty">
  <p class="lens-guide-response-view__ready-msg">Guide is ready. Ask a question above.</p>
</div>`;
  }

  const {
    answer,
    observationFacts,
    hypothesisCandidates,
    comparisonNotes,
    cautionNotes,
    suggestedNextLenses,
    suggestedNextPanels,
    claimGuardPassed,
  } = response;

  const isLong = answer.length > 200;
  const answerHtml = isLong
    ? `<div class="lens-guide-response-view__answer">
  <details class="lens-guide-response-view__answer-details">
    <summary class="lens-guide-response-view__answer-summary">${_esc(answer.substring(0, 80))}…</summary>
    <p class="lens-guide-response-view__answer-text">${_esc(answer)}</p>
  </details>
</div>`
    : `<div class="lens-guide-response-view__answer">
  <p class="lens-guide-response-view__answer-text">${_esc(answer)}</p>
</div>`;

  const factsHtml = observationFacts.length > 0
    ? `<div class="lens-guide-response-view__section">
  <div class="lens-guide-response-view__section-title">Observation Facts</div>
  <ul class="lens-guide-response-view__list">
    ${observationFacts.map((f) => `<li class="lens-guide-response-view__list-item">${_esc(f)}</li>`).join('\n    ')}
  </ul>
</div>`
    : '';

  const hypothesisHtml = hypothesisCandidates.length > 0
    ? `<div class="lens-guide-response-view__section">
  <div class="lens-guide-response-view__section-title">Hypothesis Candidates</div>
  <ul class="lens-guide-response-view__list lens-guide-response-view__list--hypothesis">
    ${hypothesisCandidates.map((h) => `<li class="lens-guide-response-view__list-item">${_esc(h)}</li>`).join('\n    ')}
  </ul>
</div>`
    : '';

  const comparisonHtml = comparisonNotes.length > 0
    ? `<div class="lens-guide-response-view__section">
  <div class="lens-guide-response-view__section-title">Comparison Notes</div>
  <ul class="lens-guide-response-view__list">
    ${comparisonNotes.map((c) => `<li class="lens-guide-response-view__list-item">${_esc(c)}</li>`).join('\n    ')}
  </ul>
</div>`
    : '';

  const cautionHtml = cautionNotes.length > 0
    ? `<div class="lens-guide-response-view__section lens-guide-response-view__section--caution">
  <div class="lens-guide-response-view__section-title">⚠ Caution Notes</div>
  <ul class="lens-guide-response-view__list">
    ${cautionNotes.map((c) => `<li class="lens-guide-response-view__list-item">${_esc(c)}</li>`).join('\n    ')}
  </ul>
</div>`
    : '';

  const nextLensesHtml = suggestedNextLenses.length > 0
    ? `<div class="lens-guide-response-view__section">
  <div class="lens-guide-response-view__section-title">Suggested Next Lenses</div>
  <div class="lens-guide-response-view__next-lenses">
    ${suggestedNextLenses.map((l) => `<button
    class="lens-guide-response-view__next-lens-btn"
    onclick="window.dispatchEvent(new CustomEvent('guide:activateLens',{detail:{lensId:'${_esc(l)}'}}))">
    ${_esc(l)}
  </button>`).join('\n    ')}
  </div>
</div>`
    : '';

  const nextPanelsHtml = suggestedNextPanels.length > 0
    ? `<div class="lens-guide-response-view__section">
  <div class="lens-guide-response-view__section-title">Suggested Next Panels</div>
  <div class="lens-guide-response-view__next-panels">
    ${suggestedNextPanels.map((p) => `<span class="lens-guide-response-view__next-panel">${_esc(p)}</span>`).join('\n    ')}
  </div>
</div>`
    : '';

  const claimGuardNoteHtml = showClaimGuardNote && !claimGuardPassed
    ? `<div class="lens-guide-response-view__claim-guard-note">
  <small>claim guard adjusted response</small>
</div>`
    : '';

  return `<div class="lens-guide-response-view">
  ${answerHtml}
  ${factsHtml}
  ${hypothesisHtml}
  ${comparisonHtml}
  ${cautionHtml}
  ${nextLensesHtml}
  ${nextPanelsHtml}
  ${claimGuardNoteHtml}
</div>`;
}

// ── _esc ──────────────────────────────────────────────────────────────────────

function _esc(s: string | undefined | null): string {
  if (s === undefined || s === null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
