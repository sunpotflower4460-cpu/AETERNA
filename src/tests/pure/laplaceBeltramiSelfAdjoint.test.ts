import { describe, expect, it } from 'vitest';
import { createTorusGeometry, weightedInnerProduct, type ComplexField } from '../../pure/geometry/torus.ts';
import { applyLaplaceBeltrami, createLaplaceBeltramiOperator } from '../../pure/geometry/laplaceBeltrami.ts';
import { createSeededRandom } from '../../pure/random/seededPrng.ts';

function randomComplexField(size: number, seed: number): ComplexField {
  const random = createSeededRandom(seed);
  const real = new Float64Array(size);
  const imag = new Float64Array(size);
  for (let i = 0; i < size; i++) {
    real[i] = random() - 0.5;
    imag[i] = random() - 0.5;
  }
  return { real, imag };
}

describe('pure core discrete Laplace-Beltrami operator: self-adjointness', () => {
  it.each([4, 8, 16])(
    '<phi, L psi>_dA ~= <L phi, psi>_dA for random fields on an N=%i grid (docs/pure-physics-implementation-plan.md PR2 gate)',
    (N) => {
      const geometry = createTorusGeometry({ R: 3, r: 1, N });
      const operator = createLaplaceBeltramiOperator(geometry);
      const size = N * N;
      const phi = randomComplexField(size, 101);
      const psi = randomComplexField(size, 202);

      const lPsi = applyLaplaceBeltrami(operator, psi);
      const lPhi = applyLaplaceBeltrami(operator, phi);

      const left = weightedInnerProduct(phi, lPsi, geometry);
      const right = weightedInnerProduct(lPhi, psi, geometry);

      // Relative tolerance: both sides are sums of O(N^2) terms of similar
      // magnitude, so an absolute 1e-9 would be too tight at larger N and
      // too loose at smaller N. Self-adjointness here is an algebraic
      // identity (see laplaceBeltrami.ts's module doc) so any observed gap
      // should be pure floating-point roundoff, not a modeling error.
      const scale = Math.max(1e-12, Math.abs(left.real), Math.abs(right.real));
      expect(Math.abs(left.real - right.real) / scale).toBeLessThan(1e-9);
      const scaleImag = Math.max(1e-12, Math.abs(left.imag), Math.abs(right.imag));
      expect(Math.abs(left.imag - right.imag) / scaleImag).toBeLessThan(1e-9);
    },
  );

  it('L applied to a constant field is exactly zero (Laplacian of a constant vanishes)', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 12 });
    const operator = createLaplaceBeltramiOperator(geometry);
    const size = geometry.N * geometry.N;
    const constantField: ComplexField = {
      real: new Float64Array(size).fill(3.5),
      imag: new Float64Array(size).fill(-1.2),
    };

    const result = applyLaplaceBeltrami(operator, constantField);

    for (let i = 0; i < size; i++) {
      expect(result.real[i]).toBeCloseTo(0, 12);
      expect(result.imag[i]).toBeCloseTo(0, 12);
    }
  });

  it('transmissibilities are finite and positive (R > r keeps R + r*cos(theta) > 0 everywhere)', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 24 });
    const operator = createLaplaceBeltramiOperator(geometry);
    for (const t of operator.thetaTransmissibility) {
      expect(t).toBeGreaterThan(0);
      expect(Number.isFinite(t)).toBe(true);
    }
    for (const t of operator.phiTransmissibility) {
      expect(t).toBeGreaterThan(0);
      expect(Number.isFinite(t)).toBe(true);
    }
  });

  it('does not mutate the input field (read-only application)', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 8 });
    const operator = createLaplaceBeltramiOperator(geometry);
    const size = geometry.N * geometry.N;
    const psi = randomComplexField(size, 5);
    const beforeReal = Array.from(psi.real);
    const beforeImag = Array.from(psi.imag);

    applyLaplaceBeltrami(operator, psi);

    expect(Array.from(psi.real)).toEqual(beforeReal);
    expect(Array.from(psi.imag)).toEqual(beforeImag);
  });
});
