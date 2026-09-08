import { describe, expect, it } from 'vitest';
import { createTorusGeometry } from '../../pure/geometry/torus.ts';
import { createPureFieldState, PURE_FIELD_INITIAL_AMPLITUDE } from '../../pure/field/state.ts';
import type { PureCoreParams } from '../../pure/params.ts';

function makeParams(overrides: Partial<PureCoreParams> = {}): PureCoreParams {
  return {
    R: 3,
    r: 1,
    N: 8,
    dt: 0.01,
    alpha: 1,
    g: 0,
    nu0: 0.02,
    kappa: 0,
    rho: 0,
    seed: 999,
    ...overrides,
  };
}

describe('pure core field state', () => {
  it('same seed produces bit-identical initial state (K1 determinism requirement)', () => {
    const params = makeParams();
    const geometry = createTorusGeometry(params);
    const first = createPureFieldState(params, geometry);
    const second = createPureFieldState(params, geometry);

    expect(Array.from(second.real)).toEqual(Array.from(first.real));
    expect(Array.from(second.imag)).toEqual(Array.from(first.imag));
    expect(Array.from(second.nu)).toEqual(Array.from(first.nu));
  });

  it('different seeds produce different initial fields', () => {
    const geometry = createTorusGeometry(makeParams());
    const first = createPureFieldState(makeParams({ seed: 1 }), geometry);
    const second = createPureFieldState(makeParams({ seed: 2 }), geometry);

    expect(Array.from(second.real)).not.toEqual(Array.from(first.real));
  });

  it('nu(x) starts uniform at nu0', () => {
    const params = makeParams({ nu0: 0.037 });
    const geometry = createTorusGeometry(params);
    const state = createPureFieldState(params, geometry);
    for (const value of state.nu) {
      expect(value).toBe(0.037);
    }
  });

  it('initial psi stays within the documented amplitude scale and tick starts at 0', () => {
    const params = makeParams();
    const geometry = createTorusGeometry(params);
    const state = createPureFieldState(params, geometry);

    expect(state.tick).toBe(0);
    for (let i = 0; i < state.real.length; i++) {
      expect(Math.abs(state.real[i])).toBeLessThanOrEqual(PURE_FIELD_INITIAL_AMPLITUDE / 2);
      expect(Math.abs(state.imag[i])).toBeLessThanOrEqual(PURE_FIELD_INITIAL_AMPLITUDE / 2);
      expect(Number.isFinite(state.real[i])).toBe(true);
      expect(Number.isFinite(state.imag[i])).toBe(true);
    }
  });

  it('rejects a geometry/params N mismatch', () => {
    const params = makeParams({ N: 8 });
    const mismatchedGeometry = createTorusGeometry({ R: 3, r: 1, N: 16 });
    expect(() => createPureFieldState(params, mismatchedGeometry)).toThrow();
  });
});
