import { describe, expect, it } from 'vitest';
import {
  createWorldSnapshot,
  restoreWorldSnapshot,
  restoreWorldSnapshotFromJson,
  serializeWorldSnapshotToJson,
  type WorldSnapshot,
} from '../../pure/persist/worldSnapshot.ts';
import { createWorldField, createWorldInitialState, type WorldField } from '../../pure/world/worldField.ts';
import { selectDistributedBoundary, type DistributedBoundaryPair } from '../../pure/world/distributedBoundary.ts';
import { runWorldTick } from '../../pure/world/worldTick.ts';
import type { PureCoreParams } from '../../pure/params.ts';
import { defaultPureCoreSolverSettings } from '../../pure/params.ts';
import type { DriveSpec } from '../../pure/drive/drive.ts';
import type { ComplexField } from '../../pure/geometry/torus.ts';

function baseParams(overrides: Partial<PureCoreParams> = {}): PureCoreParams {
  return { R: 3, r: 1, N: 8, dt: 0.01, alpha: 1, g: 1, nu0: 0.15, kappa: 1, rho: 0.3, seed: 5, ...overrides };
}

interface WorldExperiment {
  psiWorld: WorldField;
  chiWorld: WorldField;
  pairs: DistributedBoundaryPair[];
  drive: DriveSpec;
  k: number;
  lambda: number;
}

function buildWorldExperiment(psiSeed: number, chiSeed: number, k = 4, lambda = 0.6): WorldExperiment {
  const psiWorld = createWorldField({ params: baseParams({ seed: psiSeed }) });
  const chiWorld = createWorldField({ params: baseParams({ seed: chiSeed }) });
  const pairs = selectDistributedBoundary(psiWorld.geometry, chiWorld.geometry, k);
  const drive: DriveSpec = { spatialProfile: new Float64Array(64).fill(0.3), omega: 3, phase: 0.1 };
  return { psiWorld, chiWorld, pairs, drive, k, lambda };
}

interface WorldRunState {
  psi: ComplexField;
  psiNu: Float64Array;
  chi: ComplexField;
  chiNu: Float64Array;
  tick: number;
}

function runWorldTicks(state: WorldRunState, exp: WorldExperiment, ticks: number): WorldRunState {
  let { psi, psiNu, chi, chiNu, tick } = state;
  for (let i = 0; i < ticks; i++) {
    const t = tick * exp.psiWorld.params.dt;
    const result = runWorldTick(psi, psiNu, exp.psiWorld, chi, chiNu, exp.chiWorld, exp.drive, t, exp.psiWorld.params.dt, exp.pairs, exp.lambda);
    psi = result.psi;
    psiNu = result.psiNu;
    chi = result.chi;
    chiNu = result.chiNu;
    tick += 1;
  }
  return { psi, psiNu, chi, chiNu, tick };
}

