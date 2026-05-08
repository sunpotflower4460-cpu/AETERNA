import { describe, expect, it } from 'vitest';
import { deriveEnergyLedger } from '../../observer/deriveEnergyLedger.ts';
import {
  deriveEnergyLedgerVisibility,
  summarizeEnergyLedgerVisibility,
} from '../../observer/deriveEnergyLedgerVisibility.ts';

describe('deriveEnergyLedgerVisibility', () => {
  it('shows not verified when required terms are missing', () => {
    const ledger = deriveEnergyLedger({
      inputEnergy: 1,
      internalAccumulationDelta: 1,
    });

    const visibility = deriveEnergyLedgerVisibility(ledger);

    expect(visibility.status).toBe('insufficient');
    expect(visibility.verifiedModeledFlow).toBe(false);
    expect(visibility.displayLine).toBe('Energy flow is not yet verified. Current values are diagnostic/proxy readings.');
    expect(visibility.nowSummaryLine.valueKind).toBe('check');
    expect(visibility.nowSummaryLine.text).toContain('status=insufficient');
    expect(visibility.nowSummaryLine.text).not.toContain('Energy is flowing through AETERNA');
  });

  it('shows not verified when ledger is open despite visible activity terms', () => {
    const ledger = deriveEnergyLedger({
      inputEnergy: 10,
      internalAccumulationDelta: 1,
      dissipatedEnergy: 1,
      actuationOutputEnergy: 1,
      residueConvertedEnergy: 1,
      clampLossOrOverflow: 0,
    });

    const visibility = deriveEnergyLedgerVisibility(ledger);

    expect(visibility.status).toBe('open');
    expect(visibility.verifiedModeledFlow).toBe(false);
    expect(visibility.nowSummaryLine.text).toContain('diagnostic/proxy');
    expect(visibility.nowSummaryLine.priority).toBe(1);
  });

  it('shows verified only when supplied diagnostic terms close', () => {
    const ledger = deriveEnergyLedger({
      inputEnergy: 3,
      internalAccumulationDelta: 1,
      dissipatedEnergy: 1,
      actuationOutputEnergy: 0.5,
      residueConvertedEnergy: 0.5,
      clampLossOrOverflow: 0,
    });

    const visibility = deriveEnergyLedgerVisibility(ledger);

    expect(visibility.status).toBe('closed');
    expect(visibility.verifiedModeledFlow).toBe(true);
    expect(visibility.displayLine).toContain('terms close within tolerance');
    expect(visibility.nowSummaryLine.valueKind).toBe('check');
  });
});

describe('summarizeEnergyLedgerVisibility', () => {
  it('counts insufficient/open/closed frames and keeps conservative display line', () => {
    const insufficient = deriveEnergyLedger({ inputEnergy: 1, internalAccumulationDelta: 1 });
    const open = deriveEnergyLedger({
      inputEnergy: 4,
      internalAccumulationDelta: 1,
      dissipatedEnergy: 1,
      actuationOutputEnergy: 0,
      residueConvertedEnergy: 0,
      clampLossOrOverflow: 0,
    });
    const closed = deriveEnergyLedger({
      inputEnergy: 2,
      internalAccumulationDelta: 1,
      dissipatedEnergy: 1,
      actuationOutputEnergy: 0,
      residueConvertedEnergy: 0,
      clampLossOrOverflow: 0,
    });

    const summary = summarizeEnergyLedgerVisibility([insufficient, open, closed]);

    expect(summary.frameCount).toBe(3);
    expect(summary.insufficientCount).toBe(1);
    expect(summary.openCount).toBe(1);
    expect(summary.closedCount).toBe(1);
    expect(summary.verifiedModeledFlowCount).toBe(1);
    expect(summary.recommendedDisplayLine).toBe('Energy flow is not yet verified. Current values are diagnostic/proxy readings.');
  });
});
