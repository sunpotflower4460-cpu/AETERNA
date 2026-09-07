/**
 * PUT-IN: a complex cyclic tridiagonal linear system (per-row lower/
 *   diag/upper coefficients, where lower[0] and upper[n-1] are the
 *   "corner" entries that wrap the ring closed) and a right-hand side
 * EMERGED: the solution vector x such that A*x = rhs
 * claim-tier: C3 (analytically validated - the Sherman-Morrison
 *   reduction of a cyclic tridiagonal system to two plain tridiagonal
 *   solves is a textbook technique, not a new derivation; correctness
 *   is checked against an independent dense complex Gaussian-
 *   elimination oracle on random systems in
 *   src/tests/pure/cyclicTridiagonalSolve.test.ts)
 * floors (誠実な床): assumes every plain-tridiagonal pivot encountered
 *   (the "m" in the forward sweep) is nonzero - this module does not
 *   implement partial pivoting. For the one system this module is built
 *   to solve (I - i*beta*L_m from linearCayleySpectralStep.ts), the
 *   diagonal is 1 minus a purely imaginary number, so its magnitude is
 *   always >= 1 and pivots cannot vanish; this guarantee is specific to
 *   that caller, not a general property of this solver.
 *
 * ## なぜ Sherman-Morrison で通常の三重対角に帰着できるか
 *
 * n>=3 の巡回三重対角行列 A（角の要素 alpha = A[n-1][0], beta = A[0][n-1]
 * を持つ）を、通常の（角のない）三重対角行列 T と階数1更新 u*v^T の和
 * A = T + u*v^T として書く（gamma は任意の非零複素数、ここでは -A[0][0]
 * を使い対角の桁落ちを避ける）:
 *
 *   T = A のコピーで、角を0にし、対角を T[0][0]=A[0][0]-gamma,
 *       T[n-1][n-1]=A[n-1][n-1]-alpha*beta/gamma に変更したもの
 *   u = [gamma, 0, ..., 0, alpha]^T
 *   v = [1, 0, ..., 0, beta/gamma]^T
 *
 * Sherman-Morrison の公式:
 *   x = y - (v^T y)/(1 + v^T z) * z,  ただし T*y=rhs, T*z=u
 *
 * T*y と T*z は通常の（巡回でない）複素三重対角系なので、Thomas法で
 * それぞれ O(n) で解ける。
 *
 * n=2 は特異ケース: 巡回三重対角の「下隣接」と「上隣接」が同じ相手
 * （もう一方の唯一のセル）を指すため、標準の角分離が退化する
 * （u[1] と l[0] が同じ辺を指す）。ここでは2x2の稠密複素連立方程式
 * として直接解く。
 */

export interface ComplexVector {
  real: Float64Array;
  imag: Float64Array;
}

export interface ComplexCyclicTridiagonalSystem {
  /** lower[i]: coefficient of x[(i-1+n)%n] in row i. lower[0] is the wraparound corner (coefficient of x[n-1] in row 0). */
  lowerReal: Float64Array;
  lowerImag: Float64Array;
  diagReal: Float64Array;
  diagImag: Float64Array;
  /** upper[i]: coefficient of x[(i+1)%n] in row i. upper[n-1] is the wraparound corner (coefficient of x[0] in row n-1). */
  upperReal: Float64Array;
  upperImag: Float64Array;
}

function cMul(ar: number, ai: number, br: number, bi: number): [number, number] {
  return [ar * br - ai * bi, ar * bi + ai * br];
}

function cDiv(ar: number, ai: number, br: number, bi: number): [number, number] {
  const denom = br * br + bi * bi;
  return [(ar * br + ai * bi) / denom, (ai * br - ar * bi) / denom];
}

/** Solves a PLAIN (non-cyclic) complex tridiagonal system via the Thomas algorithm. lower[0] and upper[n-1] are ignored. */
function solvePlainComplexTridiagonal(
  lowerReal: Float64Array, lowerImag: Float64Array,
  diagReal: Float64Array, diagImag: Float64Array,
  upperReal: Float64Array, upperImag: Float64Array,
  rhsReal: Float64Array, rhsImag: Float64Array,
): ComplexVector {
  const n = diagReal.length;
  const cPrimeReal = new Float64Array(n);
  const cPrimeImag = new Float64Array(n);
  const dPrimeReal = new Float64Array(n);
  const dPrimeImag = new Float64Array(n);

  {
    const [cr, ci] = cDiv(upperReal[0], upperImag[0], diagReal[0], diagImag[0]);
    cPrimeReal[0] = cr;
    cPrimeImag[0] = ci;
    const [dr, di] = cDiv(rhsReal[0], rhsImag[0], diagReal[0], diagImag[0]);
    dPrimeReal[0] = dr;
    dPrimeImag[0] = di;
  }

  for (let i = 1; i < n; i++) {
    const [lcr, lci] = cMul(lowerReal[i], lowerImag[i], cPrimeReal[i - 1], cPrimeImag[i - 1]);
    const mr = diagReal[i] - lcr;
    const mi = diagImag[i] - lci;

    if (i < n - 1) {
      const [cr, ci] = cDiv(upperReal[i], upperImag[i], mr, mi);
      cPrimeReal[i] = cr;
      cPrimeImag[i] = ci;
    }

    const [ldr, ldi] = cMul(lowerReal[i], lowerImag[i], dPrimeReal[i - 1], dPrimeImag[i - 1]);
    const [dr, di] = cDiv(rhsReal[i] - ldr, rhsImag[i] - ldi, mr, mi);
    dPrimeReal[i] = dr;
    dPrimeImag[i] = di;
  }

  const xReal = new Float64Array(n);
  const xImag = new Float64Array(n);
  xReal[n - 1] = dPrimeReal[n - 1];
  xImag[n - 1] = dPrimeImag[n - 1];
  for (let i = n - 2; i >= 0; i--) {
    const [cxr, cxi] = cMul(cPrimeReal[i], cPrimeImag[i], xReal[i + 1], xImag[i + 1]);
    xReal[i] = dPrimeReal[i] - cxr;
    xImag[i] = dPrimeImag[i] - cxi;
  }

  return { real: xReal, imag: xImag };
}

