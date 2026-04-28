import { describe, expect, it } from 'vitest';
import { deriveMediumProfileState } from '../../closure/deriveMediumProfileState.ts';
import { runScenario } from '../../experiments/runScenario.ts';
import {
  createMediumProfileFixture,
  runMediumProfileScenarioSuite,
} from '../scenario/mediumProfileScenario.ts';

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

describe('S4: Medium Profile / Delay-Echo-Resistance', () => {
  it('derives finite fallback values even when upstream states are missing', () => {
    const profile = deriveMediumProfileState({
      closure: null,
      reafference: null,
      world: null,
      bodySurface: null,
      pulse: null,
      returns: [],
      viability: null,
      previousProfile: null,
      dt: 1 / 60,
    });

    expect(profile.timestamp).toBe(0);
    for (const section of [profile.delay, profile.echo, profile.resistance]) {
      for (const value of Object.values(section)) {
        if (typeof value === 'number') {
          expect(Number.isFinite(value)).toBe(true);
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(1);
        }
      }
    }
    expect(profile.profileConfidence).toBeGreaterThanOrEqual(0);
    expect(profile.profileConfidence).toBeLessThanOrEqual(1);
  });

  it('captures stable vs unstable delay conditions as observer-side profile differences', () => {
    const outcomes = runMediumProfileScenarioSuite();
    const scenarioMap = Object.fromEntries(outcomes.map((outcome) => [outcome.name, outcome.profile]));

    expect(scenarioMap['S4-A-stable-delay-profile'].delay.delayVariance).toBeLessThan(0.01);
    expect(scenarioMap['S4-A-stable-delay-profile'].delay.stableDelayWindow).toBeGreaterThan(0.5);
    expect(scenarioMap['S4-B-unstable-delay-profile'].delay.delayVariance).toBeGreaterThan(
      scenarioMap['S4-A-stable-delay-profile'].delay.delayVariance,
    );
    expect(scenarioMap['S4-B-unstable-delay-profile'].delay.unstableDelayScore).toBeGreaterThan(0.25);
  });

  it('observes echo decay and saturation risk without trying to increase echo', () => {
    const outcomes = runMediumProfileScenarioSuite();
    const scenarioMap = Object.fromEntries(outcomes.map((outcome) => [outcome.name, outcome.profile]));

    expect(scenarioMap['S4-C-echo-decay-profile'].echo.echoDecayRate).toBeGreaterThan(0.1);
    expect(scenarioMap['S4-C-echo-decay-profile'].echo.echoPersistence).toBeLessThan(0.5);
    expect(scenarioMap['S4-D-echo-saturation-risk'].echo.echoSaturationRisk).toBeGreaterThan(0.75);
    expect(scenarioMap['S4-D-echo-saturation-risk'].echo.echoSaturationRisk).toBeGreaterThan(
      scenarioMap['S4-C-echo-decay-profile'].echo.echoSaturationRisk,
    );
  });

  it('distinguishes pass-through and blocked resistance conditions', () => {
    const outcomes = runMediumProfileScenarioSuite();
    const scenarioMap = Object.fromEntries(outcomes.map((outcome) => [outcome.name, outcome.profile]));

    expect(scenarioMap['S4-E-pass-through-resistance-risk'].resistance.returnAttenuation).toBeLessThan(0.2);
    expect(scenarioMap['S4-E-pass-through-resistance-risk'].resistance.transmissionRatio).toBeGreaterThan(0.8);
    expect(scenarioMap['S4-F-blocked-resistance-risk'].resistance.returnAttenuation).toBeGreaterThan(0.7);
    expect(scenarioMap['S4-F-blocked-resistance-risk'].resistance.transmissionRatio).toBeLessThan(0.2);
  });

  it('stays read-only and does not mutate pulse, world, return, or body inputs', () => {
    const frozenFixture = deepFreeze(createMediumProfileFixture());
    const before = JSON.stringify(frozenFixture);

    const profile = deriveMediumProfileState({
      closure: frozenFixture.closure,
      reafference: frozenFixture.reafference,
      world: frozenFixture.world,
      bodySurface: frozenFixture.bodySurface,
      pulse: frozenFixture.pulse,
      returns: frozenFixture.returns,
      viability: frozenFixture.viability,
      previousProfile: null,
      dt: frozenFixture.dt,
    });

    expect(profile.delay.averageReturnDelay).toBeGreaterThanOrEqual(0);
    expect(JSON.stringify(frozenFixture)).toBe(before);
  });

  it('adds no command-style feedback or semantic leak fields', () => {
    const outcomes = runMediumProfileScenarioSuite();
    const forbiddenSemanticFields = [
      'label', 'meaning', 'concept', 'category', 'sameObject',
      'teacherBinding', 'semanticNode', 'nodeBridge', 'llmTeacher',
      'languageMeaning', 'consciousness', 'selfAwareness',
    ];
    const forbiddenCommands = [
      'stabilize(',
      'forceActivity(',
      'addRandomPulse(',
      'resetWorld(',
      'suppressAll(',
    ];

    const source = `${deriveMediumProfileState.toString()}`;
    for (const forbidden of forbiddenCommands) {
      expect(source).not.toContain(forbidden);
    }

    for (const outcome of outcomes) {
      expect(outcome.inputSignature).toBe(outcome.postSignature);
      const allKeys = [
        ...Object.keys(outcome.profile),
        ...Object.keys(outcome.profile.delay),
        ...Object.keys(outcome.profile.echo),
        ...Object.keys(outcome.profile.resistance),
      ];
      for (const field of forbiddenSemanticFields) {
        expect(allKeys).not.toContain(field);
      }
    }
  });

  it('adds medium profile metrics to scenario snapshots and summaries', async () => {
    const result = await runScenario({
      name: 'S4-observer-medium-profile',
      totalFrames: 180,
      metricsInterval: 20,
      collectMetrics: true,
      touchScript: [
        { frame: 60, x: 0.5, y: 0.5, pressure: 0.9, duration: 8 },
      ],
      initialWorldMediumState: {
        feedbackDelay: 0.38,
        surfaceResistance: 0.44,
        echoLevel: 0.4,
        returnReadiness: 0.62,
      },
    });

    const mediumSnapshots = result.metrics.filter((metric) => metric.mp_delayAverageReturnDelay !== undefined);
    expect(mediumSnapshots.length).toBeGreaterThan(0);
    expect(result.summary.avgMpDelayAverageReturnDelay).toBeTypeOf('number');
    expect(result.summary.avgMpEchoSaturationRisk).toBeTypeOf('number');
    expect(result.summary.avgMpResistanceTransmissionRatio).toBeTypeOf('number');
  });
});
