import { describe, expect, it } from 'vitest';
import { deriveProtoNeuronCandidates } from '../../observer/deriveProtoNeuronCandidates.ts';
import type { ProtoNeuronCandidate } from '../../types/protoNeuronCandidate.ts';
import type { ProtoNeuronObservationState } from '../../types/protoNeuronObservationState.ts';
import { runProtoNeuronObservationSuite } from '../scenario/protoNeuronObservationScenario.ts';
import { runScenario } from '../../experiments/runScenario.ts';

describe('W7 Emergent Proto-Neuron Observation', () => {
  it('ProtoNeuronCandidate has no semantic label, meaning, concept, category, or sameObject fields', () => {
    const candidate: ProtoNeuronCandidate = {
      id: 'proto-neuron-slot-a',
      timestamp: 10,
      regionId: 'region-slot-a',
      excitability: 0.62,
      refractoryPattern: 0.48,
      localPropagation: 0.54,
      traceRetention: 0.58,
      recurrenceScore: 0.64,
      coActivationScore: 0.40,
      weakPlasticityScore: 0.44,
      closureCoupling: 0.32,
      confidence: 0.53,
      lifecycle: 'recurring',
    };

    const forbiddenFields = [
      'label', 'meaning', 'concept', 'category', 'sameObject',
      'teacherBinding', 'semanticNode', 'nodeBridge', 'llmTeacher',
    ];

    const keys = Object.keys(candidate);
    for (const field of forbiddenFields) {
      expect(keys).not.toContain(field);
    }
  });

  it('deriveProtoNeuronCandidates is pure for identical inputs', () => {
    const input = {
      timestamp: 120,
      traceState: {
        timestamp: 120,
        traceStrength: 0.66,
        recurrenceWeight: 0.68,
        salienceResidue: 0.48,
        replayReadiness: 0.54,
        replaySuppression: 0.18,
        recentPatternWeight: 0.52,
        settlingResidue: 0.36,
        recoveryLinkedResidue: 0.30,
      },
      replayState: {
        timestamp: 120,
        replayPressure: 0.46,
        replayReadiness: 0.56,
        consolidationGain: 0.40,
        activeReplayCount: 1,
        recentReplaySalience: 0.44,
        restConsolidationDepth: 0.24,
        replaySuppression: 0.16,
        lastReplayCategory: 'recurrence',
      },
      recoveryState: {
        timestamp: 120,
        recoveryPressure: 0.44,
        relaxationLevel: 0.60,
        stabilizationPull: 0.68,
        collapseRisk: 0.14,
        restorationBias: 0.72,
      },
      observationPatternState: {
        timestamp: 120,
        knotCount: 1,
        pathCount: 2,
        recurrenceLocusCount: 1,
        basinCount: 1,
        longLivedAnomalyCount: 0,
        protoPointCandidateCount: 1,
        observationConfidence: 0.82,
      },
      protoPointObservationState: {
        timestamp: 120,
        candidateCount: 1,
        stableCandidateCount: 1,
        averageConfidence: 0.48,
        maxConfidence: 0.48,
        candidates: [{
          id: 'slot-a',
          timestamp: 120,
          regionId: 'region-slot-a',
          persistence: 4,
          recurrenceScore: 0.62,
          traceAffinity: 0.56,
          replayAffinity: 0.42,
          localContrast: 0.50,
          basinOverlap: 0.44,
          knotOverlap: 0.46,
          confidence: 0.48,
          lifecycle: 'recurring',
        }],
      },
      bodyWorldClosureState: {
        timestamp: 120,
        loopGain: 0.78,
        roundTripDelay: 0.24,
        returnStrength: 0.56,
        selfCausedMatch: 0.52,
        worldMismatch: 0.28,
        closureStability: 0.62,
        closureDrift: 0.22,
        unresolvedReturn: 0.12,
        feedbackSaturationRisk: 0.20,
        comparisonConfidence: 0.64,
        returnMismatch: 0.32,
      },
      reafferenceComparisonState: {
        timestamp: 120,
        expectedReturn: 0.48,
        actualReturn: 0.56,
        returnDelay: 0.24,
        returnMismatch: 0.32,
        selfCausedMatch: 0.52,
        worldCausedDifference: 0.26,
        unresolvedReturn: 0.12,
        comparisonConfidence: 0.64,
      },
      pressureCompetitionState: {
        timestamp: 120,
        safetyPressure: 0.30,
        restorationPressure: 0.52,
        noveltyPressure: 0.24,
        repetitionPressure: 0.36,
        explorationPressure: 0.28,
        withdrawalPressure: 0.18,
        dominantPressure: 'restoration',
        competitionEntropy: 0.42,
        competitionStability: 0.58,
        annealingTemperature: 0.34,
      },
      actuationPulse: {
        timestamp: 120,
        channel: 'visual',
        intensity: 0.52,
        coherence: 0.60,
        rhythm: 0.42,
        locality: 0.34,
        recoveryLinked: 0.36,
        boundaryLinked: 0.30,
        traceLinked: 0.32,
        outputReadiness: 0.58,
      },
      activityHistory: Array.from({ length: 16 }, (_, index) => 0.24 + (index % 3 === 0 ? 0.30 : 0.08)),
      localPropagationHistory: Array.from({ length: 12 }, (_, index) => 0.30 + (index % 4) * 0.08),
      meanActivity: 0.36,
      baselineActivity: 0.20,
      ongoingness: 0.68,
      previousState: null,
    };

    const resultA = deriveProtoNeuronCandidates(input);
    const resultB = deriveProtoNeuronCandidates(input);

    expect(resultA).toEqual(resultB);
  });

  it('all proto-neuron scores stay finite and within conservative bounds', () => {
    const outcomes = runProtoNeuronObservationSuite();
    for (const outcome of outcomes) {
      expect(outcome.passed).toBe(true);
      const state: ProtoNeuronObservationState = outcome.finalState;
      expect(Number.isFinite(state.averageConfidence)).toBe(true);
      expect(state.averageConfidence).toBeGreaterThanOrEqual(0);
      expect(state.averageConfidence).toBeLessThanOrEqual(1);
      expect(state.averageExcitability).toBeGreaterThanOrEqual(0);
      expect(state.averageExcitability).toBeLessThanOrEqual(1);
      expect(state.averagePropagation).toBeGreaterThanOrEqual(0);
      expect(state.averagePropagation).toBeLessThanOrEqual(1);
      expect(state.averageTraceRetention).toBeGreaterThanOrEqual(0);
      expect(state.averageTraceRetention).toBeLessThanOrEqual(1);
      expect(state.averageClosureCoupling).toBeGreaterThanOrEqual(0);
      expect(state.averageClosureCoupling).toBeLessThanOrEqual(1);

      for (const candidate of state.candidates) {
        expect(candidate.confidence).toBeGreaterThanOrEqual(0);
        expect(candidate.confidence).toBeLessThanOrEqual(1);
        expect(candidate.excitability).toBeGreaterThanOrEqual(0);
        expect(candidate.excitability).toBeLessThanOrEqual(1);
        expect(candidate.localPropagation).toBeGreaterThanOrEqual(0);
        expect(candidate.localPropagation).toBeLessThanOrEqual(1);
        expect(candidate.traceRetention).toBeGreaterThanOrEqual(0);
        expect(candidate.traceRetention).toBeLessThanOrEqual(1);
      }
    }
  });

  it('scenario suite covers repeated excitation, trace retention, propagation, co-activation, and closure coupling', () => {
    const outcomes = runProtoNeuronObservationSuite();
    const byName = new Map(outcomes.map((outcome) => [outcome.name, outcome]));

    expect(byName.get('Scenario W7-B: repeated excitation raises excitability')?.passed).toBe(true);
    expect(byName.get('Scenario W7-C: trace-supported candidate')?.passed).toBe(true);
    expect(byName.get('Scenario W7-D: propagation-supported candidate')?.passed).toBe(true);
    expect(byName.get('Scenario W7-E: co-activation summary')?.passed).toBe(true);
    expect(byName.get('Scenario W7-F: closure-coupled candidate')?.passed).toBe(true);
  });

  it('read-only observation does not mutate source inputs or inject action fields', () => {
    const input = {
      timestamp: 1,
      traceState: {
        timestamp: 1,
        traceStrength: 0.62,
        recurrenceWeight: 0.64,
        salienceResidue: 0.46,
        replayReadiness: 0.52,
        replaySuppression: 0.18,
        recentPatternWeight: 0.48,
        settlingResidue: 0.32,
        recoveryLinkedResidue: 0.30,
      },
      replayState: {
        timestamp: 1,
        replayPressure: 0.44,
        replayReadiness: 0.54,
        consolidationGain: 0.38,
        activeReplayCount: 1,
        recentReplaySalience: 0.40,
        restConsolidationDepth: 0.24,
        replaySuppression: 0.16,
        lastReplayCategory: 'recurrence',
      },
      recoveryState: {
        timestamp: 1,
        recoveryPressure: 0.42,
        relaxationLevel: 0.60,
        stabilizationPull: 0.66,
        collapseRisk: 0.14,
        restorationBias: 0.74,
      },
      observationPatternState: {
        timestamp: 1,
        knotCount: 1,
        pathCount: 1,
        recurrenceLocusCount: 1,
        basinCount: 1,
        longLivedAnomalyCount: 0,
        protoPointCandidateCount: 1,
      },
      protoPointObservationState: {
        timestamp: 1,
        candidateCount: 1,
        stableCandidateCount: 0,
        averageConfidence: 0.46,
        maxConfidence: 0.46,
        candidates: [{
          id: 'slot-a',
          timestamp: 1,
          regionId: 'region-slot-a',
          persistence: 3,
          recurrenceScore: 0.60,
          traceAffinity: 0.54,
          replayAffinity: 0.42,
          localContrast: 0.48,
          basinOverlap: 0.44,
          knotOverlap: 0.46,
          confidence: 0.46,
          lifecycle: 'recurring',
        }],
      },
      bodyWorldClosureState: {
        timestamp: 1,
        loopGain: 0.80,
        roundTripDelay: 0.22,
        returnStrength: 0.56,
        selfCausedMatch: 0.52,
        worldMismatch: 0.28,
        closureStability: 0.62,
        closureDrift: 0.20,
        unresolvedReturn: 0.10,
        feedbackSaturationRisk: 0.18,
        returnMismatch: 0.30,
      },
      reafferenceComparisonState: {
        timestamp: 1,
        expectedReturn: 0.48,
        actualReturn: 0.56,
        returnDelay: 0.22,
        returnMismatch: 0.30,
        selfCausedMatch: 0.52,
        worldCausedDifference: 0.26,
        unresolvedReturn: 0.10,
        comparisonConfidence: 0.62,
      },
      pressureCompetitionState: {
        timestamp: 1,
        safetyPressure: 0.30,
        restorationPressure: 0.52,
        noveltyPressure: 0.24,
        repetitionPressure: 0.36,
        explorationPressure: 0.28,
        withdrawalPressure: 0.18,
        dominantPressure: 'restoration',
        competitionEntropy: 0.42,
        competitionStability: 0.58,
        annealingTemperature: 0.34,
      },
      actuationPulse: {
        timestamp: 1,
        channel: 'visual',
        intensity: 0.52,
        coherence: 0.60,
        rhythm: 0.42,
        locality: 0.34,
        recoveryLinked: 0.36,
        boundaryLinked: 0.30,
        traceLinked: 0.32,
        outputReadiness: 0.58,
      },
      activityHistory: [0.20, 0.44, 0.22, 0.46, 0.24, 0.48],
      localPropagationHistory: [0.24, 0.40, 0.32, 0.46],
      meanActivity: 0.36,
      baselineActivity: 0.20,
      ongoingness: 0.68,
      previousState: null,
    };

    const before = JSON.stringify(input);
    const result = deriveProtoNeuronCandidates(input);
    const after = JSON.stringify(input);

    expect(after).toBe(before);
    expect(Object.keys(result)).not.toContain('actionState');
    expect(Object.keys(result)).not.toContain('modeState');
  });

  it('scenario runner summary exposes proto-neuron observer/debug fields', async () => {
    const result = await runScenario({
      name: 'w7-proto-neuron-summary-smoke',
      totalFrames: 220,
      metricsInterval: 10,
      collectMetrics: true,
      touchScript: [
        { frame: 40, x: 0.5, y: 0.5, pressure: 1.0, duration: 3 },
        { frame: 90, x: 0.5, y: 0.5, pressure: 1.0, duration: 3 },
        { frame: 140, x: 0.5, y: 0.5, pressure: 1.0, duration: 3 },
      ],
    });

    expect(result.succeeded).toBe(true);
    expect(result.summary.protoNeuronStrongestCoActivationPair).not.toBeUndefined();
    expect(result.summary.protoNeuronLastCandidates).toBeDefined();
    expect(Array.isArray(result.summary.protoNeuronLastCandidates)).toBe(true);
    expect(result.summary.maxProtoNeuronConfidence ?? 0).toBeGreaterThanOrEqual(0);
  }, 120000);
});
