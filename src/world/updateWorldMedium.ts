import type { WorldMediumState } from '../types/worldMediumState.ts';
import type { ActuationPulse } from '../types/actuationPulse.ts';

/**
 * updateWorldMedium
 *
 * W3: Update the simulated World Medium state based on:
 * 1. Incoming Actuation Pulse from AETERNA (if any)
 * 2. Natural time-based decay and drift
 *
 * Design principles:
 * - Pure function: takes current world state and pulse, returns next state
 * - World changes even without pulses (natural drift/decay)
 * - Pulse effects are SUBTLE — no dramatic changes from single pulse
 * - All values remain in valid ranges [0, 1], no NaN/Infinity
 * - Does NOT send Sensory Return to AETERNA (W4+)
 * - Does NOT perform semantic interpretation
 *
 * @param world - Current WorldMediumState
 * @param pulse - ActuationPulse from AETERNA, or null if no pulse this frame
 * @param dt - Time delta in seconds (typically 1/60 ≈ 0.0167)
 * @returns Next WorldMediumState
 */

function clampFinite(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return (min + max) / 2;
  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
  return clampFinite(value, 0, 1);
}

/**
 * F3: `smoothDecay` was a homeostatic pull (Principle 1 violation when read as
 * "decay this field toward a goal"). Re-framed as `applyAmbientExchange`: the
 * world field equilibrates against an external ambient bath via a one-sided
 * exchange rate. The math is bit-exact identical, but the destinations of
 * the inflow and outflow are now explicit.
 *
 * Returns `{ next, inflowFromAmbient, outflowToAmbient }`. When
 * `ambientBaseline > value`, inflow > 0; when smaller, outflow > 0.
 */
export interface AmbientExchangeResult {
  next: number;
  inflowFromAmbient: number;
  outflowToAmbient: number;
}

function applyAmbientExchange(
  value: number,
  ambientBaseline: number,
  exchangeRate: number,
  dt: number,
): AmbientExchangeResult {
  const delta = (ambientBaseline - value) * exchangeRate * dt;
  const next = clamp01(value + delta);
  if (delta >= 0) {
    return { next, inflowFromAmbient: delta, outflowToAmbient: 0 };
  }
  return { next, inflowFromAmbient: 0, outflowToAmbient: -delta };
}

/**
 * Optional per-field accounting of named ambient inflows/outflows. When a
 * caller passes this collector, `updateWorldMedium` will populate it with the
 * exchange terms produced by `applyAmbientExchange` for each world field.
 */
export interface WorldAmbientExchangeAudit {
  inflows: Record<string, number>;
  outflows: Record<string, number>;
}

function recordExchange(
  audit: WorldAmbientExchangeAudit | undefined,
  fieldName: string,
  result: AmbientExchangeResult,
): number {
  if (audit) {
    audit.inflows[fieldName] = (audit.inflows[fieldName] ?? 0) + result.inflowFromAmbient;
    audit.outflows[fieldName] = (audit.outflows[fieldName] ?? 0) + result.outflowToAmbient;
  }
  return result.next;
}

