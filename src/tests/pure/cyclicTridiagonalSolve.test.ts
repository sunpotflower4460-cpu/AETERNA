import { describe, expect, it } from 'vitest';
import { solveComplexCyclicTridiagonal, type ComplexCyclicTridiagonalSystem, type ComplexVector } from '../../pure/field/cyclicTridiagonalSolve.ts';
import { createSeededRandom } from '../../pure/random/seededPrng.ts';

/**
 * Independent oracle: builds the FULL dense complex matrix from a cyclic
 * tridiagonal system and solves it via complex Gaussian elimination with
 * partial pivoting. Test-only - never used in production code. This is
 * a completely different algorithm from the Sherman-Morrison reduction
 * under test, so agreement is real evidence, not a tautology.
 */
function denseComplexOracle(system: ComplexCyclicTridiagonalSystem, rhsReal: Float64Array, rhsImag: Float64Array): ComplexVector {
  const n = system.diagReal.length;
  // Build augmented matrix as n x (n+1) complex entries, row-major.
  const width = n + 1;
  const matReal = new Float64Array(n * width);
  const matImag = new Float64Array(n * width);
  for (let i = 0; i < n; i++) {
    matReal[i * width + i] = system.diagReal[i];
    matImag[i * width + i] = system.diagImag[i];
    const upperCol = (i + 1) % n;
    matReal[i * width + upperCol] += system.upperReal[i];
    matImag[i * width + upperCol] += system.upperImag[i];
    const lowerCol = (i - 1 + n) % n;
    matReal[i * width + lowerCol] += system.lowerReal[i];
    matImag[i * width + lowerCol] += system.lowerImag[i];
    matReal[i * width + n] = rhsReal[i];
    matImag[i * width + n] = rhsImag[i];
  }

  const cMul = (ar: number, ai: number, br: number, bi: number): [number, number] => [ar * br - ai * bi, ar * bi + ai * br];
  const cDiv = (ar: number, ai: number, br: number, bi: number): [number, number] => {
    const denom = br * br + bi * bi;
    return [(ar * br + ai * bi) / denom, (ai * br - ar * bi) / denom];
  };

  for (let col = 0; col < n; col++) {
    // partial pivoting: find row with largest magnitude in this column, at or below `col`.
    let pivotRow = col;
    let pivotMag = Math.hypot(matReal[col * width + col], matImag[col * width + col]);
    for (let row = col + 1; row < n; row++) {
      const mag = Math.hypot(matReal[row * width + col], matImag[row * width + col]);
      if (mag > pivotMag) {
        pivotMag = mag;
        pivotRow = row;
      }
    }
    if (pivotRow !== col) {
      for (let k = 0; k < width; k++) {
        const tr = matReal[col * width + k];
        matReal[col * width + k] = matReal[pivotRow * width + k];
        matReal[pivotRow * width + k] = tr;
        const ti = matImag[col * width + k];
        matImag[col * width + k] = matImag[pivotRow * width + k];
        matImag[pivotRow * width + k] = ti;
      }
    }

    const pr = matReal[col * width + col], pi = matImag[col * width + col];
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const fr = matReal[row * width + col], fi = matImag[row * width + col];
      if (fr === 0 && fi === 0) continue;
      const [factorR, factorI] = cDiv(fr, fi, pr, pi);
      for (let k = col; k < width; k++) {
        const [subR, subI] = cMul(factorR, factorI, matReal[col * width + k], matImag[col * width + k]);
        matReal[row * width + k] -= subR;
        matImag[row * width + k] -= subI;
      }
    }
  }

  const xReal = new Float64Array(n);
  const xImag = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const [xr, xi] = cDiv(matReal[i * width + n], matImag[i * width + n], matReal[i * width + i], matImag[i * width + i]);
    xReal[i] = xr;
    xImag[i] = xi;
  }
  return { real: xReal, imag: xImag };
}

function randomCyclicSystem(n: number, seed: number): ComplexCyclicTridiagonalSystem {
  const random = createSeededRandom(seed);
  const rand = () => (random() - 0.5) * 2;
  return {
    lowerReal: Float64Array.from({ length: n }, () => rand()),
    lowerImag: Float64Array.from({ length: n }, () => rand()),
    diagReal: Float64Array.from({ length: n }, () => rand() + 3), // biased away from 0 for a well-conditioned system
    diagImag: Float64Array.from({ length: n }, () => rand()),
    upperReal: Float64Array.from({ length: n }, () => rand()),
    upperImag: Float64Array.from({ length: n }, () => rand()),
  };
}

describe('pure core K9 complex cyclic tridiagonal solver: agreement with an independent dense oracle', () => {
  it.each([2, 3, 4, 5, 8, 16, 32])('matches dense complex Gaussian elimination for a random system (n=%i)', (n) => {
    const system = randomCyclicSystem(n, n + 1000);
    const random = createSeededRandom(n + 2000);
    const rhsReal = Float64Array.from({ length: n }, () => random() - 0.5);
    const rhsImag = Float64Array.from({ length: n }, () => random() - 0.5);

    const fast = solveComplexCyclicTridiagonal(system, rhsReal, rhsImag);
    const oracle = denseComplexOracle(system, rhsReal, rhsImag);

    for (let i = 0; i < n; i++) {
      expect(fast.real[i]).toBeCloseTo(oracle.real[i], 8);
      expect(fast.imag[i]).toBeCloseTo(oracle.imag[i], 8);
    }
  });

  it('substituting the solution back into the original system reproduces the RHS (n=8)', () => {
    const n = 8;
    const system = randomCyclicSystem(n, 55);
    const random = createSeededRandom(56);
    const rhsReal = Float64Array.from({ length: n }, () => random() - 0.5);
    const rhsImag = Float64Array.from({ length: n }, () => random() - 0.5);

    const x = solveComplexCyclicTridiagonal(system, rhsReal, rhsImag);

    for (let i = 0; i < n; i++) {
      const upperCol = (i + 1) % n;
      const lowerCol = (i - 1 + n) % n;
      const re =
        system.diagReal[i] * x.real[i] - system.diagImag[i] * x.imag[i] +
        system.upperReal[i] * x.real[upperCol] - system.upperImag[i] * x.imag[upperCol] +
        system.lowerReal[i] * x.real[lowerCol] - system.lowerImag[i] * x.imag[lowerCol];
      const im =
        system.diagReal[i] * x.imag[i] + system.diagImag[i] * x.real[i] +
        system.upperReal[i] * x.imag[upperCol] + system.upperImag[i] * x.real[upperCol] +
        system.lowerReal[i] * x.imag[lowerCol] + system.lowerImag[i] * x.real[lowerCol];
      expect(re).toBeCloseTo(rhsReal[i], 8);
      expect(im).toBeCloseTo(rhsImag[i], 8);
    }
  });

  it('throws for n < 2', () => {
    const system: ComplexCyclicTridiagonalSystem = {
      lowerReal: new Float64Array(1), lowerImag: new Float64Array(1),
      diagReal: Float64Array.from([1]), diagImag: new Float64Array(1),
      upperReal: new Float64Array(1), upperImag: new Float64Array(1),
    };
    expect(() => solveComplexCyclicTridiagonal(system, Float64Array.from([1]), new Float64Array(1))).toThrow();
  });
});
