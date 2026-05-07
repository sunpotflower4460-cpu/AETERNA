/**
 * ObservationTermCard.tsx
 * v2.4: AETERNA-NATURAL Japanese-First UI — Observation Term Card
 *
 * Renders a single term card showing:
 *   - Japanese label
 *   - English label (in researcher/developer mode)
 *   - Internal ID (in developer mode)
 *   - Short description
 *   - What it shows
 *   - What it is NOT
 *   - Value kind badge
 *   - Next to look (optional)
 *   - High/low value hints (optional)
 *   - Caution note
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
import type { ObservationDisplayModeConfig } from '../../config/observationDisplayModeConfig.ts';
import { getValueKindJaLabel, getValueKindTooltip } from '../../i18n/valueKindLabelsJa.ts';

// ── renderObservationTermCardHTML ─────────────────────────────────────────────

export interface ObservationTermCardProps {
    term: ObservationTermDefinition;
    config: ObservationDisplayModeConfig;
    /** Whether to show long description (default: false) */
    expanded?: boolean;
}

export function renderObservationTermCardHTML(props: ObservationTermCardProps): string {
    const { term, config, expanded = false } = props;
    const {
        showInternalIds,
        showEnglishLabels,
    } = config;

    const kindLabel = term.valueKind ? getValueKindJaLabel(term.valueKind) : '';
    const kindTooltip = term.valueKind ? getValueKindTooltip(term.valueKind) : '';

    const internalIdHtml = showInternalIds && term.internalId
        ? `<div class="term-card__internal-id">
             <span class="term-card__label">内部ID:</span>
             <code class="term-card__code">${_esc(term.internalId)}</code>
           </div>`
        : '';

    const enLabelHtml = showEnglishLabels && term.enLabel
        ? `<span class="term-card__en-label">${_esc(term.enLabel)}</span>`
        : '';

    const kindBadgeHtml = kindLabel
        ? `<span
             class="term-card__kind-badge"
             title="${_esc(kindTooltip)}"
             aria-label="${_esc(term.valueKind ?? '')}"
           >${_esc(kindLabel)}</span>`
        : '';

    const longDescHtml = expanded
        ? `<p class="term-card__long-desc">${_esc(term.longDescriptionJa)}</p>`
        : '';

    const highLowHtml =
        expanded && (term.highValueHintJa || term.lowValueHintJa)
            ? `<div class="term-card__hints">
                 ${term.highValueHintJa
                     ? `<div class="term-card__hint term-card__hint--high">
                          <span class="term-card__hint-label">値が高い時:</span>
                          ${_esc(term.highValueHintJa)}
                        </div>`
                     : ''}
                 ${term.lowValueHintJa
                     ? `<div class="term-card__hint term-card__hint--low">
                          <span class="term-card__hint-label">値が低い時:</span>
                          ${_esc(term.lowValueHintJa)}
                        </div>`
                     : ''}
               </div>`
            : '';

    const nextToLookHtml = expanded && term.nextToLookJa
        ? `<div class="term-card__next">
             <span class="term-card__label">次に見るもの:</span>
             ${_esc(term.nextToLookJa)}
           </div>`
        : '';

    return `<div
  class="term-card"
  data-term-id="${_esc(term.id)}"
  data-internal-id="${_esc(term.internalId ?? '')}"
  aria-label="${_esc(term.jaLabel)}"
>
  <div class="term-card__header">
    <span class="term-card__ja-label">${_esc(term.jaLabel)}</span>
    ${enLabelHtml}
    ${kindBadgeHtml}
  </div>
  ${internalIdHtml}
  <p class="term-card__short-desc">${_esc(term.shortDescriptionJa)}</p>
  ${longDescHtml}
  <div class="term-card__what-shows">
    <span class="term-card__label">何を見る値か:</span>
    ${_esc(term.whatItShowsJa)}
  </div>
  <div class="term-card__what-not">
    <span class="term-card__label">何ではないか:</span>
    ${_esc(term.whatItIsNotJa)}
  </div>
  ${highLowHtml}
  ${nextToLookHtml}
  <div class="term-card__caution">
    <span class="term-card__label">注意:</span>
    ${_esc(term.cautionJa)}
  </div>
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
