import type { ExternalDriveFieldState } from '../types/externalDriveField.ts';
import type {
  ExternalDriveToMediumTransferConfig,
  ExternalDriveToMediumTransferPositiveReport,
  ExternalDriveToMediumTransferPositiveResult,
  ExternalDriveToMediumTransferZeroReport,
  ExternalDriveToMediumTransferZeroResult,
  TransferPairLedgerState,
} from '../types/externalDriveToMediumTransfer.ts';
import type { SpatialWorldMediumState } from '../types/spatialWorldMedium.ts';

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

function normalizeConfig(config: ExternalDriveToMediumTransferConfig): ExternalDriveToMediumTransferConfig {
  return {
    ...config,
    width: Math.max(1, Math.floor(config.width)),
    height: Math.max(1, Math.floor(config.height)),
    transferCoefficient: finiteNonNegative(config.transferCoefficient, 0),
    dt: finiteNonNegative(config.dt, 1),
    tolerance: finiteNonNegative(config.tolerance ?? 1e-6, 1e-6),
  };
}

function ensureCompatibleStateShapes(
  externalDriveState: ExternalDriveFieldState,
  spatialWorldMediumState: SpatialWorldMediumState,
  config: ExternalDriveToMediumTransferConfig,
): void {
  if (externalDriveState.width !== config.width || externalDriveState.height !== config.height) {
    throw new Error('ExternalDriveField size must match transfer config size.');
  }
  if (spatialWorldMediumState.width !== config.width || spatialWorldMediumState.height !== config.height) {
    throw new Error('SpatialWorldMedium size must match transfer config size.');
  }
  if (externalDriveState.boundaryMode !== config.boundaryMode) {
    throw new Error('ExternalDriveField boundary mode must match transfer config boundary mode.');
  }
  if (spatialWorldMediumState.boundaryMode !== config.boundaryMode) {
    throw new Error('SpatialWorldMedium boundary mode must match transfer config boundary mode.');
  }
}

export function deriveTransferPairLedger(
  sourceOutEnergy: number,
  destinationInputEnergy: number,
  toleranceInput = 1e-6,
): TransferPairLedgerState {
  const tolerance = finiteNonNegative(toleranceInput, 1e-6);
  const signedResidual = sourceOutEnergy - destinationInputEnergy;
  const residual = Math.abs(signedResidual);
  const status = residual <= tolerance ? 'closed' : 'open';
  const warnings: string[] = [];

  if (status !== 'closed') {
    warnings.push('Transfer pair ledger is open. Source outflow does not match destination input.');
  }

  return {
    source: 'ExternalDriveField',
    destination: 'SpatialWorldMedium',
    sourceOutEnergy,
    destinationInputEnergy,
    signedResidual,
    residual,
    tolerance,
    status,
    matched: status === 'closed',
    warnings,
  };
}

/**
 * updateExternalDriveToMediumTransferZero
 *
 * v3.6 transferCoefficient = 0 structure only.
 *
 * This creates the transfer boundary and pair-ledger without moving energy.
 * It deliberately rejects non-zero transfer coefficients in this phase. v3.7
 * can enable transferCoefficient > 0 only after this zero-transfer structure
 * closes cleanly.
 */
export function updateExternalDriveToMediumTransferZero(
  externalDriveState: ExternalDriveFieldState,
  spatialWorldMediumState: SpatialWorldMediumState,
  configInput: ExternalDriveToMediumTransferConfig,
): ExternalDriveToMediumTransferZeroResult {
  const config = normalizeConfig(configInput);
  ensureCompatibleStateShapes(externalDriveState, spatialWorldMediumState, config);

  if (config.cellMapping !== 'same-index') {
    throw new Error('Only same-index transfer mapping is currently supported.');
  }

  const externalDriveEnergyBefore = total(externalDriveState.driveField);
  const mediumEnergyBefore = total(spatialWorldMediumState.mediumStorageField);

  const acceptedTransferCoefficient = 0;
  const attemptedTransferCoefficient = config.transferCoefficient;
  const rejectedTransferCoefficient = attemptedTransferCoefficient;
  const transferEnergy = 0;

  const nextExternalDriveState: ExternalDriveFieldState = {
    ...externalDriveState,
    driveField: new Float64Array(externalDriveState.driveField),
    rejectedDriveField: new Float64Array(externalDriveState.rejectedDriveField),
    tick: externalDriveState.tick + 1,
  };

  const nextSpatialWorldMediumState: SpatialWorldMediumState = {
    ...spatialWorldMediumState,
    mediumStorageField: new Float64Array(spatialWorldMediumState.mediumStorageField),
    mediumDissipationField: new Float64Array(spatialWorldMediumState.mediumDissipationField),
    mediumResidueField: new Float64Array(spatialWorldMediumState.mediumResidueField),
    mediumOutflowField: new Float64Array(spatialWorldMediumState.mediumOutflowField),
    membraneExchangeField: new Float64Array(spatialWorldMediumState.membraneExchangeField),
    membraneExchangeReleasedField: new Float64Array(spatialWorldMediumState.membraneExchangeReleasedField),
    tick: spatialWorldMediumState.tick + 1,
  };

  const externalDriveEnergyAfter = total(nextExternalDriveState.driveField);
  const mediumEnergyAfter = total(nextSpatialWorldMediumState.mediumStorageField);
  const pairLedger = deriveTransferPairLedger(transferEnergy, 0, config.tolerance);

  const warnings = [...pairLedger.warnings];
  if (rejectedTransferCoefficient > 0) {
    warnings.push('Non-zero transferCoefficient was rejected in v3.6. Transfer must remain zero.');
  }

  const report: ExternalDriveToMediumTransferZeroReport = {
    tick: Math.max(nextExternalDriveState.tick, nextSpatialWorldMediumState.tick),
    acceptedTransferCoefficient,
    attemptedTransferCoefficient,
    rejectedTransferCoefficient,
    transferEnergy,
    externalDriveEnergyBefore,
    externalDriveEnergyAfter,
    mediumEnergyBefore,
    mediumEnergyAfter,
    pairLedger,
    warnings,
  };

  return {
    externalDriveState: nextExternalDriveState,
    spatialWorldMediumState: nextSpatialWorldMediumState,
    report,
  };
}

