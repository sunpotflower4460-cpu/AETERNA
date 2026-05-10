import type {
  WaveCapableMediumConfig,
  WaveCapableMediumDampingStepResult,
  WaveCapableMediumState,
} from '../types/waveCapableMedium.ts';
import {
  cloneWaveCapableMediumState,
  deriveWaveAccelerationPreview,
  deriveWaveEnergyLedgerCheck,
  deriveWaveEnergySnapshot,
} from './waveCapableMedium.ts';

function finiteNonNegative(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : fallback;
}

function normalizeConfig(config: WaveCapableMediumConfig): WaveCapableMediumConfig {
  return {
    ...config,
    width: Math.max(1, Math.floor(config.width)),
    height: Math.max(1, Math.floor(config.height)),
    localElasticCoupling: finiteNonNegative(config.localElasticCoupling, 0),
    localWaveDamping: finiteNonNegative(config.localWaveDamping, 0),
    amplitudeClamp: finiteNonNegative(config.amplitudeClamp, Number.POSITIVE_INFINITY),
    dt: finiteNonNegative(config.dt, 1),
    tolerance: finiteNonNegative(config.tolerance, 1e-6),
  };
}

function countChangedSamples(before: Float64Array, after: Float64Array): number {
  const count = Math.min(before.length, after.length);
  let changed = before.length === after.length ? 0 : Math.abs(before.length - after.length);
  for (let i = 0; i < count; i++) {
    if (before[i] !== after[i]) changed += 1;
  }
  return changed;
}

function countChangedWaveSamples(before: WaveCapableMediumState, after: WaveCapableMediumState): number {
  return (
    countChangedSamples(before.mediumRealField, after.mediumRealField) +
    countChangedSamples(before.mediumImagField, after.mediumImagField) +
    countChangedSamples(before.mediumRealVelocityField, after.mediumRealVelocityField) +
    countChangedSamples(before.mediumImagVelocityField, after.mediumImagVelocityField) +
    countChangedSamples(before.waveEnergyDissipationField, after.waveEnergyDissipationField) +
    countChangedSamples(before.waveEnergyResidueField, after.waveEnergyResidueField) +
    countChangedSamples(before.waveEnergyOutflowField, after.waveEnergyOutflowField)
  );
}

function addDissipationUniformly(state: WaveCapableMediumState, dissipatedEnergy: number): void {
  if (dissipatedEnergy <= 0) return;
  const size = state.waveEnergyDissipationField.length;
  if (size <= 0) return;
  const perCell = dissipatedEnergy / size;
  for (let i = 0; i < size; i++) {
    state.waveEnergyDissipationField[i] += perCell;
  }
}

export function updateWaveCapableMediumDampingLedger(
  state: WaveCapableMediumState,
  configInput: WaveCapableMediumConfig,
): WaveCapableMediumDampingStepResult {
  const config = normalizeConfig(configInput);
  const conservativeConfig: WaveCapableMediumConfig = {
    ...config,
    localWaveDamping: 0,
  };
  const warnings: string[] = [];

  const energyBefore = deriveWaveEnergySnapshot(state, conservativeConfig);
  const accelerationBefore = deriveWaveAccelerationPreview(state, conservativeConfig);
  const nextState = cloneWaveCapableMediumState(state);
  const dt = conservativeConfig.dt;
  const size = state.width * state.height;

  for (let i = 0; i < size; i++) {
    const realVelocityHalf = state.mediumRealVelocityField[i] + 0.5 * dt * accelerationBefore.realAccelerationField[i];
    const imagVelocityHalf = state.mediumImagVelocityField[i] + 0.5 * dt * accelerationBefore.imagAccelerationField[i];

    nextState.mediumRealField[i] = state.mediumRealField[i] + dt * realVelocityHalf;
    nextState.mediumImagField[i] = state.mediumImagField[i] + dt * imagVelocityHalf;
    nextState.mediumRealVelocityField[i] = realVelocityHalf;
    nextState.mediumImagVelocityField[i] = imagVelocityHalf;
  }

  const accelerationAfterPosition = deriveWaveAccelerationPreview(nextState, conservativeConfig);

  for (let i = 0; i < size; i++) {
    nextState.mediumRealVelocityField[i] += 0.5 * dt * accelerationAfterPosition.realAccelerationField[i];
    nextState.mediumImagVelocityField[i] += 0.5 * dt * accelerationAfterPosition.imagAccelerationField[i];
  }

  const energyBeforeDamping = deriveWaveEnergySnapshot(nextState, conservativeConfig);
  const dampingFactor = Math.max(0, Math.min(1, 1 - config.localWaveDamping * config.dt));

  for (let i = 0; i < size; i++) {
    nextState.mediumRealVelocityField[i] *= dampingFactor;
    nextState.mediumImagVelocityField[i] *= dampingFactor;
  }

  nextState.tick = state.tick + 1;
  const energyAfter = deriveWaveEnergySnapshot(nextState, conservativeConfig);
  const dissipatedEnergy = Math.max(0, energyBeforeDamping.totalEnergy - energyAfter.totalEnergy);
  addDissipationUniformly(nextState, dissipatedEnergy);

  const energyCheck = deriveWaveEnergyLedgerCheck({
    energyBefore: energyBeforeDamping,
    energyAfter,
    dissipatedEnergy,
    tolerance: config.tolerance,
  });
  warnings.push(...accelerationBefore.warnings, ...energyCheck.ledger.warnings);

  if (config.localWaveDamping * config.dt > 1) {
    warnings.push('localWaveDamping * dt exceeded 1; dampingFactor was clamped to 0.');
  }

  return {
    state: nextState,
    report: {
      tick: nextState.tick,
      energyBefore,
      energyBeforeDamping,
      energyAfter,
      dampingFactor,
      dissipatedEnergy,
      energyCheck,
      changedFieldCount: countChangedWaveSamples(state, nextState),
      warnings,
      metricKind: 'derived',
    },
  };
}
