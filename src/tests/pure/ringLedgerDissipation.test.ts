import { describe, expect, it } from 'vitest';
import type { ComplexField } from '../../pure/geometry/torus.ts';
import { createExchangeRingGeometry } from '../../pure/exchange/ringGeometry.ts';
import { createRingLaplacian } from '../../pure/exchange/ringLaplacian.ts';
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

describe('pure core exchange ring ledger: bookkeeping identity holds every tick, and the conservative step is exact (docs/vessel/K5-exchange-medium-adr.md choice 1)', () => {
  it('N(t+1) = N(t) - dissipationLoss_N + residual_N holds to floating-point precision', () => {
    const geometry = createExchangeRingGeometry(10, 0.3);
    const operator = createRingLaplacian(geometry);
    const alphaChi = 1;
    const shiftCellsPerTick = 1;
    const dt = 0.015;
    const nuChi = Float64Array.from({ length: 10 }, () => 0.35);
    let chi = randomComplexField(10, 8, 0.3);

    for (let tick = 0; tick < 30; tick++) {
      const { chi: nextChi, ledger } = runRingDissipationTick(chi, operator, geometry, alphaChi, shiftCellsPerTick, nuChi, dt);
      const predictedNAfter = ledger.nBefore - ledger.dissipationLossN + ledger.residualN;
      expect(ledger.nAfterDissipation).toBeCloseTo(predictedNAfter, 12);
      chi = nextChi;
    }
  });

  it('residual_N and residual_H stay at floating-point-roundoff scale (far tighter than psi\'s own tolerance, since the conservative step is an exact permutation, not an approximate Cayley/CN solve)', () => {
    const geometry = createExchangeRingGeometry(13, 0.2);
    const operator = createRingLaplacian(geometry);
    const alphaChi = 1.1;
    const shiftCellsPerTick = 3;
    const dt = 0.01;
    const nuChi = Float64Array.from({ length: 13 }, () => 0.3);
    let chi = randomComplexField(13, 51, 0.3);

    for (let tick = 0; tick < 100; tick++) {
      const { chi: nextChi, ledger } = runRingDissipationTick(chi, operator, geometry, alphaChi, shiftCellsPerTick, nuChi, dt);
      expect(Math.abs(ledger.residualN)).toBeLessThan(1e-12);
      expect(Math.abs(ledger.residualH)).toBeLessThan(1e-9);
      chi = nextChi;
    }
  });

  it('numericalDrift_H_chi is at floating-point-roundoff scale, not the O(dt^2) truncation error psi\'s Cayley/CN step has (the shift is an exact permutation)', () => {
    const geometry = createExchangeRingGeometry(10, 0.3);
    const operator = createRingLaplacian(geometry);
    const alphaChi = 1;
    const shiftCellsPerTick = 4;
    const dt = 0.2; // deliberately large dt - would show O(dt^2) drift clearly if any existed
    const nuChi = Float64Array.from({ length: 10 }, () => 0.3);
    const chi = randomComplexField(10, 63, 0.3);

    const { ledger } = runRingDissipationTick(chi, operator, geometry, alphaChi, shiftCellsPerTick, nuChi, dt);

    expect(Math.abs(ledger.numericalDriftH)).toBeLessThan(1e-9);
  });
});
