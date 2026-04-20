/**
 * Tests for runSelfWorldModelStage
 *
 * Verify that self/world model packet generation is robust and produces valid outputs.
 */

import { describe, it, expect } from 'vitest';
import { runSelfWorldModelStage } from '../stages/runSelfWorldModelStage.ts';
import { runInteroceptionStage } from '../stages/runInteroceptionStage.ts';
import type { OrganismSnapshot } from '../types/organismSnapshot.ts';
import type { InteroceptionPacket } from '../types/interoception.ts';

describe('runSelfWorldModelStage', () => {
  it('should generate valid self/world packet from typical inputs', () => {
    const snapshot: OrganismSnapshot = {
      timestamp: 100,
      energy: 0.7,
      overload: 0.3,
      coherence: 0.8,
      boundary: 0.9,
      modeState: 'wake',
      touchExpectationConfidence: 0.6,
      recentPerturbationPressure: 0.2,
      meanPredictionError: 0.1,
      restorationBias: 0.5,
      coherenceMemory: 0.75,
      recentTouchActivity: 0.4,
    };

    const interoPacket = runInteroceptionStage(snapshot);
    const packet = runSelfWorldModelStage(interoPacket, snapshot);

    expect(packet.timestamp).toBe(100);
    expect(packet.selfCoherence).toBeGreaterThanOrEqual(0);
    expect(packet.selfCoherence).toBeLessThanOrEqual(1);
    expect(packet.selfContinuity).toBeGreaterThanOrEqual(0);
    expect(packet.selfContinuity).toBeLessThanOrEqual(1);
    expect(packet.worldPressure).toBeGreaterThanOrEqual(0);
    expect(packet.worldPressure).toBeLessThanOrEqual(1);
    expect(packet.relationEngagement).toBeGreaterThanOrEqual(0);
    expect(packet.relationEngagement).toBeLessThanOrEqual(1);
  });

  it('should reflect high world pressure with active touch', () => {
    const snapshot: OrganismSnapshot = {
      timestamp: 200,
      energy: 0.6,
      overload: 0.5,
      coherence: 0.7,
      boundary: 0.8,
      modeState: 'wake',
      touchExpectationConfidence: 0.7,
      recentPerturbationPressure: 0.8,
      meanPredictionError: 0.6,
      restorationBias: 0.3,
      coherenceMemory: 0.65,
      recentTouchActivity: 0.9,
    };

    const interoPacket = runInteroceptionStage(snapshot);
    const packet = runSelfWorldModelStage(interoPacket, snapshot);

    expect(packet.worldPressure).toBeGreaterThan(0.6);
    expect(packet.relationEngagement).toBeGreaterThan(0.4);
  });

  it('should show low self-continuity during high overload', () => {
    const snapshot: OrganismSnapshot = {
      timestamp: 300,
      energy: 0.4,
      overload: 0.9,
      coherence: 0.3,
      boundary: 0.4,
      modeState: 'wake',
      touchExpectationConfidence: 0.2,
      recentPerturbationPressure: 0.7,
      meanPredictionError: 0.8,
      restorationBias: 0.2,
      coherenceMemory: 0.25,
      recentTouchActivity: 0.8,
    };

    const interoPacket = runInteroceptionStage(snapshot);
    const packet = runSelfWorldModelStage(interoPacket, snapshot);

    expect(packet.selfContinuity).toBeLessThan(0.5);
    expect(packet.relationEngagement).toBeLessThan(0.5);
  });

  it('should show high self-coherence in quiet stable state', () => {
    const snapshot: OrganismSnapshot = {
      timestamp: 400,
      energy: 0.9,
      overload: 0.05,
      coherence: 0.95,
      boundary: 0.98,
      modeState: 'wake',
      touchExpectationConfidence: 0.8,
      recentPerturbationPressure: 0.02,
      meanPredictionError: 0.01,
      restorationBias: 0.8,
      coherenceMemory: 0.92,
      recentTouchActivity: 0.05,
    };

    const interoPacket = runInteroceptionStage(snapshot);
    const packet = runSelfWorldModelStage(interoPacket, snapshot);

    expect(packet.selfCoherence).toBeGreaterThan(0.8);
    expect(packet.selfContinuity).toBeGreaterThan(0.7);
    expect(packet.worldPressure).toBeLessThan(0.2);
  });

  it('should reflect mode state differences in self-continuity', () => {
    const baseSnapshot: OrganismSnapshot = {
      timestamp: 500,
      energy: 0.7,
      overload: 0.2,
      coherence: 0.8,
      boundary: 0.85,
      modeState: 'wake',
      touchExpectationConfidence: 0.6,
      recentPerturbationPressure: 0.15,
      meanPredictionError: 0.1,
      restorationBias: 0.5,
      coherenceMemory: 0.75,
      recentTouchActivity: 0.3,
    };

    const wakeSnapshot = { ...baseSnapshot, modeState: 'wake' as const };
    const sleepSnapshot = { ...baseSnapshot, modeState: 'sleep' as const };
    const dreamSnapshot = { ...baseSnapshot, modeState: 'dream' as const };

    const wakeIntero = runInteroceptionStage(wakeSnapshot);
    const sleepIntero = runInteroceptionStage(sleepSnapshot);
    const dreamIntero = runInteroceptionStage(dreamSnapshot);

    const wakePacket = runSelfWorldModelStage(wakeIntero, wakeSnapshot);
    const sleepPacket = runSelfWorldModelStage(sleepIntero, sleepSnapshot);
    const dreamPacket = runSelfWorldModelStage(dreamIntero, dreamSnapshot);

    // Wake should have higher continuity than sleep
    expect(wakePacket.selfContinuity).toBeGreaterThan(sleepPacket.selfContinuity);
    // Dream should be between wake and sleep
    expect(dreamPacket.selfContinuity).toBeGreaterThan(sleepPacket.selfContinuity);
    expect(dreamPacket.selfContinuity).toBeLessThanOrEqual(wakePacket.selfContinuity);
  });

  it('should show high relation engagement with good conditions', () => {
    const snapshot: OrganismSnapshot = {
      timestamp: 600,
      energy: 0.85,
      overload: 0.15,
      coherence: 0.85,
      boundary: 0.9,
      modeState: 'wake',
      touchExpectationConfidence: 0.8,
      recentPerturbationPressure: 0.1,
      meanPredictionError: 0.05,
      restorationBias: 0.6,
      coherenceMemory: 0.8,
      recentTouchActivity: 0.5,
    };

    const interoPacket = runInteroceptionStage(snapshot);
    const packet = runSelfWorldModelStage(interoPacket, snapshot);

    expect(packet.relationEngagement).toBeGreaterThan(0.6);
  });

  it('should not produce NaN values with extreme inputs', () => {
    const snapshot: OrganismSnapshot = {
      timestamp: 700,
      energy: 0,
      overload: 3.0,
      coherence: 0,
      boundary: 0,
      modeState: 'sleep',
      touchExpectationConfidence: 0,
      recentPerturbationPressure: 5.0,
      meanPredictionError: 10.0,
      restorationBias: 0,
      coherenceMemory: 0,
      recentTouchActivity: 0,
    };

    const interoPacket = runInteroceptionStage(snapshot);
    const packet = runSelfWorldModelStage(interoPacket, snapshot);

    expect(Number.isNaN(packet.selfCoherence)).toBe(false);
    expect(Number.isNaN(packet.selfContinuity)).toBe(false);
    expect(Number.isNaN(packet.worldPressure)).toBe(false);
    expect(Number.isNaN(packet.relationEngagement)).toBe(false);
  });

  it('should produce stable output for repeated identical input', () => {
    const snapshot: OrganismSnapshot = {
      timestamp: 800,
      energy: 0.65,
      overload: 0.35,
      coherence: 0.7,
      boundary: 0.8,
      modeState: 'wake',
      touchExpectationConfidence: 0.5,
      recentPerturbationPressure: 0.25,
      meanPredictionError: 0.15,
      restorationBias: 0.6,
      coherenceMemory: 0.68,
      recentTouchActivity: 0.3,
    };

    const interoPacket = runInteroceptionStage(snapshot);
    const packet1 = runSelfWorldModelStage(interoPacket, snapshot);
    const packet2 = runSelfWorldModelStage(interoPacket, snapshot);

    expect(packet1.selfCoherence).toBe(packet2.selfCoherence);
    expect(packet1.selfContinuity).toBe(packet2.selfContinuity);
    expect(packet1.worldPressure).toBe(packet2.worldPressure);
    expect(packet1.relationEngagement).toBe(packet2.relationEngagement);
  });
});
