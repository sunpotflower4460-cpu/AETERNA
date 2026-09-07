import { describe, expect, it } from 'vitest';
import type { ComplexField } from '../../pure/geometry/torus.ts';
import { applyGHistoryStep, type GHistoryParams } from '../../pure/medium/gHistory.ts';

function singleCellField(real: number, imag: number): ComplexField {
  return { real: Float64Array.from([real]), imag: Float64Array.from([imag]) };
}

describe('pure core K12 g(x) history: exact-ODE relaxation (docs/vessel/K12-memory-channel-adr.md Choice 1)', () => {
  it('matches the exact analytic solution g(t+dt) = g* + (g(t)-g*)*exp(-(kappaG*|psi|^2+rhoG)*dt)', () => {
    const cases: Array<{ kappaG: number; rhoG: number; g0: number; g1: number; amplitudeSquared: number; gStart: number; dt: number }> = [
      { kappaG: 2, rhoG: 0.5, g0: 1, g1: 3, amplitudeSquared: 1.5, gStart: 1, dt: 0.1 },
      { kappaG: 0.1, rhoG: 2, g0: 0.8, g1: 2.2, amplitudeSquared: 0.02, gStart: 1.5, dt: 0.5 },
      { kappaG: 5, rhoG: 0.01, g0: 0.5, g1: 4, amplitudeSquared: 3, gStart: 2, dt: 0.05 },
    ];

    for (const c of cases) {
      const amplitude = Math.sqrt(c.amplitudeSquared);
      const psi = singleCellField(amplitude, 0);
      const g = Float64Array.from([c.gStart]);
      const params: GHistoryParams = { kappaG: c.kappaG, rhoG: c.rhoG, g0: c.g0, g1: c.g1 };

      const gNext = applyGHistoryStep(psi, g, params, c.dt);

      const rate = c.kappaG * c.amplitudeSquared + c.rhoG;
      const gStar = (c.rhoG * c.g0 + c.kappaG * c.amplitudeSquared * c.g1) / rate;
      const expected = gStar + (c.gStart - gStar) * Math.exp(-rate * c.dt);
      expect(gNext[0]).toBeCloseTo(expected, 12);
    }
  });

  it('the degenerate case kappaG=0, rhoG=0 leaves g exactly unchanged (avoids 0/0)', () => {
    const psi = singleCellField(3, 4);
    const g = Float64Array.from([1.7]);
    const params: GHistoryParams = { kappaG: 0, rhoG: 0, g0: 1, g1: 3 };

    const gNext = applyGHistoryStep(psi, g, params, 1000);

    expect(gNext[0]).toBe(1.7);
  });

  it('as dt grows large, g converges to the steady state g* = (rhoG*g0 + kappaG*|psi|^2*g1)/(kappaG*|psi|^2+rhoG)', () => {
    const kappaG = 1;
    const rhoG = 0.3;
    const g0 = 1;
    const g1 = 5;
    const amplitudeSquared = 2;
    const psi = singleCellField(Math.sqrt(amplitudeSquared), 0);
    const g = Float64Array.from([100]); // deliberately far outside [g0,g1] to also probe boundedness of the STEADY STATE itself
    const params: GHistoryParams = { kappaG, rhoG, g0, g1 };

    const gNext = applyGHistoryStep(psi, g, params, 1e6);

    const gStar = (rhoG * g0 + kappaG * amplitudeSquared * g1) / (kappaG * amplitudeSquared + rhoG);
    expect(gNext[0]).toBeCloseTo(gStar, 6);
    expect(gStar).toBeGreaterThanOrEqual(Math.min(g0, g1));
    expect(gStar).toBeLessThanOrEqual(Math.max(g0, g1));
  });

  it('heavily-flowed cells (large kappaG*|psi|^2) relax toward g1; unflowed cells relax toward g0 (docs/vessel/K12-memory-channel-adr.md Choice 1\'s two-endpoint design, unlike history.ts\'s single-endpoint form)', () => {
    const kappaG = 3;
    const rhoG = 0.01; // rhoG negligible next to kappaG*|psi|^2=300 (cell 0) so gStar approaches g1 tightly, while still >0 so cell 1 (zero flow) fully relaxes to g0 within dt
    const g0 = 0.5;
    const g1 = 4;
    const psi: ComplexField = { real: Float64Array.from([10, 0]), imag: Float64Array.from([0, 0]) };
    const g = Float64Array.from([g0, g0]);
    const params: GHistoryParams = { kappaG, rhoG, g0, g1 };

    const gNext = applyGHistoryStep(psi, g, params, 1e4);

    expect(gNext[0]).toBeCloseTo(g1, 3); // heavily flowed -> g1
    expect(gNext[1]).toBeCloseTo(g0, 6); // zero flow -> g0
  });

  it('structural boundedness: starting at g0 (in [g0,g1]) and iterating many ticks with varying amplitude, g never leaves [min(g0,g1), max(g0,g1)] - no clamp needed', () => {
    const g0 = 1;
    const g1 = 3;
    const params: GHistoryParams = { kappaG: 0.8, rhoG: 0.15, g0, g1 };
    let g = Float64Array.from([g0]);
    const dt = 0.05;
    const lo = Math.min(g0, g1);
    const hi = Math.max(g0, g1);

    for (let tick = 0; tick < 2000; tick++) {
      // Pseudo-varying amplitude so |psi|^2 sweeps a range across ticks.
      const amplitude = 0.1 + 2 * Math.abs(Math.sin(tick * 0.037));
      const psi = singleCellField(amplitude, 0);
      g = applyGHistoryStep(psi, g, params, dt);
      expect(g[0]).toBeGreaterThanOrEqual(lo - 1e-12);
      expect(g[0]).toBeLessThanOrEqual(hi + 1e-12);
    }
  });

  it('g0 > g1 also stays bounded (the design does not assume g0 <= g1)', () => {
    const g0 = 5;
    const g1 = 1;
    const params: GHistoryParams = { kappaG: 1, rhoG: 0.3, g0, g1 };
    const psi = singleCellField(100, 0); // kappaG*|psi|^2=10000 >> rhoG=0.3, so gStar approaches g1 tightly
    const g = Float64Array.from([g0]);

    const gNext = applyGHistoryStep(psi, g, params, 1e6);

    expect(gNext[0]).toBeCloseTo(g1, 3);
    expect(gNext[0]).toBeGreaterThanOrEqual(Math.min(g0, g1) - 1e-9);
    expect(gNext[0]).toBeLessThanOrEqual(Math.max(g0, g1) + 1e-9);
  });

  it('responds to the LOCAL |psi(x)|^2, not a global/observer-derived average', () => {
    const kappaG = 1.5;
    const rhoG = 0.4;
    const g0 = 1;
    const g1 = 3;
    const psi: ComplexField = { real: Float64Array.from([3, 0.1]), imag: Float64Array.from([0, 0]) };
    const g = Float64Array.from([g0, g0]);
    const params: GHistoryParams = { kappaG, rhoG, g0, g1 };

    const gNext = applyGHistoryStep(psi, g, params, 50);

    expect(gNext[0]).not.toBeCloseTo(gNext[1], 3);
  });

  it('does not mutate the input g array', () => {
    const psi = singleCellField(1, 1);
    const g = Float64Array.from([1.5]);
    const original = Float64Array.from(g);
    applyGHistoryStep(psi, g, { kappaG: 1, rhoG: 1, g0: 1, g1: 3 }, 0.1);
    expect(g).toEqual(original);
  });

  it('throws if g length does not match psi length', () => {
    const psi = singleCellField(1, 1);
    const g = new Float64Array(2);
    expect(() => applyGHistoryStep(psi, g, { kappaG: 1, rhoG: 1, g0: 1, g1: 3 }, 0.1)).toThrow();
  });
});
