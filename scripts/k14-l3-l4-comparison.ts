/**
 * k14-l3-l4-comparison.ts
 *
 * Not physics - the frozen-scale execution script for
 * docs/vessel/K14-L3-L4-preregistration.md. Runs three conditions
 * (open system, closed system/K13 world, delay-line control) across 20
 * seeds each, N=64, 2000 ticks, and writes one JSON result file per
 * (condition, seed) to --out.
 *
 * Usage: tsx scripts/k14-l3-l4-comparison.ts --out <directory>
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createWorldField, createWorldInitialState } from '../src/pure/world/worldField.ts';
import { selectDistributedBoundary } from '../src/pure/world/distributedBoundary.ts';
import { runWorldTick } from '../src/pure/world/worldTick.ts';
import { createDelayLineBuffer, runWorldTickWithDelayLine, type DelayLineBuffer } from '../src/pure/world/delayLineControl.ts';
import { runMediumHistoryTick } from '../src/pure/ledger/energy.ts';
import { computeNorm } from '../src/pure/field/invariants.ts';
import { deriveTauMin } from '../src/pure/emergence/deriveTauMin.ts';
import { detectVortexCandidates, vortexPersistenceAtLeast, type VortexCandidate } from '../src/pure/observe/vortexCandidates.ts';
import { trackVortices, evaluateL3 } from '../src/pure/observe/vortexTracking.ts';
import type { PureCoreParams } from '../src/pure/params.ts';
import type { DriveSpec } from '../src/pure/drive/drive.ts';
import type { MediumHistoryParams } from '../src/pure/medium/history.ts';
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
const totalTicks = 2000;
const seeds = Array.from({ length: 20 }, (_, i) => i + 1);
const maxDisplacementCells = 2;
const tauMinTicks = Math.round(deriveTauMin(omega, nu0) / dt);
const delayLineConfig = { delayTicks: 9, dampingFactor: 0.27032493764178933 }; // measured in K13, N=8 - see the pre-registration's stated simplification

function fieldParams(seed: number): PureCoreParams {
  return { R: 3, r: 1, N, dt, alpha, g, nu0, kappa, rho, seed };
}

interface ConditionResult {
  condition: string;
  seed: number;
  finalNPsi: number;
  maxPersistenceTicks: number;
  l3Satisfied: boolean;
  elapsedMs: number;
}

function judgeL3(candidateHistory: VortexCandidate[][], geometry: ReturnType<typeof createWorldField>['geometry']): { maxPersistenceTicks: number; l3Satisfied: boolean } {
  const persistenceCheck = vortexPersistenceAtLeast(tauMinTicks)(candidateHistory);
  const tracks = trackVortices(candidateHistory, geometry, { maxDisplacementCells }, dt);
  const l3Judgments = evaluateL3(tracks);
  return { maxPersistenceTicks: persistenceCheck.maxPersistenceTicks, l3Satisfied: l3Judgments.some((j) => j.satisfiesL3) };
}

function runOpenCondition(seed: number): ConditionResult {
  const psiWorld = createWorldField({ params: fieldParams(seed), linearSolverKind: 'spectral' });
  const drive: DriveSpec = { spatialProfile: new Float64Array(N * N).fill(driveAmplitude), omega, phase: 0.1 };
  const mediumParams: MediumHistoryParams = { kappa, rho, nu0 };

  const initial = createWorldInitialState(psiWorld);
  let psi: ComplexField = { real: initial.real, imag: initial.imag };
  let psiNu = initial.nu;

  const candidateHistory: VortexCandidate[][] = [];
  const start = Date.now();
  for (let tick = 0; tick < totalTicks; tick++) {
    const t = tick * dt;
    const result = runMediumHistoryTick(psi, psiWorld.stepper, psiWorld.geometry, alpha, g, psiNu, drive, t, dt, mediumParams);
    psi = result.psi;
    psiNu = result.nu;
    candidateHistory.push(detectVortexCandidates(psi, psiWorld.geometry));
  }
  const elapsedMs = Date.now() - start;
  const finalNPsi = computeNorm(psi, psiWorld.geometry);
  return { condition: 'open', seed, finalNPsi, elapsedMs, ...judgeL3(candidateHistory, psiWorld.geometry) };
}

function runClosedCondition(seed: number): ConditionResult {
  const psiWorld = createWorldField({ params: fieldParams(seed), linearSolverKind: 'spectral' });
  const chiWorld = createWorldField({ params: fieldParams(seed + 1000), linearSolverKind: 'spectral' });
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
  const finalNPsi = computeNorm(psi, psiWorld.geometry);
  return { condition: 'closed', seed, finalNPsi, elapsedMs, ...judgeL3(candidateHistory, psiWorld.geometry) };
}

function runDelayLineCondition(seed: number): ConditionResult {
  const psiWorld = createWorldField({ params: fieldParams(seed), linearSolverKind: 'spectral' });
  const chiWorldForPairing = createWorldField({ params: fieldParams(seed + 1000), linearSolverKind: 'spectral' });
  const pairs = selectDistributedBoundary(psiWorld.geometry, chiWorldForPairing.geometry, k);

  const psiInitial = createWorldInitialState(psiWorld);
  let psi: ComplexField = { real: psiInitial.real, imag: psiInitial.imag };
  let psiNu = psiInitial.nu;
  let buffers: DelayLineBuffer[] = pairs.map(() => createDelayLineBuffer(delayLineConfig));

  const candidateHistory: VortexCandidate[][] = [];
  const start = Date.now();
  for (let tick = 0; tick < totalTicks; tick++) {
    const result = runWorldTickWithDelayLine(psi, psiNu, psiWorld, buffers, pairs, lambda, dt);
    psi = result.psi;
    psiNu = result.psiNu;
    buffers = result.buffers;
    candidateHistory.push(detectVortexCandidates(psi, psiWorld.geometry));
  }
  const elapsedMs = Date.now() - start;
  const finalNPsi = computeNorm(psi, psiWorld.geometry);
  return { condition: 'delayline', seed, finalNPsi, elapsedMs, ...judgeL3(candidateHistory, psiWorld.geometry) };
}

function parseOutDir(): string {
  const idx = process.argv.indexOf('--out');
  if (idx < 0 || !process.argv[idx + 1]) {
    throw new Error('usage: tsx scripts/k14-l3-l4-comparison.ts --out <directory>');
  }
  return process.argv[idx + 1];
}

function main(): void {
  const outDir = parseOutDir();
  mkdirSync(outDir, { recursive: true });
  console.log(`tau_min = ${tauMinTicks} ticks`);

  const runners: Array<{ name: string; fn: (seed: number) => ConditionResult }> = [
    { name: 'open', fn: runOpenCondition },
    { name: 'closed', fn: runClosedCondition },
    { name: 'delayline', fn: runDelayLineCondition },
  ];

  for (const { name, fn } of runners) {
    for (const seed of seeds) {
      const path = `${outDir}/${name}-seed${seed}.json`;
      if (existsSync(path)) {
        console.log(`skip ${name} seed=${seed} (already done)`);
        continue;
      }
      const result = fn(seed);
      writeFileSync(path, JSON.stringify(result, null, 2));
      console.log(`${name} seed=${seed}: finalNPsi=${result.finalNPsi.toFixed(6)} maxPersist=${result.maxPersistenceTicks} l3=${result.l3Satisfied} (${result.elapsedMs}ms)`);
    }
  }

  console.log('DONE');
}

main();
