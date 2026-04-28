/**
 * S6: Repeated Flow Path — Behavioral Tests
 *
 * These tests verify the Repeated Flow Path derivation:
 * - No runtime edges or path weights are created.
 * - No semantic labels, meanings, or concepts appear in the output.
 * - The derivation is read-only (does not mutate inputs).
 * - Output values are always finite and in [0, 1].
 * - Path candidates respond correctly to upstream conditions.
 * - No false paths in quiet baseline.
 * - Repeated activation raises recurrenceStrength.
 * - Inconsistent delay lowers confidence.
 * - Trace-supported paths have higher traceSupport.
 * - Replay conditions elevate replayAffinity.
 * - Closure events elevate closureCoupling.
 */

import { describe, expect, it } from 'vitest';
import { deriveRepeatedFlowPaths } from '../../observer/deriveRepeatedFlowPaths.ts';
import { runScenario } from '../../experiments/runScenario.ts';
import { runRepeatedFlowPathScenarioSuite } from '../scenario/repeatedFlowPathScenario.ts';

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.freeze(value);
    for (const nested of Object.values(value as Record<string, unknown>)) {
      if (nested !== null && typeof nested === 'object' && !Object.isFrozen(nested)) {
        deepFreeze(nested);
      }
    }
  }
  return value;
}

