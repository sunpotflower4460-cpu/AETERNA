import { describe, expect, it } from 'vitest';
import { createTorusGeometry, weightedNormSquared, type ComplexField } from '../../pure/geometry/torus.ts';
import { createLaplaceBeltramiOperator } from '../../pure/geometry/laplaceBeltrami.ts';
import { createLinearCayleyStepper } from '../../pure/field/linearCayleyStep.ts';
import { createLinearCayleySpectralStepper } from '../../pure/field/linearCayleySpectralStep.ts';
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

describe('pure core K9 spectral Cayley step: oracle agreement with the existing dense-LU stepper (docs/vessel/K-series-II-brain-and-universe-plan.md K9 gate)', () => {
  it.each([4, 8, 16])('a single step matches the dense-LU stepper within tight tolerance (N=%i)', (N) => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N });
    const operator = createLaplaceBeltramiOperator(geometry);
    const alpha = 1.3;
    const dt = 0.01;

    const dense = createLinearCayleyStepper(operator, geometry, alpha, dt);
    const spectral = createLinearCayleySpectralStepper(operator, geometry, alpha, dt);

    const psi = randomComplexField(N * N, 11);
    const denseResult = dense.step(psi);
    const spectralResult = spectral.step(psi);

    for (let i = 0; i < N * N; i++) {
      expect(spectralResult.real[i]).toBeCloseTo(denseResult.real[i], 9);
      expect(spectralResult.imag[i]).toBeCloseTo(denseResult.imag[i], 9);
    }
  });

  it.each([4, 8, 16])('agreement holds over 50 repeated steps, not just one (N=%i)', (N) => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N });
    const operator = createLaplaceBeltramiOperator(geometry);
    const alpha = 0.9;
    const dt = 0.02;

    const dense = createLinearCayleyStepper(operator, geometry, alpha, dt);
    const spectral = createLinearCayleySpectralStepper(operator, geometry, alpha, dt);

    let psiDense = randomComplexField(N * N, 23);
    let psiSpectral: ComplexField = { real: Float64Array.from(psiDense.real), imag: Float64Array.from(psiDense.imag) };

    for (let tick = 0; tick < 50; tick++) {
      psiDense = dense.step(psiDense);
      psiSpectral = spectral.step(psiSpectral);
    }

    for (let i = 0; i < N * N; i++) {
      expect(psiSpectral.real[i]).toBeCloseTo(psiDense.real[i], 6);
      expect(psiSpectral.imag[i]).toBeCloseTo(psiDense.imag[i], 6);
    }
  });

  it('the spectral step is exactly (to floating-point precision) norm-preserving, like the dense step', () => {
    const N = 16;
    const geometry = createTorusGeometry({ R: 3, r: 1, N });
    const operator = createLaplaceBeltramiOperator(geometry);
    const spectral = createLinearCayleySpectralStepper(operator, geometry, 1.5, 0.015);

    let psi = randomComplexField(N * N, 77);
    const normStart = weightedNormSquared(psi, geometry);

    for (let tick = 0; tick < 100; tick++) {
      psi = spectral.step(psi);
    }

    const normEnd = weightedNormSquared(psi, geometry);
    expect(normEnd / normStart).toBeCloseTo(1, 6);
  });

  it('does not mutate the input field', () => {
    const N = 8;
    const geometry = createTorusGeometry({ R: 3, r: 1, N });
    const operator = createLaplaceBeltramiOperator(geometry);
    const spectral = createLinearCayleySpectralStepper(operator, geometry, 1, 0.01);
    const psi = randomComplexField(N * N, 5);
    const beforeReal = Float64Array.from(psi.real);
    const beforeImag = Float64Array.from(psi.imag);

    spectral.step(psi);

    expect(psi.real).toEqual(beforeReal);
    expect(psi.imag).toEqual(beforeImag);
  });

  it('is deterministic: repeated calls with the same input give bit-identical output', () => {
    const N = 8;
    const geometry = createTorusGeometry({ R: 3, r: 1, N });
    const operator = createLaplaceBeltramiOperator(geometry);
    const spectral = createLinearCayleySpectralStepper(operator, geometry, 1, 0.01);
    const psi = randomComplexField(N * N, 9);

    const a = spectral.step(psi);
    const b = spectral.step(psi);

    expect(a.real).toEqual(b.real);
    expect(a.imag).toEqual(b.imag);
  });
});
