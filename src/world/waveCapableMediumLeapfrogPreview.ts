import type {
  WaveCapableMediumConfig,
  WaveCapableMediumLeapfrogStepResult,
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

function countAmplitudeWarnings(state: WaveCapableMediumState, amplitudeClamp: number): number {
  if (!Number.isFinite(amplitudeClamp)) return 0;
  let count = 0;
  for (let i = 0; i < state.mediumRealField.length; i++) {
    if (Math.abs(state.mediumRealField[i]) > amplitudeClamp) count += 1;
    if (Math.abs(state.mediumImagField[i]) > amplitudeClamp) count += 1;
  }
  return count;
}

export function updateWaveCapableMediumLeapfrogPreview(
  state: WaveCapableMediumState,
  configInput: WaveCapableMediumConfig,
): WaveCapableMediumLeapfrogStepResult {
  const normalizedConfig = normalizeConfig(configInput);
  const warnings: string[] = [];
  const conservativeConfig: WaveCapableMediumConfig = {
    ...normalizedConfig,
    localWaveDamping: 0,
  };

  if (normalizedConfig.localWaveDamping > 0) {
    warnings.push('localWaveDamping is rejected in v5.0.3 leapfrog preview; damping accounting comes in a later phase.');
  }

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

  nextState.tick = state.tick + 1;

  const energyAfter = deriveWaveEnergySnapshot(nextState, conservativeConfig);
  const accelerationAfter = deriveWaveAccelerationPreview(nextState, conservativeConfig);
  const energyCheck = deriveWaveEnergyLedgerCheck({
    energyBefore,
    energyAfter,
    tolerance: conservativeConfig.tolerance,
  });
  warnings.push(...accelerationBefore.warnings, ...accelerationAfter.warnings, ...energyCheck.ledger.warnings);

  const overClampCount = countAmplitudeWarnings(nextState, conservativeConfig.amplitudeClamp);
  if (overClampCount > 0) {
    warnings.push(`${overClampCount} wave amplitude sample(s) exceed amplitudeClamp; no clamp is applied in v5.0.3.`);
  }

  return {
    state: nextState,
    report: {
      tick: nextState.tick,
      energyBefore,
      energyAfter,
      accelerationBefore,
      accelerationAfter,
      energyCheck,
      changedFieldCount: countChangedWaveSamples(state, nextState),
      warnings,
      metricKind: 'derived',
    },
  };
}
