import { describe, expect, it } from 'vitest';
import { deriveObservationAnomalyReport } from '../../observer/observationAnomalyDetector.ts';
import type {
  FlowAttributionReport,
  ObservationTimelineFrame,
  TransferObservation,
} from '../../types/observation.ts';

function frame(input: Partial<ObservationTimelineFrame> & { tick: number }): ObservationTimelineFrame {
  return {
    tick: input.tick,
    externalDriveTotal: input.externalDriveTotal ?? 0,
    mediumStorageTotal: input.mediumStorageTotal ?? 0,
    dissipationTotal: input.dissipationTotal ?? 0,
    residueTotal: input.residueTotal ?? 0,
    outflowTotal: input.outflowTotal ?? 0,
    membraneExchangeTotal: input.membraneExchangeTotal ?? 0,
    transferEnergy: input.transferEnergy ?? 0,
    pairResidual: input.pairResidual ?? 0,
    pairLedgerStatus: input.pairLedgerStatus ?? 'unknown',
    metricKind: 'derived',
  };
}

function transferObservation(overrides: Partial<TransferObservation> = {}): TransferObservation {
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
    ...overrides,
  };
}

function flowAttribution(overrides: Partial<FlowAttributionReport> = {}): FlowAttributionReport {
  return {
    tick: 2,
    items: [],
    unknownChangeCount: 0,
    summaryLine: 'tick 2: 0 attribution item(s), unknown=0',
    warnings: [],
    metricKind: 'derived',
    ...overrides,
  };
}

describe('observation anomaly detector', () => {
  it('reports no critical or warning anomalies for closed transfer and clean timeline', () => {
    const report = deriveObservationAnomalyReport({
      transferObservation: transferObservation(),
      timelineFrames: [
        frame({ tick: 1, externalDriveTotal: 4, mediumStorageTotal: 0 }),
        frame({ tick: 2, externalDriveTotal: 3, mediumStorageTotal: 1, transferEnergy: 1, pairLedgerStatus: 'closed' }),
      ],
      flowAttribution: flowAttribution(),
    });

    expect(report.anomalies).toEqual([]);
    expect(report.maxSeverity).toBe('none');
    expect(report.summaryLine).toBe('No observation anomalies detected.');
  });

  it('detects open pair ledger in transfer observation and timeline frames', () => {
    const report = deriveObservationAnomalyReport({
      transferObservation: transferObservation({
        pairLedgerStatus: 'open',
        matched: false,
        residual: 0.25,
        sourceOutEnergy: 1,
        destinationInputEnergy: 0.75,
      }),
      timelineFrames: [
        frame({ tick: 2, pairLedgerStatus: 'open', pairResidual: 0.25 }),
      ],
      residualTolerance: 1e-6,
    });

    expect(report.warningCount).toBeGreaterThanOrEqual(1);
    expect(report.criticalCount).toBeGreaterThanOrEqual(1);
    expect(report.anomalies).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'pairLedgerOpen', severity: 'warning' }),
      expect.objectContaining({ kind: 'pairResidualTooHigh', severity: 'critical' }),
      expect.objectContaining({ kind: 'destinationInputMismatch', severity: 'critical' }),
    ]));
  });

  it('converts flow attribution unknownChange items into warning anomalies', () => {
    const report = deriveObservationAnomalyReport({
      timelineFrames: [frame({ tick: 2 })],
      flowAttribution: flowAttribution({
        items: [
          {
            tick: 2,
            fieldName: 'SpatialWorldMedium',
            kind: 'unknownChange',
            direction: 'increase',
            amount: 1,
            reason: 'SpatialWorldMedium changed by an amount not explained by transfer or named destination fields.',
            confidence: 'low',
            metricKind: 'derived',
          },
        ],
        unknownChangeCount: 1,
        warnings: ['1 unexplained field change(s) detected.'],
      }),
    });

    expect(report.warningCount).toBeGreaterThanOrEqual(1);
    expect(report.anomalies).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: 'unknownChange',
        severity: 'warning',
        relatedFields: ['SpatialWorldMedium'],
      }),
      expect.objectContaining({
        kind: 'upstreamWarning',
        severity: 'warning',
      }),
    ]));
  });

  it('detects impossible zero-transfer movement', () => {
    const report = deriveObservationAnomalyReport({
      transferObservation: transferObservation({
        transferEnergy: 0,
        sourceOutEnergy: 1,
        destinationInputEnergy: 1,
        residual: 0,
      }),
      timelineFrames: [frame({ tick: 1 })],
    });

    expect(report.criticalCount).toBe(1);
    expect(report.anomalies[0]).toEqual(expect.objectContaining({
      kind: 'zeroTransferMoved',
      severity: 'critical',
    }));
  });

  it('detects negative storage-like totals as critical anomalies', () => {
    const report = deriveObservationAnomalyReport({
      timelineFrames: [frame({ tick: 3, mediumStorageTotal: -0.1 })],
    });

    expect(report.criticalCount).toBe(1);
    expect(report.anomalies[0]).toEqual(expect.objectContaining({
      kind: 'negativeTotal',
      severity: 'critical',
      relatedFields: ['SpatialWorldMedium'],
    }));
  });

  it('reports missing timeline frames as info rather than failure', () => {
    const report = deriveObservationAnomalyReport({});

    expect(report.infoCount).toBe(1);
    expect(report.warningCount).toBe(0);
    expect(report.criticalCount).toBe(0);
    expect(report.maxSeverity).toBe('info');
    expect(report.anomalies[0].kind).toBe('missingTimeline');
  });
});
