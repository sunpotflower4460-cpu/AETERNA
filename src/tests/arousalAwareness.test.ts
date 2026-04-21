import { describe, expect, it } from 'vitest';
import { deriveArousalAwareness } from '../organism/deriveArousalAwareness.ts';
import type { FeltStateVector } from '../types/feltState.ts';
import type { OrganismLivingState } from '../types/organismState.ts';
import type { OrganismSnapshot } from '../types/organismSnapshot.ts';
import type { SelfWorldModelPacket } from '../types/selfWorldModel.ts';

function createLivingState(overrides: Partial<OrganismLivingState> = {}): OrganismLivingState {
  return {
    fatigue: 0.18,
    coherenceMemory: 0.72,
    preferredErgodicity: 0.5,
    longBaselineTone: 0.12,
    recentHistoryBias: 0.05,
    residueBias: 0.5,
    predictionSensitivity: 0.55,
    touchNeedBaseline: 0.52,
    ...overrides,
  };
}

function createSnapshot(overrides: Partial<OrganismSnapshot> = {}): OrganismSnapshot {
  return {
    timestamp: 100,
    energy: 0.72,
    overload: 0.22,
    coherence: 0.76,
    boundary: 0.8,
    modeState: 'wake',
    touchExpectationConfidence: 0.55,
    recentPerturbationPressure: 0.18,
    meanPredictionError: 0.14,
    restorationBias: 0.52,
    coherenceMemory: 0.72,
    recentTouchActivity: 0.2,
    currentActivity: 0.24,
    ignitionRatio: 0.18,
    recentTouchSurprise: 0.08,
    ...overrides,
  };
}

function createFeltState(overrides: Partial<FeltStateVector> = {}): FeltStateVector {
  return {
    timestamp: 100,
    depletion: 0.28,
    overload: 0.24,
    coherence: 0.74,
    boundaryIntegrity: 0.8,
    restorationReadiness: 0.58,
    perturbationLoad: 0.2,
    openness: 0.54,
    ...overrides,
  };
}

function createSelfWorld(overrides: Partial<SelfWorldModelPacket> = {}): SelfWorldModelPacket {
  return {
    timestamp: 100,
    selfCoherence: 0.78,
    selfContinuity: 0.74,
    worldPressure: 0.22,
    relationEngagement: 0.5,
    ...overrides,
  };
}

