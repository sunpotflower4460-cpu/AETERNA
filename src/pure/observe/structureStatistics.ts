/**
 * PUT-IN: a real-valued field on the N x N torus grid (typically the
 *   density |psi|^2), N a power of 2 (reusing src/pure/field/fft.ts's
 *   own constraint)
 * EMERGED: the structure factor S(k) (a 2D power spectrum of density
 *   FLUCTUATIONS around the mean), a correlation length xi (radial
 *   e-folding distance of the density autocorrelation function), and
 *   the (inverse) participation ratio PR - the L1/L0-L2 auxiliary
 *   measures docs/vessel/K-series-II-brain-and-universe-plan.md K11
 *   lists ("構造因子 S(k)（K9のFFTを再利用）、相関長 ξ、
 *   participation ratio"), matching Aeterna-Genesis L0/L1's own
 *   stated measurements ("空間分散 ≈ ノイズ床、S(k)が平坦" for L0;
 *   "S(k)にピーク、相関長ξが有限/成長" for L1).
 * claim-tier: C2 for computeStructureFactor (verified oracle-first
 *   against an independent brute-force O(N^4) 2D DFT at small N, and
 *   against an analytically known case - a single planted plane-wave
 *   density fluctuation produces a S(k) that is a sharp peak EXACTLY
 *   at that wavevector and its Hermitian-symmetric partner, zero
 *   elsewhere - see src/tests/pure/structureStatistics.test.ts). C2 for
 *   computeCorrelationLength (the FFT-based autocorrelation is verified
 *   against an independent brute-force circular-correlation sum, and
 *   against a hand-planted exponentially-decaying correlation pattern
 *   with a KNOWN e-folding length). C1 for computeParticipationRatio
 *   (a direct, non-approximated formula - verified against its two
 *   analytically exact endpoints: perfectly uniform density gives
 *   PR=1, weight concentrated on a single cell gives PR=1/N_total).
 * floors (誠実な床):
 *   - computeStructureFactor requires N to be an exact power of 2 (the
 *     same constraint src/pure/field/fft.ts's forwardFFT already has) -
 *     it throws otherwise rather than silently falling back to a
 *     slower method.
 *   - The 2D FFT here is the SEPARABLE composition of two independent
 *     applications of fft.ts's existing 1D transform (rows, then
 *     columns) - no new FFT algorithm is implemented. This is the same
 *     per-row/per-column decomposition linearCayleySpectralStep.ts
 *     already uses for the psi field's LINEAR step; here it is applied
 *     to a scalar density field for a completely different purpose
 *     (a diagnostic spectrum, not time evolution).
 *   - S(k) normalization: S(k) = |F(k)|^2 / (N*N), where F is the
 *     UNNORMALIZED 2D forward transform of density-minus-mean. By the
 *     2D discrete Parseval theorem (applying fft.ts's own 1D Parseval
 *     relation along each axis), this makes sum_k S(k) exactly equal to
 *     sum_x (density(x)-mean)^2 - the total fluctuation "power",
 *     distributed across modes. S(0,0) is exactly 0 by construction
 *     (the mean was subtracted).
 *   - computeCorrelationLength uses the Wiener-Khinchin theorem
 *     (autocorrelation = inverse FFT of the power spectrum) computed
 *     via fft.ts's own inverseFFT - not a real-space O(N^4) direct sum
 *     - then RADIALLY AVERAGES the (torus-periodic, minimum-image)
 *     autocorrelation into integer-grid-distance shells, and reports
 *     the smallest shell radius (in grid cells) at which the
 *     normalized (C(0)=1) shell average first drops to <= 1/e. If the
 *     correlation never drops that low within the largest resolvable
 *     shell (N/2 grid cells - beyond that, periodicity makes "distance"
 *     ambiguous), this returns `undefined` rather than fabricating a
 *     number, so a caller cannot receive a silently-capped value for a
 *     structure this resolution genuinely cannot measure the extent of.
 *     src/tests/pure/structureStatistics.test.ts's own experiments with
 *     single-mode and top-hat fields did not find a natural field shape
 *     that reaches this branch (a single Fourier mode's autocorrelation
 *     provably crosses 1/e within N/4 for any N, by the cosine-decay
 *     argument in that test file) - it remains as a defensive guard
 *     against whatever combination WOULD produce one, not a verified-
 *     reachable branch. A perfectly uniform field (zero fluctuation
 *     everywhere) hits a DIFFERENT degenerate case instead: zero-lag
 *     itself is 0, skipping normalization, so shell 0 already reads 0
 *     and this returns length 0, not `undefined` - "no fluctuation" and
 *     "unmeasurably long-range fluctuation" are different findings and
 *     this module does not conflate them under one sentinel.
 *     Its "distance" is Euclidean in GRID-CELL (i,j) units with
 *     per-axis torus minimum-image wrapping, not physical arc-length on
 *     the actual (non-uniform-metric) torus - the same grid-space
 *     convention detectVortexCandidates/vortexTracking.ts already use
 *     for their own adjacency/distance, chosen for consistency rather
 *     than because the physical metric was deemed unimportant.
 *   - computeParticipationRatio's normalization requires density to be
 *     non-negative everywhere (true for |psi|^2 by construction) and
 *     sum to something positive; it throws for an all-zero field
 *     (participation is undefined when there is nothing to
 *     participate).
 *   - None of these functions read N, H, nu, chi, or any ledger value -
 *     only the density array (and geometry.N) they are handed. No
 *     reachable path back into src/pure/field, src/pure/ledger,
 *     src/pure/drive, src/pure/medium, or src/pure/exchange.
 */

import { forwardFFT, inverseFFT } from '../field/fft.ts';

