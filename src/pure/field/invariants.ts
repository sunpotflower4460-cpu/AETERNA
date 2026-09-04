/**
 * PUT-IN: a complex field psi, the LaplaceBeltramiOperator used by
 *   stepConservative.ts (the exact same instance, not a second one),
 *   the TorusGeometry, alpha, g
 * EMERGED: N (the dA-weighted norm) and H (the Hamiltonian)
 * claim-tier: C3 (analytically validated - H is defined directly from
 *   the same discrete L the stepper uses, so any discrepancy measured
 *   by hamiltonianConvergence.test.ts reflects the integrator's actual
 *   numerical error, not a mismatch between two different discretizations)
 * floors (誠実な床): does not itself detect drift; hamiltonianBoundedness
 *   and hamiltonianConvergence tests (src/tests/pure/) are what actually
 *   check that H stays bounded / converges at 2nd order as dt shrinks.
 *
 * docs/pure-physics-implementation-plan.md §5「invariants と step は
 * 同じ L を共有する」の明文的な要求に従う。禁止:
 *
 *   stepConservative.ts では L_step を使う
 *   invariants.ts では別実装の gradient / laplacian から H を計算する
 *
 * このモジュールは自分で L を作らない。呼び出し側
 * （src/pure/run/ 等）が createLaplaceBeltramiOperator を一度だけ呼び、
 * その同じインスタンスを createLinearCayleyStepper と
 * computeHamiltonian の両方に渡す責任を持つ。
 *
 * H の定義（§5）:
 *
 *   H = alpha * <psi, -L*psi>_dA + (g/2) * sum(|psi|^4 * dA)
 */

import type { ComplexField, TorusGeometry } from '../geometry/torus.ts';
import { weightedInnerProduct, weightedNormSquared } from '../geometry/torus.ts';
import { applyLaplaceBeltrami, type LaplaceBeltramiOperator } from '../geometry/laplaceBeltrami.ts';

/** N = the dA-weighted norm-squared of psi. Conserved (to solver tolerance) by the conservative block. */
export function computeNorm(psi: ComplexField, geometry: TorusGeometry): number {
  return weightedNormSquared(psi, geometry);
}

/**
 * H = alpha*<psi,-L*psi>_dA + (g/2)*sum(|psi|^4*dA). `operator` must be
 * the same LaplaceBeltramiOperator instance used to build the
 * conservative stepper for this run (see module doc).
 */
export function computeHamiltonian(
  psi: ComplexField,
  operator: LaplaceBeltramiOperator,
  geometry: TorusGeometry,
  alpha: number,
  g: number,
): number {
  const lPsi = applyLaplaceBeltrami(operator, psi);
  const negLPsi: ComplexField = {
    real: new Float64Array(lPsi.real.length),
    imag: new Float64Array(lPsi.imag.length),
  };
  for (let i = 0; i < lPsi.real.length; i++) {
    negLPsi.real[i] = -lPsi.real[i];
    negLPsi.imag[i] = -lPsi.imag[i];
  }
  // <psi, -L*psi>_dA is real because -L is self-adjoint w.r.t. this
  // inner product (its imaginary part is 0 up to floating-point roundoff).
  const kinetic = weightedInnerProduct(psi, negLPsi, geometry).real;

  let quarticSum = 0;
  const { cellArea } = geometry;
  for (let i = 0; i < psi.real.length; i++) {
    const amplitudeSquared = psi.real[i] * psi.real[i] + psi.imag[i] * psi.imag[i];
    quarticSum += amplitudeSquared * amplitudeSquared * cellArea[i];
  }

  return alpha * kinetic + (g / 2) * quarticSum;
}
