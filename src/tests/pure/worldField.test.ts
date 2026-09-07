import { describe, expect, it } from 'vitest';
import { createWorldField, createWorldInitialState, type WorldFieldConfig } from '../../pure/world/worldField.ts';
import { runMediumHistoryTick } from '../../pure/ledger/energy.ts';
import { computeNorm } from '../../pure/field/invariants.ts';
import type { PureCoreParams } from '../../pure/params.ts';
import type { DriveSpec } from '../../pure/drive/drive.ts';
import type { ComplexField } from '../../pure/geometry/torus.ts';

function baseChiParams(overrides: Partial<PureCoreParams> = {}): PureCoreParams {
  return { R: 3, r: 1, N: 8, dt: 0.01, alpha: 1, g: 1, nu0: 0.2, kappa: 1, rho: 0.3, seed: 5, ...overrides };
}

describe('pure core K13: createWorldField / createWorldInitialState (docs/vessel/K13-world-constitution-adr.md Choice 1)', () => {
  it('builds a usable geometry/operator/stepper/mediumParams bundle', () => {
    const world = createWorldField({ params: baseChiParams() });
    expect(world.geometry.N).toBe(8);
    expect(world.mediumParams.kappa).toBe(1);
    expect(world.mediumParams.rho).toBe(0.3);
    expect(world.mediumParams.nu0).toBe(0.2);
  });

  it('supports chi having a DIFFERENT N than a hypothetical psi (the world may be larger)', () => {
    const worldSmall = createWorldField({ params: baseChiParams({ N: 8 }) });
    const worldLarge = createWorldField({ params: baseChiParams({ N: 16 }) });
    expect(worldSmall.geometry.N).toBe(8);
    expect(worldLarge.geometry.N).toBe(16);
  });

  it('createWorldInitialState is deterministic for a fixed seed', () => {
    const world = createWorldField({ params: baseChiParams({ seed: 42 }) });
    const a = createWorldInitialState(world);
    const b = createWorldInitialState(world);
    expect(a.real).toEqual(b.real);
    expect(a.imag).toEqual(b.imag);
    expect(a.nu).toEqual(b.nu);
  });

  it('a different seed produces a different initial state', () => {
    const worldA = createWorldField({ params: baseChiParams({ seed: 1 }) });
    const worldB = createWorldField({ params: baseChiParams({ seed: 2 }) });
    const a = createWorldInitialState(worldA);
    const b = createWorldInitialState(worldB);
    expect(a.real).not.toEqual(b.real);
  });

  it('chi evolves through the SAME runMediumHistoryTick psi has always used, with N conservation up to solver tolerance when dissipation/drive are both off (no new physics)', () => {
    // kappa=rho=nu0=0 (no dissipation) and zero-amplitude drive isolates the
    // conservative block alone, matching src/tests/pure/conservativeNorm.test.ts's
    // own N-conservation check - this test's point is that CHI'S OWN construction
    // path reproduces that already-proven property, not to re-derive it.
    const world = createWorldField({ params: baseChiParams({ nu0: 0, kappa: 0, rho: 0 }) });
    const initial = createWorldInitialState(world);
    let chi: ComplexField = { real: initial.real, imag: initial.imag };
    let nu = initial.nu;
    const drive: DriveSpec = { spatialProfile: new Float64Array(64).fill(0), omega: 0, phase: 0 };

    const nStart = computeNorm(chi, world.geometry);
    let maxRelativeDrift = 0;
    for (let tick = 0; tick < 100; tick++) {
      const t = tick * world.params.dt;
      const result = runMediumHistoryTick(chi, world.stepper, world.geometry, world.params.alpha, world.params.g, nu, drive, t, world.params.dt, world.mediumParams);
      chi = result.psi;
      nu = result.nu;
      const n = computeNorm(chi, world.geometry);
      maxRelativeDrift = Math.max(maxRelativeDrift, Math.abs(n - nStart) / nStart);
    }

    expect(maxRelativeDrift).toBeLessThan(1e-6);
  });

  it('spectral solver kind works for chi at a power-of-2 N, matching direct within tolerance', () => {
    const worldDirect = createWorldField({ params: baseChiParams({ N: 8 }), linearSolverKind: 'direct' });
    const worldSpectral = createWorldField({ params: baseChiParams({ N: 8 }), linearSolverKind: 'spectral' });
    const initial = createWorldInitialState(worldDirect);
    const psi: ComplexField = { real: initial.real, imag: initial.imag };

    const afterDirect = worldDirect.stepper.step(psi);
    const afterSpectral = worldSpectral.stepper.step(psi);

    for (let i = 0; i < psi.real.length; i++) {
      expect(afterSpectral.real[i]).toBeCloseTo(afterDirect.real[i], 9);
      expect(afterSpectral.imag[i]).toBeCloseTo(afterDirect.imag[i], 9);
    }
  });
});
