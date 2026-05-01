import { describe, expect, it } from 'vitest';

import {
  createComplexFieldState,
  deriveAmplitudePhase,
  derivePhaseGradientField,
} from '../../core/complexField.js';

describe('N2 complexField core helpers', () => {
  it('createComplexFieldState creates finite quiet buffers with deterministic seed', () => {
    const first = createComplexFieldState({ segments: 4, seed: 123, initialAmplitude: 0.01 });
    const second = createComplexFieldState({ segments: 4, seed: 123, initialAmplitude: 0.01 });

    expect(first.real).toHaveLength(16);
    expect(first.imag).toHaveLength(16);
    expect(first.amplitude).toHaveLength(16);
    expect(first.phase).toHaveLength(16);
    expect(Array.from(first.real)).toEqual(Array.from(second.real));
    expect(Array.from(first.imag)).toEqual(Array.from(second.imag));
    expect(first.phaseCoherence).toBeGreaterThanOrEqual(0);
    expect(first.phaseCoherence).toBeLessThanOrEqual(1);
    expect(first.nanOrInfinityCount).toBe(0);
  });

  it('deriveAmplitudePhase derives amplitude and canonical phase from real/imag pairs', () => {
    const real = new Float32Array([1, 0, -1, 0]);
    const imag = new Float32Array([0, 1, 0, -1]);
    const derived = deriveAmplitudePhase({ real, imag });

    expect(Array.from(derived.amplitude)).toEqual([1, 1, 1, 1]);
    expect(derived.phase[0]).toBeCloseTo(0);
    expect(derived.phase[1]).toBeCloseTo(Math.PI / 2);
    expect(Math.abs(derived.phase[2])).toBeCloseTo(Math.PI);
    expect(derived.phase[3]).toBeCloseTo(-Math.PI / 2);
    expect(derived.averageAmplitude).toBeCloseTo(1);
    expect(derived.phaseCoherence).toBeGreaterThanOrEqual(0);
    expect(derived.phaseCoherence).toBeLessThanOrEqual(1);
  });

  it('derivePhaseGradientField returns finite gradients and unwrap warning counts', () => {
    const phase = new Float32Array([
      0, Math.PI / 2,
      -Math.PI / 2, Math.PI,
    ]);
    const derived = derivePhaseGradientField({ phase, segments: 2 });

    expect(derived.phaseGradient).toHaveLength(4);
    derived.phaseGradient.forEach((value) => {
      expect(Number.isFinite(value)).toBe(true);
    });
    expect(derived.averagePhaseGradient).toBeGreaterThanOrEqual(0);
    expect(derived.phaseUnwrapWarningCount).toBeGreaterThanOrEqual(0);
  });
});
