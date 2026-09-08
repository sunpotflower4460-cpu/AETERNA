import { describe, expect, it } from 'vitest';
import { createTorusGeometry, type ComplexField } from '../../pure/geometry/torus.ts';
import { findDensityBlobs, evaluateContrast } from '../../pure/observe/densityContrast.ts';

function uniformField(N: number, amplitude: number): ComplexField {
  return { real: new Float64Array(N * N).fill(amplitude), imag: new Float64Array(N * N) };
}

function withAmplitudeAt(field: ComplexField, cells: readonly number[], amplitude: number): ComplexField {
  const real = Float64Array.from(field.real);
  const imag = Float64Array.from(field.imag);
  for (const cell of cells) {
    real[cell] = amplitude;
    imag[cell] = 0;
  }
  return { real, imag };
}

describe('pure core K11 (L4): density-relative blob detection', () => {
  it('a perfectly uniform field has zero blobs at any positive relativeDeviation', () => {
    const N = 8;
    const geometry = createTorusGeometry({ R: 3, r: 1, N });
    const psi = uniformField(N, 1);
    const blobs = findDensityBlobs(psi, geometry, 0.2);
    expect(blobs).toHaveLength(0);
  });

  it('a small region of much higher amplitude than the background is detected as one EXCESS blob', () => {
    const N = 10;
    const geometry = createTorusGeometry({ R: 3, r: 1, N });
    const background = uniformField(N, 1);
    // A 2x2 block of amplitude 5 (density 25 vs background density 1) - unambiguous excess.
    const excessCells = [3 * N + 3, 3 * N + 4, 4 * N + 3, 4 * N + 4];
    const psi = withAmplitudeAt(background, excessCells, 5);

    const blobs = findDensityBlobs(psi, geometry, 0.5);
    expect(blobs).toHaveLength(1);
    expect(blobs[0].isExcess).toBe(true);
    expect(new Set(blobs[0].cellIndices)).toEqual(new Set(excessCells));
  });

  it('a small region of much lower amplitude than the background is detected as one DEFICIT blob', () => {
    const N = 10;
    const geometry = createTorusGeometry({ R: 3, r: 1, N });
    const background = uniformField(N, 1);
    const deficitCells = [6 * N + 6, 6 * N + 7];
    const psi = withAmplitudeAt(background, deficitCells, 0.01);

    const blobs = findDensityBlobs(psi, geometry, 0.5);
    expect(blobs).toHaveLength(1);
    expect(blobs[0].isExcess).toBe(false);
    expect(new Set(blobs[0].cellIndices)).toEqual(new Set(deficitCells));
  });

  it('two spatially disjoint excess regions are detected as two separate blobs', () => {
    const N = 12;
    const geometry = createTorusGeometry({ R: 3, r: 1, N });
    const background = uniformField(N, 1);
    const blobA = [1 * N + 1];
    const blobB = [8 * N + 8];
    const psi = withAmplitudeAt(background, [...blobA, ...blobB], 5);

    const blobs = findDensityBlobs(psi, geometry, 0.5);
    expect(blobs).toHaveLength(2);
    const cellSets = blobs.map((b) => new Set(b.cellIndices));
    expect(cellSets.some((s) => s.has(blobA[0]) && s.size === 1)).toBe(true);
    expect(cellSets.some((s) => s.has(blobB[0]) && s.size === 1)).toBe(true);
  });

  it('a blob straddling the periodic seam (j = N-1 and j = 0) is one connected component, not two', () => {
    const N = 10;
    const geometry = createTorusGeometry({ R: 3, r: 1, N });
    const background = uniformField(N, 1);
    const seamCells = [4 * N + (N - 1), 4 * N + 0];
    const psi = withAmplitudeAt(background, seamCells, 5);

    const blobs = findDensityBlobs(psi, geometry, 0.5);
    expect(blobs).toHaveLength(1);
    expect(new Set(blobs[0].cellIndices)).toEqual(new Set(seamCells));
  });

  it('throws for a non-positive or non-finite relativeDeviation', () => {
    const geometry = createTorusGeometry({ R: 3, r: 1, N: 8 });
    const psi = uniformField(8, 1);
    expect(() => findDensityBlobs(psi, geometry, 0)).toThrow();
    expect(() => findDensityBlobs(psi, geometry, -0.1)).toThrow();
    expect(() => findDensityBlobs(psi, geometry, Infinity)).toThrow();
  });

  it('is deterministic across repeated calls on the same input', () => {
    const N = 10;
    const geometry = createTorusGeometry({ R: 3, r: 1, N });
    const psi = withAmplitudeAt(uniformField(N, 1), [3 * N + 3, 3 * N + 4], 5);
    const a = findDensityBlobs(psi, geometry, 0.5);
    const b = findDensityBlobs(psi, geometry, 0.5);
    expect(a).toEqual(b);
  });
});

describe('pure core K11 (L4): inside/outside contrast evaluation', () => {
  it('a clearly excess blob against a uniform background has a large, correctly-signed contrast ratio', () => {
    const N = 10;
    const geometry = createTorusGeometry({ R: 3, r: 1, N });
    const background = uniformField(N, 1); // density 1 everywhere outside the blob
    const excessCells = [5 * N + 5];
    const psi = withAmplitudeAt(background, excessCells, 4); // density 16 inside

    const blobs = findDensityBlobs(psi, geometry, 0.5);
    expect(blobs).toHaveLength(1);
    const result = evaluateContrast(blobs[0], blobs, psi, geometry, 2);

    expect(result.meanDensityOutside).toBeCloseTo(1, 6);
    expect(result.contrastRatio).toBeCloseTo(16, 6);
    expect(result.exceedsThreshold).toBe(true);
  });

  it('a contrast ratio below thetaContrast does not exceed the threshold', () => {
    const N = 10;
    const geometry = createTorusGeometry({ R: 3, r: 1, N });
    const background = uniformField(N, 1);
    const excessCells = [5 * N + 5];
    const psi = withAmplitudeAt(background, excessCells, 1.1); // density 1.21, barely above background

    const blobs = findDensityBlobs(psi, geometry, 0.2);
    expect(blobs).toHaveLength(1);
    const result = evaluateContrast(blobs[0], blobs, psi, geometry, 5);
    expect(result.exceedsThreshold).toBe(false);
  });

  it('a deficit blob is scored by the same symmetric ratio convention as an excess blob', () => {
    const N = 10;
    const geometry = createTorusGeometry({ R: 3, r: 1, N });
    const background = uniformField(N, 1);
    const deficitCells = [2 * N + 2];
    const psi = withAmplitudeAt(background, deficitCells, 0.25); // density 0.0625 inside vs 1 outside

    const blobs = findDensityBlobs(psi, geometry, 0.5);
    expect(blobs).toHaveLength(1);
    expect(blobs[0].isExcess).toBe(false);
    const result = evaluateContrast(blobs[0], blobs, psi, geometry, 2);
    expect(result.contrastRatio).toBeCloseTo(16, 6); // 1 / 0.0625 = 16, same magnitude convention as the excess case
  });
});