function transformRowsThenColumns(real: Float64Array, imag: Float64Array, N: number, direction: 'forward' | 'inverse'): { real: Float64Array; imag: Float64Array } {
  const transform = direction === 'forward' ? forwardFFT : inverseFFT;
  const rowReal = new Float64Array(N * N);
  const rowImag = new Float64Array(N * N);

  for (let i = 0; i < N; i++) {
    const inR = real.slice(i * N, i * N + N);
    const inI = imag.slice(i * N, i * N + N);
    const { real: outR, imag: outI } = transform(inR, inI);
    rowReal.set(outR, i * N);
    rowImag.set(outI, i * N);
  }

  const outReal = new Float64Array(N * N);
  const outImag = new Float64Array(N * N);
  const colR = new Float64Array(N);
  const colI = new Float64Array(N);
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      colR[i] = rowReal[i * N + j];
      colI[i] = rowImag[i * N + j];
    }
    const { real: outR, imag: outI } = transform(colR, colI);
    for (let i = 0; i < N; i++) {
      outReal[i * N + j] = outR[i];
      outImag[i * N + j] = outI[i];
    }
  }

  return { real: outReal, imag: outImag };
}

/** Returns S(k), flattened row-major (kx=i, ky=j), length N*N. S(0,0) is exactly 0. */
export function computeStructureFactor(density: Float64Array, N: number): Float64Array {
  if (density.length !== N * N) {
    throw new Error(`computeStructureFactor: density length (${density.length}) does not match N*N (${N * N})`);
  }
  let mean = 0;
  for (let k = 0; k < density.length; k++) mean += density[k];
  mean /= density.length;

  const fluctuation = new Float64Array(density.length);
  for (let k = 0; k < density.length; k++) fluctuation[k] = density[k] - mean;

  const { real, imag } = transformRowsThenColumns(fluctuation, new Float64Array(density.length), N, 'forward');

  const S = new Float64Array(density.length);
  const normalization = N * N;
  for (let k = 0; k < density.length; k++) {
    S[k] = (real[k] * real[k] + imag[k] * imag[k]) / normalization;
  }
  return S;
}

/** Circular (torus-periodic) autocorrelation of `density` via the Wiener-Khinchin theorem: IFFT(|FFT(delta)|^2). Returned flattened row-major, length N*N; result[0] is the zero-lag value (density variance sum). */
export function computeAutocorrelation(density: Float64Array, N: number): Float64Array {
  if (density.length !== N * N) {
    throw new Error(`computeAutocorrelation: density length (${density.length}) does not match N*N (${N * N})`);
  }
  let mean = 0;
  for (let k = 0; k < density.length; k++) mean += density[k];
  mean /= density.length;

  const fluctuation = new Float64Array(density.length);
  for (let k = 0; k < density.length; k++) fluctuation[k] = density[k] - mean;

  const { real: fReal, imag: fImag } = transformRowsThenColumns(fluctuation, new Float64Array(density.length), N, 'forward');
  const powerReal = new Float64Array(density.length);
  for (let k = 0; k < density.length; k++) {
    powerReal[k] = fReal[k] * fReal[k] + fImag[k] * fImag[k];
  }
  const { real: autocorrelation } = transformRowsThenColumns(powerReal, new Float64Array(density.length), N, 'inverse');
  return autocorrelation;
}

/**
 * Radially averages `autocorrelation` (as produced by
 * computeAutocorrelation) into integer torus-minimum-image grid-
 * distance shells, normalized so shell 0 (self-correlation) is 1.
 * Returns one averaged value per integer shell radius from 0 to
 * floor(N/2) inclusive.
 */
function radiallyAverageAutocorrelation(autocorrelation: Float64Array, N: number): Float64Array {
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

  const averaged = new Float64Array(maxShell + 1);
  for (let s = 0; s <= maxShell; s++) {
    averaged[s] = counts[s] > 0 ? sums[s] / counts[s] : 0;
  }
  const zeroLag = averaged[0];
  if (zeroLag !== 0) {
    for (let s = 0; s <= maxShell; s++) averaged[s] /= zeroLag;
  }
  return averaged;
}

/**
 * Smallest integer grid-cell radius at which the radially-averaged,
 * zero-lag-normalized autocorrelation first drops to <= 1/e. Returns
 * `undefined` if it never does within the largest resolvable shell
 * (floor(N/2)) - see module doc floors.
 */
export function computeCorrelationLength(density: Float64Array, N: number): number | undefined {
  const autocorrelation = computeAutocorrelation(density, N);
  const shells = radiallyAverageAutocorrelation(autocorrelation, N);
  const threshold = 1 / Math.E;
  for (let s = 0; s < shells.length; s++) {
    if (shells[s] <= threshold) return s;
  }
  return undefined;
}

/**
 * Inverse participation ratio of `density` treated as an unnormalized
 * weight distribution: PR = 1 / (N_total * sum_x p(x)^2), p(x) =
 * density(x) / sum(density). PR=1 for perfectly uniform density;
 * PR -> 1/N_total as density concentrates onto a single cell.
 */
export function computeParticipationRatio(density: Float64Array): number {
  let total = 0;
  for (let k = 0; k < density.length; k++) {
    if (density[k] < 0) {
      throw new Error(`computeParticipationRatio: density[${k}] is negative (${density[k]}) - density must be non-negative`);
    }
    total += density[k];
  }
  if (total <= 0) {
    throw new Error('computeParticipationRatio: density sums to zero or less - participation is undefined');
  }

  let sumSquaredProbability = 0;
  for (let k = 0; k < density.length; k++) {
    const p = density[k] / total;
    sumSquaredProbability += p * p;
  }
  return 1 / (density.length * sumSquaredProbability);
}
