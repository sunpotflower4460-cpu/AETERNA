import { describe, expect, it } from 'vitest';
import type { ComplexField } from '../../pure/geometry/torus.ts';
import { createExchangeRingGeometry } from '../../pure/exchange/ringGeometry.ts';
import { createRingLaplacian } from '../../pure/exchange/ringLaplacian.ts';
import { computeRingHamiltonian } from '../../pure/exchange/ringInvariants.ts';
import { applyRingShift } from '../../pure/exchange/ringShiftStep.ts';
import { applyDissipationStep } from '../../pure/field/stepDissipation.ts';
import { runRingDissipationTick } from '../../pure/exchange/ringLedger.ts';
import { createSeededRandom } from '../../pure/random/seededPrng.ts';

function randomComplexField(size: number, seed: number, scale = 0.4): ComplexField {
  const random = createSeededRandom(seed);
  const real = new Float64Array(size);
  const imag = new Float64Array(size);
  for (let i = 0; i < size; i++) {
    real[i] = (random() - 0.5) * scale;
    imag[i] = (random() - 0.5) * scale;
  }
  return { real, imag };
}

describe('pure core exchange ring dissipation: uniform nu_chi (docs/vessel/K5-exchange-medium-adr.md "answered elsewhere" - chi medium history deferred)', () => {
  it('dissipationLoss_N_chi >= 0 for uniform nu_chi (reuses the same algebraic guarantee as stepDissipation.ts)', () => {
    const geometry = createExchangeRingGeometry(10, 0.3);
    const operator = createRingLaplacian(geometry);
    const alphaChi = 1;
    const shiftCellsPerTick = 1;
    const dt = 0.02;
    const nuChi = Float64Array.from({ length: 10 }, () => 0.5);
    const chi = randomComplexField(10, 6, 0.3);

    const { ledger } = runRingDissipationTick(chi, operator, geometry, alphaChi, shiftCellsPerTick, nuChi, dt);

    expect(ledger.dissipationLossN).toBeGreaterThanOrEqual(0);
  });

  it('dissipationLoss_H_chi >= 0 for uniform nu_chi, matching the exact analytic prediction H_after = H_before * exp(-2*nu*dt) (no quartic term to complicate it, since g_chi=0)', () => {
    const geometry = createExchangeRingGeometry(9, 0.25);
    const operator = createRingLaplacian(geometry);
    const alphaChi = 1.2;
    const nu0 = 0.6;
    const dt = 0.05;
    const nuChi = Float64Array.from({ length: 9 }, () => nu0);
    const chi = randomComplexField(9, 19, 0.3);

    // Isolate the dissipation step's effect on H alone (skip the shift, which doesn't change H_chi anyway).
    const hBefore = computeRingHamiltonian(chi, operator, alphaChi);
    const decayed = applyDissipationStep(chi, nuChi, dt);
    const hAfter = computeRingHamiltonian(decayed, operator, alphaChi);

    const predictedHAfter = hBefore * Math.exp(-2 * nu0 * dt);
    expect(hAfter).toBeCloseTo(predictedHAfter, 9);
    expect(hBefore - hAfter).toBeGreaterThanOrEqual(-1e-9);
  });

  it('full ring tick (shift + dissipation) keeps dissipationLoss_H_chi >= 0 across many ticks', () => {
    const geometry = createExchangeRingGeometry(11, 0.3);
    const operator = createRingLaplacian(geometry);
    const alphaChi = 1;
    const shiftCellsPerTick = 2;
    const dt = 0.01;
    const nuChi = Float64Array.from({ length: 11 }, () => 0.4);
    let chi = randomComplexField(11, 27, 0.3);

    for (let tick = 0; tick < 40; tick++) {
      const { chi: nextChi, ledger } = runRingDissipationTick(chi, operator, geometry, alphaChi, shiftCellsPerTick, nuChi, dt);
      expect(ledger.dissipationLossH).toBeGreaterThanOrEqual(-1e-9);
      chi = nextChi;
    }
  });
});
