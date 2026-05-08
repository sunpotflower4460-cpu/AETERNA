import type { ExternalDriveToMediumTransferPositiveReport } from '../types/externalDriveToMediumTransfer.ts';
import type { ObservationStatus, TransferObservation } from '../types/observation.ts';

function mapPairLedgerStatus(status: ExternalDriveToMediumTransferPositiveReport['pairLedger']['status']): ObservationStatus {
  if (status === 'closed') return 'closed';
  if (status === 'open') return 'open';
  if (status === 'insufficient') return 'insufficient';
  return 'unknown';
}

function formatNumber(value: number): string {
  return Number.isFinite(value) ? value.toFixed(6) : '0.000000';
}

export function observeTransferReport(
  report: ExternalDriveToMediumTransferPositiveReport,
): TransferObservation {
  const pairLedgerStatus = mapPairLedgerStatus(report.pairLedger.status);
  const sourceOutEnergy = report.pairLedger.sourceOutEnergy;
  const destinationInputEnergy = report.pairLedger.destinationInputEnergy;
  const residual = report.pairLedger.residual;
  const matched = report.pairLedger.matched;

  return {
    sourceName: 'ExternalDriveField',
    destinationName: 'SpatialWorldMedium',
    sourceOutEnergy,
    destinationInputEnergy,
    transferEnergy: report.transferEnergy,
    residual,
    signedResidual: report.pairLedger.signedResidual,
    pairLedgerStatus,
    matched,
    mapping: 'same-index',
    metricKind: 'ledger',
    summaryLine: matched
      ? `Transfer matched: sourceOut=${formatNumber(sourceOutEnergy)} destinationInput=${formatNumber(destinationInputEnergy)} residual=${formatNumber(residual)}`
      : `Transfer mismatch: sourceOut=${formatNumber(sourceOutEnergy)} destinationInput=${formatNumber(destinationInputEnergy)} residual=${formatNumber(residual)}`,
    warnings: [...report.warnings, ...report.pairLedger.warnings],
  };
}

export function formatTransferObservationLine(observation: TransferObservation): string {
  return [
    `sourceOut=${formatNumber(observation.sourceOutEnergy)}`,
    `destinationInput=${formatNumber(observation.destinationInputEnergy)}`,
    `residual=${formatNumber(observation.residual)}`,
    `status=${observation.pairLedgerStatus}`,
    `mapping=${observation.mapping}`,
  ].join(' ');
}
