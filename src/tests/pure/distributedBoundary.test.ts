import { describe, expect, it } from 'vitest';
import { createTorusGeometry, type ComplexField } from '../../pure/geometry/torus.ts';
import { computeNorm } from '../../pure/field/invariants.ts';
import { selectDistributedBoundary, applyDistributedExchangeCoupling } from '../../pure/world/distributedBoundary.ts';

function randomField(size: number, seedOffset: number): ComplexField {
  const real = new Float64Array(size);
  const imag = new Float64Array(size);
  for (let i = 0; i < size; i++) {
    real[i] = Math.sin(i * 0.7 + seedOffset);
    imag[i] = Math.cos(i * 0.41 + seedOffset * 1.3);
  }
  return { real, imag };
}

describe('pure core K13: selectDistributedBoundary (docs/vessel/K13-world-constitution-adr.md Choice 2)', () => {
  it('selects k pairs with distinct phi columns on each side, at the outer equator (theta closest to 0)', () => {
    const psiGeometry = createTorusGeometry({ R: 3, r: 1, N: 8 });
    const chiGeometry = createTorusGeometry({ R: 3, r: 1, N: 8 });
    const pairs = selectDistributedBoundary(psiGeometry, chiGeometry, 4);

    expect(pairs).toHaveLength(4);
    const psiIndices = pairs.map((p) => p.psiCellIndex);
    const chiIndices = pairs.map((p) => p.chiCellIndex);
    expect(new Set(psiIndices).size).toBe(4);
    expect(new Set(chiIndices).size).toBe(4);
  });

  it('same N, same R, same r: cell areas match automatically for every pair', () => {
    const psiGeometry = createTorusGeometry({ R: 3, r: 1, N: 8 });
    const chiGeometry = createTorusGeometry({ R: 3, r: 1, N: 8 });
    // Should not throw.
    const pairs = selectDistributedBoundary(psiGeometry, chiGeometry, 6);
    for (const pair of pairs) {
      expect(psiGeometry.cellArea[pair.psiCellIndex]).toBeCloseTo(chiGeometry.cellArea[pair.chiCellIndex], 15);
    }
  });

  it('throws when chi has a different N than psi (cell areas mismatch - ADR corrected floor)', () => {
    const psiGeometry = createTorusGeometry({ R: 3, r: 1, N: 8 });
    const chiGeometry = createTorusGeometry({ R: 3, r: 1, N: 16 });
    expect(() => selectDistributedBoundary(psiGeometry, chiGeometry, 4)).toThrow(/mismatched cell area/);
  });

  it('throws for k exceeding either geometry\'s N', () => {
    const psiGeometry = createTorusGeometry({ R: 3, r: 1, N: 4 });
    const chiGeometry = createTorusGeometry({ R: 3, r: 1, N: 8 });
    expect(() => selectDistributedBoundary(psiGeometry, chiGeometry, 5)).toThrow();
  });

  it('throws for a non-positive or non-integer k', () => {
    const g = createTorusGeometry({ R: 3, r: 1, N: 8 });
    expect(() => selectDistributedBoundary(g, g, 0)).toThrow();
    expect(() => selectDistributedBoundary(g, g, -1)).toThrow();
    expect(() => selectDistributedBoundary(g, g, 1.5)).toThrow();
  });
});

describe('pure core K13: applyDistributedExchangeCoupling (docs/vessel/K13-world-constitution-adr.md Choice 2)', () => {
  it('touches ONLY the paired cells - every other cell is unchanged', () => {
    const N = 8;
    const psiGeometry = createTorusGeometry({ R: 3, r: 1, N });
    const chiGeometry = createTorusGeometry({ R: 3, r: 1, N });
    const pairs = selectDistributedBoundary(psiGeometry, chiGeometry, 3);
    const psi = randomField(N * N, 1);
    const chi = randomField(N * N, 2);

    const result = applyDistributedExchangeCoupling(psi, chi, pairs, 0.5, 0.01);

    const psiTouched = new Set(pairs.map((p) => p.psiCellIndex));
    const chiTouched = new Set(pairs.map((p) => p.chiCellIndex));
    for (let i = 0; i < N * N; i++) {
      if (!psiTouched.has(i)) {
        expect(result.psi.real[i]).toBe(psi.real[i]);
        expect(result.psi.imag[i]).toBe(psi.imag[i]);
      }
      if (!chiTouched.has(i)) {
        expect(result.chi.real[i]).toBe(chi.real[i]);
        expect(result.chi.imag[i]).toBe(chi.imag[i]);
      }
    }
  });

  it('conserves total N = N_psi + N_chi exactly (disjoint unitary pairs compose to a unitary)', () => {
    const N = 8;
    const psiGeometry = createTorusGeometry({ R: 3, r: 1, N });
    const chiGeometry = createTorusGeometry({ R: 3, r: 1, N });
    const pairs = selectDistributedBoundary(psiGeometry, chiGeometry, 5);
    const psi = randomField(N * N, 3);
    const chi = randomField(N * N, 4);

    const nBefore = computeNorm(psi, psiGeometry) + computeNorm(chi, chiGeometry);
    const result = applyDistributedExchangeCoupling(psi, chi, pairs, 0.7, 0.01);
    const nAfter = computeNorm(result.psi, psiGeometry) + computeNorm(result.chi, chiGeometry);

    expect(nAfter).toBeCloseTo(nBefore, 12);
  });

  it('is order-independent (pairs touch disjoint cells, so applying them in any order gives the same result)', () => {
    const N = 8;
    const psiGeometry = createTorusGeometry({ R: 3, r: 1, N });
    const chiGeometry = createTorusGeometry({ R: 3, r: 1, N });
    const pairs = selectDistributedBoundary(psiGeometry, chiGeometry, 4);
    const reversedPairs = [...pairs].reverse();
    const psi = randomField(N * N, 5);
    const chi = randomField(N * N, 6);

    const forward = applyDistributedExchangeCoupling(psi, chi, pairs, 0.6, 0.02);
    const backward = applyDistributedExchangeCoupling(psi, chi, reversedPairs, 0.6, 0.02);

    expect(forward.psi.real).toEqual(backward.psi.real);
    expect(forward.psi.imag).toEqual(backward.psi.imag);
    expect(forward.chi.real).toEqual(backward.chi.real);
    expect(forward.chi.imag).toEqual(backward.chi.imag);
  });

  it('lambda=0 is a no-op (matches K5\'s own cutoff-control pattern)', () => {
    const N = 8;
    const psiGeometry = createTorusGeometry({ R: 3, r: 1, N });
    const chiGeometry = createTorusGeometry({ R: 3, r: 1, N });
    const pairs = selectDistributedBoundary(psiGeometry, chiGeometry, 4);
    const psi = randomField(N * N, 7);
    const chi = randomField(N * N, 8);

    const result = applyDistributedExchangeCoupling(psi, chi, pairs, 0, 0.01);

    expect(result.psi.real).toEqual(psi.real);
    expect(result.psi.imag).toEqual(psi.imag);
    expect(result.chi.real).toEqual(chi.real);
    expect(result.chi.imag).toEqual(chi.imag);
  });

  it('an empty pair list is a no-op', () => {
    const N = 8;
    const psi = randomField(N * N, 9);
    const chi = randomField(N * N, 10);
    const result = applyDistributedExchangeCoupling(psi, chi, [], 0.5, 0.01);
    expect(result.psi.real).toEqual(psi.real);
    expect(result.chi.real).toEqual(chi.real);
  });
});
