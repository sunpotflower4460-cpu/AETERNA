import { describe, expect, it } from 'vitest';
import { computeStructureFactor, computeAutocorrelation, computeCorrelationLength, computeParticipationRatio } from '../../pure/observe/structureStatistics.ts';

/** Independent brute-force 2D DFT power spectrum, O(N^4), for oracle comparison. */
function bruteForceStructureFactor(density: Float64Array, N: number): Float64Array {
  let mean = 0;
  for (let k = 0; k < density.length; k++) mean += density[k];
  mean /= density.length;

  const S = new Float64Array(N * N);
  for (let kx = 0; kx < N; kx++) {
    for (let ky = 0; ky < N; ky++) {
      let re = 0;
      let im = 0;
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
          const angle = (-2 * Math.PI * (kx * i + ky * j)) / N;
          const delta = density[i * N + j] - mean;
          re += delta * Math.cos(angle);
          im += delta * Math.sin(angle);
        }
      }
      S[kx * N + ky] = (re * re + im * im) / (N * N);
    }
  }
  return S;
}

/** Independent brute-force circular autocorrelation, O(N^4), for oracle comparison. */
function bruteForceAutocorrelation(density: Float64Array, N: number): Float64Array {
  let mean = 0;
  for (let k = 0; k < density.length; k++) mean += density[k];
  mean /= density.length;
  const delta = new Float64Array(density.length);
  for (let k = 0; k < density.length; k++) delta[k] = density[k] - mean;

  const C = new Float64Array(N * N);
  for (let ri = 0; ri < N; ri++) {
    for (let rj = 0; rj < N; rj++) {
      let sum = 0;
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
          const i2 = (i + ri) % N;
          const j2 = (j + rj) % N;
          sum += delta[i * N + j] * delta[i2 * N + j2];
        }
      }
      C[ri * N + rj] = sum;
    }
  }
  return C;
}

function planeWaveDensity(N: number, kx: number, ky: number, amplitude: number, background: number): Float64Array {
  const density = new Float64Array(N * N);
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      density[i * N + j] = background + amplitude * Math.cos((2 * Math.PI * (kx * i + ky * j)) / N);
    }
  }
  return density;
}

describe('pure core K11 (L0/L1 aux): structure factor S(k)', () => {
  it('matches an independent brute-force 2D DFT power spectrum at N=8 for a random-looking hand-built field', () => {
    const N = 8;
    const density = Float64Array.from({ length: N * N }, (_, k) => 1 + 0.3 * Math.sin(k) + 0.1 * Math.cos(3 * k));
    const fast = computeStructureFactor(density, N);
    const brute = bruteForceStructureFactor(density, N);
    for (let k = 0; k < fast.length; k++) {
      expect(fast[k]).toBeCloseTo(brute[k], 8);
    }
  });

  it('a perfectly uniform field has S(k) exactly zero everywhere', () => {
    const N = 8;
    const density = new Float64Array(N * N).fill(2.5);
    const S = computeStructureFactor(density, N);
    for (const value of S) {
      expect(value).toBeCloseTo(0, 10);
    }
  });

  it('a single planted plane-wave fluctuation produces S(k) sharply peaked exactly at that wavevector (and its Hermitian mirror), ~zero elsewhere', () => {
    const N = 16;
    const kx0 = 3;
    const ky0 = 5;
    const amplitude = 2;
    const density = planeWaveDensity(N, kx0, ky0, amplitude, 10);
    const S = computeStructureFactor(density, N);

    // cos(theta) = (e^{i theta}+e^{-i theta})/2 -> two peaks, each of "mass" (amplitude/2)^2 * N^2 by Parseval.
    const expectedPeak = ((amplitude / 2) ** 2) * N * N;
    const mirrorKx = (N - kx0) % N;
    const mirrorKy = (N - ky0) % N;

    expect(S[kx0 * N + ky0]).toBeCloseTo(expectedPeak, 6);
    expect(S[mirrorKx * N + mirrorKy]).toBeCloseTo(expectedPeak, 6);

    let totalElsewhere = 0;
    for (let k = 0; k < S.length; k++) {
      if (k !== kx0 * N + ky0 && k !== mirrorKx * N + mirrorKy) totalElsewhere += S[k];
    }
    expect(totalElsewhere).toBeCloseTo(0, 6);
  });

  it('throws when density length does not match N*N', () => {
    expect(() => computeStructureFactor(new Float64Array(10), 4)).toThrow();
  });
});

describe('pure core K11 (L1) aux: autocorrelation via Wiener-Khinchin', () => {
  it('matches an independent brute-force circular autocorrelation at N=8', () => {
    const N = 8;
    const density = Float64Array.from({ length: N * N }, (_, k) => 1 + 0.4 * Math.sin(1.7 * k) - 0.2 * Math.cos(2.3 * k));
    const fast = computeAutocorrelation(density, N);
    const brute = bruteForceAutocorrelation(density, N);
    for (let k = 0; k < fast.length; k++) {
      expect(fast[k]).toBeCloseTo(brute[k], 6);
    }
  });
});

