/**
 * PUT-IN: a per-tick series of VortexCandidate[] (src/pure/observe/
 *   vortexCandidates.ts's detectVortexCandidates output, one array per
 *   tick in order, index = tick offset), the TorusGeometry the
 *   candidates were detected on, a TrackingConfig, and optionally dt
 *   (for a physical-arc-length velocity in addition to the grid one)
 * EMERGED: TrackedVortex records - one per surviving identity, holding
 *   its (tick, i, j, winding) history and, from the second sample on,
 *   the velocity into that sample - plus evaluateL3, the mechanical
 *   judgment docs/vessel/K-series-II-brain-and-universe-plan.md K11
 *   specifies for Aeterna-Genesis Level 3 ("自発運動・相互作用・循環"):
 *   `com_velocity != 0 AND circulation != 0`
 * claim-tier: C2 (unit-validated against HAND-CONSTRUCTED candidate
 *   histories with a known planted trajectory - a stationary defect,
 *   one moving at a known constant grid velocity, one crossing the
 *   periodic boundary, two same-signed defects passing near each
 *   other, and a turbulent multi-defect field with no coherent motion
 *   - in src/tests/pure/vortexTracking.test.ts. This is a measurement
 *   instrument, not yet a claim about what AETERNA's own dynamics
 *   produce - that is K12/K13/K14's job, using this frozen instrument.
 *   Per K11's completion condition, this module and its threshold are
 *   committed BEFORE K12/K13 add any new physics.)
 * floors (誠実な床):
 *   - "circulation != 0" is TRIVIALLY true for every sample this module
 *     ever sees: detectVortexCandidates() never reports a zero-winding
 *     plaquette (see its own module doc), so every VortexCandidate this
 *     module tracks already has nonzero circulation by construction.
 *     The check is kept in evaluateL3() only for exact correspondence
 *     with Aeterna-Genesis's stated judgment formula, not because it
 *     can ever be false here.
 *   - docs/vessel/K-series-II-brain-and-universe-plan.md K11's own
 *     paraphrase of Genesis's L3 judgment drops Genesis's third clause
 *     (`flux > 0`, matter/probability flux through a surface) and keeps
 *     only `com_velocity != 0 AND circulation != 0`. This module follows
 *     the plan (the operative spec for this phase) rather than Genesis
 *     directly; a flux measurement is not implemented here.
 *   - "center-of-mass velocity" for a Genesis L3 judgment is normally a
 *     multi-cell blob's centroid velocity. A vortex candidate here is a
 *     SINGLE plaquette (one point, not an extended blob - see
 *     vortexCandidates.ts), so its own tracked position IS its center
 *     of mass; there is no separate blob-averaging step to floor here.
 *     (L4's inside/outside contrast, a PR-K11-2 concern, is where an
 *     actual multi-cell connected-component notion of "structure"
 *     enters.)
 *   - Identity assignment is GREEDY nearest-neighbor (each already-
 *     active track claims its closest same-sign candidate within
 *     maxDisplacementCells, in track-array order), not a globally
 *     optimal assignment (e.g. the Hungarian algorithm). Two same-sign
 *     candidates approaching within the threshold of each other can
 *     therefore have their identities swapped or one track spuriously
 *     end, rather than being disambiguated by a more expensive global
 *     solve. src/tests/pure/vortexTracking.test.ts's crossing-candidates
 *     case documents the resulting behavior rather than asserting a
 *     specific "correct" resolution, since there isn't a uniquely
 *     correct one without additional physics (e.g. momentum) this
 *     module deliberately does not have access to.
 *   - maxDisplacementCells is a PRE-REGISTERED integer, not tuned by
 *     looking at AETERNA's own trajectories. It answers "how far can a
 *     genuine single-tick vortex displacement plausibly be before two
 *     DIFFERENT nearby defects are more likely than one that moved,"
 *     not "what value makes K12+ results look like L3." Choosing it
 *     larger loosens tracking (more tolerant of fast motion, more prone
 *     to mis-linking distinct defects); choosing it smaller does the
 *     opposite. K12/K13/K14 configs must state their chosen value
 *     alongside their results, per K11's freeze requirement (PR-K11-5).
 *   - This module never reads N, H, nu, chi, or any ledger value - only
 *     the VortexCandidate[] history and TorusGeometry it is handed. It
 *     has no reachable path back into src/pure/field, src/pure/ledger,
 *     src/pure/drive, src/pure/medium, or src/pure/exchange (checked by
 *     src/tests/pure/observerNonIntervention.test.ts and the forbidden-
 *     pattern import-direction scan, per PR-K11-5's extension of that
 *     test to N=128/10^4 ticks with this instrument active).
 */

import type { TorusGeometry } from '../geometry/torus.ts';
import type { VortexCandidate } from './vortexCandidates.ts';

export interface TrackingConfig {
  /**
   * Maximum per-axis grid displacement (Chebyshev distance, torus-
   * wrapped) allowed between consecutive ticks for the same identity.
   * Pre-registered - see module doc's floors section.
   */
  maxDisplacementCells: number;
}

export interface GridVelocity {
  di: number;
  dj: number;
}

export interface PhysicalVelocity {
  /** Arc-length velocity along theta (the r*dTheta direction), physical units of length/time using whatever units dt was given in. */
  vTheta: number;
  /** Arc-length velocity along phi (the (R+r*cos(theta))*dPhi direction) AT the sample's theta row. */
  vPhi: number;
  speed: number;
}

