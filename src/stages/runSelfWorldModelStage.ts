/**
 * runSelfWorldModelStage
 *
 * Beautiful Loop L1: Minimal self/world model stage.
 * Constructs minimal proto-self and world boundary packet.
 * Observer role only - does NOT modify dynamics.
 */

import type { SelfWorldModelPacket } from '../types/selfWorldModel.ts';
import type { InteroceptionPacket } from '../types/interoception.ts';
import type { OrganismSnapshot } from '../types/organismSnapshot.ts';
import { clamp01 } from '../core/coreConstants.ts';

/**
 * Generate SelfWorldModelPacket from interoception and organism snapshot.
 * Pure transform - no side effects.
 */
export function runSelfWorldModelStage(
  interoceptionPacket: InteroceptionPacket,
  snapshot: OrganismSnapshot
): SelfWorldModelPacket {
  // selfCoherence: derived from coherenceSense and boundary
  const selfCoherence = clamp01(
    interoceptionPacket.coherenceSense * 0.6 +
      interoceptionPacket.boundarySense * 0.4
  );

  // selfContinuity: based on coherence memory and mode stability
  // wake mode = higher continuity, dream/sleep = lower
  // ALSO reduced by high overload
  const modeStabilityFactor =
    snapshot.modeState === 'wake' ? 1.0 : snapshot.modeState === 'sleep' ? 0.5 : 0.7;
  const overloadPenalty = Math.min(1.0, snapshot.overload);
  const selfContinuity = clamp01(
    snapshot.coherenceMemory * 0.7 * (1.0 - overloadPenalty * 0.6) +
    (1.0 - overloadPenalty) * 0.3 * modeStabilityFactor
  );

  // worldPressure: external perturbation and touch activity
  const worldPressure = clamp01(
    interoceptionPacket.perturbationPressure * 0.6 +
      snapshot.recentTouchActivity * 0.4
  );

  // relationEngagement: openness to interaction
  // High when energy ok, not overloaded, and some touch expectation
  const relationEngagement = clamp01(
    interoceptionPacket.energySense * 0.4 +
      (1.0 - interoceptionPacket.overloadSense) * 0.3 +
      snapshot.touchExpectationConfidence * 0.3
  );

  return {
    timestamp: snapshot.timestamp,
    selfCoherence,
    selfContinuity,
    worldPressure,
    relationEngagement,
  };
}
