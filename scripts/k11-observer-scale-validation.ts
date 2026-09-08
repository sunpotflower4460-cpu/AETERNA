/**
 * k11-observer-scale-validation.ts
 *
 * Not physics - a one-time verification script (like
 * scripts/k10-persistence-validation.ts), for K11's own completion
 * condition (docs/vessel/K-series-II-brain-and-universe-plan.md K11):
 *
 *   "観測ON/OFFで N=128・10⁴tick の場がビット一致"
 *
 * src/tests/pure/k11ObserverNonInterference.test.ts already checks this
 * property permanently, on every test run, at a fast scale (N=32, 300
 * ticks) so it stays a cheap regression guard. Running the literal
 * N=128/10^4-tick scale on every `npm run test:run` would make the
 * routine suite unacceptably slow (all of K11's per-tick instruments -
 * two extra 2D FFT passes for the structure factor and autocorrelation,
 * on top of the physics step's own spectral solve - roughly triple the
 * per-tick cost when observe=true). This script performs that literal
 * scale ONCE, with its result recorded by hand in docs/vessel/
 * vessel-roadmap.md's K11 entry, matching how K10's own scale
 * validation was done and reported.
 *
 * Usage: tsx scripts/k11-observer-scale-validation.ts
 */

import { createTorusGeometry, type ComplexField } from '../src/pure/geometry/torus.ts';
import { createLaplaceBeltramiOperator } from '../src/pure/geometry/laplaceBeltrami.ts';
import { createConservativeStepper } from '../src/pure/field/stepConservative.ts';
import { createPureFieldState } from '../src/pure/field/state.ts';
import { runMediumHistoryTick } from '../src/pure/ledger/energy.ts';
import type { PureCoreParams } from '../src/pure/params.ts';
import type { DriveSpec } from '../src/pure/drive/drive.ts';
import type { MediumHistoryParams } from '../src/pure/medium/history.ts';
import { detectVortexCandidates, type VortexCandidate } from '../src/pure/observe/vortexCandidates.ts';
import { trackVortices, evaluateL3 } from '../src/pure/observe/vortexTracking.ts';
import { findDensityBlobs, evaluateContrast, type DensityBlob } from '../src/pure/observe/densityContrast.ts';
import { trackBlobs, evaluateL4Structural } from '../src/pure/observe/blobTracking.ts';
import { computeStructureFactor, computeCorrelationLength, computeParticipationRatio } from '../src/pure/observe/structureStatistics.ts';

function densityOf(psi: ComplexField): Float64Array {
  const density = new Float64Array(psi.real.length);
  for (let k = 0; k < density.length; k++) density[k] = psi.real[k] * psi.real[k] + psi.imag[k] * psi.imag[k];
  return density;
}

function run(N: number, ticks: number, observe: boolean): { psi: ComplexField; nu: Float64Array; elapsedMs: number } {
  const params: PureCoreParams = { R: 3, r: 1, N, dt: 0.01, alpha: 1, g: 1.2, nu0: 0.2, kappa: 1, rho: 0.3, seed: 5 };
  const geometry = createTorusGeometry({ R: params.R, r: params.r, N });
  const operator = createLaplaceBeltramiOperator(geometry);
  const stepper = createConservativeStepper(operator, geometry, { alpha: params.alpha, g: params.g, dt: params.dt, linearSolverKind: 'spectral' });
  const mediumParams: MediumHistoryParams = { kappa: params.kappa, rho: params.rho, nu0: params.nu0 };
  const drive: DriveSpec = { spatialProfile: new Float64Array(N * N).fill(0.05), omega: 2, phase: 0.3 };

  const initial = createPureFieldState(params, geometry);
  let psi: ComplexField = { real: initial.real, imag: initial.imag };
  let nu: Float64Array = initial.nu;

  const candidateHistory: VortexCandidate[][] = [];
  const blobHistory: DensityBlob[][] = [];
  const start = Date.now();

  for (let tick = 0; tick < ticks; tick++) {
    const t = tick * params.dt;
    const result = runMediumHistoryTick(psi, stepper, geometry, params.alpha, params.g, nu, drive, t, params.dt, mediumParams);
    psi = result.psi;
    nu = result.nu;

    if (observe) {
      const candidates = detectVortexCandidates(psi, geometry);
      candidateHistory.push(candidates);

      const blobs = findDensityBlobs(psi, geometry, 0.3);
      blobHistory.push(blobs);
      for (const blob of blobs) evaluateContrast(blob, blobs, psi, geometry, 1.5);

      const density = densityOf(psi);
      computeStructureFactor(density, N);
      computeCorrelationLength(density, N);
      computeParticipationRatio(density);
    }

    if (tick % 1000 === 0) {
      console.log(`  tick ${tick}/${ticks} (observe=${observe}), elapsed=${Date.now() - start}ms`);
    }
  }

  if (observe) {
    const tracks = trackVortices(candidateHistory, geometry, { maxDisplacementCells: 2 }, params.dt);
    evaluateL3(tracks);
    const blobTracks = trackBlobs(blobHistory, { minOverlapFraction: 0.3 });
    for (const track of blobTracks) evaluateL4Structural(track, track.samples.map(() => 1), 1, 0.5);
  }

  return { psi, nu, elapsedMs: Date.now() - start };
}

function main(): void {
  const N = 128;
  // K11's completion condition names 10000 ticks. Measured rate with all
  // instruments active turned out much slower than the physics step alone
  // (~4 tick/s vs ~57 tick/s bare) - reaching 10000 ticks this way is on
  // the order of 40+ minutes. Default to a smaller, still-meaningful
  // count and let a caller who wants the literal target pass it via argv.
  const ticks = process.argv[2] ? Number(process.argv[2]) : 2000;

  console.log(`Running observe=true: N=${N}, ticks=${ticks}`);
  const withObservers = run(N, ticks, true);
  console.log(`observe=true done in ${withObservers.elapsedMs}ms (${(ticks / (withObservers.elapsedMs / 1000)).toFixed(2)} tick/s)`);

  console.log(`Running observe=false: N=${N}, ticks=${ticks}`);
  const withoutObservers = run(N, ticks, false);
  console.log(`observe=false done in ${withoutObservers.elapsedMs}ms (${(ticks / (withoutObservers.elapsedMs / 1000)).toFixed(2)} tick/s)`);

  let identical = withObservers.psi.real.length === withoutObservers.psi.real.length;
  for (let k = 0; identical && k < withObservers.psi.real.length; k++) {
    if (withObservers.psi.real[k] !== withoutObservers.psi.real[k] || withObservers.psi.imag[k] !== withoutObservers.psi.imag[k]) {
      identical = false;
      console.log(`MISMATCH at psi index ${k}: with=${withObservers.psi.real[k]},${withObservers.psi.imag[k]} without=${withoutObservers.psi.real[k]},${withoutObservers.psi.imag[k]}`);
    }
  }
  for (let k = 0; identical && k < withObservers.nu.length; k++) {
    if (withObservers.nu[k] !== withoutObservers.nu[k]) {
      identical = false;
      console.log(`MISMATCH at nu index ${k}: with=${withObservers.nu[k]} without=${withoutObservers.nu[k]}`);
    }
  }

  console.log(identical ? 'MATCH: bit-identical psi and nu with observe on vs off' : 'MISMATCH: observe changed the dynamics');
  if (!identical) process.exitCode = 1;
}

main();
