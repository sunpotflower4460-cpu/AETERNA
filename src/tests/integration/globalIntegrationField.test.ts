/**
 * Tests for assembleGlobalIntegrationField (Phase A).
 *
 * Phase A guarantees:
 *   - The module never modifies input objects.
 *   - The returned field is frozen (and so is its `features` sub-object).
 *   - Missing inputs (null/empty) collapse to zeroed numeric features.
 *   - Numeric features stay within their advertised bounds for arbitrary input.
 */

import { describe, it, expect } from 'vitest';
import {
  assembleGlobalIntegrationField,
  type GlobalIntegrationFieldInputs,
} from '../../integration/globalIntegrationField.ts';
import type { SignalRuntimeResult, Signal, SignalBinding } from '../../signal/types.ts';
import type { SensoryReturnPacket } from '../../types/sensoryReturnPacket.ts';
import type { InteroceptionPacket } from '../../types/interoception.ts';
import type { SelfWorldModelPacket } from '../../types/selfWorldModel.ts';
import type { BodyWorldClosureState } from '../../types/bodyWorldClosureState.ts';
import type { ArousalAwarenessState } from '../../types/arousalAwareness.ts';

function emptySignalRuntime(): SignalRuntimeResult {
  return {
    stimulus: {
      rawText: '',
      tokens: [],
      salience: 0,
      novelty: 0,
      emotionalCharge: 0,
      explicitQuestion: false,
    },
    signals: [],
    boundary: {
      permeability: 0,
      selfOuterSeparation: 0,
      shockAbsorption: 0,
      externalPressure: 0,
    },
    field: {
      closeness: 0,
      fragility: 0,
      urgency: 0,
      permission: 0,
      answerPressure: 0,
      unfinishedness: 0,
    },
    bindings: [],
    protoMeanings: [],
    decision: {
      stance: 'hold',
      replyIntent: 'free_reflection',
      closeness: 0,
      answerDepth: 0,
      shouldAnswerQuestion: false,
      shouldOfferStep: false,
      shouldStayOpen: true,
      withheldBias: 0,
    },
    lexicalCandidates: [],
    sentencePlan: {},
    utterance: '',
    debugNotes: [],
  };
}

function nullInputs(tickId = 0): GlobalIntegrationFieldInputs {
  return {
    tickId,
    timestamp: tickId,
    bodySurface: null,
    bodyWorldClosure: null,
    sensoryReturns: null,
    interoception: null,
    selfWorld: null,
    signal: null,
    living: null,
    arousal: null,
  };
}

describe('assembleGlobalIntegrationField - missing inputs', () => {
  it('returns a frozen object with zeroed features when all inputs are null', () => {
    const field = assembleGlobalIntegrationField(nullInputs(7));
    expect(Object.isFrozen(field)).toBe(true);
    expect(Object.isFrozen(field.features)).toBe(true);
    expect(field.tickId).toBe(7);
    expect(field.sensoryReturns).toEqual([]);
    expect(field.features.signalCount).toBe(0);
    expect(field.features.bindingCount).toBe(0);
    expect(field.features.signalMeanActivation).toBe(0);
    expect(field.features.bindingMeanWeight).toBe(0);
    expect(field.features.sensoryMeanIntensity).toBe(0);
    expect(field.features.sensoryMeanNovelty).toBe(0);
    expect(field.features.selfCoherence).toBe(0);
    expect(field.features.energySense).toBe(0);
  });

  it('refuses to be mutated after assembly', () => {
    const field = assembleGlobalIntegrationField(nullInputs(1));
    expect(() => {
      (field as { tickId: number }).tickId = 999;
    }).toThrow();
    expect(() => {
      (field.features as { selfCoherence: number }).selfCoherence = 999;
    }).toThrow();
  });
});

