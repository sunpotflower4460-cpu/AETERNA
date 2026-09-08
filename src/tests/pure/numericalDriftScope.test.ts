import { describe, expect, it } from 'vitest';
import { createTorusGeometry, type ComplexField } from '../../pure/geometry/torus.ts';
import { createLaplaceBeltramiOperator } from '../../pure/geometry/laplaceBeltrami.ts';
import { createConservativeStepper } from '../../pure/field/stepConservative.ts';
import { computeHamiltonian } from '../../pure/field/invariants.ts';
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

describe('pure core energy ledger: numericalDrift_H belongs to the conservative block only (docs/pure-physics-implementation-plan.md PR4 merge gate: "numericalDrift_H が保存ブロック以外で使われない")', () => {
  it('numericalDrift_H equals hAfterConservative - hBefore directly measured outside the ledger, for the same psi and parameters', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 6 });
    const operator = createLaplaceBeltramiOperator(geometry);
    const size = geometry.N * geometry.N;
    const alpha = 1;
    const g = 1;
    const dt = 0.02;
    const stepper = createConservativeStepper(operator, geometry, { alpha, g, dt });
    const nu = Float64Array.from({ length: size }, () => 0.5);

    const psi = randomComplexField(size, 3, 0.3);
    const hBeforeDirect = computeHamiltonian(psi, operator, geometry, alpha, g);
    const psiAfterConservativeDirect = stepper.step(psi);
    const hAfterConservativeDirect = computeHamiltonian(psiAfterConservativeDirect, operator, geometry, alpha, g);
    const expectedDrift = hAfterConservativeDirect - hBeforeDirect;

    const { ledger } = runDissipationTick(psi, stepper, geometry, alpha, g, nu, dt);

    expect(ledger.numericalDriftH).toBeCloseTo(expectedDrift, 12);
  });

  it('numericalDrift_H is identical across very different nu(x) magnitudes for the same input field (dissipation cannot leak into it)', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 6 });
    const operator = createLaplaceBeltramiOperator(geometry);
    const size = geometry.N * geometry.N;
    const alpha = 1.1;
    const g = 1.4;
    const dt = 0.015;
    const stepper = createConservativeStepper(operator, geometry, { alpha, g, dt });
    const psi = randomComplexField(size, 12, 0.3);

    const drifts: number[] = [];
    for (const nu0 of [0, 0.01, 1, 50]) {
      const nu = Float64Array.from({ length: size }, () => nu0);
      const { ledger } = runDissipationTick(psi, stepper, geometry, alpha, g, nu, dt);
      drifts.push(ledger.numericalDriftH);
    }

    for (let i = 1; i < drifts.length; i++) {
      expect(drifts[i]).toBeCloseTo(drifts[0], 12);
    }
  });

  it('with nu(x)=0 everywhere (no dissipation), dissipationLoss_N/H are exactly 0 and the H change equals numericalDrift_H alone', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 6 });
    const operator = createLaplaceBeltramiOperator(geometry);
    const size = geometry.N * geometry.N;
    const alpha = 1;
    const g = 0.7;
    const dt = 0.01;
    const stepper = createConservativeStepper(operator, geometry, { alpha, g, dt });
    const nu = new Float64Array(size);

    const psi = randomComplexField(size, 44, 0.3);
    const { ledger } = runDissipationTick(psi, stepper, geometry, alpha, g, nu, dt);

    expect(ledger.dissipationLossN).toBe(0);
    expect(ledger.dissipationLossH).toBe(0);
    expect(ledger.hAfterDissipation - ledger.hBefore).toBeCloseTo(ledger.numericalDriftH, 12);
  });

  it('over many ticks, numericalDrift_H stays bounded the same way the PR3 Hamiltonian-boundedness gate already requires (this file adds no new drift source)', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 6 });
    const operator = createLaplaceBeltramiOperator(geometry);
    const size = geometry.N * geometry.N;
    const alpha = 1;
    const g = 1.5;
    const dt = 0.008;
    const stepper = createConservativeStepper(operator, geometry, { alpha, g, dt });
    const nu = Float64Array.from({ length: size }, () => 0.2);

    let psi = randomComplexField(size, 61, 0.25);
    const hStart = computeHamiltonian(psi, operator, geometry, alpha, g);
    let maxAbsDrift = 0;
    for (let tick = 0; tick < 300; tick++) {
      const { psi: nextPsi, ledger } = runDissipationTick(psi, stepper, geometry, alpha, g, nu, dt);
      maxAbsDrift = Math.max(maxAbsDrift, Math.abs(ledger.numericalDriftH));
      psi = nextPsi;
    }

    // Not a tight bound - just guards against a gross scope leak (e.g. if a
    // future edit accidentally routed dissipation's own H change into
    // numericalDriftH, this would blow up since dissipation strictly
    // decreases H every tick over 300 ticks).
    expect(maxAbsDrift).toBeLessThan(Math.abs(hStart) + 1);
  });
});
