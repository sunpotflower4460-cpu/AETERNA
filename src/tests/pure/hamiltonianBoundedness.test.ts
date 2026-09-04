import { describe, expect, it } from 'vitest';
import { createTorusGeometry, type ComplexField } from '../../pure/geometry/torus.ts';
import { createLaplaceBeltramiOperator } from '../../pure/geometry/laplaceBeltrami.ts';
import { createConservativeStepper } from '../../pure/field/stepConservative.ts';
import { computeHamiltonian } from '../../pure/field/invariants.ts';
import { createSeededRandom } from '../../pure/random/seededPrng.ts';

function randomComplexField(size: number, seed: number, scale = 0.3): ComplexField {
  const random = createSeededRandom(seed);
  const real = new Float64Array(size);
  const imag = new Float64Array(size);
  for (let i = 0; i < size; i++) {
    real[i] = (random() - 0.5) * scale;
    imag[i] = (random() - 0.5) * scale;
  }
  return { real, imag };
}

describe('pure core conservative block: H boundedness (docs/pure-physics-implementation-plan.md PR3 gate)', () => {
  it('H stays bounded (no blowup) over a long run - Strang splitting is not exactly H-conserving, but must not diverge', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 6 });
    const operator = createLaplaceBeltramiOperator(geometry);
    const alpha = 1;
    const g = 2;
    const stepper = createConservativeStepper(operator, geometry, { alpha, g, dt: 0.005 });

    let psi = randomComplexField(geometry.N * geometry.N, 21);
    const hStart = computeHamiltonian(psi, operator, geometry, alpha, g);

    let maxH = hStart;
    let minH = hStart;
    for (let tick = 0; tick < 2000; tick++) {
      psi = stepper.step(psi);
      const h = computeHamiltonian(psi, operator, geometry, alpha, g);
      expect(Number.isFinite(h)).toBe(true);
      maxH = Math.max(maxH, h);
      minH = Math.min(minH, h);
    }

    // Bounded oscillation around H(0), not a diverging trend. The bound
    // itself (10x |H(0)|, floor 1e-6 for a near-zero H(0)) is generous -
    // the point of this test is to catch actual blowup, not to pin an
    // exact oscillation amplitude (that is dt/g/alpha-dependent and would
    // make this test needlessly fragile).
    const bound = Math.max(Math.abs(hStart) * 10, 1e-6);
    expect(maxH).toBeLessThan(bound);
    expect(minH).toBeGreaterThan(-bound);
  });

  it('H does not diverge even with strong nonlinear coupling', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 6 });
    const operator = createLaplaceBeltramiOperator(geometry);
    const alpha = 1;
    const g = 15;
    const stepper = createConservativeStepper(operator, geometry, { alpha, g, dt: 0.002 });

    let psi = randomComplexField(geometry.N * geometry.N, 8, 0.2);
    let previousH = computeHamiltonian(psi, operator, geometry, alpha, g);

    for (let tick = 0; tick < 1000; tick++) {
      psi = stepper.step(psi);
      const h = computeHamiltonian(psi, operator, geometry, alpha, g);
      expect(Number.isFinite(h)).toBe(true);
      expect(Number.isNaN(h)).toBe(false);
      previousH = h;
    }
    expect(Number.isFinite(previousH)).toBe(true);
  });
});
