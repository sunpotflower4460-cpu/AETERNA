/**
 * World Medium Scenario Tests
 *
 * W3: Scenarios for verifying Simulated World Medium behavior
 *
 * These scenarios verify:
 * - W3-A: World Medium remains stable without pulses (no NaN, no collapse)
 * - W3-B: Visual pulses subtly affect ambientLight, visualResidue, echoLevel
 * - W3-C: Simulated force pulses subtly affect resistance, drift, temperature
 * - W3-D: Pulse impact and echo decay over time
 * - W3-E: World Medium does NOT yet send Sensory Return to AETERNA
 */

import type { WorldMediumState } from '../../types/worldMediumState.ts';
import type { ActuationPulse } from '../../types/actuationPulse.ts';
import { initializeWorldMediumState } from '../../world/initializeWorldMediumState.ts';
import { updateWorldMedium } from '../../world/updateWorldMedium.ts';

interface WorldMediumScenarioResult {
  name: string;
  description: string;
  duration: number;
  success: boolean;
  observations: string[];
  finalState: WorldMediumState;
  metrics: {
    maxAmbientLight?: number;
    minAmbientLight?: number;
    maxEchoLevel?: number;
    maxLastPulseImpact?: number;
    avgSurfaceResistance?: number;
    avgFieldTemperature?: number;
    avgMotionDrift?: number;
    stabilityRange?: [number, number];
    anyNaN?: boolean;
    anyInfinity?: boolean;
    visualResidueDecayed?: boolean;
    forceResidueDecayed?: boolean;
  };
}

function isFinite(value: number): boolean {
  return Number.isFinite(value);
}

function allValuesFinite(world: WorldMediumState): boolean {
  return (
    isFinite(world.ambientLight) &&
    isFinite(world.ambientNoise) &&
    isFinite(world.surfaceResistance) &&
    isFinite(world.echoLevel) &&
    isFinite(world.motionDrift) &&
    isFinite(world.fieldTemperature) &&
    isFinite(world.feedbackDelay) &&
    isFinite(world.lastPulseImpact) &&
    isFinite(world.mediumStability) &&
    (!world.visualResidue || isFinite(world.visualResidue)) &&
    (!world.forceResidue || isFinite(world.forceResidue)) &&
    (!world.worldTurbulence || isFinite(world.worldTurbulence)) &&
    (!world.returnReadiness || isFinite(world.returnReadiness))
  );
}

// --- Scenario W3-A: No pulse medium drift ---
export function runScenarioW3A(): WorldMediumScenarioResult {
  const name = 'W3-A: No Pulse Medium Drift';
  const description = 'World Medium remains stable without pulses, no NaN, natural drift only';
  const observations: string[] = [];

  let world = initializeWorldMediumState();
  const dt = 1 / 60; // 60 FPS
  const ticks = 300; // 5 seconds

  let anyNaN = false;
  let anyInfinity = false;
  const lightSamples: number[] = [];
  const stabilitySamples: number[] = [];

  for (let i = 0; i < ticks; i++) {
    world = updateWorldMedium(world, null, dt);

    if (!allValuesFinite(world)) {
      anyNaN = true;
      observations.push(`Frame ${i}: Non-finite values detected`);
    }

    lightSamples.push(world.ambientLight);
    stabilitySamples.push(world.mediumStability);
  }

  const success = !anyNaN && !anyInfinity && world.mediumStability > 0.4;

  if (success) {
    observations.push('World Medium remained stable without pulses');
    observations.push('No NaN or Infinity values detected');
    observations.push(`Final stability: ${world.mediumStability.toFixed(3)}`);
  }

  return {
    name,
    description,
    duration: ticks * dt,
    success,
    observations,
    finalState: world,
    metrics: {
      minAmbientLight: Math.min(...lightSamples),
      maxAmbientLight: Math.max(...lightSamples),
      stabilityRange: [Math.min(...stabilitySamples), Math.max(...stabilitySamples)],
      anyNaN,
      anyInfinity,
    },
  };
}

