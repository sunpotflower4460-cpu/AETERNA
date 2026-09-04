/**
 * PUT-IN: chi (a complex field on the ring), shiftCellsPerTick
 * EMERGED: chi cyclically shifted by shiftCellsPerTick cells
 * claim-tier: C3 (analytically validated - see module doc for the exact
 *   norm/Fourier-amplitude preservation proof; checked numerically in
 *   src/tests/pure/ringShiftStep.test.ts)
 * floors (誠実な床): this is chi's ENTIRE conservative dynamics (see
 *   docs/vessel/K5-exchange-medium-adr.md choice 1) - there is no
 *   separate nonlinear or linear-solve step for chi. shiftCellsPerTick
 *   must be a non-negative integer for the shift to be exact (no
 *   interpolation); fractional propagation speeds are not representable
 *   by this stepper.
 *
 * ## なぜこれが「χ自身の波動方程式」の厳密解か
 *
 * ∂χ/∂t = −v·∂χ/∂x の厳密解は χ(x,t) = χ(x−vt, 0)（純粋な並進）。
 * 離散化では、1 tick で `shiftCellsPerTick` セルぶんインデックスを
 * 進める巡回置換がこの並進の厳密な離散版になる（線形補間や差分近似を
 * 一切含まない）。
 *
 * ## なぜ N_chi と（g_chi=0のときの）H_chi を代数的に厳密保存するか
 *
 * 巡回置換は周期リング上のどのフーリエ振幅 |chi_k| も変えない（各
 * モードの位相だけを回す: chi_k -> chi_k * exp(-i*k*shift*(2*pi/M))）。
 * N_chi = dx * sum_m |chi_m|^2 はパーセバルの定理により
 * sum_k |chi_k|^2 に比例するので、|chi_k| が不変なら N_chi も不変。
 * H_chi（g_chi=0の場合）= alpha_chi * <chi,-L_chi*chi>_dA も、周期的で
 * 並進不変な自己随伴作用素 L_chi の固有値が波数kのみに依存するため
 * sum_k (固有値_k) * |chi_k|^2 の形に書け、同じ理由で不変になる
 * （`ringInvariants.ts` の `computeRingHamiltonian` が実際に検証する）。
 */

import type { ComplexField } from '../geometry/torus.ts';

export function applyRingShift(chi: ComplexField, shiftCellsPerTick: number): ComplexField {
  const M = chi.real.length;
  if (!Number.isInteger(shiftCellsPerTick) || shiftCellsPerTick < 0) {
    throw new Error(`applyRingShift: shiftCellsPerTick must be a non-negative integer, got ${shiftCellsPerTick}`);
  }

  const shift = shiftCellsPerTick % M;
  const real = new Float64Array(M);
  const imag = new Float64Array(M);
  for (let m = 0; m < M; m++) {
    const source = (m - shift + M) % M;
    real[m] = chi.real[source];
    imag[m] = chi.imag[source];
  }

  return { real, imag };
}
