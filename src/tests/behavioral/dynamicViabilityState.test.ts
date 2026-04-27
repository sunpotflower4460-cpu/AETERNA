import { describe, expect, it } from 'vitest';
import { deriveDynamicViabilityState } from '../../closure/deriveDynamicViabilityState.ts';
import { runScenario } from '../../experiments/runScenario.ts';
import { runDynamicViabilityScenarioSuite } from '../scenario/dynamicViabilityScenario.ts';

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

describe('S2: Dynamic Viability State', () => {
  it('derives finite fallback values even when all upstream states are missing', () => {
    const state = deriveDynamicViabilityState({
      closure: null,
      world: null,
      bodySurface: null,
      pulse: null,
      returns: [],
      reafference: null,
      trace: null,
      previousViability: null,
      dt: 1 / 60,
    });

    expect(state.timestamp).toBe(0);

    for (const value of Object.values(state)) {
      if (typeof value === 'number') {
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    }
  });

  it('keeps viable middle flow higher-confidence than under/over/extinction cases', () => {
    const outcomes = runDynamicViabilityScenarioSuite();
    const scenarioMap = Object.fromEntries(outcomes.map((outcome) => [outcome.name, outcome.viability]));

    expect(scenarioMap['S2-A-viable-middle-flow'].viabilityConfidence).toBeGreaterThan(0.55);
    expect(scenarioMap['S2-A-viable-middle-flow'].flowContinuity).toBeGreaterThan(
      scenarioMap['S2-D-extinction-risk'].flowContinuity,
    );
    expect(scenarioMap['S2-A-viable-middle-flow'].viabilityConfidence).toBeGreaterThan(
      scenarioMap['S2-B-under-coupled-loop'].viabilityConfidence,
    );
    expect(scenarioMap['S2-A-viable-middle-flow'].viabilityConfidence).toBeGreaterThan(
      scenarioMap['S2-C-over-coupled-loop'].viabilityConfidence,
    );
  });

  it('raises underCouplingRisk when pulse persists but returns stay weak', () => {
    const outcomes = runDynamicViabilityScenarioSuite();
    const scenarioMap = Object.fromEntries(outcomes.map((outcome) => [outcome.name, outcome.viability]));

    expect(scenarioMap['S2-B-under-coupled-loop'].underCouplingRisk).toBeGreaterThan(0.45);
    expect(scenarioMap['S2-B-under-coupled-loop'].underCouplingRisk).toBeGreaterThan(
      scenarioMap['S2-A-viable-middle-flow'].underCouplingRisk,
    );
  });

  it('raises overCouplingRisk and saturationRisk when returns and echo amplify too strongly', () => {
    const outcomes = runDynamicViabilityScenarioSuite();
    const scenarioMap = Object.fromEntries(outcomes.map((outcome) => [outcome.name, outcome.viability]));

    expect(scenarioMap['S2-C-over-coupled-loop'].overCouplingRisk).toBeGreaterThan(0.55);
    expect(scenarioMap['S2-C-over-coupled-loop'].saturationRisk).toBeGreaterThan(0.6);
    expect(scenarioMap['S2-C-over-coupled-loop'].overCouplingRisk).toBeGreaterThan(
      scenarioMap['S2-A-viable-middle-flow'].overCouplingRisk,
    );
  });

  it('raises extinctionRisk when pulse, return, and trace all fade out', () => {
    const outcomes = runDynamicViabilityScenarioSuite();
    const scenarioMap = Object.fromEntries(outcomes.map((outcome) => [outcome.name, outcome.viability]));

    expect(scenarioMap['S2-D-extinction-risk'].extinctionRisk).toBeGreaterThan(0.7);
    expect(scenarioMap['S2-D-extinction-risk'].extinctionRisk).toBeGreaterThan(
      scenarioMap['S2-A-viable-middle-flow'].extinctionRisk,
    );
  });

  it('lowers delayCoherence when return timing becomes too delayed to stay coherent', () => {
    const outcomes = runDynamicViabilityScenarioSuite();
    const scenarioMap = Object.fromEntries(outcomes.map((outcome) => [outcome.name, outcome.viability]));

    expect(scenarioMap['S2-E-delay-incoherence'].delayCoherence).toBeLessThan(0.45);
    expect(scenarioMap['S2-E-delay-incoherence'].delayCoherence).toBeLessThan(
      scenarioMap['S2-A-viable-middle-flow'].delayCoherence,
    );
  });

  it('raises boundaryExchange when permeability and integrity stay in a middle range', () => {
    const outcomes = runDynamicViabilityScenarioSuite();
    const scenarioMap = Object.fromEntries(outcomes.map((outcome) => [outcome.name, outcome.viability]));

    expect(scenarioMap['S2-F-boundary-exchange-balance'].boundaryExchange).toBeGreaterThan(0.7);
    expect(scenarioMap['S2-F-boundary-exchange-balance'].boundaryExchange).toBeGreaterThanOrEqual(
      scenarioMap['S2-A-viable-middle-flow'].boundaryExchange,
    );
  });

  it('stays read-only and does not mutate pulse, world, or closure inputs', () => {
    const frozenInput = deepFreeze({
      closure: {
        timestamp: 100,
        loopGain: 1.38,
        roundTripDelay: 0.4,
        returnStrength: 0.92,
        selfCausedMatch: 0.55,
        worldMismatch: 0.22,
        closureStability: 0.24,
        closureDrift: 0.3,
        unresolvedReturn: 0.26,
        feedbackSaturationRisk: 0.91,
        comparisonConfidence: 0.58,
        returnMismatch: 0.22,
      },
      world: {
        timestamp: 100,
        ambientLight: 0.5,
        ambientNoise: 0.3,
        surfaceResistance: 0.18,
        echoLevel: 0.94,
        motionDrift: 0.22,
        fieldTemperature: 0.72,
        feedbackDelay: 0.42,
        lastPulseImpact: 0.9,
        mediumStability: 0.52,
        returnReadiness: 0.88,
      },
      bodySurface: {
        timestamp: 100,
        boundaryIntegrity: 0.7,
        surfaceSensitivity: 0.56,
        permeability: 0.52,
        contactReadiness: 0.6,
        outputReadiness: 0.68,
        localIrritability: 0.22,
        recoveryShielding: 0.26,
      },
      pulse: {
        timestamp: 100,
        channel: 'visual' as const,
        intensity: 0.74,
        coherence: 0.7,
        rhythm: 0.48,
        locality: 0.44,
        recoveryLinked: 0.24,
        boundaryLinked: 0.46,
        traceLinked: 0.32,
        outputReadiness: 0.7,
      },
      returns: [{
        timestamp: 101,
        channel: 'simulatedLight' as const,
        intensity: 0.94,
        novelty: 0.4,
        locality: 0.42,
        rhythm: 0.36,
        worldOriginStrength: 0.92,
        returnDelayHint: 0.42,
        mediumStabilityHint: 0.52,
        returnReadiness: 0.88,
      }],
      reafference: {
        timestamp: 100,
        expectedReturn: 0.58,
        actualReturn: 0.93,
        returnDelay: 0.42,
        returnMismatch: 0.35,
        selfCausedMatch: 0.56,
        worldCausedDifference: 0.28,
        unresolvedReturn: 0.26,
        comparisonConfidence: 0.58,
        returnAmplification: 0.35,
      },
      trace: {
        timestamp: 100,
        traceStrength: 0.8,
        recurrenceWeight: 0.62,
        salienceResidue: 0.76,
        replayReadiness: 0.72,
        replaySuppression: 0.16,
        settlingResidue: 0.44,
      },
    });

    const viability = deriveDynamicViabilityState({
      ...frozenInput,
      previousViability: null,
      dt: 1 / 60,
    });

    expect(viability.saturationRisk).toBeGreaterThan(0.6);
    expect(frozenInput.pulse.intensity).toBe(0.74);
    expect(frozenInput.world.echoLevel).toBe(0.94);
    expect(frozenInput.returns[0].intensity).toBe(0.94);
  });

  it('contains no semantic or consciousness fields', () => {
    const semanticForbiddenFields = [
      'label', 'meaning', 'concept', 'category', 'sameObject',
      'teacherBinding', 'semanticNode', 'nodeBridge', 'llmTeacher',
      'languageMeaning', 'consciousness', 'selfAwareness', 'lifeForce',
    ];

    const outcomes = runDynamicViabilityScenarioSuite();
    for (const outcome of outcomes) {
      const keys = Object.keys(outcome.viability);
      for (const field of semanticForbiddenFields) {
        expect(keys).not.toContain(field);
      }
      expect(outcome.inputSignature).toBe(outcome.postSignature);
    }
  });

  it('adds Dynamic Viability metrics to observer scenario snapshots and summaries', async () => {
    const result = await runScenario({
      name: 'S2-observer-dynamic-viability',
      totalFrames: 180,
      metricsInterval: 20,
      collectMetrics: true,
      touchScript: [
        { frame: 60, x: 0.5, y: 0.5, pressure: 0.9, duration: 8 },
      ],
      initialWorldMediumState: {
        feedbackDelay: 0.35,
        surfaceResistance: 0.48,
        returnReadiness: 0.6,
      },
    });

    const viabilitySnapshots = result.metrics.filter((metric) => metric.dv_flowContinuity !== undefined);
    expect(viabilitySnapshots.length).toBeGreaterThan(0);
    expect(result.summary.avgDvFlowContinuity).toBeTypeOf('number');
    expect(result.summary.avgDvViabilityConfidence).toBeTypeOf('number');
    expect(result.summary.avgDvBoundaryExchange).toBeTypeOf('number');
  });
});
