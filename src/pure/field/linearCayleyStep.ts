/**
 * PUT-IN: a LaplaceBeltramiOperator L (from PR2), alpha, dt
 * EMERGED: a solver for one full-dt Cayley/Crank-Nicolson step of the
 *   linear part of the conservative block: psi_next = (I - i*alpha*dt/2*L)^-1
 *   (I + i*alpha*dt/2*L) psi
 * claim-tier: C3 (analytically validated - a Cayley transform of a
 *   self-adjoint operator is exactly unitary w.r.t. the same inner
 *   product; see the module doc's derivation and
 *   src/tests/pure/linearCayleyStep.test.ts's norm-preservation check)
 * floors (誠実な床): dense direct solve (see linearSolve.ts's own floor).
 *   No convergence-order claim yet - that is PR3's
 *   hamiltonianConvergence.test.ts, a separate, not-yet-written check.
 *
 * ## なぜ前進オイラーではなくCayley/CNか
 *
 * docs/pure-physics-implementation-plan.md §3: 線形部 i*alpha*Laplacian
 * に前進オイラー ψ_next = ψ + i*alpha*L*dt*ψ を使うと、各固有モードの
 * 増幅率が |1 + i*lambda*dt| = sqrt(1+(lambda*dt)^2) > 1 となり、
 * dtをどれだけ小さくしても無条件不安定になる。
 *
 * Cayley変換 (I - iAdt/2)^-1(I + iAdt/2) は、Aが自己随伴なら
 * 任意のdtに対して厳密にユニタリ（ノルム保存）になる。これは
 * A の固有値が実数であることから、各固有モードの倍率が
 * (1+i*lambda*dt/2)/(1-i*lambda*dt/2) となり、分子と分母が
 * 互いに複素共役で絶対値が等しいため、倍率の絶対値が厳密に1になる
 * という標準的な事実による。
 *
 * ## 複素方程式を実の 2N^2 元連立一次方程式に変換する
 *
 * L は self-adjoint だが複素行列ではなく実行列（psi の実部・虚部に
 * 独立に作用する）。beta = alpha*dt/2 とすると:
 *
 *   (I - i*beta*L)(psi_r + i*psi_i)
 *     = (psi_r + beta*L*psi_i) + i*(psi_i - beta*L*psi_r)
 *
 * したがって (I - i*beta*L)*psi = rhs は、実の block 系:
 *
 *   [ I         beta*L ] [psi_r]   [rhs_r]
 *   [ -beta*L   I      ] [psi_i] = [rhs_i]
 *
 * に等しい。この 2N^2 x 2N^2 の行列は alpha, dt, geometry が変わらない
 * 限り一定なので、一度だけ LU 分解し（createLinearCayleyStepper）、
 * 毎tickは前進代入・後退代入だけを行う。
 */

import type { ComplexField, TorusGeometry } from '../geometry/torus.ts';
import { applyLaplaceBeltrami, type LaplaceBeltramiOperator } from '../geometry/laplaceBeltrami.ts';
import { luFactorize, luSolve, type LuFactorization } from './linearSolve.ts';

export interface LinearCayleyStepper {
  readonly beta: number;
  /** dense N^2 x N^2 real matrix representation of L, row-major. Exposed for invariants.ts to reuse the exact same operator (never a second implementation of L). */
  readonly operator: LaplaceBeltramiOperator;
  step(psi: ComplexField): ComplexField;
}

function buildDenseLaplacianMatrix(operator: LaplaceBeltramiOperator, size: number): Float64Array {
  const matrix = new Float64Array(size * size);
  const basisReal = new Float64Array(size);
  const basisImag = new Float64Array(size);
  const basis: ComplexField = { real: basisReal, imag: basisImag };
  for (let k = 0; k < size; k++) {
    basisReal.fill(0);
    basisReal[k] = 1;
    const result = applyLaplaceBeltrami(operator, basis);
    for (let row = 0; row < size; row++) {
      matrix[row * size + k] = result.real[row];
    }
  }
  return matrix;
}

function buildBlockSystemMatrix(lMatrix: Float64Array, size: number, beta: number): Float64Array {
  const n2 = 2 * size;
  const m = new Float64Array(n2 * n2);
  // Top-left: I
  for (let i = 0; i < size; i++) m[i * n2 + i] = 1;
  // Bottom-right: I
  for (let i = 0; i < size; i++) m[(size + i) * n2 + (size + i)] = 1;
  // Top-right: beta*L
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      m[i * n2 + (size + j)] = beta * lMatrix[i * size + j];
    }
  }
  // Bottom-left: -beta*L
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      m[(size + i) * n2 + j] = -beta * lMatrix[i * size + j];
    }
  }
  return m;
}

/**
 * Builds a stepper for the linear Cayley/CN step. The system matrix is
 * factorized once here; step() reuses that factorization (see module
 * doc for why this is both correct and efficient).
 */
export function createLinearCayleyStepper(
  operator: LaplaceBeltramiOperator,
  geometry: TorusGeometry,
  alpha: number,
  dt: number,
): LinearCayleyStepper {
  const size = geometry.N * geometry.N;
  const beta = (alpha * dt) / 2;
  const lMatrix = buildDenseLaplacianMatrix(operator, size);
  const systemMatrix = buildBlockSystemMatrix(lMatrix, size, beta);
  const factorization: LuFactorization = luFactorize(systemMatrix, 2 * size);

  function step(psi: ComplexField): ComplexField {
    // rhs = (I + i*beta*L)*psi:
    //   rhs_r = psi_r - beta*L*psi_i
    //   rhs_i = psi_i + beta*L*psi_r
    const lPsiReal = applyLaplaceBeltrami(operator, { real: psi.real, imag: new Float64Array(size) }).real;
    const lPsiImag = applyLaplaceBeltrami(operator, { real: psi.imag, imag: new Float64Array(size) }).real;

    const rhs = new Float64Array(2 * size);
    for (let i = 0; i < size; i++) {
      rhs[i] = psi.real[i] - beta * lPsiImag[i];
      rhs[size + i] = psi.imag[i] + beta * lPsiReal[i];
    }

    const solution = luSolve(factorization, rhs);
    const nextReal = new Float64Array(size);
    const nextImag = new Float64Array(size);
    for (let i = 0; i < size; i++) {
      nextReal[i] = solution[i];
      nextImag[i] = solution[size + i];
    }
    return { real: nextReal, imag: nextImag };
  }

  return { beta, operator, step };
}
