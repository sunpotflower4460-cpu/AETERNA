/**
 * PUT-IN: ExchangeRingGeometry, a complex field chi (length M)
 * EMERGED: L_chi * chi, the discrete 1D periodic Laplacian applied to chi
 * claim-tier: C3 (analytically validated - self-adjointness w.r.t. the
 *   dA-weighted inner product is proven algebraically below from the
 *   same symmetric-transmissibility construction as
 *   src/pure/geometry/laplaceBeltrami.ts, and checked numerically in
 *   src/tests/pure/ringLaplacianSelfAdjoint.test.ts)
 * floors (誠実な床): this operator is used only to DEFINE H_chi for
 *   bookkeeping (see ringInvariants.ts) - chi's actual conservative
 *   dynamics is the exact shift in ringShiftStep.ts, not integration of
 *   i*alpha_chi*L_chi. See docs/vessel/K5-exchange-medium-adr.md choice 1
 *   for why, and ringInvariants.ts's module doc for the proof that a
 *   cyclic shift conserves this operator's bilinear form exactly anyway.
 *
 * ## 自己随伴性（laplaceBeltrami.ts と同じ構成による代数的保証）
 *
 * 一様間隔 dx の周期リングなので、全ての辺 (m, m+1 mod M) の
 * transmissibility は同一の定数 T = 1/dx^2（標準的な中心差分の正規化）。
 * 辺 (m,m+1) を「セルmの+1隣接」と「セルm+1の-1隣接」の両方から見ても
 * 定義上まったく同じ配列要素（同一の定数T）になるため、
 * laplaceBeltrami.ts と同じ理由で自己随伴性はコードレベルで自明に
 * 保証される（別々に計算して偶然一致させているのではない）。
 */

import type { ComplexField } from '../geometry/torus.ts';
import type { ExchangeRingGeometry } from './ringGeometry.ts';

export interface RingLaplacianOperator {
  readonly transmissibility: number;
  readonly geometry: ExchangeRingGeometry;
}

export function createRingLaplacian(geometry: ExchangeRingGeometry): RingLaplacianOperator {
  const transmissibility = 1 / (geometry.dx * geometry.dx);
  return { transmissibility, geometry };
}

export function applyRingLaplacian(operator: RingLaplacianOperator, chi: ComplexField): ComplexField {
  const { geometry, transmissibility } = operator;
  const { M } = geometry;
  const outReal = new Float64Array(M);
  const outImag = new Float64Array(M);

  for (let m = 0; m < M; m++) {
    const mMinus = (m - 1 + M) % M;
    const mPlus = (m + 1) % M;
    outReal[m] = transmissibility * (chi.real[mMinus] - chi.real[m]) + transmissibility * (chi.real[mPlus] - chi.real[m]);
    outImag[m] = transmissibility * (chi.imag[mMinus] - chi.imag[m]) + transmissibility * (chi.imag[mPlus] - chi.imag[m]);
  }

  return { real: outReal, imag: outImag };
}
