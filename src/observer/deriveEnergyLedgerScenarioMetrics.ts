import type { EnergyLedgerState, EnergyLedgerStatus } from '../types/energyLedger.ts';
import type { EnergyLedgerScenarioVisibilitySummary } from '../types/energyLedgerVisibility.ts';
import { summarizeEnergyLedgerVisibility } from './deriveEnergyLedgerVisibility.ts';

export interface EnergyLedgerScenarioMetricSnapshot {
  frame: number;
  energyLedgerStatus: EnergyLedgerStatus;
  energyLedgerConservationResidual: number | null;
  energyLedgerMissingTermCount: number;
  energyLedgerWarningCount: number;
  energyLedgerVerifiedModeledFlow: boolean;
}

export interface EnergyLedgerScenarioMetricsReport {
  snapshots: EnergyLedgerScenarioMetricSnapshot[];
  summary: EnergyLedgerScenarioVisibilitySummary;
}

export function deriveEnergyLedgerScenarioMetricSnapshot(
  frame: number,
  ledger: EnergyLedgerState,
): EnergyLedgerScenarioMetricSnapshot {
  return {
    frame,
    energyLedgerStatus: ledger.status,
    energyLedgerConservationResidual: ledger.conservationResidual,
    energyLedgerMissingTermCount: ledger.missingTermIds.length,
    energyLedgerWarningCount: ledger.warnings.length,
    energyLedgerVerifiedModeledFlow: ledger.verifiedModeledFlow,
  };
}

export function deriveEnergyLedgerScenarioMetrics(
  frames: Array<{ frame: number; ledger: EnergyLedgerState }>,
): EnergyLedgerScenarioMetricsReport {
  const snapshots = frames.map(({ frame, ledger }) =>
    deriveEnergyLedgerScenarioMetricSnapshot(frame, ledger),
  );

  const summary = summarizeEnergyLedgerVisibility(frames.map(({ ledger }) => ledger));

  return { snapshots, summary };
}

export function formatEnergyLedgerScenarioSummaryLine(
  summary: EnergyLedgerScenarioVisibilitySummary,
): string {
  return [
    `ledgerFrames=${summary.frameCount}`,
    `insufficient=${summary.insufficientCount}`,
    `open=${summary.openCount}`,
    `nearClosed=${summary.nearClosedCount}`,
    `closed=${summary.closedCount}`,
    `verified=${summary.verifiedModeledFlowCount}`,
    `maxMissingTerms=${summary.maxMissingTermCount}`,
  ].join(' ');
}
