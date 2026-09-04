import { describe, expect, it } from 'vitest';
import { createTorusGeometry, type ComplexField } from '../../pure/geometry/torus.ts';
import { createLaplaceBeltramiOperator } from '../../pure/geometry/laplaceBeltrami.ts';
import { createConservativeStepper } from '../../pure/field/stepConservative.ts';
import { computeHamiltonian } from '../../pure/field/invariants.ts';
import { applyDissipationStep } from '../../pure/field/stepDissipation.ts';
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

describe('pure core: uniform-nu dissipation never increases H (docs/pure-physics-implementation-plan.md PR4 §7, uniform-only scope)', () => {
  it('isolated dissipation step: H scales exactly by the analytic law for uniform nu (alpha*kinetic*exp(-2*nu*dt) + (g/2)*quartic*exp(-4*nu*dt))', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 6 });
    const operator = createLaplaceBeltramiOperator(geometry);
    const size = geometry.N * geometry.N;
    const alpha = 1.3;
    const g = 2.1;
    const psi = randomComplexField(size, 14);
    const nu0 = 0.5;
    const dt = 0.02;
    const nu = Float64Array.from({ length: size }, () => nu0);

    // Decompose H_before into its kinetic and quartic parts by re-deriving
    // them from computeHamiltonian at g=0 (isolates the kinetic term) and
    // by difference (isolates the quartic term), so the analytic
    // prediction below does not depend on the internals of invariants.ts.
    const hBeforeFull = computeHamiltonian(psi, operator, geometry, alpha, g);
    const hBeforeKineticOnly = computeHamiltonian(psi, operator, geometry, alpha, 0);
    const quarticContribution = hBeforeFull - hBeforeKineticOnly;

    const decayed = applyDissipationStep(psi, nu, dt);
    const hAfterFull = computeHamiltonian(decayed, operator, geometry, alpha, g);

    const kineticFactor = Math.exp(-2 * nu0 * dt);
    const quarticFactor = Math.exp(-4 * nu0 * dt);
    const predictedHAfter = hBeforeKineticOnly * kineticFactor + quarticContribution * quarticFactor;

    expect(hAfterFull).toBeCloseTo(predictedHAfter, 9);
    // Both factors are <=1 for nu0>=0, dt>0, and alpha,g>=0, so H cannot increase.
    expect(hAfterFull).toBeLessThanOrEqual(hBeforeFull + 1e-9);
  });

  it('full PR4 tick (conservative + dissipation) via the ledger: dissipationLossH >= 0 for uniform nu across many ticks and several (alpha,g) pairs', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 6 });
    const size = geometry.N * geometry.N;

    for (const [alpha, g] of [[1, 0], [1, 1.5], [0.6, 3]] as const) {
      const operator = createLaplaceBeltramiOperator(geometry);
      const dt = 0.01;
      const stepper = createConservativeStepper(operator, geometry, { alpha, g, dt });
      const nu0 = 0.3;
      const nu = Float64Array.from({ length: size }, () => nu0);

      let psi = randomComplexField(size, 8, 0.3);
      for (let tick = 0; tick < 50; tick++) {
        const { psi: nextPsi, ledger } = runDissipationTick(psi, stepper, geometry, alpha, g, nu, dt);
        expect(ledger.dissipationLossH).toBeGreaterThanOrEqual(-1e-9);
        psi = nextPsi;
      }
    }
  });

  it('dissipationLossN is strictly positive whenever nu0>0 and the field is nonzero (uniform case)', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 6 });
    const operator = createLaplaceBeltramiOperator(geometry);
    const size = geometry.N * geometry.N;
    const alpha = 1;
    const g = 1;
    const dt = 0.02;
    const stepper = createConservativeStepper(operator, geometry, { alpha, g, dt });
    const nu = Float64Array.from({ length: size }, () => 0.6);

    const psi = randomComplexField(size, 19, 0.3);
    const { ledger } = runDissipationTick(psi, stepper, geometry, alpha, g, nu, dt);

    expect(ledger.dissipationLossN).toBeGreaterThan(0);
  });
});
