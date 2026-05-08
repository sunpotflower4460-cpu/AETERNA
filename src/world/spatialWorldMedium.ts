import { deriveEnergyLedger } from '../observer/deriveEnergyLedger.ts';
import type {
  SpatialWorldMediumConfig,
  SpatialWorldMediumState,
  SpatialWorldMediumStepReport,
  SpatialWorldMediumStepResult,
} from '../types/spatialWorldMedium.ts';

function finiteNonNegative(value: number, fallback: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : fallback;
}

function total(field: ArrayLike<number>): number {
  let sum = 0;
  for (let i = 0; i < field.length; i++) {
    const value = field[i];
    if (Number.isFinite(value)) sum += value;
  }
  return sum;
}

function indexOf(width: number, height: number, x: number, y: number): number {
  const wrappedX = (x + width) % width;
  const wrappedY = (y + height) % height;
  return wrappedY * width + wrappedX;
}

export function createSpatialWorldMedium(
  config: Pick<SpatialWorldMediumConfig, 'width' | 'height' | 'boundaryMode'>,
  initialMediumStorage?: ArrayLike<number>,
): SpatialWorldMediumState {
  const width = Math.max(1, Math.floor(config.width));
  const height = Math.max(1, Math.floor(config.height));
  const size = width * height;
  const mediumStorageField = new Float64Array(size);

  if (initialMediumStorage) {
    const count = Math.min(size, initialMediumStorage.length);
    for (let i = 0; i < count; i++) {
      mediumStorageField[i] = finiteNonNegative(initialMediumStorage[i], 0);
    }
  }

  return {
    width,
    height,
    boundaryMode: config.boundaryMode,
    mediumStorageField,
    mediumDissipationField: new Float64Array(size),
    mediumResidueField: new Float64Array(size),
    mediumOutflowField: new Float64Array(size),
    membraneExchangeField: new Float64Array(size),
    membraneExchangeReleasedField: new Float64Array(size),
    tick: 0,
  };
}

export function sumSpatialWorldMediumStorage(state: SpatialWorldMediumState): number {
  return total(state.mediumStorageField);
}

function normalizeConfig(config: SpatialWorldMediumConfig): SpatialWorldMediumConfig {
  return {
    ...config,
    width: Math.max(1, Math.floor(config.width)),
    height: Math.max(1, Math.floor(config.height)),
    localExchangeCoefficient: finiteNonNegative(config.localExchangeCoefficient, 0),
    localDissipationCoefficient: finiteNonNegative(config.localDissipationCoefficient, 0),
    residueConversionCoefficient: finiteNonNegative(config.residueConversionCoefficient, 0),
    outflowCoefficient: finiteNonNegative(config.outflowCoefficient, 0),
    membraneExchangeCoefficient: finiteNonNegative(config.membraneExchangeCoefficient, 0),
    dt: finiteNonNegative(config.dt, 1),
    tolerance: finiteNonNegative(config.tolerance ?? 1e-6, 1e-6),
  };
}

/**
 * updateSpatialWorldMedium
 *
 * v3.1 standalone spatial medium step.
 *
 * This does not replace the existing scalar WorldMedium runtime yet. It also
 * does not add ExternalDriveField. The medium has no external supply in this
 * phase; inputEnergy remains 0. Any decrease in medium storage must go to named
 * destinations: dissipation, residue, outflow, or membrane exchange.
 */
