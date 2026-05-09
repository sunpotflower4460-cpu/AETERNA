import type { FlowAttributionItem, FlowAttributionReport } from '../../types/observation.ts';

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatNumber(value: number): string {
  return Number.isFinite(value) ? value.toFixed(3) : '0.000';
}

function renderAttributionItem(item: FlowAttributionItem): string {
  return `
    <article class="obs-flow-attribution-item" data-kind="${item.kind}" data-confidence="${item.confidence}" data-direction="${item.direction}">
      <header>
        <strong>${escapeHtml(item.fieldName)}</strong>
        <span>${escapeHtml(item.direction)} · ${escapeHtml(item.kind)}</span>
      </header>
      <div class="obs-attribution-amount">${formatNumber(item.amount)}</div>
      <p>${escapeHtml(item.reason)}</p>
    </article>
  `;
}

export function renderFlowAttributionPanel(
  report: FlowAttributionReport | undefined,
  mode: 'mobile' | 'desktop' = 'desktop',
): string {
  if (!report) {
    return `
      <section class="obs-flow-attribution-panel obs-attribution-empty" data-layout="${mode}">
        <h3>Flow Attribution</h3>
        <p>No flow attribution report attached.</p>
      </section>
    `;
  }

  return `
    <section class="obs-flow-attribution-panel" data-layout="${mode}" data-unknown-count="${report.unknownChangeCount}">
      <header class="obs-panel-heading">
        <h3>Flow Attribution</h3>
        <p>${escapeHtml(report.summaryLine)}</p>
      </header>
      <div class="obs-attribution-list">
        ${report.items.map(renderAttributionItem).join('')}
      </div>
      ${report.warnings.length > 0 ? `<p class="obs-attribution-warning">${escapeHtml(report.warnings.join(' / '))}</p>` : ''}
    </section>
  `;
}
