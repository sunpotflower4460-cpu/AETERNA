import type { EnergyLedgerState } from './energyLedger.ts';

export type ExternalDriveFieldBoundaryMode = 'torus';

export interface ExternalDriveFieldConfig {
  width: number;
  height: number;
  boundaryMode: ExternalDriveFieldBoundaryMode;
  dt: number;
  tolerance?: number;
}

export interface ExternalDriveFieldState {
  width: number;
  height: number;
  boundaryMode: ExternalDriveFieldBoundaryMode;

  /** Structural external drive field. In v3.2 all values must remain zero. */
  driveField: Float64Array;

  /** Diagnostic record of any rejected non-zero attempted drive values. */
  rejectedDriveField: Float64Array;

  tick: number;
}

export interface ExternalDriveFieldZeroStepReport {
  tick: number;
  inputEnergy: number;
  attemptedDriveEnergy: number;
  rejectedDriveEnergy: number;
  acceptedDriveEnergy: number;
  ledger: EnergyLedgerState;
  warnings: string[];
}

export interface ExternalDriveFieldZeroStepResult {
  state: ExternalDriveFieldState;
  report: ExternalDriveFieldZeroStepReport;
}