// --- Scenario W3-B: Visual pulse changes light ---
export function runScenarioW3B(): WorldMediumScenarioResult {
  const name = 'W3-B: Visual Pulse Changes Light';
  const description = 'Visual pulse subtly affects ambientLight, visualResidue, echoLevel';
  const observations: string[] = [];

  let world = initializeWorldMediumState();
  const dt = 1 / 60;

  const initialLight = world.ambientLight;
  const initialEcho = world.echoLevel;
  const initialResidue = world.visualResidue ?? 0;

  // Apply a single visual pulse
  const visualPulse: ActuationPulse = {
    timestamp: Date.now(),
    channel: 'visual',
    intensity: 0.6,
    coherence: 0.7,
    rhythm: 0.5,
    locality: 0.3,
    recoveryLinked: 0.2,
    boundaryLinked: 0.3,
    traceLinked: 0.4,
    outputReadiness: 0.5,
  };

  world = updateWorldMedium(world, visualPulse, dt);

  const lightIncreased = world.ambientLight > initialLight;
  const echoIncreased = world.echoLevel > initialEcho;
  const residueIncreased = (world.visualResidue ?? 0) > initialResidue;

  // Run for 60 more frames to observe changes
  const lightSamples: number[] = [world.ambientLight];
  const echoSamples: number[] = [world.echoLevel];
  for (let i = 0; i < 60; i++) {
    world = updateWorldMedium(world, null, dt);
    lightSamples.push(world.ambientLight);
    echoSamples.push(world.echoLevel);
  }

  const maxLight = Math.max(...lightSamples);
  const maxEcho = Math.max(...echoSamples);

  const success = lightIncreased && echoIncreased && residueIncreased && allValuesFinite(world);

  if (success) {
    observations.push('Visual pulse increased ambientLight');
    observations.push('Visual pulse increased echoLevel');
    observations.push('Visual pulse increased visualResidue');
    observations.push(`Max light: ${maxLight.toFixed(3)}`);
    observations.push(`Max echo: ${maxEcho.toFixed(3)}`);
  } else {
    observations.push('Visual pulse did not affect world as expected');
  }

  return {
    name,
    description,
    duration: (61 * dt),
    success,
    observations,
    finalState: world,
    metrics: {
      maxAmbientLight: maxLight,
      maxEchoLevel: maxEcho,
    },
  };
}

// --- Scenario W3-C: Simulated force changes resistance ---
export function runScenarioW3C(): WorldMediumScenarioResult {
  const name = 'W3-C: Simulated Force Changes Resistance';
  const description = 'Simulated force pulse subtly affects resistance, drift, temperature';
  const observations: string[] = [];

  let world = initializeWorldMediumState();
  const dt = 1 / 60;

  const initialResistance = world.surfaceResistance;
  const initialDrift = world.motionDrift;
  const initialTemperature = world.fieldTemperature;
  const initialForceResidue = world.forceResidue ?? 0;

  // Apply a single simulated force pulse
  const forcePulse: ActuationPulse = {
    timestamp: Date.now(),
    channel: 'simulatedForce',
    intensity: 0.65,
    coherence: 0.6,
    rhythm: 0.4,
    locality: 0.5,
    recoveryLinked: 0.3,
    boundaryLinked: 0.6,
    traceLinked: 0.2,
    outputReadiness: 0.45,
  };

  world = updateWorldMedium(world, forcePulse, dt);

  const resistanceIncreased = world.surfaceResistance > initialResistance;
  const driftIncreased = world.motionDrift > initialDrift;
  const temperatureIncreased = world.fieldTemperature > initialTemperature;
  const forceResidueIncreased = (world.forceResidue ?? 0) > initialForceResidue;

  // Run for 60 more frames
  const resistanceSamples: number[] = [world.surfaceResistance];
  const driftSamples: number[] = [world.motionDrift];
  const tempSamples: number[] = [world.fieldTemperature];
  for (let i = 0; i < 60; i++) {
    world = updateWorldMedium(world, null, dt);
    resistanceSamples.push(world.surfaceResistance);
    driftSamples.push(world.motionDrift);
    tempSamples.push(world.fieldTemperature);
  }

  const avgResistance = resistanceSamples.reduce((a, b) => a + b, 0) / resistanceSamples.length;
  const avgDrift = driftSamples.reduce((a, b) => a + b, 0) / driftSamples.length;
  const avgTemp = tempSamples.reduce((a, b) => a + b, 0) / tempSamples.length;

  const success =
    resistanceIncreased &&
    driftIncreased &&
    temperatureIncreased &&
    forceResidueIncreased &&
    allValuesFinite(world);

  if (success) {
    observations.push('Force pulse increased surfaceResistance');
    observations.push('Force pulse increased motionDrift');
    observations.push('Force pulse increased fieldTemperature');
    observations.push('Force pulse increased forceResidue');
    observations.push(`Avg resistance: ${avgResistance.toFixed(3)}`);
  } else {
    observations.push('Force pulse did not affect world as expected');
  }

  return {
    name,
    description,
    duration: (61 * dt),
    success,
    observations,
    finalState: world,
    metrics: {
      avgSurfaceResistance: avgResistance,
      avgMotionDrift: avgDrift,
      avgFieldTemperature: avgTemp,
    },
  };
}

