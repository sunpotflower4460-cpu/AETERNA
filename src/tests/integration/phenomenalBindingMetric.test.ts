/**
 * Tests for derivePhenomenalBindingMetric (Phase A).
 *
 * Phase A guarantees:
 *   - Empty / null inputs collapse to a zero metric.
 *   - All four numeric proxies stay in [0, 1] regardless of input.
 *   - Coalition entropy is high when activations are uniform, low when one
 *     signal dominates.
 *   - Binding strength rises with binding weight and self-coherence agreement.
 */

import { describe, it, expect } from 'vitest';
import {
  assembleGlobalIntegrationField,
  type GlobalIntegrationFieldInputs,
} from '../../integration/globalIntegrationField.ts';
import {
  createZeroPhenomenalBindingMetric,
  derivePhenomenalBindingMetric,
} from '../../integration/phenomenalBindingMetric.ts';
import type {
  Signal,
  SignalActivationKind,
  SignalBinding,
  SignalRuntimeResult,
} from '../../signal/types.ts';
import type { SelfWorldModelPacket } from '../../types/selfWorldModel.ts';
import type { InteroceptionPacket } from '../../types/interoception.ts';

function emptySignalRuntime(): SignalRuntimeResult {
  return {
    stimulus: { rawText: '', tokens: [], salience: 0, novelty: 0, emotionalCharge: 0, explicitQuestion: false },
    signals: [],
    boundary: { permeability: 0, selfOuterSeparation: 0, shockAbsorption: 0, externalPressure: 0 },
    field: { closeness: 0, fragility: 0, urgency: 0, permission: 0, answerPressure: 0, unfinishedness: 0 },
    bindings: [],
    protoMeanings: [],
    decision: {
      stance: 'hold', replyIntent: 'free_reflection', closeness: 0, answerDepth: 0,
      shouldAnswerQuestion: false, shouldOfferStep: false, shouldStayOpen: true, withheldBias: 0,
    },
    lexicalCandidates: [],
    sentencePlan: {},
    utterance: '',
    debugNotes: [],
  };
}

