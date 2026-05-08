import { describe, expect, it } from 'vitest';
import {
  appendObservationTimelineFrame,
  createObservationTimelineFrame,
  formatObservationTimelineSummaryLine,
  summarizeObservationTimeline,
} from '../../observer/observationTimeline.ts';
import type { FieldSnapshot, TransferObservation } from '../../types/observation.ts';

function snapshot(fieldName: string, total: number): FieldSnapshot {
  return {
    fieldName,
    total,
    min: total,
    max: total,
    mean: total,
    nonZeroCount: total === 0 ? 0 : 1,
    cellCount: 1,
    peakCellIndex: total === 0 ? null : 0,
    distributionSpread: 0,
    metricKind: 'measured',
  };
}

function transfer(overrides: Partial<TransferObservation> = {}): TransferObservation {
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

describe('observation timeline', () => {
  it('creates a derived timeline frame from snapshots and transfer observation', () => {
    const frame = createObservationTimelineFrame({
      tick: 2,
      snapshots: [
        snapshot('ExternalDriveField', 3),
        snapshot('SpatialWorldMedium', 1),
        snapshot('Dissipation', 0.1),
        snapshot('Residue', 0.2),
        snapshot('Outflow', 0.3),
        snapshot('MembraneExchange', 0.4),
      ],
      transferObservation: transfer(),
    });

    expect(frame.tick).toBe(2);
    expect(frame.externalDriveTotal).toBe(3);
    expect(frame.mediumStorageTotal).toBe(1);
    expect(frame.dissipationTotal).toBe(0.1);
    expect(frame.residueTotal).toBe(0.2);
    expect(frame.outflowTotal).toBe(0.3);
    expect(frame.membraneExchangeTotal).toBe(0.4);
    expect(frame.transferEnergy).toBe(1);
    expect(frame.pairResidual).toBe(0);
    expect(frame.pairLedgerStatus).toBe('closed');
    expect(frame.metricKind).toBe('derived');
  });

  it('uses zeros and unknown status when optional observations are missing', () => {
    const frame = createObservationTimelineFrame({
      tick: 1,
      snapshots: [snapshot('ExternalDriveField', 4)],
    });

    expect(frame.externalDriveTotal).toBe(4);
    expect(frame.mediumStorageTotal).toBe(0);
    expect(frame.transferEnergy).toBe(0);
    expect(frame.pairResidual).toBe(0);
    expect(frame.pairLedgerStatus).toBe('unknown');
  });

  it('appends timeline frames without mutating the previous array', () => {
    const first = createObservationTimelineFrame({ tick: 1, snapshots: [] });
    const second = createObservationTimelineFrame({ tick: 2, snapshots: [] });
    const original = [first];

    const next = appendObservationTimelineFrame(original, second);

    expect(original).toEqual([first]);
    expect(next).toEqual([first, second]);
  });

  it('can keep only the latest maxFrames', () => {
    const frames = [1, 2, 3].map((tick) => createObservationTimelineFrame({ tick, snapshots: [] }));

    const next = appendObservationTimelineFrame(frames, createObservationTimelineFrame({ tick: 4, snapshots: [] }), 2);

    expect(next.map((frame) => frame.tick)).toEqual([3, 4]);
  });

  it('summarizes transfer totals, residuals, and ledger status counts', () => {
    const frames = [
      createObservationTimelineFrame({ tick: 1, snapshots: [], transferObservation: transfer({ transferEnergy: 1 }) }),
      createObservationTimelineFrame({ tick: 2, snapshots: [], transferObservation: transfer({ transferEnergy: 2 }) }),
      createObservationTimelineFrame({
        tick: 3,
        snapshots: [],
        transferObservation: transfer({
          transferEnergy: 0.5,
          residual: 0.25,
          pairLedgerStatus: 'open',
          matched: false,
        }),
      }),
    ];

    const summary = summarizeObservationTimeline(frames);

    expect(summary.frameCount).toBe(3);
    expect(summary.firstTick).toBe(1);
    expect(summary.lastTick).toBe(3);
    expect(summary.totalTransferred).toBe(3.5);
    expect(summary.maxPairResidual).toBe(0.25);
    expect(summary.closedFrameCount).toBe(2);
    expect(summary.openFrameCount).toBe(1);
    expect(summary.latestStatus).toBe('open');
    expect(summary.metricKind).toBe('derived');
  });

  it('formats a compact timeline summary line', () => {
    const summary = summarizeObservationTimeline([
      createObservationTimelineFrame({ tick: 10, snapshots: [], transferObservation: transfer() }),
    ]);

    const line = formatObservationTimelineSummaryLine(summary);

    expect(line).toContain('frames=1');
    expect(line).toContain('ticks=10..10');
    expect(line).toContain('totalTransferred=1.000000');
    expect(line).toContain('status=closed');
  });
});
