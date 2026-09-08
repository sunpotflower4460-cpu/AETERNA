import { describe, expect, it } from 'vitest';
import type { ComplexField } from '../../pure/geometry/torus.ts';
import { applyRingShift } from '../../pure/exchange/ringShiftStep.ts';

describe('pure core exchange ring: exact cyclic shift (docs/vessel/K5-exchange-medium-adr.md choice 1)', () => {
  it('shifts values forward by shiftCellsPerTick cells exactly, with wraparound', () => {
    const chi: ComplexField = { real: Float64Array.from([1, 2, 3, 4, 5]), imag: Float64Array.from([10, 20, 30, 40, 50]) };
    const shifted = applyRingShift(chi, 2);
    // value that was at index m moves to index (m+2)%5
    expect(Array.from(shifted.real)).toEqual([4, 5, 1, 2, 3]);
    expect(Array.from(shifted.imag)).toEqual([40, 50, 10, 20, 30]);
  });

  it('shift of 0 leaves the field exactly unchanged', () => {
    const chi: ComplexField = { real: Float64Array.from([1, 2, 3]), imag: Float64Array.from([4, 5, 6]) };
    const shifted = applyRingShift(chi, 0);
    expect(Array.from(shifted.real)).toEqual([1, 2, 3]);
    expect(Array.from(shifted.imag)).toEqual([4, 5, 6]);
  });

  it('shifting M times by 1 cell returns the exact original field (a full round trip)', () => {
    const M = 7;
    const chi: ComplexField = { real: Float64Array.from({ length: M }, (_, i) => i + 0.5), imag: Float64Array.from({ length: M }, (_, i) => -i) };
    let current = chi;
    for (let tick = 0; tick < M; tick++) {
      current = applyRingShift(current, 1);
    }
    expect(Array.from(current.real)).toEqual(Array.from(chi.real));
    expect(Array.from(current.imag)).toEqual(Array.from(chi.imag));
  });

  it('a pulse injected at cell 0 reappears at cell 0 after exactly M/shiftCellsPerTick ticks, and nowhere else in between', () => {
    const M = 12;
    const shiftCellsPerTick = 3;
    const roundTripTicks = M / shiftCellsPerTick; // exact integer by construction (12/3=4)
    let chi: ComplexField = { real: new Float64Array(M), imag: new Float64Array(M) };
    chi.real[0] = 1;

    for (let tick = 1; tick <= roundTripTicks; tick++) {
      chi = applyRingShift(chi, shiftCellsPerTick);
      const pulseIndex = (tick * shiftCellsPerTick) % M;
      if (tick < roundTripTicks) {
        expect(chi.real[0]).toBe(0); // not back yet
        expect(chi.real[pulseIndex]).toBe(1);
      } else {
        expect(chi.real[0]).toBe(1); // exact round trip
      }
    }
  });

  it('does not mutate the input field', () => {
    const chi: ComplexField = { real: Float64Array.from([1, 2, 3]), imag: Float64Array.from([4, 5, 6]) };
    const beforeReal = Array.from(chi.real);
    applyRingShift(chi, 1);
    expect(Array.from(chi.real)).toEqual(beforeReal);
  });

  it('throws for a negative or non-integer shift', () => {
    const chi: ComplexField = { real: Float64Array.from([1, 2, 3]), imag: new Float64Array(3) };
    expect(() => applyRingShift(chi, -1)).toThrow();
    expect(() => applyRingShift(chi, 1.5)).toThrow();
  });
});
