import { describe, expect, it } from 'vitest';
import { createTorusGeometry, type ComplexField } from '../../pure/geometry/torus.ts';
import { createLaplaceBeltramiOperator } from '../../pure/geometry/laplaceBeltrami.ts';
import { createConservativeStepper } from '../../pure/field/stepConservative.ts';
import { createPureFieldState } from '../../pure/field/state.ts';
import { runMediumHistoryTick } from '../../pure/ledger/energy.ts';
import type { PureCoreParams } from '../../pure/params.ts';
import type { DriveSpec } from '../../pure/drive/drive.ts';
import type { MediumHistoryParams } from '../../pure/medium/history.ts';
import { detectVortexCandidates, type VortexCandidate } from '../../pure/observe/vortexCandidates.ts';
import { trackVortices, evaluateL3 } from '../../pure/observe/vortexTracking.ts';
import { findDensityBlobs, evaluateContrast, type DensityBlob } from '../../pure/observe/densityContrast.ts';
import { trackBlobs, evaluateL4Structural } from '../../pure/observe/blobTracking.ts';
import { computeStructureFactor, computeCorrelationLength, computeParticipationRatio } from '../../pure/observe/structureStatistics.ts';

function densityOf(psi: ComplexField): Float64Array {
  const density = new Float64Array(psi.real.length);
  for (let k = 0; k < density.length; k++) density[k] = psi.real[k] * psi.real[k] + psi.imag[k] * psi.imag[k];
  return density;
}

interface RunOutcome {
  finalPsi: ComplexField;
  finalNu: Float64Array;
}

function runWithK11Observers(N: number, ticks: number, observe: boolean): RunOutcome {
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
      for (const blob of blobs) {
        evaluateContrast(blob, blobs, psi, geometry, 1.5);
      }

      const density = densityOf(psi);
      computeStructureFactor(density, N);
      computeCorrelationLength(density, N);
      computeParticipationRatio(density);
    }
  }

  if (observe) {
    // Post-hoc passes over the accumulated histories - exercised here to prove even THESE never
    // touch psi/nu (they run entirely after the tick loop above has already finished).
    const tracks = trackVortices(candidateHistory, geometry, { maxDisplacementCells: 2 }, params.dt);
    evaluateL3(tracks);
    const blobTracks = trackBlobs(blobHistory, { minOverlapFraction: 0.3 });
    for (const track of blobTracks) {
      evaluateL4Structural(track, track.samples.map(() => 1), 1, 0.5);
    }
  }

  return { finalPsi: psi, finalNu: nu };
}

describe('pure core K11 (PR5 freeze gate): observing with ALL K11 instruments active changes nothing about the dynamics', () => {
  it(
    'observe=true and observe=false produce bit-identical final psi and nu (N=32, 300 ticks)',
    () => {
      const N = 32;
      const ticks = 300;
      const withObservers = runWithK11Observers(N, ticks, true);
      const withoutObservers = runWithK11Observers(N, ticks, false);

      expect(withObservers.finalPsi.real).toEqual(withoutObservers.finalPsi.real);
      expect(withObservers.finalPsi.imag).toEqual(withoutObservers.finalPsi.imag);
      expect(withObservers.finalNu).toEqual(withoutObservers.finalNu);
    },
    60000,
  );
});
