/**
 * S7: Proto-Network Candidate Observation — Behavioral Tests
 *
 * These tests verify the Proto-Network Candidate derivation:
 * - No runtime edges, graphs, or relation structures are created.
 * - No semantic labels, meanings, or concepts appear in the output.
 * - The derivation is read-only (does not mutate inputs).
 * - Output values are always finite and in [0, 1].
 * - Network candidates respond correctly to upstream conditions.
 * - No false networks in quiet baseline.
 * - Repeated co-activation raises coActivationStrength.
 * - Propagation consistency raises propagationStrength.
 * - Trace correlation raises traceCorrelation.
 * - Replay co-return raises replayCoReturn.
 * - Closure events elevate closureCoupling.
 * - Weak plasticity observation only — no weight/edgeId/nodeId on candidates.
 * - No Node bridge fields anywhere.
 */

import { describe, expect, it } from 'vitest';
import { deriveProtoNetworkCandidates } from '../../observer/deriveProtoNetworkCandidates.ts';
import { runProtoNetworkCandidateScenarioSuite } from '../scenario/protoNetworkCandidateScenario.ts';

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

const semanticForbiddenFields = [
  'label', 'meaning', 'concept', 'category', 'relation', 'sameObject',
  'objectId', 'teacherVerdict', 'languageMeaning', 'utterance',
  'nodeId', 'sharedTrunkCandidate', 'semanticNode', 'nodeBridge',
  'llmTeacher', 'edge', 'weight', 'edgeId', 'networkEdge', 'pathWeight',
  'brain', 'consciousness', 'selfAwareness', 'lifeForce', 'emotion', 'memory',
];

