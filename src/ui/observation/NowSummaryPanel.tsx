/**
 * NowSummaryPanel.tsx
 * AETERNA-NATURAL v2.7 — Now Summary Panel (Multi-section)
 *
 * Renders a NowSummaryPanelState as an HTML panel string.
 *
 * Design principles:
 * - Pure HTML string rendering — no React JSX.
 * - All user/data content is XSS-safe via _esc().
 * - Beginner mode: shows overallOneLineJa + beginnerSummaryJa + vitalStem + bodyWorldLoop + suggestions
 * - Researcher mode: shows all 8 sections with details
 * - Always shows claimGuardJa disclaimer.
 * - Always shows Safe Baseline button (dispatches 'nowSummary:safeBaselineCompare' CustomEvent).
 * - No consciousness/life/intelligence proof claims.
 *
 * Reference: docs/now-summary-panel.md
 */

import type { NowSummaryPanelState } from '../../types/nowSummary.ts';
import { renderNowSummarySectionCardHTML } from './NowSummarySectionCard.tsx';

// ── NowSummaryPanelV27Props ───────────────────────────────────────────────────

export interface NowSummaryPanelV27Props {
    state: NowSummaryPanelState;
    displayMode?: 'beginner' | 'researcher' | 'developer';
}

// ── renderNowSummaryPanelV27HTML ──────────────────────────────────────────────

/**
 * Render the v2.7 Now Summary Panel as an HTML string.
 *
 * @param props - NowSummaryPanelV27Props
 * @returns HTML string
 */
export function renderNowSummaryPanelV27HTML(props: NowSummaryPanelV27Props): string {
    const { state, displayMode = 'beginner' } = props;

    // timestamp is a number (epoch ms), safe to interpolate directly without _esc()
    const safeBaselineButton = `<button
  class="now-summary-panel-v27__safe-baseline-btn"
  onclick="window.dispatchEvent(new CustomEvent('nowSummary:safeBaselineCompare',{detail:{timestamp:${state.timestamp}}}))">
  Safe Baselineと比較する
</button>`;

    const claimGuardHtml = `<div class="now-summary-panel-v27__claim-guard">
  <small>⚠ ${_esc(state.claimGuardJa)}</small>
</div>`;

    if (displayMode === 'beginner') {
        const beginnerSections = state.sections.filter(
            (s) => s.id === 'vitalStem' || s.id === 'bodyWorldLoop',
        );
        const sectionCardsHtml = beginnerSections.map((s) =>
            renderNowSummarySectionCardHTML({ section: s, showDetails: false }),
        ).join('\n');

        const suggestionsHtml = state.suggestedNextObservations.length > 0
            ? `<div class="now-summary-panel-v27__suggestions">
    <span class="now-summary-panel-v27__suggestions-label">次の観測候補:</span>
    <ul>${state.suggestedNextObservations.map((s) => `<li>${_esc(s)}</li>`).join('')}</ul>
  </div>`
            : '';

        return `<div class="now-summary-panel-v27 now-summary-panel-v27--beginner">
  <div class="now-summary-panel-v27__header">
    <span class="now-summary-panel-v27__title">今起きていること</span>
    <span class="now-summary-panel-v27__mode-badge">かんたん</span>
  </div>
  <div class="now-summary-panel-v27__overall">
    <p class="now-summary-panel-v27__overall-line">${_esc(state.overallOneLineJa)}</p>
  </div>
  <div class="now-summary-panel-v27__beginner-summary">
    <p>${_esc(state.beginnerSummaryJa)}</p>
  </div>
  <div class="now-summary-panel-v27__sections">
    ${sectionCardsHtml}
  </div>
  ${suggestionsHtml}
  ${safeBaselineButton}
  ${claimGuardHtml}
</div>`;
    }

    // Researcher / developer mode: show all sections with details
    const showSourceMetrics = displayMode === 'developer';
    const allSectionsHtml = state.sections.map((s) =>
        renderNowSummarySectionCardHTML({ section: s, showDetails: true, showSourceMetrics }),
    ).join('\n');

    const changesHtml = state.strongestObservedChanges.length > 0
        ? `<div class="now-summary-panel-v27__changes">
    <span class="now-summary-panel-v27__changes-label">最も強い変化:</span>
    <ul>${state.strongestObservedChanges.map((c) => `<li>${_esc(c)}</li>`).join('')}</ul>
  </div>`
        : '';

    const suggestionsHtml = state.suggestedNextObservations.length > 0
        ? `<div class="now-summary-panel-v27__suggestions">
    <span class="now-summary-panel-v27__suggestions-label">次の観測候補:</span>
    <ul>${state.suggestedNextObservations.map((s) => `<li>${_esc(s)}</li>`).join('')}</ul>
  </div>`
        : '';

    return `<div class="now-summary-panel-v27 now-summary-panel-v27--${_esc(displayMode)}">
  <div class="now-summary-panel-v27__header">
    <span class="now-summary-panel-v27__title">今起きていること</span>
    <span class="now-summary-panel-v27__mode-badge">${_esc(displayMode)}</span>
    <span class="now-summary-panel-v27__confidence">全体信頼度: ${_esc(state.confidence)}</span>
  </div>
  <div class="now-summary-panel-v27__overall">
    <p class="now-summary-panel-v27__overall-line">${_esc(state.overallOneLineJa)}</p>
  </div>
  <div class="now-summary-panel-v27__researcher-summary">
    <pre class="now-summary-panel-v27__researcher-summary-pre">${_esc(state.researcherSummaryJa)}</pre>
  </div>
  <div class="now-summary-panel-v27__sections">
    ${allSectionsHtml}
  </div>
  ${changesHtml}
  ${suggestionsHtml}
  ${safeBaselineButton}
  ${claimGuardHtml}
</div>`;
}

// ── _esc ──────────────────────────────────────────────────────────────────────

function _esc(s: string | number | undefined | null): string {
    if (s === undefined || s === null) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
