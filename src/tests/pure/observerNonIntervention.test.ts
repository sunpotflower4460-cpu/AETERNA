import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { runPureExperiment, type PureExperimentConfig } from '../../pure/run/runPureExperiment.ts';
import type { PureCoreParams } from '../../pure/params.ts';
import type { DriveSpec } from '../../pure/drive/drive.ts';

const PURE_ROOT = resolve(__dirname, '../../pure');
const DYNAMICS_DIRS = ['field', 'ledger', 'drive', 'medium', 'geometry'];

function listTsFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...listTsFiles(full));
    } else if (full.endsWith('.ts')) {
      files.push(full);
    }
  }
  return files;
}

function baseParams(seed: number): PureCoreParams {
  return { R: 3, r: 1, N: 6, dt: 0.01, alpha: 1, g: 1.2, nu0: 0.3, kappa: 1.5, rho: 0.4, seed };
}

function baseDrive(size: number): DriveSpec {
  return { spatialProfile: Float64Array.from({ length: size }, () => 0.05), omega: 3, phase: 0.4 };
}

describe('pure core observer non-intervention: structural guarantee (docs/pure-physics-implementation-plan.md PR7 merge gate)', () => {
  it('none of the dynamics-affecting modules (field, ledger, drive, medium, geometry) import from observe/ or run/ (one-way dependency: observation reads dynamics, dynamics never reads observation)', () => {
    for (const dir of DYNAMICS_DIRS) {
      const files = listTsFiles(join(PURE_ROOT, dir));
      for (const filePath of files) {
        const code = readFileSync(filePath, 'utf8');
        const importLines = code.match(/^import .*from ['"].*['"];?$/gm) ?? [];
        for (const line of importLines) {
          expect(line, `${filePath} imports from an observe/run path`).not.toMatch(/from ['"].*\/(observe|run)\//);
        }
      }
    }
  });
});

describe('pure core observer non-intervention: runtime proof (docs/pure-physics-implementation-plan.md PR7 merge gate: 「観測ON/OFFで場の状態がビット単位で一致」)', () => {
  it('runPureExperiment with observe=true and observe=false produce bit-identical finalPsi, finalNu, and ledgerHistory', () => {
    const params = baseParams(11);
    const N = params.N;
    const drive = baseDrive(N * N);
    const ticks = 25;

    const configOn: PureExperimentConfig = { params, drive, ticks, observe: true };
    const configOff: PureExperimentConfig = { params, drive, ticks, observe: false };

    const resultOn = runPureExperiment(configOn);
    const resultOff = runPureExperiment(configOff);

    expect(resultOn.finalPsi.real).toEqual(resultOff.finalPsi.real);
    expect(resultOn.finalPsi.imag).toEqual(resultOff.finalPsi.imag);
    expect(resultOn.finalNu).toEqual(resultOff.finalNu);
    expect(resultOn.ledgerHistory).toEqual(resultOff.ledgerHistory);

    // observe=false must produce no observation history at all - not just "unused."
    expect(resultOff.observationHistory).toHaveLength(0);
    expect(resultOn.observationHistory).toHaveLength(ticks);
  });

  it('holds across multiple (alpha, g, kappa, rho, drive) configurations, not just one', () => {
    const configs: Array<{ params: PureCoreParams; drive: DriveSpec }> = [
      { params: { ...baseParams(1), alpha: 0.5, g: 0 }, drive: baseDrive(36) },
      { params: { ...baseParams(2), kappa: 5, rho: 0.1 }, drive: { spatialProfile: new Float64Array(36), omega: 0, phase: 0 } },
      { params: { ...baseParams(3), nu0: 0 }, drive: baseDrive(36) },
    ];

    for (const { params, drive } of configs) {
      const resultOn = runPureExperiment({ params, drive, ticks: 15, observe: true });
      const resultOff = runPureExperiment({ params, drive, ticks: 15, observe: false });

      expect(resultOn.finalPsi.real).toEqual(resultOff.finalPsi.real);
      expect(resultOn.finalPsi.imag).toEqual(resultOff.finalPsi.imag);
      expect(resultOn.finalNu).toEqual(resultOff.finalNu);
      expect(resultOn.ledgerHistory).toEqual(resultOff.ledgerHistory);
    }
  });
});
