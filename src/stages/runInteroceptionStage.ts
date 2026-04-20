/**
 * runInteroceptionStage
 *
 * Beautiful Loop L1: Minimal interoception stage.
 * Transforms organism core state into internal sensing packet.
 * Observer role only - does NOT modify dynamics.
 *
 * A1 Update: Now integrates with FeltStateVector for unified internal sensing.
 * InteroceptionPacket remains the lightweight public packet.
 * FeltStateVector is the richer internal representation.
 */

import type { InteroceptionPacket } from '../types/interoception.ts';
import type { FeltStateVector } from '../types/feltState.ts';
import type { OrganismSnapshot } from '../types/organismSnapshot.ts';
import { clamp01 } from '../core/coreConstants.ts';

/**
 * Generate InteroceptionPacket from organism snapshot.
 * Pure transform - no side effects.
 *
 * This is the lightweight version used when only snapshot is available.
 */
export function runInteroceptionStage(
  snapshot: OrganismSnapshot
): InteroceptionPacket {
  // energySense: maps energy reserve to felt energy
  const energySense = clamp01(snapshot.energy);

  // overloadSense: maps overload directly
  const overloadSense = clamp01(snapshot.overload);

  // coherenceSense: combines coherence and coherence memory
  const coherenceSense = clamp01(
    snapshot.coherence * 0.7 + snapshot.coherenceMemory * 0.3
  );

  // boundarySense: maps boundary integrity
  const boundarySense = clamp01(snapshot.boundary);

  // restorationSense: maps restoration bias
  const restorationSense = clamp01(snapshot.restorationBias);

  // perturbationPressure: combines prediction error and recent perturbation
  const perturbationPressure = clamp01(
    snapshot.meanPredictionError * 0.5 + snapshot.recentPerturbationPressure * 0.5
  );

  return {
    timestamp: snapshot.timestamp,
    energySense,
    overloadSense,
    coherenceSense,
    boundarySense,
    restorationSense,
    perturbationPressure,
  };
}

/**
 * Map FeltStateVector to InteroceptionPacket
 *
 * This creates the lightweight public packet from the richer felt-state.
 * Used when felt-state is computed first from fuller organism context.
 */
export function feltStateToInteroceptionPacket(
  feltState: FeltStateVector
): InteroceptionPacket {
  return {
    timestamp: feltState.timestamp,
    energySense: clamp01(1.0 - feltState.depletion), // Invert depletion to energy sense
    overloadSense: clamp01(feltState.overload),
    coherenceSense: clamp01(feltState.coherence),
    boundarySense: clamp01(feltState.boundaryIntegrity),
    restorationSense: clamp01(feltState.restorationReadiness),
    perturbationPressure: clamp01(feltState.perturbationLoad),
  };
}
