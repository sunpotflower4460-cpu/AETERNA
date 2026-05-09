import { deriveEnergyLedger } from '../observer/deriveEnergyLedger.ts';
import type {
  WaveCapableMediumConfig,
  WaveCapableMediumNoopStepResult,
  WaveCapableMediumState,
  WaveEnergyLedgerCheck,
  WaveEnergySnapshot,
} from '../types/waveCapableMedium.ts';

function finiteNonNegative(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : fallback;
}

function finiteSample(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function indexOf(width: number, height: number, x: number, y: number): number {
  const wrappedX = (x + width) % width;
  const wrappedY = (y + height) % height;
  return wrappedY * width + wrappedX;
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

function cloneField(field: Float64Array): Float64Array {
  return new Float64Array(field);
}

function countChangedSamples(before: Float64Array, after: Float64Array): number {
  const count = Math.min(before.length, after.length);
  let changed = before.length === after.length ? 0 : Math.abs(before.length - after.length);
  for (let i = 0; i < count; i++) {
    if (before[i] !== after[i]) changed += 1;
  }
  return changed;
}

export function createWaveCapableMediumState(
  configInput: Pick<WaveCapableMediumConfig, 'width' | 'height' | 'boundaryMode'>,
  initial?: Partial<Pick<WaveCapableMediumState,
    | 'mediumRealField'
    | 'mediumImagField'
    | 'mediumRealVelocityField'
    | 'mediumImagVelocityField'
  >>,
): WaveCapableMediumState {
  const width = Math.max(1, Math.floor(configInput.width));
  const height = Math.max(1, Math.floor(configInput.height));
  const size = width * height;

  function makeField(source?: ArrayLike<number>): Float64Array {
    const field = new Float64Array(size);
    if (!source) return field;
    const count = Math.min(size, source.length);
    for (let i = 0; i < count; i++) field[i] = finiteSample(source[i]);
    return field;
  }

  return {
    width,
    height,
    boundaryMode: configInput.boundaryMode,
    mediumRealField: makeField(initial?.mediumRealField),
    mediumImagField: makeField(initial?.mediumImagField),
    mediumRealVelocityField: makeField(initial?.mediumRealVelocityField),
    mediumImagVelocityField: makeField(initial?.mediumImagVelocityField),
    waveEnergyDissipationField: new Float64Array(size),
    waveEnergyResidueField: new Float64Array(size),
    waveEnergyOutflowField: new Float64Array(size),
    tick: 0,
  };
}

export function cloneWaveCapableMediumState(state: WaveCapableMediumState): WaveCapableMediumState {
  return {
    width: state.width,
    height: state.height,
    boundaryMode: state.boundaryMode,
    mediumRealField: cloneField(state.mediumRealField),
    mediumImagField: cloneField(state.mediumImagField),
    mediumRealVelocityField: cloneField(state.mediumRealVelocityField),
    mediumImagVelocityField: cloneField(state.mediumImagVelocityField),
    waveEnergyDissipationField: cloneField(state.waveEnergyDissipationField),
    waveEnergyResidueField: cloneField(state.waveEnergyResidueField),
    waveEnergyOutflowField: cloneField(state.waveEnergyOutflowField),
    tick: state.tick,
  };
}

export function deriveWaveEnergySnapshot(
  state: WaveCapableMediumState,
  configInput: WaveCapableMediumConfig,
): WaveEnergySnapshot {
  const config = normalizeConfig(configInput);
  if (state.width !== config.width || state.height !== config.height) {
    throw new Error('WaveCapableMedium config size must match state size.');
  }

  let kineticEnergy = 0;
  let elasticEnergy = 0;
  let finiteCellCount = 0;
  let nonFiniteCellCount = 0;

  for (let y = 0; y < state.height; y++) {
    for (let x = 0; x < state.width; x++) {
      const i = indexOf(state.width, state.height, x, y);
      const real = state.mediumRealField[i];
      const imag = state.mediumImagField[i];
      const realVelocity = state.mediumRealVelocityField[i];
      const imagVelocity = state.mediumImagVelocityField[i];

      if (
        Number.isFinite(real) &&
        Number.isFinite(imag) &&
        Number.isFinite(realVelocity) &&
        Number.isFinite(imagVelocity)
      ) {
        finiteCellCount += 1;
      } else {
        nonFiniteCellCount += 1;
      }

      const vr = finiteSample(realVelocity);
      const vi = finiteSample(imagVelocity);
      kineticEnergy += 0.5 * (vr * vr + vi * vi);

      const right = indexOf(state.width, state.height, x + 1, y);
      const down = indexOf(state.width, state.height, x, y + 1);
      const realHere = finiteSample(real);
      const imagHere = finiteSample(imag);

      for (const neighbor of [right, down]) {
        const realDelta = finiteSample(state.mediumRealField[neighbor]) - realHere;
        const imagDelta = finiteSample(state.mediumImagField[neighbor]) - imagHere;
        elasticEnergy += 0.5 * config.localElasticCoupling * (realDelta * realDelta + imagDelta * imagDelta);
      }
    }
  }

  return {
    kineticEnergy,
    elasticEnergy,
    totalEnergy: kineticEnergy + elasticEnergy,
    finiteCellCount,
    nonFiniteCellCount,
    metricKind: 'derived',
  };
}

export function deriveWaveEnergyLedgerCheck(input: {
  energyBefore: WaveEnergySnapshot;
  energyAfter: WaveEnergySnapshot;
  inputEnergy?: number;
  dissipatedEnergy?: number;
  residueConvertedEnergy?: number;
  measuredOutflowEnergy?: number;
  clampLossOrOverflow?: number;
  tolerance?: number;
}): WaveEnergyLedgerCheck {
  const inputEnergy = finiteNonNegative(input.inputEnergy, 0);
  const dissipatedEnergy = finiteNonNegative(input.dissipatedEnergy, 0);
  const residueConvertedEnergy = finiteNonNegative(input.residueConvertedEnergy, 0);
  const measuredOutflowEnergy = finiteNonNegative(input.measuredOutflowEnergy, 0);
  const clampLossOrOverflow = finiteNonNegative(input.clampLossOrOverflow, 0);

  const ledger = deriveEnergyLedger({
    source: 'wave-energy-math-foundation',
    tolerance: input.tolerance,
    inputEnergy,
    internalEnergyBefore: input.energyBefore.totalEnergy,
    internalEnergyAfter: input.energyAfter.totalEnergy,
    dissipatedEnergy,
    actuationOutputEnergy: 0,
    residueConvertedEnergy,
    clampLossOrOverflow,
    measuredOutflowEnergy,
  });

  return {
    source: 'wave-energy-math-foundation',
    energyBefore: input.energyBefore.totalEnergy,
    energyAfter: input.energyAfter.totalEnergy,
    inputEnergy,
    dissipatedEnergy,
    residueConvertedEnergy,
    measuredOutflowEnergy,
    clampLossOrOverflow,
    ledger,
    metricKind: 'derived',
  };
}

export function updateWaveCapableMediumNoop(
  state: WaveCapableMediumState,
  configInput: WaveCapableMediumConfig,
): WaveCapableMediumNoopStepResult {
  const config = normalizeConfig(configInput);
  const energyBefore = deriveWaveEnergySnapshot(state, config);
  const nextState = cloneWaveCapableMediumState(state);
  nextState.tick = state.tick + 1;
  const energyAfter = deriveWaveEnergySnapshot(nextState, config);

  const changedFieldCount =
    countChangedSamples(state.mediumRealField, nextState.mediumRealField) +
    countChangedSamples(state.mediumImagField, nextState.mediumImagField) +
    countChangedSamples(state.mediumRealVelocityField, nextState.mediumRealVelocityField) +
    countChangedSamples(state.mediumImagVelocityField, nextState.mediumImagVelocityField) +
    countChangedSamples(state.waveEnergyDissipationField, nextState.waveEnergyDissipationField) +
    countChangedSamples(state.waveEnergyResidueField, nextState.waveEnergyResidueField) +
    countChangedSamples(state.waveEnergyOutflowField, nextState.waveEnergyOutflowField);

  const energyCheck = deriveWaveEnergyLedgerCheck({
    energyBefore,
    energyAfter,
    tolerance: config.tolerance,
  });

  const warnings = [...energyCheck.ledger.warnings];
  if (config.boundaryMode !== 'torus') {
    warnings.push('Only torus boundary mode is currently supported.');
  }

  return {
    state: nextState,
    report: {
      tick: nextState.tick,
      energyBefore,
      energyAfter,
      energyCheck,
      changedFieldCount,
      warnings,
      metricKind: 'derived',
    },
  };
}
