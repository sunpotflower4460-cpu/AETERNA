import { describe, expect, it } from 'vitest';
import { applyMinimalNaturalFeedback } from '../../closure/applyMinimalNaturalFeedback.ts';
import { deriveMinimalNaturalFeedback } from '../../closure/deriveMinimalNaturalFeedback.ts';
import { runScenario } from '../../experiments/runScenario.ts';
import {
  createNeutralNaturalFeedbackAdjustment,
  DEFAULT_NATURAL_FEEDBACK_FLAGS,
} from '../../types/naturalFeedbackAdjustment.ts';
import {
  createMinimalNaturalFeedbackScenarioFixture,
  runMinimalNaturalFeedbackScenarioSuite,
} from '../scenario/minimalNaturalFeedbackScenario.ts';

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

describe('S3: Minimal Natural Feedback', () => {
  it('derives finite weak adjustments even when closure/world/body/trace are missing', () => {
    const viableMiddle = createMinimalNaturalFeedbackScenarioFixture('viable-middle').viability;
    const adjustment = deriveMinimalNaturalFeedback({
      viability: viableMiddle,
      closure: null,
      world: null,
      bodySurface: null,
      trace: null,
      previousAdjustment: null,
      dt: 1 / 60,
    });

    for (const value of Object.values(adjustment)) {
      if (typeof value === 'number') {
        expect(Number.isFinite(value)).toBe(true);
      }
    }
    expect(Math.abs(adjustment.echoDecayAdjustment)).toBeLessThanOrEqual(0.05);
    expect(Math.abs(adjustment.returnGainAdjustment)).toBeLessThanOrEqual(0.05);
    expect(adjustment.adjustmentStrength).toBeLessThanOrEqual(1);
    expect(adjustment.adjustmentConfidence).toBeLessThanOrEqual(1);
  });

  it('weakly increases damping-related adjustments in over-coupled conditions without zeroing pulse or return', () => {
    const outcomes = runMinimalNaturalFeedbackScenarioSuite();
    const overCoupled = outcomes.find((outcome) => outcome.name === 'S3-A-over-coupled-loop-weak-damping');
    expect(overCoupled).toBeDefined();

    expect(overCoupled?.adjustment.echoDecayAdjustment ?? 0).toBeGreaterThan(0);
    expect(overCoupled?.adjustment.returnGainAdjustment ?? 0).toBeLessThan(0);
    expect(overCoupled?.adjustment.sensoryAttenuationAdjustment ?? 0).toBeGreaterThan(0);
    expect(overCoupled?.adjustment.pulseLeakageAdjustment ?? 0).toBeLessThan(0);
    expect(overCoupled?.adjustment.adjustmentStrength ?? 0).toBeGreaterThan(0.05);
    expect(overCoupled?.adjustment.adjustmentStrength ?? 0).toBeLessThan(0.6);

    const fixture = createMinimalNaturalFeedbackScenarioFixture('over-coupled');
    const applied = applyMinimalNaturalFeedback({
      world: fixture.world,
      returns: fixture.returns,
      pulse: fixture.pulse,
      bodySurface: fixture.bodySurface,
      trace: fixture.trace,
      adjustment: overCoupled?.adjustment ?? createNeutralNaturalFeedbackAdjustment(),
    });
    expect(applied.pulse?.intensity ?? 0).toBeGreaterThan(0);
    expect((applied.returns[0]?.intensity ?? 0)).toBeGreaterThan(0);
    expect(applied.report.appliedTargets).toContain('worldMedium');
  });

  it('weakly reopens leakage/return/permeability in under-coupled conditions without creating activity', () => {
    const outcomes = runMinimalNaturalFeedbackScenarioSuite();
    const underCoupled = outcomes.find((outcome) => outcome.name === 'S3-B-under-coupled-loop-weak-reopening');
    expect(underCoupled).toBeDefined();

    expect(underCoupled?.adjustment.pulseLeakageAdjustment ?? 0).toBeGreaterThan(0);
    expect(underCoupled?.adjustment.returnGainAdjustment ?? 0).toBeGreaterThan(0);
    expect(underCoupled?.adjustment.boundaryPermeabilityAdjustment ?? 0).toBeGreaterThan(0);
    expect(underCoupled?.adjustment.echoDecayAdjustment ?? 0).toBeLessThan(0);

    const fixture = createMinimalNaturalFeedbackScenarioFixture('under-coupled');
    const applied = applyMinimalNaturalFeedback({
      world: fixture.world,
      returns: fixture.returns,
      pulse: fixture.pulse,
      bodySurface: fixture.bodySurface,
      trace: fixture.trace,
      adjustment: underCoupled?.adjustment ?? createNeutralNaturalFeedbackAdjustment(),
    });
    expect(applied.pulse?.intensity ?? 0).toBeGreaterThan(0);
    expect(applied.returns.length).toBe(fixture.returns.length);
    expect(applied.bodySurface?.permeability ?? 0).toBeGreaterThan(fixture.bodySurface.permeability);
  });

  it('stays near zero when dynamic viability remains in a middle range', () => {
    const outcomes = runMinimalNaturalFeedbackScenarioSuite();
    const viable = outcomes.find((outcome) => outcome.name === 'S3-C-no-feedback-when-viable');
    expect(viable).toBeDefined();

    expect(Math.abs(viable?.adjustment.echoDecayAdjustment ?? 0)).toBeLessThan(0.02);
    expect(Math.abs(viable?.adjustment.returnGainAdjustment ?? 0)).toBeLessThan(0.02);
    expect(Math.abs(viable?.adjustment.pulseLeakageAdjustment ?? 0)).toBeLessThan(0.02);
    expect(viable?.adjustment.adjustmentStrength ?? 1).toBeLessThan(0.25);
  });

  it('supports ablation on/off comparison without letting feedback dominate the scenario', async () => {
    const baseConfig = {
      name: 'S3-D-ablation-comparison',
      totalFrames: 180,
      metricsInterval: 20,
      collectMetrics: true,
      touchScript: [
        { frame: 45, x: 0.5, y: 0.5, pressure: 0.92, duration: 10 },
      ],
      initialWorldMediumState: {
        feedbackDelay: 0.42,
        surfaceResistance: 0.3,
        echoLevel: 0.6,
        returnReadiness: 0.72,
      },
    };

    const enabled = await runScenario({
      ...baseConfig,
      name: 'S3-D-ablation-comparison-enabled',
      naturalFeedbackFlags: { minimalNaturalFeedbackEnabled: true },
    });
    const disabled = await runScenario({
      ...baseConfig,
      name: 'S3-D-ablation-comparison-disabled',
      naturalFeedbackFlags: { minimalNaturalFeedbackEnabled: false },
    });

    expect(enabled.metrics.some((metric) => metric.nf_adjustmentStrength !== undefined)).toBe(true);
    expect(enabled.summary.avgNfAdjustmentStrength).toBeTypeOf('number');
    expect(enabled.summary.naturalFeedbackFlags?.minimalNaturalFeedbackEnabled).toBe(true);
    expect(disabled.summary.naturalFeedbackFlags?.minimalNaturalFeedbackEnabled).toBe(false);
    expect(enabled.summary.avgNfFeedbackDominanceRisk ?? 0).toBeLessThan(0.6);
    // This loose band just checks that feedback stays weak enough not to take over
    // the scenario while still allowing measurable S3 condition shifts.
    expect(Math.abs(enabled.summary.finalMeanActivity - disabled.summary.finalMeanActivity)).toBeLessThan(3.5);
    expect(Math.abs((enabled.summary.avgDvFlowContinuity ?? 0) - (disabled.summary.avgDvFlowContinuity ?? 0))).toBeLessThan(0.25);
  });

  it('stays read-only for fixture inputs and does not mutate scenario state', () => {
    const frozenFixture = deepFreeze(createMinimalNaturalFeedbackScenarioFixture('over-coupled'));
    const before = JSON.stringify(frozenFixture);

    const adjustment = deriveMinimalNaturalFeedback({
      viability: frozenFixture.viability,
      closure: frozenFixture.closure,
      world: frozenFixture.world,
      bodySurface: frozenFixture.bodySurface,
      trace: frozenFixture.trace,
      previousAdjustment: frozenFixture.previousAdjustment,
      dt: frozenFixture.dt,
    });

    const applied = applyMinimalNaturalFeedback({
      world: frozenFixture.world,
      returns: frozenFixture.returns,
      pulse: frozenFixture.pulse,
      bodySurface: frozenFixture.bodySurface,
      trace: frozenFixture.trace,
      adjustment,
    });

    expect(adjustment.feedbackDominanceRisk ?? 0).toBeGreaterThanOrEqual(0);
    expect(applied.pulse?.intensity ?? 0).toBeGreaterThan(0);
    expect(JSON.stringify(frozenFixture)).toBe(before);
  });

  it('adds no command-style stabilization or semantic leak fields', () => {
    const source = `${deriveMinimalNaturalFeedback.toString()}\n${applyMinimalNaturalFeedback.toString()}`;
    const forbiddenCommands = [
      'stabilize(',
      'forceActivity(',
      'addRandomPulse(',
      'suppressAll(',
      'createReturn(',
      'boostProtoNeuron(',
    ];
    for (const forbidden of forbiddenCommands) {
      expect(source).not.toContain(forbidden);
    }

    const adjustmentKeys = Object.keys(createNeutralNaturalFeedbackAdjustment());
    const forbiddenSemanticFields = [
      'label', 'meaning', 'concept', 'category', 'sameObject',
      'teacherBinding', 'semanticNode', 'nodeBridge', 'llmTeacher',
      'languageMeaning', 'consciousness', 'selfAwareness',
    ];
    for (const field of forbiddenSemanticFields) {
      expect(adjustmentKeys).not.toContain(field);
      expect(Object.keys(DEFAULT_NATURAL_FEEDBACK_FLAGS)).not.toContain(field);
    }
  });
});
