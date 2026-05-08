import { describe, expect, it } from 'vitest';
import {
  formatTransferObservationLine,
  observeTransferReport,
} from '../../observer/transferObservation.ts';
import type { ExternalDriveToMediumTransferPositiveReport } from '../../types/externalDriveToMediumTransfer.ts';

function makeTransferReport(
  overrides: Partial<ExternalDriveToMediumTransferPositiveReport> = {},
): ExternalDriveToMediumTransferPositiveReport {
  const base: ExternalDriveToMediumTransferPositiveReport = {
    tick: 2,
    acceptedTransferCoefficient: 0.25,
    attemptedTransferCoefficient: 0.25,
    rejectedTransferCoefficient: 0,
    transferRate: 0.25,
    transferEnergy: 1,
    destinationInputEnergy: 1,
    externalDriveEnergyBefore: 4,
    externalDriveEnergyAfter: 3,
    externalDriveEnergyDelta: -1,
    mediumEnergyBefore: 0,
    mediumEnergyAfter: 1,
    mediumEnergyDelta: 1,
    pairLedger: {
      source: 'ExternalDriveField',
      destination: 'SpatialWorldMedium',
      sourceOutEnergy: 1,
      destinationInputEnergy: 1,
      signedResidual: 0,
      residual: 0,
      tolerance: 1e-9,
      status: 'closed',
      matched: true,
      warnings: [],
    },
    warnings: [],
  };

  return {
    ...base,
    ...overrides,
    pairLedger: {
      ...base.pairLedger,
      ...overrides.pairLedger,
    },
  };
}

describe('transfer observation', () => {
  it('projects a closed transfer report into a ledger-kind observation', () => {
    const observation = observeTransferReport(makeTransferReport());

    expect(observation.sourceName).toBe('ExternalDriveField');
    expect(observation.destinationName).toBe('SpatialWorldMedium');
    expect(observation.sourceOutEnergy).toBe(1);
    expect(observation.destinationInputEnergy).toBe(1);
    expect(observation.transferEnergy).toBe(1);
    expect(observation.residual).toBe(0);
    expect(observation.pairLedgerStatus).toBe('closed');
    expect(observation.matched).toBe(true);
    expect(observation.mapping).toBe('same-index');
    expect(observation.metricKind).toBe('ledger');
    expect(observation.summaryLine).toContain('Transfer matched');
  });

  it('projects an open transfer report without hiding the mismatch', () => {
    const observation = observeTransferReport(makeTransferReport({
      pairLedger: {
        source: 'ExternalDriveField',
        destination: 'SpatialWorldMedium',
        sourceOutEnergy: 1,
        destinationInputEnergy: 0.75,
        signedResidual: 0.25,
        residual: 0.25,
        tolerance: 1e-9,
        status: 'open',
        matched: false,
        warnings: ['Transfer pair ledger is open. Source outflow does not match destination input.'],
      },
    }));

    expect(observation.pairLedgerStatus).toBe('open');
    expect(observation.matched).toBe(false);
    expect(observation.residual).toBe(0.25);
    expect(observation.summaryLine).toContain('Transfer mismatch');
    expect(observation.warnings.join('\n')).toContain('Transfer pair ledger is open');
  });

  it('formats a compact transfer observation line for panels and logs', () => {
    const line = formatTransferObservationLine(observeTransferReport(makeTransferReport()));

    expect(line).toContain('sourceOut=1.000000');
    expect(line).toContain('destinationInput=1.000000');
    expect(line).toContain('residual=0.000000');
    expect(line).toContain('status=closed');
    expect(line).toContain('mapping=same-index');
  });

  it('does not use visual/proxy metric kind for ledger-backed transfer observation', () => {
    const observation = observeTransferReport(makeTransferReport());

    expect(observation.metricKind).toBe('ledger');
    expect(observation.metricKind).not.toBe('visual');
    expect(observation.metricKind).not.toBe('proxy');
  });
});
