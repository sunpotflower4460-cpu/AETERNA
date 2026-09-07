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
import { createLinearCayleySpectralStepper } from './linearCayleySpectralStep.ts';
import { applyNonlinearPhaseStep } from './nonlinearPhaseStep.ts';
import type { LinearSolverKind } from '../params.ts';

/** Structural shape shared by createLinearCayleyStepper (dense-LU, linearCayleyStep.ts) and createLinearCayleySpectralStepper (FFT+cyclic-tridiagonal, linearCayleySpectralStep.ts, docs/vessel/K-series-II-brain-and-universe-plan.md K9). Both compute the identical Cayley transform - only the algorithm differs. */
export type LinearStepper = LinearCayleyStepper;

export interface ConservativeStepperParams {
  alpha: number;
  g: number;
  dt: number;
  /** Which linear solver implements the Cayley/CN step. Defaults to 'direct' (the original dense-LU stepper) when omitted - existing callers are unaffected. 'spectral' requires geometry.N to be a power of 2 (thrown here, not silently rounded). 'iterative' is not yet implemented. */
  linearSolverKind?: LinearSolverKind;
}

export interface ConservativeStepper {
  readonly operator: LaplaceBeltramiOperator;
  readonly linearStepper: LinearStepper;
  /** Advances psi by one full conservative tick. Does not mutate the input. */
  step(psi: ComplexField): ComplexField;
}

function createLinearStepper(operator: LaplaceBeltramiOperator, geometry: TorusGeometry, alpha: number, dt: number, kind: LinearSolverKind): LinearStepper {
  if (kind === 'direct') {
    return createLinearCayleyStepper(operator, geometry, alpha, dt);
  }
  if (kind === 'spectral') {
    if ((geometry.N & (geometry.N - 1)) !== 0) {
      throw new Error(`createConservativeStepper: linearSolverKind='spectral' requires geometry.N to be a power of 2, got ${geometry.N}`);
    }
    return createLinearCayleySpectralStepper(operator, geometry, alpha, dt);
  }
  throw new Error(`createConservativeStepper: linearSolverKind '${kind}' is not implemented (only 'direct' and 'spectral' are available)`);
}

export function createConservativeStepper(
  operator: LaplaceBeltramiOperator,
  geometry: TorusGeometry,
  params: ConservativeStepperParams,
): ConservativeStepper {
  const linearStepper = createLinearStepper(operator, geometry, params.alpha, params.dt, params.linearSolverKind ?? 'direct');
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
