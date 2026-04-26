/**
 * Sensory Return Scenario Tests
 *
 * W4: Scenarios for verifying Sensory Return behavior
 *
 * These scenarios verify:
 * - W4-A: World change generates return
 * - W4-B: No world change → minimal return
 * - W4-C: Visual residue returns as light
 * - W4-D: Force residue returns as pressure
 * - W4-E: Weak perturbation conversion
 * - W4-F: No reafference yet (no self-caused / world-caused判定)
 */

import type { WorldMediumState } from '../../types/worldMediumState.ts';
import type { ActuationPulse } from '../../types/actuationPulse.ts';
import type { SensoryReturnPacket } from '../../types/sensoryReturnPacket.ts';
import type { PerturbationEvent } from '../../types/perturbationEvent.ts';
import { initializeWorldMediumState } from '../../world/initializeWorldMediumState.ts';
import { updateWorldMedium } from '../../world/updateWorldMedium.ts';
import { deriveSensoryReturn } from '../../perception/deriveSensoryReturn.ts';
import { sensoryReturnToPerturbation } from '../../perception/sensoryReturnToPerturbation.ts';

interface SensoryReturnScenarioResult {
  name: string;
  description: string;
  duration: number;
  success: boolean;
  observations: string[];
  packets: SensoryReturnPacket[];
  metrics: {
    totalPackets: number;
    channelCounts: Record<string, number>;
    avgIntensity: number;
    avgNovelty: number;
    avgLocality: number;
    avgRhythm: number;
    avgWorldOriginStrength: number;
    avgReturnDelayHint: number;
    avgMediumStabilityHint: number;
    maxPerturbationMagnitude?: number;
    anyNaN?: boolean;
  };
}

function isFiniteValue(value: number): boolean {
  return Number.isFinite(value);
}

function checkPacketFinite(packet: SensoryReturnPacket): boolean {
  return (
    isFiniteValue(packet.intensity) &&
    isFiniteValue(packet.novelty) &&
    isFiniteValue(packet.locality) &&
    isFiniteValue(packet.rhythm) &&
    isFiniteValue(packet.worldOriginStrength) &&
    isFiniteValue(packet.returnDelayHint) &&
    isFiniteValue(packet.mediumStabilityHint)
  );
}

// --- Scenario W4-A: World change generates return ---
export function runScenarioW4A(): SensoryReturnScenarioResult {
  const name = 'W4-A: World Change Generates Return';
  const description = 'World Medium changes should generate Sensory Return packets';
  const observations: string[] = [];

  let world = initializeWorldMediumState();
  const dt = 1 / 60; // 60 FPS
  const ticks = 100;
  const allPackets: SensoryReturnPacket[] = [];

  let previousWorld: WorldMediumState | null = null;

  // Apply visual pulse to create change
  const visualPulse: ActuationPulse = {
    timestamp: Date.now(),
    channel: 'visual',
    intensity: 0.6,
    coherence: 0.7,
    rhythm: 0.5,
    locality: 0.4,
    recoveryLinked: 0.3,
    boundaryLinked: 0.2,
    traceLinked: 0.1,
    outputReadiness: 0.8,
  };

  for (let i = 0; i < ticks; i++) {
    // Apply pulse at frame 10
    const pulse = i === 10 ? visualPulse : null;
    world = updateWorldMedium(world, pulse, dt);

    // Derive sensory return
    const packets = deriveSensoryReturn(world, previousWorld, dt);
    allPackets.push(...packets);

    previousWorld = world;
  }

  const channelCounts: Record<string, number> = {};
  let totalIntensity = 0;
  let totalNovelty = 0;
  let anyNaN = false;

  for (const packet of allPackets) {
    channelCounts[packet.channel] = (channelCounts[packet.channel] ?? 0) + 1;
    totalIntensity += packet.intensity;
    totalNovelty += packet.novelty;

    if (!checkPacketFinite(packet)) {
      anyNaN = true;
      observations.push(`Non-finite values in ${packet.channel} packet`);
    }
  }

  const success = allPackets.length > 0 && !anyNaN;

  if (success) {
    observations.push(`Generated ${allPackets.length} sensory return packets`);
    observations.push(`Channels: ${Object.keys(channelCounts).join(', ')}`);
  } else if (allPackets.length === 0) {
    observations.push('FAIL: No sensory return packets generated after world change');
  }

  return {
    name,
    description,
    duration: ticks * dt,
    success,
    observations,
    packets: allPackets,
    metrics: {
      totalPackets: allPackets.length,
      channelCounts,
      avgIntensity: allPackets.length > 0 ? totalIntensity / allPackets.length : 0,
      avgNovelty: allPackets.length > 0 ? totalNovelty / allPackets.length : 0,
      avgLocality: 0,
      avgRhythm: 0,
      avgWorldOriginStrength: 0,
      avgReturnDelayHint: 0,
      avgMediumStabilityHint: 0,
      anyNaN,
    },
  };
}

