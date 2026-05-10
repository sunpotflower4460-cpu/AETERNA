import type {
  PhaseCarryingDriveConfig,
  PhaseCarryingDriveCreationResult,
  PhaseCarryingDriveDiagnostic,
  PhaseCarryingDriveState,
} from '../types/phaseCarryingDrive.ts';

function finiteNonNegative(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : fallback;
}

function normalizeTurns(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return ((value % 1) + 1) % 1;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function makeSeededRandom(seedInput: number): () => number {
  let state = Math.floor(Math.abs(seedInput || 1)) >>> 0;
  if (state === 0) state = 1;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function createSeededSpatialPhaseField(size: number, seed: number): Float64Array {
  const random = makeSeededRandom(seed);
  const field = new Float64Array(size);
  for (let i = 0; i < size; i++) field[i] = random();
  return field;
}

function createCenterPointInjectionMask(width: number, height: number): Float64Array {
  const field = new Float64Array(width * height);
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  field[centerY * width + centerX] = 1;
  return field;
}

function copyPhaseField(source: ArrayLike<number>, size: number): Float64Array {
  const field = new Float64Array(size);
  const count = Math.min(size, source.length);
  for (let i = 0; i < count; i++) field[i] = normalizeTurns(source[i]);
  return field;
}

function copyMaskField(source: ArrayLike<number>, size: number): Float64Array {
  const field = new Float64Array(size);
  const count = Math.min(size, source.length);
  for (let i = 0; i < count; i++) field[i] = clamp01(source[i]);
  return field;
}

function summarizeMask(mask: Float64Array): {
  activeInjectionCellCount: number;
  injectionMaskTotal: number;
  fullInjectionMask: boolean;
  zeroInjectionMask: boolean;
} {
  let activeInjectionCellCount = 0;
  let injectionMaskTotal = 0;
  let allOne = mask.length > 0;
  let allZero = mask.length > 0;

  for (const value of mask) {
    if (value > 0) activeInjectionCellCount += 1;
    injectionMaskTotal += value;
    if (value < 1) allOne = false;
    if (value > 0) allZero = false;
  }

  return {
    activeInjectionCellCount,
    injectionMaskTotal,
    fullInjectionMask: allOne,
    zeroInjectionMask: allZero,
  };
}

function allSamplesEqual(field: Float64Array, tolerance = 1e-12): boolean {
  if (field.length <= 1) return true;
  const first = field[0];
  for (let i = 1; i < field.length; i++) {
    if (Math.abs(field[i] - first) > tolerance) return false;
  }
  return true;
}

function phaseSpread(field: Float64Array): number {
  if (field.length === 0) return 0;
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const value of field) {
    min = Math.min(min, value);
    max = Math.max(max, value);
  }
  return Number.isFinite(min) && Number.isFinite(max) ? max - min : 0;
}

export function createPhaseCarryingDriveState(
  configInput: PhaseCarryingDriveConfig,
): PhaseCarryingDriveCreationResult {
  const width = Math.max(1, Math.floor(configInput.width));
  const height = Math.max(1, Math.floor(configInput.height));
  const size = width * height;
  const phaseSeed = finiteNonNegative(configInput.phaseSeed, 1);

  const spatialPhaseMode = configInput.spatialPhaseField ? 'provided' : 'seededNoise';
  const injectionMaskMode = configInput.injectionMask ? 'provided' : 'centerPoint';
  const spatialPhaseField = configInput.spatialPhaseField
    ? copyPhaseField(configInput.spatialPhaseField, size)
    : createSeededSpatialPhaseField(size, phaseSeed);
  const injectionMask = configInput.injectionMask
    ? copyMaskField(configInput.injectionMask, size)
    : createCenterPointInjectionMask(width, height);
  const maskSummary = summarizeMask(injectionMask);
  const allSpatialPhaseSamplesEqual = allSamplesEqual(spatialPhaseField);
  const warnings: string[] = [];

  if (allSpatialPhaseSamplesEqual && size > 1) {
    warnings.push('All spatial phase samples are equal; this may accidentally create same-phase drive in later phases.');
  }
  if (maskSummary.fullInjectionMask && size > 1) {
    warnings.push('Injection mask covers every cell; later injection will act as a full-field source unless changed.');
  }
  if (maskSummary.zeroInjectionMask) {
    warnings.push('Injection mask has no active cells; later injection will not reach the wave medium unless changed.');
  }
  if (configInput.boundaryMode !== 'torus') {
    warnings.push('Only torus boundary mode is currently supported.');
  }

  const state: PhaseCarryingDriveState = {
    width,
    height,
    boundaryMode: configInput.boundaryMode,
    driveRealField: new Float64Array(size),
    driveImagField: new Float64Array(size),
    spatialPhaseField,
    injectionMask,
    tick: 0,
  };

  return {
    state,
    report: {
      tick: state.tick,
      spatialPhaseMode,
      injectionMaskMode,
      activeInjectionCellCount: maskSummary.activeInjectionCellCount,
      injectionMaskTotal: maskSummary.injectionMaskTotal,
      fullInjectionMask: maskSummary.fullInjectionMask,
      zeroInjectionMask: maskSummary.zeroInjectionMask,
      allSpatialPhaseSamplesEqual,
      warnings,
      metricKind: 'derived',
    },
  };
}

export function derivePhaseCarryingDriveDiagnostic(state: PhaseCarryingDriveState): PhaseCarryingDriveDiagnostic {
  let driveMagnitudeTotal = 0;
  let driveMagnitudeMax = 0;
  const warnings: string[] = [];

  for (let i = 0; i < state.driveRealField.length; i++) {
    const real = Number.isFinite(state.driveRealField[i]) ? state.driveRealField[i] : 0;
    const imag = Number.isFinite(state.driveImagField[i]) ? state.driveImagField[i] : 0;
    const magnitude = Math.sqrt(real * real + imag * imag);
    driveMagnitudeTotal += magnitude;
    driveMagnitudeMax = Math.max(driveMagnitudeMax, magnitude);
  }

  const maskSummary = summarizeMask(state.injectionMask);
  const allSpatialPhaseSamplesEqual = allSamplesEqual(state.spatialPhaseField);
  if (allSpatialPhaseSamplesEqual && state.spatialPhaseField.length > 1) {
    warnings.push('All spatial phase samples are equal; this may accidentally create same-phase drive in later phases.');
  }
  if (maskSummary.fullInjectionMask && state.injectionMask.length > 1) {
    warnings.push('Injection mask covers every cell; later injection will act as a full-field source unless changed.');
  }
  if (maskSummary.zeroInjectionMask) {
    warnings.push('Injection mask has no active cells; later injection will not reach the wave medium unless changed.');
  }

  return {
    driveMagnitudeTotal,
    driveMagnitudeMax,
    activeInjectionCellCount: maskSummary.activeInjectionCellCount,
    injectionMaskTotal: maskSummary.injectionMaskTotal,
    phaseSpread: phaseSpread(state.spatialPhaseField),
    warnings,
    metricKind: 'derived',
  };
}
