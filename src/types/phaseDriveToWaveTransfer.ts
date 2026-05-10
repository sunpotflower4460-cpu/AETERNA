import type { EnergyLedgerState } from './energyLedger.ts';
import type { PhaseDriveEnergyObservation } from './phaseDriveEnergyObservation.ts';
import type { WaveEnergySnapshot } from './waveCapableMedium.ts';

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
