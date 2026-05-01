/**
 * vortexPairs.test.ts
 * N3: Curvature × Vortex Coupling — vortex pair detection unit tests
 */

import { describe, expect, it } from 'vitest';

import { deriveVortexPairs } from '../../observer/deriveVortexPairs.js';
import type { VortexCandidate } from '../../types/vortexCandidate.js';

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeCandidate(
  i: number,
  j: number,
  topologicalCharge: number,
  confidence = 0.8,
  timestamp = 100,
): VortexCandidate {
  return {
    id: `vortex-${i}-${j}-${timestamp}`,
    timestamp,
    regionId: `u${i}-v${j}`,
    i,
    j,
    amplitudeMinimum: 0.1,
    phaseWinding: topologicalCharge * Math.PI * 2,
    topologicalCharge,
    confidence,
    lifetimeTicks: 3,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('N3 deriveVortexPairs', () => {

  it('returns empty result for empty candidate list', () => {
    const result = deriveVortexPairs({
      candidates: [],
      segments: 8,
      timestamp: 0,
    });
    expect(result.pairs).toHaveLength(0);
    expect(result.pairCount).toBe(0);
    expect(result.averagePairLifetime).toBe(0);
  });

  it('detects a simple positive/negative pair in close proximity', () => {
    const candidates = [
      makeCandidate(0, 0, +1),
      makeCandidate(0, 1, -1),
    ];
    const result = deriveVortexPairs({
      candidates,
      segments: 8,
      timestamp: 1,
    });
    expect(result.pairCount).toBeGreaterThan(0);
    expect(result.pairs[0].positiveVortexId).toContain('vortex-0-0');
    expect(result.pairs[0].negativeVortexId).toContain('vortex-0-1');
  });

  it('does not pair when distance exceeds maxDistance', () => {
    // On segments=8, (0,0) and (0,4) have min(4, 8-4)=4 grid-cell distance,
    // which exceeds maxDistance=2 even accounting for torus wraparound.
    const candidates = [
      makeCandidate(0, 0, +1),
      makeCandidate(0, 4, -1),
    ];
    const result = deriveVortexPairs({
      candidates,
      segments: 8,
      timestamp: 2,
      maxDistance: 2,
    });
    expect(result.pairCount).toBe(0);
  });

  it('does not pair below minConfidence threshold', () => {
    const candidates = [
      makeCandidate(0, 0, +1, 0.1),   // below threshold
      makeCandidate(0, 1, -1, 0.1),   // below threshold
    ];
    const result = deriveVortexPairs({
      candidates,
      segments: 8,
      timestamp: 3,
      minConfidence: 0.3,
    });
    expect(result.pairCount).toBe(0);
  });

  it('pairs only opposite charges', () => {
    const candidates = [
      makeCandidate(0, 0, +1, 0.9),
      makeCandidate(0, 1, +1, 0.9),  // same sign, should not pair with +
      makeCandidate(0, 2, -1, 0.9),
    ];
    const result = deriveVortexPairs({
      candidates,
      segments: 8,
      timestamp: 4,
    });
    expect(result.pairCount).toBe(1);
  });

  it('each negative is used at most once', () => {
    const candidates = [
      makeCandidate(0, 0, +1, 0.9),
      makeCandidate(0, 1, +1, 0.9),
      makeCandidate(0, 2, -1, 0.9),  // only one negative
    ];
    const result = deriveVortexPairs({
      candidates,
      segments: 8,
      timestamp: 5,
    });
    expect(result.pairCount).toBe(1);
  });

  it('averagePairLifetime is finite and non-negative', () => {
    const candidates = [
      makeCandidate(0, 0, +1),
      makeCandidate(0, 1, -1),
    ];
    const result = deriveVortexPairs({
      candidates,
      segments: 8,
      timestamp: 6,
    });
    expect(Number.isFinite(result.averagePairLifetime)).toBe(true);
    expect(result.averagePairLifetime).toBeGreaterThanOrEqual(0);
  });

  it('pair confidence is in [0, 1]', () => {
    const candidates = [
      makeCandidate(0, 0, +1, 0.9),
      makeCandidate(0, 1, -1, 0.85),
    ];
    const result = deriveVortexPairs({
      candidates,
      segments: 8,
      timestamp: 7,
    });
    for (const pair of result.pairs) {
      expect(pair.confidence).toBeGreaterThanOrEqual(0);
      expect(pair.confidence).toBeLessThanOrEqual(1);
    }
  });

  it('handles torus wraparound distance', () => {
    // On a segments=8 grid, (0,0) and (0,7) are distance 1 apart via wraparound.
    const candidates = [
      makeCandidate(0, 0, +1, 0.9),
      makeCandidate(0, 7, -1, 0.9),
    ];
    const result = deriveVortexPairs({
      candidates,
      segments: 8,
      timestamp: 8,
      maxDistance: 1,
    });
    expect(result.pairCount).toBeGreaterThan(0);
  });

  it('pair is NOT a semantic edge or runtime graph connection', () => {
    const candidates = [
      makeCandidate(0, 0, +1),
      makeCandidate(0, 1, -1),
    ];
    const result = deriveVortexPairs({
      candidates,
      segments: 8,
      timestamp: 9,
    });
    for (const pair of result.pairs) {
      // Type-level check: no semantic properties present
      expect(pair).not.toHaveProperty('semanticLabel');
      expect(pair).not.toHaveProperty('memoryEdge');
      expect(pair).not.toHaveProperty('meaningScore');
    }
  });
});
