/**
 * curvatureVortexCoupling.test.ts
 * N3: Curvature × Vortex Coupling — observer unit tests
 */

import { describe, expect, it } from 'vitest';

import {
  deriveCurvatureVortexCoupling,
} from '../../observer/deriveCurvatureVortexCoupling.js';
import { createTorusGeometry } from '../../core/torusGeometry.js';
import type { VortexObservationState } from '../../types/vortexCandidate.js';

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeVortexObs(
  candidates: Array<{
    i: number;
    j: number;
    topologicalCharge: number;
    confidence: number;
    amplitudeMinimum?: number;
    lifetimeTicks?: number;
  }>,
  timestamp = 100,
): VortexObservationState {
  const built = candidates.map((c, idx) => ({
    id: `vortex-${c.i}-${c.j}-${timestamp}-${idx}`,
    timestamp,
    regionId: `u${c.i}-v${c.j}`,
    i: c.i,
    j: c.j,
    amplitudeMinimum: c.amplitudeMinimum ?? 0.1,
    phaseWinding: c.topologicalCharge > 0 ? Math.PI * 2 : -Math.PI * 2,
    topologicalCharge: c.topologicalCharge,
    confidence: c.confidence,
    lifetimeTicks: c.lifetimeTicks ?? 1,
  }));

  const posCount = built.filter((c) => c.topologicalCharge > 0).length;
  const negCount = built.filter((c) => c.topologicalCharge < 0).length;
  const totalCharge = built.reduce((s, c) => s + c.topologicalCharge, 0);
  const totalConf = built.reduce((s, c) => s + c.confidence, 0);
  const n = built.length;
  const segments = 8;

  return {
    timestamp,
    candidateCount: n,
    positiveChargeCount: posCount,
    negativeChargeCount: negCount,
    totalTopologicalCharge: totalCharge,
    averageConfidence: n > 0 ? totalConf / n : 0,
    maxConfidence: n > 0 ? Math.max(...built.map((c) => c.confidence)) : 0,
    averagePhaseGradient: 0,
    averageVorticity: 0,
    phaseUnwrapWarningCount: 0,
    candidates: built,
    observationConfidence: 0.7,
    vorticity: new Float32Array(segments * segments),
    topologicalCharge: new Int8Array(segments * segments),
    vortexCandidateMask: new Uint8Array(segments * segments),
  };
}

