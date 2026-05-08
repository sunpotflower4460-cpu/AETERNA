import type {
  LocalConservationSubstrateState,
} from '../types/localConservationSubstrate.ts';
import type {
  MembraneToInternalPairLedgerState,
  MembraneToInternalTransferConfig,
  MembraneToInternalTransferPositiveReport,
  MembraneToInternalTransferPositiveResult,
  MembraneToInternalTransferZeroReport,
  MembraneToInternalTransferZeroResult,
} from '../types/membraneToInternalTransfer.ts';
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

function drainableAt(state: SpatialWorldMediumState, i: number): number {
  const inflow = finiteNonNegative(state.membraneExchangeField[i], 0);
  const released = finiteNonNegative(state.membraneExchangeReleasedField[i], 0);
  return Math.max(0, inflow - released);
}

function totalDrainable(state: SpatialWorldMediumState): number {
  let sum = 0;
  for (let i = 0; i < state.membraneExchangeField.length; i++) {
    sum += drainableAt(state, i);
  }
  return sum;
}

function normalizeConfig(config: MembraneToInternalTransferConfig): MembraneToInternalTransferConfig {
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
  spatialWorldMediumState: SpatialWorldMediumState,
  localConservationSubstrateState: LocalConservationSubstrateState,
  config: MembraneToInternalTransferConfig,
): void {
  if (spatialWorldMediumState.width !== config.width || spatialWorldMediumState.height !== config.height) {
    throw new Error('SpatialWorldMedium size must match transfer config size.');
  }
  if (
    localConservationSubstrateState.width !== config.width ||
    localConservationSubstrateState.height !== config.height
  ) {
    throw new Error('LocalConservationSubstrate size must match transfer config size.');
  }
  if (spatialWorldMediumState.boundaryMode !== config.boundaryMode) {
    throw new Error('SpatialWorldMedium boundary mode must match transfer config boundary mode.');
  }
  if (localConservationSubstrateState.boundaryMode !== config.boundaryMode) {
    throw new Error('LocalConservationSubstrate boundary mode must match transfer config boundary mode.');
  }
}