export interface TrackedVortexSample {
  tick: number;
  i: number;
  j: number;
  winding: number;
  /** winding * 2*pi - the already-quantized circulation detectVortexCandidates computed; reused, not recomputed. */
  circulation: number;
  /** Displacement into this sample from the track's previous sample. Absent for a track's first sample (no prior position to compare against). */
  gridVelocity?: GridVelocity;
  /** Present only if dt was given to trackVortices AND gridVelocity is present. */
  physicalVelocity?: PhysicalVelocity;
}

export interface TrackedVortex {
  id: number;
  /** Fixed for the track's lifetime - Math.sign of its first sample's winding. A track never changes sign (see floors: same-sign is a matching precondition). */
  sign: number;
  samples: TrackedVortexSample[];
}

/** Shortest signed displacement from b to a on a ring of size N (result in (-N/2, N/2]). */
function wrappedDelta(a: number, b: number, N: number): number {
  let d = (a - b) % N;
  if (d > N / 2) d -= N;
  if (d <= -N / 2) d += N;
  return d;
}

function cellToGrid(cellIndex: number, N: number): { i: number; j: number } {
  return { i: Math.floor(cellIndex / N), j: cellIndex % N };
}

export function trackVortices(
  candidateHistory: readonly (readonly VortexCandidate[])[],
  geometry: TorusGeometry,
  config: TrackingConfig,
  dt?: number,
): TrackedVortex[] {
  if (!Number.isInteger(config.maxDisplacementCells) || config.maxDisplacementCells < 0) {
    throw new Error(`trackVortices: maxDisplacementCells must be a non-negative integer, got ${config.maxDisplacementCells}`);
  }
  const { N } = geometry;
  const tracks: TrackedVortex[] = [];
  let activeTrackIds: number[] = [];

  for (let tick = 0; tick < candidateHistory.length; tick++) {
    const candidates = candidateHistory[tick];
    const usedCandidateIdx = new Set<number>();
    const stillActive: number[] = [];

    for (const trackId of activeTrackIds) {
      const track = tracks[trackId];
      const last = track.samples[track.samples.length - 1];
      let bestIdx = -1;
      let bestDist = Infinity;
      let bestDelta = { di: 0, dj: 0 };

      for (let c = 0; c < candidates.length; c++) {
        if (usedCandidateIdx.has(c)) continue;
        const cand = candidates[c];
        if (Math.sign(cand.winding) !== track.sign) continue;
        const { i: ci, j: cj } = cellToGrid(cand.cellIndex, N);
        const di = wrappedDelta(ci, last.i, N);
        const dj = wrappedDelta(cj, last.j, N);
        const dist = Math.max(Math.abs(di), Math.abs(dj));
        if (dist <= config.maxDisplacementCells && dist < bestDist) {
          bestDist = dist;
          bestIdx = c;
          bestDelta = { di, dj };
        }
      }

      if (bestIdx >= 0) {
        usedCandidateIdx.add(bestIdx);
        const cand = candidates[bestIdx];
        const { i: ci, j: cj } = cellToGrid(cand.cellIndex, N);
        const sample: TrackedVortexSample = {
          tick,
          i: ci,
          j: cj,
          winding: cand.winding,
          circulation: cand.winding * 2 * Math.PI,
          gridVelocity: bestDelta,
        };
        if (dt !== undefined && Number.isFinite(dt) && dt > 0) {
          const thetaI = geometry.theta[last.i];
          const vTheta = (geometry.r * geometry.dTheta * bestDelta.di) / dt;
          const vPhi = ((geometry.R + geometry.r * Math.cos(thetaI)) * geometry.dPhi * bestDelta.dj) / dt;
          sample.physicalVelocity = { vTheta, vPhi, speed: Math.hypot(vTheta, vPhi) };
        }
        track.samples.push(sample);
        stillActive.push(trackId);
      }
      // else: no matching candidate within threshold this tick - the track ends here, its finished history stays in `tracks`.
    }

    for (let c = 0; c < candidates.length; c++) {
      if (usedCandidateIdx.has(c)) continue;
      const cand = candidates[c];
      const { i: ci, j: cj } = cellToGrid(cand.cellIndex, N);
      const track: TrackedVortex = {
        id: tracks.length,
        sign: Math.sign(cand.winding),
        samples: [{ tick, i: ci, j: cj, winding: cand.winding, circulation: cand.winding * 2 * Math.PI }],
      };
      tracks.push(track);
      stillActive.push(track.id);
    }

    activeTrackIds = stillActive;
  }

  return tracks;
}

export interface L3Judgment {
  trackId: number;
  lifetimeTicks: number;
  /** max grid-space speed (Chebyshev-adjacent Euclidean norm of di,dj) observed across the track's samples. */
  maxGridSpeed: number;
  comVelocityNonzero: boolean;
  circulationNonzero: boolean;
  /** com_velocity != 0 AND circulation != 0, per Aeterna-Genesis L3 as adopted (with the flux clause dropped - see module doc floors). */
  satisfiesL3: boolean;
}

export function evaluateL3(tracks: readonly TrackedVortex[]): L3Judgment[] {
  return tracks.map((track) => {
    let maxGridSpeed = 0;
    let circulationNonzero = false;
    for (const sample of track.samples) {
      if (sample.circulation !== 0) circulationNonzero = true;
      if (sample.gridVelocity) {
        const speed = Math.hypot(sample.gridVelocity.di, sample.gridVelocity.dj);
        maxGridSpeed = Math.max(maxGridSpeed, speed);
      }
    }
    const comVelocityNonzero = maxGridSpeed > 0;
    return {
      trackId: track.id,
      lifetimeTicks: track.samples.length,
      maxGridSpeed,
      comVelocityNonzero,
      circulationNonzero,
      satisfiesL3: comVelocityNonzero && circulationNonzero,
    };
  });
}
