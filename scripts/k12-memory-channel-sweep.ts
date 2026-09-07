/**
 * k12-memory-channel-sweep.ts
 *
 * Not physics - the frozen-scale execution script for
 * docs/vessel/K12-memory-channel-preregistration.md. Runs the full
 * 7-config x 10-seed grid for both arm A (existing nu(x)) and arm B
 * (the new g(x) channel), writing one JSON result file per (config,
 * seed) pair to --out. Resumable: re-running with the same --out
 * directory skips any (config, seed) whose result file already exists,
 * so an interrupted run can continue rather than restart from scratch
 * (the same resilience pattern scripts/k10-persistence-validation.ts's
 * driver used for its own long chunked run).
 *
 * Usage: tsx scripts/k12-memory-channel-sweep.ts --out <directory>
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { runTimescaleSweepCondition, runGChannelSweepCondition } from '../src/pure/emergence/memoryChannelSweep.ts';

const N = 64;
const dt = 0.01;
const alpha = 1;
const nu0 = 0.15;
const driveAmplitude = 0.3;
const driveOmega = 3;
const totalTicks = 8000;
const tauMin = 500;
const maxLocalizedFraction = 0.3;
const maxDisplacementCells = 2;
const seeds = Array.from({ length: 10 }, (_, i) => i + 1);

const armAConfigs: Array<{ name: string; kappa: number; rho: number }> = [
  { name: 'A-control', kappa: 0, rho: 0 },
  { name: 'A-1', kappa: 1, rho: 0.3 },
  { name: 'A-2', kappa: 1, rho: 0.03 },
  { name: 'A-3', kappa: 1, rho: 0.003 },
  { name: 'A-4', kappa: 10, rho: 0.3 },
  { name: 'A-5', kappa: 10, rho: 0.03 },
  { name: 'A-6', kappa: 10, rho: 0.003 },
];

const armBConfigs: Array<{ name: string; kappaG: number; rhoG: number }> = [
  { name: 'B-control', kappaG: 0, rhoG: 0 },
  { name: 'B-1', kappaG: 1, rhoG: 0.3 },
  { name: 'B-2', kappaG: 1, rhoG: 0.03 },
  { name: 'B-3', kappaG: 1, rhoG: 0.003 },
  { name: 'B-4', kappaG: 10, rhoG: 0.3 },
  { name: 'B-5', kappaG: 10, rhoG: 0.03 },
  { name: 'B-6', kappaG: 10, rhoG: 0.003 },
];

function parseOutDir(): string {
  const idx = process.argv.indexOf('--out');
  if (idx < 0 || !process.argv[idx + 1]) {
    throw new Error('usage: tsx scripts/k12-memory-channel-sweep.ts --out <directory>');
  }
  return process.argv[idx + 1];
}

function resultPath(outDir: string, name: string, seed: number): string {
  return `${outDir}/${name}-seed${seed}.json`;
}

function main(): void {
  const outDir = parseOutDir();
  mkdirSync(outDir, { recursive: true });

  for (const cfg of armAConfigs) {
    for (const seed of seeds) {
      const path = resultPath(outDir, cfg.name, seed);
      if (existsSync(path)) {
        console.log(`skip ${cfg.name} seed=${seed} (already done)`);
        continue;
      }
      const start = Date.now();
      const result = runTimescaleSweepCondition({
        N, alpha, g: 4, nu0, kappa: cfg.kappa, rho: cfg.rho, dt,
        driveAmplitude, driveOmega, totalTicks, tauMin, maxLocalizedFraction, maxDisplacementCells, seed,
        linearSolverKind: 'spectral',
      });
      writeFileSync(path, JSON.stringify({ arm: 'A', config: cfg.name, seed, ...result }, null, 2));
      console.log(`${cfg.name} seed=${seed}: l2=${result.l2Satisfied} l3=${result.l3Satisfied} maxPersist=${result.maxPersistenceTicks} (${Date.now() - start}ms)`);
    }
  }

  for (const cfg of armBConfigs) {
    for (const seed of seeds) {
      const path = resultPath(outDir, cfg.name, seed);
      if (existsSync(path)) {
        console.log(`skip ${cfg.name} seed=${seed} (already done)`);
        continue;
      }
      const start = Date.now();
      const result = runGChannelSweepCondition({
        N, alpha, nu0, dt,
        driveAmplitude, driveOmega, totalTicks, tauMin, maxLocalizedFraction, maxDisplacementCells, seed,
        kappaG: cfg.kappaG, rhoG: cfg.rhoG, g0: 4, g1: 8,
        linearSolverKind: 'spectral',
      });
      writeFileSync(path, JSON.stringify({ arm: 'B', config: cfg.name, seed, ...result }, null, 2));
      console.log(`${cfg.name} seed=${seed}: l2=${result.l2Satisfied} l3=${result.l3Satisfied} maxPersist=${result.maxPersistenceTicks} (${Date.now() - start}ms)`);
    }
  }

  console.log('DONE');
}

main();