/**
 * updateExternalDriveToMediumTransferPositive
 *
 * v3.7 transferCoefficient > 0.
 *
 * This is the first phase that moves stored drive from ExternalDriveField into
 * SpatialWorldMedium. The same per-cell transfer amount is used atomically on
 * both sides: it is subtracted from the source cell and added to the matching
 * destination cell. The pair ledger verifies source out equals destination
 * input. It does not couple into AETERNA internal buffers.
 */
export function updateExternalDriveToMediumTransferPositive(
  externalDriveState: ExternalDriveFieldState,
  spatialWorldMediumState: SpatialWorldMediumState,
  configInput: ExternalDriveToMediumTransferConfig,
): ExternalDriveToMediumTransferPositiveResult {
  const config = normalizeConfig(configInput);
  ensureCompatibleStateShapes(externalDriveState, spatialWorldMediumState, config);

  if (config.cellMapping !== 'same-index') {
    throw new Error('Only same-index transfer mapping is currently supported.');
  }

  const size = config.width * config.height;
  const transferRate = Math.min(1, config.transferCoefficient * config.dt);

  const sourceBefore = externalDriveState.driveField;
  const destinationBefore = spatialWorldMediumState.mediumStorageField;
  const nextDriveField = new Float64Array(sourceBefore);
  const nextMediumStorageField = new Float64Array(destinationBefore);

  const externalDriveEnergyBefore = total(sourceBefore);
  const mediumEnergyBefore = total(destinationBefore);

  let transferEnergy = 0;
  for (let i = 0; i < size; i++) {
    const available = finiteNonNegative(sourceBefore[i], 0);
    const transferAmount = Math.min(available, available * transferRate);
    nextDriveField[i] -= transferAmount;
    nextMediumStorageField[i] += transferAmount;
    transferEnergy += transferAmount;
  }

  const nextExternalDriveState: ExternalDriveFieldState = {
    ...externalDriveState,
    driveField: nextDriveField,
    rejectedDriveField: new Float64Array(externalDriveState.rejectedDriveField),
    tick: externalDriveState.tick + 1,
  };

  const nextSpatialWorldMediumState: SpatialWorldMediumState = {
    ...spatialWorldMediumState,
    mediumStorageField: nextMediumStorageField,
    mediumDissipationField: new Float64Array(spatialWorldMediumState.mediumDissipationField),
    mediumResidueField: new Float64Array(spatialWorldMediumState.mediumResidueField),
    mediumOutflowField: new Float64Array(spatialWorldMediumState.mediumOutflowField),
    membraneExchangeField: new Float64Array(spatialWorldMediumState.membraneExchangeField),
    membraneExchangeReleasedField: new Float64Array(spatialWorldMediumState.membraneExchangeReleasedField),
    tick: spatialWorldMediumState.tick + 1,
  };

  const externalDriveEnergyAfter = total(nextExternalDriveState.driveField);
  const mediumEnergyAfter = total(nextSpatialWorldMediumState.mediumStorageField);
  const sourceOutEnergy = externalDriveEnergyBefore - externalDriveEnergyAfter;
  const destinationInputEnergy = mediumEnergyAfter - mediumEnergyBefore;
  const pairLedger = deriveTransferPairLedger(sourceOutEnergy, destinationInputEnergy, config.tolerance);
  const warnings = [...pairLedger.warnings];

  const report: ExternalDriveToMediumTransferPositiveReport = {
    tick: Math.max(nextExternalDriveState.tick, nextSpatialWorldMediumState.tick),
    acceptedTransferCoefficient: config.transferCoefficient,
    attemptedTransferCoefficient: config.transferCoefficient,
    rejectedTransferCoefficient: 0,
    transferRate,
    transferEnergy,
    destinationInputEnergy,
    externalDriveEnergyBefore,
    externalDriveEnergyAfter,
    externalDriveEnergyDelta: externalDriveEnergyAfter - externalDriveEnergyBefore,
    mediumEnergyBefore,
    mediumEnergyAfter,
    mediumEnergyDelta: mediumEnergyAfter - mediumEnergyBefore,
    pairLedger,
    warnings,
  };

  return {
    externalDriveState: nextExternalDriveState,
    spatialWorldMediumState: nextSpatialWorldMediumState,
    report,
  };
}
