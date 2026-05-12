import { deriveEnergyLedger } from './deriveEnergyLedger.ts';
import { derivePhaseDriveEnergyObservation } from './phaseDriveEnergyObservation.ts';
import type { PhaseCarryingDriveState } from '../types/phaseCarryingDrive.ts';
import type {
  PhaseDriveToWaveTransferSkeletonConfig,
  PhaseDriveToWaveTransferSkeletonReport,
} from '../types/phaseDriveToWaveTransfer.ts';
import type { WaveCapableMediumConfig, WaveCapableMediumState } from '../types/waveCapableMedium.ts';
import { deriveWaveEnergySnapshot } from '../world/waveCapableMedium.ts';

function finiteNonNegative(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : fallback;
}

export function derivePhaseDriveToWaveTransferSkeleton(input: {
  driveState: PhaseCarryingDriveState;
  mediumState: WaveCapableMediumState;
  mediumConfig: WaveCapableMediumConfig;
  transferConfig: PhaseDriveToWaveTransferSkeletonConfig;
}): PhaseDriveToWaveTransferSkeletonReport {
  const requestedDriveCoupling = finiteNonNegative(input.transferConfig.driveCoupling, 0);
  const effectiveDriveCoupling = 0 as const;
  const warnings: string[] = [];

  const driveObservation = derivePhaseDriveEnergyObservation(input.driveState);
  const mediumEnergyBefore = deriveWaveEnergySnapshot(input.mediumState, input.mediumConfig);
  const mediumEnergyAfter = deriveWaveEnergySnapshot(input.mediumState, input.mediumConfig);
  const candidateMaskedDriveEnergy = driveObservation.maskWeightedDriveEnergyTotal;
  const transferredEnergy = 0 as const;
  const mediumInputEnergy = 0 as const;
  const mediumChangedFieldCount = 0 as const;

  if (requestedDriveCoupling > 0) {
    warnings.push('Requested drive coupling is recorded but effective coupling remains zero in v5.1.3.');
  }
  if (candidateMaskedDriveEnergy > 0) {
    warnings.push('Masked drive energy is diagnostic only in v5.1.3.');
  }

  const ledger = deriveEnergyLedger({
    source: 'phase-drive-to-wave-transfer-skeleton',
    tolerance: input.transferConfig.tolerance,
    inputEnergy: mediumInputEnergy,
    internalEnergyBefore: mediumEnergyBefore.totalEnergy,
    internalEnergyAfter: mediumEnergyAfter.totalEnergy,
    dissipatedEnergy: 0,
    actuationOutputEnergy: 0,
    residueConvertedEnergy: 0,
    boundaryExchangeEnergy: transferredEnergy,
    clampLossOrOverflow: 0,
    measuredOutflowEnergy: 0,
  });

  warnings.push(...driveObservation.warnings, ...ledger.warnings);

  return {
    source: 'phase-drive-to-wave-transfer-skeleton',
    driveTick: input.driveState.tick,
    mediumTick: input.mediumState.tick,
    requestedDriveCoupling,
    effectiveDriveCoupling,
    driveObservation,
    mediumEnergyBefore,
    mediumEnergyAfter,
    candidateMaskedDriveEnergy,
    transferredEnergy,
    mediumInputEnergy,
    mediumChangedFieldCount,
    ledger,
    warnings,
    metricKind: 'check',
  };
}
