/**
 * ConsciousnessCandidateConditionsPanel.tsx
 * AETERNA-NATURAL v2.7 — Consciousness Candidate Conditions Panel
 *
 * Renders a list of ConsciousnessCandidateCondition items as an HTML panel.
 *
 * Design principles:
 * - Pure HTML string rendering — no React JSX.
 * - All user/data content is XSS-safe via _esc().
 * - ALWAYS shows disclaimer: not a proof of consciousness.
 * - No consciousness/life/intelligence proof claims.
 *
 * Reference: docs/now-summary-panel.md
 */

import type { ConsciousnessCandidateCondition, ConsciousnessCandidateConditionStatus } from '../../types/nowSummary.ts';

// ── ConsciousnessCandidateConditionsPanelProps ────────────────────────────────

export interface ConsciousnessCandidateConditionsPanelProps {
    conditions: ConsciousnessCandidateCondition[];
    showReasons?: boolean;
}

// ── Status label helpers ──────────────────────────────────────────────────────

function _statusLabel(s: ConsciousnessCandidateConditionStatus): string {
    switch (s) {
        case 'observed':    return '観測';
        case 'weak':        return '弱観測';
        case 'notObserved': return '非観測';
        case 'insufficient': return '観測値不足';
    }
}

// ── renderConsciousnessCandidateConditionsPanelHTML ───────────────────────────

/**
 * Render the consciousness candidate conditions panel as an HTML string.
 *
 * Always includes disclaimer that this is NOT a proof of consciousness.
 *
 * @param props - ConsciousnessCandidateConditionsPanelProps
 * @returns HTML string
 */
export function renderConsciousnessCandidateConditionsPanelHTML(
    props: ConsciousnessCandidateConditionsPanelProps,
): string {
    const { conditions, showReasons = false } = props;

    const DISCLAIMER =
        'これは意識の証明ではありません。意識が宿るかもしれない前提条件の一部を観測可能な指標として整理したものです。';

    const conditionsHtml = conditions.map((c) => {
        const reasonHtml = showReasons
            ? `<p class="consciousness-conditions-panel__reason">${_esc(c.reasonJa)}</p>`
            : '';
        return `<div class="consciousness-conditions-panel__condition consciousness-conditions-panel__condition--${_esc(c.status)}" data-condition-id="${_esc(c.id)}">
      <span class="consciousness-conditions-panel__label">${_esc(c.labelJa)}</span>
      <span class="consciousness-conditions-panel__status">${_esc(_statusLabel(c.status))}</span>
      ${reasonHtml}
      <p class="consciousness-conditions-panel__caution"><small>⚠ ${_esc(c.cautionJa)}</small></p>
    </div>`;
    }).join('\n  ');

    return `<div class="consciousness-conditions-panel">
  <div class="consciousness-conditions-panel__header">
    <span class="consciousness-conditions-panel__title">意識候補条件</span>
  </div>
  <div class="consciousness-conditions-panel__disclaimer">
    <p>⚠ ${_esc(DISCLAIMER)}</p>
  </div>
  <div class="consciousness-conditions-panel__list">
    ${conditionsHtml}
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
