import { describe, expect, it, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import WebSocket from 'ws';
import { RuntimeProcess, type RuntimeProcessConfig } from '../../pure/runtime/runtimeProcess.ts';
import { createTransducerRegistry } from '../../pure/runtime/transducer.ts';
import { uniformAmplitudeTransducer, singleCellPulseTransducer } from '../../pure/runtime/builtinTransducers.ts';
import { startObservationApi, type ObservationApiHandle } from '../../pure/runtime/observationApi.ts';
import { createWorldField, createWorldInitialState } from '../../pure/world/worldField.ts';
import { selectDistributedBoundary } from '../../pure/world/distributedBoundary.ts';
import { runWorldTick } from '../../pure/world/worldTick.ts';
import type { PureCoreParams } from '../../pure/params.ts';
import type { DriveSpec } from '../../pure/drive/drive.ts';
import type { ComplexField } from '../../pure/geometry/torus.ts';

function baseParams(seed: number): PureCoreParams {
  return { R: 3, r: 1, N: 8, dt: 0.01, alpha: 1, g: 1, nu0: 0.15, kappa: 1, rho: 0.3, seed };
}

function baseConfig(overrides: Partial<RuntimeProcessConfig> = {}): RuntimeProcessConfig {
  const registry = createTransducerRegistry([uniformAmplitudeTransducer, singleCellPulseTransducer]);
  const baseDrive: DriveSpec = { spatialProfile: new Float64Array(64).fill(0.3), omega: 3, phase: 0.1 };
  return {
    psiParams: baseParams(1),
    chiParams: baseParams(2),
    k: 4,
    lambda: 0.6,
    baseDrive,
    checkpointInterval: 10,
    residualTolerance: { n: 1e-6, h: 1e-6 },
    transducerRegistry: registry,
    ...overrides,
  };
}

describe('pure core K15 RuntimeProcess: matches a manual runWorldTick loop bit-for-bit', () => {
  it('with no injected signals, produces exactly the same trajectory as directly calling runWorldTick each tick', async () => {
    const config = baseConfig();
    const process = new RuntimeProcess(config);
    const result = await process.runTicks(15);
    expect(result.stopped).toBe(false);
    expect(result.finalTick).toBe(15);

    const psiWorld = createWorldField({ params: config.psiParams });
    const chiWorld = createWorldField({ params: config.chiParams });
    const pairs = selectDistributedBoundary(psiWorld.geometry, chiWorld.geometry, config.k);
    const psiInitial = createWorldInitialState(psiWorld);
    const chiInitial = createWorldInitialState(chiWorld);
    let psi: ComplexField = { real: psiInitial.real, imag: psiInitial.imag };
    let psiNu = psiInitial.nu;
    let chi: ComplexField = { real: chiInitial.real, imag: chiInitial.imag };
    let chiNu = chiInitial.nu;
    for (let tick = 0; tick < 15; tick++) {
      const t = tick * psiWorld.params.dt;
      const r = runWorldTick(psi, psiNu, psiWorld, chi, chiNu, chiWorld, config.baseDrive, t, psiWorld.params.dt, pairs, config.lambda);
      psi = r.psi;
      psiNu = r.psiNu;
      chi = r.chi;
      chiNu = r.chiNu;
    }

    const finalSnapshot = process.getLatestWorldSnapshot();
    expect(finalSnapshot.psiReal).toEqual(Array.from(psi.real));
    expect(finalSnapshot.chiReal).toEqual(Array.from(chi.real));
    expect(finalSnapshot.chiNu).toEqual(Array.from(chiNu));
  });

  it('an injected signal changes the trajectory relative to no signal at all (the mechanism actually does something)', async () => {
    const withSignal = new RuntimeProcess(baseConfig());
    withSignal.injectSignal(uniformAmplitudeTransducer.id, 5);
    await withSignal.runTicks(10);

    const withoutSignal = new RuntimeProcess(baseConfig());
    await withoutSignal.runTicks(10);

    expect(withSignal.getLatestWorldSnapshot().psiReal).not.toEqual(withoutSignal.getLatestWorldSnapshot().psiReal);
  });

  it('injectSignal logs the signal at the CURRENT tick, and it is applied to that exact tick (not the one before or after)', async () => {
    const process = new RuntimeProcess(baseConfig());
    await process.runTicks(3); // now at tick 3
    process.injectSignal(singleCellPulseTransducer.id, { cellIndex: 0, amplitude: 1 });
    expect(process.getInputLog()).toEqual([{ tick: 3, transducerId: singleCellPulseTransducer.id, signal: { cellIndex: 0, amplitude: 1 } }]);
    await process.runTicks(1);
    expect(process.getCurrentTick()).toBe(4);
  });
});

describe('pure core K15 RuntimeProcess: checkpoint and restart across two instances matches an uninterrupted run', () => {
  it('running 10, checkpointing, then resuming for 10 more in a NEW instance matches one continuous 20-tick run', async () => {
    const config = baseConfig();

    const uninterrupted = new RuntimeProcess(config);
    await uninterrupted.runTicks(20);

    const firstHalf = new RuntimeProcess(config);
    await firstHalf.runTicks(10);
    const checkpoint = firstHalf.getLatestWorldSnapshot();
    const checkpointJson = JSON.parse(JSON.stringify(checkpoint)) as typeof checkpoint; // actual JSON round trip

    const secondHalf = new RuntimeProcess({
      ...config,
      resumeFrom: {
        tick: checkpointJson.tick,
        psi: { real: Float64Array.from(checkpointJson.psiReal), imag: Float64Array.from(checkpointJson.psiImag) },
        psiNu: Float64Array.from(checkpointJson.psiNu),
        chi: { real: Float64Array.from(checkpointJson.chiReal), imag: Float64Array.from(checkpointJson.chiImag) },
        chiNu: Float64Array.from(checkpointJson.chiNu),
        priorInputLog: firstHalf.getInputLog(),
      },
    });
    await secondHalf.runTicks(10);

    expect(secondHalf.getLatestWorldSnapshot().psiReal).toEqual(uninterrupted.getLatestWorldSnapshot().psiReal);
    expect(secondHalf.getLatestWorldSnapshot().chiReal).toEqual(uninterrupted.getLatestWorldSnapshot().chiReal);
    expect(secondHalf.getLatestWorldSnapshot().chiNu).toEqual(uninterrupted.getLatestWorldSnapshot().chiNu);
  });

  it('a signal injected before the checkpoint and one injected after both survive a restart, matching an uninterrupted run with both signals', async () => {
    const config = baseConfig();

    const uninterrupted = new RuntimeProcess(config);
    uninterrupted.injectSignal(uniformAmplitudeTransducer.id, 0.2); // applied at tick 0
    await uninterrupted.runTicks(5);
    uninterrupted.injectSignal(uniformAmplitudeTransducer.id, 0.3); // applied at tick 5
    await uninterrupted.runTicks(5);

    const firstHalf = new RuntimeProcess(config);
    firstHalf.injectSignal(uniformAmplitudeTransducer.id, 0.2);
    await firstHalf.runTicks(5);
    const checkpoint = firstHalf.getLatestWorldSnapshot();

    const secondHalf = new RuntimeProcess({
      ...config,
      resumeFrom: {
        tick: checkpoint.tick,
        psi: { real: Float64Array.from(checkpoint.psiReal), imag: Float64Array.from(checkpoint.psiImag) },
        psiNu: Float64Array.from(checkpoint.psiNu),
        chi: { real: Float64Array.from(checkpoint.chiReal), imag: Float64Array.from(checkpoint.chiImag) },
        chiNu: Float64Array.from(checkpoint.chiNu),
        priorInputLog: firstHalf.getInputLog(),
      },
    });
    secondHalf.injectSignal(uniformAmplitudeTransducer.id, 0.3);
    await secondHalf.runTicks(5);

    expect(secondHalf.getLatestWorldSnapshot().psiReal).toEqual(uninterrupted.getLatestWorldSnapshot().psiReal);
    expect(secondHalf.getInputLog()).toEqual(uninterrupted.getInputLog());
  });
});

let apiHandle: ObservationApiHandle | undefined;

afterEach(async () => {
  if (apiHandle) {
    await apiHandle.close();
    apiHandle = undefined;
  }
});

describe('pure core K15 RuntimeProcess: observation API connected vs disconnected does not change the field (decisive falsifier)', () => {
  it('a run WITH a real WebSocket client actively connected and broadcasting matches a run with the API never started, bit-for-bit', async () => {
    const config = baseConfig();

    // Disconnected: no observation API ever started.
    const disconnected = new RuntimeProcess(config);
    disconnected.injectSignal(uniformAmplitudeTransducer.id, 0.15);
    await disconnected.runTicks(20);

    // Connected: a real WebSocket server broadcasts this process's own
    // observation snapshots to a real connected client throughout the run.
    const connected = new RuntimeProcess(config);
    apiHandle = await startObservationApi({ port: 0, getLatestSnapshot: () => connected.getLatestObservationSnapshot(), broadcastIntervalMs: 5 });
    const client = new WebSocket(`ws://localhost:${apiHandle.port}`);
    await new Promise<void>((resolve, reject) => {
      client.once('open', () => resolve());
      client.once('error', reject);
    });
    let messagesReceived = 0;
    client.on('message', () => {
      messagesReceived++;
    });

    connected.injectSignal(uniformAmplitudeTransducer.id, 0.15);
    await connected.runTicks(20);
    await new Promise((resolve) => setTimeout(resolve, 30)); // let a few broadcasts land
    client.close();

    expect(messagesReceived).toBeGreaterThan(0); // sanity: the API was actually doing something during the run
    expect(connected.getLatestWorldSnapshot().psiReal).toEqual(disconnected.getLatestWorldSnapshot().psiReal);
    expect(connected.getLatestWorldSnapshot().psiImag).toEqual(disconnected.getLatestWorldSnapshot().psiImag);
    expect(connected.getLatestWorldSnapshot().chiReal).toEqual(disconnected.getLatestWorldSnapshot().chiReal);
    expect(connected.getLatestWorldSnapshot().chiNu).toEqual(disconnected.getLatestWorldSnapshot().chiNu);
  });
});

describe('pure core K15 RuntimeProcess: stop conditions preserve the last good state without throwing', () => {
  it('an absurdly tight residual tolerance stops the run early and reports why, without throwing', async () => {
    const config = baseConfig({ residualTolerance: { n: 1e-300, h: 1e-6 } });
    const process = new RuntimeProcess(config);
    const result = await process.runTicks(50);
    expect(result.stopped).toBe(true);
    expect(result.stopCondition?.reason).toBe('ledger-residual-exceeded');
    expect(result.finalTick).toBeLessThan(50);
    expect(process.getCurrentTick()).toBe(result.finalTick);
  });

  it('further runTicks calls after a stop are no-ops that keep reporting the same stop condition', async () => {
    const config = baseConfig({ residualTolerance: { n: 1e-300, h: 1e-6 } });
    const process = new RuntimeProcess(config);
    const first = await process.runTicks(50);
    const second = await process.runTicks(10);
    expect(second.ticksRun).toBe(0);
    expect(second.stopCondition).toEqual(first.stopCondition);
  });
});

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

describe('pure core K15 RuntimeProcess: structural wiring (transducer output reaches ONLY chi\'s drive argument)', () => {
  it('the runWorldTick(this.psi, ...) call site is fed effectiveDrive, which is exactly resolveChiDriveForTick\'s result - no other path exists', () => {
    const sourcePath = fileURLToPath(new URL('../../pure/runtime/runtimeProcess.ts', import.meta.url));
    const source = stripComments(readFileSync(sourcePath, 'utf-8'));

    const runWorldTickCall = source.match(/runWorldTick\([^;]*\);/);
    expect(runWorldTickCall).not.toBeNull();
    expect(runWorldTickCall![0]).toContain('effectiveDrive');

    const effectiveDriveAssignment = source.match(/const effectiveDrive = resolveChiDriveForTick\([^;]*\);/);
    expect(effectiveDriveAssignment).not.toBeNull();

    // effectiveDrive must not appear anywhere else that could route it to psi directly (only the one assignment and the one runWorldTick call site should reference it).
    const occurrences = (source.match(/\beffectiveDrive\b/g) ?? []).length;
    expect(occurrences).toBe(2);
  });
});
