import type { ObservationTimelineFrame, ObservationTimelineSummary } from '../../types/observation.ts';

function formatNumber(value: number): string {
  return Number.isFinite(value) ? value.toFixed(3) : '0.000';
}

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderMobileFrameCard(frame: ObservationTimelineFrame): string {
  return `
    <article class="obs-timeline-card" data-status="${frame.pairLedgerStatus}">
      <header><strong>tick ${frame.tick}</strong><span>${escapeHtml(frame.pairLedgerStatus)}</span></header>
      <dl>
        <div><dt>External</dt><dd>${formatNumber(frame.externalDriveTotal)}</dd></div>
        <div><dt>Medium</dt><dd>${formatNumber(frame.mediumStorageTotal)}</dd></div>
        <div><dt>Transfer</dt><dd>${formatNumber(frame.transferEnergy)}</dd></div>
        <div><dt>Residual</dt><dd>${formatNumber(frame.pairResidual)}</dd></div>
      </dl>
    </article>
  `;
}

function renderDesktopRow(frame: ObservationTimelineFrame): string {
  return `
    <tr data-status="${frame.pairLedgerStatus}">
      <td>${frame.tick}</td>
      <td>${formatNumber(frame.externalDriveTotal)}</td>
      <td>${formatNumber(frame.mediumStorageTotal)}</td>
      <td>${formatNumber(frame.transferEnergy)}</td>
      <td>${formatNumber(frame.dissipationTotal)}</td>
      <td>${formatNumber(frame.residueTotal)}</td>
      <td>${formatNumber(frame.outflowTotal)}</td>
      <td>${formatNumber(frame.membraneExchangeTotal)}</td>
      <td>${formatNumber(frame.pairResidual)}</td>
      <td>${escapeHtml(frame.pairLedgerStatus)}</td>
    </tr>
  `;
}

export function renderTimelinePanel(
  frames: ObservationTimelineFrame[] | undefined,
  summary: ObservationTimelineSummary | undefined,
  mode: 'mobile' | 'desktop' = 'desktop',
): string {
  const safeFrames = frames ?? [];

  if (safeFrames.length === 0) {
    return `
      <section class="obs-timeline-panel obs-timeline-empty" data-layout="${mode}">
        <h3>Observation Timeline</h3>
        <p>No timeline frames recorded.</p>
      </section>
    `;
  }

  const summaryLine = summary
    ? `frames ${summary.frameCount} · ticks ${summary.firstTick ?? 'none'}..${summary.lastTick ?? 'none'} · total transfer ${formatNumber(summary.totalTransferred)} · max residual ${formatNumber(summary.maxPairResidual)}`
    : `frames ${safeFrames.length}`;

  if (mode === 'mobile') {
    return `
      <section class="obs-timeline-panel" data-layout="mobile">
        <h3>Observation Timeline</h3>
        <p class="obs-timeline-summary">${escapeHtml(summaryLine)}</p>
        <div class="obs-timeline-card-list">
          ${safeFrames.map(renderMobileFrameCard).join('')}
        </div>
      </section>
    `;
  }

  return `
    <section class="obs-timeline-panel" data-layout="desktop">
      <header class="obs-panel-heading">
        <h3>Observation Timeline</h3>
        <p>${escapeHtml(summaryLine)}</p>
      </header>
      <table class="obs-timeline-table">
        <thead>
          <tr>
            <th>tick</th>
            <th>external</th>
            <th>medium</th>
            <th>transfer</th>
            <th>dissipation</th>
            <th>residue</th>
            <th>outflow</th>
            <th>membrane</th>
            <th>residual</th>
            <th>status</th>
          </tr>
        </thead>
        <tbody>${safeFrames.map(renderDesktopRow).join('')}</tbody>
      </table>
    </section>
  `;
}
