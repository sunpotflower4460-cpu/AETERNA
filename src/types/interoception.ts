/**
 * InteroceptionPacket
 *
 * Minimal internal sensing packet for Beautiful Loop L1.
 * Observes organism core state as numeric felt-sense packet.
 * Does NOT yet drive dynamics - observer role only.
 *
 * A1 Update: Now maps directly to FeltStateVector structure
 * for unified internal sensing vocabulary.
 */

export interface InteroceptionPacket {
  /** Frame timestamp */
  timestamp: number;

  /** Internal energy/reserve sense (0-1) - maps to felt depletion (inverted) */
  energySense: number;

  /** Overload pressure sense (0-1+) - maps to felt overload */
  overloadSense: number;

  /** Self-coherence/stability sense (0-1) - maps to felt coherence */
  coherenceSense: number;

  /** Boundary integrity sense (0-1) - maps to felt boundaryIntegrity */
  boundarySense: number;

  /** Restoration/recovery tendency (0-1) - maps to felt restorationReadiness */
  restorationSense: number;

  /** Perturbation pressure from external dynamics (0-1+) - maps to felt perturbationLoad */
  perturbationPressure: number;
}
