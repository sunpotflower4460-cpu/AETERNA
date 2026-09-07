/**
 * k14-k6-control-comparison.ts
 *
 * Not physics - the frozen-scale execution script for
 * docs/vessel/K14-K6-control-preregistration.md. Runs ONLY the "foreign"
 * condition (chi-prime driven by an independent psi-prime, coupled to the
 * main psi via the exact same distributed Rabi rotation K13's real chi
 * uses) across 20 seeds, N=64, 2000 ticks. The "self" condition is NOT
 * re-run here - it is docs/vessel/K14-L3-L4-preregistration.md's own
 * "closed" condition results, reused as-is per that pre-registration's
 * explicit non-duplication statement.
 *
 * Usage: tsx scripts/k14-k6-control-comparison.ts --out <directory>
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createWorldField, createWorldInitialState } from '../src/pure/world/worldField.ts';
import { selectDistributedBoundary } from '../src/pure/world/distributedBoundary.ts';
import { runForeignFieldControlTick } from '../src/pure/world/foreignFieldControl.ts';
import { computeNorm } from '../src/pure/field/invariants.ts';
import { deriveTauMin } from '../src/pure/emergence/deriveTauMin.ts';
import { detectVortexCandidates, vortexPersistenceAtLeast, type VortexCandidate } from '../src/pure/observe/vortexCandidates.ts';
import type { PureCoreParams } from '../src/pure/params.ts';
import type { DriveSpec } from '../src/pure/drive/drive.ts';
import type { ComplexField } from '../src/pure/geometry/torus.ts';

const N = 64;
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
const injectionStrength = 1.0;
const totalTicks = 2000;
const seeds = Array.from({ length: 20 }, (_, i) => i + 1);
const tauMinTicks = Math.round(deriveTauMin(omega, nu0) / dt);

function fieldParams(seed: number): PureCoreParams {
  return { R: 3, r: 1, N, dt, alpha, g, nu0, kappa, rho, seed };
}

interface ForeignResult {
  condition: 'foreign';
  seed: number;
  finalNPsi: number;
  maxPersistenceTicks: number;
  elapsedMs: number;
}

function runForeignCondition(seed: number): ForeignResult {
  const psiWorld = createWorldField({ params: fieldParams(seed), linearSolverKind: 'spectral' });
  const chiPrimeWorld = createWorldField({ params: fieldParams(seed + 1000), linearSolverKind: 'spectral' });
  const psiPrimeWorld = createWorldField({ params: fieldParams(seed + 3000), linearSolverKind: 'spectral' });
  const pairs = selectDistributedBoundary(psiWorld.geometry, chiPrimeWorld.geometry, k);
  const foreignDrive: DriveSpec = { spatialProfile: new Float64Array(N * N).fill(driveAmplitude), omega, phase: 0.1 };

  const psiInitial = createWorldInitialState(psiWorld);
  const chiPrimeInitial = createWorldInitialState(chiPrimeWorld);
  const psiPrimeInitial = createWorldInitialState(psiPrimeWorld);
  let psi: ComplexField = { real: psiInitial.real, imag: psiInitial.imag };
  let psiNu = psiInitial.nu;
  let chiPrime: ComplexField = { real: chiPrimeInitial.real, imag: chiPrimeInitial.imag };
  let chiPrimeNu = chiPrimeInitial.nu;
  let psiPrime: ComplexField = { real: psiPrimeInitial.real, imag: psiPrimeInitial.imag };
  let psiPrimeNu = psiPrimeInitial.nu;

  const candidateHistory: VortexCandidate[][] = [];
  const start = Date.now();
  for (let tick = 0; tick < totalTicks; tick++) {
    const t = tick * dt;
    const result = runForeignFieldControlTick(
      psi, psiNu, psiWorld,
      chiPrime, chiPrimeNu, chiPrimeWorld,
      psiPrime, psiPrimeNu, psiPrimeWorld,
      foreignDrive, injectionStrength, t, dt, pairs, lambda
    );
    psi = result.psi;
    psiNu = result.psiNu;
    chiPrime = result.chiPrime;
    chiPrimeNu = result.chiPrimeNu;
    psiPrime = result.psiPrime;
    psiPrimeNu = result.psiPrimeNu;
    candidateHistory.push(detectVortexCandidates(psi, psiWorld.geometry));
  }
  const elapsedMs = Date.now() - start;
  const finalNPsi = computeNorm(psi, psiWorld.geometry);
  const persistenceCheck = vortexPersistenceAtLeast(tauMinTicks)(candidateHistory);

  return { condition: 'foreign', seed, finalNPsi, maxPersistenceTicks: persistenceCheck.maxPersistenceTicks, elapsedMs };
}

function parseOutDir(): string {
  const idx = process.argv.indexOf('--out');
  if (idx < 0 || !process.argv[idx + 1]) {
    throw new Error('usage: tsx scripts/k14-k6-control-comparison.ts --out <directory>');
  }
  return process.argv[idx + 1];
}

function main(): void {
  const outDir = parseOutDir();
  mkdirSync(outDir, { recursive: true });
  console.log(`tau_min = ${tauMinTicks} ticks`);

  for (const seed of seeds) {
    const path = `${outDir}/foreign-seed${seed}.json`;
    if (existsSync(path)) {
      console.log(`skip seed=${seed} (already done)`);
      continue;
    }
    const result = runForeignCondition(seed);
    writeFileSync(path, JSON.stringify(result, null, 2));
    console.log(`foreign seed=${seed}: finalNPsi=${result.finalNPsi.toFixed(6)} maxPersist=${result.maxPersistenceTicks} (${result.elapsedMs}ms)`);
  }

  console.log('DONE');
}

main();