function makeSignal(id: string, activation: number, kind: SignalActivationKind = 'coactive'): Signal {
  return { id, label: id, source: 'self', activation, persistence: 0.5, kind, reasons: [] };
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

describe('createZeroPhenomenalBindingMetric', () => {
  it('returns all-zero numeric proxies', () => {
    const m = createZeroPhenomenalBindingMetric(42);
    expect(m.timestamp).toBe(42);
    expect(m.bindingStrength).toBe(0);
    expect(m.coalitionEntropy).toBe(0);
    expect(m.integrationPhiProxy).toBe(0);
    expect(m.dominantCoalitionWidth).toBe(0);
    expect(m.signalCount).toBe(0);
    expect(m.bindingCount).toBe(0);
  });
});

describe('derivePhenomenalBindingMetric - empty field', () => {
  it('returns a zero metric when there are no signals or packets', () => {
    const field = assembleGlobalIntegrationField(nullInputs(1));
    const m = derivePhenomenalBindingMetric(field);
    expect(m.bindingStrength).toBe(0);
    expect(m.coalitionEntropy).toBe(0);
    expect(m.dominantCoalitionWidth).toBe(0);
    expect(m.signalCount).toBe(0);
    expect(m.bindingCount).toBe(0);
  });
});

describe('derivePhenomenalBindingMetric - bounds', () => {
  it('keeps every proxy in [0, 1] for adversarial inputs', () => {
    const signal = emptySignalRuntime();
    signal.signals = [
      makeSignal('a', 9999, 'dominant'),
      makeSignal('b', -9999, 'dominant'),
      makeSignal('c', 0.5, 'coactive'),
    ];
    signal.bindings = [
      { id: 'b1', sourceId: 'a', targetId: 'b', weight: 9999, reasons: [] },
      { id: 'b2', sourceId: 'b', targetId: 'c', weight: -1, reasons: [] },
    ];

    const selfWorld: SelfWorldModelPacket = {
      timestamp: 1,
      selfCoherence: 9999,
      selfContinuity: -1,
      worldPressure: 9999,
      relationEngagement: 0,
    };
    const interoception: InteroceptionPacket = {
      timestamp: 1,
      energySense: 9999,
      overloadSense: 0,
      coherenceSense: -2,
      boundarySense: 0,
      restorationSense: 0,
      perturbationPressure: 0,
    };

    const field = assembleGlobalIntegrationField({
      ...nullInputs(1),
      signal,
      selfWorld,
      interoception,
    });
    const m = derivePhenomenalBindingMetric(field);
    for (const v of [m.bindingStrength, m.coalitionEntropy, m.integrationPhiProxy, m.dominantCoalitionWidth]) {
      expect(Number.isFinite(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});

describe('derivePhenomenalBindingMetric - coalition entropy', () => {
  it('is high when activations are uniform across many signals', () => {
    const signal = emptySignalRuntime();
    signal.signals = [
      makeSignal('a', 0.5),
      makeSignal('b', 0.5),
      makeSignal('c', 0.5),
      makeSignal('d', 0.5),
    ];
    const field = assembleGlobalIntegrationField({ ...nullInputs(1), signal });
    const m = derivePhenomenalBindingMetric(field);
    expect(m.coalitionEntropy).toBeGreaterThan(0.95);
  });

  it('is low when one signal dominates', () => {
    const signal = emptySignalRuntime();
    signal.signals = [
      makeSignal('a', 1.0, 'dominant'),
      makeSignal('b', 0.001, 'background'),
      makeSignal('c', 0.001, 'background'),
      makeSignal('d', 0.001, 'background'),
    ];
    const field = assembleGlobalIntegrationField({ ...nullInputs(1), signal });
    const m = derivePhenomenalBindingMetric(field);
    expect(m.coalitionEntropy).toBeLessThan(0.2);
  });
});

describe('derivePhenomenalBindingMetric - binding strength and coalition width', () => {
  it('rises with binding weight and self-coherence', () => {
    const baseSignal = emptySignalRuntime();
    baseSignal.signals = [
      makeSignal('a', 0.6, 'dominant'),
      makeSignal('b', 0.5, 'coactive'),
    ];

    const weakBindings: SignalBinding[] = [
      { id: 'b1', sourceId: 'a', targetId: 'b', weight: 0.05, reasons: [] },
    ];
    const strongBindings: SignalBinding[] = [
      { id: 'b1', sourceId: 'a', targetId: 'b', weight: 0.95, reasons: [] },
    ];
    const lowSelfWorld: SelfWorldModelPacket = {
      timestamp: 1, selfCoherence: 0.1, selfContinuity: 0.1, worldPressure: 0.1, relationEngagement: 0.1,
    };
    const highSelfWorld: SelfWorldModelPacket = {
      timestamp: 1, selfCoherence: 0.95, selfContinuity: 0.9, worldPressure: 0.1, relationEngagement: 0.5,
    };

    const weakField = assembleGlobalIntegrationField({
      ...nullInputs(1),
      signal: { ...baseSignal, bindings: weakBindings },
      selfWorld: lowSelfWorld,
    });
    const strongField = assembleGlobalIntegrationField({
      ...nullInputs(1),
      signal: { ...baseSignal, bindings: strongBindings },
      selfWorld: highSelfWorld,
    });

    const weak = derivePhenomenalBindingMetric(weakField);
    const strong = derivePhenomenalBindingMetric(strongField);

    expect(strong.bindingStrength).toBeGreaterThan(weak.bindingStrength);
    expect(strong.bindingCount).toBe(1);
    expect(weak.bindingCount).toBe(1);
  });

  it('counts only dominant/coactive signals as part of the coalition width', () => {
    const signal = emptySignalRuntime();
    signal.signals = [
      makeSignal('a', 0.7, 'dominant'),
      makeSignal('b', 0.6, 'coactive'),
      makeSignal('c', 0.5, 'background'),
      makeSignal('d', 0.0, 'suppressed'),
    ];
    const field = assembleGlobalIntegrationField({ ...nullInputs(1), signal });
    const m = derivePhenomenalBindingMetric(field);
    expect(m.dominantCoalitionWidth).toBeCloseTo(2 / 4, 6);
  });
});
