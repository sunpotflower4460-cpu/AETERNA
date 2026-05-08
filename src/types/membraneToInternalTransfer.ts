import type { LocalConservationSubstrateState } from './localConservationSubstrate.ts';
import type { SpatialWorldMediumState } from './spatialWorldMedium.ts';

export type MembraneToInternalTransferBoundaryMode = 'torus';
export type MembraneToInternalCellMapping = 'same-index';
export type MembraneToInternalPairLedgerStatus = 'closed' | 'open' | 'insufficient';

export interface MembraneToInternalTransferConfig {
  width: number;
  height: number;
  boundaryMode: MembraneToInternalTransferBoundaryMode;
  cellMapping: MembraneToInternalCellMapping;
  /** Rate-like coefficient multiplied by dt in later phases. In v3.8 it is structurally present but accepted as zero only. */
  transferCoefficient: number;
  dt: number;
  tolerance?: number;
}

export interface MembraneToInternalPairLedgerState {
  source: 'SpatialWorldMedium.membraneExchangeField';
  destination: 'LocalConservationSubstrate.storageField';
  sourceOutEnergy: number;
  destinationInputEnergy: number;
  signedResidual: number;
  residual: number;
  tolerance: number;
  status: MembraneToInternalPairLedgerStatus;
  matched: boolean;
  warnings: string[];
}

export interface MembraneToInternalTransferZeroReport {
  tick: number;
  acceptedTransferCoefficient: number;
  attemptedTransferCoefficient: number;
  rejectedTransferCoefficient: number;
  transferEnergy: number;
  membraneDrainableBefore: number;
  membraneDrainableAfter: number;
  membraneReleasedBefore: number;
  membraneReleasedAfter: number;
  substrateStorageBefore: number;
  substrateStorageAfter: number;
  pairLedger: MembraneToInternalPairLedgerState;
  warnings: string[];
}

export interface MembraneToInternalTransferZeroResult {
  spatialWorldMediumState: SpatialWorldMediumState;
  localConservationSubstrateState: LocalConservationSubstrateState;
  report: MembraneToInternalTransferZeroReport;
}

export interface MembraneToInternalTransferPositiveReport extends MembraneToInternalTransferZeroReport {
  transferRate: number;
  membraneDrainableDelta: number;
  substrateStorageDelta: number;
}

export interface MembraneToInternalTransferPositiveResult {
  spatialWorldMediumState: SpatialWorldMediumState;
  localConservationSubstrateState: LocalConservationSubstrateState;
  report: MembraneToInternalTransferPositiveReport;
}
