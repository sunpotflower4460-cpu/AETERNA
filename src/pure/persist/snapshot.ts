/**
 * PUT-IN: the pure core's complete dynamical state at some tick (psi,
 *   nu, optionally chi, tick count, params, solverSettings)
 * EMERGED: a JSON-serializable, bit-exact snapshot; restoring one and
 *   continuing a run must be indistinguishable from an uninterrupted run
 * claim-tier: C3 (see src/tests/pure/snapshot.test.ts's mid-run
 *   snapshot-then-continue test: the restored-and-continued trajectory
 *   is checked bit-identical to an uninterrupted run of the same total
 *   length, not merely "close")
 * floors (誠実な床): does NOT snapshot PRNG state. This is not an
 *   oversight - src/pure/random/seededPrng.ts's createSeededRandom is
 *   used ONLY once, inside createPureFieldState at t=0 (verified: it is
 *   the only caller anywhere in src/pure/), and never again during tick
 *   evolution (every subsequent step is a deterministic function of
 *   psi/nu/chi/t - no module past state.ts calls the PRNG). Snapshotting
 *   the field arrays already captures everything the PRNG produced, so
 *   there is no "PRNG state" left over to lose. If a future module ever
 *   draws randomness during evolution (it must not, per
 *   pureCoreForbiddenPatterns.test.ts's Math.random ban and this
 *   project's broader determinism contract), this floor would need
 *   revisiting.
 *
 * Does not itself capture code/commit provenance (git hash, file
 * hashes) - that is external to a pure physics state and would require
 * filesystem/process access this module deliberately does not have.
 * Callers who need that (docs/vessel/K-series-II-brain-and-universe-
 * plan.md K10's manifest) attach it via the optional `provenance` field,
 * which this module stores and returns unexamined.
 *
 * NaN/Infinity anywhere in the state is refused at snapshot time
 * (AGENTS.md 停止条件: NaN/Infinity は隠さず報告する) rather than
 * silently written as JSON `null` (which is what JSON.stringify would
 * otherwise do to a NaN, corrupting the snapshot without any error).
 */

import type { ComplexField } from '../geometry/torus.ts';
import type { PureCoreParams, PureCoreSolverSettings } from '../params.ts';

export interface PureCoreSnapshotState {
  params: PureCoreParams;
  solverSettings: PureCoreSolverSettings;
  tick: number;
  psi: ComplexField;
  nu: Float64Array;
  /** Present only for a K5-style closed-loop run. */
  chi?: ComplexField;
}

export interface PureCoreSnapshot {
  formatVersion: 1;
  tick: number;
  params: PureCoreParams;
  solverSettings: PureCoreSolverSettings;
  psiReal: number[];
  psiImag: number[];
  nu: number[];
  chiReal?: number[];
  chiImag?: number[];
  /** Caller-supplied, opaque to this module (e.g. git commit hash, wall-clock time). Not required for a correct restore. */
  provenance?: Record<string, string>;
}

function assertAllFinite(values: Float64Array, label: string): void {
  for (let i = 0; i < values.length; i++) {
    if (!Number.isFinite(values[i])) {
      throw new Error(
        `createSnapshot: ${label}[${i}] is not finite (${values[i]}) - refusing to snapshot a corrupted state (AGENTS.md stop conditions: NaN/Infinity must be reported, not persisted)`,
      );
    }
  }
}

export function createSnapshot(state: PureCoreSnapshotState, provenance?: Record<string, string>): PureCoreSnapshot {
  assertAllFinite(state.psi.real, 'psi.real');
  assertAllFinite(state.psi.imag, 'psi.imag');
  assertAllFinite(state.nu, 'nu');
  if (state.chi) {
    assertAllFinite(state.chi.real, 'chi.real');
    assertAllFinite(state.chi.imag, 'chi.imag');
  }
  if (!Number.isInteger(state.tick) || state.tick < 0) {
    throw new Error(`createSnapshot: tick must be a non-negative integer, got ${state.tick}`);
  }

  const snapshot: PureCoreSnapshot = {
    formatVersion: 1,
    tick: state.tick,
    params: state.params,
    solverSettings: state.solverSettings,
    psiReal: Array.from(state.psi.real),
    psiImag: Array.from(state.psi.imag),
    nu: Array.from(state.nu),
  };
  if (state.chi) {
    snapshot.chiReal = Array.from(state.chi.real);
    snapshot.chiImag = Array.from(state.chi.imag);
  }
  if (provenance) {
    snapshot.provenance = provenance;
  }
  return snapshot;
}

export function restoreSnapshot(snapshot: PureCoreSnapshot): PureCoreSnapshotState {
  if (snapshot.formatVersion !== 1) {
    throw new Error(`restoreSnapshot: unsupported formatVersion ${snapshot.formatVersion}`);
  }

  const expectedFieldSize = snapshot.params.N * snapshot.params.N;
  if (snapshot.psiReal.length !== expectedFieldSize || snapshot.psiImag.length !== expectedFieldSize) {
    throw new Error(`restoreSnapshot: psi array length does not match params.N^2 (${expectedFieldSize})`);
  }
  if (snapshot.nu.length !== expectedFieldSize) {
    throw new Error(`restoreSnapshot: nu array length does not match params.N^2 (${expectedFieldSize})`);
  }
  const hasChiReal = snapshot.chiReal !== undefined;
  const hasChiImag = snapshot.chiImag !== undefined;
  if (hasChiReal !== hasChiImag) {
    throw new Error('restoreSnapshot: chiReal and chiImag must both be present or both absent');
  }
  if (hasChiReal && snapshot.chiReal!.length !== snapshot.chiImag!.length) {
    throw new Error('restoreSnapshot: chiReal and chiImag length mismatch');
  }

  const state: PureCoreSnapshotState = {
    params: snapshot.params,
    solverSettings: snapshot.solverSettings,
    tick: snapshot.tick,
    psi: { real: Float64Array.from(snapshot.psiReal), imag: Float64Array.from(snapshot.psiImag) },
    nu: Float64Array.from(snapshot.nu),
  };
  if (hasChiReal) {
    state.chi = { real: Float64Array.from(snapshot.chiReal!), imag: Float64Array.from(snapshot.chiImag!) };
  }
  return state;
}

/** Convenience: JSON text in, restored state out. Throws on malformed JSON or a failed restoreSnapshot validation. */
export function restoreSnapshotFromJson(json: string): PureCoreSnapshotState {
  return restoreSnapshot(JSON.parse(json) as PureCoreSnapshot);
}

/** Convenience: snapshot in, JSON text out (pretty-printed for human inspection - this is a checkpoint file, not a hot path). */
export function serializeSnapshotToJson(snapshot: PureCoreSnapshot): string {
  return JSON.stringify(snapshot, null, 2);
}