function solveDense2x2(system: ComplexCyclicTridiagonalSystem, rhsReal: Float64Array, rhsImag: Float64Array): ComplexVector {
  // Row 0: (diag0)*x0 + (upper0 + lower0)*x1 = rhs0  (the two wraparound edges to cell 1 combine)
  // Row 1: (upper1 + lower1)*x0 + (diag1)*x1 = rhs1
  const a00r = system.diagReal[0], a00i = system.diagImag[0];
  const a01r = system.upperReal[0] + system.lowerReal[0], a01i = system.upperImag[0] + system.lowerImag[0];
  const a10r = system.upperReal[1] + system.lowerReal[1], a10i = system.upperImag[1] + system.lowerImag[1];
  const a11r = system.diagReal[1], a11i = system.diagImag[1];

  // det = a00*a11 - a01*a10
  const [t1r, t1i] = cMul(a00r, a00i, a11r, a11i);
  const [t2r, t2i] = cMul(a01r, a01i, a10r, a10i);
  const detR = t1r - t2r, detI = t1i - t2i;

  // x0 = (rhs0*a11 - a01*rhs1) / det
  const [p1r, p1i] = cMul(rhsReal[0], rhsImag[0], a11r, a11i);
  const [p2r, p2i] = cMul(a01r, a01i, rhsReal[1], rhsImag[1]);
  const [x0r, x0i] = cDiv(p1r - p2r, p1i - p2i, detR, detI);

  // x1 = (a00*rhs1 - rhs0*a10) / det
  const [p3r, p3i] = cMul(a00r, a00i, rhsReal[1], rhsImag[1]);
  const [p4r, p4i] = cMul(rhsReal[0], rhsImag[0], a10r, a10i);
  const [x1r, x1i] = cDiv(p3r - p4r, p3i - p4i, detR, detI);

  return { real: Float64Array.from([x0r, x1r]), imag: Float64Array.from([x0i, x1i]) };
}

export function solveComplexCyclicTridiagonal(
  system: ComplexCyclicTridiagonalSystem,
  rhsReal: Float64Array,
  rhsImag: Float64Array,
): ComplexVector {
  const n = system.diagReal.length;
  if (n < 2) {
    throw new Error(`solveComplexCyclicTridiagonal: n must be >= 2, got ${n}`);
  }
  if (n === 2) {
    return solveDense2x2(system, rhsReal, rhsImag);
  }

  const { lowerReal, lowerImag, diagReal, diagImag, upperReal, upperImag } = system;
  const alphaR = upperReal[n - 1], alphaI = upperImag[n - 1];
  const betaR = lowerReal[0], betaI = lowerImag[0];
  const gammaR = -diagReal[0], gammaI = -diagImag[0];

  const tDiagReal = Float64Array.from(diagReal);
  const tDiagImag = Float64Array.from(diagImag);
  tDiagReal[0] -= gammaR;
  tDiagImag[0] -= gammaI;
  const [abr, abi] = cMul(alphaR, alphaI, betaR, betaI);
  const [abgR, abgI] = cDiv(abr, abi, gammaR, gammaI);
  tDiagReal[n - 1] -= abgR;
  tDiagImag[n - 1] -= abgI;

  const tLowerReal = Float64Array.from(lowerReal);
  const tLowerImag = Float64Array.from(lowerImag);
  tLowerReal[0] = 0;
  tLowerImag[0] = 0;
  const tUpperReal = Float64Array.from(upperReal);
  const tUpperImag = Float64Array.from(upperImag);
  tUpperReal[n - 1] = 0;
  tUpperImag[n - 1] = 0;

  const y = solvePlainComplexTridiagonal(tLowerReal, tLowerImag, tDiagReal, tDiagImag, tUpperReal, tUpperImag, rhsReal, rhsImag);

  const uReal = new Float64Array(n);
  const uImag = new Float64Array(n);
  uReal[0] = gammaR;
  uImag[0] = gammaI;
  uReal[n - 1] = alphaR;
  uImag[n - 1] = alphaI;
  const z = solvePlainComplexTridiagonal(tLowerReal, tLowerImag, tDiagReal, tDiagImag, tUpperReal, tUpperImag, uReal, uImag);

  const [betaOverGammaR, betaOverGammaI] = cDiv(betaR, betaI, gammaR, gammaI);

  const [byLastR, byLastI] = cMul(betaOverGammaR, betaOverGammaI, y.real[n - 1], y.imag[n - 1]);
  const vTyR = y.real[0] + byLastR, vTyI = y.imag[0] + byLastI;
  const [bzLastR, bzLastI] = cMul(betaOverGammaR, betaOverGammaI, z.real[n - 1], z.imag[n - 1]);
  const vTzR = z.real[0] + bzLastR, vTzI = z.imag[0] + bzLastI;

  const [factorR, factorI] = cDiv(vTyR, vTyI, 1 + vTzR, vTzI);

  const xReal = new Float64Array(n);
  const xImag = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const [fzR, fzI] = cMul(factorR, factorI, z.real[i], z.imag[i]);
    xReal[i] = y.real[i] - fzR;
    xImag[i] = y.imag[i] - fzI;
  }

  return { real: xReal, imag: xImag };
}
