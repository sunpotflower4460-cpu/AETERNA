/**
 * k15-runtime-continuous-run.ts
 *
 * Not physics - the execution script for K15's completion record
 * (docs/vessel/vessel-roadmap.md K15 section). Demonstrates, across
 * GENUINELY SEPARATE OS processes (each `tsx` invocation below is its
 * own process, not an in-process simulation), that:
 *
 *   1. `uninterrupted`: runs the full tick budget in one process, with
 *      a fixed schedule of injected signals, and writes the final
 *      worldSnapshot + full input log.
 *   2. `checkpoint`: runs the FIRST half only, writes a mid-run
 *      worldSnapshot + the input log entries logged so far.
 *   3. `resume`: a FRESH process loads that checkpoint + prior log,
 *      runs the SECOND half (with its own portion of the signal
 *      schedule), and writes the final worldSnapshot + full input log.
 *   4. `replay`: a FRESH process, given ONLY the final input log from
 *      step 1 or 3 (not the live signal-generation code, not any
 *      checkpoint), replays the whole run from t=0 and writes its own
 *      final worldSnapshot.
 *
 * The completion record then diffs (1) vs (3)'s final snapshot
 * (checkpoint/restart bit-identity) and (1) vs (4)'s final snapshot
 * (input-log replay bit-identity), both across real process boundaries.
 *
 * Usage:
 *   tsx scripts/k15-runtime-continuous-run.ts uninterrupted --out <snapshot.json> --logOut <log.jsonl>
 *   tsx scripts/k15-runtime-continuous-run.ts checkpoint --out <snapshot.json> --logOut <log.jsonl>
 *   tsx scripts/k15-runtime-continuous-run.ts resume --checkpointIn <snapshot.json> --logIn <log.jsonl> --out <snapshot.json> --logOut <log.jsonl>
 *   tsx scripts/k15-runtime-continuous-run.ts replay --logIn <log.jsonl> --out <snapshot.json>
 */

import { writeFileSync, readFileSync } from 'node:fs';
import { RuntimeProcess, type RuntimeProcessConfig } from '../src/pure/runtime/runtimeProcess.ts';
import { createTransducerRegistry } from '../src/pure/runtime/transducer.ts';
import { uniformAmplitudeTransducer, singleCellPulseTransducer } from '../src/pure/runtime/builtinTransducers.ts';
import { parseInputLogJsonl, serializeInputLogJsonl, resolveChiDriveForTick, type InputLogEntry } from '../src/pure/runtime/inputLog.ts';
import { createWorldSnapshot, restoreWorldSnapshotFromJson, serializeWorldSnapshotToJson } from '../src/pure/persist/worldSnapshot.ts';
import { defaultPureCoreSolverSettings } from '../src/pure/params.ts';
import { createWorldField, createWorldInitialState } from '../src/pure/world/worldField.ts';
import { selectDistributedBoundary } from '../src/pure/world/distributedBoundary.ts';
import { runWorldTick } from '../src/pure/world/worldTick.ts';
import type { PureCoreParams } from '../src/pure/params.ts';
import type { DriveSpec } from '../src/pure/drive/drive.ts';
import type { ComplexField } from '../src/pure/geometry/torus.ts';

const N = 16;
const TOTAL_TICKS = 2000;
const CHECKPOINT_TICK = 800; // first half length
const CHECKPOINT_INTERVAL = 100;

// Fixed schedule (not a CLI flag - reduces risk of a scripting bug changing the physics under test).
const SCHEDULE: Array<{ tick: number; transducerId: string; signal: unknown }> = [
  { tick: 100, transducerId: uniformAmplitudeTransducer.id, signal: 0.1 },
  { tick: 500, transducerId: singleCellPulseTransducer.id, signal: { cellIndex: 3, amplitude: 0.5 } },
  { tick: 1000, transducerId: uniformAmplitudeTransducer.id, signal: -0.05 },
  { tick: 1500, transducerId: singleCellPulseTransducer.id, signal: { cellIndex: 10, amplitude: 0.3 } },
];

function buildConfig(): RuntimeProcessConfig {
  const psiParams: PureCoreParams = { R: 3, r: 1, N, dt: 0.01, alpha: 1, g: 1.5, nu0: 0.2, kappa: 1, rho: 0.3, seed: 42 };
  const chiParams: PureCoreParams = { ...psiParams, seed: 43 };
  const baseDrive: DriveSpec = { spatialProfile: new Float64Array(N * N).fill(0.2), omega: 2, phase: 0.2 };
  return {
    psiParams,
    chiParams,
    k: 4,
    lambda: 0.5,
    baseDrive,
    checkpointInterval: CHECKPOINT_INTERVAL,
    residualTolerance: { n: 1e-6, h: 1e-6 },
    transducerRegistry: createTransducerRegistry([uniformAmplitudeTransducer, singleCellPulseTransducer]),
  };
}

