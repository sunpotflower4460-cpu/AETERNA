/**
 * PUT-IN: a complex signal (real, imag), length a power of 2
 * EMERGED: the forward or inverse discrete Fourier transform of that
 *   signal, computed by an iterative radix-2 Cooley-Tukey FFT
 * claim-tier: C3 (analytically validated - a textbook algorithm, not a
 *   new derivation; correctness is checked against a direct O(N^2) DFT
 *   evaluation and known analytic transform pairs in
 *   src/tests/pure/fft.test.ts, not merely asserted)
 * floors (誠実な床): radix-2 only - N must be an exact power of 2 (this
 *   is a K9 design choice, see docs/vessel/K-series-II-brain-and-
 *   universe-plan.md's K9 section: linearSolverKind='spectral'
 *   constrains N to powers of 2 for this reason). No SIMD/parallel
 *   reduction path exists - the operation order is fixed (bit-reversal
 *   then log2(N) butterfly stages, each stage's twiddle factors computed
 *   in increasing k order), which is what makes the result bit-
 *   reproducible across runs on the same engine (docs/vessel/K-series-
 *   II-brain-and-universe-plan.md K15's determinism scope note applies
 *   here too: bit-exact on one engine/version, tolerance-exact across
 *   engines, since Math.cos/sin implementations can differ in their
 *   last bit).
 *
 * ## なぜこの変換規約か
 *
 * forward: X_k = sum_j x_j * exp(-i*2*pi*j*k/N)  (正規化なし)
 * inverse: x_j = (1/N) * sum_k X_k * exp(+i*2*pi*j*k/N)
 *
 * forwardThenInverse(x) = x を代数的に保証する規約（正規化を逆変換側に
 * 寄せる、標準的な選択）。src/pure/field/linearCayleySpectralStep.ts が
 * この規約に依存する。
 */

function bitReverse(value: number, bits: number): number {
  let result = 0;
  let x = value;
  for (let i = 0; i < bits; i++) {
    result = (result << 1) | (x & 1);
    x >>= 1;
  }
  return result;
}

function log2Exact(n: number): number {
  if (!Number.isInteger(n) || n < 1 || (n & (n - 1)) !== 0) {
    throw new Error(`fft: length must be a power of 2, got ${n}`);
  }
  return Math.log2(n);
}

/**
 * In-place iterative radix-2 FFT. `invert=false` computes the forward
 * transform (unnormalized); `invert=true` computes the inverse transform
 * (normalized by 1/N). Mutates `real`/`imag` directly.
 */
export function fftInPlace(real: Float64Array, imag: Float64Array, invert: boolean): void {
  const n = real.length;
  if (imag.length !== n) {
    throw new Error(`fftInPlace: real length (${n}) does not match imag length (${imag.length})`);
  }
  const bits = log2Exact(n);

  for (let i = 0; i < n; i++) {
    const j = bitReverse(i, bits);
    if (j > i) {
      const tr = real[i];
      real[i] = real[j];
      real[j] = tr;
      const ti = imag[i];
      imag[i] = imag[j];
      imag[j] = ti;
    }
  }

  for (let len = 2; len <= n; len <<= 1) {
    const half = len / 2;
    const angleStep = ((invert ? 2 : -2) * Math.PI) / len;
    for (let start = 0; start < n; start += len) {
      for (let k = 0; k < half; k++) {
        const angle = angleStep * k;
        const wr = Math.cos(angle);
        const wi = Math.sin(angle);
        const evenIdx = start + k;
        const oddIdx = start + k + half;
        const tr = real[oddIdx] * wr - imag[oddIdx] * wi;
        const ti = real[oddIdx] * wi + imag[oddIdx] * wr;
        real[oddIdx] = real[evenIdx] - tr;
        imag[oddIdx] = imag[evenIdx] - ti;
        real[evenIdx] += tr;
        imag[evenIdx] += ti;
      }
    }
  }

  if (invert) {
    for (let i = 0; i < n; i++) {
      real[i] /= n;
      imag[i] /= n;
    }
  }
}

/** Non-mutating forward FFT: returns new arrays, input is untouched. */
export function forwardFFT(real: Float64Array, imag: Float64Array): { real: Float64Array; imag: Float64Array } {
  const outReal = Float64Array.from(real);
  const outImag = Float64Array.from(imag);
  fftInPlace(outReal, outImag, false);
  return { real: outReal, imag: outImag };
}

/** Non-mutating inverse FFT: returns new arrays, input is untouched. */
export function inverseFFT(real: Float64Array, imag: Float64Array): { real: Float64Array; imag: Float64Array } {
  const outReal = Float64Array.from(real);
  const outImag = Float64Array.from(imag);
  fftInPlace(outReal, outImag, true);
  return { real: outReal, imag: outImag };
}
