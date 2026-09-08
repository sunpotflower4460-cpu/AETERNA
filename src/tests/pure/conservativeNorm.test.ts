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

describe('pure core conservative block: N conservation (docs/pure-physics-implementation-plan.md PR3 gate)', () => {
  it('conserves N over 500 ticks to a tight relative tolerance', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 8 });
    const operator = createLaplaceBeltramiOperator(geometry);
    const stepper = createConservativeStepper(operator, geometry, { alpha: 1, g: 0.5, dt: 0.005 });

    let psi = randomComplexField(geometry.N * geometry.N, 11);
    const nStart = computeNorm(psi, geometry);

    let maxRelativeDrift = 0;
    for (let tick = 0; tick < 500; tick++) {
      psi = stepper.step(psi);
      const n = computeNorm(psi, geometry);
      const relativeDrift = Math.abs(n - nStart) / nStart;
      maxRelativeDrift = Math.max(maxRelativeDrift, relativeDrift);
    }

    expect(maxRelativeDrift).toBeLessThan(1e-6);
  });

  it('conserves N regardless of the nonlinear coupling strength g', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 6 });
    const operator = createLaplaceBeltramiOperator(geometry);

    for (const g of [0, 1, 5, 20]) {
      const stepper = createConservativeStepper(operator, geometry, { alpha: 0.8, g, dt: 0.01 });
      let psi = randomComplexField(geometry.N * geometry.N, 42);
      const nStart = computeNorm(psi, geometry);

      for (let tick = 0; tick < 100; tick++) {
        psi = stepper.step(psi);
      }

      const nEnd = computeNorm(psi, geometry);
      expect(Math.abs(nEnd - nStart) / nStart).toBeLessThan(1e-6);
    }
  });

  it('does not detect a secular (steadily growing) drift in N over a long run', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 6 });
    const operator = createLaplaceBeltramiOperator(geometry);
    const stepper = createConservativeStepper(operator, geometry, { alpha: 1.2, g: 2, dt: 0.008 });
    let psi = randomComplexField(geometry.N * geometry.N, 3);
    const nStart = computeNorm(psi, geometry);

    const sampleEvery = 100;
    const samples: number[] = [];
    for (let tick = 1; tick <= 1000; tick++) {
      psi = stepper.step(psi);
      if (tick % sampleEvery === 0) samples.push(computeNorm(psi, geometry));
    }

    // A secular drift would show as a trend (e.g. monotonically increasing
    // deviation from nStart). Check the deviation does not grow between the
    // first and last quarter of the sampled window.
    const early = samples.slice(0, Math.floor(samples.length / 4));
    const late = samples.slice(-Math.floor(samples.length / 4));
    const earlyMaxDeviation = Math.max(...early.map((n) => Math.abs(n - nStart) / nStart));
    const lateMaxDeviation = Math.max(...late.map((n) => Math.abs(n - nStart) / nStart));

    expect(earlyMaxDeviation).toBeLessThan(1e-6);
    expect(lateMaxDeviation).toBeLessThan(1e-6);
    // Late deviation should not be meaningfully larger than early deviation.
    expect(lateMaxDeviation).toBeLessThan(Math.max(earlyMaxDeviation * 10, 1e-9));
  });
});