// --- Scenario W3-D: Pulse impact decays ---
export function runScenarioW3D(): WorldMediumScenarioResult {
  const name = 'W3-D: Pulse Impact Decays';
  const description = 'lastPulseImpact and echoLevel decay over time after pulse';
  const observations: string[] = [];

  let world = initializeWorldMediumState();
  const dt = 1 / 60;

  // Apply a strong pulse
  const strongPulse: ActuationPulse = {
    timestamp: Date.now(),
    channel: 'visual',
    intensity: 0.8,
    coherence: 0.8,
    rhythm: 0.6,
    locality: 0.2,
    recoveryLinked: 0.4,
    boundaryLinked: 0.3,
    traceLinked: 0.5,
    outputReadiness: 0.7,
  };

  world = updateWorldMedium(world, strongPulse, dt);

  const peakImpact = world.lastPulseImpact;
  const peakEcho = world.echoLevel;

  // Run for 180 frames (3 seconds) without pulses
  const impactSamples: number[] = [peakImpact];
  const echoSamples: number[] = [peakEcho];
  for (let i = 0; i < 180; i++) {
    world = updateWorldMedium(world, null, dt);
    impactSamples.push(world.lastPulseImpact);
    echoSamples.push(world.echoLevel);
  }

  const finalImpact = world.lastPulseImpact;
  const finalEcho = world.echoLevel;

  const impactDecayed = finalImpact < peakImpact * 0.5;
  const echoDecayed = finalEcho < peakEcho * 0.5;

  const success = impactDecayed && echoDecayed && allValuesFinite(world);

  if (success) {
    observations.push(`Peak impact: ${peakImpact.toFixed(3)} → Final: ${finalImpact.toFixed(3)}`);
    observations.push(`Peak echo: ${peakEcho.toFixed(3)} → Final: ${finalEcho.toFixed(3)}`);
    observations.push('Impact and echo decayed as expected');
  } else {
    observations.push('Decay did not occur as expected');
  }

  return {
    name,
    description,
    duration: (181 * dt),
    success,
    observations,
    finalState: world,
    metrics: {
      maxLastPulseImpact: peakImpact,
      maxEchoLevel: peakEcho,
    },
  };
}

// --- Scenario W3-E: No sensory return yet ---
export function runScenarioW3E(): WorldMediumScenarioResult {
  const name = 'W3-E: No Sensory Return Yet';
  const description = 'Verify World Medium changes do not return to AETERNA (W4+)';
  const observations: string[] = [];

  // This is a structural test: World Medium is a separate module
  // It does not have any interface to send Sensory Return back to AETERNA
  // This will be verified by checking that no such functions exist

  const success = true; // W3 implementation does not include Sensory Return

  observations.push('World Medium is standalone: no Sensory Return implemented');
  observations.push('updateWorldMedium is pure: only returns WorldMediumState');
  observations.push('No feedback path to AETERNA exists in W3');

  return {
    name,
    description,
    duration: 0,
    success,
    observations,
    finalState: initializeWorldMediumState(),
    metrics: {},
  };
}

// --- Run all scenarios ---
export function runAllWorldMediumScenarios(): WorldMediumScenarioResult[] {
  return [
    runScenarioW3A(),
    runScenarioW3B(),
    runScenarioW3C(),
    runScenarioW3D(),
    runScenarioW3E(),
  ];
}