describe('assembleGlobalIntegrationField - signal aggregation', () => {
  it('averages signal activations and binding weights', () => {
    const signal: SignalRuntimeResult = emptySignalRuntime();
    const signals: Signal[] = [
      { id: 'a', label: 'a', source: 'self', activation: 0.8, persistence: 0.5, kind: 'dominant', reasons: [] },
      { id: 'b', label: 'b', source: 'self', activation: 0.4, persistence: 0.5, kind: 'coactive', reasons: [] },
      { id: 'c', label: 'c', source: 'self', activation: 0.0, persistence: 0.5, kind: 'background', reasons: [] },
    ];
    const bindings: SignalBinding[] = [
      { id: 'b1', sourceId: 'a', targetId: 'b', weight: 0.6, reasons: [] },
      { id: 'b2', sourceId: 'b', targetId: 'c', weight: 0.2, reasons: [] },
    ];
    signal.signals = signals;
    signal.bindings = bindings;

    const field = assembleGlobalIntegrationField({
      ...nullInputs(2),
      signal,
    });

    expect(field.features.signalCount).toBe(3);
    expect(field.features.bindingCount).toBe(2);
    expect(field.features.signalMeanActivation).toBeCloseTo((0.8 + 0.4 + 0.0) / 3, 6);
    expect(field.features.bindingMeanWeight).toBeCloseTo((0.6 + 0.2) / 2, 6);
  });

  it('clamps non-finite or negative values to 0', () => {
    const signal: SignalRuntimeResult = emptySignalRuntime();
    signal.signals = [
      { id: 'a', label: 'a', source: 'self', activation: Number.NaN, persistence: 0.5, kind: 'dominant', reasons: [] },
      { id: 'b', label: 'b', source: 'self', activation: -0.5, persistence: 0.5, kind: 'coactive', reasons: [] },
    ];

    const field = assembleGlobalIntegrationField({ ...nullInputs(3), signal });
    expect(field.features.signalMeanActivation).toBe(0);
    expect(Number.isFinite(field.features.signalMeanActivation)).toBe(true);
  });
});

describe('assembleGlobalIntegrationField - sensory and packet readouts', () => {
  it('averages sensory return intensity and novelty', () => {
    const sensoryReturns: SensoryReturnPacket[] = [
      {
        timestamp: 1, channel: 'simulatedLight', intensity: 0.9, novelty: 0.3,
        locality: 0.5, rhythm: 0.5, worldOriginStrength: 0.7, returnDelayHint: 0.1, mediumStabilityHint: 0.8,
      },
      {
        timestamp: 1, channel: 'simulatedNoise', intensity: 0.1, novelty: 0.7,
        locality: 0.5, rhythm: 0.5, worldOriginStrength: 0.7, returnDelayHint: 0.1, mediumStabilityHint: 0.8,
      },
    ];

    const field = assembleGlobalIntegrationField({ ...nullInputs(4), sensoryReturns });
    expect(field.features.sensoryMeanIntensity).toBeCloseTo(0.5, 6);
    expect(field.features.sensoryMeanNovelty).toBeCloseTo(0.5, 6);
    expect(field.sensoryReturns).toHaveLength(2);
    expect(Object.isFrozen(field.sensoryReturns)).toBe(true);
  });

  it('reads selfCoherence, energySense, loopGain from packets', () => {
    const interoception: InteroceptionPacket = {
      timestamp: 5,
      energySense: 0.6,
      overloadSense: 0.2,
      coherenceSense: 0.7,
      boundarySense: 0.55,
      restorationSense: 0.4,
      perturbationPressure: 0.1,
    };
    const selfWorld: SelfWorldModelPacket = {
      timestamp: 5,
      selfCoherence: 0.8,
      selfContinuity: 0.65,
      worldPressure: 0.3,
      relationEngagement: 0.5,
    };
    const bodyWorldClosure: BodyWorldClosureState = {
      timestamp: 5,
      loopGain: 0.42,
      roundTripDelay: 0.15,
      returnStrength: 0.5,
      selfCausedMatch: 0.4,
      worldMismatch: 0.2,
      closureStability: 0.6,
      closureDrift: 0.1,
      unresolvedReturn: 0.05,
      feedbackSaturationRisk: 0.1,
    };
    const arousal: ArousalAwarenessState = {
      timestamp: 5,
      arousalLevel: 0.5,
      awarenessWindow: 0.6,
      salienceOpenness: 0.5,
      foregroundPressure: 0.4,
      restDepth: 0.3,
      hyperreactivity: 0.1,
      settlingWindow: 0.5,
    };

    const field = assembleGlobalIntegrationField({
      ...nullInputs(5),
      interoception,
      selfWorld,
      bodyWorldClosure,
      arousal,
    });

    expect(field.features.selfCoherence).toBe(0.8);
    expect(field.features.selfContinuity).toBe(0.65);
    expect(field.features.energySense).toBe(0.6);
    expect(field.features.boundarySense).toBe(0.55);
    expect(field.features.coherenceSense).toBe(0.7);
    expect(field.features.loopGain).toBe(0.42);
    expect(field.features.awarenessWindow).toBe(0.6);
    expect(field.features.foregroundPressure).toBe(0.4);
  });
});