// --- Scenario W4-B: No world change → minimal return ---
export function runScenarioW4B(): SensoryReturnScenarioResult {
  const name = 'W4-B: No World Change → Minimal Return';
  const description = 'Stable World Medium should not generate excessive packets';
  const observations: string[] = [];

  let world = initializeWorldMediumState();
  const dt = 1 / 60;
  const ticks = 200; // ~3.3 seconds
  const allPackets: SensoryReturnPacket[] = [];

  let previousWorld: WorldMediumState | null = null;

  for (let i = 0; i < ticks; i++) {
    // No pulses — world only drifts naturally
    world = updateWorldMedium(world, null, dt);

    const packets = deriveSensoryReturn(world, previousWorld, dt);
    allPackets.push(...packets);

    previousWorld = world;
  }

  // Success if packet count is reasonable (not spam)
  // Natural drift might produce some packets, but not excessive
  const packetRate = allPackets.length / ticks;
  const success = packetRate < 0.5; // Less than 1 packet per 2 frames

  if (success) {
    observations.push(`Packet rate: ${packetRate.toFixed(3)} packets/frame (acceptable)`);
    observations.push('World Medium did not spam packets during natural drift');
  } else {
    observations.push(`FAIL: Excessive packet rate: ${packetRate.toFixed(3)} packets/frame`);
  }

  return {
    name,
    description,
    duration: ticks * dt,
    success,
    observations,
    packets: allPackets,
    metrics: {
      totalPackets: allPackets.length,
      channelCounts: {},
      avgIntensity: 0,
      avgNovelty: 0,
      avgLocality: 0,
      avgRhythm: 0,
      avgWorldOriginStrength: 0,
      avgReturnDelayHint: 0,
      avgMediumStabilityHint: 0,
    },
  };
}

// --- Scenario W4-C: Visual residue returns as light ---
export function runScenarioW4C(): SensoryReturnScenarioResult {
  const name = 'W4-C: Visual Residue Returns as Light';
  const description = 'visualResidue / ambientLight changes should return as simulatedLight';
  const observations: string[] = [];

  let world = initializeWorldMediumState();
  const dt = 1 / 60;
  const ticks = 150;
  const allPackets: SensoryReturnPacket[] = [];

  let previousWorld: WorldMediumState | null = null;

  const visualPulse: ActuationPulse = {
    timestamp: Date.now(),
    channel: 'visual',
    intensity: 0.7,
    coherence: 0.8,
    rhythm: 0.5,
    locality: 0.3,
    recoveryLinked: 0.2,
    boundaryLinked: 0.3,
    traceLinked: 0.1,
    outputReadiness: 0.9,
  };

  for (let i = 0; i < ticks; i++) {
    // Apply visual pulse early
    const pulse = i === 5 ? visualPulse : null;
    world = updateWorldMedium(world, pulse, dt);

    const packets = deriveSensoryReturn(world, previousWorld, dt);
    allPackets.push(...packets);

    previousWorld = world;
  }

  const lightPackets = allPackets.filter(p => p.channel === 'simulatedLight');
  const success = lightPackets.length > 0;

  if (success) {
    observations.push(`Generated ${lightPackets.length} simulatedLight packets`);
    const avgIntensity = lightPackets.reduce((sum, p) => sum + p.intensity, 0) / lightPackets.length;
    observations.push(`Avg light intensity: ${avgIntensity.toFixed(3)}`);
  } else {
    observations.push('FAIL: No simulatedLight packets generated from visual pulse');
  }

  return {
    name,
    description,
    duration: ticks * dt,
    success,
    observations,
    packets: allPackets,
    metrics: {
      totalPackets: allPackets.length,
      channelCounts: { simulatedLight: lightPackets.length },
      avgIntensity: 0,
      avgNovelty: 0,
      avgLocality: 0,
      avgRhythm: 0,
      avgWorldOriginStrength: 0,
      avgReturnDelayHint: 0,
      avgMediumStabilityHint: 0,
    },
  };
}

