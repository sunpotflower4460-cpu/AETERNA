import type { EnergyLedgerState } from '../types/energyLedger.ts';
import type {
  EnergyLedgerScenarioVisibilitySummary,
  EnergyLedgerVisibilityState,
} from '../types/energyLedgerVisibility.ts';

const NOT_VERIFIED_LINE = 'Energy flow is not yet verified. Current values are diagnostic/proxy readings.';
const VERIFIED_LINE = 'Energy ledger terms close within tolerance for the supplied diagnostic terms.';

function formatResidual(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return 'unknown';
  return value.toExponential(3);
}

export function deriveEnergyLedgerVisibility(ledger: EnergyLedgerState): EnergyLedgerVisibilityState {
  const displayLine = ledger.verifiedModeledFlow ? VERIFIED_LINE : NOT_VERIFIED_LINE;
  const detailText = ledger.verifiedModeledFlow
    ? `${displayLine} residual=${formatResidual(ledger.conservationResidual)}.`
    : `${displayLine} status=${ledger.status}, missing=${ledger.missingTermIds.length}, residual=${formatResidual(ledger.conservationResidual)}.`;

  return {
    status: ledger.status,
    conservationResidual: ledger.conservationResidual,
    missingTermCount: ledger.missingTermIds.length,
    verifiedModeledFlow: ledger.verifiedModeledFlow,
    warningCount: ledger.warnings.length,
    displayLine,
    nowSummaryLine: {
      id: 'energy-ledger-visibility',
      priority: ledger.verifiedModeledFlow ? 6 : 1,
      text: detailText,
      source: 'EnergyLedger / ConservationResidual',
      valueKind: 'check',
    },
  };
}

export function summarizeEnergyLedgerVisibility(
  ledgers: EnergyLedgerState[],
): EnergyLedgerScenarioVisibilitySummary {
  let insufficientCount = 0;
  let openCount = 0;
  let nearClosedCount = 0;
  let closedCount = 0;
  let verifiedModeledFlowCount = 0;
  let residualSum = 0;
  let residualCount = 0;
  let maxConservationResidual: number | null = null;
  let maxMissingTermCount = 0;

  for (const ledger of ledgers) {
    if (ledger.status === 'insufficient') insufficientCount += 1;
    if (ledger.status === 'open') openCount += 1;
    if (ledger.status === 'nearClosed') nearClosedCount += 1;
    if (ledger.status === 'closed') closedCount += 1;
    if (ledger.verifiedModeledFlow) verifiedModeledFlowCount += 1;

    maxMissingTermCount = Math.max(maxMissingTermCount, ledger.missingTermIds.length);

    if (ledger.conservationResidual !== null && Number.isFinite(ledger.conservationResidual)) {
      residualSum += ledger.conservationResidual;
      residualCount += 1;
      maxConservationResidual = maxConservationResidual === null
        ? ledger.conservationResidual
        : Math.max(maxConservationResidual, ledger.conservationResidual);
    }
  }

  const allClosed = ledgers.length > 0 && closedCount === ledgers.length;

  return {
    frameCount: ledgers.length,
    insufficientCount,
    openCount,
    nearClosedCount,
    closedCount,
    verifiedModeledFlowCount,
    maxConservationResidual,
    averageConservationResidual: residualCount > 0 ? residualSum / residualCount : null,
    maxMissingTermCount,
    recommendedDisplayLine: allClosed ? VERIFIED_LINE : NOT_VERIFIED_LINE,
  };
}
