/**
 * k15-runtime-soak-test.ts
 *
 * Not physics - a real-time (wall-clock, not tick-count) soak test for
 * K15's completion record. Runs a RuntimeProcess continuously for a
 * fixed WALL-CLOCK duration (not the literal 24h the plan asks for -
 * see the completion record's own honest disclosure of this gap) with
 * the observation API live and a real WebSocket client attached and
 * receiving broadcasts throughout, checkpointing periodically, and
 * sampling RSS memory to check for the kind of unbounded growth K10's
 * own long-run memory profile already flagged as a real (if modest)
 * effect at much larger N.
 *
 * Usage: tsx scripts/k15-runtime-soak-test.ts --durationMs <ms> --out <checkpoint.json>
 */

import { writeFileSync } from 'node:fs';
import WebSocket from 'ws';
import { RuntimeProcess, type RuntimeProcessConfig } from '../src/pure/runtime/runtimeProcess.ts';
import { createTransducerRegistry } from '../src/pure/runtime/transducer.ts';
import { uniformAmplitudeTransducer } from '../src/pure/runtime/builtinTransducers.ts';
import { startObservationApi } from '../src/pure/runtime/observationApi.ts';
import { serializeWorldSnapshotToJson } from '../src/pure/persist/worldSnapshot.ts';
import type { PureCoreParams } from '../src/pure/params.ts';
import type { DriveSpec } from '../src/pure/drive/drive.ts';

const N = 32;
const CHECKPOINT_TICKS = 500;
const SIGNAL_EVERY_TICKS = 137; // an arbitrary, non-round period so it doesn't line up with the checkpoint period

function buildConfig(): RuntimeProcessConfig {
  const psiParams: PureCoreParams = { R: 3, r: 1, N, dt: 0.01, alpha: 1, g: 1.5, nu0: 0.2, kappa: 1, rho: 0.3, seed: 100 };
  const chiParams: PureCoreParams = { ...psiParams, seed: 101 };
  const baseDrive: DriveSpec = { spatialProfile: new Float64Array(N * N).fill(0.2), omega: 2, phase: 0.2 };
  return {
    psiParams,
    chiParams,
    k: 4,
    lambda: 0.5,
    baseDrive,
    checkpointInterval: CHECKPOINT_TICKS,
    residualTolerance: { n: 1e-6, h: 1e-6 },
    transducerRegistry: createTransducerRegistry([uniformAmplitudeTransducer]),
  };
}

function arg(name: string, fallback?: string): string {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx < 0 || !process.argv[idx + 1]) {
    if (fallback !== undefined) return fallback;
    throw new Error(`missing required --${name} argument`);
  }
  return process.argv[idx + 1];
}

async function main(): Promise<void> {
  const durationMs = Number(arg('durationMs'));
  const outPath = arg('out');

  const runtime = new RuntimeProcess(buildConfig());
  const apiHandle = await startObservationApi({ port: 0, getLatestSnapshot: () => runtime.getLatestObservationSnapshot(), broadcastIntervalMs: 50 });
  const client = new WebSocket(`ws://localhost:${apiHandle.port}`);
  let messagesReceived = 0;
  client.on('message', () => {
    messagesReceived++;
  });
  await new Promise<void>((resolve, reject) => {
    client.once('open', () => resolve());
    client.once('error', reject);
  });

  const startedAt = Date.now();
  const rssSamples: number[] = [process.memoryUsage().rss];
  let checkpointsWritten = 0;
  let lastCheckpointTick = 0;

  while (Date.now() - startedAt < durationMs) {
    const result = await runtime.runTicks(50);
    if (result.stopped) {
      console.log(`STOPPED at tick ${runtime.getCurrentTick()}: ${JSON.stringify(result.stopCondition)}`);
      break;
    }
    if (runtime.getCurrentTick() - lastCheckpointTick >= CHECKPOINT_TICKS) {
      writeFileSync(outPath, serializeWorldSnapshotToJson(runtime.getLatestWorldSnapshot()));
      checkpointsWritten++;
      lastCheckpointTick = runtime.getCurrentTick();
      rssSamples.push(process.memoryUsage().rss);
    }
    if (runtime.getCurrentTick() % SIGNAL_EVERY_TICKS < 50) {
      runtime.injectSignal(uniformAmplitudeTransducer.id, 0.01);
    }
  }

  const elapsedMs = Date.now() - startedAt;
  const finalTick = runtime.getCurrentTick();
  client.close();
  await apiHandle.close();
  writeFileSync(outPath, serializeWorldSnapshotToJson(runtime.getLatestWorldSnapshot()));

  const rssStartMb = rssSamples[0] / (1024 * 1024);
  const rssEndMb = rssSamples[rssSamples.length - 1] / (1024 * 1024);
  console.log(`elapsedMs=${elapsedMs} finalTick=${finalTick} tick/s=${(finalTick / (elapsedMs / 1000)).toFixed(1)}`);
  console.log(`checkpointsWritten=${checkpointsWritten} inputLogEntries=${runtime.getInputLog().length} apiMessagesReceived=${messagesReceived}`);
  console.log(`RSS: start=${rssStartMb.toFixed(1)}MB end=${rssEndMb.toFixed(1)}MB samples=${rssSamples.map((r) => (r / (1024 * 1024)).toFixed(1)).join(',')}`);
  console.log(`stopped=${runtime.getStopCondition() !== undefined}`);
}

main();
