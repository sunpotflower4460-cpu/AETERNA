import { describe, expect, it } from 'vitest';
import { createTorusGeometry, type ComplexField } from '../../pure/geometry/torus.ts';
import { createLaplaceBeltramiOperator } from '../../pure/geometry/laplaceBeltrami.ts';
import { createConservativeStepper } from '../../pure/field/stepConservative.ts';
import { runDissipationTick } from '../../pure/ledger/energy.ts';
import { createSeededRandom } from '../../pure/random/seededPrng.ts';

function randomComplexField(size: number, seed: number, scale = 0.4): ComplexField {
  const random = createSeededRandom(seed);
  const real = new Float64Array(size);
  const imag = new Float64Array(size);
  for (let i = 0; i < size; i++) {
    real[i] = (random() - 0.5) * scale;
    imag[i] = (random() - 0.5) * scale;
  }
  return { real, imag };
}

describe('pure core energy ledger: bookkeeping identity holds every tick (docs/pure-physics-implementation-plan.md §7)', () => {
  it('N(t+1) = N(t) - dissipationLoss_N + residual_N holds to floating-point precision, no drive term (PR4 has none)', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 6 });
    const operator = createLaplaceBeltramiOperator(geometry);
    const size = geometry.N * geometry.N;
    const alpha = 1;
    const g = 1.2;
    const dt = 0.015;
    const stepper = createConservativeStepper(operator, geometry, { alpha, g, dt });
    const nu = Float64Array.from({ length: size }, () => 0.35);

    let psi = randomComplexField(size, 6, 0.3);
    for (let tick = 0; tick < 30; tick++) {
      const { psi: nextPsi, ledger } = runDissipationTick(psi, stepper, geometry, alpha, g, nu, dt);
      const predictedNAfter = ledger.nBefore - ledger.dissipationLossN + ledger.residualN;
      expect(ledger.nAfterDissipation).toBeCloseTo(predictedNAfter, 12);
      psi = nextPsi;
    }
  });

  it('H(t+1) = H(t) - dissipationLoss_H + numericalDrift_H + residual_H holds to floating-point precision, no drive term', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 6 });
    const operator = createLaplaceBeltramiOperator(geometry);
    const size = geometry.N * geometry.N;
    const alpha = 0.9;
    const g = 2;
    const dt = 0.01;
    const stepper = createConservativeStepper(operator, geometry, { alpha, g, dt });
    const nu = Float64Array.from({ length: size }, () => 0.4);

    let psi = randomComplexField(size, 23, 0.3);
    for (let tick = 0; tick < 30; tick++) {
      const { psi: nextPsi, ledger } = runDissipationTick(psi, stepper, geometry, alpha, g, nu, dt);
      const predictedHAfter = ledger.hBefore - ledger.dissipationLossH + ledger.numericalDriftH + ledger.residualH;
      expect(ledger.hAfterDissipation).toBeCloseTo(predictedHAfter, 9);
      psi = nextPsi;
    }
  });

  it('residual_N and residual_H stay within a tight tolerance every tick (implementation-bug detector, docs/pure-physics-implementation-plan.md PR4 merge gate)', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 6 });
    const operator = createLaplaceBeltramiOperator(geometry);
    const size = geometry.N * geometry.N;
    const alpha = 1;
    const g = 1.5;
    const dt = 0.01;
    const stepper = createConservativeStepper(operator, geometry, { alpha, g, dt });
    const nu = Float64Array.from({ length: size }, () => 0.25);

    let psi = randomComplexField(size, 41, 0.3);
    for (let tick = 0; tick < 100; tick++) {
      const { psi: nextPsi, ledger } = runDissipationTick(psi, stepper, geometry, alpha, g, nu, dt);
      expect(Math.abs(ledger.residualN) / Math.max(ledger.nBefore, 1e-12)).toBeLessThan(1e-8);
      expect(Math.abs(ledger.residualH)).toBeLessThan(1e-8);
      psi = nextPsi;
    }
  });

  it('residual_H is exactly the algebraic identity by construction, independent of the field or parameters (sanity check on the ledger formula itself, not the physics)', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 5 });
    const operator = createLaplaceBeltramiOperator(geometry);
    const size = geometry.N * geometry.N;
    const stepper = createConservativeStepper(operator, geometry, { alpha: 0.5, g: 0.8, dt: 0.02 });
    const nu = Float64Array.from({ length: size }, () => 0.9);

    const psi = randomComplexField(size, 55, 0.5);
    const { ledger } = runDissipationTick(psi, stepper, geometry, 0.5, 0.8, nu, 0.02);

    const reconstructedResidualH =
      ledger.hAfterDissipation - ledger.hBefore + ledger.dissipationLossH - ledger.numericalDriftH;
    expect(ledger.residualH).toBeCloseTo(reconstructedResidualH, 12);
  });
});
