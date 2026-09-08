import { describe, expect, it } from 'vitest';
import { createSnapshot, restoreSnapshot, restoreSnapshotFromJson, serializeSnapshotToJson, type PureCoreSnapshot } from '../../pure/persist/snapshot.ts';
import { createTorusGeometry, type ComplexField } from '../../pure/geometry/torus.ts';
import { createLaplaceBeltramiOperator } from '../../pure/geometry/laplaceBeltrami.ts';
import { createConservativeStepper } from '../../pure/field/stepConservative.ts';
import { createPureFieldState } from '../../pure/field/state.ts';
import { runMediumHistoryTick } from '../../pure/ledger/energy.ts';
import type { DriveSpec } from '../../pure/drive/drive.ts';
import type { MediumHistoryParams } from '../../pure/medium/history.ts';
import type { PureCoreParams } from '../../pure/params.ts';
import { defaultPureCoreSolverSettings } from '../../pure/params.ts';

function buildExperiment(N: number, seed: number) {
  const params: PureCoreParams = { R: 3, r: 1, N, dt: 0.01, alpha: 1, g: 2, nu0: 0.2, kappa: 1, rho: 0.3, seed };
  const geometry = createTorusGeometry({ R: params.R, r: params.r, N });
  const operator = createLaplaceBeltramiOperator(geometry);
  const stepper = createConservativeStepper(operator, geometry, { alpha: params.alpha, g: params.g, dt: params.dt });
  const mediumParams: MediumHistoryParams = { kappa: params.kappa, rho: params.rho, nu0: params.nu0 };
  const drive: DriveSpec = { spatialProfile: new Float64Array(N * N).fill(0.1), omega: 2, phase: 0.4 };
  const initial = createPureFieldState(params, geometry);
  return { params, geometry, stepper, mediumParams, drive, initial };
}

function runTicks(psi: ComplexField, nu: Float64Array, exp: ReturnType<typeof buildExperiment>, fromTick: number, ticks: number) {
  let currentPsi = psi;
  let currentNu = nu;
  for (let i = 0; i < ticks; i++) {
    const tick = fromTick + i;
    const t = tick * exp.params.dt;
    const result = runMediumHistoryTick(currentPsi, exp.stepper, exp.geometry, exp.params.alpha, exp.params.g, currentNu, exp.drive, t, exp.params.dt, exp.mediumParams);
    currentPsi = result.psi;
    currentNu = result.nu;
  }
  return { psi: currentPsi, nu: currentNu, tick: fromTick + ticks };
}

describe('pure core K10 snapshot: round trip (object and JSON) preserves state exactly', () => {
  it('createSnapshot -> restoreSnapshot reproduces psi/nu/tick/params bit-for-bit', () => {
    const N = 8;
    const exp = buildExperiment(N, 3);
    const ran = runTicks({ real: exp.initial.real, imag: exp.initial.imag }, exp.initial.nu, exp, 0, 17);

    const snapshot = createSnapshot({ params: exp.params, solverSettings: defaultPureCoreSolverSettings(), tick: ran.tick, psi: ran.psi, nu: ran.nu });
    const restored = restoreSnapshot(snapshot);

    expect(restored.tick).toBe(ran.tick);
    expect(restored.params).toEqual(exp.params);
    expect(Float64Array.from(restored.psi.real)).toEqual(ran.psi.real);
    expect(Float64Array.from(restored.psi.imag)).toEqual(ran.psi.imag);
    expect(Float64Array.from(restored.nu)).toEqual(ran.nu);
  });

  it('survives an actual JSON.stringify/parse round trip losslessly', () => {
    const N = 6;
    const exp = buildExperiment(N, 9);
    const ran = runTicks({ real: exp.initial.real, imag: exp.initial.imag }, exp.initial.nu, exp, 0, 5);

    const snapshot = createSnapshot({ params: exp.params, solverSettings: defaultPureCoreSolverSettings(), tick: ran.tick, psi: ran.psi, nu: ran.nu });
    const json = serializeSnapshotToJson(snapshot);
    const restored = restoreSnapshotFromJson(json);

    expect(Float64Array.from(restored.psi.real)).toEqual(ran.psi.real);
    expect(Float64Array.from(restored.psi.imag)).toEqual(ran.psi.imag);
    expect(Float64Array.from(restored.nu)).toEqual(ran.nu);
  });

  it('round-trips an optional chi field', () => {
    const N = 6;
    const exp = buildExperiment(N, 12);
    const chi: ComplexField = { real: Float64Array.from([1, 2, 3, 4]), imag: Float64Array.from([-1, -2, -3, -4]) };

    const snapshot = createSnapshot({ params: exp.params, solverSettings: defaultPureCoreSolverSettings(), tick: 0, psi: { real: exp.initial.real, imag: exp.initial.imag }, nu: exp.initial.nu, chi });
    const restored = restoreSnapshot(snapshot);

    expect(restored.chi).toBeDefined();
    expect(Float64Array.from(restored.chi!.real)).toEqual(chi.real);
    expect(Float64Array.from(restored.chi!.imag)).toEqual(chi.imag);
  });

  it('stores caller-supplied provenance unexamined', () => {
    const N = 6;
    const exp = buildExperiment(N, 1);
    const snapshot = createSnapshot(
      { params: exp.params, solverSettings: defaultPureCoreSolverSettings(), tick: 0, psi: { real: exp.initial.real, imag: exp.initial.imag }, nu: exp.initial.nu },
      { gitCommit: 'abc123', note: 'test' },
    );
    expect(snapshot.provenance).toEqual({ gitCommit: 'abc123', note: 'test' });
  });
});

