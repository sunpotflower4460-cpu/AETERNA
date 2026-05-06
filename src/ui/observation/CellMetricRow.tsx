/**
 * CellMetricRow.tsx
 * v1.7: Deep Inspector / Time Replay — Cell Metric Row
 *
 * A single row in the Cell Inspector Panel displaying one CellObservation
 * metric.  Clicking the row triggers focusMetric and activates the
 * corresponding Visual Lens.
 *
 * Design principles:
 * - Displays real observation values only; undefined → "(not observed)".
 * - No fake values, no synthetic measurements.
 * - Click triggers lens activation — no runtime dynamics are modified.
 * - Value Kind badge is shown per metric.
 * - Warnings are shown in small text below the value.
 *
 * Reference: docs/deep-inspector-time-replay.md §4
 */

import type { MetricLensId } from '../lens/metricLensRegistry.ts';

// ── CellMetricRowData ─────────────────────────────────────────────────────────

export interface CellMetricRowData {
    /** CellObservation field path (e.g. 'geometry.gaussianCurvature') */
    metricId: string;
    /** Human-readable label */
    label: string;
    /** Raw numeric value (undefined = not observed) */
    value: number | undefined | null;
    /** Unit string */
    unit: string;
    /** Epistemic status */
    valueKind: 'measured' | 'derived' | 'proxy' | 'unavailable';
    /** Corresponding Visual Lens ID, or null */
    lensId: MetricLensId | null;
    /** Optional warning text */
    warning?: string;
    /** Whether this row is currently active/selected */
    active?: boolean;
    /** Optional confidence 0–1 */
    confidence?: number;
    /** Optional unit scale description */
    scale?: string;
}

// ── formatMetricValue ─────────────────────────────────────────────────────────

/**
 * Format a metric value for display.
 * Returns "(not observed)" for undefined/null/non-finite values.
 */
export function formatMetricValue(
    value: number | undefined | null,
    unit: string,
): string {
    if (value === undefined || value === null) return '(not observed)';
    if (!Number.isFinite(value)) return '(non-finite)';
    const abs = Math.abs(value);
    const digits = abs < 0.001 ? 6 : abs < 1 ? 4 : 3;
    const formatted = value.toFixed(digits);
    return unit ? `${formatted} ${unit}` : formatted;
}

// ── VALUE_KIND_COLORS ─────────────────────────────────────────────────────────

export const VALUE_KIND_COLORS: Record<string, string> = {
    measured:                '#34d399',
    derived:                 '#60a5fa',
    proxy:                   '#fbbf24',
    unavailable:             '#6b7280',
    check:                   '#a78bfa',
    reference:               '#94a3b8',
    raw:                     '#e5e7eb',
    'presentation-smoothed': '#6ee7b7',
};

// ── renderCellMetricRowHTML ───────────────────────────────────────────────────

/**
 * Render a CellMetricRow as an HTML string (for vanilla DOM injection).
 *
 * @param row      - CellMetricRowData
 * @param onClick  - String expression for onclick handler (optional)
 */
const VALUE_KIND_TOOLTIPS: Record<string, string> = {
    measured:    '観測バッファから直接読んだ値',
    derived:     '実測・内部状態から計算された導出値',
    proxy:       '観測補助指標。直接証明ではありません',
    unavailable: '未観測',
};

export function renderCellMetricRowHTML(
    row: CellMetricRowData,
    onClickAttr = '',
): string {
    const valueStr = formatMetricValue(row.value, row.unit);
    const kindColor = VALUE_KIND_COLORS[row.valueKind] ?? '#6b7280';
    const kindTooltip = VALUE_KIND_TOOLTIPS[row.valueKind] ?? '';
    const activeClass = row.active ? ' cell-metric-row--active' : '';
    const unavailableClass = row.valueKind === 'unavailable' ? ' cell-metric-row--unavailable' : '';
    const clickAttr = onClickAttr ? ` onclick="${onClickAttr}"` : '';

    const warningHtml = row.warning
        ? `<span class="cell-metric-row__warning" title="${_esc(row.warning)}">⚠ ${_esc(row.warning)}</span>`
        : '';

    const confidenceHtml = row.confidence !== undefined
        ? `<span class="cell-metric-row__confidence">conf: ${row.confidence.toFixed(2)}</span>`
        : '';

    const lensShortcutHtml = row.lensId
        ? `<span class="cell-metric-row__lens-shortcut" title="View in lens">→ Lens</span>`
        : '';

    return `<div
  class="cell-metric-row${activeClass}${unavailableClass}"
  data-metric-id="${_esc(row.metricId)}"
  data-lens-id="${row.lensId ? _esc(row.lensId) : ''}"
  role="button"
  tabindex="0"
  ${clickAttr}
>
  <span class="cell-metric-row__label">${_esc(row.label)}</span>
  <span class="cell-metric-row__value">${_esc(valueStr)}</span>
  ${confidenceHtml}
  <span class="cell-metric-row__kind-badge" style="color:${kindColor}" title="${_esc(kindTooltip)}">[${_esc(row.valueKind)}]</span>
  ${lensShortcutHtml}
  ${warningHtml}
</div>`;
}

function _esc(s: string): string {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
