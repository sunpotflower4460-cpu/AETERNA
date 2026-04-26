import type { WorldMediumState } from '../types/worldMediumState.ts';
import type { SensoryReturnPacket, SensoryReturnChannel } from '../types/sensoryReturnPacket.ts';

/**
 * deriveSensoryReturn
 *
 * W4: Derive Sensory Return packets from World Medium state changes.
 *
 * This function compares current and previous World Medium states to generate
 * pre-semantic sensory return signals. These are NOT semantic inputs — they are
 * raw simulated signals returning from the world.
 *
 * Design principles:
 * - Pure function: takes world states, returns packets
 * - No NaN/Infinity values in output
 * - All values in [0, 1] range
 * - Packets only generated when World Medium shows significant change
 * - Multiple channels can return simultaneously
 * - W4 does NOT perform reafference comparison (self-caused vs world-caused)
 * - No semantic interpretation
 *
 * @param currentWorld - Current WorldMediumState
 * @param previousWorld - Previous WorldMediumState (null on first frame)
 * @param dt - Time delta in seconds
 * @returns Array of SensoryReturnPackets (may be empty if no significant changes)
 */

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function computeChangeNovelty(delta: number, turbulence: number, stability: number): number {
  // Novelty increases with larger deltas and lower stability
  const deltaMagnitude = Math.abs(delta);
  const stabilityPenalty = 1 - stability * 0.3;
  const turbulenceBoost = 1 + turbulence * 0.4;
  return clamp01(deltaMagnitude * stabilityPenalty * turbulenceBoost * 3.0);
}

function computeLocality(delta: number, residue: number, driftLevel: number): number {
  // High residue or drift suggests more global, low suggests local
  const deltaMagnitude = Math.abs(delta);
  const globalness = (residue * 0.6 + driftLevel * 0.4);
  return clamp01(deltaMagnitude * (1 - globalness * 0.7));
}

function computeRhythm(
  previousDelta: number,
  currentDelta: number,
  stability: number,
): number {
  // Rhythm detected when consecutive deltas have consistent pattern
  // High stability and similar delta magnitudes suggest rhythmic behavior
  if (Math.abs(previousDelta) < 0.01 && Math.abs(currentDelta) < 0.01) {
    return 0;
  }
  const deltaSimilarity = 1 - Math.abs(previousDelta - currentDelta) / 2;
  return clamp01(deltaSimilarity * stability * 0.8);
}

