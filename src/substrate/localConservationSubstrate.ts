import { deriveEnergyLedger } from '../observer/deriveEnergyLedger.ts';
import type {
  LocalConservationStepReport,
  LocalConservationStepResult,
  LocalConservationSubstrateConfig,
  LocalConservationSubstrateState,
} from '../types/localConservationSubstrate.ts';

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

export function createLocalConservationSubstrate(
  config: Pick<LocalConservationSubstrateConfig, 'width' | 'height' | 'boundaryMode'>,
  initialStorage?: ArrayLike<number>,
): LocalConservationSubstrateState {
  const width = Math.max(1, Math.floor(config.width));
  const height = Math.max(1, Math.floor(config.height));
  const size = width * height;
  const storageField = new Float64Array(size);

  if (initialStorage) {
    const count = Math.min(size, initialStorage.length);
    for (let i = 0; i < count; i++) {
      storageField[i] = finiteNonNegative(initialStorage[i], 0);
    }
  }

  return {
    width,
    height,
    boundaryMode: config.boundaryMode,
    storageField,
    dissipationField: new Float64Array(size),
    residueField: new Float64Array(size),
    outflowField: new Float64Array(size),
    tick: 0,
  };
}

export function cloneLocalConservationSubstrate(
  state: LocalConservationSubstrateState,
): LocalConservationSubstrateState {
  return {
    width: state.width,
    height: state.height,
    boundaryMode: state.boundaryMode,
    storageField: new Float64Array(state.storageField),
    dissipationField: new Float64Array(state.dissipationField),
    residueField: new Float64Array(state.residueField),
    outflowField: new Float64Array(state.outflowField),
    tick: state.tick,
  };
}

export function sumLocalConservationStorage(state: LocalConservationSubstrateState): number {
  return total(state.storageField);
}

function normalizeConfig(config: LocalConservationSubstrateConfig): LocalConservationSubstrateConfig {
  return {
    ...config,
    width: Math.max(1, Math.floor(config.width)),
    height: Math.max(1, Math.floor(config.height)),
    localExchangeCoefficient: finiteNonNegative(config.localExchangeCoefficient, 0),
    localDissipationCoefficient: finiteNonNegative(config.localDissipationCoefficient, 0),
    residueConversionCoefficient: finiteNonNegative(config.residueConversionCoefficient, 0),
    outflowCoefficient: finiteNonNegative(config.outflowCoefficient, 0),
    dt: finiteNonNegative(config.dt, 1),
    tolerance: finiteNonNegative(config.tolerance ?? 1e-6, 1e-6),
  };
}

/**
 * updateLocalConservationSubstrate
 *
 * Standalone v3.0 substrate step.
 *
 * It does not connect to AETERNA runtime dynamics. It also does not encode
 * desired global outcomes such as decay, recovery, saturation, or rhythm.
 * The only operations are local exchange, named dissipation, named residue
 * conversion, and named outflow. Any decrease in storage is therefore
 * accounted as a transfer into explicit destination fields.
 */
export function updateLocalConservationSubstrate(
  state: LocalConservationSubstrateState,
  configInput: LocalConservationSubstrateConfig,
): LocalConservationStepResult {
  const config = normalizeConfig(configInput);
  if (state.width !== config.width || state.height !== config.height) {
    throw new Error('LocalConservationSubstrate config size must match state size.');
  }

  const size = state.width * state.height;
  const before = state.storageField;
  const afterExchange = new Float64Array(before);
  let exchangeMagnitude = 0;

  const exchangeRate = Math.min(0.25, config.localExchangeCoefficient * config.dt);

  if (exchangeRate > 0) {
    for (let y = 0; y < state.height; y++) {
      for (let x = 0; x < state.width; x++) {
        const i = indexOf(state.width, state.height, x, y);
        const right = indexOf(state.width, state.height, x + 1, y);
        const down = indexOf(state.width, state.height, x, y + 1);

        const rightDelta = (before[i] - before[right]) * exchangeRate;
        afterExchange[i] -= rightDelta;
        afterExchange[right] += rightDelta;
        exchangeMagnitude += Math.abs(rightDelta);

        const downDelta = (before[i] - before[down]) * exchangeRate;
        afterExchange[i] -= downDelta;
        afterExchange[down] += downDelta;
        exchangeMagnitude += Math.abs(downDelta);
      }
    }
  }

  const nextStorage = new Float64Array(size);
  const nextDissipation = new Float64Array(state.dissipationField);
  const nextResidue = new Float64Array(state.residueField);
  const nextOutflow = new Float64Array(state.outflowField);

  let dissipatedEnergy = 0;
  let residueConvertedEnergy = 0;
  let measuredOutflowEnergy = 0;
  let clampLossOrOverflow = 0;

  const dissipationRate = Math.min(1, config.localDissipationCoefficient * config.dt);
  const residueRate = Math.min(1, config.residueConversionCoefficient * config.dt);
  const outflowRate = Math.min(1, config.outflowCoefficient * config.dt);

  for (let i = 0; i < size; i++) {
    let remaining = finiteNonNegative(afterExchange[i], 0);

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

  const internalEnergyBefore = total(before);
  const internalEnergyAfter = total(nextStorage);
  const internalAccumulationDelta = internalEnergyAfter - internalEnergyBefore;

  const ledger = deriveEnergyLedger({
    timestamp: state.tick + 1,
    source: 'local-conservation-substrate',
    tolerance: config.tolerance,
    inputEnergy: 0,
    internalEnergyBefore,
    internalEnergyAfter,
    dissipatedEnergy,
    actuationOutputEnergy: 0,
    residueConvertedEnergy,
    clampLossOrOverflow,
    measuredOutflowEnergy,
  });

  const warnings = [...ledger.warnings];
  if (config.boundaryMode !== 'torus') {
    warnings.push('Only torus boundary mode is currently supported.');
  }

  const nextState: LocalConservationSubstrateState = {
    width: state.width,
    height: state.height,
    boundaryMode: state.boundaryMode,
    storageField: nextStorage,
    dissipationField: nextDissipation,
    residueField: nextResidue,
    outflowField: nextOutflow,
    tick: state.tick + 1,
  };

  const report: LocalConservationStepReport = {
    tick: nextState.tick,
    inputEnergy: 0,
    internalEnergyBefore,
    internalEnergyAfter,
    internalAccumulationDelta,
    dissipatedEnergy,
    actuationOutputEnergy: 0,
    residueConvertedEnergy,
    measuredOutflowEnergy,
    clampLossOrOverflow,
    exchangeMagnitude,
    ledger,
    warnings,
  };

  return { state: nextState, report };
}
