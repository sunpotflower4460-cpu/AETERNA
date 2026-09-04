/**
 * PUT-IN: psi's tick-start state and its usual PR5 tick inputs
 *   (conservativeStepper, geometry, alpha, g, nu, drive, t, dt), chi's
 *   tick-start state and its own tick inputs (ring operator/geometry,
 *   alphaChi, shiftCellsPerTick, nuChi), and an ExchangeCouplingConfig
 * EMERGED: psi and chi after a full K5 tick (each side's own PR5/ring
 *   tick, then the exchange coupling applied to both outputs), plus a
 *   FourBookLedgerEntry recording N_psi/H_psi (via runDriveTick's own
 *   ledger) and N_chi/H_chi (via runRingDissipationTick's own ledger),
 *   plus the measured exchangeWork on each side
 * claim-tier: C3 for exchangeWork_N (see src/tests/pure/exchangeLedger.test.ts:
 *   exchangeWorkN_psi = -exchangeWorkN_chi holds EXACTLY, an algebraic
 *   consequence of the coupling's unitarity plus the dA-matching
 *   constraint - both proven in coupling.ts/boundary.ts). C2 for
 *   exchangeWork_H (see floors - it is measured, not proven equal-
 *   and-opposite).
 * floors (誠実な床): exchangeWork_H_psi and exchangeWork_H_chi are NOT
 *   generally equal-and-opposite, unlike exchangeWork_N. This is not a
 *   bug - it is the same kind of finding PR6 already established for
 *   dissipationLoss_H under non-uniform nu(x): H includes GRADIENT
 *   (neighbor-coupling) terms (psi's alpha*<psi,-L*psi> depends on the
 *   boundary cell's NEIGHBORS, not just its own value; chi's own
 *   alpha_chi*<chi,-L_chi*chi> similarly depends on the port cell's ring
 *   neighbors), while N is a purely local, diagonal quantity
 *   (sum of |field|^2*dA with no cross-terms). The Rabi rotation only
 *   touches ONE cell on each side, so it exactly conserves the
 *   UNWEIGHTED |psi_b|^2+|chi_p|^2 (a purely local/diagonal identity),
 *   but that says nothing about the surrounding gradient energy, which
 *   is where the rest of H_psi and H_chi live. src/tests/pure/
 *   exchangeLedger.test.ts measures and records the actual relationship
 *   rather than asserting one.
 */

import type { ComplexField } from '../geometry/torus.ts';
import type { TorusGeometry } from '../geometry/torus.ts';
import type { ConservativeStepper } from '../field/stepConservative.ts';
import type { DriveSpec } from '../drive/drive.ts';
import { runDriveTick, type DriveTickLedgerEntry } from '../ledger/energy.ts';
import type { ExchangeRingGeometry } from './ringGeometry.ts';
import type { RingLaplacianOperator } from './ringLaplacian.ts';
import { runRingDissipationTick, type RingLedgerEntry } from './ringLedger.ts';
import { computeRingHamiltonian, computeRingNorm } from './ringInvariants.ts';
import { applyExchangeCoupling } from './coupling.ts';
import type { ExchangeCouplingConfig } from './boundary.ts';
import { computeNorm, computeHamiltonian } from '../field/invariants.ts';
import type { MediumHistoryParams } from '../medium/history.ts';
import { applyMediumHistoryStep } from '../medium/history.ts';

export interface FourBookLedgerEntry {
  psiLedger: DriveTickLedgerEntry;
  chiLedger: RingLedgerEntry;
  nBeforeExchangePsi: number;
  nAfterExchangePsi: number;
  hBeforeExchangePsi: number;
  hAfterExchangePsi: number;
  nBeforeExchangeChi: number;
  nAfterExchangeChi: number;
  hBeforeExchangeChi: number;
  hAfterExchangeChi: number;
  exchangeWorkNPsi: number;
  exchangeWorkHPsi: number;
  exchangeWorkNChi: number;
  exchangeWorkHChi: number;
}

export interface ClosedLoopTickResult {
  psi: ComplexField;
  chi: ComplexField;
  ledger: FourBookLedgerEntry;
}

