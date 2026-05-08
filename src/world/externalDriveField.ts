import { deriveEnergyLedger } from '../observer/deriveEnergyLedger.ts';
import type {
  ExternalDriveFieldConfig,
  ExternalDriveFieldState,
  ExternalDriveFieldZeroStepReport,
  ExternalDriveFieldZeroStepResult,
} from '../types/externalDriveField.ts';

function finiteNonNegative(value: number, fallback: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : fallback;
}

function total(field: ArrayLike<number>): number {
  let sum = 0;
  for (let i = 0; i < field.length; i++) {
    const value = field[i];
    if (Number.isFinite(value)) sum += Math.max(0, value);
  }
  return sum;
}

export function createExternalDriveField(
  config: Pick<ExternalDriveFieldConfig, 'width' | 'height' | 'boundaryMode'>,
): ExternalDriveFieldState {
  const width = Math.max(1, Math.floor(config.width));
  const height = Math.max(1, Math.floor(config.height));
  const size = width * height;

  return {
    width,
    height,
    boundaryMode: config.boundaryMode,
    driveField: new Float64Array(size),
    rejectedDriveField: new Float64Array(size),
    tick: 0,
  };
}

function normalizeConfig(config: ExternalDriveFieldConfig): ExternalDriveFieldConfig {
  return {
    ...config,
    width: Math.max(1, Math.floor(config.width)),
    height: Math.max(1, Math.floor(config.height)),
    dt: finiteNonNegative(config.dt, 1),
    tolerance: finiteNonNegative(config.tolerance ?? 1e-6, 1e-6),
  };
}

/**
 * updateExternalDriveFieldZero
 *
 * v3.2 structural external drive field.
 *
 * This phase intentionally accepts zero supplied energy only. Any attempted
 * non-zero drive is rejected into `rejectedDriveField` and does not enter the
 * modeled input ledger. This proves the structure can exist without breaking
 * conservation before v3.3 turns on steady drive.
 */
export function updateExternalDriveFieldZero(
  state: ExternalDriveFieldState,
  configInput: ExternalDriveFieldConfig,
  attemptedDriveField?: ArrayLike<number> | null,
): ExternalDriveFieldZeroStepResult {
  const config = normalizeConfig(configInput);
  if (state.width !== config.width || state.height !== config.height) {
    throw new Error('ExternalDriveField config size must match state size.');
  }

  const size = state.width * state.height;
  const nextDriveField = new Float64Array(size);
  const nextRejectedDriveField = new Float64Array(state.rejectedDriveField);

  let attemptedDriveEnergy = 0;
  let rejectedDriveEnergy = 0;

  if (attemptedDriveField) {
    const count = Math.min(size, attemptedDriveField.length);
    for (let i = 0; i < count; i++) {
      const attempted = finiteNonNegative(attemptedDriveField[i], 0);
      attemptedDriveEnergy += attempted;
      if (attempted > 0) {
        nextRejectedDriveField[i] += attempted;
        rejectedDriveEnergy += attempted;
      }
    }
  }

  const acceptedDriveEnergy = total(nextDriveField);

  const ledger = deriveEnergyLedger({
    timestamp: state.tick + 1,
    source: 'external-drive-field-zero',
    tolerance: config.tolerance,
    inputEnergy: acceptedDriveEnergy,
    internalAccumulationDelta: acceptedDriveEnergy,
    dissipatedEnergy: 0,
    actuationOutputEnergy: 0,
    residueConvertedEnergy: 0,
    clampLossOrOverflow: 0,
    measuredOutflowEnergy: 0,
  });

  const warnings = [...ledger.warnings];
  if (rejectedDriveEnergy > 0) {
    warnings.push('Non-zero attempted drive was rejected in v3.2. ExternalDriveField must remain zero.');
  }
  if (config.boundaryMode !== 'torus') {
    warnings.push('Only torus boundary mode is currently supported.');
  }

  const nextState: ExternalDriveFieldState = {
    width: state.width,
    height: state.height,
    boundaryMode: state.boundaryMode,
    driveField: nextDriveField,
    rejectedDriveField: nextRejectedDriveField,
    tick: state.tick + 1,
  };

  const report: ExternalDriveFieldZeroStepReport = {
    tick: nextState.tick,
    inputEnergy: acceptedDriveEnergy,
    attemptedDriveEnergy,
    rejectedDriveEnergy,
    acceptedDriveEnergy,
    ledger,
    warnings,
  };

  return { state: nextState, report };
}
