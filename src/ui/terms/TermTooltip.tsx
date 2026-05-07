/**
 * TermTooltip.tsx
 * v2.4: AETERNA-NATURAL Japanese-First UI — Term Tooltip
 *
 * Renders a lightweight tooltip for a term, showing:
 *   - Japanese label
 *   - Short description
 *   - What it is NOT (brief)
 *   - Value kind badge
 *   - Link hint to open full glossary entry
 *
 * Design principles:
 * - Pure HTML string rendering — no React JSX.
 * - XSS-safe via _esc().
 * - Japanese-first.
 * - No consciousness / life / intelligence proof claims.
 *
 * Reference: docs/japanese-first-ui-terminology.md §8
 */

import type { ObservationTermDefinition } from '../../i18n/observationTermsJa.ts';
import { getValueKindJaLabel, getValueKindTooltip } from '../../i18n/valueKindLabelsJa.ts';
import { esc as _esc } from './htmlEsc.ts';

// ── renderTermTooltipHTML ─────────────────────────────────────────────────────

export interface TermTooltipProps {
    term: ObservationTermDefinition;
    /** Show the "open glossary" hint */
    showGlossaryHint?: boolean;
}

export function renderTermTooltipHTML(props: TermTooltipProps): string {
    const { term, showGlossaryHint = true } = props;

    const kindLabel = term.valueKind ? getValueKindJaLabel(term.valueKind) : '';
    const kindTooltip = term.valueKind ? getValueKindTooltip(term.valueKind) : '';

    const kindBadgeHtml = kindLabel
        ? `<span
             class="term-tooltip__kind"
             title="${_esc(kindTooltip)}"
           >${_esc(kindLabel)}</span>`
        : '';

    const glossaryHintHtml = showGlossaryHint
        ? `<div class="term-tooltip__glossary-hint">
             詳細は用語辞典で確認できます。
           </div>`
        : '';

    return `<div
  class="term-tooltip"
  role="tooltip"
  data-term-id="${_esc(term.id)}"
  aria-label="${_esc(term.jaLabel)} - tooltip"
>
  <div class="term-tooltip__header">
    <span class="term-tooltip__ja-label">${_esc(term.jaLabel)}</span>
    ${kindBadgeHtml}
  </div>
  <p class="term-tooltip__desc">${_esc(term.shortDescriptionJa)}</p>
  <div class="term-tooltip__not">
    <span class="term-tooltip__label">何ではないか:</span>
    ${_esc(term.whatItIsNotJa)}
  </div>
  ${glossaryHintHtml}
</div>`;
}