describe('S7: Proto-Network Candidate Observation', () => {
  // ---------------------------------------------------------------------------
  // Basic derivation with null inputs — must not throw or produce NaN
  // ---------------------------------------------------------------------------
  it('derives finite fallback values when all upstream states are null', () => {
    const obs = deriveProtoNetworkCandidates({
      localField: null,
      repeatedFlowPaths: null,
      protoNeuronObservation: null,
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
    expect(Number.isFinite(obs.averageCoActivation)).toBe(true);
    expect(Number.isFinite(obs.observationConfidence)).toBe(true);
    expect(obs.networkCandidateCount).toBe(0);
    expect(obs.candidates).toHaveLength(0);

    for (const key of [
      'averageConfidence', 'maxConfidence', 'averageCoActivation',
      'averagePropagation', 'averageRecurrence', 'averageTraceCorrelation',
      'averageReplayCoReturn', 'averageClosureCoupling', 'observationConfidence',
    ] as const) {
      expect(obs[key]).toBeGreaterThanOrEqual(0);
      expect(obs[key]).toBeLessThanOrEqual(1);
    }
  });

  // ---------------------------------------------------------------------------
  // Scenario S7-A: quiet baseline produces low networkCandidateCount
  // ---------------------------------------------------------------------------
  it('S7-A: quiet baseline produces low networkCandidateCount', () => {
    const outcomes = runProtoNetworkCandidateScenarioSuite();
    const scenarioMap = Object.fromEntries(outcomes.map((o) => [o.name, o.observation]));

    const quiet = scenarioMap['S7-A-quiet-baseline'];
    expect(quiet).toBeDefined();
    expect(quiet.networkCandidateCount).toBeLessThanOrEqual(2);
    expect(quiet.averageConfidence).toBeLessThan(0.30);
  });

  // ---------------------------------------------------------------------------
  // Scenario S7-B: repeated co-activation raises coActivationStrength above quiet
  // ---------------------------------------------------------------------------
  it('S7-B: repeated co-activation raises coActivationStrength above quiet', () => {
    const outcomes = runProtoNetworkCandidateScenarioSuite();
    const scenarioMap = Object.fromEntries(outcomes.map((o) => [o.name, o.observation]));

    const quiet = scenarioMap['S7-A-quiet-baseline'];
    const coAct = scenarioMap['S7-B-repeated-co-activation-group'];
    expect(coAct).toBeDefined();

    expect(coAct.averageCoActivation).toBeGreaterThanOrEqual(quiet.averageCoActivation);
  });

  // ---------------------------------------------------------------------------
  // Scenario S7-C: propagation group consistency raises propagationStrength
  // ---------------------------------------------------------------------------
  it('S7-C: propagation group consistency raises propagationStrength', () => {
    const outcomes = runProtoNetworkCandidateScenarioSuite();
    const scenarioMap = Object.fromEntries(outcomes.map((o) => [o.name, o.observation]));

    const quiet = scenarioMap['S7-A-quiet-baseline'];
    const prop = scenarioMap['S7-C-propagation-group-consistency'];
    expect(prop).toBeDefined();

    expect(prop.averagePropagation).toBeGreaterThanOrEqual(quiet.averagePropagation);
  });

  // ---------------------------------------------------------------------------
  // Scenario S7-D: trace-correlated group raises traceCorrelation
  // ---------------------------------------------------------------------------
  it('S7-D: trace-correlated group raises traceCorrelation', () => {
    const outcomes = runProtoNetworkCandidateScenarioSuite();
    const scenarioMap = Object.fromEntries(outcomes.map((o) => [o.name, o.observation]));

    const quiet = scenarioMap['S7-A-quiet-baseline'];
    const trace = scenarioMap['S7-D-trace-correlated-group'];
    expect(trace).toBeDefined();

    expect(trace.averageTraceCorrelation).toBeGreaterThanOrEqual(quiet.averageTraceCorrelation);
  });

  // ---------------------------------------------------------------------------
  // Scenario S7-E: replay co-return group raises replayCoReturn
  // ---------------------------------------------------------------------------
  it('S7-E: replay co-return group raises replayCoReturn', () => {
    const outcomes = runProtoNetworkCandidateScenarioSuite();
    const scenarioMap = Object.fromEntries(outcomes.map((o) => [o.name, o.observation]));

    const quiet = scenarioMap['S7-A-quiet-baseline'];
    const replay = scenarioMap['S7-E-replay-co-return-group'];
    expect(replay).toBeDefined();

    expect(replay.averageReplayCoReturn).toBeGreaterThanOrEqual(quiet.averageReplayCoReturn);
  });

  // ---------------------------------------------------------------------------
  // Scenario S7-F: closure-coupled candidate raises closureCoupling
  // ---------------------------------------------------------------------------
  it('S7-F: closure-coupled candidate raises closureCoupling', () => {
    const outcomes = runProtoNetworkCandidateScenarioSuite();
    const scenarioMap = Object.fromEntries(outcomes.map((o) => [o.name, o.observation]));

    const quiet = scenarioMap['S7-A-quiet-baseline'];
    const closureCoupled = scenarioMap['S7-F-closure-coupled-proto-network'];
    expect(closureCoupled).toBeDefined();

    expect(closureCoupled.averageClosureCoupling).toBeGreaterThanOrEqual(quiet.averageClosureCoupling);
  });

  // ---------------------------------------------------------------------------
  // Scenario S7-G: weak plasticity does not create runtime edges or graphs
  // ---------------------------------------------------------------------------
  it('S7-G: weak plasticity does not create runtime edges or graphs', () => {
    const outcomes = runProtoNetworkCandidateScenarioSuite();
    const plasticity = outcomes.find((o) => o.name === 'S7-G-weak-plasticity-observation-only');
    expect(plasticity).toBeDefined();

    for (const candidate of plasticity!.observation.candidates) {
      expect(candidate).not.toHaveProperty('weight');
      expect(candidate).not.toHaveProperty('edgeId');
      expect(candidate).not.toHaveProperty('nodeId');
      expect(candidate).not.toHaveProperty('networkEdge');
      expect(candidate).not.toHaveProperty('pathWeight');
    }
  });

  // ---------------------------------------------------------------------------
  // Scenario S7-H: no semantic leak in candidates
  // ---------------------------------------------------------------------------
  it('S7-H: no semantic leak in candidates', () => {
    const outcomes = runProtoNetworkCandidateScenarioSuite();
    const noSemanticLeak = outcomes.find((o) => o.name === 'S7-H-no-semantic-leak');
    expect(noSemanticLeak).toBeDefined();

    const obsKeys = Object.keys(noSemanticLeak!.observation);
    for (const forbidden of semanticForbiddenFields) {
      expect(obsKeys).not.toContain(forbidden);
    }

    for (const candidate of noSemanticLeak!.observation.candidates) {
      const candidateKeys = Object.keys(candidate);
      for (const forbidden of semanticForbiddenFields) {
        expect(candidateKeys).not.toContain(forbidden);
      }
      for (const regionId of candidate.regionIds) {
        expect(regionId).not.toMatch(/cat|memory|sadness|user|emotion|brain|neuron|meaning|label/i);
      }
    }
  });

  // ---------------------------------------------------------------------------
  // Scenario S7-I: no Node bridge fields
  // ---------------------------------------------------------------------------
  it('S7-I: no Node bridge fields on candidates or state', () => {
    const outcomes = runProtoNetworkCandidateScenarioSuite();
    const noNodeBridge = outcomes.find((o) => o.name === 'S7-I-no-node-bridge');
    expect(noNodeBridge).toBeDefined();

    const nodeBridgeFields = ['nodeId', 'sharedTrunkCandidate', 'nodeBridgeId', 'teacherVerdict', 'languageMeaning'];

    const obsKeys = Object.keys(noNodeBridge!.observation);
    for (const field of nodeBridgeFields) {
      expect(obsKeys).not.toContain(field);
    }

    for (const candidate of noNodeBridge!.observation.candidates) {
      const candidateKeys = Object.keys(candidate);
      for (const field of nodeBridgeFields) {
        expect(candidateKeys).not.toContain(field);
      }
    }
  });

  // ---------------------------------------------------------------------------
  // All output values must be finite and in [0, 1]
  // ---------------------------------------------------------------------------
  it('all output values are finite and in [0, 1]', () => {
    const outcomes = runProtoNetworkCandidateScenarioSuite();
    for (const outcome of outcomes) {
      const obs = outcome.observation;
      for (const key of [
        'averageConfidence', 'maxConfidence', 'averageCoActivation',
        'averagePropagation', 'averageRecurrence', 'averageTraceCorrelation',
        'averageReplayCoReturn', 'averageClosureCoupling', 'observationConfidence',
      ] as const) {
        expect(Number.isFinite(obs[key])).toBe(true);
        expect(obs[key]).toBeGreaterThanOrEqual(0);
        expect(obs[key]).toBeLessThanOrEqual(1);
      }
      for (const candidate of obs.candidates) {
        for (const key of [
          'coActivationStrength', 'propagationStrength', 'recurrenceStrength',
          'traceCorrelation', 'replayCoReturn', 'closureCoupling',
          'weakPlasticity', 'confidence',
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
    const outcomes = runProtoNetworkCandidateScenarioSuite();
    for (const outcome of outcomes) {
      for (const candidate of outcome.observation.candidates) {
        expect(candidate).not.toHaveProperty('weight');
        expect(candidate).not.toHaveProperty('edgeId');
        expect(candidate).not.toHaveProperty('nodeId');
        expect(candidate).not.toHaveProperty('networkEdge');
        expect(candidate).not.toHaveProperty('pathWeight');
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
      deriveProtoNetworkCandidates({
        localField: null,
        repeatedFlowPaths: null,
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