const SEGMENTS = 8;
const GEOM = createTorusGeometry({
  segments: SEGMENTS,
  majorRadius: 3,
  minorRadius: 1,
});

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('N3 deriveCurvatureVortexCoupling', () => {

  it('returns valid fallback when geometry is null', () => {
    const result = deriveCurvatureVortexCoupling({
      geometry: null,
      vortexObservation: null,
      timestamp: 0,
    });
    expect(result.totalVortexCount).toBe(0);
    expect(result.expectedSignedCharge).toBe(0);
    expect(result.chargeDeviation).toBe(0);
    expect(result.observationConfidence).toBe(0);
    expect(result.vortexDensityByCurvature).toHaveLength(5);
    expect(result.vortexStatsByRegion).toHaveLength(5);
    expect(Number.isFinite(result.nanOrInfinityCount)).toBe(true);
  });

  it('returns valid fallback when vortexObservation is null', () => {
    const result = deriveCurvatureVortexCoupling({
      geometry: GEOM,
      vortexObservation: null,
      timestamp: 1,
    });
    expect(result.totalVortexCount).toBe(0);
    expect(result.signedTotalCharge).toBe(0);
    expect(result.chargeDeviation).toBe(0);
  });

  it('produces CurvatureVortexCouplingState from geometry + vortex observation', () => {
    const obs = makeVortexObs([
      { i: 0, j: 0, topologicalCharge: 1, confidence: 0.8 },
      { i: 4, j: 4, topologicalCharge: -1, confidence: 0.7 },
    ]);
    const result = deriveCurvatureVortexCoupling({
      geometry: GEOM,
      vortexObservation: obs,
      timestamp: 10,
    });
    expect(result.totalVortexCount).toBe(2);
    expect(result.positiveChargeCount).toBe(1);
    expect(result.negativeChargeCount).toBe(1);
    expect(result.expectedSignedCharge).toBe(0);
  });

  it('signedTotalCharge is the sum of candidate topological charges', () => {
    const obs = makeVortexObs([
      { i: 0, j: 0, topologicalCharge: 1, confidence: 0.8 },
      { i: 1, j: 1, topologicalCharge: 1, confidence: 0.7 },
      { i: 2, j: 2, topologicalCharge: -1, confidence: 0.6 },
    ]);
    const result = deriveCurvatureVortexCoupling({
      geometry: GEOM,
      vortexObservation: obs,
      timestamp: 20,
    });
    expect(result.signedTotalCharge).toBe(1);
    expect(result.chargeDeviation).toBe(1);
  });

  it('expectedSignedCharge is always 0', () => {
    const obs = makeVortexObs([
      { i: 0, j: 0, topologicalCharge: 2, confidence: 0.9 },
    ]);
    const result = deriveCurvatureVortexCoupling({
      geometry: GEOM,
      vortexObservation: obs,
      timestamp: 30,
    });
    expect(result.expectedSignedCharge).toBe(0);
  });

  it('chargeDeviation is finite and non-negative', () => {
    const obs = makeVortexObs([
      { i: 0, j: 0, topologicalCharge: 1, confidence: 0.8 },
      { i: 1, j: 1, topologicalCharge: -1, confidence: 0.7 },
    ]);
    const result = deriveCurvatureVortexCoupling({
      geometry: GEOM,
      vortexObservation: obs,
      timestamp: 40,
    });
    expect(Number.isFinite(result.chargeDeviation)).toBe(true);
    expect(result.chargeDeviation).toBeGreaterThanOrEqual(0);
  });

  it('vortexDensityByCurvature has exactly 5 bands', () => {
    const obs = makeVortexObs([
      { i: 0, j: 0, topologicalCharge: 1, confidence: 0.8 },
    ]);
    const result = deriveCurvatureVortexCoupling({
      geometry: GEOM,
      vortexObservation: obs,
      timestamp: 50,
    });
    expect(result.vortexDensityByCurvature).toHaveLength(5);
  });

  it('each curvature band has valid regionCount and vortexDensity', () => {
    const obs = makeVortexObs([
      { i: 0, j: 0, topologicalCharge: 1, confidence: 0.8 },
      { i: 4, j: 0, topologicalCharge: -1, confidence: 0.7 },
    ]);
    const result = deriveCurvatureVortexCoupling({
      geometry: GEOM,
      vortexObservation: obs,
      timestamp: 60,
    });
    const totalRegions = result.vortexDensityByCurvature.reduce(
      (s, b) => s + b.regionCount,
      0,
    );
    expect(totalRegions).toBe(SEGMENTS * SEGMENTS);
    for (const band of result.vortexDensityByCurvature) {
      expect(Number.isFinite(band.vortexDensity)).toBe(true);
      expect(band.vortexDensity).toBeGreaterThanOrEqual(0);
    }
  });

  it('vortexStatsByRegion has exactly 5 regions', () => {
    const obs = makeVortexObs([
      { i: 0, j: 0, topologicalCharge: 1, confidence: 0.8 },
    ]);
    const result = deriveCurvatureVortexCoupling({
      geometry: GEOM,
      vortexObservation: obs,
      timestamp: 70,
    });
    expect(result.vortexStatsByRegion).toHaveLength(5);
    const ids = result.vortexStatsByRegion.map((r) => r.regionId);
    expect(ids).toContain('outerRim');
    expect(ids).toContain('innerRim');
    expect(ids).toContain('upperRim');
    expect(ids).toContain('lowerRim');
    expect(ids).toContain('neutral');
  });

  it('positive and negative counts sum correctly across regions', () => {
    const obs = makeVortexObs([
      { i: 0, j: 0, topologicalCharge: 1, confidence: 0.8 },
      { i: 0, j: 4, topologicalCharge: -1, confidence: 0.7 },
      { i: 4, j: 0, topologicalCharge: 1, confidence: 0.6 },
    ]);
    const result = deriveCurvatureVortexCoupling({
      geometry: GEOM,
      vortexObservation: obs,
      timestamp: 80,
    });
    const totalPos = result.vortexStatsByRegion.reduce(
      (s, r) => s + r.positiveChargeCount,
      0,
    );
    const totalNeg = result.vortexStatsByRegion.reduce(
      (s, r) => s + r.negativeChargeCount,
      0,
    );
    expect(totalPos).toBe(2);
    expect(totalNeg).toBe(1);
  });

  it('produces no NaN or Infinity in any top-level numeric field', () => {
    const obs = makeVortexObs([
      { i: 0, j: 0, topologicalCharge: 1, confidence: 0.8 },
      { i: 4, j: 4, topologicalCharge: -1, confidence: 0.7 },
    ]);
    const result = deriveCurvatureVortexCoupling({
      geometry: GEOM,
      vortexObservation: obs,
      timestamp: 90,
    });
    const nums: number[] = [
      result.totalVortexCount,
      result.positiveChargeCount,
      result.negativeChargeCount,
      result.signedTotalCharge,
      result.expectedSignedCharge,
      result.chargeDeviation,
      result.curvatureVortexCorrelation,
      result.curvatureBiasStrength,
      result.averageVortexLifetime,
      result.vortexPairCount,
      result.averageVortexPairLifetime,
      result.observationConfidence,
      result.nanOrInfinityCount,
    ];
    for (const n of nums) {
      expect(Number.isFinite(n)).toBe(true);
    }
  });

  it('safely handles no vortex candidates', () => {
    const obs = makeVortexObs([]);
    const result = deriveCurvatureVortexCoupling({
      geometry: GEOM,
      vortexObservation: obs,
      timestamp: 100,
    });
    expect(result.totalVortexCount).toBe(0);
    expect(result.signedTotalCharge).toBe(0);
    expect(result.chargeDeviation).toBe(0);
    expect(result.vortexPairCount).toBe(0);
  });

  it('does not connect to weak plasticity (field is not modified)', () => {
    // This test verifies the function is read-only.
    // We check that the input geometry is unchanged after calling the function.
    const beforeCellCount = GEOM.cells.length;
    const obs = makeVortexObs([
      { i: 0, j: 0, topologicalCharge: 1, confidence: 0.8 },
    ]);
    deriveCurvatureVortexCoupling({
      geometry: GEOM,
      vortexObservation: obs,
      timestamp: 110,
    });
    expect(GEOM.cells.length).toBe(beforeCellCount);
  });

  it('flatVsCurvedComparisonAvailable is a boolean', () => {
    const obs = makeVortexObs([]);
    const result = deriveCurvatureVortexCoupling({
      geometry: GEOM,
      vortexObservation: obs,
      timestamp: 120,
    });
    expect(typeof result.flatVsCurvedComparisonAvailable).toBe('boolean');
  });
});
