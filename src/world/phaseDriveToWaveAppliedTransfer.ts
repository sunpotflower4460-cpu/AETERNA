import { deriveEnergyLedger } from '../observer/deriveEnergyLedger.ts';
import { derivePhaseDriveEnergyObservation } from '../observer/phaseDriveEnergyObservation.ts';
import type { PhaseCarryingDriveState } from '../types/phaseCarryingDrive.ts';
import type {
  PhaseDriveToWaveAppliedTransferConfig,
  PhaseDriveToWaveAppliedTransferResult,
} from '../types/phaseDriveToWaveTransfer.ts';
import type { WaveCapableMediumConfig, WaveCapableMediumState } from '../types/waveCapableMedium.ts';
import { cloneWaveCapableMediumState, deriveWaveEnergySnapshot } from './waveCapableMedium.ts';

function finiteNumber(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function finiteSample(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function clampUnitInterval(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function countChangedSamples(before: Float64Array, after: Float64Array): number {
  const count = Math.min(before.length, after.length);
  let changed = before.length === after.length ? 0 : Math.abs(before.length - after.length);
  for (let i = 0; i < count; i++) {
    if (before[i] !== after[i]) changed += 1;
  }
  return changed;
}

function solveVelocityKickScale(input: {
  targetWorkEnergy: number;
  directionEnergyProxy: number;
  velocityDirectionDot: number;
}): number {
  if (input.targetWorkEnergy <= 0 || input.directionEnergyProxy <= 0) return 0;

  // Energy delta from v -> v + s*d is:
  //   ΔE = s * dot(v,d) + s^2 * (0.5 * ||d||^2)
  // Here directionEnergyProxy = 0.5 * ||d||^2, so solve:
  //   A*s^2 + B*s - target = 0
  const a = input.directionEnergyProxy;
  const b = input.velocityDirectionDot;
  const discriminant = b * b + 4 * a * input.targetWorkEnergy;
  if (!Number.isFinite(discriminant) || discriminant < 0) return 0;
  const scale = (-b + Math.sqrt(discriminant)) / (2 * a);
  return Number.isFinite(scale) && scale > 0 ? scale : 0;
}

export function applyPhaseDriveToWaveTransfer(input: {
  driveState: PhaseCarryingDriveState;
  mediumState: WaveCapableMediumState;
  mediumConfig: WaveCapableMediumConfig;
  transferConfig: PhaseDriveToWaveAppliedTransferConfig;
}): PhaseDriveToWaveAppliedTransferResult {
  const requestedDriveCoupling = finiteNumber(input.transferConfig.driveCoupling, 0);
  const effectiveDriveCoupling = clampUnitInterval(requestedDriveCoupling);
  const warnings: string[] = [];

  const driveObservation = derivePhaseDriveEnergyObservation(input.driveState);
  const mediumEnergyBefore = deriveWaveEnergySnapshot(input.mediumState, input.mediumConfig);
  const candidateMaskedDriveEnergy = driveObservation.maskWeightedDriveEnergyTotal;
  const requestedWorkTermEnergy = effectiveDriveCoupling * candidateMaskedDriveEnergy;

  const size = Math.min(
    input.driveState.driveRealField.length,
    input.driveState.driveImagField.length,
    input.driveState.injectionMask.length,
    input.mediumState.mediumRealVelocityField.length,
    input.mediumState.mediumImagVelocityField.length,
  );

  if (
    input.driveState.width !== input.mediumState.width ||
    input.driveState.height !== input.mediumState.height
  ) {
    warnings.push('Drive and wave medium sizes differ; applied transfer used the shortest shared field length.');
  }

  let driveDirectionEnergyProxy = 0;
  let velocityDirectionDot = 0;

  for (let i = 0; i < size; i++) {
    const maskWeight = Math.sqrt(clamp01(input.driveState.injectionMask[i]));
    const directionReal = finiteSample(input.driveState.driveRealField[i]) * maskWeight;
    const directionImag = finiteSample(input.driveState.driveImagField[i]) * maskWeight;
    const velocityReal = finiteSample(input.mediumState.mediumRealVelocityField[i]);
    const velocityImag = finiteSample(input.mediumState.mediumImagVelocityField[i]);

    driveDirectionEnergyProxy += 0.5 * (directionReal * directionReal + directionImag * directionImag);
    velocityDirectionDot += velocityReal * directionReal + velocityImag * directionImag;
  }

  const velocityKickScale = solveVelocityKickScale({
    targetWorkEnergy: requestedWorkTermEnergy,
    directionEnergyProxy: driveDirectionEnergyProxy,
    velocityDirectionDot,
  });

  const nextState = cloneWaveCapableMediumState(input.mediumState);

  for (let i = 0; i < size; i++) {
    const maskWeight = Math.sqrt(clamp01(input.driveState.injectionMask[i]));
    const directionReal = finiteSample(input.driveState.driveRealField[i]) * maskWeight;
    const directionImag = finiteSample(input.driveState.driveImagField[i]) * maskWeight;
    nextState.mediumRealVelocityField[i] = finiteSample(nextState.mediumRealVelocityField[i]) + velocityKickScale * directionReal;
    nextState.mediumImagVelocityField[i] = finiteSample(nextState.mediumImagVelocityField[i]) + velocityKickScale * directionImag;
  }

  nextState.tick = input.mediumState.tick + 1;

  const mediumEnergyAfter = deriveWaveEnergySnapshot(nextState, input.mediumConfig);
  const mediumEnergyDelta = mediumEnergyAfter.totalEnergy - mediumEnergyBefore.totalEnergy;
  const appliedWorkTermEnergy = mediumEnergyDelta;
  const mediumInputEnergy = appliedWorkTermEnergy;
  const changedFieldCount =
    countChangedSamples(input.mediumState.mediumRealField, nextState.mediumRealField) +
    countChangedSamples(input.mediumState.mediumImagField, nextState.mediumImagField) +
    countChangedSamples(input.mediumState.mediumRealVelocityField, nextState.mediumRealVelocityField) +
    countChangedSamples(input.mediumState.mediumImagVelocityField, nextState.mediumImagVelocityField) +
    countChangedSamples(input.mediumState.waveEnergyDissipationField, nextState.waveEnergyDissipationField) +
    countChangedSamples(input.mediumState.waveEnergyResidueField, nextState.waveEnergyResidueField) +
    countChangedSamples(input.mediumState.waveEnergyOutflowField, nextState.waveEnergyOutflowField);

  if (requestedDriveCoupling !== input.transferConfig.driveCoupling) {
    warnings.push('Requested drive coupling was non-finite and was recorded as zero for applied transfer reporting.');
  }
  if (effectiveDriveCoupling !== requestedDriveCoupling) {
    warnings.push('Effective drive coupling was clamped to [0, 1] for applied transfer.');
  }
  if (requestedWorkTermEnergy > 0 && velocityKickScale === 0) {
    warnings.push('Requested work term was nonzero, but no finite drive direction was available for applied transfer.');
  }

  const residualTolerance = Math.max(1e-9, Math.abs(input.transferConfig.tolerance ?? 1e-9));
  if (Math.abs(appliedWorkTermEnergy - requestedWorkTermEnergy) > residualTolerance) {
    warnings.push('Applied work term differs from requested work term beyond tolerance.');
  }

  const ledger = deriveEnergyLedger({
    source: 'phase-drive-to-wave-applied-transfer',
    tolerance: input.transferConfig.tolerance,
    inputEnergy: mediumInputEnergy,
    internalEnergyBefore: mediumEnergyBefore.totalEnergy,
    internalEnergyAfter: mediumEnergyAfter.totalEnergy,
    dissipatedEnergy: 0,
    actuationOutputEnergy: 0,
    residueConvertedEnergy: 0,
    boundaryExchangeEnergy: 0,
    clampLossOrOverflow: 0,
    measuredOutflowEnergy: 0,
  });

  warnings.push(...driveObservation.warnings, ...ledger.warnings);

  return {
    state: nextState,
    report: {
      source: 'phase-drive-to-wave-applied-transfer',
      driveTick: input.driveState.tick,
      mediumTickBefore: input.mediumState.tick,
      mediumTickAfter: nextState.tick,
      requestedDriveCoupling,
      effectiveDriveCoupling,
      driveObservation,
      mediumEnergyBefore,
      mediumEnergyAfter,
      candidateMaskedDriveEnergy,
      requestedWorkTermEnergy,
      appliedWorkTermEnergy,
      mediumInputEnergy,
      mediumEnergyDelta,
      velocityKickScale,
      driveDirectionEnergyProxy,
      changedFieldCount,
      ledger,
      warnings,
      metricKind: 'check',
    },
  };
}
