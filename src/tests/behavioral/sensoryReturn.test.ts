/**
 * Sensory Return Behavioral Tests
 *
 * W4: Unit tests for Sensory Return functions
 */

import { describe, it, expect } from 'vitest';
import type { WorldMediumState } from '../types/worldMediumState.ts';
import { initializeWorldMediumState } from '../world/initializeWorldMediumState.ts';
import { updateWorldMedium } from '../world/updateWorldMedium.ts';
import { deriveSensoryReturn } from '../perception/deriveSensoryReturn.ts';
import { sensoryReturnToPerturbation } from '../perception/sensoryReturnToPerturbation.ts';
import type { ActuationPulse } from '../types/actuationPulse.ts';

describe('deriveSensoryReturn', () => {
  it('should return empty array when previousWorld is null', () => {
    const world = initializeWorldMediumState();
    const packets = deriveSensoryReturn(world, null, 1 / 60);
    expect(packets).toEqual([]);
  });

  it('should generate packets when world changes significantly', () => {
    let world = initializeWorldMediumState();
    const dt = 1 / 60;

    // Apply a visual pulse to create change
    const pulse: ActuationPulse = {
      timestamp: Date.now(),
      channel: 'visual',
      intensity: 0.7,
      coherence: 0.8,
      rhythm: 0.5,
      locality: 0.4,
      recoveryLinked: 0.3,
      boundaryLinked: 0.2,
      traceLinked: 0.1,
      outputReadiness: 0.8,
    };

    const previousWorld = { ...world };
    world = updateWorldMedium(world, pulse, dt);

    const packets = deriveSensoryReturn(world, previousWorld, dt);

    // Should generate at least one packet due to visual pulse effect
    expect(packets.length).toBeGreaterThan(0);
  });

  it('should produce finite values in all packet fields', () => {
    let world = initializeWorldMediumState();
    const dt = 1 / 60;

    const pulse: ActuationPulse = {
      timestamp: Date.now(),
      channel: 'visual',
      intensity: 0.6,
      coherence: 0.7,
      rhythm: 0.5,
      locality: 0.5,
      recoveryLinked: 0.2,
      boundaryLinked: 0.3,
      traceLinked: 0.1,
      outputReadiness: 0.7,
    };

    const previousWorld = { ...world };
    world = updateWorldMedium(world, pulse, dt);

    const packets = deriveSensoryReturn(world, previousWorld, dt);

    for (const packet of packets) {
      expect(Number.isFinite(packet.intensity)).toBe(true);
      expect(Number.isFinite(packet.novelty)).toBe(true);
      expect(Number.isFinite(packet.locality)).toBe(true);
      expect(Number.isFinite(packet.rhythm)).toBe(true);
      expect(Number.isFinite(packet.worldOriginStrength)).toBe(true);
      expect(Number.isFinite(packet.returnDelayHint)).toBe(true);
      expect(Number.isFinite(packet.mediumStabilityHint)).toBe(true);
    }
  });

  it('should respect channel mapping from world state', () => {
    let world = initializeWorldMediumState();
    const dt = 1 / 60;

    // Visual pulse should generate simulatedLight packets
    const visualPulse: ActuationPulse = {
      timestamp: Date.now(),
      channel: 'visual',
      intensity: 0.7,
      coherence: 0.8,
      rhythm: 0.5,
      locality: 0.4,
      recoveryLinked: 0.3,
      boundaryLinked: 0.2,
      traceLinked: 0.1,
      outputReadiness: 0.8,
    };

    const previousWorld = { ...world };
    world = updateWorldMedium(world, visualPulse, dt);

    const packets = deriveSensoryReturn(world, previousWorld, dt);
    const lightPackets = packets.filter(p => p.channel === 'simulatedLight');

    // Should have at least one light packet
    expect(lightPackets.length).toBeGreaterThan(0);
  });

  it('should generate minimal packets when world is stable', () => {
    let world = initializeWorldMediumState();
    const dt = 1 / 60;
    const ticks = 100;
    let totalPackets = 0;

    let previousWorld: WorldMediumState | null = null;

    for (let i = 0; i < ticks; i++) {
      world = updateWorldMedium(world, null, dt);
      const packets = deriveSensoryReturn(world, previousWorld, dt);
      totalPackets += packets.length;
      previousWorld = world;
    }

    // Should not spam packets when stable
    const packetRate = totalPackets / ticks;
    expect(packetRate).toBeLessThan(0.5); // Less than 1 packet per 2 frames
  });

  it('should produce packets with values in [0, 1] range', () => {
    let world = initializeWorldMediumState();
    const dt = 1 / 60;

    const pulse: ActuationPulse = {
      timestamp: Date.now(),
      channel: 'simulatedForce',
      intensity: 0.8,
      coherence: 0.7,
      rhythm: 0.6,
      locality: 0.5,
      recoveryLinked: 0.4,
      boundaryLinked: 0.5,
      traceLinked: 0.2,
      outputReadiness: 0.75,
    };

    const previousWorld = { ...world };
    world = updateWorldMedium(world, pulse, dt);

    const packets = deriveSensoryReturn(world, previousWorld, dt);

    for (const packet of packets) {
      expect(packet.intensity).toBeGreaterThanOrEqual(0);
      expect(packet.intensity).toBeLessThanOrEqual(1);
      expect(packet.novelty).toBeGreaterThanOrEqual(0);
      expect(packet.novelty).toBeLessThanOrEqual(1);
      expect(packet.locality).toBeGreaterThanOrEqual(0);
      expect(packet.locality).toBeLessThanOrEqual(1);
      expect(packet.rhythm).toBeGreaterThanOrEqual(0);
      expect(packet.rhythm).toBeLessThanOrEqual(1);
      expect(packet.worldOriginStrength).toBeGreaterThanOrEqual(0);
      expect(packet.worldOriginStrength).toBeLessThanOrEqual(1);
    }
  });
});

