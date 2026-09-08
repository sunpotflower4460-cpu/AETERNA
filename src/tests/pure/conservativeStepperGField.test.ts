import { describe, expect, it } from 'vitest';
import { createTorusGeometry, type ComplexField } from '../../pure/geometry/torus.ts';
import { createLaplaceBeltramiOperator } from '../../pure/geometry/laplaceBeltrami.ts';
import { createConservativeStepper } from '../../pure/field/stepConservative.ts';
import { computeNorm } from '../../pure/field/invariants.ts';
import { createSeededRandom } from '../../pure/random/seededPrng.ts';

function randomComplexField(size: number, seed: number): ComplexField {
  const random = createSeededRandom(seed);
  const real = new Float64Array(size);
  const imag = new Float64Array(size);
  for (let i = 0; i < size; i++) {
    real[i] = (random() - 0.5) * 0.5;
    imag[i] = (random() - 0.5) * 0.5;
  }
  return { real, imag };
}

describe('pure core K12: createConservativeStepper.step() with a per-tick gField (docs/vessel/K12-memory-channel-adr.md Choice 2)', () => {
  it('a uniform gField matching the constructed scalar g gives the EXACT same output as omitting gField (bit-for-bit)', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 8 });
    const operator = createLaplaceBeltramiOperator(geometry);
    const gValue = 1.4;
    const stepper = createConservativeStepper(operator, geometry, { alpha: 1, g: gValue, dt: 0.01 });
    const psi = randomComplexField(geometry.N * geometry.N, 3);

    const withoutGField = stepper.step(psi);
    const withUniformGField = stepper.step(psi, new Float64Array(geometry.N * geometry.N).fill(gValue));

    expect(withUniformGField.real).toEqual(withoutGField.real);
    expect(withUniformGField.imag).toEqual(withoutGField.imag);
  });

  it('a non-uniform gField produces a genuinely different trajectory than the scalar g the stepper was constructed with', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 8 });
    const operator = createLaplaceBeltramiOperator(geometry);
    const stepper = createConservativeStepper(operator, geometry, { alpha: 1, g: 1, dt: 0.01 });
    const psi = randomComplexField(geometry.N * geometry.N, 3);

    const gField = Float64Array.from({ length: geometry.N * geometry.N }, (_, k) => (k % 2 === 0 ? 0.2 : 3));
    const withGField = stepper.step(psi, gField);
    const withScalarG = stepper.step(psi);

    expect(withGField.real).not.toEqual(withScalarG.real);
  });

  it('still conserves N with a non-uniform gField (the linear step never depended on g, so this is unaffected by K12)', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 8 });
    const operator = createLaplaceBeltramiOperator(geometry);
    const stepper = createConservativeStepper(operator, geometry, { alpha: 1, g: 1, dt: 0.005 });
    const gField = Float64Array.from({ length: geometry.N * geometry.N }, (_, k) => 0.5 + (k % 5) * 0.3);

    let psi = randomComplexField(geometry.N * geometry.N, 11);
    const nStart = computeNorm(psi, geometry);

    let maxRelativeDrift = 0;
    for (let tick = 0; tick < 200; tick++) {
      psi = stepper.step(psi, gField);
      const n = computeNorm(psi, geometry);
      maxRelativeDrift = Math.max(maxRelativeDrift, Math.abs(n - nStart) / nStart);
    }

    expect(maxRelativeDrift).toBeLessThan(1e-6);
  });

  it('does not mutate the caller-supplied gField array', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 6 });
    const operator = createLaplaceBeltramiOperator(geometry);
    const stepper = createConservativeStepper(operator, geometry, { alpha: 1, g: 1, dt: 0.01 });
    const psi = randomComplexField(geometry.N * geometry.N, 5);
    const gField = Float64Array.from({ length: geometry.N * geometry.N }, () => 1.5);
    const original = Float64Array.from(gField);

    stepper.step(psi, gField);

    expect(gField).toEqual(original);
  });
});
