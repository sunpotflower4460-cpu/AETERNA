/**
 * ObservedRatioInvolvementPanel.tsx
 * v1.8: Causal Trace / Layer Correlation
 *
 * Renders the Observed Ratio Involvement panel as an HTML string.
 * Shows ratio components for the selected cell, or "unavailable" when missing.
 *
 * Design principles:
 * - Shows "unavailable" when component data is missing — never fabricates.
 * - Epistemic caution note is always shown.
 * - No consciousness / emotion / life / soul / mystical claims.
 * - All output is XSS-safe via _esc().
 *
 * Reference: docs/causal-trace-layer-correlation.md §6
 */

import type { ObservedRatioInvolvement } from '../../observation/buildObservedRatioInvolvement.ts';

// ── ObservedRatioInvolvementPanelProps ────────────────────────────────────────

export interface ObservedRatioInvolvementPanelProps {
    involvements: ObservedRatioInvolvement[];
    cellIndex: number;
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

// ── renderObservedRatioInvolvementPanelHTML ───────────────────────────────────

/**
 * Render the Observed Ratio Involvement panel as an HTML string.
 *
 * @param props - ObservedRatioInvolvementPanelProps
 * @returns HTML string
 */
export function renderObservedRatioInvolvementPanelHTML(props: ObservedRatioInvolvementPanelProps): string {
    const { involvements, cellIndex } = props;

    const epistemicNote = `<div class="ratio-involvement-panel__epistemic">
  <strong>Epistemic note:</strong>
  Ratio involvement is observational only. It does not imply that a cell is
  causally controlling a ratio. Component lists are structural proxies only.
</div>`;

    if (involvements.length === 0) {
        return `<div class="ratio-involvement-panel ratio-involvement-panel--empty">
  ${epistemicNote}
  <p class="ratio-involvement-panel__empty-msg">Cell ${_esc(cellIndex)} is not involved in any observed ratios.</p>
</div>`;
    }

    const itemsHtml = involvements.map((inv) => {
        const componentsText = inv.componentCellIndices.length > 0
            ? `cells: [${inv.componentCellIndices.map(String).join(', ')}]`
            : '(unavailable)';

        const eventsText = inv.componentEventIds.length > 0
            ? `events: [${inv.componentEventIds.slice(0, 5).map(_esc).join(', ')}${inv.componentEventIds.length > 5 ? '…' : ''}]`
            : 'events: none';

        const matchText = inv.closestReferenceLabel
            ? `closest ref: ${_esc(inv.closestReferenceLabel)} (strength: ${inv.matchStrength !== undefined ? inv.matchStrength.toFixed(3) : '—'})`
            : 'no reference match';

        const numDenText = inv.numeratorLabel && inv.denominatorLabel
            ? `${_esc(inv.numeratorLabel)} / ${_esc(inv.denominatorLabel)}`
            : '(labels unavailable)';

        return `<div class="ratio-involvement-panel__item">
  <div class="ratio-involvement-panel__item-header">
    <span class="ratio-involvement-panel__item-id">${_esc(inv.observedRatioId)}</span>
    <span class="ratio-involvement-panel__item-source">${_esc(inv.source)}</span>
    <span class="ratio-involvement-panel__item-value">value: ${_esc(inv.value.toFixed(4))}</span>
  </div>
  <div class="ratio-involvement-panel__item-formula">${numDenText}</div>
  <div class="ratio-involvement-panel__item-components">${componentsText}</div>
  <div class="ratio-involvement-panel__item-events">${eventsText}</div>
  <div class="ratio-involvement-panel__item-match">${matchText}</div>
  <div class="ratio-involvement-panel__item-caution">${_esc(inv.caution)}</div>
</div>`;
    }).join('\n');

    return `<div class="ratio-involvement-panel">
  <div class="ratio-involvement-panel__header">
    <span class="ratio-involvement-panel__title">Observed Ratio Involvement</span>
    <span class="ratio-involvement-panel__cell">cell ${_esc(cellIndex)}</span>
    <span class="ratio-involvement-panel__count">${_esc(involvements.length)} ratio(s)</span>
  </div>
  ${epistemicNote}
  <div class="ratio-involvement-panel__items">
    ${itemsHtml}
  </div>
  <div class="ratio-involvement-panel__guide-actions">
    <button onclick="window.dispatchEvent(new CustomEvent('guide:ask',{detail:{question:'What does this ratio mean?',mode:'explain'}}))">What does this ratio mean?</button>
  </div>
</div>`;
}