export function deriveMembraneToInternalPairLedger(
  sourceOutEnergy: number,
  destinationInputEnergy: number,
  toleranceInput = 1e-6,
): MembraneToInternalPairLedgerState {
  const tolerance = finiteNonNegative(toleranceInput, 1e-6);
  const signedResidual = sourceOutEnergy - destinationInputEnergy;
  const residual = Math.abs(signedResidual);
  const status = residual <= tolerance ? 'closed' : 'open';
  const warnings: string[] = [];

  if (status !== 'closed') {
    warnings.push(
      'Membrane-to-internal pair ledger is open. Membrane outflow does not match substrate input.',
    );
  }

  return {
    source: 'SpatialWorldMedium.membraneExchangeField',
    destination: 'LocalConservationSubstrate.storageField',
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
 * updateMembraneToInternalTransferZero
 *
 * v3.8 transferCoefficient = 0 structure only.
 *
 * This creates the boundary between SpatialWorldMedium.membraneExchangeField and
 * LocalConservationSubstrate.storageField, with a per-pair ledger, but does not
 * move energy. It deliberately rejects non-zero transfer coefficients in this
 * phase. v3.9 can enable transferCoefficient > 0 only after this zero-transfer
 * structure closes cleanly.
 *
 * The drainable amount per cell is membraneExchangeField[i] - membraneExchangeReleasedField[i].
 * In the zero-transfer step, no cell is drained: membraneExchangeReleasedField is unchanged
 * and substrate.storageField is unchanged.
 */
export function updateMembraneToInternalTransferZero(
  spatialWorldMediumState: SpatialWorldMediumState,
  localConservationSubstrateState: LocalConservationSubstrateState,
  configInput: MembraneToInternalTransferConfig,
): MembraneToInternalTransferZeroResult {
  const config = normalizeConfig(configInput);
  ensureCompatibleStateShapes(spatialWorldMediumState, localConservationSubstrateState, config);

  if (config.cellMapping !== 'same-index') {
    throw new Error('Only same-index transfer mapping is currently supported.');
  }

  const membraneDrainableBefore = totalDrainable(spatialWorldMediumState);
  const membraneReleasedBefore = total(spatialWorldMediumState.membraneExchangeReleasedField);
  const substrateStorageBefore = total(localConservationSubstrateState.storageField);

  const acceptedTransferCoefficient = 0;
  const attemptedTransferCoefficient = config.transferCoefficient;
  const rejectedTransferCoefficient = attemptedTransferCoefficient;
  const transferEnergy = 0;

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

  const nextLocalConservationSubstrateState: LocalConservationSubstrateState = {
    ...localConservationSubstrateState,
    storageField: new Float64Array(localConservationSubstrateState.storageField),
    dissipationField: new Float64Array(localConservationSubstrateState.dissipationField),
    residueField: new Float64Array(localConservationSubstrateState.residueField),
    outflowField: new Float64Array(localConservationSubstrateState.outflowField),
    tick: localConservationSubstrateState.tick + 1,
  };

  const membraneDrainableAfter = totalDrainable(nextSpatialWorldMediumState);
  const membraneReleasedAfter = total(nextSpatialWorldMediumState.membraneExchangeReleasedField);
  const substrateStorageAfter = total(nextLocalConservationSubstrateState.storageField);

  const pairLedger = deriveMembraneToInternalPairLedger(transferEnergy, 0, config.tolerance);

  const warnings = [...pairLedger.warnings];
  if (rejectedTransferCoefficient > 0) {
    warnings.push('Non-zero transferCoefficient was rejected in v3.8. Transfer must remain zero.');
  }

  const report: MembraneToInternalTransferZeroReport = {
    tick: Math.max(nextSpatialWorldMediumState.tick, nextLocalConservationSubstrateState.tick),
    acceptedTransferCoefficient,
    attemptedTransferCoefficient,
    rejectedTransferCoefficient,
    transferEnergy,
    membraneDrainableBefore,
    membraneDrainableAfter,
    membraneReleasedBefore,
    membraneReleasedAfter,
    substrateStorageBefore,
    substrateStorageAfter,
    pairLedger,
    warnings,
  };

  return {
    spatialWorldMediumState: nextSpatialWorldMediumState,
    localConservationSubstrateState: nextLocalConservationSubstrateState,
    report,
  };
}

/**
 * updateMembraneToInternalTransferPositive
 *
 * v3.9 transferCoefficient > 0.
 *
 * This is the first phase that moves accumulated membrane inflow into the
 * LocalConservationSubstrate.storageField. The same per-cell transfer amount
 * is used atomically on both sides: it is added to membraneExchangeReleasedField
 * (so the drainable amount decreases) and added to substrate.storageField. The
 * pair ledger verifies source out equals destination input.
 *
 * Per cell, the available drainable amount is bounded by the historical net
 * inflow (membraneExchangeField - membraneExchangeReleasedField), so a cell can
 * only release what it has accumulated through the medium.
 */
export function updateMembraneToInternalTransferPositive(
  spatialWorldMediumState: SpatialWorldMediumState,
  localConservationSubstrateState: LocalConservationSubstrateState,
  configInput: MembraneToInternalTransferConfig,
): MembraneToInternalTransferPositiveResult {
  const config = normalizeConfig(configInput);
  ensureCompatibleStateShapes(spatialWorldMediumState, localConservationSubstrateState, config);

  if (config.cellMapping !== 'same-index') {
    throw new Error('Only same-index transfer mapping is currently supported.');
  }

  const size = config.width * config.height;
  const transferRate = Math.min(1, config.transferCoefficient * config.dt);

  const inflowBefore = spatialWorldMediumState.membraneExchangeField;
  const releasedBefore = spatialWorldMediumState.membraneExchangeReleasedField;
  const substrateBefore = localConservationSubstrateState.storageField;

  const nextReleasedField = new Float64Array(releasedBefore);
  const nextSubstrateStorage = new Float64Array(substrateBefore);

  const membraneDrainableBefore = totalDrainable(spatialWorldMediumState);
  const membraneReleasedBefore = total(releasedBefore);
  const substrateStorageBefore = total(substrateBefore);

  let transferEnergy = 0;
  for (let i = 0; i < size; i++) {
    const inflow = finiteNonNegative(inflowBefore[i], 0);
    const released = finiteNonNegative(releasedBefore[i], 0);
    const available = Math.max(0, inflow - released);
    const transferAmount = Math.min(available, available * transferRate);
    nextReleasedField[i] = released + transferAmount;
    nextSubstrateStorage[i] = finiteNonNegative(substrateBefore[i], 0) + transferAmount;
    transferEnergy += transferAmount;
  }

  const nextSpatialWorldMediumState: SpatialWorldMediumState = {
    ...spatialWorldMediumState,
    mediumStorageField: new Float64Array(spatialWorldMediumState.mediumStorageField),
    mediumDissipationField: new Float64Array(spatialWorldMediumState.mediumDissipationField),
    mediumResidueField: new Float64Array(spatialWorldMediumState.mediumResidueField),
    mediumOutflowField: new Float64Array(spatialWorldMediumState.mediumOutflowField),
    membraneExchangeField: new Float64Array(spatialWorldMediumState.membraneExchangeField),
    membraneExchangeReleasedField: nextReleasedField,
    tick: spatialWorldMediumState.tick + 1,
  };

  const nextLocalConservationSubstrateState: LocalConservationSubstrateState = {
    ...localConservationSubstrateState,
    storageField: nextSubstrateStorage,
    dissipationField: new Float64Array(localConservationSubstrateState.dissipationField),
    residueField: new Float64Array(localConservationSubstrateState.residueField),
    outflowField: new Float64Array(localConservationSubstrateState.outflowField),
    tick: localConservationSubstrateState.tick + 1,
  };

  const membraneDrainableAfter = totalDrainable(nextSpatialWorldMediumState);
  const membraneReleasedAfter = total(nextReleasedField);
  const substrateStorageAfter = total(nextSubstrateStorage);

  const sourceOutEnergy = membraneReleasedAfter - membraneReleasedBefore;
  const destinationInputEnergy = substrateStorageAfter - substrateStorageBefore;
  const pairLedger = deriveMembraneToInternalPairLedger(sourceOutEnergy, destinationInputEnergy, config.tolerance);
  const warnings = [...pairLedger.warnings];

  const report: MembraneToInternalTransferPositiveReport = {
    tick: Math.max(nextSpatialWorldMediumState.tick, nextLocalConservationSubstrateState.tick),
    acceptedTransferCoefficient: config.transferCoefficient,
    attemptedTransferCoefficient: config.transferCoefficient,
    rejectedTransferCoefficient: 0,
    transferRate,
    transferEnergy,
    membraneDrainableBefore,
    membraneDrainableAfter,
    membraneDrainableDelta: membraneDrainableAfter - membraneDrainableBefore,
    membraneReleasedBefore,
    membraneReleasedAfter,
    substrateStorageBefore,
    substrateStorageAfter,
    substrateStorageDelta: substrateStorageAfter - substrateStorageBefore,
    pairLedger,
    warnings,
  };

  return {
    spatialWorldMediumState: nextSpatialWorldMediumState,
    localConservationSubstrateState: nextLocalConservationSubstrateState,
    report,
  };
}
