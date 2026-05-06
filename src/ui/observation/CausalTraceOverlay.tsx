/**
 * CausalTraceOverlay.tsx
 * v1.8: Causal Trace / Layer Correlation
 *
 * Renders a compact overlay HTML string showing related cells/events from
 * a CausalTraceResult. Used as an overlay badge layer on torus visualization.
 *
 * Design principles:
 * - Shows related cell/event markers as "(possible relation)" badges.
 * - "not causal proof" note is always present.
 * - No consciousness / emotion / life / soul / mystical claims.
 * - All output is XSS-safe via _esc().
 *
 * Reference: docs/causal-trace-layer-correlation.md §3, §8
 */

import type { CausalTraceResult } from '../../types/causalTrace.ts';

// ── CausalTraceOverlayProps ───────────────────────────────────────────────────

export interface CausalTraceOverlayProps {
    result: CausalTraceResult | null;
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

// ── renderCausalTraceOverlayHTML ──────────────────────────────────────────────

/**
 * Render the Causal Trace overlay as an HTML string.
 *
 * @param props - CausalTraceOverlayProps
 * @returns HTML string
 */
export function renderCausalTraceOverlayHTML(props: CausalTraceOverlayProps): string {
    const { result } = props;

    const notCausalProofNote = `<div class="causal-trace-overlay__note">
  Possible relations only — not causal proof.
</div>`;

    if (!result || result.confidence === 'insufficient') {
        return `<div class="causal-trace-overlay causal-trace-overlay--empty">
  ${notCausalProofNote}
  <span class="causal-trace-overlay__empty">No trace data available.</span>
</div>`;
    }

    // Collect unique related cell indices
    const allCellIndices = new Set<number>();
    const allEventIds = new Set<string>();
    for (const sig of result.possibleContributingSignals) {
        for (const ci of sig.relatedCellIndices) allCellIndices.add(ci);
        for (const eid of sig.relatedEventIds) allEventIds.add(eid);
    }

    const cellBadges = [...allCellIndices]
        .map((ci) => `<span class="causal-trace-overlay__cell-badge" data-cell-index="${_esc(ci)}">cell ${_esc(ci)} (possible relation)</span>`)
        .join('');

    const eventBadges = [...allEventIds]
        .map((eid) => `<span class="causal-trace-overlay__event-badge" data-event-id="${_esc(eid)}">event ${_esc(eid)} (possible relation)</span>`)
        .join('');

    const noBadges = allCellIndices.size === 0 && allEventIds.size === 0;

    return `<div class="causal-trace-overlay">
  ${notCausalProofNote}
  <div class="causal-trace-overlay__badges">
    ${noBadges
        ? '<span class="causal-trace-overlay__no-badges">No related cells or events.</span>'
        : `${cellBadges}${eventBadges}`}
  </div>
</div>`;
}
