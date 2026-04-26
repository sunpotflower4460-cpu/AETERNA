/**
 * Replay / Consolidation Tests
 *
 * AETERNA v0.5 / A3: Offline Replay / Rest Consolidation
 *
 * Tests for replay queue, replay state derivation, and consolidation mechanisms.
 */

import { describe, it, expect } from 'vitest';
import { ReplayQueue } from '../organism/replayQueue.ts';
import { deriveTraceState } from '../organism/deriveTraceState.ts';
import { deriveReplayState } from '../organism/deriveReplayState.ts';
import type { ArousalAwarenessState } from '../types/arousalAwareness.ts';
import type { FeltStateVector } from '../types/feltState.ts';
import type { OrganismSnapshot } from '../types/organismSnapshot.ts';
import type { TraceState } from '../types/traceState.ts';

describe('ReplayQueue', () => {
  it('should initialize empty', () => {
    const queue = new ReplayQueue();
    expect(queue.size()).toBe(0);
  });

  it('should add salient candidates', () => {
    const queue = new ReplayQueue();
    queue.addCandidate('mismatch', 0.8, 100);
    expect(queue.size()).toBe(1);
  });

  it('should reject low-salience candidates', () => {
    const queue = new ReplayQueue();
    queue.addCandidate('mismatch', 0.1, 100); // Below threshold
    expect(queue.size()).toBe(0);
  });

  it('should prioritize high-weight candidates', () => {
    const queue = new ReplayQueue();
    queue.addCandidate('boundary', 0.5, 100);
    queue.addCandidate('mismatch', 0.9, 110);
    queue.addCandidate('recovery', 0.6, 120);

    const candidates = queue.getCandidatesForReplay(2);
    expect(candidates.length).toBe(2);
    expect(candidates[0].category).toBe('mismatch');
  });

  it('should decay candidate weights', () => {
    const queue = new ReplayQueue();
    queue.addCandidate('mismatch', 0.8, 100);
    const initialWeight = queue.averageSalience();

    for (let i = 0; i < 100; i++) {
      queue.decay();
    }

    const decayedWeight = queue.averageSalience();
    expect(decayedWeight).toBeLessThan(initialWeight);
  });

  it('should prune low-weight candidates', () => {
    const queue = new ReplayQueue();
    queue.addCandidate('mismatch', 0.5, 100);

    // Decay until pruned (needs more iterations with decay rate 0.998)
    for (let i = 0; i < 3000; i++) {
      queue.decay();
    }

    expect(queue.size()).toBe(0);
  });

  it('should respect max capacity', () => {
    const queue = new ReplayQueue(10); // Small capacity
    for (let i = 0; i < 20; i++) {
      queue.addCandidate('mismatch', 0.5, i, [i / 20]);
    }
    expect(queue.size()).toBeLessThanOrEqual(10);
  });

  it('should reduce weight after replay', () => {
    const queue = new ReplayQueue();
    queue.addCandidate('mismatch', 0.8, 100);
    const candidates = queue.getCandidatesForReplay(1);
    const initialWeight = candidates[0].weight;

    queue.reduceWeight(candidates[0].id, 0.5);

    const updatedCandidates = queue.getCandidatesForReplay(1);
    expect(updatedCandidates[0].weight).toBe(initialWeight * 0.5);
  });

  it('should merge similar pattern candidates instead of growing unbounded', () => {
    const queue = new ReplayQueue();
    queue.addCandidate('recurrence', 0.6, 100, [0.5, 0.4], 0.4, 0.6);
    queue.addCandidate('recurrence', 0.7, 110, [0.53, 0.39], 0.5, 0.7);
    expect(queue.size()).toBe(1);
    expect(queue.getCandidatesForReplay(1)[0].weight).toBeGreaterThan(0.55);
  });
});

