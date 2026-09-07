import { describe, expect, it } from 'vitest';
import { fftInPlace, forwardFFT, inverseFFT } from '../../pure/field/fft.ts';
import { createSeededRandom } from '../../pure/random/seededPrng.ts';

/** Brute-force O(N^2) DFT, used only as an independent reference to check the fast transform against - never used in production code. */
function directDFT(real: Float64Array, imag: Float64Array, invert: boolean): { real: Float64Array; imag: Float64Array } {
  const n = real.length;
  const outReal = new Float64Array(n);
  const outImag = new Float64Array(n);
  const sign = invert ? 1 : -1;
  for (let k = 0; k < n; k++) {
    let sumReal = 0;
    let sumImag = 0;
    for (let j = 0; j < n; j++) {
      const angle = (sign * 2 * Math.PI * j * k) / n;
      const wr = Math.cos(angle);
      const wi = Math.sin(angle);
      sumReal += real[j] * wr - imag[j] * wi;
      sumImag += real[j] * wi + imag[j] * wr;
    }
    outReal[k] = sumReal;
    outImag[k] = sumImag;
  }
  if (invert) {
    for (let k = 0; k < n; k++) {
      outReal[k] /= n;
      outImag[k] /= n;
    }
  }
  return { real: outReal, imag: outImag };
}

function randomComplexSignal(n: number, seed: number): { real: Float64Array; imag: Float64Array } {
  const random = createSeededRandom(seed);
  const real = new Float64Array(n);
  const imag = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    real[i] = random() - 0.5;
    imag[i] = random() - 0.5;
  }
  return { real, imag };
}

describe('pure core K9 FFT: known analytic transform pairs', () => {
  it('a delta function transforms to a constant (forward)', () => {
    const n = 8;
    const real = new Float64Array(n);
    real[0] = 1;
    const imag = new Float64Array(n);
    const { real: outReal, imag: outImag } = forwardFFT(real, imag);
    for (let k = 0; k < n; k++) {
      expect(outReal[k]).toBeCloseTo(1, 12);
      expect(outImag[k]).toBeCloseTo(0, 12);
    }
  });

  it('a constant signal transforms to a delta at k=0 (forward)', () => {
    const n = 8;
    const real = new Float64Array(n).fill(2);
    const imag = new Float64Array(n);
    const { real: outReal, imag: outImag } = forwardFFT(real, imag);
    expect(outReal[0]).toBeCloseTo(16, 12); // sum of 8 values of 2
    for (let k = 1; k < n; k++) {
      expect(outReal[k]).toBeCloseTo(0, 10);
      expect(outImag[k]).toBeCloseTo(0, 10);
    }
  });

  it('a single-frequency sinusoid transforms to two symmetric peaks', () => {
    const n = 16;
    const freq = 3;
    const real = new Float64Array(n);
    const imag = new Float64Array(n);
    for (let j = 0; j < n; j++) {
      real[j] = Math.cos((2 * Math.PI * freq * j) / n);
    }
    const { real: outReal, imag: outImag } = forwardFFT(real, imag);
    // cos(2*pi*freq*j/N) = 0.5*exp(i*2*pi*freq*j/N) + 0.5*exp(-i*2*pi*freq*j/N)
    // -> peaks at k=freq and k=N-freq, each with magnitude N/2.
    for (let k = 0; k < n; k++) {
      const magnitude = Math.hypot(outReal[k], outImag[k]);
      if (k === freq || k === n - freq) {
        expect(magnitude).toBeCloseTo(n / 2, 10);
      } else {
        expect(magnitude).toBeCloseTo(0, 8);
      }
    }
  });
});

describe('pure core K9 FFT: round trip and independent reference agreement', () => {
  it.each([2, 4, 8, 16, 32, 64])('forward then inverse recovers the original signal exactly (N=%i)', (n) => {
    const { real, imag } = randomComplexSignal(n, n + 1);
    const originalReal = Float64Array.from(real);
    const originalImag = Float64Array.from(imag);

    const forward = forwardFFT(real, imag);
    const roundTripped = inverseFFT(forward.real, forward.imag);

    for (let i = 0; i < n; i++) {
      expect(roundTripped.real[i]).toBeCloseTo(originalReal[i], 10);
      expect(roundTripped.imag[i]).toBeCloseTo(originalImag[i], 10);
    }
  });

  it.each([4, 8, 16, 32])('matches an independent O(N^2) direct DFT (forward and inverse) (N=%i)', (n) => {
    const { real, imag } = randomComplexSignal(n, 100 + n);

    const fastForward = forwardFFT(real, imag);
    const directForward = directDFT(real, imag, false);
    for (let k = 0; k < n; k++) {
      expect(fastForward.real[k]).toBeCloseTo(directForward.real[k], 9);
      expect(fastForward.imag[k]).toBeCloseTo(directForward.imag[k], 9);
    }

    const fastInverse = inverseFFT(real, imag);
    const directInverse = directDFT(real, imag, true);
    for (let k = 0; k < n; k++) {
      expect(fastInverse.real[k]).toBeCloseTo(directInverse.real[k], 9);
      expect(fastInverse.imag[k]).toBeCloseTo(directInverse.imag[k], 9);
    }
  });

  it('is deterministic: the same input produces bit-identical output across calls', () => {
    const { real, imag } = randomComplexSignal(32, 7);
    const a = forwardFFT(real, imag);
    const b = forwardFFT(real, imag);
    expect(a.real).toEqual(b.real);
    expect(a.imag).toEqual(b.imag);
  });

  it('forwardFFT and inverseFFT do not mutate their input arrays', () => {
    const { real, imag } = randomComplexSignal(16, 42);
    const beforeReal = Float64Array.from(real);
    const beforeImag = Float64Array.from(imag);
    forwardFFT(real, imag);
    inverseFFT(real, imag);
    expect(real).toEqual(beforeReal);
    expect(imag).toEqual(beforeImag);
  });
});

describe('pure core K9 FFT: error handling', () => {
  it('throws for a non-power-of-2 length', () => {
    const real = new Float64Array(6);
    const imag = new Float64Array(6);
    expect(() => forwardFFT(real, imag)).toThrow();
  });

  it('throws for mismatched real/imag lengths', () => {
    const real = new Float64Array(8);
    const imag = new Float64Array(4);
    expect(() => fftInPlace(real, imag, false)).toThrow();
  });

  it('accepts length 1 (trivial FFT, identity)', () => {
    const real = Float64Array.from([5]);
    const imag = Float64Array.from([-3]);
    const result = forwardFFT(real, imag);
    expect(result.real[0]).toBe(5);
    expect(result.imag[0]).toBe(-3);
  });
});
