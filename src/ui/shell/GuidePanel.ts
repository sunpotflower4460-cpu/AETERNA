/**
 * GuidePanel.ts
 *
 * Context Panel Migration item 9/9 (Guide), the final item. Unlike Ratio
 * Involvement (PR8h), this one has a genuinely real, already-live data
 * source: `updateMetricsUI.js` builds a full `ExplainableObservationSnapshot`
 * (real OverviewState + NowSummaryState + recent AeternaEvents) every
 * frame for the U6 Guide system, but exports it (`currentExplainableSnapshot`)
 * with zero live consumers — the same "computed but never read" gap as
 * `state.lastDyn` before PR3. `RuntimeAdapter.getExplainableSnapshot()`
 * exposes it; this panel calls the real, rule-based (no LLM/API key)
 * `generateGuide` (src/ui/guide/localGuideEngine.ts) — genuinely
 * CONNECTED, not a reduced-scope substitute.
 *
 * Deliberately NOT reusing `localGuideEngine.ts`'s `renderGuideToDOM` —
 * that function targets fixed legacy DOM element ids
 * (`#guide-current-explanation` etc.) and mutates `document` directly,
 * inconsistent with this codebase's HTML-string-returning render
 * convention used by every other Shell panel. This renderer produces the
 * same `GuideExplanation` content as an HTML string instead, applying
 * the same `sanitizeClaim` pass `renderGuideToDOM` applies before display.
 *
 * Suggestion actions (`openPanel`/`toggleLayer`/etc.) target legacy-only
 * concepts (Research Panel tabs, field layer toggles) that have no
 * Observatory Shell equivalent yet — rendered here as plain informational
 * text (label + reason), not wired to click handlers, rather than firing
 * legacy `window.selectResearchTab`/`CustomEvent` calls the new Shell
 * doesn't otherwise use anywhere.
 */

import { generateGuide } from '../guide/localGuideEngine.js';
import { sanitizeClaim } from '../guide/guideClaimGuard.js';
import type { ExplainableObservationSnapshot } from '../explain/explainableObservationSnapshot.js';
import type { GuideExplanation, GuideSuggestion, GuideGlossaryHint } from '../../types/guideExplanation.js';

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderLines(lines: string[]): string {
  if (lines.length === 0) return '<span class="guide-panel__empty">—</span>';
  return lines.map((l) => `<p class="guide-panel__line">${escapeHtml(sanitizeClaim(l))}</p>`).join('');
}

function renderSuggestions(suggestions: GuideSuggestion[]): string {
  if (suggestions.length === 0) return '<span class="guide-panel__empty">—</span>';
  return suggestions
    .map(
      (s) => `<li class="guide-panel__suggestion">
        <span class="guide-panel__suggestion-label">${escapeHtml(sanitizeClaim(s.label))}</span>
        <span class="guide-panel__suggestion-reason">${escapeHtml(sanitizeClaim(s.reason))}</span>
      </li>`
    )
    .join('');
}

function renderGlossary(hints: GuideGlossaryHint[]): string {
  if (hints.length === 0) return '';
  const rows = hints
    .map(
      (h) => `<li class="guide-panel__glossary-entry">
        <span class="guide-panel__glossary-term">${escapeHtml(h.term)}</span>
        <span class="guide-panel__glossary-def">${escapeHtml(sanitizeClaim(h.shortDefinition))}</span>
      </li>`
    )
    .join('');
  return `<ul class="guide-panel__glossary">${rows}</ul>`;
}

export function renderGuidePanelHTML(snapshot: ExplainableObservationSnapshot | null): string {
  const explanation: GuideExplanation = generateGuide(snapshot);
  const confPct = (explanation.confidence * 100).toFixed(0);

  return `<div class="guide-panel" data-testid="guide-panel">
    <h3 class="guide-panel__title">ガイド <span class="guide-panel__confidence">conf ${confPct}%</span></h3>
    <div class="guide-panel__current">${renderLines(explanation.currentExplanation)}</div>
    <h4 class="guide-panel__subtitle">見るべき場所</h4>
    <ul class="guide-panel__suggestions">${renderSuggestions(explanation.whatToLookAt)}</ul>
    <h4 class="guide-panel__subtitle">次に試せること</h4>
    <ul class="guide-panel__suggestions">${renderSuggestions(explanation.tryNext)}</ul>
    ${renderGlossary(explanation.glossaryHints)}
    <p class="guide-panel__integrity">${explanation.integrityNotes.map((n) => escapeHtml(sanitizeClaim(n))).join(' ')}</p>
  </div>`;
}
