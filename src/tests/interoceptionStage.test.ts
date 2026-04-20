/**
 * Tests for runInteroceptionStage
 *
 * Verify that interoception packet generation is robust and produces valid outputs.
 */

import { describe, it, expect } from 'vitest';
import { runInteroceptionStage } from '../stages/runInteroceptionStage.ts';
import type { OrganismSnapshot } from '../types/organismSnapshot.ts';

describe('runInteroceptionStage', () => {
  it('should generate valid interoception packet from typical snapshot', () => {
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

    const packet = runInteroceptionStage(snapshot);

    expect(packet.timestamp).toBe(100);
    expect(packet.energySense).toBeGreaterThanOrEqual(0);
    expect(packet.energySense).toBeLessThanOrEqual(1);
    expect(packet.overloadSense).toBeGreaterThanOrEqual(0);
    expect(packet.overloadSense).toBeLessThanOrEqual(1);
    expect(packet.coherenceSense).toBeGreaterThanOrEqual(0);
    expect(packet.coherenceSense).toBeLessThanOrEqual(1);
    expect(packet.boundarySense).toBeGreaterThanOrEqual(0);
    expect(packet.boundarySense).toBeLessThanOrEqual(1);
    expect(packet.restorationSense).toBeGreaterThanOrEqual(0);
    expect(packet.restorationSense).toBeLessThanOrEqual(1);
    expect(packet.perturbationPressure).toBeGreaterThanOrEqual(0);
    expect(packet.perturbationPressure).toBeLessThanOrEqual(1);
  });

  it('should handle low energy condition', () => {
    const snapshot: OrganismSnapshot = {
      timestamp: 200,
      energy: 0.1,
      overload: 0.8,
      coherence: 0.3,
      boundary: 0.4,
      modeState: 'sleep',
      touchExpectationConfidence: 0.2,
      recentPerturbationPressure: 0.1,
      meanPredictionError: 0.05,
      restorationBias: 0.9,
      coherenceMemory: 0.35,
      recentTouchActivity: 0.1,
    };

    const packet = runInteroceptionStage(snapshot);

    expect(packet.energySense).toBeLessThan(0.3);
    expect(packet.overloadSense).toBeGreaterThan(0.5);
    expect(packet.restorationSense).toBeGreaterThan(0.7);
    expect(Number.isFinite(packet.coherenceSense)).toBe(true);
  });

  it('should handle high overload condition', () => {
    const snapshot: OrganismSnapshot = {
      timestamp: 300,
      energy: 0.5,
      overload: 1.2,
      coherence: 0.2,
      boundary: 0.3,
      modeState: 'wake',
      touchExpectationConfidence: 0.3,
      recentPerturbationPressure: 0.8,
      meanPredictionError: 0.6,
      restorationBias: 0.2,
      coherenceMemory: 0.25,
      recentTouchActivity: 0.9,
    };

    const packet = runInteroceptionStage(snapshot);

    expect(packet.overloadSense).toBeGreaterThan(0.8);
    expect(packet.perturbationPressure).toBeGreaterThan(0.5);
    expect(packet.coherenceSense).toBeLessThan(0.5);
  });

  it('should handle quiet/resting condition', () => {
    const snapshot: OrganismSnapshot = {
      timestamp: 400,
      energy: 0.9,
      overload: 0.05,
      coherence: 0.95,
      boundary: 0.98,
      modeState: 'sleep',
      touchExpectationConfidence: 0.1,
      recentPerturbationPressure: 0.02,
      meanPredictionError: 0.01,
      restorationBias: 0.8,
      coherenceMemory: 0.92,
      recentTouchActivity: 0.05,
    };

    const packet = runInteroceptionStage(snapshot);

    expect(packet.energySense).toBeGreaterThan(0.8);
    expect(packet.overloadSense).toBeLessThan(0.2);
    expect(packet.coherenceSense).toBeGreaterThan(0.8);
    expect(packet.boundarySense).toBeGreaterThan(0.9);
    expect(packet.perturbationPressure).toBeLessThan(0.2);
  });

  it('should not produce NaN values with extreme inputs', () => {
    const snapshot: OrganismSnapshot = {
      timestamp: 500,
      energy: 0,
      overload: 2.5,
      coherence: 0,
      boundary: 0,
      modeState: 'dream',
      touchExpectationConfidence: 0,
      recentPerturbationPressure: 3.0,
      meanPredictionError: 5.0,
      restorationBias: 0,
      coherenceMemory: 0,
      recentTouchActivity: 0,
    };

    const packet = runInteroceptionStage(snapshot);

    expect(Number.isNaN(packet.energySense)).toBe(false);
    expect(Number.isNaN(packet.overloadSense)).toBe(false);
    expect(Number.isNaN(packet.coherenceSense)).toBe(false);
    expect(Number.isNaN(packet.boundarySense)).toBe(false);
    expect(Number.isNaN(packet.restorationSense)).toBe(false);
    expect(Number.isNaN(packet.perturbationPressure)).toBe(false);
  });

  it('should produce stable output for repeated identical input', () => {
    const snapshot: OrganismSnapshot = {
      timestamp: 600,
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

    const packet1 = runInteroceptionStage(snapshot);
    const packet2 = runInteroceptionStage(snapshot);

    expect(packet1.energySense).toBe(packet2.energySense);
    expect(packet1.overloadSense).toBe(packet2.overloadSense);
    expect(packet1.coherenceSense).toBe(packet2.coherenceSense);
    expect(packet1.boundarySense).toBe(packet2.boundarySense);
    expect(packet1.restorationSense).toBe(packet2.restorationSense);
    expect(packet1.perturbationPressure).toBe(packet2.perturbationPressure);
  });
});