// --- Scenario W4-D: Force residue returns as pressure ---
export function runScenarioW4D(): SensoryReturnScenarioResult {
  const name = 'W4-D: Force Residue Returns as Pressure';
  const description = 'forceResidue / surfaceResistance changes should return as simulatedPressure';
  const observations: string[] = [];

  let world = initializeWorldMediumState();
  const dt = 1 / 60;
  const ticks = 150;
  const allPackets: SensoryReturnPacket[] = [];

  let previousWorld: WorldMediumState | null = null;

  const forcePulse: ActuationPulse = {
    timestamp: Date.now(),
    channel: 'simulatedForce',
    intensity: 0.65,
    coherence: 0.75,
    rhythm: 0.4,
    locality: 0.6,
    recoveryLinked: 0.4,
    boundaryLinked: 0.5,
    traceLinked: 0.2,
    outputReadiness: 0.7,
  };

  for (let i = 0; i < ticks; i++) {
    const pulse = i === 5 ? forcePulse : null;
    world = updateWorldMedium(world, pulse, dt);

    const packets = deriveSensoryReturn(world, previousWorld, dt);
    allPackets.push(...packets);

    previousWorld = world;
  }

  const pressurePackets = allPackets.filter(p => p.channel === 'simulatedPressure');
  const success = pressurePackets.length > 0;

  if (success) {
    observations.push(`Generated ${pressurePackets.length} simulatedPressure packets`);
    const avgIntensity = pressurePackets.reduce((sum, p) => sum + p.intensity, 0) / pressurePackets.length;
    observations.push(`Avg pressure intensity: ${avgIntensity.toFixed(3)}`);
  } else {
    observations.push('FAIL: No simulatedPressure packets generated from force pulse');
  }

  return {
    name,
    description,
    duration: ticks * dt,
    success,
    observations,
    packets: allPackets,
    metrics: {
      totalPackets: allPackets.length,
      channelCounts: { simulatedPressure: pressurePackets.length },
      avgIntensity: 0,
      avgNovelty: 0,
      avgLocality: 0,
      avgRhythm: 0,
      avgWorldOriginStrength: 0,
      avgReturnDelayHint: 0,
      avgMediumStabilityHint: 0,
    },
  };
}

