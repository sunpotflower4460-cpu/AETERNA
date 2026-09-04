/**
 * PUT-IN: a complex field psi, its TorusGeometry
 * EMERGED: a single scalar phase-coherence order parameter in [0,1]
 * claim-tier: C2 (unit-validated against hand-constructed fields with
 *   known coherence: a uniform-phase field gives exactly 1, an
 *   exactly-cancelling field gives exactly 0)
 * floors (誠実な床): this measures PHASE alignment only, independent of
 *   amplitude - a field with huge amplitude in one cell and tiny
 *   amplitude everywhere else is weighted the same per-cell as a
 *   uniform-amplitude field (dA-weighted, not |psi|-weighted). This is
 *   a deliberate choice (see module doc), not an oversight, and it is
 *   the "統合" (integration) measurement this file provides - it is one
 *   candidate operationalization, not the only possible one. This module
 *   never reads N, H, nu, or any ledger value, and has no reachable path
 *   into src/pure/field, src/pure/ledger, src/pure/drive, or
 *   src/pure/medium.
 *
 * ## 定義（Kuramoto型オーダーパラメータのdA重み付き連続版）
 *
 *   r = | integral( exp(i*theta(x)) dA ) | / integral(dA)
 *     = | sum_k dA_k * exp(i*theta_k) | / totalArea
 *
 * theta(x) = atan2(psi.imag, psi.real)。振幅では重み付けしない
 * （amplitude-weightedにすると、振幅の大きい少数セルが支配してしまい、
 * 「場全体がどれだけ一つの単位として振る舞っているか」という
 * 空間的な統合度ではなく、局所エネルギー分布を測ることになるため）。
 *
 * r=1: 全セルの位相が完全に一致（最大統合）。
 * r=0: 位相が円周上で一様に散らばり、平均ベクトルが厳密にキャンセルする
 *（最小統合）。
 */

import type { ComplexField } from '../geometry/torus.ts';
import type { TorusGeometry } from '../geometry/torus.ts';

export function computePhaseCoherence(psi: ComplexField, geometry: TorusGeometry): number {
  const { cellArea, totalArea } = geometry;
  let sumReal = 0;
  let sumImag = 0;

  for (let k = 0; k < psi.real.length; k++) {
    const amplitude = Math.hypot(psi.real[k], psi.imag[k]);
    if (amplitude === 0) continue; // phase undefined at exactly zero amplitude - contributes nothing, not a fabricated phase
    const cosTheta = psi.real[k] / amplitude;
    const sinTheta = psi.imag[k] / amplitude;
    sumReal += cellArea[k] * cosTheta;
    sumImag += cellArea[k] * sinTheta;
  }

  return Math.hypot(sumReal, sumImag) / totalArea;
}
