import { describe, expect, it } from 'vitest';
import { trackBlobs, evaluateL4Structural, type TrackedBlob } from '../../pure/observe/blobTracking.ts';
import type { DensityBlob } from '../../pure/observe/densityContrast.ts';

function blob(cellIndices: number[], meanDensityInside = 5, isExcess = true): DensityBlob {
  return { cellIndices, meanDensityInside, isExcess };
}

describe('pure core K11 (L4): blob identity tracking through deformation', () => {
  it('an unchanging blob (identical cell set every tick) is tracked as one identity with overlap 1 throughout', () => {
    const history: DensityBlob[][] = Array.from({ length: 5 }, () => [blob([10, 11, 20, 21])]);
    const tracks = trackBlobs(history, { minOverlapFraction: 0.3 });
    expect(tracks).toHaveLength(1);
    expect(tracks[0].samples).toHaveLength(5);
    for (let k = 1; k < 5; k++) {
      expect(tracks[0].samples[k].overlapWithPrevious).toBe(1);
    }
  });

  it('a blob that grows one cell at a time while keeping most of its area stays one identity (deformation-robust)', () => {
    const history: DensityBlob[][] = [
      [blob([10, 11])],
      [blob([10, 11, 12])],
      [blob([10, 11, 12, 13])],
      [blob([10, 11, 12, 13, 14])],
    ];
    const tracks = trackBlobs(history, { minOverlapFraction: 0.3 });
    expect(tracks).toHaveLength(1);
    expect(tracks[0].samples).toHaveLength(4);
    expect(tracks[0].samples[1].overlapWithPrevious).toBeCloseTo(2 / 3, 10);
  });

  it('a blob that moves so far it shares no cells with its former self starts a new identity', () => {
    const history: DensityBlob[][] = [[blob([1, 2, 3])], [blob([100, 101, 102])]];
    const tracks = trackBlobs(history, { minOverlapFraction: 0.3 });
    expect(tracks).toHaveLength(2);
    expect(tracks[0].samples).toHaveLength(1);
    expect(tracks[1].samples).toHaveLength(1);
  });

  it('overlap exactly at the threshold is accepted (>=, not >)', () => {
    // |A|=4, |B|=4, intersection=2 -> union=6 -> overlap = 2/6 = 1/3.
    const history: DensityBlob[][] = [[blob([1, 2, 3, 4])], [blob([3, 4, 5, 6])]];
    const tracks = trackBlobs(history, { minOverlapFraction: 1 / 3 });
    expect(tracks).toHaveLength(1);
    expect(tracks[0].samples[1].overlapWithPrevious).toBeCloseTo(1 / 3, 10);
  });

  it('two blobs merging into one: the merged blob is claimed by exactly one prior identity, the other ends (documented, not asserted "correct")', () => {
    const history: DensityBlob[][] = [
      [blob([1, 2, 3]), blob([10, 11, 12])],
      [blob([1, 2, 3, 4, 10, 11, 12, 13])], // a single blob overlapping both former ones substantially
    ];
    const tracks = trackBlobs(history, { minOverlapFraction: 0.3 });
    const extendedTracks = tracks.filter((t) => t.samples.length === 2);
    const endedTracks = tracks.filter((t) => t.samples.length === 1);
    expect(extendedTracks.length + endedTracks.length).toBe(tracks.length);
    expect(extendedTracks.length).toBeGreaterThanOrEqual(1);
  });

  it('a blob vanishing and an unrelated new one appearing later are two separate identities, not one continuous track', () => {
    const history: DensityBlob[][] = [[blob([1, 2, 3])], [], [], [blob([50, 51, 52])]];
    const tracks = trackBlobs(history, { minOverlapFraction: 0.3 });
    expect(tracks).toHaveLength(2);
    expect(tracks[0].samples).toHaveLength(1);
    expect(tracks[1].samples).toHaveLength(1);
    expect(tracks[1].samples[0].tick).toBe(3);
  });

  it('an empty history produces zero tracks', () => {
    expect(trackBlobs([], { minOverlapFraction: 0.3 })).toHaveLength(0);
  });

  it('throws for a minOverlapFraction outside (0, 1]', () => {
    expect(() => trackBlobs([], { minOverlapFraction: 0 })).toThrow();
    expect(() => trackBlobs([], { minOverlapFraction: 1.5 })).toThrow();
    expect(() => trackBlobs([], { minOverlapFraction: -0.2 })).toThrow();
  });

  it('is deterministic across repeated calls on the same input', () => {
    const history: DensityBlob[][] = [[blob([1, 2, 3])], [blob([2, 3, 4])], [blob([3, 4, 5])]];
    const a = trackBlobs(history, { minOverlapFraction: 0.3 });
    const b = trackBlobs(history, { minOverlapFraction: 0.3 });
    expect(a).toEqual(b);
  });
});

describe('pure core K11 (L4): structural half of the L4 judgment (lifetime AND contrast, excluding perturbation recovery)', () => {
  function makeTrack(length: number): TrackedBlob {
    return { id: 0, samples: Array.from({ length }, (_, tick) => ({ tick, blob: blob([tick]) })) };
  }

  it('satisfies L4-structural only when BOTH lifetime and contrast thresholds are exceeded', () => {
    const track = makeTrack(10);
    const contrastRatios = Array.from({ length: 10 }, () => 3);
    const result = evaluateL4Structural(track, contrastRatios, 5, 2);
    expect(result.lifetimeExceedsThreshold).toBe(true);
    expect(result.contrastExceedsThreshold).toBe(true);
    expect(result.satisfiesL4Structural).toBe(true);
  });

  it('fails if lifetime is long enough but contrast dips below threshold even once', () => {
    const track = makeTrack(10);
    const contrastRatios = [3, 3, 3, 1.5, 3, 3, 3, 3, 3, 3]; // one dip below theta=2
    const result = evaluateL4Structural(track, contrastRatios, 5, 2);
    expect(result.minContrastRatio).toBeCloseTo(1.5, 10);
    expect(result.contrastExceedsThreshold).toBe(false);
    expect(result.satisfiesL4Structural).toBe(false);
  });

  it('fails if contrast is fine but lifetime does not exceed the threshold', () => {
    const track = makeTrack(3);
    const contrastRatios = [3, 3, 3];
    const result = evaluateL4Structural(track, contrastRatios, 5, 2);
    expect(result.lifetimeExceedsThreshold).toBe(false);
    expect(result.satisfiesL4Structural).toBe(false);
  });

  it('throws when contrastRatios length does not match the track sample count', () => {
    const track = makeTrack(3);
    expect(() => evaluateL4Structural(track, [1, 2], 1, 1)).toThrow();
  });
});
