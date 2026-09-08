/**
 * PUT-IN: a LaplaceBeltramiOperator L (from PR2), TorusGeometry, alpha, dt
 * EMERGED: a solver for one full-dt Cayley/Crank-Nicolson step of the
 *   linear part of the conservative block, computing the SAME
 *   psi_next = (I - i*alpha*dt/2*L)^-1 (I + i*alpha*dt/2*L) psi as
 *   linearCayleyStep.ts, but in O(N^2 log N) instead of O(N^6) by
 *   exploiting phi-direction translation invariance
 * claim-tier: C3 (analytically validated - the mode decomposition and
 *   its self-adjointness are derived in the module doc below from the
 *   SAME algebraic facts laplaceBeltrami.ts already establishes;
 *   correctness is checked directly against linearCayleyStep.ts's dense
 *   LU solve - the oracle - at matching small N in
 *   src/tests/pure/linearCayleySpectralStep.test.ts, not merely
 *   asserted)
 * claim-tier for scale: C2 (large-N invariant tests - N conservation, H
 *   boundedness at N=128/256 - are src/tests/pure/spectralLargeN.test.ts,
 *   a separate, not-yet-exhaustive check)
 * floors (誠実な床): requires geometry.N to be an exact power of 2 (the
 *   FFT's own constraint - see fft.ts's module doc). This is enforced by
 *   the caller (params.ts's validatePureCoreParams, when
 *   linearSolverKind='spectral'), not by this module itself, which only
 *   assumes it. docs/vessel/K-series-II-brain-and-universe-plan.md's K9
 *   section names this constraint explicitly as a design choice, not an
 *   oversight.
 *
 * ## なぜ phi 方向にモード分解できるか(laplaceBeltrami.ts の事実の言い換え)
 *
 * torus.ts: cellArea[i*N+j] は j に依存しない(dA_i)。laplaceBeltrami.ts:
 * phiTransmissibility[i] は行 i 内の j 方向の辺すべてで同一の値
 * T_phi[i]。したがって固定した行 i について、L の phi 方向の寄与
 *
 *   (T_phi[i]/dA_i) * (psi_{i,j-1} - 2*psi_{i,j} + psi_{i,j+1})
 *
 * は j について周期的で係数が j に依存しない(巡回)畳み込みであり、
 * 標準的な事実として離散フーリエ変換で対角化される。psi_{i,j} の
 * j方向DFTを psiHat_{i,m} とすると、この項は
 *
 *   -(T_phi[i]/dA_i) * (2 - 2*cos(2*pi*m/N)) * psiHat_{i,m}
 *
 * になる(フーリエ微分定理: 周期的な2階差分作用素の固有値は
 * -(2-2cos(2*pi*m/N)))。theta方向の項(T_theta を使う部分)は j に
 * 依存しないのでDFTでそのまま残る。結果として、各モード m ごとに
 * 独立した「theta方向の巡回三重対角 + モード依存の対角シフト」という
 * 作用素 L_m が得られる:
 *
 *   (L_m x)_i = (1/dA_i) * [
 *     T_theta[i-1]*(x_{i-1}-x_i) + T_theta[i]*(x_{i+1}-x_i)
 *     - T_phi[i]*(2-2cos(2*pi*m/N))*x_i
 *   ]
 *
 * ## なぜ各 L_m が dA 重み付き内積で自己随伴か
 *
 * L がその内積で自己随伴であること(laplaceBeltrami.ts で証明済み)と、
 * DFT がその内積のphi方向部分に対してユニタリであること(Parseval: dA_i
 * が j に依存しないので sum_j conj(a_j) b_j = (1/N) sum_m conj(â_m) b̂_m
 * がそのまま dA_i 重みに掛かる)から、L は phi方向の並進(循環シフト)と
 * 可換であり、その並進作用素の固有空間(=各モード m の空間)ごとに
 * 自己随伴性を保つ。これは linearCayleySpectralStep 独自の主張ではなく、
 * 「自己随伴かつ並進不変な作用素はモードごとに自己随伴に分解する」という
 * 標準的な線形代数の事実を、laplaceBeltrami.ts が既に証明した具体的な
 * L に適用しただけである。
 *
 * ## Cayley 変換とソルバー
 *
 * 各モード m について (I - i*beta*L_m) x = (I + i*beta*L_m) psiHat_m を
 * cyclicTridiagonalSolve.ts で解く(L_m は実数の巡回三重対角行列なので、
 * この複素方程式は行ごとに複素数の対角・上下・角要素を持つ巡回三重対角
 * 系になる)。L_m が自己随伴(実固有値を持つ)なので、この変換は
 * linearCayleyStep.ts と全く同じ理由でモードごとに厳密ユニタリになる。
 */

import type { ComplexField, TorusGeometry } from '../geometry/torus.ts';
import type { LaplaceBeltramiOperator } from '../geometry/laplaceBeltrami.ts';
import { forwardFFT, inverseFFT } from './fft.ts';
import { solveComplexCyclicTridiagonal, type ComplexCyclicTridiagonalSystem } from './cyclicTridiagonalSolve.ts';

export interface LinearCayleySpectralStepper {
  readonly beta: number;
  readonly operator: LaplaceBeltramiOperator;
  step(psi: ComplexField): ComplexField;
}

interface ModeLaplacian {
  lower: Float64Array;
  diag: Float64Array;
  upper: Float64Array;
}

