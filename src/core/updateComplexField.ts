import type { TorusGeometry } from './torusGeometry.ts';
import type {
  ComplexFieldConfig,
  ComplexFieldState,
} from '../types/complexField.ts';
import {
  deriveAmplitudePhase,
  derivePhaseGradientField,
} from './complexField.ts';

const MIN_AMPLITUDE_CLAMP = 0.25;
const MAX_ALPHA = 0.2;
const MAX_BETA = 0.1;
const MAX_GAMMA = 0.1;
const MAX_DT = 2;

function clampNumber(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}

function scaledCurvatureFactor(
  geometry: TorusGeometry | null | undefined,
  index: number,
  curvatureInfluence: number
): number {
  if (!geometry || !geometry.cells[index] || curvatureInfluence <= 0) return 1;
  const gaussianCurvature = geometry.cells[index].gaussianCurvature;
  if (!Number.isFinite(gaussianCurvature)) return 1;
  return clampNumber(1 + gaussianCurvature * curvatureInfluence, 0.25, 4, 1);
}

export function computeComplexLaplacian(params: {
  real: Float32Array;
  imag: Float32Array;
  segments: number;
  metricMode?: 'flat' | 'curved';
  geometry?: TorusGeometry | null;
  curvatureInfluence?: number;
}): {
  laplacianReal: Float32Array;
  laplacianImag: Float32Array;
} {
  const {
    real,
    imag,
    segments,
    metricMode = 'flat',
    geometry = null,
    curvatureInfluence = 0,
  } = params;
  const cellCount = segments * segments;
  const laplacianReal = new Float32Array(cellCount);
  const laplacianImag = new Float32Array(cellCount);

  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < segments; j++) {
      const index = i * segments + j;
      const up = ((i - 1 + segments) % segments) * segments + j;
      const down = ((i + 1) % segments) * segments + j;
      const left = i * segments + ((j - 1 + segments) % segments);
      const right = i * segments + ((j + 1) % segments);
      const centerScale = metricMode === 'curved'
        ? scaledCurvatureFactor(geometry, index, curvatureInfluence)
        : 1;

      const neighborScale = metricMode === 'curved'
        ? (
          scaledCurvatureFactor(geometry, up, curvatureInfluence)
          + scaledCurvatureFactor(geometry, down, curvatureInfluence)
          + scaledCurvatureFactor(geometry, left, curvatureInfluence)
          + scaledCurvatureFactor(geometry, right, curvatureInfluence)
        ) / 4
        : 1;

      laplacianReal[index] = (
        (real[up] + real[down] + real[left] + real[right]) * neighborScale
        - real[index] * 4 * centerScale
      );
      laplacianImag[index] = (
        (imag[up] + imag[down] + imag[left] + imag[right]) * neighborScale
        - imag[index] * 4 * centerScale
      );
    }
  }

  return { laplacianReal, laplacianImag };
}

export function updateComplexField(params: {
  state: ComplexFieldState;
  config: ComplexFieldConfig;
  timestamp: number;
  metricMode?: 'flat' | 'curved';
  geometry?: TorusGeometry | null;
  curvatureInfluence?: number;
}): ComplexFieldState {
  const {
    state,
    config,
    timestamp,
    metricMode = 'flat',
    geometry = null,
    curvatureInfluence = 0,
  } = params;

  const amplitudeClamp = clampNumber(
    config.amplitudeClamp,
    MIN_AMPLITUDE_CLAMP,
    64,
    MIN_AMPLITUDE_CLAMP,
  );
  const alpha = clampNumber(config.alpha, 0, MAX_ALPHA, 0.01);
  const beta = clampNumber(config.beta, -MAX_BETA, MAX_BETA, 0.001);
  const gamma = clampNumber(config.gamma, 0, MAX_GAMMA, 0.001);
  const dt = clampNumber(config.dt, 0, MAX_DT, 1);
  const maxDelta = Math.max(0.05, amplitudeClamp * 0.5);
  const cellCount = state.real.length;

  const { laplacianReal, laplacianImag } = computeComplexLaplacian({
    real: state.real,
    imag: state.imag,
    segments: state.segments,
    metricMode,
    geometry,
    curvatureInfluence,
  });

  const nextReal = new Float32Array(cellCount);
  const nextImag = new Float32Array(cellCount);
  let amplitudeClampCount = 0;

  for (let index = 0; index < cellCount; index++) {
    const real = Number.isFinite(state.real[index]) ? state.real[index] : 0;
    const imag = Number.isFinite(state.imag[index]) ? state.imag[index] : 0;
    const ampSq = real * real + imag * imag;

    const rawNextReal = real + dt * (
      -alpha * laplacianImag[index]
      + beta * real
      - gamma * ampSq * real
    );
    const rawNextImag = imag + dt * (
      alpha * laplacianReal[index]
      + beta * imag
      - gamma * ampSq * imag
    );

    let guardedReal = real + clampNumber(rawNextReal - real, -maxDelta, maxDelta, 0);
    let guardedImag = imag + clampNumber(rawNextImag - imag, -maxDelta, maxDelta, 0);

    if (!Number.isFinite(guardedReal)) guardedReal = 0;
    if (!Number.isFinite(guardedImag)) guardedImag = 0;

    const amplitude = Math.hypot(guardedReal, guardedImag);
    if (amplitude > amplitudeClamp) {
      const scale = amplitudeClamp / amplitude;
      guardedReal *= scale;
      guardedImag *= scale;
      amplitudeClampCount++;
    }

    nextReal[index] = guardedReal;
    nextImag[index] = guardedImag;
  }

  const {
    amplitude,
    phase,
    maxAmplitude,
    averageAmplitude,
    phaseCoherence,
    nanOrInfinityCount,
  } = deriveAmplitudePhase({ real: nextReal, imag: nextImag });
  const {
    phaseGradient,
    phaseUnwrapWarningCount,
  } = derivePhaseGradientField({ phase, segments: state.segments });

  return {
    timestamp,
    segments: state.segments,
    real: nextReal,
    imag: nextImag,
    previousReal: new Float32Array(state.real),
    previousImag: new Float32Array(state.imag),
    amplitude,
    phase,
    phaseGradient,
    vorticity: new Float32Array(state.vorticity.length),
    topologicalCharge: new Int8Array(state.topologicalCharge.length),
    vortexCandidate: new Uint8Array(state.vortexCandidate.length),
    maxAmplitude,
    averageAmplitude,
    phaseCoherence,
    nanOrInfinityCount,
    amplitudeClampCount,
    phaseUnwrapWarningCount,
  };
}
