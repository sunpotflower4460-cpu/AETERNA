import type { EnergyLedgerState } from './energyLedger.ts';
import type { PhaseDriveEnergyObservation } from './phaseDriveEnergyObservation.ts';
import type { WaveCapableMediumState, WaveEnergySnapshot } from './waveCapableMedium.ts';

export interface PhaseDriveToWaveTransferSkeletonConfig {
  /** Requested local coupling. v5.1.3 keeps effective coupling at zero. */
  driveCoupling: number;
  tolerance?: number;
}

export interface PhaseDriveToWaveTransferSkeletonReport {
  source: 'phase-drive-to-wave-transfer-skeleton';
  driveTick: number;
  mediumTick: number;
  requestedDriveCoupling: number;
  effectiveDriveCoupling: 0;
  driveObservation: PhaseDriveEnergyObservation;
  mediumEnergyBefore: WaveEnergySnapshot;
  mediumEnergyAfter: WaveEnergySnapshot;
  candidateMaskedDriveEnergy: number;
  transferredEnergy: 0;
  mediumInputEnergy: 0;
  mediumChangedFieldCount: 0;
  ledger: EnergyLedgerState;
  warnings: string[];
  metricKind: 'check';
}

export interface PhaseDriveToWaveWorkTermPreviewConfig {
  /** Requested local coupling for preview math. v5.1.4 computes it but still does not apply it. */
  driveCoupling: number;
  tolerance?: number;
}

export interface PhaseDriveToWaveWorkTermPreviewReport {
  source: 'phase-drive-to-wave-work-term-preview';
  driveTick: number;
  mediumTick: number;
  requestedDriveCoupling: number;
  effectiveDriveCoupling: number;
  driveObservation: PhaseDriveEnergyObservation;
  mediumEnergyBefore: WaveEnergySnapshot;
  mediumEnergyAfter: WaveEnergySnapshot;
  candidateMaskedDriveEnergy: number;
  previewWorkTermEnergy: number;
  previewMediumInputEnergy: number;
  actualTransferredEnergy: 0;
  actualMediumInputEnergy: 0;
  mediumChangedFieldCount: 0;
  ledger: EnergyLedgerState;
  warnings: string[];
  metricKind: 'check';
}

export interface PhaseDriveToWaveAppliedTransferConfig {
  /** Requested local coupling. The effective applied value is clamped to [0, 1]. */
  driveCoupling: number;
  tolerance?: number;
}

export interface PhaseDriveToWaveAppliedTransferReport {
  source: 'phase-drive-to-wave-applied-transfer';
  driveTick: number;
  mediumTickBefore: number;
  mediumTickAfter: number;
  requestedDriveCoupling: number;
  effectiveDriveCoupling: number;
  driveObservation: PhaseDriveEnergyObservation;
  mediumEnergyBefore: WaveEnergySnapshot;
  mediumEnergyAfter: WaveEnergySnapshot;
  candidateMaskedDriveEnergy: number;
  requestedWorkTermEnergy: number;
  appliedWorkTermEnergy: number;
  mediumInputEnergy: number;
  mediumEnergyDelta: number;
  velocityKickScale: number;
  driveDirectionEnergyProxy: number;
  mediumChangedFieldCount: number;
  ledger: EnergyLedgerState;
  warnings: string[];
  metricKind: 'check';
}

export interface PhaseDriveToWaveAppliedTransferResult {
  state: WaveCapableMediumState;
  report: PhaseDriveToWaveAppliedTransferReport;
}
