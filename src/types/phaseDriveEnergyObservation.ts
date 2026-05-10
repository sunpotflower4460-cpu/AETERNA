import type { EnergyLedgerState } from './energyLedger.ts';

export interface PhaseDriveEnergyObservation {
  driveEnergyTotal: number;
  driveEnergyMax: number;
  maskWeightedDriveEnergyTotal: number;
  activeDriveCellCount: number;
  activeMaskedDriveCellCount: number;
  finiteCellCount: number;
  nonFiniteCellCount: number;
  warnings: string[];
  metricKind: 'derived';
}

export interface PhaseDriveNoMediumTransferCheck {
  source: 'phase-drive-no-medium-transfer-check';
  observedDriveEnergy: number;
  mediumInputEnergy: number;
  driveToMediumTransferredEnergy: number;
  ledger: EnergyLedgerState;
  warnings: string[];
  metricKind: 'check';
}

export interface PhaseDriveEnergyObservationReport {
  tick: number;
  energyObservation: PhaseDriveEnergyObservation;
  noMediumTransferCheck: PhaseDriveNoMediumTransferCheck;
  warnings: string[];
  metricKind: 'derived';
}