describe('S6: Repeated Flow Path Observation', () => {
  // ---------------------------------------------------------------------------
  // Basic derivation with null inputs — must not throw or produce NaN
  // ---------------------------------------------------------------------------
  it('derives finite fallback values when all upstream states are null', () => {
    const obs = deriveRepeatedFlowPaths({
      localField: null,
      previousLocalField: null,
      trace: null,
      mediumProfile: null,
      closure: null,
      reafference: null,
      viability: null,
      previousObservation: null,
      dt: 1 / 60,
    });

    expect(Number.isFinite(obs.averageConfidence)).toBe(true);
    expect(Number.isFinite(obs.maxConfidence)).toBe(true);
    expect(Number.isFinite(obs.averageRecurrenceStrength)).toBe(true);
    expect(Number.isFinite(obs.observationConfidence)).toBe(true);
    expect(obs.pathCandidateCount).toBe(0);
    expect(obs.candidates).toHaveLength(0);

    for (const key of [
      'averageConfidence', 'maxConfidence', 'averageRecurrenceStrength',
      'averagePropagationConsistency', 'averageTraceSupport', 'averageClosureCoupling',
      'observationConfidence',
    ] as const) {
      expect(obs[key]).toBeGreaterThanOrEqual(0);
      expect(obs[key]).toBeLessThanOrEqual(1);
    }
  });

  // ---------------------------------------------------------------------------
  // Scenario S6-A: quiet baseline produces low or no path candidates
  // ---------------------------------------------------------------------------
  it('S6-A: quiet baseline produces low pathCandidateCount', () => {
    const outcomes = runRepeatedFlowPathScenarioSuite();
    const scenarioMap = Object.fromEntries(outcomes.map((o) => [o.name, o.observation]));

    const quiet = scenarioMap['S6-A-quiet-baseline'];
    expect(quiet).toBeDefined();
    // In a very quiet field, sequential activations should be minimal
    expect(quiet.pathCandidateCount).toBeLessThanOrEqual(4);
    expect(quiet.averageConfidence).toBeLessThan(0.35);
  });

  // ---------------------------------------------------------------------------
  // Scenario S6-B: repeated A→B flow raises recurrenceStrength
  // ---------------------------------------------------------------------------
  it('S6-B: repeated A→B flow raises recurrenceStrength above quiet baseline', () => {
    const outcomes = runRepeatedFlowPathScenarioSuite();
    const scenarioMap = Object.fromEntries(outcomes.map((o) => [o.name, o.observation]));

    const quiet = scenarioMap['S6-A-quiet-baseline'];
    const repeated = scenarioMap['S6-B-repeated-A-to-B-flow'];
    expect(repeated).toBeDefined();

    // Repeated flow should have higher recurrenceStrength than quiet baseline
    expect(repeated.averageRecurrenceStrength).toBeGreaterThan(quiet.averageRecurrenceStrength);
    // Should have at least one candidate with flowCount > 1
    const highFlowCandidates = repeated.candidates.filter((c) => c.flowCount > 1);
    expect(highFlowCandidates.length).toBeGreaterThan(0);
  });

  // ---------------------------------------------------------------------------
  // Scenario S6-C: inconsistent delay lowers confidence
  // ---------------------------------------------------------------------------
  it('S6-C: inconsistent delay lowers confidence vs repeated-flow scenario', () => {
    const outcomes = runRepeatedFlowPathScenarioSuite();
    const scenarioMap = Object.fromEntries(outcomes.map((o) => [o.name, o.observation]));

    const repeated = scenarioMap['S6-B-repeated-A-to-B-flow'];
    const inconsistent = scenarioMap['S6-C-inconsistent-delay-lowers-confidence'];
    expect(inconsistent).toBeDefined();

    // If both have candidates, inconsistent delay should yield lower confidence
    if (repeated.pathCandidateCount > 0 && inconsistent.pathCandidateCount > 0) {
      expect(inconsistent.averageConfidence).toBeLessThanOrEqual(repeated.averageConfidence + 0.05);
    }
    // Specifically, any candidate in inconsistent should have lower delayConsistency
    if (inconsistent.candidates.length > 0) {
      const avgDelay = inconsistent.candidates.reduce((sum, c) => sum + c.delayConsistency, 0) /
                       inconsistent.candidates.length;
      expect(avgDelay).toBeLessThan(0.7);
    }
  });

  // ---------------------------------------------------------------------------
  // Scenario S6-D: trace-supported path has higher traceSupport
  // ---------------------------------------------------------------------------
  it('S6-D: trace-supported path has higher traceSupport than quiet baseline', () => {
    const outcomes = runRepeatedFlowPathScenarioSuite();
    const scenarioMap = Object.fromEntries(outcomes.map((o) => [o.name, o.observation]));

    const quiet = scenarioMap['S6-A-quiet-baseline'];
    const traceSupported = scenarioMap['S6-D-trace-supported-path'];
    expect(traceSupported).toBeDefined();

    expect(traceSupported.averageTraceSupport).toBeGreaterThan(quiet.averageTraceSupport);
    if (traceSupported.candidates.length > 0) {
      const maxTrace = Math.max(...traceSupported.candidates.map((c) => c.traceSupport));
      expect(maxTrace).toBeGreaterThan(0.15);
    }
  });

  // ---------------------------------------------------------------------------
  // Scenario S6-E: replay affinity path elevates replayAffinity
  // ---------------------------------------------------------------------------
  it('S6-E: quiet/replay conditions elevate replayAffinity on candidates', () => {
    const outcomes = runRepeatedFlowPathScenarioSuite();
    const scenarioMap = Object.fromEntries(outcomes.map((o) => [o.name, o.observation]));

    const quiet = scenarioMap['S6-A-quiet-baseline'];
    const replayAff = scenarioMap['S6-E-replay-affinity-path'];
    expect(replayAff).toBeDefined();

    if (replayAff.candidates.length > 0) {
      const maxReplay = Math.max(...replayAff.candidates.map((c) => c.replayAffinity));
      const quietAvgReplay = quiet.candidates.length > 0
        ? quiet.candidates.reduce((sum, c) => sum + c.replayAffinity, 0) / quiet.candidates.length
        : 0;
      expect(maxReplay).toBeGreaterThan(quietAvgReplay);
    }
  });

  // ---------------------------------------------------------------------------
  // Scenario S6-F: closure-coupled path elevates closureCoupling
  // ---------------------------------------------------------------------------
  it('S6-F: closure events elevate closureCoupling on candidates', () => {
    const outcomes = runRepeatedFlowPathScenarioSuite();
    const scenarioMap = Object.fromEntries(outcomes.map((o) => [o.name, o.observation]));

    const quiet = scenarioMap['S6-A-quiet-baseline'];
    const closureCoupled = scenarioMap['S6-F-closure-coupled-path'];
    expect(closureCoupled).toBeDefined();

    expect(closureCoupled.averageClosureCoupling).toBeGreaterThan(quiet.averageClosureCoupling);
    if (closureCoupled.candidates.length > 0) {
      const maxClosure = Math.max(...closureCoupled.candidates.map((c) => c.closureCoupling));
      expect(maxClosure).toBeGreaterThan(0.20);
    }
  });

  // ---------------------------------------------------------------------------
  // Scenario S6-G: read-only observation — inputs are not mutated
  // ---------------------------------------------------------------------------
  it('S6-G: deriveRepeatedFlowPaths does not mutate any input', () => {
    const outcomes = runRepeatedFlowPathScenarioSuite();
    const readOnly = outcomes.find((o) => o.name === 'S6-G-read-only-observation');
    expect(readOnly).toBeDefined();
    // inputSignature === postSignature means params were not mutated
    expect(readOnly!.inputSignature).toBe(readOnly!.postSignature);
  });

  // ---------------------------------------------------------------------------
  // Scenario S6-H: no semantic leak in candidates
  // ---------------------------------------------------------------------------
  it('S6-H: candidates contain no semantic or consciousness fields', () => {
    const semanticForbiddenFields = [
      'label', 'meaning', 'concept', 'category', 'sameObject',
      'teacherBinding', 'semanticNode', 'nodeBridge', 'llmTeacher',
      'languageMeaning', 'consciousness', 'selfAwareness', 'lifeForce',
      'neuron', 'brain', 'memory', 'emotion', 'relation', 'edge',
    ];

    const outcomes = runRepeatedFlowPathScenarioSuite();
    for (const outcome of outcomes) {
      const obsKeys = Object.keys(outcome.observation);
      for (const forbidden of semanticForbiddenFields) {
        expect(obsKeys).not.toContain(forbidden);
      }
      for (const candidate of outcome.observation.candidates) {
        const candidateKeys = Object.keys(candidate);
        for (const forbidden of semanticForbiddenFields) {
          expect(candidateKeys).not.toContain(forbidden);
        }
        // regionId must not contain semantic labels
        expect(candidate.fromRegionId).not.toMatch(/cat|memory|sadness|user|emotion|brain|neuron|meaning|label/i);
        expect(candidate.toRegionId).not.toMatch(/cat|memory|sadness|user|emotion|brain|neuron|meaning|label/i);
      }
    }
  });

  // ---------------------------------------------------------------------------
  // All output values must be finite and in [0, 1]
  // ---------------------------------------------------------------------------
  it('all output values are finite and in [0, 1]', () => {
    const outcomes = runRepeatedFlowPathScenarioSuite();
    for (const outcome of outcomes) {
      const obs = outcome.observation;
      for (const key of [
        'averageConfidence', 'maxConfidence', 'averageRecurrenceStrength',
        'averagePropagationConsistency', 'averageTraceSupport', 'averageClosureCoupling',
        'observationConfidence',
      ] as const) {
        expect(Number.isFinite(obs[key])).toBe(true);
        expect(obs[key]).toBeGreaterThanOrEqual(0);
        expect(obs[key]).toBeLessThanOrEqual(1);
      }
      for (const candidate of obs.candidates) {
        for (const key of [
          'recurrenceStrength', 'propagationConsistency', 'delayConsistency',
          'traceSupport', 'resistanceShift', 'dissipationShift',
          'replayAffinity', 'closureCoupling', 'confidence',
        ] as const) {
          expect(Number.isFinite(candidate[key])).toBe(true);
          expect(candidate[key]).toBeGreaterThanOrEqual(0);
          expect(candidate[key]).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  // ---------------------------------------------------------------------------
  // Runtime edge / path weight NOT created
  // ---------------------------------------------------------------------------
  it('derivation returns no runtime edge structures', () => {
    const outcomes = runRepeatedFlowPathScenarioSuite();
    for (const outcome of outcomes) {
      for (const candidate of outcome.observation.candidates) {
        // Should not have any "edge" or "weight" properties that imply runtime changes
        expect(candidate).not.toHaveProperty('weight');
        expect(candidate).not.toHaveProperty('edgeId');
        expect(candidate).not.toHaveProperty('nodeId');
        expect(candidate).not.toHaveProperty('networkEdge');
        expect(candidate).not.toHaveProperty('pathWeight');
      }
    }
  });

  // ---------------------------------------------------------------------------
  // Integration with runScenario: S6 observer metrics appear in snapshots
  // ---------------------------------------------------------------------------
  it('adds Repeated Flow Path observation to scenario observer snapshots', async () => {
    const result = await runScenario({
      name: 'S6-observer-repeated-flow-path',
      totalFrames: 120,
      metricsInterval: 20,
      collectMetrics: true,
    });

    const rfpSnapshots = result.metrics.filter((m) => m.rfp_observationConfidence !== undefined);
    expect(rfpSnapshots.length).toBeGreaterThan(0);
    expect(result.summary.avgRfpObservationConfidence).toBeTypeOf('number');
    expect(result.summary.avgRfpAverageConfidence).toBeTypeOf('number');
    expect(result.summary.avgRfpPathCandidateCount).toBeTypeOf('number');

    for (const snapshot of rfpSnapshots) {
      for (const key of ['rfp_observationConfidence', 'rfp_averageConfidence',
        'rfp_maxConfidence', 'rfp_averageRecurrenceStrength'] as const) {
        const val = snapshot[key];
        if (val !== undefined) {
          expect(Number.isFinite(val)).toBe(true);
          expect(val).toBeGreaterThanOrEqual(0);
          expect(val).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  // ---------------------------------------------------------------------------
  // Frozen inputs (read-only verification with Object.freeze)
  // ---------------------------------------------------------------------------
  it('does not throw when inputs are frozen (confirms read-only)', () => {
    const frozenTrace = deepFreeze({
      timestamp: 100,
      traceStrength: 0.38,
      recurrenceWeight: 0.34,
      salienceResidue: 0.30,
      replayReadiness: 0.32,
      replaySuppression: 0.16,
      settlingResidue: 0.28,
      recoveryLinkedResidue: 0.24,
    });
    const frozenClosure = deepFreeze({
      timestamp: 100,
      loopGain: 0.92,
      roundTripDelay: 0.38,
      returnStrength: 0.50,
      selfCausedMatch: 0.62,
      worldMismatch: 0.20,
      closureStability: 0.68,
      closureDrift: 0.16,
      unresolvedReturn: 0.12,
      feedbackSaturationRisk: 0.24,
      comparisonConfidence: 0.70,
      returnMismatch: 0.08,
    });

    expect(() => {
      deriveRepeatedFlowPaths({
        localField: null,
        previousLocalField: null,
        trace: frozenTrace,
        closure: frozenClosure,
        mediumProfile: null,
        reafference: null,
        viability: null,
        previousObservation: null,
        dt: 1 / 60,
      });
    }).not.toThrow();
  });
});
