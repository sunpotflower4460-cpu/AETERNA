/**
 * PUT-IN: a complex field chi on the ring, the RingLaplacianOperator
 *   (built from the SAME ExchangeRingGeometry chi lives on), alpha_chi
 * EMERGED: N_chi (the dA-weighted norm) and H_chi (chi's Hamiltonian,
 *   linear-only: g_chi=0 per docs/vessel/K5-exchange-medium-adr.md
 *   choice 1)
 * claim-tier: C3 (analytically validated - both quantities are proven
 *   exactly invariant under applyRingShift in ringShiftStep.ts's module
 *   doc; checked numerically to floating-point precision in
 *   src/tests/pure/ringShiftInvariants.test.ts)
 * floors (誠実な床): no quartic (g_chi) term - chi is linear-only in
 *   this implementation. H_chi is defined from the SAME
 *   RingLaplacianOperator instance the caller must reuse consistently
 *   (mirrors src/pure/field/invariants.ts's "invariants and step share
 *   the same L" requirement, applied here to chi's own L_chi even
 *   though L_chi does not drive chi's actual dynamics - see
 *   ringShiftStep.ts).
 *
 *   N_chi = dx * sum_m |chi_m|^2
 *   H_chi = alpha_chi * <chi, -L_chi*chi>_dA
 */

import type { ComplexField } from '../geometry/torus.ts';
import type { ExchangeRingGeometry } from './ringGeometry.ts';
import { applyRingLaplacian, type RingLaplacianOperator } from './ringLaplacian.ts';

export function computeRingNorm(chi: ComplexField, geometry: ExchangeRingGeometry): number {
  const { cellArea } = geometry;
  let sum = 0;
  for (let m = 0; m < cellArea.length; m++) {
    sum += (chi.real[m] * chi.real[m] + chi.imag[m] * chi.imag[m]) * cellArea[m];
  }
  return sum;
}

export function computeRingHamiltonian(chi: ComplexField, operator: RingLaplacianOperator, alphaChi: number): number {
  const { geometry } = operator;
  const lChi = applyRingLaplacian(operator, chi);

  let kinetic = 0;
  for (let m = 0; m < geometry.M; m++) {
    // <chi, -L_chi*chi>_dA = sum_m conj(chi_m) * (-lChi_m) * dA_m; real part only (self-adjoint operator).
    const negLReal = -lChi.real[m];
    const negLImag = -lChi.imag[m];
    kinetic += (chi.real[m] * negLReal + chi.imag[m] * negLImag) * geometry.cellArea[m];
  }

  return alphaChi * kinetic;
}
