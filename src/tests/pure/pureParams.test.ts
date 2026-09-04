import { describe, expect, it } from 'vitest';
import {
  PURE_CORE_SOLVER_STEP_ORDER,
  defaultPureCoreSolverSettings,
  validatePureCoreParams,
  type PureCoreParams,
} from '../../pure/params.ts';

function makeValidParams(overrides: Partial<PureCoreParams> = {}): PureCoreParams {
  return {
    R: 3,
    r: 1,
    N: 16,
    dt: 0.01,
    alpha: 1,
    g: 0,
    nu0: 0.01,
    kappa: 0,
    rho: 0,
    seed: 1,
    ...overrides,
  };
}

describe('pure core params', () => {
  it('accepts a well-formed parameter set', () => {
    expect(() => validatePureCoreParams(makeValidParams())).not.toThrow();
  });

  it.each([
    ['R', { R: 0 }],
    ['R', { R: -1 }],
    ['R', { R: Number.NaN }],
    ['r', { r: 0 }],
    ['r', { r: 5 }], // r >= R
    ['N', { N: 1 }],
    ['N', { N: 3.5 }],
    ['dt', { dt: 0 }],
    ['dt', { dt: -0.01 }],
    ['alpha', { alpha: Number.NaN }],
    ['g', { g: Number.POSITIVE_INFINITY }],
    ['nu0', { nu0: -0.1 }],
    ['kappa', { kappa: -0.1 }],
    ['rho', { rho: -0.1 }],
    ['seed', { seed: Number.NaN }],
  ])('rejects an invalid %s', (_field, overrides) => {
    expect(() => validatePureCoreParams(makeValidParams(overrides as Partial<PureCoreParams>))).toThrow();
  });

  it('fixes the tick-internal solver step order', () => {
    // 'exchange' was added between 'drive' and 'mediumHistory' in K5
    // (docs/vessel/K5-exchange-medium-adr.md choice 4) - an explicit,
    // documented, test-covered change, not the implicit one
    // docs/pure-physics-implementation-plan.md §9 forbids.
    expect(PURE_CORE_SOLVER_STEP_ORDER).toEqual([
      'conservative',
      'dissipation',
      'drive',
      'exchange',
      'mediumHistory',
      'observe',
    ]);
  });

  it('exports solver settings including solverStepOrder, distinct from physical params', () => {
    const settings = defaultPureCoreSolverSettings();
    expect(settings.solverStepOrder).toBe(PURE_CORE_SOLVER_STEP_ORDER);
    expect(Number.isFinite(settings.linearSolverTolerance)).toBe(true);
    expect(Number.isInteger(settings.linearSolverMaxIterations)).toBe(true);
    expect(['direct', 'iterative', 'spectral']).toContain(settings.linearSolverKind);
  });
});
