import { describe, expect, it } from 'vitest';
import { applyNonlinearPhaseStep } from '../../pure/field/nonlinearPhaseStep.ts';
import type { ComplexField } from '../../pure/geometry/torus.ts';

function amplitudeSquared(field: ComplexField): Float64Array {
  const out = new Float64Array(field.real.length);
  for (let i = 0; i < out.length; i++) out[i] = field.real[i] ** 2 + field.imag[i] ** 2;
  return out;
}

describe('pure core nonlinear phase step (exact)', () => {
  it('preserves |psi|^2 exactly at every cell (the ODE conserves amplitude)', () => {
    const psi: ComplexField = {
      real: Float64Array.from([1, 0.3, -0.7, 2]),
      imag: Float64Array.from([0, -0.9, 0.4, -1]),
    };
    const before = amplitudeSquared(psi);
    applyNonlinearPhaseStep(psi, 2.5, 0.01);
    const after = amplitudeSquared(psi);
    for (let i = 0; i < before.length; i++) {
      expect(after[i]).toBeCloseTo(before[i], 12);
    }
  });

  it('does not move a zero-amplitude cell', () => {
    const psi: ComplexField = { real: Float64Array.from([0]), imag: Float64Array.from([0]) };
    applyNonlinearPhaseStep(psi, 5, 0.1);
    expect(psi.real[0]).toBe(0);
    expect(psi.imag[0]).toBe(0);
  });

  it('is a no-op when g=0 (no nonlinear coupling)', () => {
    const psi: ComplexField = { real: Float64Array.from([0.5, -0.3]), imag: Float64Array.from([0.2, 0.8]) };
    const before = { real: Array.from(psi.real), imag: Array.from(psi.imag) };
    applyNonlinearPhaseStep(psi, 0, 0.5);
    expect(Array.from(psi.real)).toEqual(before.real);
    expect(Array.from(psi.imag)).toEqual(before.imag);
  });

  it('rotating by dt then by -dt returns to the original value (time-reversible)', () => {
    const psi: ComplexField = { real: Float64Array.from([0.6, -0.2]), imag: Float64Array.from([-0.4, 0.9]) };
    const original = { real: Array.from(psi.real), imag: Array.from(psi.imag) };
    applyNonlinearPhaseStep(psi, 1.3, 0.05);
    applyNonlinearPhaseStep(psi, 1.3, -0.05);
    expect(psi.real[0]).toBeCloseTo(original.real[0], 12);
    expect(psi.imag[0]).toBeCloseTo(original.imag[0], 12);
    expect(psi.real[1]).toBeCloseTo(original.real[1], 12);
    expect(psi.imag[1]).toBeCloseTo(original.imag[1], 12);
  });

  it('matches the closed-form solution psi(t) = psi(0)*exp(-i*g*|psi(0)|^2*t) directly', () => {
    const a0 = 0.7;
    const b0 = -0.5;
    const g = 3;
    const t = 0.02;
    const psi: ComplexField = { real: Float64Array.from([a0]), imag: Float64Array.from([b0]) };
    applyNonlinearPhaseStep(psi, g, t);

    // (a0 + b0*i) * exp(-i*theta) = (a0 + b0*i) * (cos(theta) - i*sin(theta))
    const theta = g * (a0 * a0 + b0 * b0) * t;
    const expectedReal = a0 * Math.cos(theta) + b0 * Math.sin(theta);
    const expectedImag = b0 * Math.cos(theta) - a0 * Math.sin(theta);
    expect(psi.real[0]).toBeCloseTo(expectedReal, 12);
    expect(psi.imag[0]).toBeCloseTo(expectedImag, 12);
  });
});
