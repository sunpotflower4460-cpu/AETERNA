/**
 * Complex Scalar Field Types
 *
 * N2: Complex Scalar Field
 *
 * The complex field is a single field ψ observed through two numerical
 * components (real / imag). These components are not separate semantic fields.
 * They are observer/runtime buffers for one complex-valued torus field.
 *
 * Design principles:
 * - Default configuration is safe and non-disruptive.
 * - Existing scalar runtime remains available and is the default.
 * - Amplitude / phase are mathematical observables only.
 * - No semantic, consciousness, or emotion interpretation is permitted.
 * - Vortex-related values are observer-side candidates only.
 */

export type ComplexFieldMode = 'off' | 'observerOnly' | 'runtime';

export type FieldRuntimeMode =
  | 'scalar'
  | 'complexObserver'
  | 'complexRuntime';

export interface ComplexFieldState {
  timestamp: number;
  segments: number;
  real: Float32Array;
  imag: Float32Array;
  previousReal: Float32Array;
  previousImag: Float32Array;
  amplitude: Float32Array;
  phase: Float32Array;
  phaseGradient: Float32Array;
  vorticity: Float32Array;
  topologicalCharge: Int8Array;
  vortexCandidate: Uint8Array;
  maxAmplitude: number;
  averageAmplitude: number;
  phaseCoherence: number;
  nanOrInfinityCount: number;
  amplitudeClampCount: number;
  phaseUnwrapWarningCount: number;
}

export interface ComplexFieldConfig {
  enabled: boolean;
  mode: ComplexFieldMode;
  alpha: number;
  beta: number;
  gamma: number;
  dt: number;
  amplitudeClamp: number;
  couplingToScalar: number;
}

export const defaultComplexFieldConfig = {
  enabled: false,
  mode: 'observerOnly',
  alpha: 0.01,
  beta: 0.001,
  gamma: 0.001,
  dt: 1,
  amplitudeClamp: 5,
  couplingToScalar: 0,
} satisfies ComplexFieldConfig;
