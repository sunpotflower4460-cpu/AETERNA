import { describe, expect, it } from 'vitest';
import { createTorusGeometry, weightedNormSquared, type ComplexField } from '../../pure/geometry/torus.ts';
import { createLaplaceBeltramiOperator } from '../../pure/geometry/laplaceBeltrami.ts';
import { createConservativeStepper } from '../../pure/field/stepConservative.ts';
import { createSeededRandom } from '../../pure/random/seededPrng.ts';

function randomComplexField(size: number, seed: number, scale = 0.15): ComplexField {
  const random = createSeededRandom(seed);
  const real = new Float64Array(size);
  const imag = new Float64Array(size);
  for (let i = 0; i < size; i++) {
    real[i] = (random() - 0.5) * scale;
    imag[i] = (random() - 0.5) * scale;
  }
  return { real, imag };
}

function fieldDifferenceNorm(a: ComplexField, geometry: ReturnType<typeof createTorusGeometry>, b: ComplexField): number {
  const diff: ComplexField = {
    real: new Float64Array(a.real.length),
    imag: new Float64Array(a.imag.length),
  };
  for (let i = 0; i < a.real.length; i++) {
    diff.real[i] = a.real[i] - b.real[i];
    diff.imag[i] = a.imag[i] - b.imag[i];
  }
  return Math.sqrt(weightedNormSquared(diff, geometry));
}

function runToTime(dt: number, totalTime: number, initial: ComplexField, geometry: ReturnType<typeof createTorusGeometry>, alpha: number, g: number): ComplexField {
  const operator = createLaplaceBeltramiOperator(geometry);
  const stepper = createConservativeStepper(operator, geometry, { alpha, g, dt });
  const ticks = Math.round(totalTime / dt);
  let psi: ComplexField = { real: Float64Array.from(initial.real), imag: Float64Array.from(initial.imag) };
  for (let tick = 0; tick < ticks; tick++) {
    psi = stepper.step(psi);
  }
  return psi;
}

describe('pure core conservative block: 2nd-order convergence (docs/pure-physics-implementation-plan.md PR3 gate)', () => {
  it('self-convergence: halving dt reduces the solution difference by roughly 4x (Strang splitting is 2nd order)', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 6 });
    const alpha = 1;
    const g = 1.5;
    const totalTime = 0.16;
    const size = geometry.N * geometry.N;
    const initial = randomComplexField(size, 13);

    const dtCoarse = 0.02;
    const dtMedium = dtCoarse / 2;
    const dtFine = dtCoarse / 4;

    const uCoarse = runToTime(dtCoarse, totalTime, initial, geometry, alpha, g);
    const uMedium = runToTime(dtMedium, totalTime, initial, geometry, alpha, g);
    const uFine = runToTime(dtFine, totalTime, initial, geometry, alpha, g);

    const errorCoarseMedium = fieldDifferenceNorm(uCoarse, geometry, uMedium);
    const errorMediumFine = fieldDifferenceNorm(uMedium, geometry, uFine);

    expect(errorCoarseMedium).toBeGreaterThan(0);
    expect(errorMediumFine).toBeGreaterThan(0);

    const ratio = errorCoarseMedium / errorMediumFine;
    // 2nd order means halving dt should quarter the error (ratio ~= 4).
    // Generous bounds (2.5-6) because this is a nonlinear PDE, not a
    // linear model problem with an exact convergence rate - the point is
    // to catch a 1st-order (forward-Euler-like, ratio ~2) or non-convergent
    // (ratio ~1) implementation, not to pin the ratio precisely.
    expect(ratio).toBeGreaterThan(2.5);
    expect(ratio).toBeLessThan(6);
  });

  it('the linear-only (g=0) case converges cleanly, isolating the Cayley step\'s own order', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 6 });
    const alpha = 1.2;
    const g = 0;
    const totalTime = 0.16;
    const size = geometry.N * geometry.N;
    const initial = randomComplexField(size, 27);

    const dtCoarse = 0.02;
    const dtMedium = dtCoarse / 2;
    const dtFine = dtCoarse / 4;

    const uCoarse = runToTime(dtCoarse, totalTime, initial, geometry, alpha, g);
    const uMedium = runToTime(dtMedium, totalTime, initial, geometry, alpha, g);
    const uFine = runToTime(dtFine, totalTime, initial, geometry, alpha, g);

    const errorCoarseMedium = fieldDifferenceNorm(uCoarse, geometry, uMedium);
    const errorMediumFine = fieldDifferenceNorm(uMedium, geometry, uFine);
    const ratio = errorCoarseMedium / errorMediumFine;

    expect(ratio).toBeGreaterThan(2.5);
    expect(ratio).toBeLessThan(6);
  });
});
