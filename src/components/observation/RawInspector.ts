import { exportObservationReport } from '../../observer/exportObservationReport.ts';
import type { ObservationExportFormat, ObservationReport } from '../../types/observation.ts';

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderRawInspector(
  report: ObservationReport,
  format: ObservationExportFormat = 'json',
  mode: 'mobile' | 'desktop' = 'desktop',
): string {
  const exported = exportObservationReport(report, format);

  return `
    <section class="obs-raw-inspector" data-layout="${mode}" data-format="${exported.format}">
      <header class="obs-panel-heading">
        <h3>Raw Inspector / Export</h3>
        <p>${escapeHtml(exported.filename)} · ${escapeHtml(exported.mimeType)} · warnings ${exported.warningCount}</p>
      </header>
      <pre>${escapeHtml(exported.content)}</pre>
    </section>
  `;
}