describe('pure core K15 worldSnapshot: round trip (object and JSON) preserves state exactly', () => {
  it('createWorldSnapshot -> restoreWorldSnapshot reproduces psi/chi/nu/tick/params bit-for-bit', () => {
    const exp = buildWorldExperiment(3, 4);
    const psiInitial = createWorldInitialState(exp.psiWorld);
    const chiInitial = createWorldInitialState(exp.chiWorld);
    const ran = runWorldTicks(
      { psi: { real: psiInitial.real, imag: psiInitial.imag }, psiNu: psiInitial.nu, chi: { real: chiInitial.real, imag: chiInitial.imag }, chiNu: chiInitial.nu, tick: 0 },
      exp,
      17,
    );

    const snapshot = createWorldSnapshot({
      psiParams: exp.psiWorld.params,
      chiParams: exp.chiWorld.params,
      solverSettings: defaultPureCoreSolverSettings(),
      k: exp.k,
      lambda: exp.lambda,
      tick: ran.tick,
      psi: ran.psi,
      psiNu: ran.psiNu,
      chi: ran.chi,
      chiNu: ran.chiNu,
    });
    const restored = restoreWorldSnapshot(snapshot);

    expect(restored.tick).toBe(ran.tick);
    expect(restored.psiParams).toEqual(exp.psiWorld.params);
    expect(restored.chiParams).toEqual(exp.chiWorld.params);
    expect(restored.k).toBe(exp.k);
    expect(restored.lambda).toBe(exp.lambda);
    expect(Float64Array.from(restored.psi.real)).toEqual(ran.psi.real);
    expect(Float64Array.from(restored.psi.imag)).toEqual(ran.psi.imag);
    expect(Float64Array.from(restored.psiNu)).toEqual(ran.psiNu);
    expect(Float64Array.from(restored.chi.real)).toEqual(ran.chi.real);
    expect(Float64Array.from(restored.chi.imag)).toEqual(ran.chi.imag);
    expect(Float64Array.from(restored.chiNu)).toEqual(ran.chiNu);
  });

  it('survives an actual JSON.stringify/parse round trip losslessly', () => {
    const exp = buildWorldExperiment(9, 10);
    const psiInitial = createWorldInitialState(exp.psiWorld);
    const chiInitial = createWorldInitialState(exp.chiWorld);
    const ran = runWorldTicks(
      { psi: { real: psiInitial.real, imag: psiInitial.imag }, psiNu: psiInitial.nu, chi: { real: chiInitial.real, imag: chiInitial.imag }, chiNu: chiInitial.nu, tick: 0 },
      exp,
      5,
    );

    const snapshot = createWorldSnapshot({
      psiParams: exp.psiWorld.params,
      chiParams: exp.chiWorld.params,
      solverSettings: defaultPureCoreSolverSettings(),
      k: exp.k,
      lambda: exp.lambda,
      tick: ran.tick,
      psi: ran.psi,
      psiNu: ran.psiNu,
      chi: ran.chi,
      chiNu: ran.chiNu,
    });
    const json = serializeWorldSnapshotToJson(snapshot);
    const restored = restoreWorldSnapshotFromJson(json);

    expect(Float64Array.from(restored.psi.real)).toEqual(ran.psi.real);
    expect(Float64Array.from(restored.chi.real)).toEqual(ran.chi.real);
    expect(Float64Array.from(restored.chiNu)).toEqual(ran.chiNu);
  });

  it('stores caller-supplied provenance unexamined', () => {
    const exp = buildWorldExperiment(1, 2);
    const psiInitial = createWorldInitialState(exp.psiWorld);
    const chiInitial = createWorldInitialState(exp.chiWorld);
    const snapshot = createWorldSnapshot(
      {
        psiParams: exp.psiWorld.params,
        chiParams: exp.chiWorld.params,
        solverSettings: defaultPureCoreSolverSettings(),
        k: exp.k,
        lambda: exp.lambda,
        tick: 0,
        psi: { real: psiInitial.real, imag: psiInitial.imag },
        psiNu: psiInitial.nu,
        chi: { real: chiInitial.real, imag: chiInitial.imag },
        chiNu: chiInitial.nu,
      },
      { gitCommit: 'abc123', note: 'test' },
    );
    expect(snapshot.provenance).toEqual({ gitCommit: 'abc123', note: 'test' });
  });
});

