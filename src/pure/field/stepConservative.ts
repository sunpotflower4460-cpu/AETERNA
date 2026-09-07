/**
 * PUT-IN: a complex field psi, a LaplaceBeltramiOperator, TorusGeometry,
 *   alpha, g, dt; step() also optionally takes a per-tick gField(x)
 *   (docs/vessel/K12-memory-channel-adr.md Choice 2) overriding the
 *   scalar g baked in at construction, for that one call only
 * EMERGED: psi advanced by one full conservative tick
 * claim-tier: C3 (analytically validated - N conservation and exact
 *   norm-preservation of the linear sub-step are proven properties of
 *   the pieces this composes; the composition's own 2nd-order accuracy
 *   is checked in src/tests/pure/hamiltonianConvergence.test.ts)
 * floors (誠実な床): this is the conservative block only. No
 *   dissipation, drive, or medium history yet (PR4/PR5/PR6). gField is
 *   read fresh on every step() call rather than baked into the stepper
 *   at construction time, because K12's g(x) changes tick-to-tick while
 *   the linear solver (which never depends on g at all - only the
 *   nonlinear half-steps read it) is expensive to rebuild; see the ADR
 *   for the alternative (rebuilding the whole stepper per tick) this
 *   rejected. Omitting gField is EXACTLY today's behavior, unchanged
 *   bit-for-bit (falls back to the scalar `params.g` from construction).
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
  /**
   * Advances psi by one full conservative tick. Does not mutate the
   * input. `gField`, if given, is used for BOTH nonlinear half-steps
   * INSTEAD of the scalar g from construction (K12's g(x) - see module
   * doc). Omit it to get exactly the pre-K12 behavior.
   */
  step(psi: ComplexField, gField?: Float64Array): ComplexField;
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

  function step(psi: ComplexField, gField?: Float64Array): ComplexField {
    const g: number | Float64Array = gField ?? params.g;
    const working: ComplexField = {
      real: Float64Array.from(psi.real),
      imag: Float64Array.from(psi.imag),
    };
    applyNonlinearPhaseStep(working, g, dtHalf);
    const afterLinear = linearStepper.step(working);
    applyNonlinearPhaseStep(afterLinear, g, dtHalf);
    return afterLinear;
  }

  return { operator, linearStepper, step };
}
