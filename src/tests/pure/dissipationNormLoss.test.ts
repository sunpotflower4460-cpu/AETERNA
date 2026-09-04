import { describe, expect, it } from 'vitest';
import { createTorusGeometry, weightedNormSquared, type ComplexField } from '../../pure/geometry/torus.ts';
import { applyDissipationStep } from '../../pure/field/stepDissipation.ts';
import { createSeededRandom } from '../../pure/random/seededPrng.ts';

function randomComplexField(size: number, seed: number, scale = 0.5): ComplexField {
  const random = createSeededRandom(seed);
  const real = new Float64Array(size);
  const imag = new Float64Array(size);
  for (let i = 0; i < size; i++) {
    real[i] = (random() - 0.5) * scale;
    imag[i] = (random() - 0.5) * scale;
  }
  return { real, imag };
}

describe('pure core dissipation step: exact exponential decay (docs/pure-physics-implementation-plan.md PR4 gate)', () => {
  it('matches the exact analytic decay psi_new = psi_old * exp(-nu*dt) per cell', () => {
    const size = 12;
    const psi = randomComplexField(size, 5);
    const nu = Float64Array.from({ length: size }, (_, i) => 0.1 + i * 0.05);
    const dt = 0.02;

    const decayed = applyDissipationStep(psi, nu, dt);

    for (let i = 0; i < size; i++) {
      const decay = Math.exp(-nu[i] * dt);
      expect(decayed.real[i]).toBeCloseTo(psi.real[i] * decay, 12);
      expect(decayed.imag[i]).toBeCloseTo(psi.imag[i] * decay, 12);
    }
  });

  it('nu(x)=0 leaves the field exactly unchanged', () => {
    const size = 10;
    const psi = randomComplexField(size, 9);
    const nu = new Float64Array(size);

    const result = applyDissipationStep(psi, nu, 0.01);

    for (let i = 0; i < size; i++) {
      expect(result.real[i]).toBe(psi.real[i]);
      expect(result.imag[i]).toBe(psi.imag[i]);
    }
  });

  it('does not mutate the input field', () => {
    const size = 8;
    const psi = randomComplexField(size, 21);
    const original = { real: Float64Array.from(psi.real), imag: Float64Array.from(psi.imag) };
    const nu = Float64Array.from({ length: size }, () => 0.3);

    applyDissipationStep(psi, nu, 0.05);

    expect(psi.real).toEqual(original.real);
    expect(psi.imag).toEqual(original.imag);
  });

  it('throws if nu(x) length does not match the field length', () => {
    const psi = randomComplexField(6, 4);
    const nu = new Float64Array(5);
    expect(() => applyDissipationStep(psi, nu, 0.01)).toThrow();
  });

  it('dissipationLoss_N = N_before - N_after is non-negative for uniform nu>=0 (algebraic, docs/pure-physics-implementation-plan.md §7)', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 6 });
    const size = geometry.N * geometry.N;
    const psi = randomComplexField(size, 17);
    const nu = Float64Array.from({ length: size }, () => 0.4);
    const dt = 0.03;

    const nBefore = weightedNormSquared(psi, geometry);
    const decayed = applyDissipationStep(psi, nu, dt);
    const nAfter = weightedNormSquared(decayed, geometry);

    expect(nBefore - nAfter).toBeGreaterThanOrEqual(0);
    // Exact prediction: uniform nu means every cell's |psi|^2 scales by the
    // same factor exp(-2*nu*dt), so N itself scales by that same factor.
    expect(nAfter / nBefore).toBeCloseTo(Math.exp(-2 * nu[0] * dt), 10);
  });

  it('dissipationLoss_N is non-negative even for non-uniform nu(x) (the N guarantee does not require uniformity)', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 6 });
    const size = geometry.N * geometry.N;
    const random = createSeededRandom(31);
    const psi = randomComplexField(size, 32);
    const nu = Float64Array.from({ length: size }, () => random() * 2);
    const dt = 0.04;

    const nBefore = weightedNormSquared(psi, geometry);
    const decayed = applyDissipationStep(psi, nu, dt);
    const nAfter = weightedNormSquared(decayed, geometry);

    expect(nBefore - nAfter).toBeGreaterThanOrEqual(0);
  });

  it('zero field stays zero (no division-by-zero or NaN at the trivial case)', () => {
    const size = 5;
    const psi: ComplexField = { real: new Float64Array(size), imag: new Float64Array(size) };
    const nu = Float64Array.from({ length: size }, () => 0.7);

    const result = applyDissipationStep(psi, nu, 0.01);

    for (let i = 0; i < size; i++) {
      expect(result.real[i]).toBe(0);
      expect(result.imag[i]).toBe(0);
    }
  });
});
