/**
 * Tests for runHierarchicalPredictor (Phase B).
 *
 * Phase B guarantees:
 *   - First tick produces zero error (no warm-up flash).
 *   - Steady-state input yields zero error.
 *   - Step-change input yields error roughly equal to the step magnitude.
 *   - 'observe' mode never returns inferenceSuggestion.
 *   - 'activeInference' returns suggestions in [-1, 1].
 *   - Layer agreement is high when all three layers see identical errors.
 */

import { describe, it, expect } from 'vitest';
import {
  assembleGlobalIntegrationField,
  type GlobalIntegrationFieldInputs,
} from '../../integration/globalIntegrationField.ts';
import {
  createInitialPredictorState,
  runHierarchicalPredictor,
} from '../../perception/hierarchicalPredictor.ts';
import type { SensoryReturnPacket } from '../../types/sensoryReturnPacket.ts';
import type { SelfWorldModelPacket } from '../../types/selfWorldModel.ts';
import type { ArousalAwarenessState } from '../../types/arousalAwareness.ts';

function makeField(inputs: Partial<GlobalIntegrationFieldInputs> = {}, tickId = 0) {
  return assembleGlobalIntegrationField({
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
    ...inputs,
  });
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

function arousal(awareness: number, foreground: number): ArousalAwarenessState {
  return {
    timestamp: 0,
    arousalLevel: 0.5,
    awarenessWindow: awareness,
    salienceOpenness: 0.5,
    foregroundPressure: foreground,
    restDepth: 0.5,
    hyperreactivity: 0,
    settlingWindow: 0.5,
  };
}

describe('runHierarchicalPredictor - first tick', () => {
  it('returns zero error on the first tick', () => {
    const field = makeField({
      sensoryReturns: [sensory(0.5, 0.4)],
      selfWorld: selfWorld(0.8, 0.7),
      arousal: arousal(0.6, 0.4),
    });
    const out = runHierarchicalPredictor(field, createInitialPredictorState(), { mode: 'observe' });
    expect(out.error.sensoryError).toBe(0);
    expect(out.error.selfError).toBe(0);
    expect(out.error.relationError).toBe(0);
    expect(out.error.aggregateError).toBe(0);
    expect(out.state.observedTicks).toBe(1);
  });
});

describe('runHierarchicalPredictor - steady state', () => {
  it('reports zero error when nothing changes', () => {
    let state = createInitialPredictorState();
    const field = makeField({
      sensoryReturns: [sensory(0.5, 0.4)],
      selfWorld: selfWorld(0.8, 0.7),
      arousal: arousal(0.6, 0.4),
    });
    state = runHierarchicalPredictor(field, state, { mode: 'observe' }).state;
    const out2 = runHierarchicalPredictor(field, state, { mode: 'observe' });
    expect(out2.error.sensoryError).toBeCloseTo(0, 6);
    expect(out2.error.selfError).toBeCloseTo(0, 6);
    expect(out2.error.relationError).toBeCloseTo(0, 6);
  });
});

describe('runHierarchicalPredictor - step change', () => {
  it('measures error roughly equal to the step magnitude', () => {
    let state = createInitialPredictorState();
    const fieldA = makeField({ sensoryReturns: [sensory(0.2, 0.2)] });
    state = runHierarchicalPredictor(fieldA, state, { mode: 'observe' }).state;
    const fieldB = makeField({ sensoryReturns: [sensory(0.9, 0.9)] }, 1);
    const out = runHierarchicalPredictor(fieldB, state, { mode: 'observe' });
    expect(out.error.sensoryError).toBeGreaterThan(0.5);
    expect(out.error.sensoryError).toBeLessThanOrEqual(1);
  });
});

describe('runHierarchicalPredictor - mode behavior', () => {
  it('observe mode never returns inferenceSuggestion', () => {
    let state = createInitialPredictorState();
    const field = makeField({ sensoryReturns: [sensory(0.5, 0.5)] });
    state = runHierarchicalPredictor(field, state, { mode: 'observe' }).state;
    const out = runHierarchicalPredictor(field, state, { mode: 'observe' });
    expect(out.inferenceSuggestion).toBeNull();
  });

  it('activeInference returns suggestion in [-1, 1] after warm-up', () => {
    let state = createInitialPredictorState();
    const fieldA = makeField({
      sensoryReturns: [sensory(0.2, 0.2)],
      selfWorld: selfWorld(0.4, 0.4),
      arousal: arousal(0.3, 0.3),
    });
    state = runHierarchicalPredictor(fieldA, state, { mode: 'activeInference' }).state;
    const fieldB = makeField(
      {
        sensoryReturns: [sensory(0.9, 0.9)],
        selfWorld: selfWorld(0.8, 0.8),
        arousal: arousal(0.7, 0.7),
      },
      1,
    );
    const out = runHierarchicalPredictor(fieldB, state, { mode: 'activeInference' });
    expect(out.inferenceSuggestion).not.toBeNull();
    if (out.inferenceSuggestion) {
      for (const v of [
        out.inferenceSuggestion.sensoryReductionBias,
        out.inferenceSuggestion.selfStabilizationBias,
        out.inferenceSuggestion.relationOpennessBias,
      ]) {
        expect(Number.isFinite(v)).toBe(true);
        expect(v).toBeGreaterThanOrEqual(-1);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('runHierarchicalPredictor - layer agreement', () => {
  it('reports high agreement when all three layers see the same error magnitude', () => {
    let state = createInitialPredictorState();
    const fieldA = makeField({
      sensoryReturns: [sensory(0.3, 0.3)],
      selfWorld: selfWorld(0.3, 0.3),
      arousal: arousal(0.3, 0.3),
    });
    state = runHierarchicalPredictor(fieldA, state, { mode: 'observe' }).state;
    const fieldB = makeField(
      {
        sensoryReturns: [sensory(0.8, 0.8)],
        selfWorld: selfWorld(0.8, 0.8),
        arousal: arousal(0.8, 0.8),
      },
      1,
    );
    const out = runHierarchicalPredictor(fieldB, state, { mode: 'observe' });
    expect(out.error.layerAgreement).toBeGreaterThan(0.95);
  });

  it('reports low agreement when only one layer changes sharply', () => {
    let state = createInitialPredictorState();
    const fieldA = makeField({
      sensoryReturns: [sensory(0.3, 0.3)],
      selfWorld: selfWorld(0.3, 0.3),
      arousal: arousal(0.3, 0.3),
    });
    state = runHierarchicalPredictor(fieldA, state, { mode: 'observe' }).state;
    const fieldB = makeField(
      {
        sensoryReturns: [sensory(0.95, 0.95)],
        selfWorld: selfWorld(0.3, 0.3),
        arousal: arousal(0.3, 0.3),
      },
      1,
    );
    const out = runHierarchicalPredictor(fieldB, state, { mode: 'observe' });
    expect(out.error.layerAgreement).toBeLessThan(0.6);
  });
});
