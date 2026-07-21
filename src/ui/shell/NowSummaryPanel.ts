/**
 * NowSummaryPanel.ts
 *
 * First real (non-onboarding) Context Pane panel content — the Now
 * Summary migration from master spec §8's PR8 order ("1. Now Summary").
 * Renders the already-live NowSummaryState (src/ui/summary/deriveNowSummary.ts,
 * exposed via src/app/runtime/RuntimeAdapter.ts's getNowSummary()) — does
 * not recompute or duplicate that derivation.
 *
 * PR9 (Research/Developer Separation): each NowSummaryLine already
 * carries a real `source` field (e.g. "DynamicViabilityState.saturationRisk",
 * src/types/nowSummary.ts) that was previously computed but never shown
 * in this panel. When `showRawDiagnostics` (RuntimeCapabilities,
 * src/app/runtime/RuntimeCapabilities.ts — resolved from
 * ReleaseEnvironmentConfig, false by default and always false in Public
 * builds per the kickoff prompt's hard constraint) is true, each line
 * shows its source path — genuine internal metadata, not fabricated,
 * intended for research/developer builds only.
 */

import type { NowSummaryState } from '../../types/nowSummary.js';

export function renderNowSummaryPanelHTML(
  summary: NowSummaryState | null,
  showRawDiagnostics = false
): string {
  if (!summary) {
    return `<div class="now-summary-panel" data-testid="now-summary-panel">
      <p class="now-summary-panel__empty">観測データを待機中…</p>
    </div>`;
  }
  const lines = summary.lines
    .slice()
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 5)
    .map(
      (line) => `<li class="now-summary-panel__line" data-value-kind="${line.valueKind}">
        ${escapeHtml(line.text)}
        ${
          showRawDiagnostics
            ? `<span class="now-summary-panel__source" data-testid="now-summary-panel__source">${escapeHtml(line.source)}</span>`
            : ''
        }
      </li>`
    )
    .join('');
  return `<div class="now-summary-panel" data-testid="now-summary-panel">
    <h3 class="now-summary-panel__title">今の観測</h3>
    <ul class="now-summary-panel__lines">${lines}</ul>
  </div>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
