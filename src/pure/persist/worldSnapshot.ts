/**
 * PUT-IN: the K13 world's complete dynamical state at some tick (psi,
 *   psiNu, chi, chiNu, tick count, psi's own PureCoreParams, chi's own
 *   PureCoreParams - independent of psi's per K13's ADR Choice 1 -,
 *   solverSettings, k and lambda)
 * EMERGED: a JSON-serializable, bit-exact snapshot of the K13 world;
 *   restoring one and continuing a run must be indistinguishable from
 *   an uninterrupted run
 * claim-tier: C2 (composes the same finite-check/serialize pattern
 *   src/pure/persist/snapshot.ts already proved at C3 for the K2-K12
 *   psi+nu state; see src/tests/pure/worldSnapshot.test.ts for the
 *   restore-then-continue bit-exactness check specific to this format)
 * floors (誠実な床): a NEW file, deliberately not an extension of
 *   snapshot.ts's optional chiReal/chiImag fields (those were shaped
 *   for K5's 1D ring chi, which shares psi's N/dt and has no PureCoreParams
 *   of its own - see docs/vessel/K15-runtime-design.md Choice 2). Does
 *   not store `pairs` (the k distributed-boundary cell-pairs) - per
 *   src/pure/world/distributedBoundary.ts, pairs are a deterministic
 *   function of (psiGeometry, chiGeometry, k) alone, so restoring
 *   psiParams/chiParams/k is sufficient to reconstruct them via
 *   selectDistributedBoundary; storing them redundantly would only
 *   create a way for a stale copy to silently disagree with a
 *   recomputed one. Does not snapshot the delay-line null-hypothesis
 *   control's buffer state (src/pure/world/delayLineControl.ts) - K15's
 *   runtime targets the real K13 world, not the delay-line control
 *   device (K15-runtime-design.md Choice 2's floor). Does not snapshot
 *   PRNG state, for the same reason src/pure/persist/snapshot.ts does
 *   not (the PRNG runs only once, at t=0, inside createPureFieldState /
 *   createWorldInitialState).
 */

import type { ComplexField } from '../geometry/torus.ts';
import type { PureCoreParams, PureCoreSolverSettings } from '../params.ts';

export interface WorldSnapshotState {
  psiParams: PureCoreParams;
  chiParams: PureCoreParams;
  solverSettings: PureCoreSolverSettings;
  k: number;
  lambda: number;
  tick: number;
  psi: ComplexField;
  psiNu: Float64Array;
  chi: ComplexField;
  chiNu: Float64Array;
}

export interface WorldSnapshot {
  formatVersion: 1;
  tick: number;
  psiParams: PureCoreParams;
  chiParams: PureCoreParams;
  solverSettings: PureCoreSolverSettings;
  k: number;
  lambda: number;
  psiReal: number[];
  psiImag: number[];
  psiNu: number[];
  chiReal: number[];
  chiImag: number[];
  chiNu: number[];
  /** Caller-supplied, opaque to this module (e.g. git commit hash, wall-clock time). Not required for a correct restore. */
  provenance?: Record<string, string>;
}

function assertAllFinite(values: Float64Array, label: string): void {
  for (let i = 0; i < values.length; i++) {
    if (!Number.isFinite(values[i])) {
      throw new Error(
        `createWorldSnapshot: ${label}[${i}] is not finite (${values[i]}) - refusing to snapshot a corrupted state (AGENTS.md stop conditions: NaN/Infinity must be reported, not persisted)`,
      );
    }
  }
}

export function createWorldSnapshot(state: WorldSnapshotState, provenance?: Record<string, string>): WorldSnapshot {
  assertAllFinite(state.psi.real, 'psi.real');
  assertAllFinite(state.psi.imag, 'psi.imag');
  assertAllFinite(state.psiNu, 'psiNu');
  assertAllFinite(state.chi.real, 'chi.real');
  assertAllFinite(state.chi.imag, 'chi.imag');
  assertAllFinite(state.chiNu, 'chiNu');
  if (!Number.isInteger(state.tick) || state.tick < 0) {
    throw new Error(`createWorldSnapshot: tick must be a non-negative integer, got ${state.tick}`);
  }
  if (!Number.isInteger(state.k) || state.k < 1) {
    throw new Error(`createWorldSnapshot: k must be a positive integer, got ${state.k}`);
  }

  const snapshot: WorldSnapshot = {
    formatVersion: 1,
    tick: state.tick,
    psiParams: state.psiParams,
    chiParams: state.chiParams,
    solverSettings: state.solverSettings,
    k: state.k,
    lambda: state.lambda,
    psiReal: Array.from(state.psi.real),
    psiImag: Array.from(state.psi.imag),
    psiNu: Array.from(state.psiNu),
    chiReal: Array.from(state.chi.real),
    chiImag: Array.from(state.chi.imag),
    chiNu: Array.from(state.chiNu),
  };
  if (provenance) {
    snapshot.provenance = provenance;
  }
  return snapshot;
}

export function restoreWorldSnapshot(snapshot: WorldSnapshot): WorldSnapshotState {
  if (snapshot.formatVersion !== 1) {
    throw new Error(`restoreWorldSnapshot: unsupported formatVersion ${snapshot.formatVersion}`);
  }

  const expectedPsiSize = snapshot.psiParams.N * snapshot.psiParams.N;
  if (snapshot.psiReal.length !== expectedPsiSize || snapshot.psiImag.length !== expectedPsiSize || snapshot.psiNu.length !== expectedPsiSize) {
    throw new Error(`restoreWorldSnapshot: psi/psiNu array length does not match psiParams.N^2 (${expectedPsiSize})`);
  }
  const expectedChiSize = snapshot.chiParams.N * snapshot.chiParams.N;
  if (snapshot.chiReal.length !== expectedChiSize || snapshot.chiImag.length !== expectedChiSize || snapshot.chiNu.length !== expectedChiSize) {
    throw new Error(`restoreWorldSnapshot: chi/chiNu array length does not match chiParams.N^2 (${expectedChiSize})`);
  }
  if (!Number.isInteger(snapshot.k) || snapshot.k < 1) {
    throw new Error(`restoreWorldSnapshot: k must be a positive integer, got ${snapshot.k}`);
  }

  return {
    psiParams: snapshot.psiParams,
    chiParams: snapshot.chiParams,
    solverSettings: snapshot.solverSettings,
    k: snapshot.k,
    lambda: snapshot.lambda,
    tick: snapshot.tick,
    psi: { real: Float64Array.from(snapshot.psiReal), imag: Float64Array.from(snapshot.psiImag) },
    psiNu: Float64Array.from(snapshot.psiNu),
    chi: { real: Float64Array.from(snapshot.chiReal), imag: Float64Array.from(snapshot.chiImag) },
    chiNu: Float64Array.from(snapshot.chiNu),
  };
}

/** Convenience: JSON text in, restored state out. Throws on malformed JSON or a failed restoreWorldSnapshot validation. */
export function restoreWorldSnapshotFromJson(json: string): WorldSnapshotState {
  return restoreWorldSnapshot(JSON.parse(json) as WorldSnapshot);
}

/** Convenience: snapshot in, JSON text out (pretty-printed for human inspection - this is a checkpoint file, not a hot path). */
export function serializeWorldSnapshotToJson(snapshot: WorldSnapshot): string {
  return JSON.stringify(snapshot, null, 2);
}
