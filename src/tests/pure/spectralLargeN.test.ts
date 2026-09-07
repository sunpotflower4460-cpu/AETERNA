import { describe, expect, it } from 'vitest';
import { createTorusGeometry, weightedNormSquared, type ComplexField } from '../../pure/geometry/torus.ts';
import { createLaplaceBeltramiOperator } from '../../pure/geometry/laplaceBeltrami.ts';
import { createConservativeStepper } from '../../pure/field/stepConservative.ts';
import { computeHamiltonian } from '../../pure/field/invariants.ts';
import { createSeededRandom } from '../../pure/random/seededPrng.ts';

function randomComplexField(size: number, seed: number, scale = 0.1): ComplexField {
  const random = createSeededRandom(seed);
  const real = new Float64Array(size);
  const imag = new Float64Array(size);
  for (let i = 0; i < size; i++) {
    real[i] = (random() - 0.5) * scale;
    imag[i] = (random() - 0.5) * scale;
  }
  return { real, imag };
}

/**
 * docs/vessel/K-series-II-brain-and-universe-plan.md K9's whole point:
 * the dense-LU stepper cannot run at these sizes at all (N=128 needs a
 * ~537MB system matrix and an ~875ms-scaling-as-N^6 factorization per
 * the plan's own measurements; N=256 would need ~137GB). These tests
 * exist only for the spectral stepper.
 */
describe('pure core K9: spectral Cayley step invariants at scales the dense solver cannot reach', () => {
  it.each([128, 256])('conserves N over 200 ticks to a tight relative tolerance (N=%i)', (N) => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N });
    const operator = createLaplaceBeltramiOperator(geometry);
    const stepper = createConservativeStepper(operator, geometry, { alpha: 1, g: 0.5, dt: 0.005, linearSolverKind: 'spectral' });

    let psi = randomComplexField(N * N, 11);
    const nStart = weightedNormSquared(psi, geometry);

    let maxRelativeDrift = 0;
    for (let tick = 0; tick < 200; tick++) {
      psi = stepper.step(psi);
      const n = weightedNormSquared(psi, geometry);
      const relativeDrift = Math.abs(n - nStart) / nStart;
      maxRelativeDrift = Math.max(maxRelativeDrift, relativeDrift);
    }

    expect(maxRelativeDrift).toBeLessThan(1e-6);
  }, 30000);

  it.each([128, 256])('H stays bounded over 200 ticks (no divergence) (N=%i)', (N) => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N });
    const operator = createLaplaceBeltramiOperator(geometry);
    const alpha = 1;
    const g = 2;
    const dt = 0.005;
    const stepper = createConservativeStepper(operator, geometry, { alpha, g, dt, linearSolverKind: 'spectral' });

    let psi = randomComplexField(N * N, 23);
    const hStart = computeHamiltonian(psi, operator, geometry, alpha, g);
    expect(Number.isFinite(hStart)).toBe(true);

    let maxAbsH = Math.abs(hStart);
    for (let tick = 0; tick < 200; tick++) {
      psi = stepper.step(psi);
      const h = computeHamiltonian(psi, operator, geometry, alpha, g);
      expect(Number.isFinite(h)).toBe(true);
      maxAbsH = Math.max(maxAbsH, Math.abs(h));
    }

    expect(maxAbsH).toBeLessThan(Math.abs(hStart) * 10 + 1);
  }, 30000);

  it('is deterministic at N=256: two independent runs from the same seed are bit-identical', () => {
    const N = 256;
    const geometry = createTorusGeometry({ R: 3, r: 1, N });
    const operator = createLaplaceBeltramiOperator(geometry);
    const stepper1 = createConservativeStepper(operator, geometry, { alpha: 1, g: 1, dt: 0.005, linearSolverKind: 'spectral' });
    const stepper2 = createConservativeStepper(operator, geometry, { alpha: 1, g: 1, dt: 0.005, linearSolverKind: 'spectral' });

    let psi1 = randomComplexField(N * N, 5);
    let psi2: ComplexField = { real: Float64Array.from(psi1.real), imag: Float64Array.from(psi1.imag) };

    for (let tick = 0; tick < 20; tick++) {
      psi1 = stepper1.step(psi1);
      psi2 = stepper2.step(psi2);
    }

    expect(psi1.real).toEqual(psi2.real);
    expect(psi1.imag).toEqual(psi2.imag);
  }, 30000);
});