describe('pure core K15 worldSnapshot: mid-run checkpoint and restore is indistinguishable from an uninterrupted run', () => {
  it('snapshotting at tick 40 of 100, restoring into a completely fresh state, and continuing produces the SAME final state as never stopping', () => {
    const totalTicks = 100;
    const checkpointTick = 40;

    // Uninterrupted run.
    const uninterruptedExp = buildWorldExperiment(21, 22);
    const uninterruptedInitialPsi = createWorldInitialState(uninterruptedExp.psiWorld);
    const uninterruptedInitialChi = createWorldInitialState(uninterruptedExp.chiWorld);
    const uninterruptedResult = runWorldTicks(
      {
        psi: { real: uninterruptedInitialPsi.real, imag: uninterruptedInitialPsi.imag },
        psiNu: uninterruptedInitialPsi.nu,
        chi: { real: uninterruptedInitialChi.real, imag: uninterruptedInitialChi.imag },
        chiNu: uninterruptedInitialChi.nu,
        tick: 0,
      },
      uninterruptedExp,
      totalTicks,
    );

    // Run to checkpoint, snapshot, then simulate a fresh process by rebuilding
    // everything from scratch and restoring only from the JSON.
    const firstHalfExp = buildWorldExperiment(21, 22);
    const firstHalfInitialPsi = createWorldInitialState(firstHalfExp.psiWorld);
    const firstHalfInitialChi = createWorldInitialState(firstHalfExp.chiWorld);
    const toCheckpoint = runWorldTicks(
      {
        psi: { real: firstHalfInitialPsi.real, imag: firstHalfInitialPsi.imag },
        psiNu: firstHalfInitialPsi.nu,
        chi: { real: firstHalfInitialChi.real, imag: firstHalfInitialChi.imag },
        chiNu: firstHalfInitialChi.nu,
        tick: 0,
      },
      firstHalfExp,
      checkpointTick,
    );
    const snapshot = createWorldSnapshot({
      psiParams: firstHalfExp.psiWorld.params,
      chiParams: firstHalfExp.chiWorld.params,
      solverSettings: defaultPureCoreSolverSettings(),
      k: firstHalfExp.k,
      lambda: firstHalfExp.lambda,
      tick: toCheckpoint.tick,
      psi: toCheckpoint.psi,
      psiNu: toCheckpoint.psiNu,
      chi: toCheckpoint.chi,
      chiNu: toCheckpoint.chiNu,
    });
    const snapshotJson = serializeWorldSnapshotToJson(snapshot);

    // "Fresh process": nothing carried over except the JSON text.
    const restored = restoreWorldSnapshotFromJson(snapshotJson);
    const secondHalfExp = buildWorldExperiment(restored.psiParams.seed, restored.chiParams.seed, restored.k, restored.lambda);
    const resumed = runWorldTicks(
      { psi: restored.psi, psiNu: restored.psiNu, chi: restored.chi, chiNu: restored.chiNu, tick: restored.tick },
      secondHalfExp,
      totalTicks - checkpointTick,
    );

    expect(resumed.tick).toBe(uninterruptedResult.tick);
    expect(resumed.psi.real).toEqual(uninterruptedResult.psi.real);
    expect(resumed.psi.imag).toEqual(uninterruptedResult.psi.imag);
    expect(resumed.psiNu).toEqual(uninterruptedResult.psiNu);
    expect(resumed.chi.real).toEqual(uninterruptedResult.chi.real);
    expect(resumed.chi.imag).toEqual(uninterruptedResult.chi.imag);
    expect(resumed.chiNu).toEqual(uninterruptedResult.chiNu);
  });
});

