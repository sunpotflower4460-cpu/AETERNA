import { describe, expect, it } from 'vitest';
import { createTorusGeometry, type ComplexField } from '../../pure/geometry/torus.ts';
import { createLaplaceBeltramiOperator } from '../../pure/geometry/laplaceBeltrami.ts';
import { createConservativeStepper } from '../../pure/field/stepConservative.ts';
import { computeHamiltonian } from '../../pure/field/invariants.ts';
import { createPureFieldState } from '../../pure/field/state.ts';
import { runGHistoryTick, runMediumHistoryTick } from '../../pure/ledger/energy.ts';
import type { PureCoreParams } from '../../pure/params.ts';
import type { DriveSpec } from '../../pure/drive/drive.ts';
import type { MediumHistoryParams } from '../../pure/medium/history.ts';
import type { GHistoryParams } from '../../pure/medium/gHistory.ts';

function buildScenario(N: number, seed: number) {
  const params: PureCoreParams = { R: 3, r: 1, N, dt: 0.01, alpha: 1, g: 1, nu0: 0.2, kappa: 1, rho: 0.3, seed };
  const geometry = createTorusGeometry({ R: params.R, r: params.r, N });
  const operator = createLaplaceBeltramiOperator(geometry);
  const stepper = createConservativeStepper(operator, geometry, { alpha: params.alpha, g: params.g, dt: params.dt });
  const drive: DriveSpec = { spatialProfile: new Float64Array(N * N).fill(0.05), omega: 2, phase: 0.2 };
  const initial = createPureFieldState(params, geometry);
  return { params, geometry, operator, stepper, drive, initial };
}

