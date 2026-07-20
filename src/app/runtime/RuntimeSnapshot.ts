/**
 * RuntimeSnapshot.ts
 *
 * The read-only view of the live Runtime that UI code should consume
 * instead of touching state.network / Observer internals directly
 * (master spec §8.1-8.2). This is a deliberately partial first version:
 * only the fields actually available from the live per-frame dynamics
 * (state.lastDyn, set by src/organism/actionLoop.js) are populated. The
 * deeper per-layer breakdowns the target architecture calls for
 * (viability, closure, membrane, localField, repeatedFlowPaths,
 * protoNetwork, observedRatios) require wiring in the corresponding
 * observer derivation functions already used by updateMetricsUI.js —
 * deferred to a later PR rather than faked here. See
 * docs/ui-migration-boundary.md.
 */

export interface RuntimeSnapshot {
  /** Simulation time in frames/ticks, from AeternaNetwork.simTime. */
  tick: number;
  /** Wall-clock ms this snapshot was read (performance.now()-based). */
  timestamp: number;
  /** 'WHITE' | 'BLACK' | 'NEUTRAL' — see src/organism/runtimeLoop.ts deriveEngineState. */
  engineState: string;
  sigma: number | null;
  phi: number | null;
  energy: number | null;
  arousal: number | null;

  // Not yet wired — present so consumers can branch on availability today
  // without a breaking type change once these are connected.
  viability: null;
  closure: null;
  membrane: null;
  localField: null;
  repeatedFlowPaths: null;
  protoNetwork: null;
  observedRatios: null;
}

interface LiveDynamicsLike {
  sigmaDisplay?: number;
  phiApprox?: number;
  energy?: number;
  arousal?: number;
}

interface LiveStateLike {
  network: { simTime: number } | null;
  lastDyn: LiveDynamicsLike | null;
  lastEngineState: string | null;
}

/**
 * Builds a RuntimeSnapshot from the live legacy state object. Returns null
 * before the first animation frame has run (state.lastDyn not yet set).
 */
export function buildRuntimeSnapshot(state: LiveStateLike, now: number): RuntimeSnapshot | null {
  if (!state.lastDyn || !state.network) return null;
  const dyn = state.lastDyn;
  return {
    tick: state.network.simTime,
    timestamp: now,
    engineState: state.lastEngineState ?? 'NEUTRAL',
    sigma: dyn.sigmaDisplay ?? null,
    phi: dyn.phiApprox ?? null,
    energy: dyn.energy ?? null,
    arousal: dyn.arousal ?? null,
    viability: null,
    closure: null,
    membrane: null,
    localField: null,
    repeatedFlowPaths: null,
    protoNetwork: null,
    observedRatios: null,
  };
}
