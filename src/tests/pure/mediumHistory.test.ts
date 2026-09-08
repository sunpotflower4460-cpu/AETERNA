import { describe, expect, it } from 'vitest';
import type { ComplexField } from '../../pure/geometry/torus.ts';
import { applyMediumHistoryStep, type MediumHistoryParams } from '../../pure/medium/history.ts';

function singleCellField(real: number, imag: number): ComplexField {
  return { real: Float64Array.from([real]), imag: Float64Array.from([imag]) };
}

describe('pure core medium history: exact-ODE relaxation (docs/pure-physics-implementation-plan.md PR6 gate)', () => {
  it('matches the exact analytic solution nu(t+dt) = nu* + (nu(t)-nu*)*exp(-(kappa*|psi|^2+rho)*dt)', () => {
    const cases: Array<{ kappa: number; rho: number; nu0: number; amplitudeSquared: number; nuStart: number; dt: number }> = [
      { kappa: 2, rho: 0.5, nu0: 0.3, amplitudeSquared: 1.5, nuStart: 0.3, dt: 0.1 },
      { kappa: 0.1, rho: 2, nu0: 0.8, amplitudeSquared: 0.02, nuStart: 0.1, dt: 0.5 },
      { kappa: 5, rho: 0.01, nu0: 0.05, amplitudeSquared: 3, nuStart: 1.2, dt: 0.05 },
    ];

    for (const c of cases) {
      const amplitude = Math.sqrt(c.amplitudeSquared);
      const psi = singleCellField(amplitude, 0);
      const nu = Float64Array.from([c.nuStart]);
      const params: MediumHistoryParams = { kappa: c.kappa, rho: c.rho, nu0: c.nu0 };

      const nuNext = applyMediumHistoryStep(psi, nu, params, c.dt);

      const rate = c.kappa * c.amplitudeSquared + c.rho;
      const nuStar = (c.rho * c.nu0) / rate;
      const expected = nuStar + (c.nuStart - nuStar) * Math.exp(-rate * c.dt);
      expect(nuNext[0]).toBeCloseTo(expected, 12);
    }
  });

  it('the degenerate case kappa=0, rho=0 leaves nu exactly unchanged (no forcing at all, avoids 0/0)', () => {
    const psi = singleCellField(3, 4);
    const nu = Float64Array.from([0.42]);
    const params: MediumHistoryParams = { kappa: 0, rho: 0, nu0: 0.9 };

    const nuNext = applyMediumHistoryStep(psi, nu, params, 1000);

    expect(nuNext[0]).toBe(0.42);
  });

  it('as dt grows large, nu converges to the steady state nu* = rho*nu0/(kappa*|psi|^2+rho)', () => {
    const kappa = 1;
    const rho = 0.3;
    const nu0 = 0.6;
    const amplitudeSquared = 2;
    const psi = singleCellField(Math.sqrt(amplitudeSquared), 0);
    const nu = Float64Array.from([5]); // deliberately far from steady state
    const params: MediumHistoryParams = { kappa, rho, nu0 };

    const nuNext = applyMediumHistoryStep(psi, nu, params, 1e6);

    const nuStar = (rho * nu0) / (kappa * amplitudeSquared + rho);
    expect(nuNext[0]).toBeCloseTo(nuStar, 9);
  });

  it('responds to the LOCAL |psi(x)|^2 - two cells with different field amplitude relax toward different nu*, with the same global kappa/rho/nu0 (not an observer-derived average)', () => {
    const kappa = 1.5;
    const rho = 0.4;
    const nu0 = 0.7;
    const psi: ComplexField = { real: Float64Array.from([3, 0.1]), imag: Float64Array.from([0, 0]) };
    const nu = Float64Array.from([nu0, nu0]);
    const params: MediumHistoryParams = { kappa, rho, nu0 };

    const nuNext = applyMediumHistoryStep(psi, nu, params, 50);

    // cell 0 has much higher |psi|^2 -> lower nu* (more plasticity pulls it down further)
    const nuStarHigh = (rho * nu0) / (kappa * 9 + rho);
    const nuStarLow = (rho * nu0) / (kappa * 0.01 + rho);
    expect(nuStarHigh).toBeLessThan(nuStarLow);
    expect(nuNext[0]).toBeCloseTo(nuStarHigh, 6);
    expect(nuNext[1]).toBeCloseTo(nuStarLow, 6);
    expect(nuNext[0]).not.toBeCloseTo(nuNext[1], 3);
  });

  it('does not mutate the input nu array', () => {
    const psi = singleCellField(1, 1);
    const nu = Float64Array.from([0.5]);
    const original = Float64Array.from(nu);
    applyMediumHistoryStep(psi, nu, { kappa: 1, rho: 1, nu0: 0.5 }, 0.1);
    expect(nu).toEqual(original);
  });

  it('throws if nu length does not match psi length', () => {
    const psi = singleCellField(1, 1);
    const nu = new Float64Array(2);
    expect(() => applyMediumHistoryStep(psi, nu, { kappa: 1, rho: 1, nu0: 0.5 }, 0.1)).toThrow();
  });
});
