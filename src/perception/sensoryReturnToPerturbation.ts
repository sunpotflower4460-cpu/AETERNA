import type { SensoryReturnPacket } from '../types/sensoryReturnPacket.ts';
import type { PerturbationEvent } from '../types/perturbationEvent.ts';

/**
 * sensoryReturnToPerturbation
 *
 * W4: Convert SensoryReturnPacket to PerturbationEvent for weak connection
 * to AETERNA's perturbation/mismatch pipeline.
 *
 * This conversion is INTENTIONALLY WEAK:
 * - Sensory Return should not create massive perturbations
 * - The conversion scales down intensity to avoid overwhelming the organism
 * - W4 does NOT perform reafference comparison (self-caused vs world-caused)
 * - This is a minimal connection to allow World Medium changes to affect AETERNA
 *
 * Design principles:
 * - Weak conversion: single packet doesn't dominate organism state
 * - No semantic interpretation
 * - Returns PerturbationEvent with new source type (simulatedWorld)
 * - All values remain in valid ranges
 *
 * @param packet - SensoryReturnPacket from World Medium
 * @returns PerturbationEvent for AETERNA perturbation pipeline
 */

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function sensoryReturnToPerturbation(
  packet: SensoryReturnPacket,
): PerturbationEvent {
  // Weak scaling factor to prevent sensory return from dominating
  // Single return packet should produce subtle perturbation
  const weakScale = 0.3;

  // Map channel to appropriate source
  // For W4, we treat all simulated returns as a world-derived source
  // In the future, 'simulatedWorld' could be added to PerturbationEvent.source
  // For now, we use the closest existing source types
  let source: PerturbationEvent['source'];
  switch (packet.channel) {
    case 'simulatedLight':
      source = 'light';
      break;
    case 'simulatedNoise':
      source = 'sound';
      break;
    case 'simulatedPressure':
    case 'simulatedMotion':
      source = 'motion';
      break;
    case 'simulatedEcho':
      source = 'sound'; // Echo is sound-like
      break;
    default:
      source = 'internal'; // Fallback
  }

  // Magnitude: scaled down intensity
  const magnitude = clamp01(packet.intensity * weakScale);

  // Novelty: use packet novelty directly but scale down
  const novelty = clamp01(packet.novelty * weakScale * 1.2);

  // Locality: use packet locality
  const locality = clamp01(packet.locality);

  // Expectedness: inverse of novelty, modulated by world origin strength
  // High world origin strength + low novelty = more expected
  const expectedness = clamp01(
    (1 - packet.novelty * 0.7) * packet.worldOriginStrength * 0.5 + 0.3
  );

  // Repetition hint: rhythm suggests repetition
  const repetitionHint = clamp01(packet.rhythm);

  // Boundary contact: weak, since this is ambient world return, not direct contact
  // Only pressure/motion channels might have slight boundary contact
  let boundaryContact = 0;
  if (packet.channel === 'simulatedPressure' || packet.channel === 'simulatedMotion') {
    boundaryContact = clamp01(packet.intensity * 0.2 * weakScale);
  }

  return {
    timestamp: packet.timestamp,
    source,
    magnitude,
    novelty,
    locality,
    expectedness,
    targetRegion: null, // Sensory return is not targeted to specific region
    repetitionHint,
    boundaryContact,
  };
}
