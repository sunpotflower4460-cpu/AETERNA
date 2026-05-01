import type { ComplexFieldState } from '../types/complexField.ts';

const TWO_PI = Math.PI * 2;

function createSeededRandom(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function unwrapPhaseDifference(delta: number): number {
  if (!Number.isFinite(delta)) return 0;
  let next = delta;
  while (next > Math.PI) next -= TWO_PI;
  while (next < -Math.PI) next += TWO_PI;
  return next;
}

export function deriveAmplitudePhase(params: {
  real: Float32Array;
  imag: Float32Array;
}): {
  amplitude: Float32Array;
  phase: Float32Array;
  maxAmplitude: number;
  averageAmplitude: number;
  phaseCoherence: number;
  nanOrInfinityCount: number;
} {
  const { real, imag } = params;
  const length = Math.min(real.length, imag.length);
  const amplitude = new Float32Array(length);
  const phase = new Float32Array(length);

  let maxAmplitude = 0;
  let amplitudeSum = 0;
  let meanCos = 0;
  let meanSin = 0;
  let nanOrInfinityCount = 0;

  for (let index = 0; index < length; index++) {
    const realValue = real[index];
    const imagValue = imag[index];

    if (!Number.isFinite(realValue) || !Number.isFinite(imagValue)) {
      amplitude[index] = 0;
      phase[index] = 0;
      nanOrInfinityCount++;
      continue;
    }

    const amplitudeValue = Math.hypot(realValue, imagValue);
    const phaseValue = Math.atan2(imagValue, realValue);

    amplitude[index] = Number.isFinite(amplitudeValue) ? amplitudeValue : 0;
    phase[index] = Number.isFinite(phaseValue) ? phaseValue : 0;

    maxAmplitude = Math.max(maxAmplitude, amplitude[index]);
    amplitudeSum += amplitude[index];
    meanCos += Math.cos(phase[index]);
    meanSin += Math.sin(phase[index]);
  }

  const denominator = Math.max(1, length);
  meanCos /= denominator;
  meanSin /= denominator;

  return {
    amplitude,
    phase,
    maxAmplitude,
    averageAmplitude: amplitudeSum / denominator,
    phaseCoherence: Math.max(0, Math.min(1, Math.hypot(meanCos, meanSin))),
    nanOrInfinityCount,
  };
}

export function derivePhaseGradientField(params: {
  phase: Float32Array;
  segments: number;
}): {
  phaseGradient: Float32Array;
  averagePhaseGradient: number;
  phaseUnwrapWarningCount: number;
} {
  const { phase, segments } = params;
  const cellCount = segments * segments;
  const phaseGradient = new Float32Array(cellCount);

  let totalGradient = 0;
  let phaseUnwrapWarningCount = 0;

  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < segments; j++) {
      const index = i * segments + j;
      const right = i * segments + ((j + 1) % segments);
      const down = ((i + 1) % segments) * segments + j;
      const dx = unwrapPhaseDifference(phase[right] - phase[index]);
      const dy = unwrapPhaseDifference(phase[down] - phase[index]);

      if (Math.abs(dx) > Math.PI * 0.9) phaseUnwrapWarningCount++;
      if (Math.abs(dy) > Math.PI * 0.9) phaseUnwrapWarningCount++;

      const gradient = Math.hypot(dx, dy);
      phaseGradient[index] = Number.isFinite(gradient) ? gradient : 0;
      totalGradient += phaseGradient[index];
    }
  }

  return {
    phaseGradient,
    averagePhaseGradient: totalGradient / Math.max(1, cellCount),
    phaseUnwrapWarningCount,
  };
}

export function createComplexFieldState(params: {
  segments: number;
  seed?: number;
  initialAmplitude?: number;
}): ComplexFieldState {
  const {
    segments,
    seed = segments,
    initialAmplitude = 0.01,
  } = params;
  const cellCount = segments * segments;
  const random = createSeededRandom(seed);
  const real = new Float32Array(cellCount);
  const imag = new Float32Array(cellCount);

  for (let index = 0; index < cellCount; index++) {
    const quietReal = initialAmplitude * (random() - 0.5) * 0.5;
    const quietImag = initialAmplitude * (random() - 0.5) * 0.5;
    real[index] = quietReal;
    imag[index] = quietImag;
  }

  const {
    amplitude,
    phase,
    maxAmplitude,
    averageAmplitude,
    phaseCoherence,
    nanOrInfinityCount,
  } = deriveAmplitudePhase({ real, imag });
  const {
    phaseGradient,
    phaseUnwrapWarningCount,
  } = derivePhaseGradientField({ phase, segments });

  return {
    timestamp: 0,
    segments,
    real,
    imag,
    previousReal: new Float32Array(real),
    previousImag: new Float32Array(imag),
    amplitude,
    phase,
    phaseGradient,
    vorticity: new Float32Array(cellCount),
    topologicalCharge: new Int8Array(cellCount),
    vortexCandidate: new Uint8Array(cellCount),
    maxAmplitude,
    averageAmplitude,
    phaseCoherence,
    nanOrInfinityCount,
    amplitudeClampCount: 0,
    phaseUnwrapWarningCount,
  };
}
