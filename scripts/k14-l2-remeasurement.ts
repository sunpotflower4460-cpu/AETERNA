/**
 * k14-l2-remeasurement.ts
 *
 * Not physics - the frozen-scale execution script for
 * docs/vessel/K14-L2-preregistration.md. Runs the full K9-K13 apparatus
 * (real 2D world chi, distributed boundary) at N in {64,128,256}, 10
 * seeds each, and writes one JSON result file per (N, seed) to --out.
 *
 * Usage: tsx scripts/k14-l2-remeasurement.ts --out <directory>
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createWorldField, createWorldInitialState } from '../src/pure/world/worldField.ts';
import { selectDistributedBoundary } from '../src/pure/world/distributedBoundary.ts';
import { runWorldTick } from '../src/pure/world/worldTick.ts';
import { deriveTauMin } from '../src/pure/emergence/deriveTauMin.ts';
import { detectVortexCandidates, vortexPersistenceAtLeast, type VortexCandidate } from '../src/pure/observe/vortexCandidates.ts';
import { checkLocalization } from '../src/pure/observe/localization.ts';
import type { PureCoreParams } from '../src/pure/params.ts';
import type { DriveSpec } from '../src/pure/drive/drive.ts';
import type { ComplexField } from '../src/pure/geometry/torus.ts';

const alpha = 1;
const g = 4;
const nu0 = 0.15;
const kappa = 1;
const rho = 0.3;
const dt = 0.01;
const k = 4;
const lambda = 20;
const omega = 3;
const driveAmplitude = 0.3;
const totalTicks = 2000;
const seeds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const maxLocalizedFraction = 0.3;
const tauMinTicks = Math.round(deriveTauMin(omega, nu0) / dt);

function fieldParams(N: number, seed: number): PureCoreParams {
  return { R: 3, r: 1, N, dt, alpha, g, nu0, kappa, rho, seed };
}

interface L2Result {
  N: number;
  seed: number;
  l2Satisfied: boolean;
  maxPersistenceTicks: number;
  finalCandidateCount: number;
  elapsedMs: number;
}

function runCondition(N: number, seed: number): L2Result {
  const psiWorld = createWorldField({ params: fieldParams(N, seed), linearSolverKind: 'spectral' });
  const chiWorld = createWorldField({ params: fieldParams(N, seed + 1000), linearSolverKind: 'spectral' });
  const pairs = selectDistributedBoundary(psiWorld.geometry, chiWorld.geometry, k);
  const drive: DriveSpec = { spatialProfile: new Float64Array(N * N).fill(driveAmplitude), omega, phase: 0.1 };

  const psiInitial = createWorldInitialState(psiWorld);
  const chiInitial = createWorldInitialState(chiWorld);
  let psi: ComplexField = { real: psiInitial.real, imag: psiInitial.imag };
  let psiNu = psiInitial.nu;
  let chi: ComplexField = { real: chiInitial.real, imag: chiInitial.imag };
  let chiNu = chiInitial.nu;

  const candidateHistory: VortexCandidate[][] = [];
  const start = Date.now();
  for (let tick = 0; tick < totalTicks; tick++) {
    const t = tick * dt;
    const result = runWorldTick(psi, psiNu, psiWorld, chi, chiNu, chiWorld, drive, t, dt, pairs, lambda);
    psi = result.psi;
    psiNu = result.psiNu;
    chi = result.chi;
    chiNu = result.chiNu;
    candidateHistory.push(detectVortexCandidates(psi, psiWorld.geometry));
  }
  const elapsedMs = Date.now() - start;

  const windingDetectedAnyTick = candidateHistory.some((tick) => tick.length > 0);
  const finalCandidates = candidateHistory[candidateHistory.length - 1];
  const localization = checkLocalization(finalCandidates, psiWorld.geometry, maxLocalizedFraction);
  const persistenceCheck = vortexPersistenceAtLeast(tauMinTicks)(candidateHistory);
  const l2Satisfied = windingDetectedAnyTick && localization.localized && persistenceCheck.satisfied;

  return { N, seed, l2Satisfied, maxPersistenceTicks: persistenceCheck.maxPersistenceTicks, finalCandidateCount: finalCandidates.length, elapsedMs };
}

function parseOutDir(): string {
  const idx = process.argv.indexOf('--out');
  if (idx < 0 || !process.argv[idx + 1]) {
    throw new Error('usage: tsx scripts/k14-l2-remeasurement.ts --out <directory>');
  }
  return process.argv[idx + 1];
}

function main(): void {
  const outDir = parseOutDir();
  mkdirSync(outDir, { recursive: true });
  console.log(`tau_min = ${tauMinTicks} ticks (derived, not back-calculated)`);

  for (const N of [64, 128, 256]) {
    for (const seed of seeds) {
      const path = `${outDir}/N${N}-seed${seed}.json`;
      if (existsSync(path)) {
        console.log(`skip N=${N} seed=${seed} (already done)`);
        continue;
      }
      const result = runCondition(N, seed);
      writeFileSync(path, JSON.stringify(result, null, 2));
      console.log(`N=${N} seed=${seed}: l2=${result.l2Satisfied} maxPersist=${result.maxPersistenceTicks} finalCandidates=${result.finalCandidateCount} (${result.elapsedMs}ms)`);
    }
  }

  console.log('DONE');
}

main();
