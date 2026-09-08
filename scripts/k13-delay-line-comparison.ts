/**
 * k13-delay-line-comparison.ts
 *
 * Not physics - the frozen-scale execution script for
 * docs/vessel/K13-delay-line-preregistration.md. Runs both conditions
 * (Real chi vs the delay-line control) across 5 seeds and writes one
 * JSON result file per (condition, seed) to --out.
 *
 * Usage: tsx scripts/k13-delay-line-comparison.ts --out <directory>
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createWorldField, createWorldInitialState } from '../src/pure/world/worldField.ts';
import { selectDistributedBoundary } from '../src/pure/world/distributedBoundary.ts';
import { runWorldTick } from '../src/pure/world/worldTick.ts';
import { measureRoundTripDelay } from '../src/pure/world/measureRoundTripDelay.ts';
import { createDelayLineBuffer, runWorldTickWithDelayLine, type DelayLineBuffer } from '../src/pure/world/delayLineControl.ts';
import { computeNorm } from '../src/pure/field/invariants.ts';
import { detectVortexCandidates, vortexPersistenceAtLeast, type VortexCandidate } from '../src/pure/observe/vortexCandidates.ts';
import { checkLocalization } from '../src/pure/observe/localization.ts';
import { trackVortices, evaluateL3 } from '../src/pure/observe/vortexTracking.ts';
import type { PureCoreParams } from '../src/pure/params.ts';
import type { DriveSpec } from '../src/pure/drive/drive.ts';
import type { ComplexField } from '../src/pure/geometry/torus.ts';

const N = 8;
const alpha = 1;
const g = 4;
const nu0 = 0.15;
const kappa = 1;
const rho = 0.3;
const dt = 0.01;
const k = 4;
const lambda = 20;
const totalTicks = 2000;
const seeds = [1, 2, 3, 4, 5];
const tauMin = 500;
const maxLocalizedFraction = 0.3;
const maxDisplacementCells = 2;

function fieldParams(seed: number): PureCoreParams {
  return { R: 3, r: 1, N, dt, alpha, g, nu0, kappa, rho, seed };
}

interface ConditionResult {
  finalNPsi: number;
  l2Satisfied: boolean;
  maxPersistenceTicks: number;
  l3Satisfied: boolean;
}

function judge(candidateHistory: VortexCandidate[][], geometry: ReturnType<typeof createWorldField>['geometry']): { l2Satisfied: boolean; maxPersistenceTicks: number; l3Satisfied: boolean } {
  const windingDetectedAnyTick = candidateHistory.some((tick) => tick.length > 0);
  const finalCandidates = candidateHistory.length > 0 ? candidateHistory[candidateHistory.length - 1] : [];
  const finalLocalization = checkLocalization(finalCandidates, geometry, maxLocalizedFraction);
  const persistenceCheck = vortexPersistenceAtLeast(tauMin)(candidateHistory);
  const l2Satisfied = windingDetectedAnyTick && finalLocalization.localized && persistenceCheck.satisfied;

  const tracks = trackVortices(candidateHistory, geometry, { maxDisplacementCells }, dt);
  const l3Judgments = evaluateL3(tracks);
  const l3Satisfied = l3Judgments.some((j) => j.satisfiesL3);

  return { l2Satisfied, maxPersistenceTicks: persistenceCheck.maxPersistenceTicks, l3Satisfied };
}

function runRealCondition(seed: number): ConditionResult {
  const psiWorld = createWorldField({ params: fieldParams(seed) });
  const chiWorld = createWorldField({ params: fieldParams(seed + 1000) }); // chi's own independent seed
  const pairs = selectDistributedBoundary(psiWorld.geometry, chiWorld.geometry, k);
  const drive: DriveSpec = { spatialProfile: new Float64Array(N * N).fill(0.3), omega: 3, phase: 0.1 };

  const psiInitial = createWorldInitialState(psiWorld);
  const chiInitial = createWorldInitialState(chiWorld);
  let psi: ComplexField = { real: psiInitial.real, imag: psiInitial.imag };
  let psiNu = psiInitial.nu;
  let chi: ComplexField = { real: chiInitial.real, imag: chiInitial.imag };
  let chiNu = chiInitial.nu;

  const candidateHistory: VortexCandidate[][] = [];
  for (let tick = 0; tick < totalTicks; tick++) {
    const t = tick * dt;
    const result = runWorldTick(psi, psiNu, psiWorld, chi, chiNu, chiWorld, drive, t, dt, pairs, lambda);
    psi = result.psi;
    psiNu = result.psiNu;
    chi = result.chi;
    chiNu = result.chiNu;
    candidateHistory.push(detectVortexCandidates(psi, psiWorld.geometry));
  }

  const finalNPsi = computeNorm(psi, psiWorld.geometry);
  return { finalNPsi, ...judge(candidateHistory, psiWorld.geometry) };
}

function runDelayLineCondition(seed: number, measured: { delayTicks: number; dampingFactor: number }): ConditionResult {
  const psiWorld = createWorldField({ params: fieldParams(seed) });
  const chiWorldForPairing = createWorldField({ params: fieldParams(seed + 1000) }); // only used to select a geometrically consistent boundary
  const pairs = selectDistributedBoundary(psiWorld.geometry, chiWorldForPairing.geometry, k);

  const psiInitial = createWorldInitialState(psiWorld);
  let psi: ComplexField = { real: psiInitial.real, imag: psiInitial.imag };
  let psiNu = psiInitial.nu;
  let buffers: DelayLineBuffer[] = pairs.map(() => createDelayLineBuffer(measured));

  const candidateHistory: VortexCandidate[][] = [];
  for (let tick = 0; tick < totalTicks; tick++) {
    const result = runWorldTickWithDelayLine(psi, psiNu, psiWorld, buffers, pairs, lambda, dt);
    psi = result.psi;
    psiNu = result.psiNu;
    buffers = result.buffers;
    candidateHistory.push(detectVortexCandidates(psi, psiWorld.geometry));
  }

  const finalNPsi = computeNorm(psi, psiWorld.geometry);
  return { finalNPsi, ...judge(candidateHistory, psiWorld.geometry) };
}

function parseOutDir(): string {
  const idx = process.argv.indexOf('--out');
  if (idx < 0 || !process.argv[idx + 1]) {
    throw new Error('usage: tsx scripts/k13-delay-line-comparison.ts --out <directory>');
  }
  return process.argv[idx + 1];
}

function main(): void {
  const outDir = parseOutDir();
  mkdirSync(outDir, { recursive: true });

  // Measure the delay/damping ONCE, from seed 1's chi (per the pre-registration's
  // stated simplification: one representative measurement applied to all k buffers).
  const measurementChiWorld = createWorldField({ params: fieldParams(1 + 1000) });
  const measured = measureRoundTripDelay({
    chiWorld: measurementChiWorld,
    pair: { psiCellIndex: 0, chiCellIndex: 0 },
    lambda,
    dt,
    maxTicks: 500,
    riseThreshold: 0.05,
    pulseAmplitude: 1,
  });
  writeFileSync(`${outDir}/measured-delay-line-config.json`, JSON.stringify(measured, null, 2));
  console.log(`measured delay-line config: delayTicks=${measured.delayTicks} dampingFactor=${measured.dampingFactor}`);

  for (const seed of seeds) {
    const realPath = `${outDir}/real-seed${seed}.json`;
    if (!existsSync(realPath)) {
      const start = Date.now();
      const result = runRealCondition(seed);
      writeFileSync(realPath, JSON.stringify({ condition: 'real', seed, ...result }, null, 2));
      console.log(`real seed=${seed}: finalNPsi=${result.finalNPsi.toFixed(6)} l2=${result.l2Satisfied} l3=${result.l3Satisfied} maxPersist=${result.maxPersistenceTicks} (${Date.now() - start}ms)`);
    } else {
      console.log(`skip real seed=${seed} (already done)`);
    }

    const delayLinePath = `${outDir}/delayline-seed${seed}.json`;
    if (!existsSync(delayLinePath)) {
      const start = Date.now();
      const result = runDelayLineCondition(seed, measured);
      writeFileSync(delayLinePath, JSON.stringify({ condition: 'delayline', seed, ...result }, null, 2));
      console.log(`delayline seed=${seed}: finalNPsi=${result.finalNPsi.toFixed(6)} l2=${result.l2Satisfied} l3=${result.l3Satisfied} maxPersist=${result.maxPersistenceTicks} (${Date.now() - start}ms)`);
    } else {
      console.log(`skip delayline seed=${seed} (already done)`);
    }
  }

  console.log('DONE');
}

main();
