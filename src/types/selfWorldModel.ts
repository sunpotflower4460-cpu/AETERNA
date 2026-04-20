/**
 * SelfWorldModelPacket
 *
 * Minimal self/world/relation observation packet for Beautiful Loop L1.
 * Represents minimal proto-self awareness and world-organism boundary.
 * Does NOT yet drive dynamics - observer role only.
 */

export interface SelfWorldModelPacket {
  /** Frame timestamp */
  timestamp: number;

  /** Self-side coherence/integration (0-1) */
  selfCoherence: number;

  /** Self-continuity over recent history (0-1) */
  selfContinuity: number;

  /** External pressure from world-side (0-1+) */
  worldPressure: number;

  /** Engagement/openness to relation (0-1) */
  relationEngagement: number;
}
