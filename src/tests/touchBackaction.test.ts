import { describe, expect, it, beforeAll } from 'vitest';
import { deriveTouchBackaction } from '../perception/deriveTouchBackaction.ts';
import { deriveOpenStateSnapshot } from '../organism/deriveOpenStateSnapshot.ts';
import { createTouchExpectationState } from '../perception/touchExpectation.ts';
import { AeternaNetwork } from '../core/AeternaNetwork.js';
import { updateTouchPerception } from '../perception/touchPerception.ts';
import type { FeltStateVector } from '../types/feltState.ts';
import type { ArousalAwarenessState } from '../types/arousalAwareness.ts';
import type { NeedMotivationState } from '../types/needMotivation.ts';

beforeAll(() => {
  if (typeof window === 'undefined') {
    // Minimal window stub for network internals
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).window = { innerWidth: 800, innerHeight: 600 };
  }
});

function buildStates(overrides?: Partial<FeltStateVector>): {
  felt: FeltStateVector;
  arousal: ArousalAwarenessState;
  need: NeedMotivationState;
} {
  const felt: FeltStateVector = {
    timestamp: 1,
    depletion: 0.2,
    overload: 0.3,
    coherence: 0.7,
    boundaryIntegrity: 0.8,
    restorationReadiness: 0.4,
    perturbationLoad: 0.2,
    openness: 0.5,
    ...overrides,
  };

  const arousal: ArousalAwarenessState = {
    timestamp: 1,
    arousalLevel: 0.4,
    awarenessWindow: 0.6,
    salienceOpenness: 0.5,
    foregroundPressure: 0.3,
    restDepth: 0.6,
    hyperreactivity: 0.2,
    settlingWindow: 0.5,
  };

  const need: NeedMotivationState = {
    timestamp: 1,
    energyNeed: 0.3,
    safetyNeed: 0.2,
    restorationNeed: 0.25,
    contactNeed: 0.3,
    noveltyMotivation: 0.3,
    repetitionMotivation: 0.2,
    explorationMotivation: 0.35,
    settlingMotivation: 0.25,
    withdrawMotivation: 0.2,
  };

  return { felt, arousal, need };
}

describe('deriveTouchBackaction', () => {
  it('produces finite backaction state', () => {
    const { felt, arousal, need } = buildStates();
    const openState = deriveOpenStateSnapshot(felt, arousal, need);
    const expectation = createTouchExpectationState(4);
    expectation.touchHabituationField.fill(0.1);

    const backaction = deriveTouchBackaction({
      timestamp: 1,
      openStateSnapshot: openState,
      expectationState: expectation,
      surpriseMetrics: {
        spatialSurprise: 0.05,
        temporalSurprise: 0.05,
        strengthSurprise: 0.05,
        missingTouchSurprise: 0.0,
        releaseSurprise: 0.0,
        totalSurprise: 0.15,
      },
    });

    expect(backaction).toBeTruthy();
    expect(Object.values(backaction).every(v => Number.isFinite(v as number))).toBe(true);
  });

  it('increases gains under overload and weak boundary', () => {
    const stable = buildStates();
    const overload = buildStates({ overload: 1.1, boundaryIntegrity: 0.2, openness: 0.25 });

    const stableOpen = deriveOpenStateSnapshot(stable.felt, stable.arousal, stable.need);
    const overloadOpen = deriveOpenStateSnapshot(overload.felt, overload.arousal, overload.need);

    const stableBackaction = deriveTouchBackaction({ timestamp: 1, openStateSnapshot: stableOpen });
    const overloadBackaction = deriveTouchBackaction({ timestamp: 2, openStateSnapshot: overloadOpen });

    expect(overloadBackaction.backactionGain).toBeGreaterThan(stableBackaction.backactionGain);
    expect(overloadBackaction.surpriseGain).toBeGreaterThanOrEqual(stableBackaction.surpriseGain);
    expect(overloadBackaction.overloadAmplification).toBeGreaterThan(stableBackaction.overloadAmplification);
  });

  it('raises familiarity damping when touch is familiar', () => {
    const { felt, arousal, need } = buildStates();
    const openState = deriveOpenStateSnapshot(felt, arousal, need);
    const expectationFamiliar = createTouchExpectationState(4);
    expectationFamiliar.touchHabituationField.fill(0.9);
    expectationFamiliar.touchExpectationConfidence = 0.9;

    const expectationNovel = createTouchExpectationState(4);
    expectationNovel.touchHabituationField.fill(0.0);
    expectationNovel.touchExpectationConfidence = 0.2;

    const familiar = deriveTouchBackaction({
      timestamp: 1,
      openStateSnapshot: openState,
      expectationState: expectationFamiliar,
      surpriseMetrics: { spatialSurprise: 0, temporalSurprise: 0, strengthSurprise: 0, missingTouchSurprise: 0, releaseSurprise: 0, totalSurprise: 0 },
    });
    const novel = deriveTouchBackaction({
      timestamp: 2,
      openStateSnapshot: openState,
      expectationState: expectationNovel,
      surpriseMetrics: { spatialSurprise: 0.2, temporalSurprise: 0.2, strengthSurprise: 0.2, missingTouchSurprise: 0, releaseSurprise: 0, totalSurprise: 0.4 },
    });

    expect(familiar.familiarityDamping).toBeGreaterThan(novel.familiarityDamping);
    expect(familiar.surpriseGain).toBeLessThan(novel.surpriseGain);
  });

  it('stays gentle in quiet stable state', () => {
    const { felt, arousal, need } = buildStates({ overload: 0.05, boundaryIntegrity: 0.9, openness: 0.3 });
    const openState = deriveOpenStateSnapshot(felt, arousal, need);
    const backaction = deriveTouchBackaction({ timestamp: 5, openStateSnapshot: openState });

    expect(backaction.backactionGain).toBeLessThan(1.3);
    expect(backaction.overloadAmplification).toBeLessThan(0.4);
  });
});

describe('touch backaction integration', () => {
  it('keeps touch pipeline stable when disabled', () => {
    const network = new AeternaNetwork(8);
    network.touchBackactionEnabled = false;
    network.rawTouch.fill(0.1);
    network.localPrediction.fill(0.05);

    updateTouchPerception(network);

    expect(Array.from(network.touchOnset).every(Number.isFinite)).toBe(true);
    expect(Array.from(network.touchTrace).every(Number.isFinite)).toBe(true);
  });
});
