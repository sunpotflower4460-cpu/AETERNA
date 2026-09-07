import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createWorldField, createWorldInitialState, type WorldFieldConfig } from '../../pure/world/worldField.ts';
import { selectDistributedBoundary } from '../../pure/world/distributedBoundary.ts';
import { runWorldTick } from '../../pure/world/worldTick.ts';
import { runDissipationTick, runDriveTick } from '../../pure/ledger/energy.ts';
import { applyMediumHistoryStep } from '../../pure/medium/history.ts';
import type { PureCoreParams } from '../../pure/params.ts';
import type { DriveSpec } from '../../pure/drive/drive.ts';
import type { ComplexField } from '../../pure/geometry/torus.ts';

function baseParams(overrides: Partial<PureCoreParams> = {}): PureCoreParams {
  return { R: 3, r: 1, N: 8, dt: 0.01, alpha: 1, g: 1, nu0: 0.15, kappa: 1, rho: 0.3, seed: 5, ...overrides };
}

function buildScenario() {
  const psiWorld = createWorldField({ params: baseParams({ seed: 1 }) });
  const chiWorld = createWorldField({ params: baseParams({ seed: 2 }) });
  const psiInitial = createWorldInitialState(psiWorld);
  const chiInitial = createWorldInitialState(chiWorld);
  const drive: DriveSpec = { spatialProfile: new Float64Array(64).fill(0.3), omega: 3, phase: 0.1 };
  const pairs = selectDistributedBoundary(psiWorld.geometry, chiWorld.geometry, 4);
  return { psiWorld, chiWorld, psiInitial, chiInitial, drive, pairs };
}

describe('pure core K13: runWorldTick static non-contact (docs/vessel/K13-world-constitution-adr.md floors)', () => {
  it('the runDissipationTick(psi, ...) call in worldTick.ts never references the drive variable', () => {
    const sourcePath = fileURLToPath(new URL('../../pure/world/worldTick.ts', import.meta.url));
    const source = readFileSync(sourcePath, 'utf-8');
    const match = source.match(/runDissipationTick\(psi[^;]*\);/);
    expect(match).not.toBeNull();
    expect(match![0].toLowerCase()).not.toContain('drive');
  });

  it('runDriveTick(chi, ...) IS the only call that receives the drive parameter', () => {
    const sourcePath = fileURLToPath(new URL('../../pure/world/worldTick.ts', import.meta.url));
    const source = readFileSync(sourcePath, 'utf-8');
    const match = source.match(/runDriveTick\(chi[^;]*\);/);
    expect(match).not.toBeNull();
    expect(match![0]).toContain('drive');
  });
});

describe('pure core K13: runWorldTick cutoff control (lambda=0 matches the standalone K9-K12 machinery)', () => {
  it('at lambda=0, psi evolves EXACTLY as it would alone via runDissipationTick (no drive, no exchange contact)', () => {
    const { psiWorld, chiWorld, psiInitial, chiInitial, drive, pairs } = buildScenario();
    let psi: ComplexField = { real: psiInitial.real, imag: psiInitial.imag };
    let psiNu = psiInitial.nu;
    let chi: ComplexField = { real: chiInitial.real, imag: chiInitial.imag };
    let chiNu = chiInitial.nu;

    let standalonePsi: ComplexField = { real: psiInitial.real, imag: psiInitial.imag };
    let standalonePsiNu = psiInitial.nu;

    for (let tick = 0; tick < 50; tick++) {
      const t = tick * psiWorld.params.dt;
      const result = runWorldTick(psi, psiNu, psiWorld, chi, chiNu, chiWorld, drive, t, psiWorld.params.dt, pairs, 0);
      psi = result.psi;
      psiNu = result.psiNu;
      chi = result.chi;
      chiNu = result.chiNu;

      const standaloneResult = runDissipationTick(standalonePsi, psiWorld.stepper, psiWorld.geometry, psiWorld.params.alpha, psiWorld.params.g, standalonePsiNu, psiWorld.params.dt);
      standalonePsi = standaloneResult.psi;
      // runDissipationTick doesn't evolve nu itself (mirrors runWorldTick's own
      // separate applyMediumHistoryStep call, run on the post-exchange field -
      // which equals the post-own-tick field here since lambda=0).
      standalonePsiNu = applyMediumHistoryStep(standalonePsi, standalonePsiNu, psiWorld.mediumParams, psiWorld.params.dt);
    }

    expect(psi.real).toEqual(standalonePsi.real);
    expect(psi.imag).toEqual(standalonePsi.imag);
  });

  it('at lambda=0, chi evolves EXACTLY as K9-K12\'s own directly-driven psi would (reproducing the pre-K13 open system bit-for-bit)', () => {
    const { psiWorld, chiWorld, psiInitial, chiInitial, drive, pairs } = buildScenario();
    let psi: ComplexField = { real: psiInitial.real, imag: psiInitial.imag };
    let psiNu = psiInitial.nu;
    let chi: ComplexField = { real: chiInitial.real, imag: chiInitial.imag };
    let chiNu = chiInitial.nu;

    let standaloneChi: ComplexField = { real: chiInitial.real, imag: chiInitial.imag };
    let standaloneChiNu = chiInitial.nu;

    for (let tick = 0; tick < 50; tick++) {
      const t = tick * chiWorld.params.dt;
      const result = runWorldTick(psi, psiNu, psiWorld, chi, chiNu, chiWorld, drive, t, chiWorld.params.dt, pairs, 0);
      psi = result.psi;
      psiNu = result.psiNu;
      chi = result.chi;
      chiNu = result.chiNu;

      const standaloneResult = runDriveTick(standaloneChi, chiWorld.stepper, chiWorld.geometry, chiWorld.params.alpha, chiWorld.params.g, standaloneChiNu, drive, t, chiWorld.params.dt);
      standaloneChi = standaloneResult.psi;
      // runDriveTick doesn't evolve nu itself either - see the same note above.
      standaloneChiNu = applyMediumHistoryStep(standaloneChi, standaloneChiNu, chiWorld.mediumParams, chiWorld.params.dt);
    }

    expect(chi.real).toEqual(standaloneChi.real);
    expect(chi.imag).toEqual(standaloneChi.imag);
  });
});

