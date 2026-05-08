import type { ExternalDriveFieldState } from './externalDriveField.ts';
import type { SpatialWorldMediumState } from './spatialWorldMedium.ts';

export type ExternalDriveToMediumTransferBoundaryMode = 'torus';
export type ExternalDriveToMediumCellMapping = 'same-index';
export type TransferPairLedgerStatus = 'closed' | 'open' | 'insufficient';

export interface ExternalDriveToMediumTransferConfig {
  width: number;
  height: number;
  boundaryMode: ExternalDriveToMediumTransferBoundaryMode;
  cellMapping: ExternalDriveToMediumCellMapping;
  /** Rate-like coefficient multiplied by dt in later phases. In v3.6 it is structurally present but accepted as zero only. */
  transferCoefficient: number;
  dt: number;
  tolerance?: number;
}

export interface TransferPairLedgerState {
  source: 'ExternalDriveField';
  destination: 'SpatialWorldMedium';
  sourceOutEnergy: number;
  destinationInputEnergy: number;
  signedResidual: number;
  residual: number;
  tolerance: number;
  status: TransferPairLedgerStatus;
  matched: boolean;
  warnings: string[];
}

export interface ExternalDriveToMediumTransferZeroReport {
  tick: number;
  acceptedTransferCoefficient: number;
  attemptedTransferCoefficient: number;
  rejectedTransferCoefficient: number;
  transferEnergy: number;
  externalDriveEnergyBefore: number;
  externalDriveEnergyAfter: number;
  mediumEnergyBefore: number;
  mediumEnergyAfter: number;
  pairLedger: TransferPairLedgerState;
  warnings: string[];
}

export interface ExternalDriveToMediumTransferZeroResult {
  externalDriveState: ExternalDriveFieldState;
  spatialWorldMediumState: SpatialWorldMediumState;
  report: ExternalDriveToMediumTransferZeroReport;
}
