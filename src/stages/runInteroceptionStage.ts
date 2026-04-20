/**
 * runInteroceptionStage
 *
 * Beautiful Loop L1: Minimal interoception stage.
 * Transforms organism core state into internal sensing packet.
 * Observer role only - does NOT modify dynamics.
 */

import type { InteroceptionPacket } from '../types/interoception.ts';
import type { OrganismSnapshot } from '../types/organismSnapshot.ts';
import { clamp01 } from '../core/coreConstants.ts';

/**
 * Generate InteroceptionPacket from organism snapshot.
 * Pure transform - no side effects.
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