// --- Scenario W4-E: Weak perturbation conversion ---
export function runScenarioW4E(): SensoryReturnScenarioResult {
  const name = 'W4-E: Weak Perturbation Conversion';
  const description = 'Sensory Return → PerturbationEvent should produce weak, non-overwhelming perturbations';
  const observations: string[] = [];

  let world = initializeWorldMediumState();
  const dt = 1 / 60;
  const ticks = 100;
  const allPackets: SensoryReturnPacket[] = [];
  const perturbations: PerturbationEvent[] = [];

  let previousWorld: WorldMediumState | null = null;

  const strongPulse: ActuationPulse = {
    timestamp: Date.now(),
    channel: 'visual',
    intensity: 0.8,
    coherence: 0.9,
    rhythm: 0.6,
    locality: 0.5,
    recoveryLinked: 0.3,
    boundaryLinked: 0.4,
    traceLinked: 0.2,
    outputReadiness: 0.85,
  };

  for (let i = 0; i < ticks; i++) {
    const pulse = i === 10 ? strongPulse : null;
    world = updateWorldMedium(world, pulse, dt);

    const packets = deriveSensoryReturn(world, previousWorld, dt);
    allPackets.push(...packets);

    // Convert packets to perturbations
    for (const packet of packets) {
      const perturbation = sensoryReturnToPerturbation(packet);
      perturbations.push(perturbation);
    }

    previousWorld = world;
  }

  // Check that perturbations are weak
  const maxMagnitude = Math.max(...perturbations.map(p => p.magnitude), 0);
  const avgMagnitude = perturbations.length > 0
    ? perturbations.reduce((sum, p) => sum + p.magnitude, 0) / perturbations.length
    : 0;

  // Success if perturbations are weak (not overwhelming)
  const success = maxMagnitude < 0.5 && avgMagnitude < 0.3;

  if (success) {
    observations.push(`Weak conversion verified: max mag ${maxMagnitude.toFixed(3)}, avg ${avgMagnitude.toFixed(3)}`);
    observations.push('Sensory Return did not create overwhelming perturbations');
  } else {
    observations.push(`FAIL: Perturbations too strong: max ${maxMagnitude.toFixed(3)}, avg ${avgMagnitude.toFixed(3)}`);
  }

  return {
    name,
    description,
    duration: ticks * dt,
    success,
    observations,
    packets: allPackets,
    metrics: {
      totalPackets: allPackets.length,
      channelCounts: {},
      avgIntensity: 0,
      avgNovelty: 0,
      avgLocality: 0,
      avgRhythm: 0,
      avgWorldOriginStrength: 0,
      avgReturnDelayHint: 0,
      avgMediumStabilityHint: 0,
      maxPerturbationMagnitude: maxMagnitude,
    },
  };
}

// --- Scenario W4-F: No reafference yet ---
export function runScenarioW4F(): SensoryReturnScenarioResult {
  const name = 'W4-F: No Reafference Yet';
  const description = 'W4 should NOT perform self-caused / world-caused distinction (that is W5)';
  const observations: string[] = [];

  let world = initializeWorldMediumState();
  const dt = 1 / 60;
  const ticks = 50;
  const allPackets: SensoryReturnPacket[] = [];

  let previousWorld: WorldMediumState | null = null;

  const pulse: ActuationPulse = {
    timestamp: Date.now(),
    channel: 'visual',
    intensity: 0.5,
    coherence: 0.6,
    rhythm: 0.3,
    locality: 0.4,
    recoveryLinked: 0.2,
    boundaryLinked: 0.3,
    traceLinked: 0.1,
    outputReadiness: 0.7,
  };

  for (let i = 0; i < ticks; i++) {
    const p = i === 10 ? pulse : null;
    world = updateWorldMedium(world, p, dt);

    const packets = deriveSensoryReturn(world, previousWorld, dt);
    allPackets.push(...packets);

    previousWorld = world;
  }

  // Check that packets do NOT have self-caused / world-caused flags
  // W4 only has worldOriginStrength as a general strength indicator
  // No reafference comparison fields should exist
  const hasReafferenceFields = allPackets.some(p =>
    'selfCaused' in p || 'worldCaused' in p || 'reafferenceMatch' in p
  );

  const success = !hasReafferenceFields;

  if (success) {
    observations.push('No reafference comparison fields found (correct for W4)');
    observations.push('W4 only provides worldOriginStrength, not self/world distinction');
  } else {
    observations.push('FAIL: Found reafference comparison fields (should be W5 only)');
  }

  return {
    name,
    description,
    duration: ticks * dt,
    success,
    observations,
    packets: allPackets,
    metrics: {
      totalPackets: allPackets.length,
      channelCounts: {},
      avgIntensity: 0,
      avgNovelty: 0,
      avgLocality: 0,
      avgRhythm: 0,
      avgWorldOriginStrength: 0,
      avgReturnDelayHint: 0,
      avgMediumStabilityHint: 0,
    },
  };
}

// --- Run all W4 scenarios ---
export function runAllSensoryReturnScenarios(): SensoryReturnScenarioResult[] {
  return [
    runScenarioW4A(),
    runScenarioW4B(),
    runScenarioW4C(),
    runScenarioW4D(),
    runScenarioW4E(),
    runScenarioW4F(),
  ];
}
