import { describe, expect, it } from 'vitest';

import { deriveVortexCandidates } from '../../observer/deriveVortexCandidates.js';

describe('N2 vortex candidate observation', () => {
  it('detects a known +1 winding plaquette', () => {
    const phase = new Float32Array([
      0, Math.PI / 2,
      -Math.PI / 2, Math.PI,
    ]);
    const amplitude = new Float32Array([0.1, 0.1, 0.1, 0.1]);

    const result = deriveVortexCandidates({
      timestamp: 10,
      phase,
      amplitude,
      segments: 2,
    });

    expect(result.candidateCount).toBeGreaterThan(0);
    expect(result.positiveChargeCount).toBeGreaterThan(0);
    expect(result.totalTopologicalCharge).toBeGreaterThan(0);
    expect(result.candidates[0]?.topologicalCharge).toBe(1);
  });

  it('does not create large false positives for flat phase', () => {
    const phase = new Float32Array(16);
    const amplitude = new Float32Array(16).fill(1);

    const result = deriveVortexCandidates({
      timestamp: 20,
      phase,
      amplitude,
      segments: 4,
    });

    expect(result.candidateCount).toBe(0);
    expect(result.totalTopologicalCharge).toBe(0);
    expect(Array.from(result.vortexCandidateMask).some(Boolean)).toBe(false);
  });
});
