/**
 * PUT-IN: chi's own WorldField (built with whatever physics parameters
 *   the actual comparison experiment will use - NOT isolated to zero,
 *   unlike K5's own round-trip measurement, because K13's delay-line
 *   control is meant to characterize how a pulse interacts with THIS
 *   chi's real dispersive/nonlinear dynamics, not a trivial one), a
 *   single boundary pair, lambda, dt, a tick budget, and a rise
 *   threshold (the pre-registered "first significant echo" criterion -
 *   see docs/vessel/K13-world-constitution-adr.md Choice 5's
 *   correction)
 * EMERGED: a MeasuredDelayLineConfig (delayTicks, dampingFactor) built
 *   from what was actually observed - never invented
 * claim-tier: C2 (implemented per the ADR's corrected Choice 5). Unlike
 *   K5's own round-trip delay (an EXACT integer, provable from the
 *   ring's shift mechanism alone - roundTripDelay.test.ts checks it
 *   against a closed-form prediction), a general dispersive/nonlinear
 *   2D chi has no closed-form delay to check this measurement against -
 *   see src/tests/pure/measureRoundTripDelay.test.ts for what IS
 *   checked instead (structural properties: throws when no echo clears
 *   the threshold in budget, determinism, a sane [0,maxTicks] range,
 *   and that the "runningMinimum-relative rise" logic does not fire on
 *   the trivial near-1.0 reading the very first tick produces before
 *   any real decay has happened - the false positive an earlier version
 *   of this function actually returned, caught by manual inspection of
 *   a diagnostic run before this test was written).
 * floors (誠実な床): psi is held isolated (alpha=g=0, nu=0, no drive -
 *   a single injected pulse and otherwise passive) during this
 *   measurement ONLY, so the echo read is not confounded by psi's own
 *   concurrent evolution - this measurement characterizes the channel
 *   (chi + coupling), not a full two-sided run. The "first tick whose
 *   response rises at least riseThreshold*pulseAmplitude above the
 *   running minimum seen so far" is inherently a THRESHOLD-DEPENDENT
 *   operational definition for a dispersive chi that may not return a
 *   single sharp pulse - see the ADR's own floor on this. If no tick
 *   clears the threshold within maxTicks, this throws rather than
 *   silently returning a default - a chi whose response is this weak or
 *   slow does not have a well-defined delay-line analog to measure
 *   automatically.
 */

import type { ComplexField } from '../geometry/torus.ts';
import type { WorldField } from './worldField.ts';
import type { DistributedBoundaryPair } from './distributedBoundary.ts';
import { applyExchangeCoupling } from '../exchange/coupling.ts';
import type { ExchangeCouplingConfig } from '../exchange/boundary.ts';
import { runMediumHistoryTick } from '../ledger/energy.ts';
import type { DriveSpec } from '../drive/drive.ts';
import type { DelayLineConfig } from './delayLineControl.ts';

export interface MeasureRoundTripDelayConfig {
  chiWorld: WorldField;
  pair: DistributedBoundaryPair;
  lambda: number;
  dt: number;
  maxTicks: number;
  /** The pre-registered "first significant echo" threshold - a fraction of the injected pulse's own magnitude. Fixed before measuring, per the ADR's floor. */
  riseThreshold: number;
  /** Injected pulse amplitude at psi's boundary cell, t=0. */
  pulseAmplitude: number;
}

export function measureRoundTripDelay(config: MeasureRoundTripDelayConfig): DelayLineConfig {
  const { chiWorld, pair, lambda, dt, maxTicks, riseThreshold, pulseAmplitude } = config;

  // An isolated, inert psi - alpha=g=0 (so its OWN conservative step is
  // exactly the identity transform, not merely a no-op we choose to skip
  // calling) and no dissipation, so it has no internal dynamics of its own
  // at all; only the coupling below ever moves it. Represented as a single
  // cell rather than a full torus, since this measurement only ever
  // touches one cell of psi.
  const psiBoundaryIndex = 0; // arbitrary - this psi never touches distributedBoundary's real pairing, only the single measurement pair below
  const measurementPair: DistributedBoundaryPair = { psiCellIndex: psiBoundaryIndex, chiCellIndex: pair.chiCellIndex };

  let psi: ComplexField = { real: new Float64Array(1), imag: new Float64Array(1) };
  psi.real[psiBoundaryIndex] = pulseAmplitude;

  // Chi runs its REAL intended physics (dispersion, nonlinearity, dissipation,
  // medium history) - only psi is held inert, per this module's own floor.
  let chi: ComplexField = { real: new Float64Array(chiWorld.geometry.N * chiWorld.geometry.N), imag: new Float64Array(chiWorld.geometry.N * chiWorld.geometry.N) };
  let chiNu: Float64Array = new Float64Array(chiWorld.geometry.N * chiWorld.geometry.N).fill(chiWorld.params.nu0);
  const zeroDrive: DriveSpec = { spatialProfile: new Float64Array(chiWorld.geometry.N * chiWorld.geometry.N), omega: 0, phase: 0 };

  const riseMagnitude = riseThreshold * pulseAmplitude;
  // Psi's boundary magnitude starts at pulseAmplitude and DECAYS purely
  // from the coupling rotating amplitude away to chi's (initially zero)
  // port cell - that decay is not an echo. Only a rise of at least
  // riseMagnitude ABOVE THE RUNNING MINIMUM seen so far counts as an
  // echo, so a same-tick "it's still close to pulseAmplitude because the
  // rotation barely moved anything yet" reading cannot be mistaken for one.
  let runningMinimum = pulseAmplitude;

  for (let tick = 0; tick < maxTicks; tick++) {
    const t = tick * dt;

    // Chi advances its own physics one tick.
    const chiResult = runMediumHistoryTick(chi, chiWorld.stepper, chiWorld.geometry, chiWorld.params.alpha, chiWorld.params.g, chiNu, zeroDrive, t, dt, chiWorld.mediumParams);
    chi = chiResult.psi;
    chiNu = chiResult.nu;

    // The single measurement pair couples isolated-psi's one cell to chi's port cell.
    const couplingConfig: ExchangeCouplingConfig = { lambda, boundaryCellIndex: measurementPair.psiCellIndex, portCellIndex: measurementPair.chiCellIndex };
    const coupled = applyExchangeCoupling(psi, chi, couplingConfig, dt);
    psi = coupled.psi;
    chi = coupled.chi;

    const magnitudeAtPsiBoundary = Math.hypot(psi.real[psiBoundaryIndex], psi.imag[psiBoundaryIndex]);
    if (magnitudeAtPsiBoundary >= runningMinimum + riseMagnitude) {
      const dampingFactor = magnitudeAtPsiBoundary / pulseAmplitude;
      return { delayTicks: tick + 1, dampingFactor: Math.min(dampingFactor, 1) };
    }
    runningMinimum = Math.min(runningMinimum, magnitudeAtPsiBoundary);
  }

  throw new Error(
    `measureRoundTripDelay: no echo exceeding riseThreshold (${riseThreshold}) was observed within maxTicks (${maxTicks}) - this chi does not have a well-defined delay-line analog at this threshold/budget`,
  );
}
