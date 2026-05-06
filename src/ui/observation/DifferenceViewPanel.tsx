/**
 * DifferenceViewPanel.tsx
 * v1.8: Causal Trace / Layer Correlation — Difference View
 *
 * Renders the Difference View panel as an HTML string.
 * Shows before/after/delta for each observation metric between two ticks.
 *
 * Design principles:
 * - Shows real before/after/delta values only — no fabricated data.
 * - largestChanges are highlighted.
 * - Tick range is always shown.
 * - No consciousness / emotion / life / soul / mystical claims.
 * - All output is XSS-safe via _esc().
 *
 * Reference: docs/causal-trace-layer-correlation.md §5
 */

import type { ObservationDifferenceState, ObservationDifferenceItem } from '../../types/observationDifference.ts';

// ── DifferenceViewPanelProps ──────────────────────────────────────────────────

export interface DifferenceViewPanelProps {
    state: ObservationDifferenceState | null;
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

// ── Item row renderer ─────────────────────────────────────────────────────────

function renderDiffItemRowHTML(item: ObservationDifferenceItem, isLargest: boolean): string {
    const before = item.valueBefore !== null ? item.valueBefore.toFixed(5) : '—';
    const after = item.valueAfter !== null ? item.valueAfter.toFixed(5) : '—';
    const delta = item.delta !== null
        ? `${item.delta >= 0 ? '+' : ''}${item.delta.toFixed(5)}`
        : '—';
    const relDelta = item.relativeDelta !== null
        ? `${(item.relativeDelta * 100).toFixed(2)}%`
        : '—';

    const highlightClass = isLargest ? ' diff-view-panel__row--largest' : '';

    return `<tr class="diff-view-panel__row${highlightClass}">
  <td class="diff-view-panel__cell diff-view-panel__cell--label">${_esc(item.label)}</td>
  <td class="diff-view-panel__cell diff-view-panel__cell--kind">${_esc(item.valueKind)}</td>
  <td class="diff-view-panel__cell diff-view-panel__cell--before">${_esc(before)}</td>
  <td class="diff-view-panel__cell diff-view-panel__cell--after">${_esc(after)}</td>
  <td class="diff-view-panel__cell diff-view-panel__cell--delta">${_esc(delta)}</td>
  <td class="diff-view-panel__cell diff-view-panel__cell--rel">${_esc(relDelta)}</td>
</tr>`;
}

// ── renderDifferenceViewPanelHTML ─────────────────────────────────────────────

/**
 * Render the Difference View panel as an HTML string.
 *
 * @param props - DifferenceViewPanelProps
 * @returns HTML string
 */
export function renderDifferenceViewPanelHTML(props: DifferenceViewPanelProps): string {
    const { state } = props;

    if (!state) {
        return `<div class="diff-view-panel diff-view-panel--empty">
  <p class="diff-view-panel__empty-msg">No difference data available. Select two ticks to compare.</p>
</div>`;
    }

    const { beforeTick, afterTick, items, largestChanges, caution } = state;

    const tickRange = `Comparing tick ${_esc(beforeTick)} → tick ${_esc(afterTick)}`;

    const largestIds = new Set(largestChanges.map((it) => it.metricId));

    const rowsHtml = items
        .map((item) => renderDiffItemRowHTML(item, largestIds.has(item.metricId)))
        .join('\n');

    const largestSummaryHtml = largestChanges.length > 0
        ? `<div class="diff-view-panel__largest">
  <div class="diff-view-panel__largest-title">Largest Changes (top ${largestChanges.length})</div>
  <ul class="diff-view-panel__largest-list">
    ${largestChanges.map((it) => {
        const d = it.delta !== null
            ? ` Δ ${it.delta >= 0 ? '+' : ''}${it.delta.toFixed(5)}`
            : '';
        return `<li>${_esc(it.label)}:${_esc(d)}</li>`;
    }).join('\n')}
  </ul>
</div>`
        : '';

    return `<div class="diff-view-panel">
  <div class="diff-view-panel__header">
    <span class="diff-view-panel__title">Difference View</span>
    <span class="diff-view-panel__tick-range">${tickRange}</span>
  </div>
  ${largestSummaryHtml}
  <div class="diff-view-panel__table-container">
    <table class="diff-view-panel__table">
      <thead>
        <tr>
          <th>Metric</th>
          <th>Kind</th>
          <th>Before</th>
          <th>After</th>
          <th>Δ</th>
          <th>Rel Δ</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  </div>
  <div class="diff-view-panel__caution">${_esc(caution)}</div>
</div>`;
}