export function runClosedLoopTick(
  psi: ComplexField,
  conservativeStepper: ConservativeStepper,
  psiGeometry: TorusGeometry,
  alpha: number,
  g: number,
  nu: Float64Array,
  drive: DriveSpec,
  t: number,
  dt: number,
  chi: ComplexField,
  chiOperator: RingLaplacianOperator,
  chiGeometry: ExchangeRingGeometry,
  alphaChi: number,
  shiftCellsPerTick: number,
  nuChi: Float64Array,
  couplingConfig: ExchangeCouplingConfig,
): ClosedLoopTickResult {
  const { psi: psiAfterOwnTick, ledger: psiLedger } = runDriveTick(psi, conservativeStepper, psiGeometry, alpha, g, nu, drive, t, dt);
  const { chi: chiAfterOwnTick, ledger: chiLedger } = runRingDissipationTick(chi, chiOperator, chiGeometry, alphaChi, shiftCellsPerTick, nuChi, dt);

  const psiOperator = conservativeStepper.operator;
  const nBeforeExchangePsi = computeNorm(psiAfterOwnTick, psiGeometry);
  const hBeforeExchangePsi = computeHamiltonian(psiAfterOwnTick, psiOperator, psiGeometry, alpha, g);
  const nBeforeExchangeChi = computeRingNorm(chiAfterOwnTick, chiGeometry);
  const hBeforeExchangeChi = computeRingHamiltonian(chiAfterOwnTick, chiOperator, alphaChi);

  const { psi: psiAfterExchange, chi: chiAfterExchange } = applyExchangeCoupling(psiAfterOwnTick, chiAfterOwnTick, couplingConfig, dt);

  const nAfterExchangePsi = computeNorm(psiAfterExchange, psiGeometry);
  const hAfterExchangePsi = computeHamiltonian(psiAfterExchange, psiOperator, psiGeometry, alpha, g);
  const nAfterExchangeChi = computeRingNorm(chiAfterExchange, chiGeometry);
  const hAfterExchangeChi = computeRingHamiltonian(chiAfterExchange, chiOperator, alphaChi);

  return {
    psi: psiAfterExchange,
    chi: chiAfterExchange,
    ledger: {
      psiLedger,
      chiLedger,
      nBeforeExchangePsi,
      nAfterExchangePsi,
      hBeforeExchangePsi,
      hAfterExchangePsi,
      nBeforeExchangeChi,
      nAfterExchangeChi,
      hBeforeExchangeChi,
      hAfterExchangeChi,
      exchangeWorkNPsi: nAfterExchangePsi - nBeforeExchangePsi,
      exchangeWorkHPsi: hAfterExchangePsi - hBeforeExchangePsi,
      exchangeWorkNChi: nAfterExchangeChi - nBeforeExchangeChi,
      exchangeWorkHChi: hAfterExchangeChi - hBeforeExchangeChi,
    },
  };
}

/**
 * PUT-IN (K5-PR4 addition): everything runClosedLoopTick takes, plus
 *   MediumHistoryParams for psi's own nu(x) (chi's nu_chi stays a
 *   constant this PR, per docs/vessel/K5-exchange-medium-adr.md's
 *   "answered elsewhere" list)
 * EMERGED: the full tick per PURE_CORE_SOLVER_STEP_ORDER through
 *   mediumHistory (conservative -> dissipation -> drive -> exchange ->
 *   mediumHistory; observe is still separate, PR7-style) - psi, chi,
 *   psi's updated nu(x), and the FourBookLedgerEntry
 * claim-tier: C2 (implemented; wires already-proven pieces together in
 *   the ADR's decided order - see src/tests/pure/exchangeCutoffControl.test.ts
 *   and roundTripDelay.test.ts for the properties this composition must
 *   have)
 * floors (誠実な床): medium history responds to psi's POST-exchange
 *   field (the tick's final psi), matching PR6's own "nu responds to
 *   the tick's final energy" design and choice 4 of the ADR.
 */
export interface FullClosedLoopTickResult {
  psi: ComplexField;
  nu: Float64Array;
  chi: ComplexField;
  ledger: FourBookLedgerEntry;
}

export function runFullClosedLoopTick(
  psi: ComplexField,
  conservativeStepper: ConservativeStepper,
  psiGeometry: TorusGeometry,
  alpha: number,
  g: number,
  nu: Float64Array,
  drive: DriveSpec,
  t: number,
  dt: number,
  chi: ComplexField,
  chiOperator: RingLaplacianOperator,
  chiGeometry: ExchangeRingGeometry,
  alphaChi: number,
  shiftCellsPerTick: number,
  nuChi: Float64Array,
  couplingConfig: ExchangeCouplingConfig,
  mediumParams: MediumHistoryParams,
): FullClosedLoopTickResult {
  const { psi: psiAfterExchange, chi: chiAfterExchange, ledger } = runClosedLoopTick(
    psi, conservativeStepper, psiGeometry, alpha, g, nu, drive, t, dt,
    chi, chiOperator, chiGeometry, alphaChi, shiftCellsPerTick, nuChi, couplingConfig,
  );
  const nuNext = applyMediumHistoryStep(psiAfterExchange, nu, mediumParams, dt);

  return { psi: psiAfterExchange, nu: nuNext, chi: chiAfterExchange, ledger };
}
