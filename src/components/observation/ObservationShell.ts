import { renderFlowArrowCard } from './FlowArrowCard.ts';
import { renderTimelinePanel } from './TimelinePanel.ts';
import { renderTransferLedgerPanel } from './TransferLedgerPanel.ts';
import type {
  ObservationLayoutMode,
  ObservationReport,
  ObservationShellRenderResult,
  ObservationShellSection,
  ObservationViewport,
} from '../../types/observation.ts';

export function resolveObservationLayout(viewport: ObservationViewport): ObservationLayoutMode {
  if (viewport.width < 768) return 'mobile';
  if (viewport.width < 1200) return 'tablet';
  return 'desktop';
}

export const OBSERVATION_SECTIONS: ObservationShellSection[] = [
  { id: 'current', title: 'Current', priority: 1, mobileTab: 'current', desktopRegion: 'snapshot' },
  { id: 'flow', title: 'Flow', priority: 2, mobileTab: 'flow', desktopRegion: 'attribution' },
  { id: 'ledger', title: 'Ledger', priority: 3, mobileTab: 'ledger', desktopRegion: 'ledger' },
  { id: 'history', title: 'History', priority: 4, mobileTab: 'history', desktopRegion: 'timeline' },
  { id: 'audit', title: 'Audit', priority: 0, mobileTab: 'audit', desktopRegion: 'audit' },
  { id: 'raw', title: 'Raw', priority: 5, mobileTab: 'audit', desktopRegion: 'raw' },
];

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

function renderSnapshotCards(report: ObservationReport): string {
  return report.snapshots.map((snapshot) => `
    <article class="obs-metric-card" data-kind="${snapshot.metricKind}">
      <div class="obs-card-label">${escapeHtml(snapshot.fieldName)}</div>
      <div class="obs-card-value">${formatNumber(snapshot.total)}</div>
      <div class="obs-card-sub">max ${formatNumber(snapshot.max)} · nonZero ${snapshot.nonZeroCount}/${snapshot.cellCount}</div>
    </article>
  `).join('');
}

function renderMobile(report: ObservationReport): string {
  return `
    <section class="aeterna-observation-shell obs-mobile" data-mode="observation-only">
      <header class="obs-header">
        <div>
          <p class="obs-kicker">Observation only</p>
          <h2>${escapeHtml(report.title)}</h2>
        </div>
        <span class="obs-status" data-status="${report.status}">${escapeHtml(report.status)}</span>
      </header>
      <nav class="obs-mobile-tabs" aria-label="Observation tabs">
        <button data-tab="current">現在</button>
        <button data-tab="flow">流れ</button>
        <button data-tab="ledger">台帳</button>
        <button data-tab="history">履歴</button>
        <button data-tab="audit">警告</button>
      </nav>
      <main class="obs-mobile-stack">
        <section class="obs-panel" data-panel="current">
          <h3>Current Snapshot</h3>
          ${renderSnapshotCards(report)}
        </section>
        <section class="obs-panel" data-panel="flow">
          ${renderFlowArrowCard(report.transferObservation)}
        </section>
        <section class="obs-panel" data-panel="ledger">
          ${renderTransferLedgerPanel(report.transferObservation, 'mobile')}
        </section>
        <section class="obs-panel" data-panel="history">
          ${renderTimelinePanel(report.timelineFrames, report.timelineSummary, 'mobile')}
        </section>
        <section class="obs-panel" data-panel="audit">
          <h3>Audit</h3>
          <p>${report.warnings.length === 0 ? 'No anomalies detected.' : escapeHtml(report.warnings.join(' / '))}</p>
        </section>
      </main>
    </section>
  `;
}

function renderDesktop(report: ObservationReport): string {
  return `
    <section class="aeterna-observation-shell obs-desktop" data-mode="observation-only">
      <header class="obs-topbar">
        <div>
          <p class="obs-kicker">Observation only — no runtime mutation</p>
          <h2>${escapeHtml(report.title)}</h2>
        </div>
        <span class="obs-status" data-status="${report.status}">${escapeHtml(report.status)}</span>
      </header>
      <main class="obs-dashboard-grid">
        <section class="obs-panel obs-panel-snapshot">
          <h3>Field Snapshot</h3>
          <div class="obs-card-grid">${renderSnapshotCards(report)}</div>
        </section>
        <section class="obs-panel obs-panel-ledger">
          ${renderTransferLedgerPanel(report.transferObservation, 'desktop')}
        </section>
        <section class="obs-panel obs-panel-flow">
          ${renderFlowArrowCard(report.transferObservation)}
        </section>
        <section class="obs-panel obs-panel-timeline">
          ${renderTimelinePanel(report.timelineFrames, report.timelineSummary, 'desktop')}
        </section>
        <section class="obs-panel obs-panel-audit">
          <h3>Audit</h3>
          <p>${report.warnings.length === 0 ? 'No anomalies detected.' : escapeHtml(report.warnings.join(' / '))}</p>
        </section>
        <section class="obs-panel obs-panel-raw">
          <h3>Raw Inspector</h3>
          <pre>${escapeHtml(JSON.stringify(report, null, 2))}</pre>
        </section>
      </main>
    </section>
  `;
}

export function renderObservationShell(
  report: ObservationReport,
  viewport: ObservationViewport,
): ObservationShellRenderResult {
  const layout = resolveObservationLayout(viewport);
  const html = layout === 'mobile' ? renderMobile(report) : renderDesktop(report);

  return {
    layout,
    html,
    sections: OBSERVATION_SECTIONS,
    warnings: report.warnings,
  };
}