/**
 * Reference re-implementation of computeCorrelationLength's documented
 * algorithm (radial Euclidean-distance shell averaging of the
 * ALREADY ORACLE-VERIFIED computeAutocorrelation output, normalized by
 * zero-lag, first shell where the average is <= 1/e) built directly
 * from computeAutocorrelation rather than from a closed-form physical
 * formula - because for a field varying along only ONE grid axis, the
 * 2D radial shells mix offsets from BOTH axes (e.g. shell r=3 groups
 * (di,dj)=(3,0) with (0,3) and others), so a naive 1D cos(2*pi*r/N)
 * decay model does NOT predict the actual 2D radially-averaged curve.
 * This is NOT an independent physical derivation - it deliberately
 * reimplements the same documented shell-averaging/threshold algorithm
 * as computeCorrelationLength, so it mainly guards against composition
 * bugs (a wrong shell index, wrong normalization order, an off-by-one
 * in the loop bound) and regressions, not against an error shared by
 * both the module doc's description and this reimplementation. The
 * part that IS independently checked is the correlation VALUES
 * themselves: computeAutocorrelation is oracle-verified against a
 * brute-force circular correlation sum above.
 */
function referenceCorrelationLength(density: Float64Array, N: number): number | undefined {
  const autocorrelation = computeAutocorrelation(density, N);
  const maxShell = Math.floor(N / 2);
  const sums = new Float64Array(maxShell + 1);
  const counts = new Float64Array(maxShell + 1);
  for (let i = 0; i < N; i++) {
    const di = Math.min(i, N - i);
    for (let j = 0; j < N; j++) {
      const dj = Math.min(j, N - j);
      const shell = Math.round(Math.hypot(di, dj));
      if (shell <= maxShell) {
        sums[shell] += autocorrelation[i * N + j];
        counts[shell] += 1;
      }
    }
  }
  const averaged = Array.from({ length: maxShell + 1 }, (_, s) => (counts[s] > 0 ? sums[s] / counts[s] : 0));
  const zeroLag = averaged[0];
  const normalized = zeroLag !== 0 ? averaged.map((v) => v / zeroLag) : averaged;
  const threshold = 1 / Math.E;
  for (let s = 0; s < normalized.length; s++) {
    if (normalized[s] <= threshold) return s;
  }
  return undefined;
}

describe('pure core K11 (L1) aux: correlation length xi', () => {
  it('for a single plane-wave mode, the crossing shell matches a reference computation built from the (separately oracle-verified) autocorrelation values', () => {
    const N = 32;
    const kx0 = 1;
    const density = planeWaveDensity(N, kx0, 0, 3, 10);
    const result = computeCorrelationLength(density, N);
    const expectedShell = referenceCorrelationLength(density, N);

    expect(result).toBe(expectedShell);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(N / 2);
  });

  it('a perfectly uniform field (no fluctuation) reports length 0 - a degenerate "nothing to correlate" case, distinct from undefined', () => {
    const N = 16;
    const density = new Float64Array(N * N).fill(3);
    expect(computeCorrelationLength(density, N)).toBe(0);
  });

  it('is deterministic across repeated calls', () => {
    const N = 16;
    const density = planeWaveDensity(N, 2, 1, 1.5, 5);
    expect(computeCorrelationLength(density, N)).toBe(computeCorrelationLength(density, N));
  });
});

describe('pure core K11 (L1) aux: participation ratio', () => {
  it('a perfectly uniform density has participation ratio exactly 1 (fully delocalized)', () => {
    const N = 10;
    const density = new Float64Array(N * N).fill(4);
    expect(computeParticipationRatio(density)).toBeCloseTo(1, 10);
  });

  it('weight concentrated entirely on one cell has participation ratio exactly 1/N_total (maximally localized)', () => {
    const N = 10;
    const density = new Float64Array(N * N);
    density[42] = 7;
    expect(computeParticipationRatio(density)).toBeCloseTo(1 / (N * N), 10);
  });

  it('an intermediate case falls strictly between the two extremes', () => {
    const N = 10;
    const density = new Float64Array(N * N).fill(0.1);
    density[0] = 5;
    density[1] = 5;
    const pr = computeParticipationRatio(density);
    expect(pr).toBeGreaterThan(1 / (N * N));
    expect(pr).toBeLessThan(1);
  });

  it('throws for an all-zero density', () => {
    expect(() => computeParticipationRatio(new Float64Array(16))).toThrow();
  });

  it('throws for a negative density value', () => {
    const density = new Float64Array(16).fill(1);
    density[3] = -0.1;
    expect(() => computeParticipationRatio(density)).toThrow();
  });
});
