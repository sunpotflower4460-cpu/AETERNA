import { deriveEnergyLedger } from './deriveEnergyLedger.ts';
import { derivePhaseDriveEnergyObservation } from './phaseDriveEnergyObservation.ts';
import type { PhaseCarryingDriveState } from '../types/phaseCarryingDrive.ts';
import type {
  PhaseDriveToWaveWorkTermPreviewConfig,
  PhaseDriveToWaveWorkTermPreviewReport,
} from '../types/phaseDriveToWaveTransfer.ts';
import type { WaveCapableMediumConfig, WaveCapableMediumState } from '../types/waveCapableMedium.ts';
import { deriveWaveEnergySnapshot } from '../world/waveCapableMedium.ts';

function finiteNonNegative(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : fallback;
}

export function derivePhaseDriveToWaveWorkTermPreview(input: {
  driveState: PhaseCarryingDriveState;
  mediumState: WaveCapableMediumState;
  mediumConfig: WaveCapableMediumConfig;
  transferConfig: PhaseDriveToWaveWorkTermPreviewConfig;
}): PhaseDriveToWaveWorkTermPreviewReport {
  const requestedDriveCoupling = finiteNonNegative(input.transferConfig.driveCoupling, 0);
  const effectiveDriveCoupling = requestedDriveCoupling;
  const warnings: string[] = [];

  const driveObservation = derivePhaseDriveEnergyObservation(input.driveState);
  const mediumEnergyBefore = deriveWaveEnergySnapshot(input.mediumState, input.mediumConfig);
  const mediumEnergyAfter = deriveWaveEnergySnapshot(input.mediumState, input.mediumConfig);
  const candidateMaskedDriveEnergy = driveObservation.maskWeightedDriveEnergyTotal;
  const previewWorkTermEnergy = effectiveDriveCoupling * candidateMaskedDriveEnergy;
  const previewMediumInputEnergy = previewWorkTermEnergy;
  const actualTransferredEnergy = 0 as const;
  const actualMediumInputEnergy = 0 as const;
  const mediumChangedFieldCount = 0 as const;

  if (effectiveDriveCoupling > 0 && candidateMaskedDriveEnergy > 0) {
    warnings.push('Preview work term is nonzero but not applied to the wave medium in v5.1.4.');
  }
  if (requestedDriveCoupling !== input.transferConfig.driveCoupling) {
    warnings.push('Requested drive coupling was non-finite or negative and was normalized for preview math.');
  }
  if (previewWorkTermEnergy > 0) {
    warnings.push('Preview medium input is diagnostic only; actual medium input remains zero in v5.1.4.');
  }

  const ledger = deriveEnergyLedger({
    source: 'phase-drive-to-wave-work-term-preview',
    tolerance: input.transferConfig.tolerance,
    inputEnergy: actualMediumInputEnergy,
    internalEnergyBefore: mediumEnergyBefore.totalEnergy,
    internalEnergyAfter: mediumEnergyAfter.totalEnergy,
    dissipatedEnergy: 0,
    actuationOutputEnergy: 0,
    residueConvertedEnergy: 0,
    boundaryExchangeEnergy: actualTransferredEnergy,
    clampLossOrOverflow: 0,
    measuredOutflowEnergy: 0,
  });

  warnings.push(...driveObservation.warnings, ...ledger.warnings);

  return {
    source: 'phase-drive-to-wave-work-term-preview',
    driveTick: input.driveState.tick,
    mediumTick: input.mediumState.tick,
    requestedDriveCoupling,
    effectiveDriveCoupling,
    driveObservation,
    mediumEnergyBefore,
    mediumEnergyAfter,
    candidateMaskedDriveEnergy,
    previewWorkTermEnergy,
    previewMediumInputEnergy,
    actualTransferredEnergy,
    actualMediumInputEnergy,
    mediumChangedFieldCount,
    ledger,
    warnings,
    metricKind: 'check',
  };
}
