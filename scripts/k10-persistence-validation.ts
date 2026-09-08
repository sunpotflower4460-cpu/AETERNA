/**
 * k10-persistence-validation.ts
 *
 * Not physics - a verification harness script (like
 * scripts/run-release-checks.ts), for docs/vessel/K-series-II-brain-and-
 * universe-plan.md K10's decisive falsifier:
 *
 *   "復元でビット一致が取れないなら、原因（浮動小数点の演算順・PRNG状態）
 *    を特定するまで K11 に進まない"
 *
 * src/tests/pure/snapshot.test.ts and src/tests/pure/longRun.test.ts
 * already check checkpoint/restore bit-exactness IN-PROCESS (simulating
 * "a fresh process" by rebuilding geometry/stepper/drive from scratch
 * inside the same test run). That is a real check, but it cannot catch a
 * failure mode unique to an ACTUAL separate OS process: a different
 * V8 isolate, a different module-loading order, or anything else that
 * only reveals itself across a genuine process boundary. This script
 * performs that genuine separate-process test: each subcommand is one
 * `tsx` invocation, communicating with the others only through a JSON
 * file on disk.
 *
 * Usage:
 *   tsx scripts/k10-persistence-validation.ts uninterrupted --N 16 --seed 7 --ticks 100000 --out a.json [--checkpointInterval N]
 *   tsx scripts/k10-persistence-validation.ts checkpoint --N 16 --seed 7 --ticks 40000 --out snap.json
 *   tsx scripts/k10-persistence-validation.ts resume --snapshot snap.json --ticks 60000 [--out b.json] [--snapshotOut snap2.json]
 *   tsx scripts/k10-persistence-validation.ts compare a.json b.json
 *
 * `resume`'s --snapshotOut (in addition to, or instead of, --out) writes
 * a chainable PureCoreSnapshot rather than a human-readable summary, so
 * a long run can be built as a sequence of bounded-duration `resume`
 * invocations (each one a separate OS process, each one's snapshot
 * durably on disk before the next chunk starts) instead of one
 * monolithic multi-hour process.
 *
 * `uninterrupted` and the `checkpoint`-then-`resume` pair use the same
 * scenario() builder (params/drive depend only on N and seed, both of
 * which travel with the run), so their final states must be bit-
 * identical when the persistence layer is honest. `compare` checks this
 * directly rather than asking a human to eyeball two JSON files.
 */

import { writeFileSync, readFileSync } from 'node:fs';
import type { PureCoreParams, LinearSolverKind } from '../src/pure/params.ts';
import type { DriveSpec } from '../src/pure/drive/drive.ts';
import type { ComplexField } from '../src/pure/geometry/torus.ts';
import { runLongRun, type LongRunResult, type StopConditionReport } from '../src/pure/run/longRun.ts';
import { restoreSnapshotFromJson, serializeSnapshotToJson } from '../src/pure/persist/snapshot.ts';

const RESIDUAL_TOLERANCE = { n: 1e-6, h: 1e-6 };

function scenario(N: number, seed: number): { params: PureCoreParams; drive: DriveSpec } {
  const params: PureCoreParams = { R: 3, r: 1, N, dt: 0.01, alpha: 1, g: 1.5, nu0: 0.2, kappa: 1, rho: 0.3, seed };
  const drive: DriveSpec = { spatialProfile: new Float64Array(N * N).fill(0.05), omega: 2, phase: 0.1 };
  return { params, drive };
}

interface RunSummary {
  finalTick: number;
  stopped: boolean;
  stopCondition?: StopConditionReport;
  psiReal: number[];
  psiImag: number[];
  nu: number[];
  elapsedMs: number;
  tickPerSecond: number;
}

function summarize(result: LongRunResult, elapsedMs: number, ticksThisInvocation: number): RunSummary {
  return {
    finalTick: result.finalTick,
    stopped: result.stopped,
    stopCondition: result.stopCondition,
    psiReal: Array.from(result.finalPsi.real),
    psiImag: Array.from(result.finalPsi.imag),
    nu: Array.from(result.finalNu),
    elapsedMs,
    tickPerSecond: ticksThisInvocation / (elapsedMs / 1000),
  };
}

