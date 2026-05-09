import { describe, expect, it } from 'vitest';
import {
  exportObservationReport,
  exportObservationReportAsCsv,
  exportObservationReportAsJson,
  exportObservationReportAsSummaryText,
} from '../../observer/exportObservationReport.ts';
import type { ObservationReport } from '../../types/observation.ts';

function makeReport(): ObservationReport {
  return {
    title: 'AETERNA Observation Layer',
    mode: 'observation-only',
    layout: 'desktop',
    status: 'closed',
    snapshots: [
      {
        fieldName: 'ExternalDriveField',
        total: 3,
        min: 0,
        max: 1,
        mean: 0.75,
        nonZeroCount: 4,
        cellCount: 4,
        peakCellIndex: 0,
        distributionSpread: 0.25,
        metricKind: 'measured',
      },
    ],
    transferObservation: {
      sourceName: 'ExternalDriveField',
      destinationName: 'SpatialWorldMedium',
      sourceOutEnergy: 1,
      destinationInputEnergy: 1,
      transferEnergy: 1,
      residual: 0,
      signedResidual: 0,
      pairLedgerStatus: 'closed',
      matched: true,
      mapping: 'same-index',
      metricKind: 'ledger',
      summaryLine: 'Transfer matched: sourceOut=1.000000 destinationInput=1.000000 residual=0.000000',
      warnings: [],
    },
    timelineFrames: [
      {
        tick: 1,
        externalDriveTotal: 4,
        mediumStorageTotal: 0,
        dissipationTotal: 0,
        residueTotal: 0,
        outflowTotal: 0,
        membraneExchangeTotal: 0,
        transferEnergy: 0,
        pairResidual: 0,
        pairLedgerStatus: 'unknown',
        metricKind: 'derived',
      },
      {
        tick: 2,
        externalDriveTotal: 3,
        mediumStorageTotal: 1,
        dissipationTotal: 0,
        residueTotal: 0,
        outflowTotal: 0,
        membraneExchangeTotal: 0,
        transferEnergy: 1,
        pairResidual: 0,
        pairLedgerStatus: 'closed',
        metricKind: 'derived',
      },
    ],
    timelineSummary: {
      frameCount: 2,
      firstTick: 1,
      lastTick: 2,
      totalTransferred: 1,
      maxPairResidual: 0,
      openFrameCount: 0,
      closedFrameCount: 1,
      warningFrameCount: 0,
      latestStatus: 'closed',
      metricKind: 'derived',
    },
    anomalyReport: {
      anomalies: [],
      infoCount: 0,
      warningCount: 0,
      criticalCount: 0,
      maxSeverity: 'none',
      summaryLine: 'No observation anomalies detected.',
      metricKind: 'derived',
    },
    warnings: [],
    notes: ['Observation only — no runtime mutation'],
  };
}

describe('export observation report', () => {
  it('exports the full observation report as JSON', () => {
    const exported = exportObservationReportAsJson(makeReport());

    expect(exported.format).toBe('json');
    expect(exported.mimeType).toBe('application/json');
    expect(exported.filename).toBe('aeterna-observation-layer.json');
    expect(exported.content).toContain('"mode": "observation-only"');
    expect(exported.content).toContain('"transferObservation"');
    expect(exported.warningCount).toBe(0);
    expect(exported.metricKind).toBe('derived');
  });

  it('exports timeline frames as CSV', () => {
    const exported = exportObservationReportAsCsv(makeReport());

    expect(exported.format).toBe('csv');
    expect(exported.mimeType).toBe('text/csv');
    expect(exported.filename).toBe('aeterna-observation-layer-timeline.csv');
    expect(exported.content).toContain('tick,externalDriveTotal,mediumStorageTotal');
    expect(exported.content).toContain('2,3,1,0,0,0,0,1,0,closed');
  });

  it('exports a compact summary text', () => {
    const exported = exportObservationReportAsSummaryText(makeReport());

    expect(exported.format).toBe('summaryText');
    expect(exported.mimeType).toBe('text/plain');
    expect(exported.filename).toBe('aeterna-observation-layer-summary.txt');
    expect(exported.content).toContain('mode: observation-only');
    expect(exported.content).toContain('timelineFrames: 2');
    expect(exported.content).toContain('anomalies: No observation anomalies detected.');
  });

  it('routes export by requested format', () => {
    expect(exportObservationReport(makeReport(), 'json').format).toBe('json');
    expect(exportObservationReport(makeReport(), 'csv').format).toBe('csv');
    expect(exportObservationReport(makeReport(), 'summaryText').format).toBe('summaryText');
  });

  it('does not mutate the report while exporting', () => {
    const report = makeReport();
    const before = JSON.stringify(report);

    exportObservationReport(report, 'json');
    exportObservationReport(report, 'csv');
    exportObservationReport(report, 'summaryText');

    expect(JSON.stringify(report)).toBe(before);
  });
});
