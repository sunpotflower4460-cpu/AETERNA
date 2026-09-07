/**
 * PUT-IN: psi's state (field, nu(x)) and its own WorldField bundle, the
 *   world chi's state (field, nu(x)) and its own WorldField bundle, a
 *   DriveSpec + t (chi's own drive - see floors), a distributed
 *   boundary (src/pure/world/distributedBoundary.ts) and its coupling
 *   strength lambda, dt
 * EMERGED: psi and chi each advanced by one full K13 tick (psi: own
 *   conservative+dissipation, no drive -> distributed exchange -> own
 *   medium history. chi: own conservative+dissipation+drive -> the
 *   SAME distributed exchange -> own medium history), plus a
 *   FourBookLedgerEntry (N_psi, H_psi, N_chi, H_chi, per-pair-summed
 *   exchangeWork) mirroring K5's own exchangeLedger.ts shape
 * claim-tier: C2 (implemented; composes already-proven pieces per
 *   docs/vessel/K13-world-constitution-adr.md Choice 4's decided
 *   order - see src/tests/pure/worldTick.test.ts for the cutoff-
 *   control and non-contact properties this composition must have)
 * floors (誠実な床): **psi NEVER receives the DriveSpec parameter this
 *   function takes - it is threaded ONLY into chi's own runDriveTick
 *   call.** This is the constitutional amendment itself, made
 *   structural rather than a runtime convention: psi's own physics is
 *   computed by runDissipationTick, a function whose signature has no
 *   drive parameter at all - there is no line of code in this
 *   function's psi path that could pass J to psi even by mistake (see
 *   src/tests/pure/worldTick.test.ts's source-scan check, which
 *   confirms this file's psi-handling code never references
 *   evaluateDrive/applyDriveStep/DriveSpec by name, and its dynamic
 *   counterpart, which confirms psi's trajectory is unaffected by the
 *   drive's amplitude when lambda=0).
 */

import type { ComplexField } from '../geometry/torus.ts';
import { computeNorm, computeHamiltonian } from '../field/invariants.ts';
import { runDissipationTick, runDriveTick, type EnergyLedgerEntry, type DriveTickLedgerEntry } from '../ledger/energy.ts';
import { applyMediumHistoryStep } from '../medium/history.ts';
import type { DriveSpec } from '../drive/drive.ts';
import type { WorldField } from './worldField.ts';
import { applyDistributedExchangeCoupling, type DistributedBoundaryPair } from './distributedBoundary.ts';

export interface WorldFourBookLedgerEntry {
  psiLedger: EnergyLedgerEntry;
  chiLedger: DriveTickLedgerEntry;
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

export interface WorldTickResult {
  psi: ComplexField;
  psiNu: Float64Array;
  chi: ComplexField;
  chiNu: Float64Array;
  ledger: WorldFourBookLedgerEntry;
}

export function runWorldTick(
  psi: ComplexField,
  psiNu: Float64Array,
  psiWorld: WorldField,
  chi: ComplexField,
  chiNu: Float64Array,
  chiWorld: WorldField,
  drive: DriveSpec,
  t: number,
  dt: number,
  pairs: readonly DistributedBoundaryPair[],
  lambda: number,
): WorldTickResult {
  // psi: own conservative+dissipation ONLY - runDissipationTick's signature has no drive parameter to pass J through even by mistake.
  const { psi: psiAfterOwnTick, ledger: psiLedger } = runDissipationTick(psi, psiWorld.stepper, psiWorld.geometry, psiWorld.params.alpha, psiWorld.params.g, psiNu, dt);
  // chi (the world): own conservative+dissipation+DRIVE - this is where J enters, per the K13 constitutional amendment.
  const { psi: chiAfterOwnTick, ledger: chiLedger } = runDriveTick(chi, chiWorld.stepper, chiWorld.geometry, chiWorld.params.alpha, chiWorld.params.g, chiNu, drive, t, dt);

  const nBeforeExchangePsi = computeNorm(psiAfterOwnTick, psiWorld.geometry);
  const hBeforeExchangePsi = computeHamiltonian(psiAfterOwnTick, psiWorld.stepper.operator, psiWorld.geometry, psiWorld.params.alpha, psiWorld.params.g);
  const nBeforeExchangeChi = computeNorm(chiAfterOwnTick, chiWorld.geometry);
  const hBeforeExchangeChi = computeHamiltonian(chiAfterOwnTick, chiWorld.stepper.operator, chiWorld.geometry, chiWorld.params.alpha, chiWorld.params.g);

  const { psi: psiAfterExchange, chi: chiAfterExchange } = applyDistributedExchangeCoupling(psiAfterOwnTick, chiAfterOwnTick, pairs, lambda, dt);

  const nAfterExchangePsi = computeNorm(psiAfterExchange, psiWorld.geometry);
  const hAfterExchangePsi = computeHamiltonian(psiAfterExchange, psiWorld.stepper.operator, psiWorld.geometry, psiWorld.params.alpha, psiWorld.params.g);
  const nAfterExchangeChi = computeNorm(chiAfterExchange, chiWorld.geometry);
  const hAfterExchangeChi = computeHamiltonian(chiAfterExchange, chiWorld.stepper.operator, chiWorld.geometry, chiWorld.params.alpha, chiWorld.params.g);

  const psiNuNext = applyMediumHistoryStep(psiAfterExchange, psiNu, psiWorld.mediumParams, dt);
  const chiNuNext = applyMediumHistoryStep(chiAfterExchange, chiNu, chiWorld.mediumParams, dt);

  return {
    psi: psiAfterExchange,
    psiNu: psiNuNext,
    chi: chiAfterExchange,
    chiNu: chiNuNext,
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
