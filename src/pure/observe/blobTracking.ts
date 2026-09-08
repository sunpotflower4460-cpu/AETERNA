/**
 * PUT-IN: a per-tick series of DensityBlob[] (src/pure/observe/
 *   densityContrast.ts's findDensityBlobs output, one array per tick,
 *   index = tick offset) and a BlobTrackingConfig
 * EMERGED: TrackedBlob records - one per surviving identity, holding
 *   its per-tick blob history and the Jaccard overlap that linked each
 *   sample to the previous one. This is the "変形を通じた追跡ID寿命"
 *   (tracked-ID lifetime through deformation) ingredient of Aeterna-
 *   Genesis L4, per docs/vessel/K-series-II-brain-and-universe-
 *   plan.md K11.
 * claim-tier: C2 (unit-validated against hand-constructed blob
 *   histories with a known planted trajectory - a stationary blob, one
 *   that grows/shrinks while staying mostly in place, one that moves
 *   too far to link, two blobs merging into one, and a blob vanishing
 *   then a NEW unrelated one appearing - in src/tests/pure/
 *   blobTracking.test.ts. This is a measurement instrument, not yet a
 *   claim about AETERNA's own dynamics.)
 * floors (誠実な床):
 *   - Identity is tracked by CELL-SET OVERLAP (Jaccard index: |A∩B| /
 *     |A∪B|), not by position or shape - this is what makes it robust
 *     to deformation (growing, shrinking, changing shape) that a
 *     position-only tracker (like vortexTracking.ts's point tracker,
 *     appropriate for a single-plaquette defect) cannot handle for an
 *     extended, deforming region.
 *   - Like vortexTracking.ts, assignment is GREEDY (each active track
 *     claims its highest-overlap unclaimed blob above minOverlapFraction,
 *     in track-array order), not a globally optimal matching. A merge
 *     (two blobs becoming one) or split (one becoming two) is resolved
 *     by whichever track happens to be considered first claiming the
 *     surviving/larger blob; the other track simply ends. This is
 *     documented behavior, not asserted as "the" correct resolution -
 *     genuinely disambiguating a merge/split needs physics (e.g. mass/
 *     energy accounting) this module does not have.
 *   - minOverlapFraction is PRE-REGISTERED (see K11-PR5's freeze
 *     declaration for the value used in K12+ configs), not tuned by
 *     looking at AETERNA's own trajectories.
 *   - evaluateL4Structural checks only the STRUCTURAL half of Genesis's
 *     L4 judgment (`tracked_id_lifetime > tau AND inside_outside_contrast
 *     > theta`) - it does NOT check `recovers_after_perturbation`, which
 *     requires an actual perturbation delivered during a live run (a
 *     PR-K11-2 concern handled separately, since it needs the K5 world
 *     chi machinery, not just a static blob history).
 *   - This module never reads N, H, nu, chi, or any ledger value - only
 *     the DensityBlob[] history it is handed. It has no reachable path
 *     back into src/pure/field, src/pure/ledger, src/pure/drive,
 *     src/pure/medium, or src/pure/exchange.
 */

import type { DensityBlob } from './densityContrast.ts';

export interface BlobTrackingConfig {
  /** Minimum Jaccard overlap (|A intersect B| / |A union B|) required to link a blob forward as the same identity. Pre-registered. */
  minOverlapFraction: number;
}

export interface TrackedBlobSample {
  tick: number;
  blob: DensityBlob;
  /** Jaccard overlap with the sample this one was linked from. Absent for a track's first sample. */
  overlapWithPrevious?: number;
}

export interface TrackedBlob {
  id: number;
  samples: TrackedBlobSample[];
}

function jaccardOverlap(a: readonly number[], b: readonly number[]): number {
  const setB = new Set(b);
  let intersection = 0;
  for (const cell of a) {
    if (setB.has(cell)) intersection++;
  }
  const union = a.length + b.length - intersection;
  return union > 0 ? intersection / union : 0;
}

export function trackBlobs(blobHistory: readonly (readonly DensityBlob[])[], config: BlobTrackingConfig): TrackedBlob[] {
  if (!(Number.isFinite(config.minOverlapFraction) && config.minOverlapFraction > 0 && config.minOverlapFraction <= 1)) {
    throw new Error(`trackBlobs: minOverlapFraction must be in (0, 1], got ${config.minOverlapFraction}`);
  }

  const tracks: TrackedBlob[] = [];
  let activeTrackIds: number[] = [];

  for (let tick = 0; tick < blobHistory.length; tick++) {
    const blobs = blobHistory[tick];
    const usedBlobIdx = new Set<number>();
    const stillActive: number[] = [];

    for (const trackId of activeTrackIds) {
      const track = tracks[trackId];
      const last = track.samples[track.samples.length - 1];
      let bestIdx = -1;
      let bestOverlap = 0;

      for (let b = 0; b < blobs.length; b++) {
        if (usedBlobIdx.has(b)) continue;
        const overlap = jaccardOverlap(last.blob.cellIndices, blobs[b].cellIndices);
        if (overlap >= config.minOverlapFraction && overlap > bestOverlap) {
          bestOverlap = overlap;
          bestIdx = b;
        }
      }

      if (bestIdx >= 0) {
        usedBlobIdx.add(bestIdx);
        track.samples.push({ tick, blob: blobs[bestIdx], overlapWithPrevious: bestOverlap });
        stillActive.push(trackId);
      }
      // else: no matching blob within threshold this tick - the track ends here.
    }

    for (let b = 0; b < blobs.length; b++) {
      if (usedBlobIdx.has(b)) continue;
      const track: TrackedBlob = { id: tracks.length, samples: [{ tick, blob: blobs[b] }] };
      tracks.push(track);
      stillActive.push(track.id);
    }

    activeTrackIds = stillActive;
  }

  return tracks;
}

export interface L4StructuralJudgment {
  trackId: number;
  lifetimeTicks: number;
  /** The minimum contrastRatio observed across the track's samples (contrast maintained THROUGHOUT, not just once). */
  minContrastRatio: number;
  lifetimeExceedsThreshold: boolean;
  contrastExceedsThreshold: boolean;
  /** lifetimeExceedsThreshold AND contrastExceedsThreshold. Does NOT include recovers_after_perturbation - see module doc floors. */
  satisfiesL4Structural: boolean;
}

/**
 * contrastRatios must be supplied in the same order/length as
 * track.samples (the caller's job - typically evaluateContrast() run
 * once per sample against that tick's full blob list, since contrast
 * needs "everything outside any blob at that tick," which this module
 * does not itself have access to).
 */
export function evaluateL4Structural(track: TrackedBlob, contrastRatios: readonly number[], tauLifetimeTicks: number, thetaContrast: number): L4StructuralJudgment {
  if (contrastRatios.length !== track.samples.length) {
    throw new Error(`evaluateL4Structural: contrastRatios length (${contrastRatios.length}) must match track.samples length (${track.samples.length})`);
  }
  const lifetimeTicks = track.samples.length;
  const minContrastRatio = contrastRatios.length > 0 ? Math.min(...contrastRatios) : 0;
  const lifetimeExceedsThreshold = lifetimeTicks > tauLifetimeTicks;
  const contrastExceedsThreshold = minContrastRatio > thetaContrast;
  return {
    trackId: track.id,
    lifetimeTicks,
    minContrastRatio,
    lifetimeExceedsThreshold,
    contrastExceedsThreshold,
    satisfiesL4Structural: lifetimeExceedsThreshold && contrastExceedsThreshold,
  };
}
