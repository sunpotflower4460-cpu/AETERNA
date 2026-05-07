/**
 * ObservationGlossaryPanel.tsx
 * v2.4: AETERNA-NATURAL Japanese-First UI — Observation Glossary Panel
 *
 * Renders the full observation glossary panel with:
 *   - Search/filter by term name
 *   - Filter by beginner/researcher visibility
 *   - List of ObservationTermCards
 *   - Each card shows: 何か / 何を見る値か / 何ではないか / 種別
 *
 * Design principles:
 * - Japanese-first display.
 * - Internal IDs visible only in researcher/developer mode.
 * - English labels visible only in researcher/developer mode.
 * - Pure HTML string rendering — no React JSX.
 * - XSS-safe via _esc().
 * - No consciousness / life / intelligence proof claims.
 *
 * Reference: docs/japanese-first-ui-terminology.md §8
 */

import {
    OBSERVATION_TERMS_JA,
    type ObservationTermDefinition,
} from '../../i18n/observationTermsJa.ts';
import type { ObservationDisplayModeConfig } from '../../config/observationDisplayModeConfig.ts';
import { isTermVisibleInMode } from '../../config/observationDisplayModeConfig.ts';
import { renderObservationTermCardHTML } from './ObservationTermCard.tsx';

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ObservationGlossaryPanelProps {
    config: ObservationDisplayModeConfig;
    /** Optional filter string (matches jaLabel / enLabel) */
    filterText?: string;
    /** Whether to show expanded cards */
    expandAll?: boolean;
}

// ── renderObservationGlossaryPanelHTML ────────────────────────────────────────

export function renderObservationGlossaryPanelHTML(
    props: ObservationGlossaryPanelProps,
): string {
    const { config, filterText = '', expandAll = false } = props;

    const visibleTerms = OBSERVATION_TERMS_JA.filter((term) => {
        if (!isTermVisibleInMode(config, term.beginnerVisible, term.researcherVisible)) {
            return false;
        }
        if (filterText) {
            const q = filterText.toLowerCase();
            const matchJa = term.jaLabel.toLowerCase().includes(q);
            const matchEn = (term.enLabel ?? '').toLowerCase().includes(q);
            const matchId = (term.internalId ?? '').toLowerCase().includes(q);
            if (!matchJa && !matchEn && !matchId) return false;
        }
        return true;
    });

    const cardsHtml = visibleTerms.length > 0
        ? visibleTerms
              .map((term: ObservationTermDefinition) =>
                  renderObservationTermCardHTML({ term, config, expanded: expandAll }),
              )
              .join('\n')
        : `<div class="glossary-panel__empty">
             該当する用語が見つかりませんでした。
           </div>`;

    const modeLabel = _modeLabel(config.mode);
    const count = visibleTerms.length;

    return `<div
  class="glossary-panel"
  aria-label="観測用語辞典"
  data-mode="${_esc(config.mode)}"
>
  <div class="glossary-panel__header">
    <span class="glossary-panel__title">観測用語辞典</span>
    <span class="glossary-panel__mode">${_esc(modeLabel)}</span>
    <small class="glossary-panel__count">${_esc(count)} 件</small>
  </div>
  <div class="glossary-panel__note">
    各用語の「何を見る値か」「何ではないか」を確認できます。
    意識・生命・知性・神秘的真理を証明するものではありません。
  </div>
  <div class="glossary-panel__entries" aria-live="polite">
    ${cardsHtml}
  </div>
</div>`;
}

// ── _modeLabel ─────────────────────────────────────────────────────────────────

function _modeLabel(mode: string): string {
    switch (mode) {
        case 'beginner':   return 'はじめて見る';
        case 'standard':   return '通常観測';
        case 'researcher': return '研究者モード';
        case 'developer':  return '開発者モード';
        default:           return mode;
    }
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