function parseArgs(args: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < args.length; i += 2) {
    out[args[i].replace(/^--/, '')] = args[i + 1];
  }
  return out;
}

function runUninterrupted(rest: string[]): void {
  const args = parseArgs(rest);
  const N = Number(args.N);
  const seed = Number(args.seed);
  const ticks = Number(args.ticks);
  const checkpointInterval = args.checkpointInterval ? Number(args.checkpointInterval) : ticks;
  const solverKind = (args.solver ?? 'spectral') as LinearSolverKind;
  const { params, drive } = scenario(N, seed);

  const start = Date.now();
  const result = runLongRun({ params, drive, totalTicks: ticks, checkpointInterval, residualTolerance: RESIDUAL_TOLERANCE, linearSolverKind: solverKind });
  const elapsedMs = Date.now() - start;

  writeFileSync(args.out, JSON.stringify(summarize(result, elapsedMs, ticks), null, 2));
  console.log(`uninterrupted: N=${N} seed=${seed} ticks=${ticks} finalTick=${result.finalTick} stopped=${result.stopped} elapsed=${elapsedMs}ms (${(ticks / (elapsedMs / 1000)).toFixed(1)} tick/s)`);
  console.log(`checkpoints taken at ticks: ${result.checkpoints.map((c) => c.tick).join(', ')}`);
  if (result.stopped) console.log(`stopCondition: ${JSON.stringify(result.stopCondition)}`);
}

function runCheckpoint(rest: string[]): void {
  const args = parseArgs(rest);
  const N = Number(args.N);
  const seed = Number(args.seed);
  const ticks = Number(args.ticks);
  const solverKind = (args.solver ?? 'spectral') as LinearSolverKind;
  const { params, drive } = scenario(N, seed);

  const start = Date.now();
  const result = runLongRun({ params, drive, totalTicks: ticks, checkpointInterval: ticks, residualTolerance: RESIDUAL_TOLERANCE, linearSolverKind: solverKind });
  const elapsedMs = Date.now() - start;

  if (result.stopped) {
    throw new Error(`checkpoint run stopped early, refusing to write a snapshot of a run that did not complete as planned: ${JSON.stringify(result.stopCondition)}`);
  }
  const snapshot = result.checkpoints[result.checkpoints.length - 1].snapshot;
  writeFileSync(args.out, serializeSnapshotToJson(snapshot));
  console.log(`checkpoint: N=${N} seed=${seed} ticks=${ticks} -> ${args.out} elapsed=${elapsedMs}ms (${(ticks / (elapsedMs / 1000)).toFixed(1)} tick/s)`);
}

function runResume(rest: string[]): void {
  const args = parseArgs(rest);
  const ticks = Number(args.ticks);
  const solverKind = (args.solver ?? 'spectral') as LinearSolverKind;
  const restored = restoreSnapshotFromJson(readFileSync(args.snapshot, 'utf-8'));
  const { drive } = scenario(restored.params.N, restored.params.seed);

  const start = Date.now();
  const result = runLongRun({
    params: restored.params,
    drive,
    totalTicks: ticks,
    checkpointInterval: ticks,
    residualTolerance: RESIDUAL_TOLERANCE,
    linearSolverKind: solverKind,
    resumeFrom: { tick: restored.tick, psi: restored.psi, nu: restored.nu },
  });
  const elapsedMs = Date.now() - start;

  if (args.out) {
    writeFileSync(args.out, JSON.stringify(summarize(result, elapsedMs, ticks), null, 2));
  }
  if (args.snapshotOut) {
    if (result.stopped) {
      throw new Error(`resume stopped early, refusing to write a chained snapshot of a run that did not complete as planned: ${JSON.stringify(result.stopCondition)}`);
    }
    const snapshot = result.checkpoints[result.checkpoints.length - 1].snapshot;
    writeFileSync(args.snapshotOut, serializeSnapshotToJson(snapshot));
  }
  console.log(`resume: from tick=${restored.tick} +${ticks} -> finalTick=${result.finalTick} stopped=${result.stopped} elapsed=${elapsedMs}ms (${(ticks / (elapsedMs / 1000)).toFixed(1)} tick/s)`);
  if (result.stopped) console.log(`stopCondition: ${JSON.stringify(result.stopCondition)}`);
}

