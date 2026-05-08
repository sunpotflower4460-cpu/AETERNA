import { describe, expect, it } from 'vitest';
import { deriveEnergyLedger } from '../../observer/deriveEnergyLedger.ts';
import {
  deriveEnergyLedgerScenarioMetricSnapshot,
  deriveEnergyLedgerScenarioMetrics,
  formatEnergyLedgerScenarioSummaryLine,
} from '../../observer/deriveEnergyLedgerScenarioMetrics.ts';

describe('deriveEnergyLedgerScenarioMetricSnapshot', () => {
  it('projects ledger status into scenario metric fields', () => {
    const ledger = deriveEnergyLedger({
      inputEnergy: 1,
      internalAccumulationDelta: 1,
      // Missing required terms on purpose.
    });

    const snapshot = deriveEnergyLedgerScenarioMetricSnapshot(42, ledger);

    expect(snapshot.frame).toBe(42);
    expect(snapshot.energyLedgerStatus).toBe('insufficient');
    expect(snapshot.energyLedgerVerifiedModeledFlow).toBe(false);
    expect(snapshot.energyLedgerMissingTermCount).toBeGreaterThan(0);
  });
});

describe('deriveEnergyLedgerScenarioMetrics', () => {
  it('summarizes insufficient/open/closed ledger frames', () => {
    const insufficient = deriveEnergyLedger({
      inputEnergy: 1,
      internalAccumulationDelta: 1,
    });

    const open = deriveEnergyLedger({
      inputEnergy: 10,
      internalAccumulationDelta: 1,
      dissipatedEnergy: 1,
      actuationOutputEnergy: 1,
      residueConvertedEnergy: 1,
      clampLossOrOverflow: 0,
    });

    const closed = deriveEnergyLedger({
      inputEnergy: 3,
      internalAccumulationDelta: 1,
      dissipatedEnergy: 1,
      actuationOutputEnergy: 0.5,
      residueConvertedEnergy: 0.5,
      clampLossOrOverflow: 0,
    });

    const report = deriveEnergyLedgerScenarioMetrics([
      { frame: 0, ledger: insufficient },
      { frame: 1, ledger: open },
      { frame: 2, ledger: closed },
    ]);

    expect(report.snapshots).toHaveLength(3);
    expect(report.summary.frameCount).toBe(3);
    expect(report.summary.insufficientCount).toBe(1);
    expect(report.summary.openCount).toBe(1);
    expect(report.summary.closedCount).toBe(1);
    expect(report.summary.verifiedModeledFlowCount).toBe(1);
    expect(report.summary.recommendedDisplayLine).toBe('Energy flow is not yet verified. Current values are diagnostic/proxy readings.');
  });

  it('formats a compact scenario summary line without overclaiming energy flow', () => {
    const ledger = deriveEnergyLedger({
      inputEnergy: 1,
      internalAccumulationDelta: 1,
    });

    const report = deriveEnergyLedgerScenarioMetrics([{ frame: 0, ledger }]);
    const line = formatEnergyLedgerScenarioSummaryLine(report.summary);

    expect(line).toContain('ledgerFrames=1');
    expect(line).toContain('insufficient=1');
    expect(line).not.toContain('Energy is flowing through AETERNA');
  });
});
