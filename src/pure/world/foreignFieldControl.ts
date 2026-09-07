/**
 * PUT-IN: the main psi's state/WorldField, chi-prime's state/WorldField
 *   (chi-prime plays chi's structural role - it is what couples to the
 *   main psi - but its OWN drive comes from psi-prime's field values,
 *   not from an oscillating J(x,t)), psi-prime's state/WorldField and
 *   its own DriveSpec (an independent, driven, structured field - NOT
 *   the main psi, a different seed entirely), an injectionStrength
 *   scalar, a distributed boundary + lambda coupling chi-prime to the
 *   MAIN psi, dt
 * EMERGED: the K14 "state-dependent but not self-caused" control tick
 *   (docs/vessel/K-series-II-brain-and-universe-plan.md K14's "K6の
 *   対照群"): the main psi couples to chi-prime via the EXACT SAME
 *   distributed Rabi-rotation mechanism K13's real chi uses, but what
 *   chi-prime carries has NOTHING causally to do with the main psi's
 *   own history - it is psi-prime's independent activity, relayed
 *   through chi-prime
 * claim-tier: C2 (implemented; composes already-proven pieces - see
 *   src/tests/pure/foreignFieldControl.test.ts for the properties this
 *   composition must have: the main psi's evolution never reads
 *   psi-prime or chi-prime except through the coupling, cutoff control
 *   at lambda=0, and injectionStrength=0 reduces chi-prime to an
 *   undriven field)
 * floors (誠実な床): isolates K6's original rotation-vs-addition
 *   confound from self-vs-foreign origin by holding the coupling FORM
 *   fixed (always the Rabi rotation - coupling.ts, unmodified) while
 *   varying only what chi-prime's own activity is caused by. It does
 *   NOT by itself prove psi can or cannot behaviorally distinguish
 *   self from foreign origin - that is what running this alongside
 *   K13's real (self-embedded) world and delay-line control, per
 *   docs/vessel/K14-*-preregistration.md, is for.
 */

import type { ComplexField } from '../geometry/torus.ts';
import { runDissipationTick, runMediumHistoryTick } from '../ledger/energy.ts';
import { applyDriveStep } from '../field/stepDrive.ts';
import { applyMediumHistoryStep } from '../medium/history.ts';
import type { DriveSpec } from '../drive/drive.ts';
import type { WorldField } from './worldField.ts';
import { applyDistributedExchangeCoupling, type DistributedBoundaryPair } from './distributedBoundary.ts';

export interface ForeignFieldControlResult {
  psi: ComplexField;
  psiNu: Float64Array;
  chiPrime: ComplexField;
  chiPrimeNu: Float64Array;
  psiPrime: ComplexField;
  psiPrimeNu: Float64Array;
}

function scaleField(field: ComplexField, strength: number): ComplexField {
  const size = field.real.length;
  const real = new Float64Array(size);
  const imag = new Float64Array(size);
  for (let i = 0; i < size; i++) {
    real[i] = field.real[i] * strength;
    imag[i] = field.imag[i] * strength;
  }
  return { real, imag };
}

export function runForeignFieldControlTick(
  psi: ComplexField,
  psiNu: Float64Array,
  psiWorld: WorldField,
  chiPrime: ComplexField,
  chiPrimeNu: Float64Array,
  chiPrimeWorld: WorldField,
  psiPrime: ComplexField,
  psiPrimeNu: Float64Array,
  psiPrimeWorld: WorldField,
  foreignDrive: DriveSpec,
  injectionStrength: number,
  t: number,
  dt: number,
  pairs: readonly DistributedBoundaryPair[],
  lambda: number,
): ForeignFieldControlResult {
  // Main psi: own physics only, no drive - the K13 constitution, unchanged here.
  const { psi: psiAfterOwnTick } = runDissipationTick(psi, psiWorld.stepper, psiWorld.geometry, psiWorld.params.alpha, psiWorld.params.g, psiNu, dt);

  // Foreign psi-prime: a fully independent driven field (its own seed, its own drive) - has no access to the main psi's state at all, structurally (this function never reads `psi` when computing psi-prime's update).
  const psiPrimeResult = runMediumHistoryTick(psiPrime, psiPrimeWorld.stepper, psiPrimeWorld.geometry, psiPrimeWorld.params.alpha, psiPrimeWorld.params.g, psiPrimeNu, foreignDrive, t, dt, psiPrimeWorld.mediumParams);

  // Chi-prime: own conservative+dissipation, then driven by psi-prime's field values (NOT an oscillating J) - it carries psi-prime's activity, not the main psi's.
  const { psi: chiPrimeAfterOwnTick } = runDissipationTick(chiPrime, chiPrimeWorld.stepper, chiPrimeWorld.geometry, chiPrimeWorld.params.alpha, chiPrimeWorld.params.g, chiPrimeNu, dt);
  const injectedField = scaleField(psiPrime, injectionStrength); // psi-prime's PRE-tick value, matching J's own "does not depend on this tick's own evolving state" convention
  const chiPrimeAfterDrive = applyDriveStep(chiPrimeAfterOwnTick, injectedField, dt);

  // Chi-prime couples to the MAIN psi via the identical distributed Rabi rotation K13's real chi uses.
  const { psi: psiAfterExchange, chi: chiPrimeAfterExchange } = applyDistributedExchangeCoupling(psiAfterOwnTick, chiPrimeAfterDrive, pairs, lambda, dt);

  const psiNuNext = applyMediumHistoryStep(psiAfterExchange, psiNu, psiWorld.mediumParams, dt);
  const chiPrimeNuNext = applyMediumHistoryStep(chiPrimeAfterExchange, chiPrimeNu, chiPrimeWorld.mediumParams, dt);

  return {
    psi: psiAfterExchange,
    psiNu: psiNuNext,
    chiPrime: chiPrimeAfterExchange,
    chiPrimeNu: chiPrimeNuNext,
    psiPrime: psiPrimeResult.psi,
    psiPrimeNu: psiPrimeResult.nu,
  };
}