/**
 * Runs many chunks of runLongRun back-to-back WITHOUT exiting the
 * process between them (resumeFrom is threaded through in-memory, not
 * via a checkpoint file) so process.memoryUsage() sampled between
 * chunks reflects genuine intra-process memory behavior over a long
 * cumulative tick count - the question K9's deferred F7 (allocation-
 * zero) left open: does per-tick allocation in the spectral step cause
 * unbounded growth in one long-lived process, or does the GC keep up?
 * This is a DIFFERENT question from the disk-checkpointed chunked run
 * (whose chunks are separate processes, each exiting and releasing all
 * memory - which cannot see this).
 */
function runMemProfile(rest: string[]): void {
  const args = parseArgs(rest);
  const N = Number(args.N);
  const seed = Number(args.seed);
  const chunkTicks = Number(args.chunkTicks ?? '5000');
  const chunks = Number(args.chunks ?? '20');
  const solverKind = (args.solver ?? 'spectral') as LinearSolverKind;
  const { params, drive } = scenario(N, seed);

  let resumeFrom: { tick: number; psi: ComplexField; nu: Float64Array } | undefined;
  const samples: { afterTick: number; rssMb: number; heapUsedMb: number; tickPerSecondThisChunk: number }[] = [];

  for (let c = 0; c < chunks; c++) {
    const start = Date.now();
    const result = runLongRun({ params, drive, totalTicks: chunkTicks, checkpointInterval: chunkTicks, residualTolerance: RESIDUAL_TOLERANCE, linearSolverKind: solverKind, resumeFrom });
    const elapsedMsThisChunk = Date.now() - start;
    if (result.stopped) {
      console.log(`STOPPED at chunk ${c} (after tick ${result.finalTick}): ${JSON.stringify(result.stopCondition)}`);
      break;
    }
    resumeFrom = { tick: result.finalTick, psi: result.finalPsi, nu: result.finalNu };
    const mem = process.memoryUsage();
    const sample = { afterTick: result.finalTick, rssMb: mem.rss / 1048576, heapUsedMb: mem.heapUsed / 1048576, tickPerSecondThisChunk: chunkTicks / (elapsedMsThisChunk / 1000) };
    samples.push(sample);
    console.log(`tick=${sample.afterTick} rss=${sample.rssMb.toFixed(1)}MB heapUsed=${sample.heapUsedMb.toFixed(1)}MB chunk_tick/s=${sample.tickPerSecondThisChunk.toFixed(1)}`);
  }

  if (args.out) writeFileSync(args.out, JSON.stringify(samples, null, 2));
}

function runCompare(rest: string[]): void {
  const [fileA, fileB] = rest;
  const a = JSON.parse(readFileSync(fileA, 'utf-8')) as RunSummary;
  const b = JSON.parse(readFileSync(fileB, 'utf-8')) as RunSummary;

  const tickMatch = a.finalTick === b.finalTick;
  const realMatch = JSON.stringify(a.psiReal) === JSON.stringify(b.psiReal);
  const imagMatch = JSON.stringify(a.psiImag) === JSON.stringify(b.psiImag);
  const nuMatch = JSON.stringify(a.nu) === JSON.stringify(b.nu);
  const same = tickMatch && realMatch && imagMatch && nuMatch;

  console.log(same ? 'MATCH: bit-identical' : 'MISMATCH');
  console.log(`finalTick: ${a.finalTick} vs ${b.finalTick} (${tickMatch ? 'match' : 'DIFFERS'})`);
  console.log(`psi.real: ${realMatch ? 'match' : 'DIFFERS'}, psi.imag: ${imagMatch ? 'match' : 'DIFFERS'}, nu: ${nuMatch ? 'match' : 'DIFFERS'}`);
  if (!same) {
    process.exitCode = 1;
  }
}

function main(): void {
  const [command, ...rest] = process.argv.slice(2);
  switch (command) {
    case 'uninterrupted': return runUninterrupted(rest);
    case 'checkpoint': return runCheckpoint(rest);
    case 'resume': return runResume(rest);
    case 'memprofile': return runMemProfile(rest);
    case 'compare': return runCompare(rest);
    default:
      throw new Error(`unknown command '${command}' - expected uninterrupted | checkpoint | resume | compare`);
  }
}

main();
