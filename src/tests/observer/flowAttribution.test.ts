import { describe, expect, it } from 'vitest';
import { deriveFlowAttribution } from '../../observer/flowAttribution.ts';
import type { ObservationTimelineFrame } from '../../types/observation.ts';

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

describe('flow attribution observer', () => {
  it('creates a baseline report when no previous frame exists', () => {
    const report = deriveFlowAttribution(undefined, frame({ tick: 1, externalDriveTotal: 4 }));

    expect(report.tick).toBe(1);
    expect(report.metricKind).toBe('derived');
    expect(report.unknownChangeCount).toBe(0);
    expect(report.summaryLine).toContain('baseline frame recorded');
    expect(report.items[0].kind).toBe('storageCarry');
  });

  it('attributes a closed transfer to external decrease and medium increase', () => {
    const previous = frame({ tick: 1, externalDriveTotal: 4, mediumStorageTotal: 0 });
    const current = frame({
      tick: 2,
      externalDriveTotal: 3,
      mediumStorageTotal: 1,
      transferEnergy: 1,
      pairLedgerStatus: 'closed',
    });

    const report = deriveFlowAttribution(previous, current);

    expect(report.unknownChangeCount).toBe(0);
    expect(report.items).toEqual(expect.arrayContaining([
      expect.objectContaining({
        fieldName: 'ExternalDriveField',
        kind: 'transfer',
        direction: 'decrease',
        amount: 1,
        confidence: 'high',
      }),
      expect.objectContaining({
        fieldName: 'SpatialWorldMedium',
        kind: 'transfer',
        direction: 'increase',
        amount: 1,
        confidence: 'high',
      }),
    ]));
  });

  it('attributes medium decreases into named destination fields', () => {
    const previous = frame({
      tick: 2,
      externalDriveTotal: 3,
      mediumStorageTotal: 1,
      dissipationTotal: 0,
      residueTotal: 0,
      outflowTotal: 0,
      membraneExchangeTotal: 0,
    });
    const current = frame({
      tick: 3,
      externalDriveTotal: 3,
      mediumStorageTotal: 0.7,
      dissipationTotal: 0.1,
      residueTotal: 0.1,
      outflowTotal: 0.05,
      membraneExchangeTotal: 0.05,
      transferEnergy: 0,
      pairLedgerStatus: 'unknown',
    });

    const report = deriveFlowAttribution(previous, current);

    expect(report.unknownChangeCount).toBe(0);
    expect(report.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ fieldName: 'Dissipation', kind: 'dissipation', direction: 'increase', amount: 0.1 }),
      expect.objectContaining({ fieldName: 'Residue', kind: 'residue', direction: 'increase', amount: 0.1 }),
      expect.objectContaining({ fieldName: 'Outflow', kind: 'outflow', direction: 'increase', amount: 0.05 }),
      expect.objectContaining({ fieldName: 'MembraneExchange', kind: 'boundaryExchange', direction: 'increase', amount: 0.05 }),
      expect.objectContaining({ fieldName: 'SpatialWorldMedium', kind: 'dissipation', direction: 'decrease', amount: 0.1 }),
      expect.objectContaining({ fieldName: 'SpatialWorldMedium', kind: 'residue', direction: 'decrease', amount: 0.1 }),
      expect.objectContaining({ fieldName: 'SpatialWorldMedium', kind: 'outflow', direction: 'decrease', amount: 0.05 }),
      expect.objectContaining({ fieldName: 'SpatialWorldMedium', kind: 'boundaryExchange', direction: 'decrease', amount: 0.05 }),
    ]));
  });

  it('marks unexplained external or medium changes as unknownChange', () => {
    const previous = frame({ tick: 1, externalDriveTotal: 4, mediumStorageTotal: 0 });
    const current = frame({ tick: 2, externalDriveTotal: 4, mediumStorageTotal: 1 });

    const report = deriveFlowAttribution(previous, current);

    expect(report.unknownChangeCount).toBe(1);
    expect(report.items).toEqual(expect.arrayContaining([
      expect.objectContaining({
        fieldName: 'SpatialWorldMedium',
        kind: 'unknownChange',
        direction: 'increase',
        amount: 1,
        confidence: 'low',
      }),
    ]));
    expect(report.warnings.join('\n')).toContain('unexplained field change');
  });

  it('does not treat transfer with open ledger as high-confidence transfer attribution', () => {
    const previous = frame({ tick: 1, externalDriveTotal: 4, mediumStorageTotal: 0 });
    const current = frame({
      tick: 2,
      externalDriveTotal: 3,
      mediumStorageTotal: 1,
      transferEnergy: 1,
      pairLedgerStatus: 'open',
      pairResidual: 0.25,
    });

    const report = deriveFlowAttribution(previous, current);

    expect(report.items.some((item) => item.kind === 'transfer' && item.confidence === 'high')).toBe(false);
    expect(report.unknownChangeCount).toBeGreaterThan(0);
    expect(report.warnings.join('\n')).toContain('pair ledger was not closed');
  });
});