describe('deriveArousalAwareness', () => {
  it('creates a finite arousal/awareness state', () => {
    const result = deriveArousalAwareness(
      createSnapshot(),
      createFeltState(),
      createLivingState(),
      createSelfWorld()
    );

    expect(result.timestamp).toBe(100);
    expect(Number.isFinite(result.arousalLevel)).toBe(true);
    expect(Number.isFinite(result.awarenessWindow)).toBe(true);
    expect(Number.isFinite(result.salienceOpenness)).toBe(true);
    expect(Number.isFinite(result.foregroundPressure)).toBe(true);
    expect(Number.isFinite(result.restDepth)).toBe(true);
    expect(Number.isFinite(result.hyperreactivity)).toBe(true);
    expect(Number.isFinite(result.settlingWindow)).toBe(true);
  });

  it('does not produce NaN with extreme stressed inputs', () => {
    const result = deriveArousalAwareness(
      createSnapshot({
        energy: 0,
        overload: 1.4,
        coherence: 0,
        boundary: 0,
        meanPredictionError: 2.5,
        recentPerturbationPressure: 2,
        currentActivity: 1,
        ignitionRatio: 1,
        recentTouchSurprise: 1.5,
      }),
      createFeltState({
        depletion: 1.4,
        overload: 1.4,
        coherence: 0,
        boundaryIntegrity: 0,
        restorationReadiness: 0,
        perturbationLoad: 1.5,
        openness: 0,
      }),
      createLivingState({
        coherenceMemory: 0,
        predictionSensitivity: 1,
        touchNeedBaseline: 0,
      }),
      createSelfWorld({
        selfCoherence: 0,
        selfContinuity: 0,
        worldPressure: 1,
        relationEngagement: 0,
      })
    );

    expect(Number.isNaN(result.arousalLevel)).toBe(false);
    expect(Number.isNaN(result.awarenessWindow)).toBe(false);
    expect(Number.isNaN(result.salienceOpenness)).toBe(false);
    expect(Number.isNaN(result.foregroundPressure)).toBe(false);
  });

  it('raises arousal in overload conditions', () => {
    const quiet = deriveArousalAwareness(
      createSnapshot({ overload: 0.08, currentActivity: 0.1, ignitionRatio: 0.08, recentTouchSurprise: 0.02 }),
      createFeltState({ overload: 0.1, perturbationLoad: 0.08, depletion: 0.2 }),
      createLivingState({ predictionSensitivity: 0.4 }),
      createSelfWorld({ worldPressure: 0.1 })
    );
    const overload = deriveArousalAwareness(
      createSnapshot({ overload: 0.92, currentActivity: 0.78, ignitionRatio: 0.62, recentTouchSurprise: 0.7 }),
      createFeltState({ overload: 1.0, perturbationLoad: 0.95, depletion: 0.45, coherence: 0.34 }),
      createLivingState({ predictionSensitivity: 0.8 }),
      createSelfWorld({ worldPressure: 0.86, selfContinuity: 0.3 })
    );

    expect(overload.arousalLevel).toBeGreaterThan(quiet.arousalLevel);
    expect(overload.foregroundPressure).toBeGreaterThan(quiet.foregroundPressure);
  });

  it('keeps a non-zero arousal baseline in quiet recovery', () => {
    const quiet = deriveArousalAwareness(
      createSnapshot({
        overload: 0.03,
        meanPredictionError: 0.02,
        recentPerturbationPressure: 0.02,
        currentActivity: 0.05,
        ignitionRatio: 0.04,
        recentTouchSurprise: 0,
      }),
      createFeltState({
        depletion: 0.18,
        overload: 0.05,
        coherence: 0.82,
        boundaryIntegrity: 0.86,
        restorationReadiness: 0.74,
        perturbationLoad: 0.05,
      }),
      createLivingState({ predictionSensitivity: 0.38 }),
      createSelfWorld({ selfContinuity: 0.82, worldPressure: 0.04 })
    );

    expect(quiet.arousalLevel).toBeGreaterThan(0.04);
    expect(quiet.arousalLevel).toBeLessThan(0.35);
  });

  it('supports awareness window with coherent conditions', () => {
    const coherent = deriveArousalAwareness(
      createSnapshot({ overload: 0.16, currentActivity: 0.24, recentTouchSurprise: 0.05 }),
      createFeltState({
        coherence: 0.88,
        boundaryIntegrity: 0.9,
        restorationReadiness: 0.7,
        depletion: 0.18,
        overload: 0.16,
        perturbationLoad: 0.12,
      }),
      createLivingState({ coherenceMemory: 0.85 }),
      createSelfWorld({ selfContinuity: 0.86, relationEngagement: 0.58 })
    );
    const depleted = deriveArousalAwareness(
      createSnapshot({ overload: 0.42, currentActivity: 0.26, recentTouchSurprise: 0.22 }),
      createFeltState({
        coherence: 0.36,
        boundaryIntegrity: 0.42,
        restorationReadiness: 0.2,
        depletion: 0.94,
        overload: 0.66,
        perturbationLoad: 0.6,
      }),
      createLivingState({ coherenceMemory: 0.38 }),
      createSelfWorld({ selfContinuity: 0.34, relationEngagement: 0.22, worldPressure: 0.52 })
    );

    expect(coherent.awarenessWindow).toBeGreaterThan(depleted.awarenessWindow);
    expect(coherent.settlingWindow).toBeGreaterThan(depleted.settlingWindow);
  });

  it('keeps arousal and awareness dissociable', () => {
    const dissociated = deriveArousalAwareness(
      createSnapshot({
        overload: 0.94,
        currentActivity: 0.8,
        ignitionRatio: 0.66,
        meanPredictionError: 0.8,
        recentTouchSurprise: 0.74,
      }),
      createFeltState({
        depletion: 0.82,
        overload: 1.05,
        coherence: 0.3,
        boundaryIntegrity: 0.34,
        restorationReadiness: 0.18,
        perturbationLoad: 0.92,
        openness: 0.26,
      }),
      createLivingState({ coherenceMemory: 0.34, predictionSensitivity: 0.82 }),
      createSelfWorld({ selfContinuity: 0.28, worldPressure: 0.88, relationEngagement: 0.24 })
    );

    expect(dissociated.arousalLevel).toBeGreaterThan(0.55);
    expect(dissociated.awarenessWindow).toBeLessThan(0.4);
    expect(Math.abs(dissociated.arousalLevel - dissociated.awarenessWindow)).toBeGreaterThan(0.15);
  });
});
