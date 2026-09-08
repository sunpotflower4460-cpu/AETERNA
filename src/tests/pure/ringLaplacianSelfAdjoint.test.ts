import { describe, expect, it } from 'vitest';
import type { ComplexField } from '../../pure/geometry/torus.ts';
import { createExchangeRingGeometry } from '../../pure/exchange/ringGeometry.ts';
import { applyRingLaplacian, createRingLaplacian } from '../../pure/exchange/ringLaplacian.ts';
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

function ringInnerProduct(a: ComplexField, b: ComplexField, cellArea: Float64Array): { real: number; imag: number } {
  let real = 0;
  let imag = 0;
  for (let m = 0; m < cellArea.length; m++) {
    const w = cellArea[m];
    real += (a.real[m] * b.real[m] + a.imag[m] * b.imag[m]) * w;
    imag += (a.real[m] * b.imag[m] - a.imag[m] * b.real[m]) * w;
  }
  return { real, imag };
}

describe('pure core exchange ring Laplacian: self-adjointness (docs/vessel/K5-exchange-medium-adr.md choice 1)', () => {
  it.each([4, 8, 16])('<phi, L_chi psi>_dA ~= <L_chi phi, psi>_dA for random fields on an M=%i ring', (M) => {
    const geometry = createExchangeRingGeometry(M, 0.5);
    const operator = createRingLaplacian(geometry);
    const phi = randomComplexField(M, 11);
    const psi = randomComplexField(M, 22);

    const lPsi = applyRingLaplacian(operator, psi);
    const lPhi = applyRingLaplacian(operator, phi);

    const left = ringInnerProduct(phi, lPsi, geometry.cellArea);
    const right = ringInnerProduct(lPhi, psi, geometry.cellArea);

    const scale = Math.max(1e-12, Math.abs(left.real), Math.abs(right.real));
    expect(Math.abs(left.real - right.real) / scale).toBeLessThan(1e-9);
  });

  it('L_chi applied to a constant field is exactly zero', () => {
    const geometry = createExchangeRingGeometry(12, 0.2);
    const operator = createRingLaplacian(geometry);
    const constantField: ComplexField = { real: new Float64Array(12).fill(2.5), imag: new Float64Array(12).fill(-0.7) };

    const result = applyRingLaplacian(operator, constantField);

    for (let m = 0; m < 12; m++) {
      expect(result.real[m]).toBeCloseTo(0, 12);
      expect(result.imag[m]).toBeCloseTo(0, 12);
    }
  });

  it('transmissibility is finite and positive', () => {
    const geometry = createExchangeRingGeometry(20, 0.1);
    const operator = createRingLaplacian(geometry);
    expect(operator.transmissibility).toBeGreaterThan(0);
    expect(Number.isFinite(operator.transmissibility)).toBe(true);
  });

  it('does not mutate the input field', () => {
    const geometry = createExchangeRingGeometry(8, 0.4);
    const operator = createRingLaplacian(geometry);
    const chi = randomComplexField(8, 5);
    const beforeReal = Array.from(chi.real);
    const beforeImag = Array.from(chi.imag);

    applyRingLaplacian(operator, chi);

    expect(Array.from(chi.real)).toEqual(beforeReal);
    expect(Array.from(chi.imag)).toEqual(beforeImag);
  });
});
