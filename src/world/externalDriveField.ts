import { deriveEnergyLedger } from '../observer/deriveEnergyLedger.ts';
import type {
  ExternalDriveFieldConfig,
  ExternalDriveFieldState,
  ExternalDriveFieldZeroStepReport,
  ExternalDriveFieldZeroStepResult,
  SteadyExternalDriveConfig,
  SteadyExternalDriveStepReport,
  SteadyExternalDriveStepResult,
  SupplyCutoffStepReport,
  SupplyCutoffStepResult,
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

/**
 * updateSteadyExternalDrive
 *
 * v3.3 steady drive step.
 *
 * This accepts a constant non-negative drive amount into the external drive
 * field only. It does not couple into SpatialWorldMedium or AETERNA internal
 * buffers yet. There is no pulse, rhythm, periodic modulation, or life-like
 * effect. The accepted input is accounted by the EnergyLedger as accumulation
 * inside the drive field.
 */
export function updateSteadyExternalDrive(
  state: ExternalDriveFieldState,
  configInput: SteadyExternalDriveConfig,
): SteadyExternalDriveStepResult {
  const config = {
    ...normalizeConfig(configInput),
    steadyDrivePerCell: finiteNonNegative(configInput.steadyDrivePerCell, 0),
  };

  if (state.width !== config.width || state.height !== config.height) {
    throw new Error('SteadyExternalDrive config size must match state size.');
  }

  const size = state.width * state.height;
  const previousDriveField = state.driveField;
  const nextDriveField = new Float64Array(size);
  const nextRejectedDriveField = new Float64Array(state.rejectedDriveField);

  const previousDriveEnergy = total(previousDriveField);
  let acceptedDriveEnergy = 0;

  for (let i = 0; i < size; i++) {
    const accepted = config.steadyDrivePerCell * config.dt;
    nextDriveField[i] = previousDriveField[i] + accepted;
    acceptedDriveEnergy += accepted;
  }

  const nextDriveEnergy = total(nextDriveField);
  const internalAccumulationDelta = nextDriveEnergy - previousDriveEnergy;

  const ledger = deriveEnergyLedger({
    timestamp: state.tick + 1,
    source: 'steady-external-drive',
    tolerance: config.tolerance,
    inputEnergy: acceptedDriveEnergy,
    internalEnergyBefore: previousDriveEnergy,
    internalEnergyAfter: nextDriveEnergy,
    dissipatedEnergy: 0,
    actuationOutputEnergy: 0,
    residueConvertedEnergy: 0,
    clampLossOrOverflow: 0,
    measuredOutflowEnergy: 0,
  });

  const warnings = [...ledger.warnings];
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

  const report: SteadyExternalDriveStepReport = {
    tick: nextState.tick,
    inputEnergy: acceptedDriveEnergy,
    attemptedDriveEnergy: acceptedDriveEnergy,
    rejectedDriveEnergy: 0,
    acceptedDriveEnergy,
    ledger,
    warnings,
  };

  // Keep the explicit local variable visible for audits and avoid accidental
  // result-coded interpretation of the ledger input.
  void internalAccumulationDelta;

  return { state: nextState, report };
}

/**
 * updateSupplyCutoffDrive
 *
 * v3.4 supply cutoff test.
 *
 * This stops accepted drive without applying a special decay outcome rule.
 * Existing driveField storage is carried forward unchanged because no transfer,
 * dissipation, or outflow destination is defined in this phase. If stored drive
 * remains, that is a valid observation rather than a failure.
 */
export function updateSupplyCutoffDrive(
  state: ExternalDriveFieldState,
  configInput: ExternalDriveFieldConfig,
): SupplyCutoffStepResult {
  const config = normalizeConfig(configInput);
  if (state.width !== config.width || state.height !== config.height) {
    throw new Error('SupplyCutoffDrive config size must match state size.');
  }

  const driveEnergyBeforeCutoff = total(state.driveField);
  const nextDriveField = new Float64Array(state.driveField);
  const driveEnergyAfterCutoff = total(nextDriveField);
  const driveEnergyDeltaDuringCutoff = driveEnergyAfterCutoff - driveEnergyBeforeCutoff;

  const ledger = deriveEnergyLedger({
    timestamp: state.tick + 1,
    source: 'supply-cutoff-drive',
    tolerance: config.tolerance,
    inputEnergy: 0,
    internalEnergyBefore: driveEnergyBeforeCutoff,
    internalEnergyAfter: driveEnergyAfterCutoff,
    dissipatedEnergy: 0,
    actuationOutputEnergy: 0,
    residueConvertedEnergy: 0,
    clampLossOrOverflow: 0,
    measuredOutflowEnergy: 0,
  });

  const warnings = [...ledger.warnings];
  if (config.boundaryMode !== 'torus') {
    warnings.push('Only torus boundary mode is currently supported.');
  }

  const nextState: ExternalDriveFieldState = {
    width: state.width,
    height: state.height,
    boundaryMode: state.boundaryMode,
    driveField: nextDriveField,
    rejectedDriveField: new Float64Array(state.rejectedDriveField),
    tick: state.tick + 1,
  };

  const report: SupplyCutoffStepReport = {
    tick: nextState.tick,
    inputEnergy: 0,
    attemptedDriveEnergy: 0,
    rejectedDriveEnergy: 0,
    acceptedDriveEnergy: 0,
    driveEnergyBeforeCutoff,
    driveEnergyAfterCutoff,
    driveEnergyDeltaDuringCutoff,
    cutoffVerifiedNoSpecialOutcomeRule: ledger.status === 'closed' && driveEnergyDeltaDuringCutoff === 0,
    ledger,
    warnings,
  };

  return { state: nextState, report };
}