describe('deriveTraceState', () => {
  it('should retain more recurrence after repeated patterns', () => {
    const traceState = deriveTraceState({
      timestamp: 100,
      recentPerturbationHistory: [0.2, 0.25, 0.2],
      mismatchHistory: [0.2, 0.18, 0.16],
      recoveryHistory: [0.1, 0.15, 0.12],
      repeatedPatternHistory: [0.2, 0.5, 0.7, 0.8],
      externalInputLevel: 0.05,
      arousalLevel: 0.22,
      awarenessWindow: 0.72,
      restDepth: 0.6,
      settlingWindow: 0.65,
      restorationReadiness: 0.58,
      boundaryIntegrity: 0.84,
      collapseRisk: 0.15,
    });

    expect(traceState.recurrenceWeight).toBeGreaterThan(0.3);
    expect(traceState.traceStrength).toBeGreaterThan(0);
    expect(traceState.replaySuppression).toBeLessThan(0.5);
  });
});

describe('deriveReplayState', () => {
  function createMockSnapshot(): OrganismSnapshot {
    return {
      timestamp: 0,
      energy: 1.0,
      overload: 0.1,
      coherence: 0.8,
      boundary: 0.9,
      modeState: 'wake',
      touchExpectationConfidence: 0.5,
      recentPerturbationPressure: 0.1,
      meanPredictionError: 0.1,
      restorationBias: 0.5,
      coherenceMemory: 0.8,
      recentTouchActivity: 0.1,
      currentActivity: 0.2,
      ignitionRatio: 0.3,
      recentTouchSurprise: 0.1,
    };
  }

  function createMockFeltState(): FeltStateVector {
    return {
      timestamp: 0,
      depletion: 0.2,
      overload: 0.1,
      coherence: 0.8,
      boundaryIntegrity: 0.9,
      restorationReadiness: 0.6,
      perturbationLoad: 0.1,
      openness: 0.7,
    };
  }

  function createMockArousalAwareness(
    arousalLevel = 0.2,
    restDepth = 0.6
  ): ArousalAwarenessState {
    return {
      timestamp: 0,
      arousalLevel,
      awarenessWindow: 0.7,
      salienceOpenness: 0.6,
      foregroundPressure: 0.2,
      restDepth,
      hyperreactivity: 0.1,
      settlingWindow: 0.7,
    };
  }

  function createMockTraceState(overrides: Partial<TraceState> = {}): TraceState {
    return {
      timestamp: 0,
      traceStrength: 0.48,
      recurrenceWeight: 0.34,
      salienceResidue: 0.42,
      replayReadiness: 0.55,
      replaySuppression: 0.18,
      recentPatternWeight: 0.4,
      settlingResidue: 0.36,
      recoveryLinkedResidue: 0.22,
      ...overrides,
    };
  }

  it('should derive replay pressure in quiet conditions', () => {
    const snapshot = createMockSnapshot();
    const feltState = createMockFeltState();
    const arousalAwareness = createMockArousalAwareness(0.1, 0.8); // Low arousal, high rest
    const traceState = createMockTraceState();
    const queue = new ReplayQueue();
    queue.addCandidate('mismatch', 0.7, 100);

    const replayState = deriveReplayState(
      snapshot,
      feltState,
      arousalAwareness,
      traceState,
      queue,
      0,
      0,
      null
    );

    expect(replayState.replayPressure).toBeGreaterThan(0.3);
    expect(Number.isFinite(replayState.replayPressure)).toBe(true);
  });

  it('should derive replay readiness in suitable conditions', () => {
    const snapshot = createMockSnapshot();
    const feltState = createMockFeltState();
    const arousalAwareness = createMockArousalAwareness(0.3, 0.7); // Moderate arousal, high rest
    const traceState = createMockTraceState();
    const queue = new ReplayQueue();

    const replayState = deriveReplayState(
      snapshot,
      feltState,
      arousalAwareness,
      traceState,
      queue,
      0,
      0,
      null
    );

    expect(replayState.replayReadiness).toBeGreaterThan(0);
    expect(Number.isFinite(replayState.replayReadiness)).toBe(true);
  });

  it('should derive high suppression during high arousal', () => {
    const snapshot = createMockSnapshot();
    snapshot.recentTouchActivity = 0.8;
    const feltState = createMockFeltState();
    feltState.perturbationLoad = 0.8;
    const arousalAwareness = createMockArousalAwareness(0.8, 0.1); // High arousal, low rest
    const traceState = createMockTraceState({ replaySuppression: 0.55 });
    const queue = new ReplayQueue();

    const replayState = deriveReplayState(
      snapshot,
      feltState,
      arousalAwareness,
      traceState,
      queue,
      0,
      0,
      null
    );

    expect(replayState.replaySuppression).toBeGreaterThan(0.5);
    expect(Number.isFinite(replayState.replaySuppression)).toBe(true);
  });

  it('should derive consolidation gain in rest conditions', () => {
    const snapshot = createMockSnapshot();
    const feltState = createMockFeltState();
    feltState.coherence = 0.9;
    feltState.restorationReadiness = 0.8;
    const arousalAwareness = createMockArousalAwareness(0.1, 0.9); // Low arousal, deep rest
    const traceState = createMockTraceState({ traceStrength: 0.62, settlingResidue: 0.48 });
    const queue = new ReplayQueue();

    const replayState = deriveReplayState(
      snapshot,
      feltState,
      arousalAwareness,
      traceState,
      queue,
      0,
      0,
      null
    );

    expect(replayState.consolidationGain).toBeGreaterThan(0);
    expect(replayState.consolidationGain).toBeLessThanOrEqual(0.3); // Always weak
    expect(Number.isFinite(replayState.consolidationGain)).toBe(true);
  });

  it('should derive rest consolidation depth', () => {
    const snapshot = createMockSnapshot();
    const feltState = createMockFeltState();
    feltState.restorationReadiness = 0.9;
    const arousalAwareness = createMockArousalAwareness(0.05, 0.95); // Very low arousal, very deep rest
    const traceState = createMockTraceState({ settlingResidue: 0.55, recoveryLinkedResidue: 0.4 });
    const queue = new ReplayQueue();

    const replayState = deriveReplayState(
      snapshot,
      feltState,
      arousalAwareness,
      traceState,
      queue,
      0,
      0,
      null
    );

    expect(replayState.restConsolidationDepth).toBeGreaterThan(0.5);
    expect(Number.isFinite(replayState.restConsolidationDepth)).toBe(true);
  });

  it('should not produce NaN values', () => {
    const snapshot = createMockSnapshot();
    const feltState = createMockFeltState();
    const arousalAwareness = createMockArousalAwareness();
    const traceState = createMockTraceState();
    const queue = new ReplayQueue();

    const replayState = deriveReplayState(
      snapshot,
      feltState,
      arousalAwareness,
      traceState,
      queue,
      0,
      0,
      null
    );

    expect(Number.isFinite(replayState.replayPressure)).toBe(true);
    expect(Number.isFinite(replayState.replayReadiness)).toBe(true);
    expect(Number.isFinite(replayState.consolidationGain)).toBe(true);
    expect(Number.isFinite(replayState.replaySuppression)).toBe(true);
    expect(Number.isFinite(replayState.restConsolidationDepth)).toBe(true);
  });

  it('should track active replay count', () => {
    const snapshot = createMockSnapshot();
    const feltState = createMockFeltState();
    const arousalAwareness = createMockArousalAwareness();
    const traceState = createMockTraceState();
    const queue = new ReplayQueue();

    const replayState = deriveReplayState(
      snapshot,
      feltState,
      arousalAwareness,
      traceState,
      queue,
      3, // Active replay count
      0.7, // Recent salience
      'mismatch'
    );

    expect(replayState.activeReplayCount).toBe(3);
    expect(replayState.recentReplaySalience).toBe(0.7);
    expect(replayState.lastReplayCategory).toBe('mismatch');
  });
});

describe('Replay Integration', () => {
  it('should maintain bounded values under extreme conditions', () => {
    const queue = new ReplayQueue();

    // Add many candidates
    for (let i = 0; i < 100; i++) {
      queue.addCandidate('mismatch', Math.random(), i, [i / 100]);
    }

    expect(queue.size()).toBeLessThanOrEqual(50); // Max capacity

    // Decay extensively
    for (let i = 0; i < 10000; i++) {
      queue.decay();
    }

    expect(queue.size()).toBeGreaterThanOrEqual(0);
    expect(queue.averageSalience()).toBeGreaterThanOrEqual(0);
  });

  it('should handle empty queue gracefully', () => {
    const queue = new ReplayQueue();
    const candidates = queue.getCandidatesForReplay(5);

    expect(candidates.length).toBe(0);
    expect(queue.averageSalience()).toBe(0);
    expect(queue.totalSalience()).toBe(0);
  });
});
