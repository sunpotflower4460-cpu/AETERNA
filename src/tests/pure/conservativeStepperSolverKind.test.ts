import { describe, expect, it } from 'vitest';
import { createTorusGeometry, type ComplexField } from '../../pure/geometry/torus.ts';
import { createLaplaceBeltramiOperator } from '../../pure/geometry/laplaceBeltrami.ts';
import { createConservativeStepper } from '../../pure/field/stepConservative.ts';
import { createSeededRandom } from '../../pure/random/seededPrng.ts';

function randomComplexField(size: number, seed: number): ComplexField {
  const random = createSeededRandom(seed);
  const real = new Float64Array(size);
  const imag = new Float64Array(size);
  for (let i = 0; i < size; i++) {
    real[i] = (random() - 0.5) * 0.3;
    imag[i] = (random() - 0.5) * 0.3;
  }
  return { real, imag };
}

describe('pure core K9: createConservativeStepper linearSolverKind branching (docs/vessel/K-series-II-brain-and-universe-plan.md K9)', () => {
  it('omitting linearSolverKind defaults to "direct" - existing callers are bit-for-bit unaffected', () => {
    const N = 8;
    const geometry = createTorusGeometry({ R: 3, r: 1, N });
    const operator = createLaplaceBeltramiOperator(geometry);
    const stepperDefault = createConservativeStepper(operator, geometry, { alpha: 1, g: 1.5, dt: 0.01 });
    const stepperExplicitDirect = createConservativeStepper(operator, geometry, { alpha: 1, g: 1.5, dt: 0.01, linearSolverKind: 'direct' });

    const psi = randomComplexField(N * N, 3);
    const a = stepperDefault.step(psi);
    const b = stepperExplicitDirect.step(psi);

    expect(a.real).toEqual(b.real);
    expect(a.imag).toEqual(b.imag);
  });

  it('the full Strang-split conservative step (nonlinear + linear + nonlinear) matches between direct and spectral, not just the linear sub-step', () => {
    const N = 8;
    const geometry = createTorusGeometry({ R: 3, r: 1, N });
    const operator = createLaplaceBeltramiOperator(geometry);
    const params = { alpha: 1.1, g: 2.5, dt: 0.01 };
    const direct = createConservativeStepper(operator, geometry, { ...params, linearSolverKind: 'direct' });
    const spectral = createConservativeStepper(operator, geometry, { ...params, linearSolverKind: 'spectral' });

    let psiDirect = randomComplexField(N * N, 15);
    let psiSpectral: ComplexField = { real: Float64Array.from(psiDirect.real), imag: Float64Array.from(psiDirect.imag) };

    for (let tick = 0; tick < 30; tick++) {
      psiDirect = direct.step(psiDirect);
      psiSpectral = spectral.step(psiSpectral);
    }

    for (let i = 0; i < N * N; i++) {
      expect(psiSpectral.real[i]).toBeCloseTo(psiDirect.real[i], 7);
      expect(psiSpectral.imag[i]).toBeCloseTo(psiDirect.imag[i], 7);
    }
  });

  it('throws when linearSolverKind="spectral" is requested with a non-power-of-2 N', () => {
    const N = 6;
    const geometry = createTorusGeometry({ R: 3, r: 1, N });
    const operator = createLaplaceBeltramiOperator(geometry);
    expect(() => createConservativeStepper(operator, geometry, { alpha: 1, g: 1, dt: 0.01, linearSolverKind: 'spectral' })).toThrow(/power of 2/);
  });

  it('accepts linearSolverKind="spectral" at power-of-2 N', () => {
    const N = 8;
    const geometry = createTorusGeometry({ R: 3, r: 1, N });
    const operator = createLaplaceBeltramiOperator(geometry);
    expect(() => createConservativeStepper(operator, geometry, { alpha: 1, g: 1, dt: 0.01, linearSolverKind: 'spectral' })).not.toThrow();
  });

  it('throws a clear error for the not-yet-implemented "iterative" kind', () => {
    const N = 8;
    const geometry = createTorusGeometry({ R: 3, r: 1, N });
    const operator = createLaplaceBeltramiOperator(geometry);
    expect(() => createConservativeStepper(operator, geometry, { alpha: 1, g: 1, dt: 0.01, linearSolverKind: 'iterative' })).toThrow(/not implemented/);
  });
});
