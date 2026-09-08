/**
 * PUT-IN: an external signal of some transducer-specific shape, the
 *   current time t, and chi's own cell count
 * EMERGED: a per-cell real amplitude contribution added to chi's own
 *   drive spatial profile for that tick (docs/vessel/K-series-II-brain-
 *   and-universe-plan.md K15's "入力ポートは世界χにのみ")
 * claim-tier: C2 (see src/tests/pure/transducer.test.ts: the composed
 *   drive equals baseDrive.spatialProfile + contribution cell-by-cell,
 *   exactly; a zero contribution reproduces baseDrive bit-for-bit)
 * floors (誠実な床): a ChiTransducer's `toChiDriveContribution` takes
 *   ONLY (signal, t, cellCount) - there is no parameter through which
 *   psi, chi's own current field, or any observed/instrument value
 *   could reach it. This is verified by a source-scan test (mirroring
 *   K13's `runDissipationTick(psi` signature check) rather than left as
 *   a convention: src/tests/pure/transducer.test.ts confirms the string
 *   `psi` never appears in this file or in
 *   src/pure/runtime/builtinTransducers.ts. This module does not decide
 *   WHAT any real-world signal means (no sensor/audio/text transducer
 *   is implemented here) - only minimal test transducers exist
 *   (builtinTransducers.ts), per K15-runtime-design.md Choice 4's own
 *   floor ("新しい現象と、その現象を判定する測定器を同一PRで確定しない"
 *   applied here as "同一PRで意味のある変換器を確定しない").
 */

import type { DriveSpec } from '../drive/drive.ts';

export interface ChiTransducer<TSignal> {
  /** "K15-M{n}" format, registered in docs/vessel/K15-transducer-catalog.md. */
  id: string;
  description: string;
  /**
   * Method-shorthand (not an arrow-typed property) deliberately: TS
   * checks method parameters bivariantly, which is what lets a
   * ChiTransducer<number> or ChiTransducer<SingleCellPulseSignal> sit in
   * a ChiTransducer<unknown> registry (TransducerRegistry below)
   * without an `any` escape hatch.
   */
  toChiDriveContribution(signal: TSignal, t: number, cellCount: number): Float64Array;
}

/**
 * Adds a transducer's contribution to chi's EXISTING drive spatial
 * profile for this tick, keeping the same carrier (omega/phase). The
 * caller passes the result as runWorldTick's `drive` argument - chi's
 * own drive parameter, the only one that exists per K13's constitution.
 */
export function applyTransducerToChiDrive<TSignal>(baseDrive: DriveSpec, transducer: ChiTransducer<TSignal>, signal: TSignal, t: number): DriveSpec {
  const cellCount = baseDrive.spatialProfile.length;
  const contribution = transducer.toChiDriveContribution(signal, t, cellCount);
  if (contribution.length !== cellCount) {
    throw new Error(
      `applyTransducerToChiDrive: transducer '${transducer.id}' produced a contribution of length ${contribution.length}, expected ${cellCount} (chi's own cell count)`,
    );
  }
  const spatialProfile = new Float64Array(cellCount);
  for (let i = 0; i < cellCount; i++) {
    spatialProfile[i] = baseDrive.spatialProfile[i] + contribution[i];
  }
  return { spatialProfile, omega: baseDrive.omega, phase: baseDrive.phase };
}

/**
 * Heterogeneous by design: a registry holds transducers with different
 * TSignal shapes side by side, looked up only by id (replay knows a
 * logged id and a JSON-parsed signal, never the original typed object
 * reference). `unknown` rather than `any` - the bivariant method-shorthand
 * checking above (not an `any` escape hatch) is what makes a concretely
 * typed ChiTransducer assignable here.
 */
export type TransducerRegistry = ReadonlyMap<string, ChiTransducer<unknown>>;

/** Builds a lookup table by id, for replay. Throws on a duplicate id. */
export function createTransducerRegistry(transducers: readonly ChiTransducer<unknown>[]): TransducerRegistry {
  const map = new Map<string, ChiTransducer<unknown>>();
  for (const transducer of transducers) {
    if (map.has(transducer.id)) {
      throw new Error(`createTransducerRegistry: duplicate transducer id '${transducer.id}'`);
    }
    map.set(transducer.id, transducer);
  }
  return map;
}
