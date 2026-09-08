import { describe, expect, it } from 'vitest';
import { createTorusGeometry, weightedInnerProduct, weightedNormSquared } from '../../pure/geometry/torus.ts';

describe('pure core torus geometry', () => {
  it('every cell area is strictly positive', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 16 });
    for (const area of geometry.cellArea) {
      expect(area).toBeGreaterThan(0);
      expect(Number.isFinite(area)).toBe(true);
    }
  });

  it.each([4, 8, 16, 33])(
    'total area matches the exact torus surface area 4*pi^2*R*r for N=%i (midpoint-rule cosine sum vanishes exactly)',
    (N) => {
      const R = 3;
      const r = 1;
      const geometry = createTorusGeometry({ R, r, N });
      const analytic = 4 * Math.PI * Math.PI * R * r;
      expect(geometry.totalArea).toBeCloseTo(analytic, 9);
    },
  );

  it('rejects a non-torus (r >= R) or degenerate (N < 2) configuration', () => {
    expect(() => createTorusGeometry({ R: 1, r: 1, N: 8 })).toThrow();
    expect(() => createTorusGeometry({ R: 1, r: 2, N: 8 })).toThrow();
    expect(() => createTorusGeometry({ R: 3, r: 1, N: 1 })).toThrow();
    expect(() => createTorusGeometry({ R: 3, r: 1, N: 3.5 })).toThrow();
  });

  it('weightedInnerProduct is conjugate-symmetric: <a,b> = conj(<b,a>)', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 4 });
    const size = geometry.N * geometry.N;
    const a = { real: new Float64Array(size), imag: new Float64Array(size) };
    const b = { real: new Float64Array(size), imag: new Float64Array(size) };
    for (let i = 0; i < size; i++) {
      a.real[i] = Math.sin(i * 0.7);
      a.imag[i] = Math.cos(i * 0.3);
      b.real[i] = Math.cos(i * 0.5);
      b.imag[i] = Math.sin(i * 0.9);
    }
    const ab = weightedInnerProduct(a, b, geometry);
    const ba = weightedInnerProduct(b, a, geometry);
    expect(ab.real).toBeCloseTo(ba.real, 12);
    expect(ab.imag).toBeCloseTo(-ba.imag, 12);
  });

  it('weightedNormSquared matches the real part of the self inner product and is non-negative', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 4 });
    const size = geometry.N * geometry.N;
    const a = { real: new Float64Array(size), imag: new Float64Array(size) };
    for (let i = 0; i < size; i++) {
      a.real[i] = i % 3 === 0 ? 0.4 : -0.2;
      a.imag[i] = i % 2 === 0 ? 0.1 : -0.3;
    }
    const normSquared = weightedNormSquared(a, geometry);
    const selfInner = weightedInnerProduct(a, a, geometry);
    expect(normSquared).toBeGreaterThan(0);
    expect(normSquared).toBeCloseTo(selfInner.real, 12);
    expect(selfInner.imag).toBeCloseTo(0, 12);
  });
});