async function runRange(process: RuntimeProcess, fromTick: number, toTick: number): Promise<void> {
  const scheduleInRange = SCHEDULE.filter((s) => s.tick >= fromTick && s.tick < toTick);
  let cursor = fromTick;
  for (const event of scheduleInRange.sort((a, b) => a.tick - b.tick)) {
    await process.runTicks(event.tick - cursor);
    process.injectSignal(event.transducerId, event.signal);
    cursor = event.tick;
  }
  await process.runTicks(toTick - cursor);
}

function arg(name: string): string {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx < 0 || !process.argv[idx + 1]) {
    throw new Error(`missing required --${name} argument`);
  }
  return process.argv[idx + 1];
}

async function cmdUninterrupted(): Promise<void> {
  const config = buildConfig();
  const runtime = new RuntimeProcess(config);
  await runRange(runtime, 0, TOTAL_TICKS);
  reportAndWrite(runtime, arg('out'), arg('logOut'));
}

async function cmdCheckpoint(): Promise<void> {
  const config = buildConfig();
  const runtime = new RuntimeProcess(config);
  await runRange(runtime, 0, CHECKPOINT_TICK);
  reportAndWrite(runtime, arg('out'), arg('logOut'));
}

async function cmdResume(): Promise<void> {
  const config = buildConfig();
  const checkpointJson = restoreWorldSnapshotFromJson(readFileSync(arg('checkpointIn'), 'utf-8'));
  const priorLog = parseInputLogJsonl(readFileSync(arg('logIn'), 'utf-8'));
  const runtime = new RuntimeProcess({
    ...config,
    resumeFrom: {
      tick: checkpointJson.tick,
      psi: checkpointJson.psi,
      psiNu: checkpointJson.psiNu,
      chi: checkpointJson.chi,
      chiNu: checkpointJson.chiNu,
      priorInputLog: priorLog,
    },
  });
  await runRange(runtime, CHECKPOINT_TICK, TOTAL_TICKS);
  reportAndWrite(runtime, arg('out'), arg('logOut'));
}

async function cmdReplay(): Promise<void> {
  const config = buildConfig();
  const entries: InputLogEntry[] = parseInputLogJsonl(readFileSync(arg('logIn'), 'utf-8'));

  const psiWorld = createWorldField({ params: config.psiParams });
  const chiWorld = createWorldField({ params: config.chiParams });
  const pairs = selectDistributedBoundary(psiWorld.geometry, chiWorld.geometry, config.k);
  const psiInitial = createWorldInitialState(psiWorld);
  const chiInitial = createWorldInitialState(chiWorld);
  let psi: ComplexField = { real: psiInitial.real, imag: psiInitial.imag };
  let psiNu = psiInitial.nu;
  let chi: ComplexField = { real: chiInitial.real, imag: chiInitial.imag };
  let chiNu = chiInitial.nu;

  for (let tick = 0; tick < TOTAL_TICKS; tick++) {
    const t = tick * psiWorld.params.dt;
    const drive = resolveChiDriveForTick(config.baseDrive, config.transducerRegistry, entries, tick, t);
    const result = runWorldTick(psi, psiNu, psiWorld, chi, chiNu, chiWorld, drive, t, psiWorld.params.dt, pairs, config.lambda);
    psi = result.psi;
    psiNu = result.psiNu;
    chi = result.chi;
    chiNu = result.chiNu;
  }

  console.log(`replay: final tick=${TOTAL_TICKS}, psi.real[0]=${psi.real[0]}, chi.real[0]=${chi.real[0]}`);
  const snapshot = createWorldSnapshot({
    psiParams: config.psiParams,
    chiParams: config.chiParams,
    solverSettings: defaultPureCoreSolverSettings(),
    k: config.k,
    lambda: config.lambda,
    tick: TOTAL_TICKS,
    psi,
    psiNu,
    chi,
    chiNu,
  });
  writeFileSync(arg('out'), serializeWorldSnapshotToJson(snapshot));
}

function reportAndWrite(runtime: RuntimeProcess, outPath: string, logOutPath: string): void {
  const result = runtime.getStopCondition();
  if (result) {
    console.log(`STOPPED at tick ${runtime.getCurrentTick()}: ${JSON.stringify(result)}`);
  } else {
    console.log(`OK: reached tick ${runtime.getCurrentTick()} with no stop condition`);
  }
  const snapshot = runtime.getLatestWorldSnapshot();
  console.log(`tick=${snapshot.tick} psi.real[0]=${snapshot.psiReal[0]} chi.real[0]=${snapshot.chiReal[0]} inputLogEntries=${runtime.getInputLog().length}`);
  writeFileSync(outPath, serializeWorldSnapshotToJson(snapshot));
  writeFileSync(logOutPath, serializeInputLogJsonl(runtime.getInputLog()));
}

async function main(): Promise<void> {
  const command = process.argv[2];
  if (command === 'uninterrupted') return cmdUninterrupted();
  if (command === 'checkpoint') return cmdCheckpoint();
  if (command === 'resume') return cmdResume();
  if (command === 'replay') return cmdReplay();
  throw new Error(`unknown command '${command}' - expected uninterrupted|checkpoint|resume|replay`);
}

main();
