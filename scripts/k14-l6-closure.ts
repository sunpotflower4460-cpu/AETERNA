/**
 * k14-l6-closure.ts
 *
 * Not physics - the frozen-scale execution script for
 * docs/vessel/K14-L6-preregistration.md. Runs the K13-world version of the
 * L6 self-sustaining-closure protocol (worldSelfSustainingClosure.ts)
 * across 10 seeds, N=64, driveTicks=1000/postDriveTicks=2000, and writes
 * one JSON summary file per seed to --out.
 *
 * Usage: tsx scripts/k14-l6-closure.ts --out <directory>
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import {
  runWorldSelfSustainingClosureProtocol,
  type WorldSelfSustainingClosureConfig,
} from '../src/pure/emergence/worldSelfSustainingClosure.ts';
import type { PureCoreParams } from '../src/pure/params.ts';

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
const driveTicks = 1000;
const postDriveTicks = 2000;
const relativeDeviation = 0.3;
const structureThreshold = 2;
const seeds = Array.from({ length: 10 }, (_, i) => i + 1);

function fieldParams(seed: number): PureCoreParams {
  return { R: 3, r: 1, N, dt, alpha, g, nu0, kappa, rho, seed };
}

interface L6Result {
  seed: number;
  dissipationTimeTicks: number;
  survivalTicksPastDriveOff: number;
  censored: boolean;
  satisfiesL6: boolean;
  maxIndicator: number;
  finalIndicator: number;
  elapsedMs: number;
}

function runSeed(seed: number): L6Result {
  const config: WorldSelfSustainingClosureConfig = {
    psiConfig: { params: fieldParams(seed), linearSolverKind: 'spectral' },
    chiConfig: { params: fieldParams(seed + 1000), linearSolverKind: 'spectral' },
    k,
    lambda,
    driveAmplitude,
    driveOmega: omega,
    driveTicks,
    postDriveTicks,
    relativeDeviation,
    structureThreshold,
  };
  const start = Date.now();
  const result = runWorldSelfSustainingClosureProtocol(config);
  const elapsedMs = Date.now() - start;
  const maxIndicator = result.indicatorHistory.reduce((a, b) => Math.max(a, b), 0);
  const finalIndicator = result.indicatorHistory[result.indicatorHistory.length - 1];
  return {
    seed,
    dissipationTimeTicks: result.dissipationTimeTicks,
    survivalTicksPastDriveOff: result.survivalTicksPastDriveOff,
    censored: result.censored,
    satisfiesL6: result.satisfiesL6,
    maxIndicator,
    finalIndicator,
    elapsedMs,
  };
}

function parseOutDir(): string {
  const idx = process.argv.indexOf('--out');
  if (idx < 0 || !process.argv[idx + 1]) {
    throw new Error('usage: tsx scripts/k14-l6-closure.ts --out <directory>');
  }
  return process.argv[idx + 1];
}

function main(): void {
  const outDir = parseOutDir();
  mkdirSync(outDir, { recursive: true });

  for (const seed of seeds) {
    const path = `${outDir}/seed${seed}.json`;
    if (existsSync(path)) {
      console.log(`skip seed=${seed} (already done)`);
      continue;
    }
    const result = runSeed(seed);
    writeFileSync(path, JSON.stringify(result, null, 2));
    console.log(
      `seed=${seed}: satisfiesL6=${result.satisfiesL6} censored=${result.censored} survival=${result.survivalTicksPastDriveOff}/${postDriveTicks} dissipationTimeTicks=${result.dissipationTimeTicks.toFixed(1)} (${result.elapsedMs}ms)`
    );
  }

  console.log('DONE');
}

main();
