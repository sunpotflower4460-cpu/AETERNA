import type { EnergyLedgerStatus } from './energyLedger.ts';
import type { NowSummaryLine } from './nowSummary.ts';

export interface EnergyLedgerVisibilityState {
  status: EnergyLedgerStatus;
  conservationResidual: number | null;
  missingTermCount: number;
  verifiedModeledFlow: boolean;
  warningCount: number;
  displayLine: string;
  nowSummaryLine: NowSummaryLine;
}

export interface EnergyLedgerScenarioVisibilitySummary {
  frameCount: number;
  insufficientCount: number;
  openCount: number;
  nearClosedCount: number;
  closedCount: number;
  verifiedModeledFlowCount: number;
  maxConservationResidual: number | null;
  averageConservationResidual: number | null;
  maxMissingTermCount: number;
  recommendedDisplayLine: string;
}
