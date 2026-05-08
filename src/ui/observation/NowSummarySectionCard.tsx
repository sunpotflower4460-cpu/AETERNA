/**
 * NowSummarySectionCard.tsx
 * AETERNA-NATURAL v2.7 — Now Summary Section Card
 *
 * Renders a single NowSummarySection as an HTML card string.
 *
 * Design principles:
 * - Pure HTML string rendering — no React JSX.
 * - All user/data content is XSS-safe via _esc().
 * - No consciousness/life/intelligence proof claims.
 *
 * Reference: docs/now-summary-panel.md
 */

import type { NowSummarySection, NowSummarySeverity, NowSummaryConfidence } from '../../types/nowSummary.ts';

// ── NowSummarySectionCardProps ────────────────────────────────────────────────

export interface NowSummarySectionCardProps {
    section: NowSummarySection;
    showDetails?: boolean;
    showSourceMetrics?: boolean;
}

// ── Severity / Confidence label helpers ───────────────────────────────────────

function _severityLabel(s: NowSummarySeverity): string {
    switch (s) {
        case 'calm':       return '安定';
        case 'active':     return '活性';
        case 'strained':   return '過負荷';
        case 'recovering': return '回復中';
        case 'unstable':   return '不安定';
        case 'unknown':    return '不明';
    }
}

function _confidenceLabel(c: NowSummaryConfidence): string {
    switch (c) {
        case 'high':        return '高';
        case 'medium':      return '中';
        case 'low':         return '低';
        case 'insufficient': return '不足';
    }
}

// ── renderNowSummarySectionCardHTML ───────────────────────────────────────────

/**
 * Render a NowSummarySection as an HTML card string.
 *
 * @param props - NowSummarySectionCardProps
 * @returns HTML string
 */
export function renderNowSummarySectionCardHTML(props: NowSummarySectionCardProps): string {
    const { section, showDetails = false, showSourceMetrics = false } = props;

    const detailsHtml = showDetails && section.detailsJa.length > 0
        ? `<ul class="now-summary-section-card__details">
      ${section.detailsJa.map((d) => `<li>${_esc(d)}</li>`).join('\n      ')}
    </ul>`
        : '';

    const cautionsHtml = section.cautionsJa.length > 0
        ? `<div class="now-summary-section-card__cautions">
      ${section.cautionsJa.map((c) => `<p class="now-summary-section-card__caution">⚠ ${_esc(c)}</p>`).join('\n      ')}
    </div>`
        : '';

    const sourceMetricsHtml = showSourceMetrics && section.sourceMetricIds.length > 0
        ? `<div class="now-summary-section-card__source-metrics">
      <small>ソース指標: ${_esc(section.sourceMetricIds.join(', '))}</small>
    </div>`
        : '';

    return `<div class="now-summary-section-card now-summary-section-card--${_esc(section.id)}" data-section-id="${_esc(section.id)}">
  <div class="now-summary-section-card__header">
    <span class="now-summary-section-card__title">${_esc(section.titleJa)}</span>
    <span class="now-summary-section-card__severity now-summary-section-card__severity--${_esc(section.severity)}">${_esc(_severityLabel(section.severity))}</span>
    <span class="now-summary-section-card__confidence">信頼度: ${_esc(_confidenceLabel(section.confidence))}</span>
  </div>
  <p class="now-summary-section-card__one-line">${_esc(section.oneLineJa)}</p>
  ${detailsHtml}
  ${cautionsHtml}
  ${sourceMetricsHtml}
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
