/**
 * PUT-IN: TorusGeometry (dA, theta per row), a complex field psi
 * EMERGED: L*psi, the discrete Laplace-Beltrami operator applied to psi
 * claim-tier: C3 (analytically validated - self-adjointness w.r.t. the
 *   dA-weighted inner product and L(constant)=0 are proven algebraically
 *   below and checked numerically in
 *   src/tests/pure/laplaceBeltramiSelfAdjoint.test.ts; 2nd-order
 *   convergence against an analytic eigenfunction is PR3 work, not this one)
 * floors (誠実な床): this is a finite-volume discretization, not a proof
 *   that it converges to the continuum Laplace-Beltrami operator at any
 *   particular rate. Convergence-order verification belongs to PR3
 *   (docs/pure-physics-implementation-plan.md's hamiltonianConvergence.test.ts).
 *
 * ## 離散化方針
 *
 * 発散形式: Lpsi = div(metricFlux(grad psi))。直交座標でのLaplace-Beltrami:
 *
 *   Delta psi = (1/sqrt(g)) * [
 *     d/dtheta( sqrt(g) g^thetatheta d(psi)/dtheta )
 *   + d/dphi(   sqrt(g) g^phiphi     d(psi)/dphi   )
 *   ]
 *
 * torus計量では sqrt(g) = r*(R + r*cos(theta))、g^thetatheta = 1/r^2、
 * g^phiphi = 1/(R+r*cos(theta))^2 なので:
 *
 *   sqrt(g)*g^thetatheta = (R + r*cos(theta)) / r
 *   sqrt(g)*g^phiphi     = r / (R + r*cos(theta))
 *
 * ## 自己随伴性の保証（設計により、数値実験ではなく代数的に成立する）
 *
 * 各セル (i,j) について
 *
 *   (L psi)_{i,j} = (1/dA_{i,j}) * sum_{k ~ (i,j)} T_{(i,j),k} * (psi_k - psi_{i,j})
 *
 * という形式で、辺の transmissibility T が対称（T_{(i,j),k} = T_{k,(i,j)}）
 * であれば、dA重み付き内積に対して自己随伴になる:
 *
 *   <phi, L psi>_dA = sum_{i,j} dA_{i,j} * conj(phi_{i,j}) * (L psi)_{i,j}
 *                   = sum_{i,j} conj(phi_{i,j}) * sum_k T_{(i,j),k} * (psi_k - psi_{i,j})
 *                   = sum_{edges (i,j)~k} T_{(i,j),k} * conj(phi_{i,j}) * (psi_k - psi_{i,j})
 *
 * 各辺を一度ずつ数えるように書き直すと、T の対称性から
 * <phi, L psi>_dA = <L phi, psi>_dA が代数的に導かれる（辺ごとの寄与が
 * phi<->psi の入れ替えで対をなす）。したがってこの実装が正しく
 * 「対称な辺の重みだけを使う」設計を守っている限り、自己随伴性は
 * 実装の副産物ではなく設計そのものから来る。
 *
 * theta方向の辺の重み T_theta[k]（行kと行k+1の間、周期境界）は
 * phi に依存しない（トーラスの軸対称性）ため、行番号だけでインデックス
 * できる。同様に phi方向の辺の重み T_phi[i]（行i内のj方向の隣接、
 * 周期境界）も j に依存しない。この軸対称性により、
 * 「セルiの+1隣接に使うT」と「セルi+1の-1隣接に使うT」が
 * 定義上まったく同じ配列要素になり、対称性がコードレベルで
 * 自明に保証される（別々に計算して偶然一致させているのではない）。
 */

import type { ComplexField, TorusGeometry } from './torus.ts';

export interface LaplaceBeltramiOperator {
  /** theta-direction edge transmissibility. T_theta[k] is the edge between row k and row (k+1)%N. Length N. */
  readonly thetaTransmissibility: Float64Array;
  /** phi-direction edge transmissibility, constant within a row. T_phi[i] is every j-edge in row i. Length N. */
  readonly phiTransmissibility: Float64Array;
  readonly geometry: TorusGeometry;
}

export function createLaplaceBeltramiOperator(geometry: TorusGeometry): LaplaceBeltramiOperator {
  const { N, R, r, dTheta, dPhi } = geometry;
  const thetaTransmissibility = new Float64Array(N);
  const phiTransmissibility = new Float64Array(N);

  for (let k = 0; k < N; k++) {
    // Edge between row k and row (k+1)%N sits at theta = (k+1)*dTheta.
    const thetaFace = (k + 1) * dTheta;
    thetaTransmissibility[k] = ((R + r * Math.cos(thetaFace)) / r) * (dPhi / dTheta);
  }

  for (let i = 0; i < N; i++) {
    // phi-direction transmissibility uses the cell-center theta for row i
    // (g^phiphi depends only on theta, not on which phi-face within the row).
    const thetaCenter = geometry.theta[i];
    phiTransmissibility[i] = (r / (R + r * Math.cos(thetaCenter))) * (dTheta / dPhi);
  }

  return { thetaTransmissibility, phiTransmissibility, geometry };
}

/**
 * Applies L to a complex field. L is a real linear operator, so it is
 * applied independently to the real and imaginary parts.
 */
export function applyLaplaceBeltrami(operator: LaplaceBeltramiOperator, psi: ComplexField): ComplexField {
  const { geometry, thetaTransmissibility, phiTransmissibility } = operator;
  const { N, cellArea } = geometry;
  const outReal = new Float64Array(N * N);
  const outImag = new Float64Array(N * N);

  for (let i = 0; i < N; i++) {
    const iMinus = (i - 1 + N) % N;
    const iPlus = (i + 1) % N;
    const tThetaMinus = thetaTransmissibility[iMinus]; // edge between iMinus and i
    const tThetaPlus = thetaTransmissibility[i]; // edge between i and iPlus
    const tPhi = phiTransmissibility[i];

    for (let j = 0; j < N; j++) {
      const jMinus = (j - 1 + N) % N;
      const jPlus = (j + 1) % N;
      const idx = i * N + j;
      const idxThetaMinus = iMinus * N + j;
      const idxThetaPlus = iPlus * N + j;
      const idxPhiMinus = i * N + jMinus;
      const idxPhiPlus = i * N + jPlus;
      const invDA = 1 / cellArea[idx];

      const fluxReal =
        tThetaMinus * (psi.real[idxThetaMinus] - psi.real[idx]) +
        tThetaPlus * (psi.real[idxThetaPlus] - psi.real[idx]) +
        tPhi * (psi.real[idxPhiMinus] - psi.real[idx]) +
        tPhi * (psi.real[idxPhiPlus] - psi.real[idx]);

      const fluxImag =
        tThetaMinus * (psi.imag[idxThetaMinus] - psi.imag[idx]) +
        tThetaPlus * (psi.imag[idxThetaPlus] - psi.imag[idx]) +
        tPhi * (psi.imag[idxPhiMinus] - psi.imag[idx]) +
        tPhi * (psi.imag[idxPhiPlus] - psi.imag[idx]);

      outReal[idx] = fluxReal * invDA;
      outImag[idx] = fluxImag * invDA;
    }
  }

  return { real: outReal, imag: outImag };
}