describe('pure core K12: runGHistoryTick (docs/vessel/K12-memory-channel-adr.md Choice 2/3)', () => {
  it('mediumWork_H exactly equals computeHamiltonian(psiFinal, gNext) - ledger.hAfterDrive (the ADR Choice 3 definition, not re-derived a second way)', () => {
    const N = 6;
    const scenario = buildScenario(N, 3);
    const gField = new Float64Array(N * N).fill(1);
    const mediumParams: MediumHistoryParams = { kappa: scenario.params.kappa, rho: scenario.params.rho, nu0: scenario.params.nu0 };
    const gHistoryParams: GHistoryParams = { kappaG: 2, rhoG: 0.5, g0: 1, g1: 3 };
    const nu = Float64Array.from({ length: N * N }, () => scenario.params.nu0);
    const psi: ComplexField = { real: scenario.initial.real, imag: scenario.initial.imag };

    const result = runGHistoryTick(psi, scenario.stepper, scenario.geometry, scenario.params.alpha, gField, nu, scenario.drive, 0, scenario.params.dt, mediumParams, gHistoryParams);

    const expectedMediumWorkH = computeHamiltonian(result.psi, scenario.operator, scenario.geometry, scenario.params.alpha, result.gField) - result.ledger.hAfterDrive;
    expect(result.ledger.mediumWorkH).toBe(expectedMediumWorkH);
  });

  it('g(x) actually evolves per applyGHistoryStep (not left untouched)', () => {
    const N = 6;
    const scenario = buildScenario(N, 3);
    const g0 = 1;
    const gField = new Float64Array(N * N).fill(g0);
    const mediumParams: MediumHistoryParams = { kappa: scenario.params.kappa, rho: scenario.params.rho, nu0: scenario.params.nu0 };
    const gHistoryParams: GHistoryParams = { kappaG: 5, rhoG: 0.1, g0, g1: 4 };
    const nu = Float64Array.from({ length: N * N }, () => scenario.params.nu0);
    const psi: ComplexField = { real: scenario.initial.real, imag: scenario.initial.imag };

    const result = runGHistoryTick(psi, scenario.stepper, scenario.geometry, scenario.params.alpha, gField, nu, scenario.drive, 0, scenario.params.dt, mediumParams, gHistoryParams);

    expect(result.gField).not.toEqual(gField);
    for (const value of result.gField) {
      expect(value).toBeGreaterThanOrEqual(Math.min(gHistoryParams.g0, gHistoryParams.g1) - 1e-9);
      expect(value).toBeLessThanOrEqual(Math.max(gHistoryParams.g0, gHistoryParams.g1) + 1e-9);
    }
  });

  it('a non-uniform g(x) makes psi evolve differently than the equivalent uniform-scalar run via runMediumHistoryTick', () => {
    const N = 6;
    const scenario = buildScenario(N, 3);
    const mediumParams: MediumHistoryParams = { kappa: scenario.params.kappa, rho: scenario.params.rho, nu0: scenario.params.nu0 };
    const gHistoryParams: GHistoryParams = { kappaG: 3, rhoG: 0.2, g0: 0.5, g1: 3 };
    const nu = Float64Array.from({ length: N * N }, () => scenario.params.nu0);
    const psi: ComplexField = { real: scenario.initial.real, imag: scenario.initial.imag };

    // Non-uniform initial g(x) (not the uniform g0 the ADR specifies as the real initial
    // condition - deliberately non-uniform here just to prove the per-cell g(x) is actually read).
    const gField = Float64Array.from({ length: N * N }, (_, k) => (k % 2 === 0 ? 0.5 : 3));
    const resultGField = runGHistoryTick(psi, scenario.stepper, scenario.geometry, scenario.params.alpha, gField, nu, scenario.drive, 0, scenario.params.dt, mediumParams, gHistoryParams);

    const resultScalar = runMediumHistoryTick(psi, scenario.stepper, scenario.geometry, scenario.params.alpha, scenario.params.g, nu, scenario.drive, 0, scenario.params.dt, mediumParams);

    expect(resultGField.psi.real).not.toEqual(resultScalar.psi.real);
  });

  it('nu(x) still evolves normally alongside g(x) (both memory channels active independently)', () => {
    const N = 6;
    const scenario = buildScenario(N, 3);
    const gField = new Float64Array(N * N).fill(1);
    const mediumParams: MediumHistoryParams = { kappa: 2, rho: 0.1, nu0: scenario.params.nu0 };
    const gHistoryParams: GHistoryParams = { kappaG: 2, rhoG: 0.5, g0: 1, g1: 3 };
    const nu = Float64Array.from({ length: N * N }, () => scenario.params.nu0);
    const psi: ComplexField = { real: scenario.initial.real, imag: scenario.initial.imag };

    const result = runGHistoryTick(psi, scenario.stepper, scenario.geometry, scenario.params.alpha, gField, nu, scenario.drive, 0, scenario.params.dt, mediumParams, gHistoryParams);

    expect(result.nu).not.toEqual(nu);
  });

  it('is deterministic across repeated calls with the same inputs', () => {
    const N = 6;
    const scenario = buildScenario(N, 3);
    const gField = new Float64Array(N * N).fill(1);
    const mediumParams: MediumHistoryParams = { kappa: scenario.params.kappa, rho: scenario.params.rho, nu0: scenario.params.nu0 };
    const gHistoryParams: GHistoryParams = { kappaG: 2, rhoG: 0.5, g0: 1, g1: 3 };
    const nu = Float64Array.from({ length: N * N }, () => scenario.params.nu0);
    const psi: ComplexField = { real: scenario.initial.real, imag: scenario.initial.imag };

    const a = runGHistoryTick(psi, scenario.stepper, scenario.geometry, scenario.params.alpha, gField, nu, scenario.drive, 0, scenario.params.dt, mediumParams, gHistoryParams);
    const b = runGHistoryTick(psi, scenario.stepper, scenario.geometry, scenario.params.alpha, gField, nu, scenario.drive, 0, scenario.params.dt, mediumParams, gHistoryParams);

    expect(a.psi.real).toEqual(b.psi.real);
    expect(a.gField).toEqual(b.gField);
    expect(a.ledger.mediumWorkH).toBe(b.ledger.mediumWorkH);
  });
});
