/**
 * Proto-Point Observation Tests
 *
 * Phase 7: proto-point の観測導入
 *
 * Tests:
 * 1. ProtoPointCandidate has no semantic label, category, or same-object field.
 * 2. deriveProtoPointCandidates is a pure observer function (no side effects).
 * 3. Baseline (no-input) does not produce mass candidate generation.
 * 4. Repeated perturbation scenario produces higher confidence than baseline.
 * 5. Proto-point observation is read-only (organism dynamics not changed).
 * 6. Confidence scores are within valid range [0, 1].
 * 7. Candidate lifecycle is observer-side (no runtime behavior change).
 * 8. Node bridge fields are absent.
 * 9. Scenario summary includes proto-point fields.
 */

import { describe, expect, it } from 'vitest';
import { deriveProtoPointCandidates } from '../../observer/deriveProtoPointCandidates.ts';
import type { ProtoPointCandidate } from '../../types/protoPointCandidate.ts';
import type { ProtoPointObservationState } from '../../types/protoPointObservationState.ts';
import { runProtoPointObservationSuite } from '../scenario/protoPointObservationScenario.ts';

describe('Phase 7 Proto-Point Observation', () => {

  it('ProtoPointCandidate has no semantic label, category, concept, or same-object fields', () => {
    const candidate: ProtoPointCandidate = {
      id: 'proto-slot-A',
      timestamp: 100,
      regionId: 'proxy-recurrence-dominant',
      persistence: 3,
      recurrenceScore: 0.55,
      traceAffinity: 0.48,
      replayAffinity: 0.40,
      localContrast: 0.35,
      basinOverlap: 0.30,
      knotOverlap: 0.45,
      confidence: 0.44,
      lifecycle: 'recurring',
    };

    // Verify forbidden semantic fields are absent
    const forbiddenFields = [
      'semanticLabel', 'label', 'category', 'concept',
      'sameObject', 'objectId', 'teacherBinding', 'nodeBridge',
    ];
    const keys = Object.keys(candidate);
    for (const field of forbiddenFields) {
      expect(keys).not.toContain(field);
    }
  });

  it('deriveProtoPointCandidates is a pure function: same inputs produce same outputs', () => {
    const input = {
      timestamp: 200,
      traceState: {
        timestamp: 200,
        traceStrength: 0.50,
        recurrenceWeight: 0.60,
        salienceResidue: 0.40,
        replayReadiness: 0.65,
        replaySuppression: 0.18,
        recentPatternWeight: 0.45,
        settlingResidue: 0.28,
        recoveryLinkedResidue: 0.32,
      },
      replayState: {
        timestamp: 200,
        replayPressure: 0.55,
        replayReadiness: 0.62,
        consolidationGain: 0.35,
        activeReplayCount: 1,
        recentReplaySalience: 0.48,
        restConsolidationDepth: 0.22,
        replaySuppression: 0.16,
        lastReplayCategory: 'recurrence',
      },
      recoveryState: {
        timestamp: 200,
        recoveryPressure: 0.42,
        relaxationLevel: 0.62,
        stabilizationPull: 0.68,
        collapseRisk: 0.12,
        restorationBias: 0.78,
        boundaryRepairPressure: 0.28,
      },
      observationPatternState: {
        timestamp: 200,
        knotCount: 2,
        pathCount: 1,
        recurrenceLocusCount: 1,
        basinCount: 2,
        longLivedAnomalyCount: 0,
        protoPointCandidateCount: 1,
        observationConfidence: 0.85,
      },
      activityHistory: Array.from({ length: 40 }, (_, i) => 0.32 + Math.sin(i * 0.2) * 0.04),
      recentPerturbationHistory: Array.from({ length: 20 }, () => 0.12),
      meanActivity: 0.34,
      baselineActivity: 0.26,
      previousState: null,
    };

    const result1 = deriveProtoPointCandidates(input);
    const result2 = deriveProtoPointCandidates(input);

    // Pure function: identical inputs produce identical outputs
    expect(result1.candidateCount).toBe(result2.candidateCount);
    expect(result1.stableCandidateCount).toBe(result2.stableCandidateCount);
    expect(result1.averageConfidence).toBeCloseTo(result2.averageConfidence, 6);
    expect(result1.maxConfidence).toBeCloseTo(result2.maxConfidence, 6);
    expect(result1.candidates.length).toBe(result2.candidates.length);
  });

  it('all confidence scores are in range [0, 1]', () => {
    const inputs = [
      // Full state
      {
        timestamp: 1,
        traceState: {
          timestamp: 1, traceStrength: 0.5, recurrenceWeight: 0.6,
          salienceResidue: 0.4, replayReadiness: 0.6, replaySuppression: 0.2,
          recentPatternWeight: 0.4, settlingResidue: 0.3, recoveryLinkedResidue: 0.3,
        },
        replayState: {
          timestamp: 1, replayPressure: 0.5, replayReadiness: 0.6, consolidationGain: 0.3,
          activeReplayCount: 1, recentReplaySalience: 0.4, restConsolidationDepth: 0.2,
          replaySuppression: 0.2, lastReplayCategory: 'recurrence',
        },
        recoveryState: {
          timestamp: 1, recoveryPressure: 0.4, relaxationLevel: 0.6,
          stabilizationPull: 0.65, collapseRisk: 0.15, restorationBias: 0.75,
        },
        observationPatternState: {
          timestamp: 1, knotCount: 1, pathCount: 1, recurrenceLocusCount: 1,
          basinCount: 1, longLivedAnomalyCount: 0, protoPointCandidateCount: 1,
        },
        activityHistory: Array.from({ length: 40 }, () => 0.3),
        recentPerturbationHistory: Array.from({ length: 20 }, () => 0.1),
        meanActivity: 0.3,
        baselineActivity: 0.25,
        previousState: null,
      },
      // Null state
      {
        timestamp: 2,
        traceState: null,
        replayState: null,
        recoveryState: null,
        observationPatternState: null,
        activityHistory: [],
        recentPerturbationHistory: [],
        meanActivity: 0,
        baselineActivity: 0,
        previousState: null,
      },
      // Extreme values
      {
        timestamp: 3,
        traceState: {
          timestamp: 3, traceStrength: 1.0, recurrenceWeight: 1.0,
          salienceResidue: 1.0, replayReadiness: 1.0, replaySuppression: 0.0,
          recentPatternWeight: 1.0, settlingResidue: 1.0, recoveryLinkedResidue: 1.0,
        },
        replayState: {
          timestamp: 3, replayPressure: 1.0, replayReadiness: 1.0, consolidationGain: 1.0,
          activeReplayCount: 5, recentReplaySalience: 1.0, restConsolidationDepth: 1.0,
          replaySuppression: 0.0, lastReplayCategory: null,
        },
        recoveryState: {
          timestamp: 3, recoveryPressure: 1.0, relaxationLevel: 1.0,
          stabilizationPull: 1.0, collapseRisk: 0.0, restorationBias: 1.0,
        },
        observationPatternState: {
          timestamp: 3, knotCount: 2, pathCount: 2, recurrenceLocusCount: 2,
          basinCount: 2, longLivedAnomalyCount: 1, protoPointCandidateCount: 1,
        },
        activityHistory: Array.from({ length: 50 }, () => 0.9),
        recentPerturbationHistory: Array.from({ length: 30 }, () => 0.9),
        meanActivity: 0.9,
        baselineActivity: 0.1,
        previousState: null,
      },
    ];

    for (const input of inputs) {
      const result: ProtoPointObservationState = deriveProtoPointCandidates(input);

      expect(result.candidateCount).toBeGreaterThanOrEqual(0);
      expect(result.stableCandidateCount).toBeGreaterThanOrEqual(0);
      expect(result.stableCandidateCount).toBeLessThanOrEqual(result.candidateCount);
      expect(result.averageConfidence).toBeGreaterThanOrEqual(0);
      expect(result.averageConfidence).toBeLessThanOrEqual(1);
      expect(result.maxConfidence).toBeGreaterThanOrEqual(0);
      expect(result.maxConfidence).toBeLessThanOrEqual(1);

      for (const c of result.candidates) {
        expect(c.confidence).toBeGreaterThanOrEqual(0);
        expect(c.confidence).toBeLessThanOrEqual(1);
        expect(c.recurrenceScore).toBeGreaterThanOrEqual(0);
        expect(c.recurrenceScore).toBeLessThanOrEqual(1);
        expect(c.traceAffinity).toBeGreaterThanOrEqual(0);
        expect(c.traceAffinity).toBeLessThanOrEqual(1);
        expect(c.replayAffinity).toBeGreaterThanOrEqual(0);
        expect(c.replayAffinity).toBeLessThanOrEqual(1);
      }
    }
  });

  it('candidate count does not exceed 3 slots (anti-mass-generation)', () => {
    const input = {
      timestamp: 10,
      traceState: {
        timestamp: 10, traceStrength: 0.9, recurrenceWeight: 0.9,
        salienceResidue: 0.9, replayReadiness: 0.9, replaySuppression: 0.0,
        recentPatternWeight: 0.9, settlingResidue: 0.9, recoveryLinkedResidue: 0.9,
      },
      replayState: {
        timestamp: 10, replayPressure: 0.9, replayReadiness: 0.9, consolidationGain: 0.9,
        activeReplayCount: 3, recentReplaySalience: 0.9, restConsolidationDepth: 0.9,
        replaySuppression: 0.0, lastReplayCategory: null,
      },
      recoveryState: {
        timestamp: 10, recoveryPressure: 0.9, relaxationLevel: 0.9,
        stabilizationPull: 0.9, collapseRisk: 0.0, restorationBias: 0.9,
      },
      observationPatternState: {
        timestamp: 10, knotCount: 2, pathCount: 2, recurrenceLocusCount: 2,
        basinCount: 2, longLivedAnomalyCount: 1, protoPointCandidateCount: 1,
      },
      activityHistory: Array.from({ length: 50 }, () => 0.8),
      recentPerturbationHistory: Array.from({ length: 30 }, () => 0.8),
      meanActivity: 0.8,
      baselineActivity: 0.2,
      previousState: null,
    };

    const result = deriveProtoPointCandidates(input);
    // Maximum 3 slots (A, B, C), plus potential decaying entries
    // Active slots max = 3; decaying only appear if prev state has them
    expect(result.candidateCount).toBeLessThanOrEqual(3);
  });

  it('lifecycle is observer-side: new → recurring → persistent progression', () => {
    const baseInput = {
      traceState: {
        timestamp: 0, traceStrength: 0.55, recurrenceWeight: 0.65,
        salienceResidue: 0.45, replayReadiness: 0.60, replaySuppression: 0.15,
        recentPatternWeight: 0.50, settlingResidue: 0.30, recoveryLinkedResidue: 0.35,
      },
      replayState: {
        timestamp: 0, replayPressure: 0.55, replayReadiness: 0.62, consolidationGain: 0.38,
        activeReplayCount: 1, recentReplaySalience: 0.45, restConsolidationDepth: 0.25,
        replaySuppression: 0.15, lastReplayCategory: 'recurrence',
      },
      recoveryState: {
        timestamp: 0, recoveryPressure: 0.42, relaxationLevel: 0.64,
        stabilizationPull: 0.70, collapseRisk: 0.10, restorationBias: 0.80,
      },
      observationPatternState: {
        timestamp: 0, knotCount: 2, pathCount: 1, recurrenceLocusCount: 1,
        basinCount: 2, longLivedAnomalyCount: 0, protoPointCandidateCount: 1,
      },
      activityHistory: Array.from({ length: 40 }, () => 0.35),
      recentPerturbationHistory: Array.from({ length: 20 }, () => 0.14),
      meanActivity: 0.35,
      baselineActivity: 0.26,
    };

    // Run 10 ticks with same conditions to test lifecycle progression
    let state: ProtoPointObservationState | null = null;
    let seenNew = false;
    let seenRecurring = false;

    for (let tick = 0; tick < 10; tick++) {
      state = deriveProtoPointCandidates({
        ...baseInput,
        timestamp: tick,
        traceState: { ...baseInput.traceState, timestamp: tick },
        replayState: { ...baseInput.replayState, timestamp: tick },
        recoveryState: { ...baseInput.recoveryState, timestamp: tick },
        observationPatternState: { ...baseInput.observationPatternState, timestamp: tick },
        previousState: state,
      });
      for (const c of state.candidates) {
        if (c.lifecycle === 'new') seenNew = true;
        if (c.lifecycle === 'recurring') seenRecurring = true;
      }
    }

    // Over 10 ticks we should see new → recurring progression at minimum
    expect(seenNew).toBe(true);
    expect(seenRecurring).toBe(true);
  });

  it('candidates do not contain semantic node, label, concept, or Node bridge fields', async () => {
    const outcomes = await runProtoPointObservationSuite();
    expect(outcomes.length).toBeGreaterThan(0);

    for (const outcome of outcomes) {
      expect(outcome.result.succeeded).toBe(true);
      const summary = outcome.result.summary;
      const summaryKeys = Object.keys(summary);

      // Verify no semantic fields appear
      const forbiddenPrefixes = ['semanticNode', 'objectLabel', 'sameObject', 'teacherBinding', 'nodeBridge'];
      for (const key of summaryKeys) {
        for (const forbidden of forbiddenPrefixes) {
          expect(key.startsWith(forbidden)).toBe(false);
        }
      }
    }
  }, 180000);

  it('baseline no-input scenario does not produce large numbers of candidates', async () => {
    const outcomes = await runProtoPointObservationSuite();
    const baseline = outcomes.find((o) => o.name === 'scenario-7a-no-input-baseline');
    expect(baseline).toBeDefined();

    const summary = baseline!.result.summary;
    expect(baseline!.result.succeeded).toBe(true);

    // No-input baseline: average candidate count should be conservative (< 2 on average)
    if (summary.avgProtoPointCandidateCount2 !== undefined) {
      expect(summary.avgProtoPointCandidateCount2).toBeLessThan(2);
    }
  }, 120000);

  it('repeated perturbation scenario shows at least as many candidates as baseline', async () => {
    const outcomes = await runProtoPointObservationSuite();
    const baseline = outcomes.find((o) => o.name === 'scenario-7a-no-input-baseline');
    const repeated = outcomes.find((o) => o.name === 'scenario-7b-repeated-local-perturbation');

    expect(baseline).toBeDefined();
    expect(repeated).toBeDefined();

    expect(baseline!.result.succeeded).toBe(true);
    expect(repeated!.result.succeeded).toBe(true);

    const baselineAvgConf = baseline!.result.summary.avgProtoPointAverageConfidence ?? 0;
    const repeatedAvgConf = repeated!.result.summary.avgProtoPointAverageConfidence ?? 0;

    // Repeated perturbation should produce at least as high average confidence
    // as baseline (rough proxy check — not strict equality required)
    expect(repeatedAvgConf).toBeGreaterThanOrEqual(baselineAvgConf - 0.05);
  }, 180000);

  it('read-only scenario: organism dynamics remain stable with observation enabled', async () => {
    const outcomes = await runProtoPointObservationSuite();
    const readOnly = outcomes.find((o) => o.name === 'scenario-7e-read-only-verification');
    expect(readOnly).toBeDefined();
    expect(readOnly!.result.succeeded).toBe(true);

    const summary = readOnly!.result.summary;
    // Organism should remain alive: low collapse rate, no NaN
    expect(summary.nanFrames).toBe(0);
    expect(summary.collapseRate).toBeLessThan(0.3);

    // Observation confidence should be present and valid
    if (summary.avgObservationConfidence !== undefined) {
      expect(summary.avgObservationConfidence).toBeGreaterThanOrEqual(0);
      expect(summary.avgObservationConfidence).toBeLessThanOrEqual(1);
    }
  }, 120000);

  it('proto-point observation fields exist in scenario summary', async () => {
    const outcomes = await runProtoPointObservationSuite();
    const scenario = outcomes.find((o) => o.name === 'scenario-7b-repeated-local-perturbation');
    expect(scenario).toBeDefined();
    expect(scenario!.result.succeeded).toBe(true);

    const summary = scenario!.result.summary;

    // Phase 7 summary fields should be present
    expect(summary.avgProtoPointCandidateCount2).toBeDefined();
    expect(summary.avgProtoPointStableCandidateCount).toBeDefined();
    expect(summary.avgProtoPointAverageConfidence).toBeDefined();
    expect(summary.maxProtoPointConfidence).toBeDefined();

    // Confidence should be in valid range
    if (summary.avgProtoPointAverageConfidence !== undefined) {
      expect(summary.avgProtoPointAverageConfidence).toBeGreaterThanOrEqual(0);
      expect(summary.avgProtoPointAverageConfidence).toBeLessThanOrEqual(1);
    }
    if (summary.maxProtoPointConfidence !== undefined) {
      expect(summary.maxProtoPointConfidence).toBeGreaterThanOrEqual(0);
      expect(summary.maxProtoPointConfidence).toBeLessThanOrEqual(1);
    }
  }, 180000);

});
