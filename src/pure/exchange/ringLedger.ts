/**
 * PUT-IN: chi at tick start, a RingLaplacianOperator (built from the same
 *   ExchangeRingGeometry used everywhere for chi), alpha_chi,
 *   shiftCellsPerTick, nu_chi(uniform, per docs/vessel/K5-exchange-
 *   medium-adr.md's "answered elsewhere" list: chi's own medium history
 *   is deferred, nu_chi is a constant here), dt
 * EMERGED: chi after one full tick (exact shift, then dissipation) plus
 *   a RingLedgerEntry mirroring src/pure/ledger/energy.ts's
 *   EnergyLedgerEntry structure for chi's own N_chi/H_chi bookkeeping
 * claim-tier: C3 (see src/tests/pure/ringDissipation.test.ts: uniform
 *   nu_chi gives dissipationLoss_N_chi >= 0 and dissipationLoss_H_chi
 *   >= 0 - even more cleanly than psi's case, since g_chi=0 means no
 *   quartic term competes with the kinetic-term decay; see
 *   src/tests/pure/ringLedgerDissipation.test.ts for the bookkeeping
 *   identity)
 * floors (誠実な床): numericalDrift_H_chi and residual_N/H_chi are
 *   expected to be at floating-point-roundoff scale, not exactly the
 *   bit-pattern 0 - the conservative step (applyRingShift) is an EXACT
 *   permutation (proven in ringShiftStep.ts to conserve N_chi/H_chi
 *   algebraically), but summing the same set of |chi_m|^2 terms in a
 *   different order after permutation is not guaranteed bit-identical
 *   in floating point (addition is not perfectly associative). This is
 *   a strictly weaker source of residual than psi's own conservative
 *   step, which has genuine O(dt^2) truncation error from the Cayley/CN
 *   linear solve - chi's residual is pure summation-order roundoff.
 *
 * この関数は applyDissipationStep（src/pure/field/stepDissipation.ts）を
 * そのまま再利用する。この関数は次元・幾何に依存しない汎用実装
 * （ComplexField と Float64Array の nu、dt だけを取る）であるため、
 * ψ用に書かれたコードをχにもそのまま使ってよい。
 */

import type { ComplexField } from '../geometry/torus.ts';
import type { ExchangeRingGeometry } from './ringGeometry.ts';
import type { RingLaplacianOperator } from './ringLaplacian.ts';
import { computeRingHamiltonian, computeRingNorm } from './ringInvariants.ts';
import { applyRingShift } from './ringShiftStep.ts';
import { applyDissipationStep } from '../field/stepDissipation.ts';

export interface RingLedgerEntry {
  nBefore: number;
  nAfterConservative: number;
  nAfterDissipation: number;
  hBefore: number;
  hAfterConservative: number;
  hAfterDissipation: number;
  dissipationLossN: number;
  dissipationLossH: number;
  numericalDriftH: number;
  residualN: number;
  residualH: number;
}

export interface RingDissipationTickResult {
  chi: ComplexField;
  ledger: RingLedgerEntry;
}

export function runRingDissipationTick(
  chi: ComplexField,
  operator: RingLaplacianOperator,
  geometry: ExchangeRingGeometry,
  alphaChi: number,
  shiftCellsPerTick: number,
  nuChi: Float64Array,
  dt: number,
): RingDissipationTickResult {
  const nBefore = computeRingNorm(chi, geometry);
  const hBefore = computeRingHamiltonian(chi, operator, alphaChi);

  const chiAfterConservative = applyRingShift(chi, shiftCellsPerTick);
  const nAfterConservative = computeRingNorm(chiAfterConservative, geometry);
  const hAfterConservative = computeRingHamiltonian(chiAfterConservative, operator, alphaChi);

  const chiAfterDissipation = applyDissipationStep(chiAfterConservative, nuChi, dt);
  const nAfterDissipation = computeRingNorm(chiAfterDissipation, geometry);
  const hAfterDissipation = computeRingHamiltonian(chiAfterDissipation, operator, alphaChi);

  const dissipationLossN = nAfterConservative - nAfterDissipation;
  const dissipationLossH = hAfterConservative - hAfterDissipation;
  const numericalDriftH = hAfterConservative - hBefore;
  const residualN = nAfterConservative - nBefore;
  const residualH = hAfterDissipation - hBefore + dissipationLossH - numericalDriftH;

  return {
    chi: chiAfterDissipation,
    ledger: {
      nBefore,
      nAfterConservative,
      nAfterDissipation,
      hBefore,
      hAfterConservative,
      hAfterDissipation,
      dissipationLossN,
      dissipationLossH,
      numericalDriftH,
      residualN,
      residualH,
    },
  };
}
