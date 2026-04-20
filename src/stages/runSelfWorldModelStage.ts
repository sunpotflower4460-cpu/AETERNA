/**
 * runSelfWorldModelStage
 *
 * Beautiful Loop L1/L2: Minimal self/world model stage.
 * Constructs minimal proto-self and world boundary packet.
 * Observer role only - does NOT modify dynamics.
 *
 * L2 enhancement: Uses previous frame packet to compute continuity.
 */

import type { SelfWorldModelPacket } from '../types/selfWorldModel.ts';
import type { InteroceptionPacket } from '../types/interoception.ts';
import type { OrganismSnapshot } from '../types/organismSnapshot.ts';
import { clamp01 } from '../core/coreConstants.ts';

/**
 * Generate SelfWorldModelPacket from interoception and organism snapshot.
 * Pure transform - no side effects.
 *
 * @param interoceptionPacket - Current interoception packet
 * @param snapshot - Current organism snapshot
 * @param lastPacket - Previous frame self/world packet (optional, for continuity)
 */
export function runSelfWorldModelStage(
  interoceptionPacket: InteroceptionPacket,
  snapshot: OrganismSnapshot,
  lastPacket: SelfWorldModelPacket | null = null
): SelfWorldModelPacket {
  // selfCoherence: derived from coherenceSense and boundary
  const selfCoherence = clamp01(
    interoceptionPacket.coherenceSense * 0.6 +
      interoceptionPacket.boundarySense * 0.4
  );

  // selfContinuity: L2 enhancement - compare with previous frame
  // Measures how much self-coherence is maintained across frames
  let selfContinuity: number;
  if (lastPacket) {
    // Compare current selfCoherence with previous
    const coherenceDelta = Math.abs(selfCoherence - lastPacket.selfCoherence);
    const continuityFromCoherence = 1.0 - coherenceDelta;

    // Factor in mode stability
    const modeStabilityFactor =
      snapshot.modeState === 'wake' ? 1.0 : snapshot.modeState === 'sleep' ? 0.5 : 0.7;

    // Factor in overload penalty
    const overloadPenalty = Math.min(1.0, snapshot.overload);

    // Combine: prefer continuityFromCoherence when we have history
    selfContinuity = clamp01(
      continuityFromCoherence * 0.5 +
      snapshot.coherenceMemory * 0.3 * (1.0 - overloadPenalty * 0.6) +
      (1.0 - overloadPenalty) * 0.2 * modeStabilityFactor
    );
  } else {
    // No history: fall back to L1 behavior
    const modeStabilityFactor =
      snapshot.modeState === 'wake' ? 1.0 : snapshot.modeState === 'sleep' ? 0.5 : 0.7;
    const overloadPenalty = Math.min(1.0, snapshot.overload);
    selfContinuity = clamp01(
      snapshot.coherenceMemory * 0.7 * (1.0 - overloadPenalty * 0.6) +
      (1.0 - overloadPenalty) * 0.3 * modeStabilityFactor
    );
  }

  // worldPressure: external perturbation and touch activity
  const worldPressure = clamp01(
    interoceptionPacket.perturbationPressure * 0.6 +
      snapshot.recentTouchActivity * 0.4
  );

  // relationEngagement: L2 minimal dynamic update
  // Based on energy, overload, and touch expectation confidence
  // Also considers recent touch activity as a sign of relational openness
  const relationEngagement = clamp01(
    interoceptionPacket.energySense * 0.35 +
      (1.0 - interoceptionPacket.overloadSense) * 0.25 +
      snapshot.touchExpectationConfidence * 0.25 +
      snapshot.recentTouchActivity * 0.15
  );

  return {
    timestamp: snapshot.timestamp,
    selfCoherence,
    selfContinuity,
    worldPressure,
    relationEngagement,
  };
}
