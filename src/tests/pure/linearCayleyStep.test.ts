import { describe, expect, it } from 'vitest';
import { createTorusGeometry, weightedNormSquared, type ComplexField } from '../../pure/geometry/torus.ts';
import { createLaplaceBeltramiOperator } from '../../pure/geometry/laplaceBeltrami.ts';
import { createLinearCayleyStepper } from '../../pure/field/linearCayleyStep.ts';
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

describe('pure core linear Cayley/CN step', () => {
  it.each([4, 6, 8])(
    'preserves the dA-weighted norm exactly for a single step on an N=%i grid (Cayley transform of a self-adjoint operator is unitary)',
    (N) => {
      const geometry = createTorusGeometry({ R: 3, r: 1, N });
      const operator = createLaplaceBeltramiOperator(geometry);
      const stepper = createLinearCayleyStepper(operator, geometry, 1.5, 0.05);
      const psi = randomComplexField(N * N, 17);

      const normBefore = weightedNormSquared(psi, geometry);
      const next = stepper.step(psi);
      const normAfter = weightedNormSquared(next, geometry);

      expect(normAfter).toBeCloseTo(normBefore, 9);
    },
  );

  it('preserves the norm over many repeated steps (no secular drift from the linear solver)', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 6 });
    const operator = createLaplaceBeltramiOperator(geometry);
    const stepper = createLinearCayleyStepper(operator, geometry, 2, 0.02);
    let psi = randomComplexField(geometry.N * geometry.N, 5);
    const normStart = weightedNormSquared(psi, geometry);

    for (let tick = 0; tick < 200; tick++) {
      psi = stepper.step(psi);
    }

    const normEnd = weightedNormSquared(psi, geometry);
    expect(normEnd).toBeCloseTo(normStart, 6);
  });

  it('is a no-op (identity) when alpha=0', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 4 });
    const operator = createLaplaceBeltramiOperator(geometry);
    const stepper = createLinearCayleyStepper(operator, geometry, 0, 0.1);
    const psi = randomComplexField(geometry.N * geometry.N, 3);

    const next = stepper.step(psi);

    for (let i = 0; i < psi.real.length; i++) {
      expect(next.real[i]).toBeCloseTo(psi.real[i], 10);
      expect(next.imag[i]).toBeCloseTo(psi.imag[i], 10);
    }
  });

  it('leaves a constant field unchanged (L applied to a constant is zero)', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 8 });
    const operator = createLaplaceBeltramiOperator(geometry);
    const stepper = createLinearCayleyStepper(operator, geometry, 3, 0.03);
    const size = geometry.N * geometry.N;
    const psi: ComplexField = { real: new Float64Array(size).fill(0.7), imag: new Float64Array(size).fill(-0.4) };

    const next = stepper.step(psi);

    for (let i = 0; i < size; i++) {
      expect(next.real[i]).toBeCloseTo(0.7, 8);
      expect(next.imag[i]).toBeCloseTo(-0.4, 8);
    }
  });

  it('does not mutate the input field', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 4 });
    const operator = createLaplaceBeltramiOperator(geometry);
    const stepper = createLinearCayleyStepper(operator, geometry, 1, 0.01);
    const psi = randomComplexField(geometry.N * geometry.N, 9);
    const beforeReal = Array.from(psi.real);
    const beforeImag = Array.from(psi.imag);

    stepper.step(psi);

    expect(Array.from(psi.real)).toEqual(beforeReal);
    expect(Array.from(psi.imag)).toEqual(beforeImag);
  });
});
