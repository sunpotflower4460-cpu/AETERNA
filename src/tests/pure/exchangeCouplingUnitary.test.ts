import { describe, expect, it } from 'vitest';
import type { ComplexField } from '../../pure/geometry/torus.ts';
import { applyExchangeCoupling } from '../../pure/exchange/coupling.ts';
import type { ExchangeCouplingConfig } from '../../pure/exchange/boundary.ts';
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

describe('pure core exchange coupling: exact unitary Rabi rotation (docs/vessel/K5-exchange-medium-adr.md choice 3)', () => {
  it('|psi_b|^2 + |chi_p|^2 is exactly conserved (algebraic identity, not approximate) across many (lambda, dt) combinations', () => {
    const psi = randomComplexField(20, 3);
    const chi = randomComplexField(15, 7);
    const config: ExchangeCouplingConfig = { lambda: 0, boundaryCellIndex: 5, portCellIndex: 2 };

    const before = psi.real[5] ** 2 + psi.imag[5] ** 2 + (chi.real[2] ** 2 + chi.imag[2] ** 2);

    for (const lambda of [0.1, 1, 5, 10]) {
      for (const dt of [0.001, 0.01, 0.1, 1]) {
        const { psi: newPsi, chi: newChi } = applyExchangeCoupling(psi, chi, { ...config, lambda }, dt);
        const after = newPsi.real[5] ** 2 + newPsi.imag[5] ** 2 + (newChi.real[2] ** 2 + newChi.imag[2] ** 2);
        expect(after).toBeCloseTo(before, 10);
      }
    }
  });

  it('touches ONLY the boundary and port cells - every other cell is bit-identical before/after', () => {
    const psi = randomComplexField(20, 11);
    const chi = randomComplexField(15, 13);
    const config: ExchangeCouplingConfig = { lambda: 2, boundaryCellIndex: 4, portCellIndex: 9 };

    const { psi: newPsi, chi: newChi } = applyExchangeCoupling(psi, chi, config, 0.05);

    for (let i = 0; i < psi.real.length; i++) {
      if (i === config.boundaryCellIndex) continue;
      expect(newPsi.real[i]).toBe(psi.real[i]);
      expect(newPsi.imag[i]).toBe(psi.imag[i]);
    }
    for (let m = 0; m < chi.real.length; m++) {
      if (m === config.portCellIndex) continue;
      expect(newChi.real[m]).toBe(chi.real[m]);
      expect(newChi.imag[m]).toBe(chi.imag[m]);
    }
  });

  it('lambda=0 is an exact no-op on both boundary and port cells (theta=0 -> identity rotation)', () => {
    const psi = randomComplexField(10, 21);
    const chi = randomComplexField(8, 23);
    const config: ExchangeCouplingConfig = { lambda: 0, boundaryCellIndex: 3, portCellIndex: 1 };

    const { psi: newPsi, chi: newChi } = applyExchangeCoupling(psi, chi, config, 0.5);

    expect(newPsi.real).toEqual(psi.real);
    expect(newPsi.imag).toEqual(psi.imag);
    expect(newChi.real).toEqual(chi.real);
    expect(newChi.imag).toEqual(chi.imag);
  });

  it('dt=0 is also an exact no-op regardless of lambda', () => {
    const psi = randomComplexField(10, 31);
    const chi = randomComplexField(8, 33);
    const config: ExchangeCouplingConfig = { lambda: 5, boundaryCellIndex: 2, portCellIndex: 0 };

    const { psi: newPsi, chi: newChi } = applyExchangeCoupling(psi, chi, config, 0);

    expect(newPsi.real).toEqual(psi.real);
    expect(newChi.real).toEqual(chi.real);
  });

  it('at theta=pi/2 (lambda*dt=pi/2), psi_b and chi_p exactly swap up to a factor of -i (a full quarter-turn Rabi flip)', () => {
    const psi: ComplexField = { real: Float64Array.from([2]), imag: Float64Array.from([1]) };
    const chi: ComplexField = { real: Float64Array.from([-3]), imag: Float64Array.from([0.5]) };
    const config: ExchangeCouplingConfig = { lambda: Math.PI / 2, boundaryCellIndex: 0, portCellIndex: 0 };

    const { psi: newPsi, chi: newChi } = applyExchangeCoupling(psi, chi, config, 1);

    // psi_b_new = -i*chi_p_old = -i*(-3+0.5i) = 0.5 + 3i
    expect(newPsi.real[0]).toBeCloseTo(0.5, 10);
    expect(newPsi.imag[0]).toBeCloseTo(3, 10);
    // chi_p_new = -i*psi_b_old = -i*(2+1i) = 1 - 2i
    expect(newChi.real[0]).toBeCloseTo(1, 10);
    expect(newChi.imag[0]).toBeCloseTo(-2, 10);
  });

  it('does not mutate the input fields', () => {
    const psi = randomComplexField(5, 41);
    const chi = randomComplexField(5, 43);
    const originalPsiReal = Float64Array.from(psi.real);
    const originalChiReal = Float64Array.from(chi.real);
    const config: ExchangeCouplingConfig = { lambda: 1, boundaryCellIndex: 1, portCellIndex: 1 };

    applyExchangeCoupling(psi, chi, config, 0.1);

    expect(psi.real).toEqual(originalPsiReal);
    expect(chi.real).toEqual(originalChiReal);
  });
});
