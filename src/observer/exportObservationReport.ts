import type {
  ObservationExportFormat,
  ObservationExportResult,
  ObservationReport,
  ObservationTimelineFrame,
} from '../types/observation.ts';

function sanitizeFilenamePart(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'observation-report';
}

function csvEscape(value: unknown): string {
  const text = String(value ?? '');
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function makeTimelineCsv(frames: ObservationTimelineFrame[]): string {
  const headers = [
    'tick',
    'externalDriveTotal',
    'mediumStorageTotal',
    'dissipationTotal',
    'residueTotal',
    'outflowTotal',
    'membraneExchangeTotal',
    'transferEnergy',
    'pairResidual',
    'pairLedgerStatus',
  ];

  const rows = frames.map((frame) => [
    frame.tick,
    frame.externalDriveTotal,
    frame.mediumStorageTotal,
    frame.dissipationTotal,
    frame.residueTotal,
    frame.outflowTotal,
    frame.membraneExchangeTotal,
    frame.transferEnergy,
    frame.pairResidual,
    frame.pairLedgerStatus,
  ].map(csvEscape).join(','));

  return [headers.join(','), ...rows].join('\n');
}

export function exportObservationReportAsJson(report: ObservationReport): ObservationExportResult {
  return {
    format: 'json',
    filename: `${sanitizeFilenamePart(report.title)}.json`,
    mimeType: 'application/json',
    content: JSON.stringify(report, null, 2),
    warningCount: report.warnings.length + (report.anomalyReport?.warningCount ?? 0) + (report.anomalyReport?.criticalCount ?? 0),
    metricKind: 'derived',
  };
}

export function exportObservationReportAsCsv(report: ObservationReport): ObservationExportResult {
  const frames = report.timelineFrames ?? [];
  return {
    format: 'csv',
    filename: `${sanitizeFilenamePart(report.title)}-timeline.csv`,
    mimeType: 'text/csv',
    content: makeTimelineCsv(frames),
    warningCount: report.warnings.length + (report.anomalyReport?.warningCount ?? 0) + (report.anomalyReport?.criticalCount ?? 0),
    metricKind: 'derived',
  };
}

export function exportObservationReportAsSummaryText(report: ObservationReport): ObservationExportResult {
  const lines = [
    `title: ${report.title}`,
    `mode: ${report.mode}`,
    `status: ${report.status}`,
    `snapshots: ${report.snapshots.length}`,
    `timelineFrames: ${report.timelineFrames?.length ?? 0}`,
    `transfer: ${report.transferObservation?.summaryLine ?? 'none'}`,
    `timeline: ${report.timelineSummary ? `frames=${report.timelineSummary.frameCount} totalTransferred=${report.timelineSummary.totalTransferred}` : 'none'}`,
    `flowAttribution: ${report.flowAttribution?.summaryLine ?? 'none'}`,
    `anomalies: ${report.anomalyReport?.summaryLine ?? 'none'}`,
    `warnings: ${report.warnings.length}`,
  ];

  return {
    format: 'summaryText',
    filename: `${sanitizeFilenamePart(report.title)}-summary.txt`,
    mimeType: 'text/plain',
    content: lines.join('\n'),
    warningCount: report.warnings.length + (report.anomalyReport?.warningCount ?? 0) + (report.anomalyReport?.criticalCount ?? 0),
    metricKind: 'derived',
  };
}

export function exportObservationReport(
  report: ObservationReport,
  format: ObservationExportFormat,
): ObservationExportResult {
  if (format === 'json') return exportObservationReportAsJson(report);
  if (format === 'csv') return exportObservationReportAsCsv(report);
  return exportObservationReportAsSummaryText(report);
}
