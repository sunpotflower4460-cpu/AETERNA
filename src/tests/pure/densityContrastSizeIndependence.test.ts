import { describe, expect, it } from 'vitest';
import { createTorusGeometry, type ComplexField } from '../../pure/geometry/torus.ts';
import { findDensityBlobs, evaluateContrast } from '../../pure/observe/densityContrast.ts';

/**
 * Builds a field with a background amplitude and a square block of a
 * different amplitude covering the SAME FRACTION of the grid at any N
 * (a fixed fraction of N cells per side, rounded), so the underlying
 * physical structure is the same "shape" regardless of resolution.
 */
function scaledBlockField(N: number, backgroundAmplitude: number, blobAmplitude: number, blobFraction: number): ComplexField {
  const real = new Float64Array(N * N).fill(backgroundAmplitude);
  const imag = new Float64Array(N * N);
  const blobSide = Math.max(1, Math.round(N * Math.sqrt(blobFraction)));
  const start = Math.floor(N / 2) - Math.floor(blobSide / 2);
  for (let i = start; i < start + blobSide; i++) {
    for (let j = start; j < start + blobSide; j++) {
      real[i * N + j] = blobAmplitude;
    }
  }
  return { real, imag };
}

describe('pure core K11 (L4): density-contrast instrument gives the same qualitative judgment across grid resolutions (Genesis L4 system-size independence requirement)', () => {
  const sizes = [64, 128, 256];
  const backgroundAmplitude = 1;
  const blobAmplitude = 4; // density 16 vs background density 1 -> contrast 16 regardless of N
  const blobFraction = 0.01; // 1% of the domain, at every N

  it('detects exactly one blob at N=64, 128, and 256 for the same proportionally-scaled structure', () => {
    for (const N of sizes) {
      const geometry = createTorusGeometry({ R: 3, r: 1, N });
      const psi = scaledBlockField(N, backgroundAmplitude, blobAmplitude, blobFraction);
      const blobs = findDensityBlobs(psi, geometry, 0.5);
      expect(blobs, `N=${N}`).toHaveLength(1);
    }
  });

  it('the contrast ratio is the same (within floating-point tolerance) regardless of N', () => {
    const ratios: number[] = [];
    for (const N of sizes) {
      const geometry = createTorusGeometry({ R: 3, r: 1, N });
      const psi = scaledBlockField(N, backgroundAmplitude, blobAmplitude, blobFraction);
      const blobs = findDensityBlobs(psi, geometry, 0.5);
      const result = evaluateContrast(blobs[0], blobs, psi, geometry, 0);
      ratios.push(result.contrastRatio);
    }
    for (const ratio of ratios) {
      expect(ratio).toBeCloseTo(16, 6);
    }
  });

  it('the blob is judged excess (not deficit) consistently across all three sizes', () => {
    for (const N of sizes) {
      const geometry = createTorusGeometry({ R: 3, r: 1, N });
      const psi = scaledBlockField(N, backgroundAmplitude, blobAmplitude, blobFraction);
      const blobs = findDensityBlobs(psi, geometry, 0.5);
      expect(blobs[0].isExcess, `N=${N}`).toBe(true);
    }
  });

  it('the SAME thetaContrast threshold produces the SAME exceedsThreshold verdict at every size', () => {
    const thetaContrast = 5;
    for (const N of sizes) {
      const geometry = createTorusGeometry({ R: 3, r: 1, N });
      const psi = scaledBlockField(N, backgroundAmplitude, blobAmplitude, blobFraction);
      const blobs = findDensityBlobs(psi, geometry, 0.5);
      const result = evaluateContrast(blobs[0], blobs, psi, geometry, thetaContrast);
      expect(result.exceedsThreshold, `N=${N}`).toBe(true);
    }
  });
});