function buildModeLaplacian(operator: LaplaceBeltramiOperator, geometry: TorusGeometry, m: number): ModeLaplacian {
  const { N } = geometry;
  const { thetaTransmissibility, phiTransmissibility } = operator;
  const lower = new Float64Array(N);
  const diag = new Float64Array(N);
  const upper = new Float64Array(N);
  const phiEigenvalueShift = 2 - 2 * Math.cos((2 * Math.PI * m) / N);

  for (let i = 0; i < N; i++) {
    const iMinus = (i - 1 + N) % N;
    const tThetaMinus = thetaTransmissibility[iMinus];
    const tThetaPlus = thetaTransmissibility[i];
    const invDA = 1 / geometry.cellArea[i * N];

    lower[i] = tThetaMinus * invDA;
    upper[i] = tThetaPlus * invDA;
    diag[i] = -(tThetaMinus + tThetaPlus) * invDA - phiTransmissibility[i] * phiEigenvalueShift * invDA;
  }

  return { lower, diag, upper };
}

/** Builds (I - i*beta*L_m) as a complex cyclic tridiagonal system, and separately applies (I + i*beta*L_m) to a vector - both from the SAME real ModeLaplacian entries. */
function buildCayleySystem(modeL: ModeLaplacian, beta: number): ComplexCyclicTridiagonalSystem {
  const n = modeL.diag.length;
  return {
    lowerReal: new Float64Array(n),
    lowerImag: Float64Array.from(modeL.lower, (v) => -beta * v),
    diagReal: new Float64Array(n).fill(1),
    diagImag: Float64Array.from(modeL.diag, (v) => -beta * v),
    upperReal: new Float64Array(n),
    upperImag: Float64Array.from(modeL.upper, (v) => -beta * v),
  };
}

function applyPlusOperator(modeL: ModeLaplacian, beta: number, xReal: Float64Array, xImag: Float64Array): { real: Float64Array; imag: Float64Array } {
  const n = modeL.diag.length;
  const outReal = new Float64Array(n);
  const outImag = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const iMinus = (i - 1 + n) % n;
    const iPlus = (i + 1) % n;
    // (I + i*beta*L_m) applied: x_i + i*beta*(lower[i]*x_{i-1} + diag[i]*x_i + upper[i]*x_{i+1})
    const combinedReal = modeL.lower[i] * xReal[iMinus] + modeL.diag[i] * xReal[i] + modeL.upper[i] * xReal[iPlus];
    const combinedImag = modeL.lower[i] * xImag[iMinus] + modeL.diag[i] * xImag[i] + modeL.upper[i] * xImag[iPlus];
    // + i*beta*(combinedReal + i*combinedImag) = -beta*combinedImag + i*beta*combinedReal
    outReal[i] = xReal[i] - beta * combinedImag;
    outImag[i] = xImag[i] + beta * combinedReal;
  }
  return { real: outReal, imag: outImag };
}

export function createLinearCayleySpectralStepper(
  operator: LaplaceBeltramiOperator,
  geometry: TorusGeometry,
  alpha: number,
  dt: number,
): LinearCayleySpectralStepper {
  const { N } = geometry;
  const beta = (alpha * dt) / 2;

  const modeLaplacians: ModeLaplacian[] = [];
  const cayleySystems: ComplexCyclicTridiagonalSystem[] = [];
  for (let m = 0; m < N; m++) {
    const modeL = buildModeLaplacian(operator, geometry, m);
    modeLaplacians.push(modeL);
    cayleySystems.push(buildCayleySystem(modeL, beta));
  }

  function step(psi: ComplexField): ComplexField {
    // Forward FFT along phi (j), independently for each row i.
    const hatReal = new Float64Array(N * N);
    const hatImag = new Float64Array(N * N);
    for (let i = 0; i < N; i++) {
      const rowReal = psi.real.subarray(i * N, i * N + N);
      const rowImag = psi.imag.subarray(i * N, i * N + N);
      const { real, imag } = forwardFFT(Float64Array.from(rowReal), Float64Array.from(rowImag));
      hatReal.set(real, i * N);
      hatImag.set(imag, i * N);
    }

    // For each mode m, solve the theta-direction cyclic tridiagonal Cayley system.
    const solvedReal = new Float64Array(N * N);
    const solvedImag = new Float64Array(N * N);
    for (let m = 0; m < N; m++) {
      const columnReal = new Float64Array(N);
      const columnImag = new Float64Array(N);
      for (let i = 0; i < N; i++) {
        columnReal[i] = hatReal[i * N + m];
        columnImag[i] = hatImag[i * N + m];
      }

      const rhs = applyPlusOperator(modeLaplacians[m], beta, columnReal, columnImag);
      const solved = solveComplexCyclicTridiagonal(cayleySystems[m], rhs.real, rhs.imag);

      for (let i = 0; i < N; i++) {
        solvedReal[i * N + m] = solved.real[i];
        solvedImag[i * N + m] = solved.imag[i];
      }
    }

    // Inverse FFT along phi (m -> j), independently for each row i.
    const outReal = new Float64Array(N * N);
    const outImag = new Float64Array(N * N);
    for (let i = 0; i < N; i++) {
      const rowReal = solvedReal.subarray(i * N, i * N + N);
      const rowImag = solvedImag.subarray(i * N, i * N + N);
      const { real, imag } = inverseFFT(Float64Array.from(rowReal), Float64Array.from(rowImag));
      outReal.set(real, i * N);
      outImag.set(imag, i * N);
    }

    return { real: outReal, imag: outImag };
  }

  return { beta, operator, step };
}