export function updateSpatialWorldMedium(
  state: SpatialWorldMediumState,
  configInput: SpatialWorldMediumConfig,
): SpatialWorldMediumStepResult {
  const config = normalizeConfig(configInput);
  if (state.width !== config.width || state.height !== config.height) {
    throw new Error('SpatialWorldMedium config size must match state size.');
  }

  const size = state.width * state.height;
  const before = state.mediumStorageField;
  const exchangeDelta = new Float64Array(size);
  const afterExchange = new Float64Array(size);
  let localExchangeMagnitude = 0;

  const exchangeRate = Math.min(0.25, config.localExchangeCoefficient * config.dt);
  if (exchangeRate > 0) {
    for (let y = 0; y < state.height; y++) {
      for (let x = 0; x < state.width; x++) {
        const i = indexOf(state.width, state.height, x, y);
        const right = indexOf(state.width, state.height, x + 1, y);
        const down = indexOf(state.width, state.height, x, y + 1);

        const rightDelta = (before[i] - before[right]) * exchangeRate;
        exchangeDelta[i] -= rightDelta;
        exchangeDelta[right] += rightDelta;
        localExchangeMagnitude += Math.abs(rightDelta);

        const downDelta = (before[i] - before[down]) * exchangeRate;
        exchangeDelta[i] -= downDelta;
        exchangeDelta[down] += downDelta;
        localExchangeMagnitude += Math.abs(downDelta);
      }
    }
  }

  for (let i = 0; i < size; i++) {
    afterExchange[i] = before[i] + exchangeDelta[i];
  }

  const nextStorage = new Float64Array(size);
  const nextDissipation = new Float64Array(state.mediumDissipationField);
  const nextResidue = new Float64Array(state.mediumResidueField);
  const nextOutflow = new Float64Array(state.mediumOutflowField);
  const nextMembraneExchange = new Float64Array(state.membraneExchangeField);

  let dissipatedEnergy = 0;
  let residueConvertedEnergy = 0;
  let measuredOutflowEnergy = 0;
  let membraneExchangeEnergy = 0;
  let clampLossOrOverflow = 0;

  const dissipationRate = Math.min(1, config.localDissipationCoefficient * config.dt);
  const residueRate = Math.min(1, config.residueConversionCoefficient * config.dt);
  const outflowRate = Math.min(1, config.outflowCoefficient * config.dt);
  const membraneExchangeRate = Math.min(1, config.membraneExchangeCoefficient * config.dt);

  for (let i = 0; i < size; i++) {
    let remaining = finiteNonNegative(afterExchange[i], 0);

    const membraneExchange = remaining * membraneExchangeRate;
    remaining -= membraneExchange;
    nextMembraneExchange[i] += membraneExchange;
    membraneExchangeEnergy += membraneExchange;

    const dissipated = remaining * dissipationRate;
    remaining -= dissipated;
    nextDissipation[i] += dissipated;
    dissipatedEnergy += dissipated;

    const residue = remaining * residueRate;
    remaining -= residue;
    nextResidue[i] += residue;
    residueConvertedEnergy += residue;

    const outflow = remaining * outflowRate;
    remaining -= outflow;
    nextOutflow[i] += outflow;
    measuredOutflowEnergy += outflow;

    if (!Number.isFinite(remaining) || remaining < 0) {
      clampLossOrOverflow += Number.isFinite(remaining) ? Math.abs(remaining) : 0;
      remaining = 0;
    }

    nextStorage[i] = remaining;
  }

  const mediumEnergyBefore = total(before);
  const mediumEnergyAfter = total(nextStorage);
  const mediumAccumulationDelta = mediumEnergyAfter - mediumEnergyBefore;

  const ledger = deriveEnergyLedger({
    timestamp: state.tick + 1,
    source: 'spatial-world-medium',
    tolerance: config.tolerance,
    inputEnergy: 0,
    internalEnergyBefore: mediumEnergyBefore,
    internalEnergyAfter: mediumEnergyAfter,
    dissipatedEnergy,
    actuationOutputEnergy: 0,
    residueConvertedEnergy,
    boundaryExchangeEnergy: membraneExchangeEnergy,
    clampLossOrOverflow,
    measuredOutflowEnergy,
  });

  const warnings = [...ledger.warnings];
  if (config.boundaryMode !== 'torus') {
    warnings.push('Only torus boundary mode is currently supported.');
  }

  const nextState: SpatialWorldMediumState = {
    width: state.width,
    height: state.height,
    boundaryMode: state.boundaryMode,
    mediumStorageField: nextStorage,
    mediumDissipationField: nextDissipation,
    mediumResidueField: nextResidue,
    mediumOutflowField: nextOutflow,
    membraneExchangeField: nextMembraneExchange,
    membraneExchangeReleasedField: new Float64Array(state.membraneExchangeReleasedField),
    tick: state.tick + 1,
  };

  const report: SpatialWorldMediumStepReport = {
    tick: nextState.tick,
    inputEnergy: 0,
    mediumEnergyBefore,
    mediumEnergyAfter,
    mediumAccumulationDelta,
    dissipatedEnergy,
    residueConvertedEnergy,
    measuredOutflowEnergy,
    membraneExchangeEnergy,
    clampLossOrOverflow,
    localExchangeMagnitude,
    ledger,
    warnings,
  };

  return { state: nextState, report };
}
