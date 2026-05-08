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

export interface SteadyExternalDriveConfig extends ExternalDriveFieldConfig {
  /** Constant non-negative drive per field cell per step. No pulse/periodic modulation. */
  steadyDrivePerCell: number;
}

export interface SteadyExternalDriveStepReport {
  tick: number;
  inputEnergy: number;
  attemptedDriveEnergy: number;
  rejectedDriveEnergy: number;
  acceptedDriveEnergy: number;
  ledger: EnergyLedgerState;
  warnings: string[];
}

export interface SteadyExternalDriveStepResult {
  state: ExternalDriveFieldState;
  report: SteadyExternalDriveStepReport;
}

export interface SupplyCutoffStepReport extends SteadyExternalDriveStepReport {
  driveEnergyBeforeCutoff: number;
  driveEnergyAfterCutoff: number;
  driveEnergyDeltaDuringCutoff: number;
  cutoffVerifiedNoSpecialOutcomeRule: boolean;
}

export interface SupplyCutoffStepResult {
  state: ExternalDriveFieldState;
  report: SupplyCutoffStepReport;
}

export interface PeriodicExternalDriveConfig extends ExternalDriveFieldConfig {
  /** Non-negative baseline drive per field cell per step. */
  baseDrivePerCell: number;
  /** Non-negative sinusoidal amplitude per field cell per step. */
  amplitudeDrivePerCell: number;
  /** Period in ticks. Values below 1 are normalized to 1. */
  periodTicks: number;
  /** Optional phase offset in ticks. */
  phaseOffsetTicks?: number;
}

export interface PeriodicExternalDriveStepReport extends SteadyExternalDriveStepReport {
  waveformPhase01: number;
  waveformValuePerCell: number;
  driveEnergyBeforePeriodicInput: number;
  driveEnergyAfterPeriodicInput: number;
  driveEnergyDeltaDuringPeriodicInput: number;
  transferOutputEnergy: number;
}

export interface PeriodicExternalDriveStepResult {
  state: ExternalDriveFieldState;
  report: PeriodicExternalDriveStepReport;
}
