/**
 * PUT-IN: a complex field psi, a LaplaceBeltramiOperator, TorusGeometry,
 *   alpha, g, dt
 * EMERGED: psi advanced by one full conservative tick
 * claim-tier: C3 (analytically validated - N conservation and exact
 *   norm-preservation of the linear sub-step are proven properties of
 *   the pieces this composes; the composition's own 2nd-order accuracy
 *   is checked in src/tests/pure/hamiltonianConvergence.test.ts)
 * floors (誠実な床): this is the conservative block only. No
 *   dissipation, drive, or medium history yet (PR4/PR5/PR6).
 *
 * docs/pure-physics-implementation-plan.md §2, Strang分割:
 *
 *   1. 非線形位相回転 half step (dt/2)   -- 厳密解、誤差なし
 *   2. 線形 Cayley/CN step (dt)          -- ノルム保存、O(dt^2)精度
 *   3. 非線形位相回転 half step (dt/2)   -- 厳密解、誤差なし
 *
 * Strang分割全体としての精度はCN部分に律速され、2次精度になる
 * （hamiltonianConvergence.test.ts で検証）。
 *
 * この関数は createLaplaceBeltramiOperator を自分で呼ばない
 * （呼び出し側から受け取った operator をそのまま使う）。これにより
 * invariants.ts が同じ operator インスタンスを使ってHを計算できる
 * （§5 の要求）。
 */

import type { ComplexField, TorusGeometry } from '../geometry/torus.ts';
import type { LaplaceBeltramiOperator } from '../geometry/laplaceBeltrami.ts';
import { createLinearCayleyStepper, type LinearCayleyStepper } from './linearCayleyStep.ts';
import { applyNonlinearPhaseStep } from './nonlinearPhaseStep.ts';

export interface ConservativeStepperParams {
  alpha: number;
  g: number;
  dt: number;
}

export interface ConservativeStepper {
  readonly operator: LaplaceBeltramiOperator;
  readonly linearStepper: LinearCayleyStepper;
  /** Advances psi by one full conservative tick. Does not mutate the input. */
  step(psi: ComplexField): ComplexField;
}

export function createConservativeStepper(
  operator: LaplaceBeltramiOperator,
  geometry: TorusGeometry,
  params: ConservativeStepperParams,
): ConservativeStepper {
  const linearStepper = createLinearCayleyStepper(operator, geometry, params.alpha, params.dt);
  const dtHalf = params.dt / 2;

  function step(psi: ComplexField): ComplexField {
    const working: ComplexField = {
      real: Float64Array.from(psi.real),
      imag: Float64Array.from(psi.imag),
    };
    applyNonlinearPhaseStep(working, params.g, dtHalf);
    const afterLinear = linearStepper.step(working);
    applyNonlinearPhaseStep(afterLinear, params.g, dtHalf);
    return afterLinear;
  }

  return { operator, linearStepper, step };
}
