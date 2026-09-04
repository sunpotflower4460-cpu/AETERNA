import { describe, expect, it } from 'vitest';
import type { ComplexField } from '../../pure/geometry/torus.ts';
import { createExchangeRingGeometry } from '../../pure/exchange/ringGeometry.ts';
import { createRingLaplacian } from '../../pure/exchange/ringLaplacian.ts';
import { computeRingHamiltonian, computeRingNorm } from '../../pure/exchange/ringInvariants.ts';
import { applyRingShift } from '../../pure/exchange/ringShiftStep.ts';
import { createSeededRandom } from '../../pure/random/seededPrng.ts';

function randomComplexField(size: number, seed: number): ComplexField {
  const random = createSeededRandom(seed);
  const real = new Float64Array(size);
  const imag = new Float64Array(size);
  for (let i = 0; i < size; i++) {
    real[i] = random() - 0.5;
    imag[i] = random() - 0.5;
  }
  return { real, imag };
}

describe('pure core exchange ring: N_chi and H_chi are exactly invariant under the exact shift (docs/vessel/K5-exchange-medium-adr.md choice 1)', () => {
  it('N_chi is unchanged (to floating-point precision) across many shifts of varying size', () => {
    const geometry = createExchangeRingGeometry(11, 0.3);
    let chi = randomComplexField(11, 3);
    const nStart = computeRingNorm(chi, geometry);

    for (const shift of [1, 2, 5, 0, 10, 3]) {
      chi = applyRingShift(chi, shift);
      const n = computeRingNorm(chi, geometry);
      expect(n).toBeCloseTo(nStart, 12);
    }
  });

  it('H_chi (g_chi=0, linear-only) is unchanged (to floating-point precision) across many shifts', () => {
    const geometry = createExchangeRingGeometry(9, 0.25);
    const operator = createRingLaplacian(geometry);
    const alphaChi = 1.4;
    let chi = randomComplexField(9, 17);
    const hStart = computeRingHamiltonian(chi, operator, alphaChi);

    for (const shift of [1, 4, 2, 8, 0]) {
      chi = applyRingShift(chi, shift);
      const h = computeRingHamiltonian(chi, operator, alphaChi);
      expect(h).toBeCloseTo(hStart, 10);
    }
  });

  it('N_chi and H_chi are invariant over a full round trip (M ticks of a 1-cell shift)', () => {
    const M = 13;
    const geometry = createExchangeRingGeometry(M, 0.4);
    const operator = createRingLaplacian(geometry);
    const alphaChi = 0.8;
    let chi = randomComplexField(M, 44);
    const nStart = computeRingNorm(chi, geometry);
    const hStart = computeRingHamiltonian(chi, operator, alphaChi);

    for (let tick = 0; tick < M; tick++) {
      chi = applyRingShift(chi, 1);
      expect(computeRingNorm(chi, geometry)).toBeCloseTo(nStart, 12);
      expect(computeRingHamiltonian(chi, operator, alphaChi)).toBeCloseTo(hStart, 10);
    }
  });
});