describe('pure core K15 worldSnapshot: error handling', () => {
  it('refuses to snapshot a state containing NaN in psi', () => {
    const exp = buildWorldExperiment(1, 2);
    const psiInitial = createWorldInitialState(exp.psiWorld);
    const chiInitial = createWorldInitialState(exp.chiWorld);
    const corruptedPsi: ComplexField = { real: Float64Array.from(psiInitial.real), imag: Float64Array.from(psiInitial.imag) };
    corruptedPsi.real[0] = NaN;
    expect(() =>
      createWorldSnapshot({
        psiParams: exp.psiWorld.params,
        chiParams: exp.chiWorld.params,
        solverSettings: defaultPureCoreSolverSettings(),
        k: exp.k,
        lambda: exp.lambda,
        tick: 0,
        psi: corruptedPsi,
        psiNu: psiInitial.nu,
        chi: { real: chiInitial.real, imag: chiInitial.imag },
        chiNu: chiInitial.nu,
      }),
    ).toThrow(/not finite/);
  });

  it('refuses to snapshot a state containing Infinity in chiNu', () => {
    const exp = buildWorldExperiment(1, 2);
    const psiInitial = createWorldInitialState(exp.psiWorld);
    const chiInitial = createWorldInitialState(exp.chiWorld);
    const corruptedChiNu = Float64Array.from(chiInitial.nu);
    corruptedChiNu[0] = Infinity;
    expect(() =>
      createWorldSnapshot({
        psiParams: exp.psiWorld.params,
        chiParams: exp.chiWorld.params,
        solverSettings: defaultPureCoreSolverSettings(),
        k: exp.k,
        lambda: exp.lambda,
        tick: 0,
        psi: { real: psiInitial.real, imag: psiInitial.imag },
        psiNu: psiInitial.nu,
        chi: { real: chiInitial.real, imag: chiInitial.imag },
        chiNu: corruptedChiNu,
      }),
    ).toThrow(/not finite/);
  });

  it('refuses a negative or non-integer tick, or a non-positive k', () => {
    const exp = buildWorldExperiment(1, 2);
    const psiInitial = createWorldInitialState(exp.psiWorld);
    const chiInitial = createWorldInitialState(exp.chiWorld);
    const state = {
      psiParams: exp.psiWorld.params,
      chiParams: exp.chiWorld.params,
      solverSettings: defaultPureCoreSolverSettings(),
      k: exp.k,
      lambda: exp.lambda,
      psi: { real: psiInitial.real, imag: psiInitial.imag },
      psiNu: psiInitial.nu,
      chi: { real: chiInitial.real, imag: chiInitial.imag },
      chiNu: chiInitial.nu,
    };
    expect(() => createWorldSnapshot({ ...state, tick: -1 })).toThrow();
    expect(() => createWorldSnapshot({ ...state, tick: 1.5 })).toThrow();
    expect(() => createWorldSnapshot({ ...state, tick: 0, k: 0 })).toThrow();
  });

  it('rejects an unsupported formatVersion on restore', () => {
    const exp = buildWorldExperiment(1, 2);
    const psiInitial = createWorldInitialState(exp.psiWorld);
    const chiInitial = createWorldInitialState(exp.chiWorld);
    const snapshot = createWorldSnapshot({
      psiParams: exp.psiWorld.params,
      chiParams: exp.chiWorld.params,
      solverSettings: defaultPureCoreSolverSettings(),
      k: exp.k,
      lambda: exp.lambda,
      tick: 0,
      psi: { real: psiInitial.real, imag: psiInitial.imag },
      psiNu: psiInitial.nu,
      chi: { real: chiInitial.real, imag: chiInitial.imag },
      chiNu: chiInitial.nu,
    });
    const tampered = { ...snapshot, formatVersion: 2 } as unknown as WorldSnapshot;
    expect(() => restoreWorldSnapshot(tampered)).toThrow(/formatVersion/);
  });

  it('rejects a snapshot whose psi array length does not match psiParams.N^2', () => {
    const exp = buildWorldExperiment(1, 2);
    const psiInitial = createWorldInitialState(exp.psiWorld);
    const chiInitial = createWorldInitialState(exp.chiWorld);
    const snapshot = createWorldSnapshot({
      psiParams: exp.psiWorld.params,
      chiParams: exp.chiWorld.params,
      solverSettings: defaultPureCoreSolverSettings(),
      k: exp.k,
      lambda: exp.lambda,
      tick: 0,
      psi: { real: psiInitial.real, imag: psiInitial.imag },
      psiNu: psiInitial.nu,
      chi: { real: chiInitial.real, imag: chiInitial.imag },
      chiNu: chiInitial.nu,
    });
    const tampered = { ...snapshot, psiReal: snapshot.psiReal.slice(0, -1) };
    expect(() => restoreWorldSnapshot(tampered)).toThrow(/psi\/psiNu/);
  });

  it('rejects a snapshot whose chi array length does not match chiParams.N^2', () => {
    const exp = buildWorldExperiment(1, 2);
    const psiInitial = createWorldInitialState(exp.psiWorld);
    const chiInitial = createWorldInitialState(exp.chiWorld);
    const snapshot = createWorldSnapshot({
      psiParams: exp.psiWorld.params,
      chiParams: exp.chiWorld.params,
      solverSettings: defaultPureCoreSolverSettings(),
      k: exp.k,
      lambda: exp.lambda,
      tick: 0,
      psi: { real: psiInitial.real, imag: psiInitial.imag },
      psiNu: psiInitial.nu,
      chi: { real: chiInitial.real, imag: chiInitial.imag },
      chiNu: chiInitial.nu,
    });
    const tampered = { ...snapshot, chiReal: snapshot.chiReal.slice(0, -1) };
    expect(() => restoreWorldSnapshot(tampered)).toThrow(/chi\/chiNu/);
  });

  it('supports psi and chi having genuinely different N (K13 architecture allows independent geometries)', () => {
    const psiWorld = createWorldField({ params: baseParams({ seed: 1, N: 8 }) });
    const chiWorld = createWorldField({ params: baseParams({ seed: 2, N: 16 }) });
    const psiInitial = createWorldInitialState(psiWorld);
    const chiInitial = createWorldInitialState(chiWorld);
    const snapshot = createWorldSnapshot({
      psiParams: psiWorld.params,
      chiParams: chiWorld.params,
      solverSettings: defaultPureCoreSolverSettings(),
      k: 4,
      lambda: 0.5,
      tick: 0,
      psi: { real: psiInitial.real, imag: psiInitial.imag },
      psiNu: psiInitial.nu,
      chi: { real: chiInitial.real, imag: chiInitial.imag },
      chiNu: chiInitial.nu,
    });
    const restored = restoreWorldSnapshot(snapshot);
    expect(restored.psi.real.length).toBe(8 * 8);
    expect(restored.chi.real.length).toBe(16 * 16);
  });
});
