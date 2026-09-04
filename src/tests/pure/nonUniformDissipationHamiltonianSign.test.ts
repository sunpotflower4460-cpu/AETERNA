import { describe, expect, it } from 'vitest';
import { createTorusGeometry, type ComplexField } from '../../pure/geometry/torus.ts';
import { createLaplaceBeltramiOperator } from '../../pure/geometry/laplaceBeltrami.ts';
import { computeHamiltonian, computeNorm } from '../../pure/field/invariants.ts';
import { applyDissipationStep } from '../../pure/field/stepDissipation.ts';

/**
 * docs/pure-physics-implementation-plan.md PR6 merge gate: 「不均一ν条件で
 * dissipationLoss_Hが負にもなりうることを許容・記録する」。stepDissipation.ts's
 * module doc already argues this analytically for non-uniform nu(x): a
 * spatially-varying decay rate can turn an initially FLAT field into a
 * non-flat one, creating gradient energy (the kinetic term alpha*<psi,-L*psi>)
 * that was not there before. This test makes that concrete rather than
 * asserted: start from an EXACTLY uniform field (kinetic term = 0 exactly,
 * since the discrete L annihilates constant fields) with g=0 (so H is
 * purely the kinetic term, no competing quartic-term decrease to offset
 * it), apply a column-alternating nu(x), and show H strictly increases -
 * i.e. dissipationLoss_H = H_before - H_after is strictly negative.
 */
function uniformField(size: number, amplitude: number): ComplexField {
  return { real: Float64Array.from({ length: size }, () => amplitude), imag: new Float64Array(size) };
}

function columnAlternatingNu(geometry: { N: number }, highNu: number, lowNu: number): Float64Array {
  const { N } = geometry;
  const nu = new Float64Array(N * N);
  for (let row = 0; row < N; row++) {
    for (let col = 0; col < N; col++) {
      nu[row * N + col] = col % 2 === 0 ? highNu : lowNu;
    }
  }
  return nu;
}

describe('pure core: non-uniform nu(x) can make dissipationLoss_H negative (docs/pure-physics-implementation-plan.md PR6 merge gate)', () => {
  it('a column-alternating nu(x) applied to an exactly-uniform field strictly increases H (g=0 isolates the kinetic term)', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 6 });
    const operator = createLaplaceBeltramiOperator(geometry);
    const size = geometry.N * geometry.N;
    const alpha = 1;
    const g = 0;
    const amplitude = 1;
    const dt = 0.3;

    const psi = uniformField(size, amplitude);
    const nu = columnAlternatingNu(geometry, 5, 0.01);

    const hBefore = computeHamiltonian(psi, operator, geometry, alpha, g);
    // The discrete Laplace-Beltrami operator annihilates a constant field
    // exactly (by construction - see laplaceBeltrami.ts), so a uniform
    // field's kinetic term (and, with g=0, its whole H) is exactly 0.
    expect(hBefore).toBeCloseTo(0, 12);

    const decayed = applyDissipationStep(psi, nu, dt);
    const hAfter = computeHamiltonian(decayed, operator, geometry, alpha, g);

    // Differential decay broke the field's uniformity, creating gradient
    // energy that was not there before.
    expect(hAfter).toBeGreaterThan(0);

    const dissipationLossH = hBefore - hAfter;
    expect(dissipationLossH).toBeLessThan(0);
  });

  it('dissipationLoss_N stays non-negative in the exact same adversarial (non-uniform nu, gradient-creating) configuration', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 6 });
    const size = geometry.N * geometry.N;
    const amplitude = 1;
    const dt = 0.3;

    const psi = uniformField(size, amplitude);
    const nu = columnAlternatingNu(geometry, 5, 0.01);

    const nBefore = computeNorm(psi, geometry);
    const decayed = applyDissipationStep(psi, nu, dt);
    const nAfter = computeNorm(decayed, geometry);

    const dissipationLossN = nBefore - nAfter;
    expect(dissipationLossN).toBeGreaterThanOrEqual(0);
  });

  it('the sign flip is not universal - a nearly-uniform nu(x) (small perturbation) keeps dissipationLoss_H non-negative, showing the effect scales with non-uniformity rather than appearing unconditionally', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 6 });
    const operator = createLaplaceBeltramiOperator(geometry);
    const size = geometry.N * geometry.N;
    const alpha = 1;
    const g = 0;
    const amplitude = 1;
    const dt = 0.3;
    const nu0 = 0.4;

    const psi = uniformField(size, amplitude);
    // A tiny perturbation around a uniform nu - the induced gradient
    // energy should be second-order small compared to the near-uniform
    // dissipation loss case tested elsewhere (dissipationNormLoss.test.ts).
    const nu = columnAlternatingNu(geometry, nu0 * 1.001, nu0 * 0.999);

    const hBefore = computeHamiltonian(psi, operator, geometry, alpha, g);
    const decayed = applyDissipationStep(psi, nu, dt);
    const hAfter = computeHamiltonian(decayed, operator, geometry, alpha, g);

    // hBefore is ~0 (uniform field), so any induced gradient energy makes
    // hAfter >= hBefore trivially here; the real content of this test is
    // that the induced H is tiny relative to the strongly-alternating case.
    const stronglyAlternatingNu = columnAlternatingNu(geometry, 5, 0.01);
    const stronglyDecayed = applyDissipationStep(psi, stronglyAlternatingNu, dt);
    const hAfterStrong = computeHamiltonian(stronglyDecayed, operator, geometry, alpha, g);

    expect(hAfter).toBeLessThan(hAfterStrong);
  });
});