export function deriveSensoryReturn(
  currentWorld: WorldMediumState,
  previousWorld: WorldMediumState | null,
  dt: number,
): SensoryReturnPacket[] {
  const packets: SensoryReturnPacket[] = [];

  // If no previous state, no return packets yet
  if (previousWorld === null) {
    return packets;
  }

  const timestamp = currentWorld.timestamp;

  // Compute field-level context
  const worldTurbulence = currentWorld.worldTurbulence ?? 0.15;
  const mediumStability = currentWorld.mediumStability;
  const returnReadiness = currentWorld.returnReadiness ?? 0.3;
  const feedbackDelay = currentWorld.feedbackDelay;
  const lastPulseImpact = currentWorld.lastPulseImpact;

  // World origin strength: how much this appears to be from world vs noise
  const worldOriginBase = clamp01(
    returnReadiness * 0.5 +
    (1 - worldTurbulence) * 0.3 +
    mediumStability * 0.2
  );

  // Return delay hint from feedbackDelay
  const returnDelayHint = clamp01(feedbackDelay);

  // Medium stability hint
  const mediumStabilityHint = clamp01(mediumStability);

  // Threshold for generating packets — avoid spam when world barely changes
  const changeThreshold = 0.02;

  // --- Derive simulatedLight return ---
  {
    const lightDelta = currentWorld.ambientLight - previousWorld.ambientLight;
    const visualResidue = currentWorld.visualResidue ?? 0;

    if (Math.abs(lightDelta) > changeThreshold || visualResidue > 0.1) {
      const intensity = clamp01(
        Math.abs(lightDelta) * 2.0 + visualResidue * 0.5 + lastPulseImpact * 0.3
      );
      const novelty = computeChangeNovelty(lightDelta, worldTurbulence, mediumStability);
      const locality = computeLocality(lightDelta, visualResidue, currentWorld.motionDrift);

      const previousLightDelta = previousWorld ?
        (previousWorld.ambientLight - (previousWorld.ambientLight)) : 0; // Approximation
      const rhythm = computeRhythm(0, lightDelta, mediumStability);

      const worldOriginStrength = clamp01(
        worldOriginBase + (visualResidue > 0.2 ? 0.15 : 0)
      );

      packets.push({
        timestamp,
        channel: 'simulatedLight',
        intensity,
        novelty,
        locality,
        rhythm,
        worldOriginStrength,
        returnDelayHint,
        mediumStabilityHint,
        echoLinked: clamp01(currentWorld.echoLevel * 0.6),
        returnReadiness,
      });
    }
  }

  // --- Derive simulatedNoise return ---
  {
    const noiseDelta = currentWorld.ambientNoise - previousWorld.ambientNoise;
    const fieldTemperature = currentWorld.fieldTemperature;

    if (Math.abs(noiseDelta) > changeThreshold || worldTurbulence > 0.25) {
      const intensity = clamp01(
        Math.abs(noiseDelta) * 2.5 + worldTurbulence * 0.4 + fieldTemperature * 0.3
      );
      const novelty = computeChangeNovelty(noiseDelta, worldTurbulence, mediumStability);
      const locality = computeLocality(noiseDelta, worldTurbulence, currentWorld.motionDrift);
      const rhythm = computeRhythm(0, noiseDelta, mediumStability);

      const worldOriginStrength = clamp01(
        worldOriginBase + (worldTurbulence > 0.3 ? 0.1 : 0)
      );

      packets.push({
        timestamp,
        channel: 'simulatedNoise',
        intensity,
        novelty,
        locality,
        rhythm,
        worldOriginStrength,
        returnDelayHint,
        mediumStabilityHint,
        motionLinked: clamp01(currentWorld.motionDrift * 0.5),
        returnReadiness,
      });
    }
  }

  // --- Derive simulatedPressure return ---
  {
    const resistanceDelta = currentWorld.surfaceResistance - previousWorld.surfaceResistance;
    const forceResidue = currentWorld.forceResidue ?? 0;

    if (Math.abs(resistanceDelta) > changeThreshold || forceResidue > 0.1) {
      const intensity = clamp01(
        Math.abs(resistanceDelta) * 2.5 + forceResidue * 0.7 + lastPulseImpact * 0.4
      );
      const novelty = computeChangeNovelty(resistanceDelta, worldTurbulence, mediumStability);
      const locality = computeLocality(resistanceDelta, forceResidue, currentWorld.motionDrift);
      const rhythm = computeRhythm(0, resistanceDelta, mediumStability);

      const worldOriginStrength = clamp01(
        worldOriginBase + (forceResidue > 0.3 ? 0.2 : 0)
      );

      packets.push({
        timestamp,
        channel: 'simulatedPressure',
        intensity,
        novelty,
        locality,
        rhythm,
        worldOriginStrength,
        returnDelayHint,
        mediumStabilityHint,
        echoLinked: clamp01(currentWorld.echoLevel * 0.4),
        motionLinked: clamp01(currentWorld.motionDrift * 0.6),
        returnReadiness,
      });
    }
  }

  // --- Derive simulatedMotion return ---
  {
    const driftDelta = currentWorld.motionDrift - previousWorld.motionDrift;
    const fieldTemperature = currentWorld.fieldTemperature;

    if (Math.abs(driftDelta) > changeThreshold || currentWorld.motionDrift > 0.5) {
      const intensity = clamp01(
        Math.abs(driftDelta) * 2.0 + currentWorld.motionDrift * 0.4 + worldTurbulence * 0.3
      );
      const novelty = computeChangeNovelty(driftDelta, worldTurbulence, mediumStability);
      const locality = computeLocality(driftDelta, worldTurbulence, currentWorld.motionDrift);
      const rhythm = computeRhythm(0, driftDelta, mediumStability);

      const worldOriginStrength = clamp01(
        worldOriginBase + (fieldTemperature > 0.5 ? 0.1 : 0)
      );

      packets.push({
        timestamp,
        channel: 'simulatedMotion',
        intensity,
        novelty,
        locality,
        rhythm,
        worldOriginStrength,
        returnDelayHint,
        mediumStabilityHint,
        pressureLinked: clamp01(currentWorld.surfaceResistance * 0.5),
        returnReadiness,
      });
    }
  }

  // --- Derive simulatedEcho return ---
  {
    const echoDelta = currentWorld.echoLevel - previousWorld.echoLevel;
    const echoLevel = currentWorld.echoLevel;

    if (Math.abs(echoDelta) > changeThreshold || echoLevel > 0.15) {
      const intensity = clamp01(
        echoLevel * 1.5 + Math.abs(echoDelta) * 1.5 + lastPulseImpact * 0.5
      );
      const novelty = computeChangeNovelty(echoDelta, worldTurbulence, mediumStability);
      const locality = computeLocality(echoDelta, echoLevel, currentWorld.motionDrift);
      const rhythm = computeRhythm(0, echoDelta, mediumStability);

      const worldOriginStrength = clamp01(
        worldOriginBase + (lastPulseImpact > 0.3 ? 0.25 : 0)
      );

      packets.push({
        timestamp,
        channel: 'simulatedEcho',
        intensity,
        novelty,
        locality,
        rhythm,
        worldOriginStrength,
        returnDelayHint,
        mediumStabilityHint,
        lightLinked: clamp01((currentWorld.visualResidue ?? 0) * 0.5),
        pressureLinked: clamp01(currentWorld.surfaceResistance * 0.4),
        returnReadiness,
      });
    }
  }

  return packets;
}