describe('pure core K13: runWorldTick dynamic non-contact (psi is unaffected by drive amplitude when lambda=0)', () => {
  it('changing the drive amplitude does not change psi\'s trajectory at all when lambda=0', () => {
    const { psiWorld, chiWorld, psiInitial, chiInitial, pairs } = buildScenario();
    const weakDrive: DriveSpec = { spatialProfile: new Float64Array(64).fill(0.01), omega: 3, phase: 0.1 };
    const strongDrive: DriveSpec = { spatialProfile: new Float64Array(64).fill(5), omega: 3, phase: 0.1 };

    function runPsiOnly(drive: DriveSpec): ComplexField {
      let psi: ComplexField = { real: psiInitial.real, imag: psiInitial.imag };
      let psiNu = psiInitial.nu;
      let chi: ComplexField = { real: chiInitial.real, imag: chiInitial.imag };
      let chiNu = chiInitial.nu;
      for (let tick = 0; tick < 30; tick++) {
        const t = tick * psiWorld.params.dt;
        const result = runWorldTick(psi, psiNu, psiWorld, chi, chiNu, chiWorld, drive, t, psiWorld.params.dt, pairs, 0);
        psi = result.psi;
        psiNu = result.psiNu;
        chi = result.chi;
        chiNu = result.chiNu;
      }
      return psi;
    }

    const psiWithWeakDrive = runPsiOnly(weakDrive);
    const psiWithStrongDrive = runPsiOnly(strongDrive);

    expect(psiWithWeakDrive.real).toEqual(psiWithStrongDrive.real);
    expect(psiWithWeakDrive.imag).toEqual(psiWithStrongDrive.imag);
  });
});

describe('pure core K13: runWorldTick ledger (N conservation across the exchange, equal-and-opposite)', () => {
  it('exchangeWorkNPsi = -exchangeWorkNChi exactly, for a nonzero lambda', () => {
    const { psiWorld, chiWorld, psiInitial, chiInitial, drive, pairs } = buildScenario();
    const psi: ComplexField = { real: psiInitial.real, imag: psiInitial.imag };
    const chi: ComplexField = { real: chiInitial.real, imag: chiInitial.imag };

    const result = runWorldTick(psi, psiInitial.nu, psiWorld, chi, chiInitial.nu, chiWorld, drive, 0, psiWorld.params.dt, pairs, 0.6);

    expect(result.ledger.exchangeWorkNPsi).toBeCloseTo(-result.ledger.exchangeWorkNChi, 12);
  });

  it('is deterministic across repeated calls with the same inputs', () => {
    const { psiWorld, chiWorld, psiInitial, chiInitial, drive, pairs } = buildScenario();
    const psi: ComplexField = { real: psiInitial.real, imag: psiInitial.imag };
    const chi: ComplexField = { real: chiInitial.real, imag: chiInitial.imag };

    const a = runWorldTick(psi, psiInitial.nu, psiWorld, chi, chiInitial.nu, chiWorld, drive, 0, psiWorld.params.dt, pairs, 0.6);
    const b = runWorldTick(psi, psiInitial.nu, psiWorld, chi, chiInitial.nu, chiWorld, drive, 0, psiWorld.params.dt, pairs, 0.6);

    expect(a.psi.real).toEqual(b.psi.real);
    expect(a.chi.real).toEqual(b.chi.real);
    expect(a.ledger.exchangeWorkNPsi).toBe(b.ledger.exchangeWorkNPsi);
  });
});
