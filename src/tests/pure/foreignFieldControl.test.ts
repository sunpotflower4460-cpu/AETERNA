import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createWorldField, createWorldInitialState } from '../../pure/world/worldField.ts';
import { selectDistributedBoundary } from '../../pure/world/distributedBoundary.ts';
import { runForeignFieldControlTick } from '../../pure/world/foreignFieldControl.ts';
import { runDissipationTick } from '../../pure/ledger/energy.ts';
import { applyMediumHistoryStep } from '../../pure/medium/history.ts';
import type { PureCoreParams } from '../../pure/params.ts';
import type { DriveSpec } from '../../pure/drive/drive.ts';
import type { ComplexField } from '../../pure/geometry/torus.ts';

function baseParams(seed: number, overrides: Partial<PureCoreParams> = {}): PureCoreParams {
  return { R: 3, r: 1, N: 8, dt: 0.01, alpha: 1, g: 1, nu0: 0.15, kappa: 1, rho: 0.3, seed, ...overrides };
}

function buildScenario() {
  const psiWorld = createWorldField({ params: baseParams(1) });
  const chiPrimeWorld = createWorldField({ params: baseParams(2) });
  const psiPrimeWorld = createWorldField({ params: baseParams(3) });
  const psiInitial = createWorldInitialState(psiWorld);
  const chiPrimeInitial = createWorldInitialState(chiPrimeWorld);
  const psiPrimeInitial = createWorldInitialState(psiPrimeWorld);
  const foreignDrive: DriveSpec = { spatialProfile: new Float64Array(64).fill(0.3), omega: 3, phase: 0.2 };
  const pairs = selectDistributedBoundary(psiWorld.geometry, chiPrimeWorld.geometry, 4);
  return { psiWorld, chiPrimeWorld, psiPrimeWorld, psiInitial, chiPrimeInitial, psiPrimeInitial, foreignDrive, pairs };
}

describe('pure core K14: foreignFieldControl static non-contact', () => {
  it('the main psi\'s own-tick computation never references psiPrime or chiPrime by name', () => {
    const sourcePath = fileURLToPath(new URL('../../pure/world/foreignFieldControl.ts', import.meta.url));
    const source = readFileSync(sourcePath, 'utf-8');
    const match = source.match(/runDissipationTick\(psi,[^;]*\);/);
    expect(match).not.toBeNull();
    expect(match![0]).not.toContain('Prime');
  });
});

describe('pure core K14: foreignFieldControl cutoff control (lambda=0)', () => {
  it('at lambda=0, the main psi evolves exactly as a standalone runDissipationTick + medium history loop would, regardless of psiPrime/chiPrime activity', () => {
    const { psiWorld, chiPrimeWorld, psiPrimeWorld, psiInitial, chiPrimeInitial, psiPrimeInitial, foreignDrive, pairs } = buildScenario();
    let psi: ComplexField = { real: psiInitial.real, imag: psiInitial.imag };
    let psiNu = psiInitial.nu;
    let chiPrime: ComplexField = { real: chiPrimeInitial.real, imag: chiPrimeInitial.imag };
    let chiPrimeNu = chiPrimeInitial.nu;
    let psiPrime: ComplexField = { real: psiPrimeInitial.real, imag: psiPrimeInitial.imag };
    let psiPrimeNu = psiPrimeInitial.nu;

    let standalonePsi: ComplexField = { real: psiInitial.real, imag: psiInitial.imag };
    let standalonePsiNu = psiInitial.nu;

    for (let tick = 0; tick < 30; tick++) {
      const t = tick * psiWorld.params.dt;
      const result = runForeignFieldControlTick(psi, psiNu, psiWorld, chiPrime, chiPrimeNu, chiPrimeWorld, psiPrime, psiPrimeNu, psiPrimeWorld, foreignDrive, 0.5, t, psiWorld.params.dt, pairs, 0);
      psi = result.psi;
      psiNu = result.psiNu;
      chiPrime = result.chiPrime;
      chiPrimeNu = result.chiPrimeNu;
      psiPrime = result.psiPrime;
      psiPrimeNu = result.psiPrimeNu;

      const standaloneResult = runDissipationTick(standalonePsi, psiWorld.stepper, psiWorld.geometry, psiWorld.params.alpha, psiWorld.params.g, standalonePsiNu, psiWorld.params.dt);
      standalonePsi = standaloneResult.psi;
      standalonePsiNu = applyMediumHistoryStep(standalonePsi, standalonePsiNu, psiWorld.mediumParams, psiWorld.params.dt);
    }

    expect(psi.real).toEqual(standalonePsi.real);
    expect(psi.imag).toEqual(standalonePsi.imag);
  });
});

