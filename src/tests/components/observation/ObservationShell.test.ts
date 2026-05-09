import { describe, expect, it } from 'vitest';
import { observeFieldSnapshots } from '../../../observer/fieldSnapshotObserver.ts';
import { deriveFlowAttribution } from '../../../observer/flowAttribution.ts';
import { deriveObservationAnomalyReport } from '../../../observer/observationAnomalyDetector.ts';
import { summarizeObservationTimeline } from '../../../observer/observationTimeline.ts';
import { renderObservationShell, resolveObservationLayout } from '../../../components/observation/ObservationShell.ts';
import type { ObservationReport, ObservationTimelineFrame, TransferObservation } from '../../../types/observation.ts';

function makeTransferObservation(): TransferObservation {
  return {
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
  };
}

function makeTimelineFrames(): ObservationTimelineFrame[] {
  return [
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
  ];
}

function makeReport(): ObservationReport {
  const timelineFrames = makeTimelineFrames();
  const transferObservation = makeTransferObservation();
  const flowAttribution = deriveFlowAttribution(timelineFrames[0], timelineFrames[1]);

  return {
    title: 'AETERNA Observation Layer',
    mode: 'observation-only',
    layout: 'desktop',
    status: 'closed',
    snapshots: observeFieldSnapshots([
      { fieldName: 'ExternalDriveField', field: [1, 1, 0, 0] },
      { fieldName: 'SpatialWorldMedium', field: [0, 2, 0, 0] },
    ]),
    transferObservation,
    timelineFrames,
    timelineSummary: summarizeObservationTimeline(timelineFrames),
    flowAttribution,
    anomalyReport: deriveObservationAnomalyReport({
      transferObservation,
      timelineFrames,
      flowAttribution,
    }),
    warnings: [],
    notes: ['Observation only — no runtime mutation'],
  };
}

describe('observation shell', () => {
  it('resolves mobile, tablet, and desktop layouts from viewport width', () => {
    expect(resolveObservationLayout({ width: 390 })).toBe('mobile');
    expect(resolveObservationLayout({ width: 900 })).toBe('tablet');
    expect(resolveObservationLayout({ width: 1440 })).toBe('desktop');
  });

  it('renders mobile tabs, transfer cards, timeline cards, attribution, and audit for small screens', () => {
    const result = renderObservationShell(makeReport(), { width: 390 });

    expect(result.layout).toBe('mobile');
    expect(result.html).toContain('obs-mobile');
    expect(result.html).toContain('data-tab="current"');
    expect(result.html).toContain('data-panel="flow"');
    expect(result.html).toContain('data-panel="ledger"');
    expect(result.html).toContain('data-panel="history"');
    expect(result.html).toContain('data-panel="audit"');
    expect(result.html).toContain('Transfer Pair Ledger');
    expect(result.html).toContain('Observation Timeline');
    expect(result.html).toContain('Flow Attribution');
    expect(result.html).toContain('Audit');
    expect(result.html).toContain('No anomalies detected');
    expect(result.html).toContain('tick 2');
    expect(result.html).toContain('↓ 1.000');
    expect(result.html).toContain('Observation only');
  });

  it('renders desktop dashboard with transfer ledger, flow, timeline, attribution, and audit panels for wide screens', () => {
    const result = renderObservationShell(makeReport(), { width: 1440 });

    expect(result.layout).toBe('desktop');
    expect(result.html).toContain('obs-desktop');
    expect(result.html).toContain('obs-dashboard-grid');
    expect(result.html).toContain('Raw Inspector');
    expect(result.html).toContain('Transfer Pair Ledger');
    expect(result.html).toContain('Source Out');
    expect(result.html).toContain('Destination Input');
    expect(result.html).toContain('Observation Timeline');
    expect(result.html).toContain('Flow Attribution');
    expect(result.html).toContain('Audit');
    expect(result.html).toContain('<th>tick</th>');
    expect(result.html).toContain('Observation only — no runtime mutation');
  });

  it('uses the same observation data while changing only the layout', () => {
    const report = makeReport();
    const mobile = renderObservationShell(report, { width: 390 });
    const desktop = renderObservationShell(report, { width: 1440 });

    expect(mobile.html).toContain('ExternalDriveField');
    expect(desktop.html).toContain('ExternalDriveField');
    expect(mobile.html).toContain('Transfer matched');
    expect(desktop.html).toContain('Transfer matched');
    expect(mobile.html).toContain('tick 2');
    expect(desktop.html).toContain('<td>2</td>');
    expect(mobile.html).toContain('Flow Attribution');
    expect(desktop.html).toContain('Flow Attribution');
    expect(mobile.html).toContain('Audit');
    expect(desktop.html).toContain('Audit');
    expect(mobile.sections).toEqual(desktop.sections);
  });

  it('does not include life metaphor terms in shell output', () => {
    const html = renderObservationShell(makeReport(), { width: 1440 }).html;
    const forbidden = ['vital', 'breath', 'heartbeat', 'pulse', 'metabolic', 'lifeDrive', '呼吸', '鼓動', '生命', '心拍'];

    for (const term of forbidden) {
      expect(html.toLowerCase()).not.toContain(term.toLowerCase());
    }
  });
});
