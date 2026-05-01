import { describe, expect, it } from 'vitest';

import { createComplexFieldState } from '../../core/complexField.js';
import {
  computeComplexLaplacian,
  updateComplexField,
} from '../../core/updateComplexField.js';

describe('N2 updateComplexField', () => {
  it('computeComplexLaplacian returns torus-sized buffers', () => {
    const state = createComplexFieldState({ segments: 3, seed: 9 });
    const result = computeComplexLaplacian({
      real: state.real,
      imag: state.imag,
      segments: 3,
    });

    expect(result.laplacianReal).toHaveLength(9);
    expect(result.laplacianImag).toHaveLength(9);
  });

  it('updateComplexField keeps values finite under normal update', () => {
    const state = createComplexFieldState({ segments: 4, seed: 7 });
    const next = updateComplexField({
      state,
      config: {
        enabled: true,
        mode: 'observerOnly',
        alpha: 0.01,
        beta: 0.001,
        gamma: 0.001,
        dt: 1,
        amplitudeClamp: 0.5,
        couplingToScalar: 0,
      },
      timestamp: 1,
    });

    next.real.forEach((value) => expect(Number.isFinite(value)).toBe(true));
    next.imag.forEach((value) => expect(Number.isFinite(value)).toBe(true));
    next.amplitude.forEach((value) => expect(Number.isFinite(value)).toBe(true));
    expect(next.phaseCoherence).toBeGreaterThanOrEqual(0);
    expect(next.phaseCoherence).toBeLessThanOrEqual(1);
    expect(next.nanOrInfinityCount).toBe(0);
  });

  it('updateComplexField applies amplitude clamps to oversized values', () => {
    const state = createComplexFieldState({ segments: 2, seed: 3 });
    state.real.fill(10);
    state.imag.fill(10);
    const next = updateComplexField({
      state,
      config: {
        enabled: true,
        mode: 'observerOnly',
        alpha: 0.2,
        beta: 0.1,
        gamma: 0,
        dt: 2,
        amplitudeClamp: 0.25,
        couplingToScalar: 0,
      },
      timestamp: 1,
    });

    expect(next.amplitudeClampCount).toBeGreaterThan(0);
    next.amplitude.forEach((value) => {
      expect(value).toBeLessThanOrEqual(0.250001);
    });
  });
});