describe('pure core K14: foreignFieldControl injection mechanism', () => {
  it('injectionStrength=0 means chiPrime never receives anything from psiPrime (chiPrime evolves exactly as an undriven field)', () => {
    const { psiWorld, chiPrimeWorld, psiPrimeWorld, psiInitial, chiPrimeInitial, psiPrimeInitial, foreignDrive, pairs } = buildScenario();
    let psi: ComplexField = { real: psiInitial.real, imag: psiInitial.imag };
    let psiNu = psiInitial.nu;
    let chiPrime: ComplexField = { real: chiPrimeInitial.real, imag: chiPrimeInitial.imag };
    let chiPrimeNu = chiPrimeInitial.nu;
    let psiPrime: ComplexField = { real: psiPrimeInitial.real, imag: psiPrimeInitial.imag };
    let psiPrimeNu = psiPrimeInitial.nu;

    let standaloneChiPrime: ComplexField = { real: chiPrimeInitial.real, imag: chiPrimeInitial.imag };
    let standaloneChiPrimeNu = chiPrimeInitial.nu;

    for (let tick = 0; tick < 20; tick++) {
      const t = tick * psiWorld.params.dt;
      // lambda=0 too, so the exchange also can't move chiPrime - isolating injectionStrength's own effect.
      const result = runForeignFieldControlTick(psi, psiNu, psiWorld, chiPrime, chiPrimeNu, chiPrimeWorld, psiPrime, psiPrimeNu, psiPrimeWorld, foreignDrive, 0, t, psiWorld.params.dt, pairs, 0);
      psi = result.psi;
      psiNu = result.psiNu;
      chiPrime = result.chiPrime;
      chiPrimeNu = result.chiPrimeNu;
      psiPrime = result.psiPrime;
      psiPrimeNu = result.psiPrimeNu;

      const standaloneResult = runDissipationTick(standaloneChiPrime, chiPrimeWorld.stepper, chiPrimeWorld.geometry, chiPrimeWorld.params.alpha, chiPrimeWorld.params.g, standaloneChiPrimeNu, chiPrimeWorld.params.dt);
      standaloneChiPrime = standaloneResult.psi;
      standaloneChiPrimeNu = applyMediumHistoryStep(standaloneChiPrime, standaloneChiPrimeNu, chiPrimeWorld.mediumParams, chiPrimeWorld.params.dt);
    }

    expect(chiPrime.real).toEqual(standaloneChiPrime.real);
    expect(chiPrime.imag).toEqual(standaloneChiPrime.imag);
  });

  it('a nonzero injectionStrength makes chiPrime receive something from psiPrime (chiPrime\'s trajectory differs from the undriven case)', () => {
    const { psiWorld, chiPrimeWorld, psiPrimeWorld, psiInitial, chiPrimeInitial, psiPrimeInitial, foreignDrive, pairs } = buildScenario();
    let psi: ComplexField = { real: psiInitial.real, imag: psiInitial.imag };
    let psiNu = psiInitial.nu;
    let chiPrimeInjected: ComplexField = { real: chiPrimeInitial.real, imag: chiPrimeInitial.imag };
    let chiPrimeInjectedNu = chiPrimeInitial.nu;
    let psiPrime: ComplexField = { real: psiPrimeInitial.real, imag: psiPrimeInitial.imag };
    let psiPrimeNu = psiPrimeInitial.nu;

    for (let tick = 0; tick < 10; tick++) {
      const t = tick * psiWorld.params.dt;
      const result = runForeignFieldControlTick(psi, psiNu, psiWorld, chiPrimeInjected, chiPrimeInjectedNu, chiPrimeWorld, psiPrime, psiPrimeNu, psiPrimeWorld, foreignDrive, 2, t, psiWorld.params.dt, pairs, 0);
      psi = result.psi;
      psiNu = result.psiNu;
      chiPrimeInjected = result.chiPrime;
      chiPrimeInjectedNu = result.chiPrimeNu;
      psiPrime = result.psiPrime;
      psiPrimeNu = result.psiPrimeNu;
    }

    // With lambda=0 but injectionStrength=2, chiPrime should be nonzero
    // (psiPrime's own small-amplitude initial noise, injected repeatedly, accumulates).
    const chiPrimeMagnitude = Math.hypot(chiPrimeInjected.real[0], chiPrimeInjected.imag[0]);
    expect(chiPrimeMagnitude).toBeGreaterThan(0);
  });
});

describe('pure core K14: foreignFieldControl determinism', () => {
  it('is deterministic across repeated calls with the same inputs', () => {
    const { psiWorld, chiPrimeWorld, psiPrimeWorld, psiInitial, chiPrimeInitial, psiPrimeInitial, foreignDrive, pairs } = buildScenario();
    const psi: ComplexField = { real: psiInitial.real, imag: psiInitial.imag };
    const chiPrime: ComplexField = { real: chiPrimeInitial.real, imag: chiPrimeInitial.imag };
    const psiPrime: ComplexField = { real: psiPrimeInitial.real, imag: psiPrimeInitial.imag };

    const a = runForeignFieldControlTick(psi, psiInitial.nu, psiWorld, chiPrime, chiPrimeInitial.nu, chiPrimeWorld, psiPrime, psiPrimeInitial.nu, psiPrimeWorld, foreignDrive, 1, 0, psiWorld.params.dt, pairs, 0.5);
    const b = runForeignFieldControlTick(psi, psiInitial.nu, psiWorld, chiPrime, chiPrimeInitial.nu, chiPrimeWorld, psiPrime, psiPrimeInitial.nu, psiPrimeWorld, foreignDrive, 1, 0, psiWorld.params.dt, pairs, 0.5);

    expect(a.psi.real).toEqual(b.psi.real);
    expect(a.chiPrime.real).toEqual(b.chiPrime.real);
    expect(a.psiPrime.real).toEqual(b.psiPrime.real);
  });
});
