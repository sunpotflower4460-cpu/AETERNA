/**
 * deriveVortexPairs.ts
 * N3: Curvature × Vortex Coupling
 *
 * Observer-side helper that identifies positive/negative vortex candidate
 * pairs that appear in close proximity on the torus grid.
 *
 * Guardrails:
 * - Pure observer function — does NOT modify runtime state.
 * - vortexPairCandidate is NOT a semantic pair, memory edge, or relation.
 * - NOT connected to runtime feedback or weak plasticity.
 * - No consciousness / emotion / intention claims.
 * - Robust to null / empty input; always returns a valid array.
 */

import type { VortexCandidate } from '../types/vortexCandidate.ts';
import type { VortexPairCandidate } from '../types/vortexPairCandidate.ts';

/** Minimum confidence a candidate must have to participate in pairing. */
const MIN_CANDIDATE_CONFIDENCE = 0.3;

/** Maximum grid-cell distance between pair members. */
const MAX_PAIR_DISTANCE = 3;

function gridDistance(
  a: VortexCandidate,
  b: VortexCandidate,
  segments: number,
): number {
  const di = Math.min(
    Math.abs(a.i - b.i),
    segments - Math.abs(a.i - b.i),
  );
  const dj = Math.min(
    Math.abs(a.j - b.j),
    segments - Math.abs(a.j - b.j),
  );
  return Math.sqrt(di * di + dj * dj);
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export interface DeriveVortexPairsParams {
  candidates: VortexCandidate[];
  segments: number;
  timestamp: number;
  /** Maximum grid distance for pairing (default: 3). */
  maxDistance?: number;
  /** Minimum candidate confidence to participate in pairing (default: 0.3). */
  minConfidence?: number;
}

export interface VortexPairsResult {
  pairs: VortexPairCandidate[];
  pairCount: number;
  averagePairLifetime: number;
}

/**
 * Identify positive/negative vortex candidate pairs that lie within
 * `maxDistance` grid cells of each other on the torus.
 *
 * Each positive candidate is paired with the nearest eligible negative
 * candidate (greedy nearest-neighbor).  Each candidate may appear in at
 * most one pair.
 */
export function deriveVortexPairs(
  params: DeriveVortexPairsParams,
): VortexPairsResult {
  const {
    candidates,
    segments,
    timestamp,
    maxDistance = MAX_PAIR_DISTANCE,
    minConfidence = MIN_CANDIDATE_CONFIDENCE,
  } = params;

  if (!candidates || candidates.length === 0) {
    return { pairs: [], pairCount: 0, averagePairLifetime: 0 };
  }

  const positives = candidates.filter(
    (c) => c.topologicalCharge > 0 && c.confidence >= minConfidence,
  );
  const negatives = candidates.filter(
    (c) => c.topologicalCharge < 0 && c.confidence >= minConfidence,
  );

  if (positives.length === 0 || negatives.length === 0) {
    return { pairs: [], pairCount: 0, averagePairLifetime: 0 };
  }

  const usedNegatives = new Set<string>();
  const pairs: VortexPairCandidate[] = [];

  for (const pos of positives) {
    let bestNeg: VortexCandidate | null = null;
    let bestDist = Number.POSITIVE_INFINITY;

    for (const neg of negatives) {
      if (usedNegatives.has(neg.id)) continue;
      const dist = gridDistance(pos, neg, segments);
      if (dist <= maxDistance && dist < bestDist) {
        bestDist = dist;
        bestNeg = neg;
      }
    }

    if (bestNeg !== null) {
      usedNegatives.add(bestNeg.id);
      const avgConf = clamp01((pos.confidence + bestNeg.confidence) / 2);
      const posLife = Number.isFinite(pos.lifetimeTicks ?? 0)
        ? (pos.lifetimeTicks ?? 1)
        : 1;
      const negLife = Number.isFinite(bestNeg.lifetimeTicks ?? 0)
        ? (bestNeg.lifetimeTicks ?? 1)
        : 1;
      const estimatedLifetime = Math.min(posLife, negLife);
      const pairConfidence = clamp01(
        avgConf * (1 - bestDist / Math.max(1, maxDistance + 1)),
      );

      pairs.push({
        id: `pair-${pos.id}-${bestNeg.id}-${timestamp}`,
        timestamp,
        positiveVortexId: pos.id,
        negativeVortexId: bestNeg.id,
        distance: Number.isFinite(bestDist) ? bestDist : 0,
        averageConfidence: avgConf,
        estimatedLifetime,
        confidence: pairConfidence,
      });
    }
  }

  const totalLife = pairs.reduce((sum, p) => sum + p.estimatedLifetime, 0);
  const averagePairLifetime =
    pairs.length > 0 ? totalLife / pairs.length : 0;

  return {
    pairs,
    pairCount: pairs.length,
    averagePairLifetime: Number.isFinite(averagePairLifetime)
      ? averagePairLifetime
      : 0,
  };
}
