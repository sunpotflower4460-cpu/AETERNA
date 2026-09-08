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
 * H = alpha*<psi,-L*psi>_dA + (g/2)*sum(|psi|^4*dA), or, when g is a
 * per-cell Float64Array g(x) (docs/vessel/K12-memory-channel-adr.md
 * Choice 3, needed to measure mediumWork_H), H = alpha*<psi,-L*psi>_dA
 * + sum((g(x)/2)*|psi|^4*dA) - the same quartic term with g pulled
 * inside the sum instead of factored out, since it now varies per
 * cell. Passing a scalar `g: number` is EXACTLY today's formula,
 * unchanged bit-for-bit. A uniform Float64Array filled with that same
 * scalar value is NOT guaranteed bit-identical to the scalar path
 * (floating-point addition is not associative, so "multiply once after
 * summing" and "multiply inside each term of the sum" can differ in
 * the last bit) - see src/tests/pure/gFieldHamiltonian.test.ts, which
 * checks the array path to floating-point precision, not bit equality,
 * against the scalar path. `operator` must be the same
 * LaplaceBeltramiOperator instance used to build the conservative
 * stepper for this run (see module doc).
 */
export function computeHamiltonian(
  psi: ComplexField,
  operator: LaplaceBeltramiOperator,
  geometry: TorusGeometry,
  alpha: number,
  g: number | Float64Array,
): number {
  if (typeof g !== 'number' && g.length !== psi.real.length) {
    throw new Error(`computeHamiltonian: g(x) length (${g.length}) does not match psi length (${psi.real.length})`);
  }
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

  const { cellArea } = geometry;
  let quarticEnergy: number;
  if (typeof g === 'number') {
    // Unchanged bit-for-bit from before g(x) support existed: g factored
    // out of the sum, multiplied once at the end.
    let quarticSum = 0;
    for (let i = 0; i < psi.real.length; i++) {
      const amplitudeSquared = psi.real[i] * psi.real[i] + psi.imag[i] * psi.imag[i];
      quarticSum += amplitudeSquared * amplitudeSquared * cellArea[i];
    }
    quarticEnergy = (g / 2) * quarticSum;
  } else {
    // g(x) varies per cell, so it cannot be factored out of the sum -
    // a genuinely different (not just reordered) floating-point path.
    quarticEnergy = 0;
    for (let i = 0; i < psi.real.length; i++) {
      const amplitudeSquared = psi.real[i] * psi.real[i] + psi.imag[i] * psi.imag[i];
      quarticEnergy += (g[i] / 2) * amplitudeSquared * amplitudeSquared * cellArea[i];
    }
  }

  return alpha * kinetic + quarticEnergy;
}
