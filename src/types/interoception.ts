/**
 * InteroceptionPacket
 *
 * Minimal internal sensing packet for Beautiful Loop L1.
 * Observes organism core state as numeric felt-sense packet.
 * Does NOT yet drive dynamics - observer role only.
 */

export interface InteroceptionPacket {
  /** Frame timestamp */
  timestamp: number;

  /** Internal energy/reserve sense (0-1) */
  energySense: number;

  /** Overload pressure sense (0-1+) */
  overloadSense: number;

  /** Self-coherence/stability sense (0-1) */
  coherenceSense: number;

  /** Boundary integrity sense (0-1) */
  boundarySense: number;

  /** Restoration/recovery tendency (0-1) */
  restorationSense: number;

  /** Perturbation pressure from external dynamics (0-1+) */
  perturbationPressure: number;
}