export function updateWorldMedium(
  world: WorldMediumState,
  pulse: ActuationPulse | null,
  dt: number,
  audit?: WorldAmbientExchangeAudit,
): WorldMediumState {
  const timestamp = Date.now();

  // Natural baseline values for decay
  const baselineLight = 0.5;
  const baselineNoise = 0.2;
  const baselineResistance = 0.4;
  const baselineTemperature = 0.35;
  const baselineStability = 0.7;

  // --- Natural decay rates (per second) ---
  const lightDecayRate = 0.3;
  const noiseDecayRate = 0.5;
  const resistanceDecayRate = 0.2;
  const echoDecayRate = 0.8; // Faster decay for echo
  const temperatureDecayRate = 0.25;
  const stabilityDecayRate = 0.15;
  const impactDecayRate = 1.2; // Fast decay for pulse impact
  const residueDecayRate = 0.9; // Fast decay for residues

  // --- External ambient perturbation injected into motionDrift ---
  // F7: This is not emergent — it is a multi-frequency sin generator driven by
  // wall-clock. We name it `externalAmbientPerturbation` so its source is
  // explicit (an external ambient generator, not a field property), and we
  // record the signed perturbation injected this tick.
  const driftAmplitude = 0.08;
  const driftFrequency = 0.5; // cycles per second
  const phase = (timestamp / 1000) * driftFrequency;
  const externalAmbientPerturbation =
    Math.sin(phase * 2.1) * 0.5 + Math.sin(phase * 3.7) * 0.3 + Math.sin(phase * 5.3) * 0.2;
  const driftDelta = externalAmbientPerturbation * driftAmplitude * dt;
  if (audit) {
    // Negative driftDelta = motionDrift decreased = perturbation pulled energy
    // out (outflow). Positive = perturbation pushed energy in (inflow).
    if (driftDelta >= 0) {
      audit.inflows['motionDriftAmbientPerturbation'] =
        (audit.inflows['motionDriftAmbientPerturbation'] ?? 0) + driftDelta;
    } else {
      audit.outflows['motionDriftAmbientPerturbation'] =
        (audit.outflows['motionDriftAmbientPerturbation'] ?? 0) + (-driftDelta);
    }
  }

  // --- Equilibrate each field against its named external ambient source ---
  // The math is bit-exact equivalent to the previous smoothDecay() calls.
  // applyAmbientExchange names the inflow/outflow as explicit ambient flows;
  // recordExchange optionally writes them into a caller-supplied audit object.
  let ambientLight = recordExchange(audit, 'ambientLight',
    applyAmbientExchange(world.ambientLight, baselineLight, lightDecayRate, dt));
  let ambientNoise = recordExchange(audit, 'ambientNoise',
    applyAmbientExchange(world.ambientNoise, baselineNoise, noiseDecayRate, dt));
  let surfaceResistance = recordExchange(audit, 'surfaceResistance',
    applyAmbientExchange(world.surfaceResistance, baselineResistance, resistanceDecayRate, dt));
  let echoLevel = recordExchange(audit, 'echoLevel',
    applyAmbientExchange(world.echoLevel, 0, echoDecayRate, dt));
  let motionDrift = clamp01(world.motionDrift + driftDelta);
  let fieldTemperature = recordExchange(audit, 'fieldTemperature',
    applyAmbientExchange(world.fieldTemperature, baselineTemperature, temperatureDecayRate, dt));
  let lastPulseImpact = recordExchange(audit, 'lastPulseImpact',
    applyAmbientExchange(world.lastPulseImpact, 0, impactDecayRate, dt));
  let mediumStability = recordExchange(audit, 'mediumStability',
    applyAmbientExchange(world.mediumStability, baselineStability, stabilityDecayRate, dt));

  let visualResidue = recordExchange(audit, 'visualResidue',
    applyAmbientExchange(world.visualResidue ?? 0, 0, residueDecayRate, dt));
  let forceResidue = recordExchange(audit, 'forceResidue',
    applyAmbientExchange(world.forceResidue ?? 0, 0, residueDecayRate, dt));
  let worldTurbulence = recordExchange(audit, 'worldTurbulence',
    applyAmbientExchange(world.worldTurbulence ?? 0.15, 0.15, 0.4, dt));
  let returnReadiness = recordExchange(audit, 'returnReadiness',
    applyAmbientExchange(world.returnReadiness ?? 0.3, 0.3, 0.2, dt));

  // feedbackDelay slowly returns to its ambient baseline (0.2)
  let feedbackDelay = recordExchange(audit, 'feedbackDelay',
    applyAmbientExchange(world.feedbackDelay, 0.2, 0.1, dt));

  // --- Apply Actuation Pulse effects (if present) ---
  if (pulse !== null) {
    const intensity = clamp01(pulse.intensity);
    const coherence = clamp01(pulse.coherence);
    const locality = clamp01(pulse.locality);

    // Scale pulse effect by intensity and coherence
    const pulseStrength = intensity * 0.6 + coherence * 0.4;
    const globalSpread = (1 - locality) * 0.5; // Lower locality = more global effect

    // Update lastPulseImpact
    lastPulseImpact = clamp01(lastPulseImpact + pulseStrength * 0.25);

    // Channel-specific effects
    if (pulse.channel === 'visual') {
      // Visual pulse affects light, visual residue, and echo
      const visualEffect = pulseStrength * 0.08;
      ambientLight = clamp01(ambientLight + visualEffect * (0.5 + globalSpread));
      visualResidue = clamp01(visualResidue + visualEffect * 0.7);
      echoLevel = clamp01(echoLevel + visualEffect * 0.4);

      // Slight increase in noise and turbulence
      ambientNoise = clamp01(ambientNoise + visualEffect * 0.15);
      worldTurbulence = clamp01(worldTurbulence + visualEffect * 0.2);
    } else if (pulse.channel === 'simulatedForce') {
      // Simulated force pulse affects resistance, temperature, drift, and force residue
      const forceEffect = pulseStrength * 0.1;
      surfaceResistance = clamp01(surfaceResistance + forceEffect * 0.5);
      motionDrift = clamp01(motionDrift + forceEffect * 0.6);
      fieldTemperature = clamp01(fieldTemperature + forceEffect * 0.5);
      forceResidue = clamp01(forceResidue + forceEffect * 0.8);

      // Force pulses create more turbulence
      worldTurbulence = clamp01(worldTurbulence + forceEffect * 0.35);
      echoLevel = clamp01(echoLevel + forceEffect * 0.25);
    }

    // Both channels affect stability and return readiness
    mediumStability = clamp01(mediumStability - pulseStrength * 0.08);
    returnReadiness = clamp01(returnReadiness + pulseStrength * 0.15);

    // High intensity or low coherence increases turbulence
    if (intensity > 0.7) {
      worldTurbulence = clamp01(worldTurbulence + 0.05 * intensity);
    }
    if (coherence < 0.3) {
      worldTurbulence = clamp01(worldTurbulence + 0.04 * (1 - coherence));
    }
  }

  // --- Apply turbulence effects on world parameters ---
  // High turbulence makes the world less stable and more volatile
  const turbulenceEffect = worldTurbulence * dt;
  mediumStability = clamp01(mediumStability - turbulenceEffect * 0.15);
  fieldTemperature = clamp01(fieldTemperature + turbulenceEffect * 0.1);

  // --- Prevent extreme values ---
  // Keep all values within reasonable bounds
  ambientLight = clamp01(ambientLight);
  ambientNoise = clamp01(ambientNoise);
  surfaceResistance = clamp01(surfaceResistance);
  echoLevel = clamp01(echoLevel);
  motionDrift = clamp01(motionDrift);
  fieldTemperature = clamp01(fieldTemperature);
  feedbackDelay = clamp01(feedbackDelay);
  lastPulseImpact = clamp01(lastPulseImpact);
  mediumStability = clamp01(mediumStability);
  visualResidue = clamp01(visualResidue);
  forceResidue = clamp01(forceResidue);
  worldTurbulence = clamp01(worldTurbulence);
  returnReadiness = clamp01(returnReadiness);

  return {
    timestamp,
    ambientLight,
    ambientNoise,
    surfaceResistance,
    echoLevel,
    motionDrift,
    fieldTemperature,
    feedbackDelay,
    lastPulseImpact,
    mediumStability,
    visualResidue,
    forceResidue,
    worldTurbulence,
    returnReadiness,
  };
}
