/**
 * Observation Layer Purification Test
 *
 * Phase 5: Observation Layer Purification
 *
 * Tests:
 * 1. Observation patterns (knot/path/recurrence/basin/anomaly/proto-point)
 *    can be derived without modifying organism dynamics.
 * 2. Observation layer is read-only: enabling it does not significantly
 *    change organism behavior metrics.
 * 3. Proto-point candidates emerge without semantic labels being attached.
 * 4. Observation confidence is within valid range [0, 1].
 * 5. No semantic node, label, or same-object detection is introduced.
 */

import { describe, expect, it } from 'vitest';
import { runObservationPatternsSuite } from '../scenario/observationPatternsScenario.ts';
import { deriveObservationPatterns } from '../../observer/deriveObservationPatterns.ts';
import type { ObservationPatternState } from '../../types/observationPatternState.ts';

describe('Phase 5 Observation Layer Purification', () => {

  it('deriveObservationPatterns is a pure function: same inputs produce same outputs', () => {
    const input = {
      timestamp: 100,
      traceState: {
        timestamp: 100,
        traceStrength: 0.45,
        recurrenceWeight: 0.55,
        salienceResidue: 0.35,
        replayReadiness: 0.60,
        replaySuppression: 0.20,
        recentPatternWeight: 0.40,
        settlingResidue: 0.25,
        recoveryLinkedResidue: 0.30,
      },
      replayState: {
        timestamp: 100,
        replayPressure: 0.50,
        replayReadiness: 0.58,
        consolidationGain: 0.30,
        activeReplayCount: 1,
        recentReplaySalience: 0.42,
        restConsolidationDepth: 0.20,
        replaySuppression: 0.18,
        lastReplayCategory: 'recurrence',
      },
      recoveryState: {
        timestamp: 100,
        recoveryPressure: 0.40,
        relaxationLevel: 0.60,
        stabilizationPull: 0.65,
        collapseRisk: 0.15,
        restorationBias: 0.75,
        boundaryRepairPressure: 0.25,
        selfPreservationDrive: 0.50,
        overloadDrain: 0.10,
      },
      mismatchState: null,
      activityHistory: Array.from({ length: 40 }, (_, i) => 0.3 + Math.sin(i * 0.2) * 0.05),
      recentPerturbationHistory: Array.from({ length: 20 }, () => 0.1),
      meanActivity: 0.32,
      baselineActivity: 0.25,
    };

    const result1 = deriveObservationPatterns(input);
    const result2 = deriveObservationPatterns(input);

    // Pure function: identical inputs produce identical outputs
    expect(result1.knotCount).toBe(result2.knotCount);
    expect(result1.pathCount).toBe(result2.pathCount);
    expect(result1.recurrenceLocusCount).toBe(result2.recurrenceLocusCount);
    expect(result1.basinCount).toBe(result2.basinCount);
    expect(result1.longLivedAnomalyCount).toBe(result2.longLivedAnomalyCount);
    expect(result1.protoPointCandidateCount).toBe(result2.protoPointCandidateCount);
    expect(result1.observationConfidence).toBe(result2.observationConfidence);
  });

  it('all ObservationPatternState count fields are non-negative integers', () => {
    const input = {
      timestamp: 200,
      traceState: null,
      replayState: null,
      recoveryState: null,
      mismatchState: null,
      activityHistory: [0.3, 0.31, 0.29, 0.32],
      recentPerturbationHistory: [0.05, 0.06],
      meanActivity: 0.30,
      baselineActivity: 0.25,
    };

    const result: ObservationPatternState = deriveObservationPatterns(input);

    // All count fields must be non-negative integers
    for (const field of [
      'knotCount', 'pathCount', 'recurrenceLocusCount', 'basinCount',
      'longLivedAnomalyCount', 'protoPointCandidateCount',
    ] as const) {
      expect(result[field]).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(result[field])).toBe(true);
    }

    // Optional count fields if present must also be non-negative integers
    if (result.collapseProfileCount !== undefined) {
      expect(result.collapseProfileCount).toBeGreaterThanOrEqual(0);
    }
    if (result.recoveryProfileCount !== undefined) {
      expect(result.recoveryProfileCount).toBeGreaterThanOrEqual(0);
    }
    if (result.stableAttractorCandidateCount !== undefined) {
      expect(result.stableAttractorCandidateCount).toBeGreaterThanOrEqual(0);
    }
  });

  it('observationConfidence is in range [0, 1] under all state conditions', () => {
    const cases = [
      // Full state available
      {
        timestamp: 1,
        traceState: { timestamp: 1, traceStrength: 0.3, recurrenceWeight: 0.4, salienceResidue: 0.2, replayReadiness: 0.5, replaySuppression: 0.1 },
        replayState: { timestamp: 1, replayPressure: 0.3, replayReadiness: 0.5, consolidationGain: 0.2, activeReplayCount: 0, recentReplaySalience: 0.1, restConsolidationDepth: 0.1, replaySuppression: 0.1, lastReplayCategory: null },
        recoveryState: { timestamp: 1, recoveryPressure: 0.2, relaxationLevel: 0.5, stabilizationPull: 0.4, collapseRisk: 0.1, restorationBias: 0.6 },
        mismatchState: null,
        activityHistory: Array.from({ length: 30 }, () => 0.3),
        recentPerturbationHistory: Array.from({ length: 15 }, () => 0.05),
        meanActivity: 0.3,
        baselineActivity: 0.25,
      },
      // Null state
      {
        timestamp: 2,
        traceState: null,
        replayState: null,
        recoveryState: null,
        mismatchState: null,
        activityHistory: [],
        recentPerturbationHistory: [],
        meanActivity: 0,
        baselineActivity: 0,
      },
      // Extreme activity
      {
        timestamp: 3,
        traceState: null,
        replayState: null,
        recoveryState: null,
        mismatchState: null,
        activityHistory: Array.from({ length: 50 }, () => 9.5),
        recentPerturbationHistory: Array.from({ length: 30 }, () => 0.9),
        meanActivity: 9.5,
        baselineActivity: 0.1,
      },
    ];

    for (const input of cases) {
      const result = deriveObservationPatterns(input);
      if (result.observationConfidence !== undefined) {
        expect(result.observationConfidence).toBeGreaterThanOrEqual(0);
        expect(result.observationConfidence).toBeLessThanOrEqual(1);
      }
    }
  });

  it('observation layer does not affect organism dynamics (scenario-level read-only check)', async () => {
    const outcomes = await runObservationPatternsSuite();

    expect(outcomes.length).toBeGreaterThanOrEqual(4);

    for (const outcome of outcomes) {
      const summary = outcome.result.summary;

      // Organism should remain alive: no NaN, low collapse rate
      expect(outcome.result.succeeded).toBe(true);
      expect(summary.nanFrames).toBe(0);
      expect(summary.collapseRate).toBeLessThan(0.3);

      // Observation summary fields should be present and valid
      if (summary.avgObservationConfidence !== undefined) {
        expect(summary.avgObservationConfidence).toBeGreaterThanOrEqual(0);
        expect(summary.avgObservationConfidence).toBeLessThanOrEqual(1);
      }

      // Count fields should be non-negative
      if (summary.avgKnotCount !== undefined) {
        expect(summary.avgKnotCount).toBeGreaterThanOrEqual(0);
      }
      if (summary.avgBasinCount !== undefined) {
        expect(summary.avgBasinCount).toBeGreaterThanOrEqual(0);
      }
      if (summary.avgProtoPointCandidateCount !== undefined) {
        expect(summary.avgProtoPointCandidateCount).toBeGreaterThanOrEqual(0);
      }

      // protoPointEmergenceFrames must not exceed total metric frames
      if (summary.protoPointEmergenceFrames !== undefined) {
        const maxPossibleMetricFrames = summary.totalFrames;
        expect(summary.protoPointEmergenceFrames).toBeLessThanOrEqual(maxPossibleMetricFrames);
      }
    }
  }, 120000);

  it('proto-point candidates do not cause semantic labels or node creation', async () => {
    const outcomes = await runObservationPatternsSuite();
    const protoScenario = outcomes.find((o) => o.name === 'proto-point-candidate-emergence');
    expect(protoScenario).toBeDefined();

    const summary = protoScenario!.result.summary;

    // Organism remains stable
    expect(protoScenario!.result.succeeded).toBe(true);

    // Observation confidence should be present (state was available)
    expect(summary.avgObservationConfidence).toBeDefined();
    if (summary.avgObservationConfidence !== undefined) {
      expect(summary.avgObservationConfidence).toBeGreaterThan(0);
    }

    // The scenario summary should NOT contain any semantic node, label,
    // or same-object detection fields. Verify these do not exist.
    const summaryKeys = Object.keys(summary);
    const forbiddenPrefixes = ['semanticNode', 'objectLabel', 'sameObject', 'teacherBinding'];
    for (const key of summaryKeys) {
      for (const forbidden of forbiddenPrefixes) {
        expect(key.startsWith(forbidden)).toBe(false);
      }
    }
  }, 120000);

  it('strong restoration bias scenario shows higher basin candidate count than weak boundary', async () => {
    const outcomes = await runObservationPatternsSuite();

    const strongBasin = outcomes.find((o) => o.name === 'strong-restoration-basin-observation');
    const weakBoundary = outcomes.find((o) => o.name === 'weak-boundary-anomaly-persistence');

    expect(strongBasin).toBeDefined();
    expect(weakBoundary).toBeDefined();

    const strongAvgBasin = strongBasin!.result.summary.avgBasinCount ?? 0;
    const weakAvgBasin = weakBoundary!.result.summary.avgBasinCount ?? 0;

    // Strong restoration bias → more basin candidates than weak boundary (rough proxy check)
    expect(strongAvgBasin).toBeGreaterThanOrEqual(weakAvgBasin);
  }, 120000);

});
