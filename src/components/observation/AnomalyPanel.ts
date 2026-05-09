import type { ObservationAnomaly, ObservationAnomalyReport } from '../../types/observation.ts';

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderAnomaly(anomaly: ObservationAnomaly): string {
  const tickLabel = anomaly.tick === null ? 'tick unknown' : `tick ${anomaly.tick}`;
  return `
    <article class="obs-anomaly-item" data-severity="${anomaly.severity}" data-kind="${anomaly.kind}">
      <header>
        <strong>${escapeHtml(anomaly.severity)}</strong>
        <span>${escapeHtml(tickLabel)} · ${escapeHtml(anomaly.kind)}</span>
      </header>
      <p class="obs-anomaly-message">${escapeHtml(anomaly.message)}</p>
      <p class="obs-anomaly-cause">${escapeHtml(anomaly.suspectedCause)}</p>
      <p class="obs-anomaly-fields">${escapeHtml(anomaly.relatedFields.join(', ') || 'no related fields')}</p>
    </article>
  `;
}

export function renderAnomalyPanel(
  report: ObservationAnomalyReport | undefined,
  mode: 'mobile' | 'desktop' = 'desktop',
): string {
  if (!report) {
    return `
      <section class="obs-anomaly-panel obs-anomaly-empty" data-layout="${mode}">
        <h3>Audit</h3>
        <p>No anomaly report attached.</p>
      </section>
    `;
  }

  if (report.anomalies.length === 0) {
    return `
      <section class="obs-anomaly-panel" data-layout="${mode}" data-max-severity="none">
        <header class="obs-panel-heading">
          <h3>Audit</h3>
          <p>${escapeHtml(report.summaryLine)}</p>
        </header>
        <p>No anomalies detected.</p>
      </section>
    `;
  }

  return `
    <section class="obs-anomaly-panel" data-layout="${mode}" data-max-severity="${report.maxSeverity}">
      <header class="obs-panel-heading">
        <h3>Audit</h3>
        <p>${escapeHtml(report.summaryLine)}</p>
      </header>
      <dl class="obs-anomaly-counts">
        <div><dt>info</dt><dd>${report.infoCount}</dd></div>
        <div><dt>warning</dt><dd>${report.warningCount}</dd></div>
        <div><dt>critical</dt><dd>${report.criticalCount}</dd></div>
      </dl>
      <div class="obs-anomaly-list">
        ${report.anomalies.map(renderAnomaly).join('')}
      </div>
    </section>
  `;
}
