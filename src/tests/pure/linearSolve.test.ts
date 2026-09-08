import { describe, expect, it } from 'vitest';
import { luFactorize, luSolve } from '../../pure/field/linearSolve.ts';

describe('pure core dense LU solve', () => {
  it('solves a known 3x3 system exactly', () => {
    // [2 1 1] [x]   [4]
    // [1 3 2] [y] = [5]
    // [1 0 0] [z]   [6]
    // From row 3: x = 6. Substituting: row1: 12+y+z=4 -> y+z=-8. row2: 6+3y+2z=5 -> 3y+2z=-1.
    // From y+z=-8 -> z=-8-y. 3y+2(-8-y)=-1 -> 3y-16-2y=-1 -> y=15. z=-23.
    const a = Float64Array.from([2, 1, 1, 1, 3, 2, 1, 0, 0]);
    const b = Float64Array.from([4, 5, 6]);
    const lu = luFactorize(a, 3);
    const x = luSolve(lu, b);
    expect(x[0]).toBeCloseTo(6, 10);
    expect(x[1]).toBeCloseTo(15, 10);
    expect(x[2]).toBeCloseTo(-23, 10);
  });

  it('requires row swaps (pivoting) and still solves correctly', () => {
    // A tiny pivot at (0,0) forces a swap.
    const a = Float64Array.from([1e-20, 1, 1, 1]);
    const b = Float64Array.from([1, 3]);
    const lu = luFactorize(a, 2);
    const x = luSolve(lu, b);
    // 1e-20*x0 + x1 = 1 ; x0 + x1 = 3 -> x1 ~= 1, x0 ~= 2
    expect(x[1]).toBeCloseTo(1, 6);
    expect(x[0]).toBeCloseTo(2, 6);
  });

  it('solves the identity matrix trivially', () => {
    const n = 5;
    const a = new Float64Array(n * n);
    for (let i = 0; i < n; i++) a[i * n + i] = 1;
    const b = Float64Array.from([1, 2, 3, 4, 5]);
    const lu = luFactorize(a, n);
    const x = luSolve(lu, b);
    expect(Array.from(x)).toEqual([1, 2, 3, 4, 5]);
  });

  it('the same factorization can be reused for multiple right-hand sides', () => {
    const a = Float64Array.from([4, 3, 6, 3]);
    const lu = luFactorize(a, 2);
    const x1 = luSolve(lu, Float64Array.from([1, 2]));
    const x2 = luSolve(lu, Float64Array.from([10, 20]));
    // x2 should be exactly 10x x1 by linearity.
    expect(x2[0]).toBeCloseTo(x1[0] * 10, 8);
    expect(x2[1]).toBeCloseTo(x1[1] * 10, 8);
  });

  it('throws on a numerically singular matrix rather than returning garbage', () => {
    const a = Float64Array.from([1, 2, 2, 4]); // row2 = 2*row1
    expect(() => luFactorize(a, 2)).toThrow();
  });

  it('round-trips a random well-conditioned system for larger n', () => {
    const n = 16;
    const a = new Float64Array(n * n);
    // Diagonally dominant so the system is well-conditioned.
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        a[i * n + j] = Math.sin(i * 3.1 + j * 1.7) * 0.1;
      }
      a[i * n + i] = 10;
    }
    const xExpected = new Float64Array(n);
    for (let i = 0; i < n; i++) xExpected[i] = i - n / 2;

    // b = A*xExpected
    const b = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let j = 0; j < n; j++) sum += a[i * n + j] * xExpected[j];
      b[i] = sum;
    }

    const lu = luFactorize(a, n);
    const x = luSolve(lu, b);
    for (let i = 0; i < n; i++) {
      expect(x[i]).toBeCloseTo(xExpected[i], 8);
    }
  });
});