describe('sensoryReturnToPerturbation', () => {
  it('should convert SensoryReturnPacket to PerturbationEvent', () => {
    const packet = {
      timestamp: Date.now(),
      channel: 'simulatedLight' as const,
      intensity: 0.6,
      novelty: 0.5,
      locality: 0.4,
      rhythm: 0.3,
      worldOriginStrength: 0.7,
      returnDelayHint: 0.2,
      mediumStabilityHint: 0.8,
    };

    const perturbation = sensoryReturnToPerturbation(packet);

    expect(perturbation.source).toBe('light');
    expect(perturbation.magnitude).toBeGreaterThanOrEqual(0);
    expect(perturbation.magnitude).toBeLessThanOrEqual(1);
    expect(Number.isFinite(perturbation.novelty)).toBe(true);
    expect(Number.isFinite(perturbation.expectedness)).toBe(true);
  });

  it('should produce weak perturbations (magnitude scaled down)', () => {
    const packet = {
      timestamp: Date.now(),
      channel: 'simulatedPressure' as const,
      intensity: 0.8, // High intensity
      novelty: 0.7,
      locality: 0.6,
      rhythm: 0.5,
      worldOriginStrength: 0.8,
      returnDelayHint: 0.3,
      mediumStabilityHint: 0.7,
    };

    const perturbation = sensoryReturnToPerturbation(packet);

    // Magnitude should be scaled down (weak conversion)
    expect(perturbation.magnitude).toBeLessThan(packet.intensity);
    expect(perturbation.magnitude).toBeLessThan(0.4); // Should be weakly scaled
  });

  it('should map channels to appropriate sources', () => {
    const channels: Array<{ channel: 'simulatedLight' | 'simulatedNoise' | 'simulatedPressure' | 'simulatedMotion' | 'simulatedEcho', expectedSource: string }> = [
      { channel: 'simulatedLight', expectedSource: 'light' },
      { channel: 'simulatedNoise', expectedSource: 'sound' },
      { channel: 'simulatedPressure', expectedSource: 'motion' },
      { channel: 'simulatedMotion', expectedSource: 'motion' },
      { channel: 'simulatedEcho', expectedSource: 'sound' },
    ];

    for (const { channel, expectedSource } of channels) {
      const packet = {
        timestamp: Date.now(),
        channel,
        intensity: 0.5,
        novelty: 0.4,
        locality: 0.5,
        rhythm: 0.3,
        worldOriginStrength: 0.6,
        returnDelayHint: 0.2,
        mediumStabilityHint: 0.7,
      };

      const perturbation = sensoryReturnToPerturbation(packet);
      expect(perturbation.source).toBe(expectedSource);
    }
  });

  it('should produce finite values in all perturbation fields', () => {
    const packet = {
      timestamp: Date.now(),
      channel: 'simulatedMotion' as const,
      intensity: 0.7,
      novelty: 0.6,
      locality: 0.5,
      rhythm: 0.4,
      worldOriginStrength: 0.75,
      returnDelayHint: 0.25,
      mediumStabilityHint: 0.8,
    };

    const perturbation = sensoryReturnToPerturbation(packet);

    expect(Number.isFinite(perturbation.magnitude)).toBe(true);
    expect(Number.isFinite(perturbation.novelty)).toBe(true);
    expect(Number.isFinite(perturbation.locality)).toBe(true);
    expect(Number.isFinite(perturbation.expectedness)).toBe(true);
    expect(Number.isFinite(perturbation.boundaryContact ?? 0)).toBe(true);
  });

  it('should set targetRegion to null (ambient world return)', () => {
    const packet = {
      timestamp: Date.now(),
      channel: 'simulatedEcho' as const,
      intensity: 0.5,
      novelty: 0.4,
      locality: 0.3,
      rhythm: 0.2,
      worldOriginStrength: 0.6,
      returnDelayHint: 0.2,
      mediumStabilityHint: 0.75,
    };

    const perturbation = sensoryReturnToPerturbation(packet);

    expect(perturbation.targetRegion).toBeNull();
  });
});
