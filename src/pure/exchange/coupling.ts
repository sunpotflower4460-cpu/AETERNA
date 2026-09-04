/**
 * PUT-IN: psi, chi, an ExchangeCouplingConfig (lambda, the boundary cell,
 *   the port cell), dt
 * EMERGED: psi and chi with exactly their boundary/port cells updated by
 *   an exact two-level "Rabi rotation" - everywhere else unchanged
 * claim-tier: C3 (analytically validated - unitarity of the 2x2 rotation
 *   is proven below and confirmed in
 *   src/tests/pure/exchangeCouplingUnitary.test.ts; the resulting exact
 *   N-bookkeeping symmetry is confirmed in
 *   src/tests/pure/exchangeLedger.test.ts)
 * floors (誠実な床): touches ONLY psi[boundaryCellIndex] and
 *   chi[portCellIndex] - no other cell of either field is read or
 *   written by this step (see docs/vessel/K5-exchange-medium-adr.md
 *   choice 2 for why a single-cell boundary was chosen over a
 *   distributed mask).
 *
 * docs/vessel/K5-exchange-medium-adr.md 選択3の、素朴な緩和型結合
 * ではなく厳密な2準位回転を選んだ理由と、その解析解は同ADRを参照。
 *
 * ## 厳密解の導出
 *
 * エルミートな結合ハミルトニアン H_c = lambda*(|psi_b><chi_p| +
 * |chi_p><psi_b|) の下で i*d/dt[psi_b;chi_p] = H_c*[psi_b;chi_p] を
 * 解くと（H_cの固有値は+-lambda、固有ベクトルは(1,1)/(1,-1)）:
 *
 *   theta = lambda*dt
 *   psi_b(t+dt) = cos(theta)*psi_b(t) - i*sin(theta)*chi_p(t)
 *   chi_p(t+dt) = cos(theta)*chi_p(t) - i*sin(theta)*psi_b(t)
 *
 * この2x2変換行列 U = cos(theta)*I - i*sin(theta)*sigma_x は
 * exp(-i*theta*sigma_x) そのものであり、sigma_xがエルミートなので
 * Uはユニタリ（U†U=I）。したがって |psi_b|^2+|chi_p|^2 は
 * このステップで代数的に厳密に保存される（近似ではない）。
 *
 * `createExchangeCouplingConfig` が chi の dx を psi の境界セルの
 * cellArea と一致させることを強制しているため、この
 * |psi_b|^2+|chi_p|^2 の保存はそのまま
 * cellArea_b*|psi_b|^2 + dx_chi*|chi_p|^2 の保存になり、
 * N_psi の変化量と N_chi の変化量が厳密に同額逆符号になる。
 */

import type { ComplexField } from '../geometry/torus.ts';
import type { ExchangeCouplingConfig } from './boundary.ts';

export interface ExchangeCouplingResult {
  psi: ComplexField;
  chi: ComplexField;
}

export function applyExchangeCoupling(psi: ComplexField, chi: ComplexField, config: ExchangeCouplingConfig, dt: number): ExchangeCouplingResult {
  const { lambda, boundaryCellIndex, portCellIndex } = config;
  const theta = lambda * dt;
  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);

  const psiBReal = psi.real[boundaryCellIndex];
  const psiBImag = psi.imag[boundaryCellIndex];
  const chiPReal = chi.real[portCellIndex];
  const chiPImag = chi.imag[portCellIndex];

  // psi_b_new = cos(theta)*psi_b - i*sin(theta)*chi_p
  const newPsiBReal = cosTheta * psiBReal + sinTheta * chiPImag;
  const newPsiBImag = cosTheta * psiBImag - sinTheta * chiPReal;
  // chi_p_new = cos(theta)*chi_p - i*sin(theta)*psi_b
  const newChiPReal = cosTheta * chiPReal + sinTheta * psiBImag;
  const newChiPImag = cosTheta * chiPImag - sinTheta * psiBReal;

  const outPsi: ComplexField = { real: Float64Array.from(psi.real), imag: Float64Array.from(psi.imag) };
  outPsi.real[boundaryCellIndex] = newPsiBReal;
  outPsi.imag[boundaryCellIndex] = newPsiBImag;

  const outChi: ComplexField = { real: Float64Array.from(chi.real), imag: Float64Array.from(chi.imag) };
  outChi.real[portCellIndex] = newChiPReal;
  outChi.imag[portCellIndex] = newChiPImag;

  return { psi: outPsi, chi: outChi };
}
