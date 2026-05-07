/**
 * Tests for deriveReentryDeltas (Phase B).
 *
 * Phase B guarantees:
 *   - Closed gate (governor gain == 0) returns all-zero deltas regardless
 *     of input. This is the Phase A invariant: no observation reaches
 *     core unless setGovernorGain explicitly opens the path.
 *   - Per-channel limits are never exceeded, even after EMA, even with
 *     adversarial inputs.
 *   - saturationRatio in [0, 1] and totalSignedMagnitude is finite.
 *   - When the gate is closed, smoothedDeltas decay toward zero so a
 *     subsequent re-open does not replay yesterday's residue.
 *   - When the gate opens, deltas approach (and never exceed) the per-
 *     channel limits scaled by the master gain.
 */

import { describe, it, expect } from 'vitest';
import {
  assembleGlobalIntegrationField,
  type GlobalIntegrationFieldInputs,
} from '../../integration/globalIntegrationField.ts';
import { derivePhenomenalBindingMetric } from '../../integration/phenomenalBindingMetric.ts';
import {
  createInitialGovernor,
  GOVERNOR_GAIN_HARD_CAP,
  setGovernorGain,
  tripGovernor,
} from '../../integration/consciousnessSafetyGovernor.ts';
import {
  createInitialReentryState,
  deriveReentryDeltas,
  REENTRY_LIMITS,
} from '../../integration/reentryModulator.ts';
import {
  createInitialPredictorState,
  runHierarchicalPredictor,
} from '../../perception/hierarchicalPredictor.ts';
import type { SensoryReturnPacket } from '../../types/sensoryReturnPacket.ts';
import type { SelfWorldModelPacket } from '../../types/selfWorldModel.ts';
import type { SignalRuntimeResult, Signal } from '../../signal/types.ts';

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

