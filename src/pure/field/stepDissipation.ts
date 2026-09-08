/**
 * PUT-IN: a complex field psi, the medium dissipation field nu(x), dt
 * EMERGED: psi decayed by exp(-nu(x)*dt) per cell
 * claim-tier: C3 (analytically validated - see module doc for the exact
 *   sign guarantees this operation provides; numerically checked in
 *   src/tests/pure/dissipationNormLoss.test.ts and
 *   uniformDissipationHamiltonianLoss.test.ts)
 * floors (誠実な床): PR4 only exercises this with uniform nu(x)=nu0.
 *   Non-uniform nu(x) (PR6, once medium history is real) can make
 *   dissipationLoss_H negative - see energy.ts's module doc.
 *
 * docs/pure-physics-implementation-plan.md PR4: 「ψ ← ψ · exp(−νdt)
 * による指数散逸」。厳密な指数減衰であり、線形近似ではない。
 *
 * ## なぜ nu(x)>=0 なら N が単調に減るか
 *
 * 各セルで |psi_new|^2 = |psi_old|^2 * exp(-2*nu(x)*dt)。
 * nu(x)>=0, dt>0 なら exp(-2*nu(x)*dt) <= 1 なので、各セルの |psi|^2 は
 * 増加しない。N はこれらの dA 重み付き和なので、N も増加しない
 * （dissipationLoss_N = N_before - N_after >= 0 は物理的近似ではなく
 * 代数的事実）。
 */

import type { ComplexField } from '../geometry/torus.ts';

export function applyDissipationStep(psi: ComplexField, nu: Float64Array, dt: number): ComplexField {
  const size = psi.real.length;
  if (nu.length !== size) {
    throw new Error(`applyDissipationStep: nu length (${nu.length}) does not match psi length (${size})`);
  }
  const real = new Float64Array(size);
  const imag = new Float64Array(size);
  for (let i = 0; i < size; i++) {
    const decay = Math.exp(-nu[i] * dt);
    real[i] = psi.real[i] * decay;
    imag[i] = psi.imag[i] * decay;
  }
  return { real, imag };
}