describe('pure core K10 snapshot: mid-run checkpoint and restore is indistinguishable from an uninterrupted run', () => {
  it('snapshotting at tick 40 of 100, restoring into a completely fresh state, and continuing produces the SAME final state as never stopping', () => {
    const N = 8;
    const totalTicks = 100;
    const checkpointTick = 40;

    // Uninterrupted run.
    const uninterrupted = buildExperiment(N, 21);
    const uninterruptedResult = runTicks({ real: uninterrupted.initial.real, imag: uninterrupted.initial.imag }, uninterrupted.initial.nu, uninterrupted, 0, totalTicks);

    // Run to checkpoint, snapshot, then simulate a fresh process by rebuilding
    // stepper/geometry/drive from scratch and restoring only from the snapshot.
    const firstHalfExp = buildExperiment(N, 21);
    const toCheckpoint = runTicks({ real: firstHalfExp.initial.real, imag: firstHalfExp.initial.imag }, firstHalfExp.initial.nu, firstHalfExp, 0, checkpointTick);
    const snapshot = createSnapshot({
      params: firstHalfExp.params,
      solverSettings: defaultPureCoreSolverSettings(),
      tick: toCheckpoint.tick,
      psi: toCheckpoint.psi,
      nu: toCheckpoint.nu,
    });
    const snapshotJson = serializeSnapshotToJson(snapshot);

    // "Fresh process": nothing carried over except the JSON text.
    const restored = restoreSnapshotFromJson(snapshotJson);
    const secondHalfExp = buildExperiment(N, restored.params.seed); // rebuild geometry/stepper/drive identically from params
    const resumed = runTicks(restored.psi, restored.nu, secondHalfExp, restored.tick, totalTicks - checkpointTick);

    expect(resumed.tick).toBe(uninterruptedResult.tick);
    expect(resumed.psi.real).toEqual(uninterruptedResult.psi.real);
    expect(resumed.psi.imag).toEqual(uninterruptedResult.psi.imag);
    expect(resumed.nu).toEqual(uninterruptedResult.nu);
  });
});

describe('pure core K10 snapshot: error handling', () => {
  it('refuses to snapshot a state containing NaN', () => {
    const N = 4;
    const exp = buildExperiment(N, 1);
    const corrupted: ComplexField = { real: Float64Array.from(exp.initial.real), imag: Float64Array.from(exp.initial.imag) };
    corrupted.real[0] = NaN;
    expect(() => createSnapshot({ params: exp.params, solverSettings: defaultPureCoreSolverSettings(), tick: 0, psi: corrupted, nu: exp.initial.nu })).toThrow(/not finite/);
  });

  it('refuses to snapshot a state containing Infinity', () => {
    const N = 4;
    const exp = buildExperiment(N, 1);
    const corrupted = Float64Array.from(exp.initial.nu);
    corrupted[0] = Infinity;
    expect(() => createSnapshot({ params: exp.params, solverSettings: defaultPureCoreSolverSettings(), tick: 0, psi: { real: exp.initial.real, imag: exp.initial.imag }, nu: corrupted })).toThrow(/not finite/);
  });

  it('refuses a negative or non-integer tick', () => {
    const N = 4;
    const exp = buildExperiment(N, 1);
    const state = { params: exp.params, solverSettings: defaultPureCoreSolverSettings(), psi: { real: exp.initial.real, imag: exp.initial.imag }, nu: exp.initial.nu };
    expect(() => createSnapshot({ ...state, tick: -1 })).toThrow();
    expect(() => createSnapshot({ ...state, tick: 1.5 })).toThrow();
  });

  it('rejects an unsupported formatVersion on restore', () => {
    const N = 4;
    const exp = buildExperiment(N, 1);
    const snapshot = createSnapshot({ params: exp.params, solverSettings: defaultPureCoreSolverSettings(), tick: 0, psi: { real: exp.initial.real, imag: exp.initial.imag }, nu: exp.initial.nu });
    const tampered = { ...snapshot, formatVersion: 2 } as unknown as PureCoreSnapshot;
    expect(() => restoreSnapshot(tampered)).toThrow(/formatVersion/);
  });

  it('rejects a snapshot whose field arrays do not match params.N', () => {
    const N = 4;
    const exp = buildExperiment(N, 1);
    const snapshot = createSnapshot({ params: exp.params, solverSettings: defaultPureCoreSolverSettings(), tick: 0, psi: { real: exp.initial.real, imag: exp.initial.imag }, nu: exp.initial.nu });
    const tampered = { ...snapshot, psiReal: snapshot.psiReal.slice(0, -1) };
    expect(() => restoreSnapshot(tampered)).toThrow(/does not match/);
  });

  it('rejects a snapshot with only one of chiReal/chiImag present', () => {
    const N = 4;
    const exp = buildExperiment(N, 1);
    const snapshot = createSnapshot({ params: exp.params, solverSettings: defaultPureCoreSolverSettings(), tick: 0, psi: { real: exp.initial.real, imag: exp.initial.imag }, nu: exp.initial.nu });
    const tampered = { ...snapshot, chiReal: [1, 2, 3] };
    expect(() => restoreSnapshot(tampered)).toThrow(/chiReal and chiImag/);
  });
});