function emptySignal(): SignalRuntimeResult {
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

function makeSignal(id: string, activation: number, kind: Signal['kind'] = 'coactive'): Signal {
  return { id, label: id, source: 'self', activation, persistence: 0.5, kind, reasons: [] };
}

function sensory(intensity: number, novelty: number): SensoryReturnPacket {
  return {
    timestamp: 0,
    channel: 'simulatedLight',
    intensity,
    novelty,
    locality: 0.5,
    rhythm: 0.5,
    worldOriginStrength: 0.5,
    returnDelayHint: 0,
    mediumStabilityHint: 0.5,
  };
}

function selfWorld(coherence: number, continuity: number): SelfWorldModelPacket {
  return {
    timestamp: 0,
    selfCoherence: coherence,
    selfContinuity: continuity,
    worldPressure: 0,
    relationEngagement: 0.5,
  };
}

describe('deriveReentryDeltas - closed gate', () => {
  it('returns zero deltas when the governor has not opened the gate', () => {
    const field = assembleGlobalIntegrationField({
      ...nullInputs(),
      sensoryReturns: [sensory(0.9, 0.9)],
      selfWorld: selfWorld(0.2, 0.2),
    });
    const binding = derivePhenomenalBindingMetric(field);
    const ps = runHierarchicalPredictor(field, createInitialPredictorState(), { mode: 'observe' });
    const out = deriveReentryDeltas(createInitialReentryState(), {
      field,
      binding,
      hpError: ps.error,
      inferenceSuggestion: ps.inferenceSuggestion,
      governor: createInitialGovernor(), // gain = 0
    });
    expect(out.diagnostics.gateOpen).toBe(false);
    expect(out.deltas.curiosityBiasDelta).toBe(0);
    expect(out.deltas.internalUtteranceBiasDelta).toBe(0);
    expect(out.deltas.bindingCoherenceDelta).toBe(0);
    expect(out.deltas.hierarchicalErrorBiasDelta).toBe(0);
    expect(out.diagnostics.saturationRatio).toBe(0);
  });

  it('returns zero deltas when the governor is tripped even if smoothing was non-zero', () => {
    let governor = setGovernorGain(createInitialGovernor(), GOVERNOR_GAIN_HARD_CAP);
    let state = createInitialReentryState();
    let predictor = createInitialPredictorState();

    // Run a few open-gate ticks so smoothing accumulates.
    for (let t = 0; t < 5; t++) {
      const field = assembleGlobalIntegrationField({
        ...nullInputs(t),
        sensoryReturns: [sensory(0.9, 0.1)],
        selfWorld: selfWorld(0.2, 0.2),
      });
      const ps = runHierarchicalPredictor(field, predictor, { mode: 'observe' });
      predictor = ps.state;
      const out = deriveReentryDeltas(state, {
        field,
        binding: derivePhenomenalBindingMetric(field),
        hpError: ps.error,
        inferenceSuggestion: ps.inferenceSuggestion,
        governor,
      });
      state = out.state;
    }

    governor = tripGovernor(governor, 'energyCollapse', 'forced', 99, 99);
    const field = assembleGlobalIntegrationField({ ...nullInputs(99) });
    const ps = runHierarchicalPredictor(field, predictor, { mode: 'observe' });
    const out = deriveReentryDeltas(state, {
      field,
      binding: derivePhenomenalBindingMetric(field),
      hpError: ps.error,
      inferenceSuggestion: ps.inferenceSuggestion,
      governor,
    });
    expect(out.deltas.curiosityBiasDelta).toBe(0);
    expect(out.deltas.internalUtteranceBiasDelta).toBe(0);
    expect(out.deltas.bindingCoherenceDelta).toBe(0);
    expect(out.deltas.hierarchicalErrorBiasDelta).toBe(0);
    expect(out.diagnostics.gateOpen).toBe(false);
  });
});

describe('deriveReentryDeltas - open gate respects per-channel limits', () => {
  it('clamps every delta to its per-channel limit even with adversarial input', () => {
    const governor = setGovernorGain(createInitialGovernor(), GOVERNOR_GAIN_HARD_CAP);
    let state = createInitialReentryState();
    let predictor = createInitialPredictorState();

    // 50 ticks of saturating input: every layer maximally surprising, no
    // binding, no self-coherence.
    for (let t = 0; t < 50; t++) {
      const signal = emptySignal();
      signal.signals = [makeSignal('a', 1, 'dominant')];
      signal.bindings = [{ id: 'b', sourceId: 'a', targetId: 'a', weight: 0, reasons: [] }];

      const field = assembleGlobalIntegrationField({
        ...nullInputs(t),
        sensoryReturns: [sensory(t % 2 === 0 ? 0.95 : 0.05, t % 2 === 0 ? 0.05 : 0.95)],
        selfWorld: selfWorld(t % 2 === 0 ? 0.05 : 0.95, t % 2 === 0 ? 0.05 : 0.95),
        signal,
      });
      const ps = runHierarchicalPredictor(field, predictor, { mode: 'activeInference' });
      predictor = ps.state;
      const out = deriveReentryDeltas(state, {
        field,
        binding: derivePhenomenalBindingMetric(field),
        hpError: ps.error,
        inferenceSuggestion: ps.inferenceSuggestion,
        governor,
      });
      state = out.state;
      expect(Math.abs(out.deltas.curiosityBiasDelta)).toBeLessThanOrEqual(REENTRY_LIMITS.curiosity);
      expect(Math.abs(out.deltas.internalUtteranceBiasDelta)).toBeLessThanOrEqual(
        REENTRY_LIMITS.internalUtterance,
      );
      expect(Math.abs(out.deltas.bindingCoherenceDelta)).toBeLessThanOrEqual(
        REENTRY_LIMITS.bindingCoherence,
      );
      expect(Math.abs(out.deltas.hierarchicalErrorBiasDelta)).toBeLessThanOrEqual(
        REENTRY_LIMITS.hierarchicalError,
      );
      expect(out.diagnostics.saturationRatio).toBeGreaterThanOrEqual(0);
      expect(out.diagnostics.saturationRatio).toBeLessThanOrEqual(1);
      expect(Number.isFinite(out.diagnostics.totalSignedMagnitude)).toBe(true);
    }
  });

  it('produces non-zero deltas only when the gate is open', () => {
    let governor = createInitialGovernor();
    const field = assembleGlobalIntegrationField({
      ...nullInputs(),
      sensoryReturns: [sensory(0.9, 0.9)],
      selfWorld: selfWorld(0.2, 0.2),
    });
    const binding = derivePhenomenalBindingMetric(field);
    const ps = runHierarchicalPredictor(field, createInitialPredictorState(), { mode: 'observe' });

    const closed = deriveReentryDeltas(createInitialReentryState(), {
      field,
      binding,
      hpError: ps.error,
      inferenceSuggestion: ps.inferenceSuggestion,
      governor,
    });
    expect(closed.deltas.curiosityBiasDelta).toBe(0);

    governor = setGovernorGain(governor, GOVERNOR_GAIN_HARD_CAP);
    // Run two ticks so the predictor produces a non-zero error.
    let predictor = createInitialPredictorState();
    let state = createInitialReentryState();
    let last = closed;
    for (let t = 0; t < 2; t++) {
      const f = assembleGlobalIntegrationField({
        ...nullInputs(t),
        sensoryReturns: [sensory(t === 0 ? 0.1 : 0.9, t === 0 ? 0.1 : 0.9)],
        selfWorld: selfWorld(0.2, 0.2),
      });
      const psStep = runHierarchicalPredictor(f, predictor, { mode: 'observe' });
      predictor = psStep.state;
      last = deriveReentryDeltas(state, {
        field: f,
        binding: derivePhenomenalBindingMetric(f),
        hpError: psStep.error,
        inferenceSuggestion: psStep.inferenceSuggestion,
        governor,
      });
      state = last.state;
    }
    expect(last.diagnostics.gateOpen).toBe(true);
    // At least one channel should show a non-trivial response.
    const total =
      Math.abs(last.deltas.curiosityBiasDelta) +
      Math.abs(last.deltas.internalUtteranceBiasDelta) +
      Math.abs(last.deltas.bindingCoherenceDelta) +
      Math.abs(last.deltas.hierarchicalErrorBiasDelta);
    expect(total).toBeGreaterThan(0);
  });
});

describe('deriveReentryDeltas - closed gate decays smoothing', () => {
  it('smoothedDeltas approach zero after repeated closed-gate ticks', () => {
    const governor = createInitialGovernor(); // gain 0
    let state = createInitialReentryState();
    // Pre-load smoothing with non-zero values via a synthetic open-gate run.
    state = {
      ...state,
      smoothedDeltas: {
        curiosityBiasDelta: REENTRY_LIMITS.curiosity * 0.9,
        internalUtteranceBiasDelta: REENTRY_LIMITS.internalUtterance * 0.9,
        bindingCoherenceDelta: REENTRY_LIMITS.bindingCoherence * 0.9,
        hierarchicalErrorBiasDelta: REENTRY_LIMITS.hierarchicalError * 0.9,
      },
    };

    const field = assembleGlobalIntegrationField({ ...nullInputs() });
    const binding = derivePhenomenalBindingMetric(field);
    const psStart = runHierarchicalPredictor(field, createInitialPredictorState(), { mode: 'observe' });

    let last = state;
    for (let t = 0; t < 30; t++) {
      const result = deriveReentryDeltas(last, {
        field,
        binding,
        hpError: psStart.error,
        inferenceSuggestion: psStart.inferenceSuggestion,
        governor,
      });
      last = result.state;
    }
    expect(Math.abs(last.smoothedDeltas.curiosityBiasDelta)).toBeLessThan(0.001);
    expect(Math.abs(last.smoothedDeltas.bindingCoherenceDelta)).toBeLessThan(0.001);
  });
});
