/**
 * PUT-IN: a sequence of (tick, transducerId, signal) events - every
 *   signal ever actually applied to chi's drive during a runtime run
 * EMERGED: a JSONL-serializable log, and a pure resolver that
 *   reconstructs the SAME effective chi drive for a given tick from the
 *   log alone (transducer registry + logged entries), without needing
 *   the original "why this signal was sent" context
 * claim-tier: C2 (see src/tests/pure/inputLogReplay.test.ts: a run
 *   driven live and a "replay" run driven only by re-parsing the
 *   serialized log - through a code path that never sees the live
 *   signal-generation logic - produce a bit-identical final psi/chi/nu)
 * floors (誠実な床): resolveChiDriveForTick applies entries for a tick
 *   in the order they appear in the log (log order, not re-sorted) -
 *   if a future caller ever logs more than one entry per tick, the
 *   composition is order-dependent (each applyTransducerToChiDrive call
 *   adds onto the previous result). This module does not itself decide
 *   what "the same tick" means across process restarts beyond the
 *   absolute tick number already used throughout src/pure/persist/
 *   worldSnapshot.ts and src/pure/run/worldLongRun.ts.
 */

import type { DriveSpec } from '../drive/drive.ts';
import { applyTransducerToChiDrive, type TransducerRegistry } from './transducer.ts';

export interface InputLogEntry {
  tick: number;
  transducerId: string;
  signal: unknown;
}

export function serializeInputLogEntry(entry: InputLogEntry): string {
  return JSON.stringify(entry);
}

export function parseInputLogLine(line: string): InputLogEntry {
  const parsed = JSON.parse(line) as Partial<InputLogEntry>;
  if (!Number.isInteger(parsed.tick) || (parsed.tick as number) < 0) {
    throw new Error(`parseInputLogLine: tick must be a non-negative integer, got ${parsed.tick}`);
  }
  if (typeof parsed.transducerId !== 'string' || parsed.transducerId.length === 0) {
    throw new Error(`parseInputLogLine: transducerId must be a non-empty string, got ${parsed.transducerId}`);
  }
  return { tick: parsed.tick as number, transducerId: parsed.transducerId, signal: parsed.signal };
}

/** JSONL: one JSON object per line, trailing newline if non-empty. */
export function serializeInputLogJsonl(entries: readonly InputLogEntry[]): string {
  if (entries.length === 0) return '';
  return entries.map(serializeInputLogEntry).join('\n') + '\n';
}

export function parseInputLogJsonl(text: string): InputLogEntry[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map(parseInputLogLine);
}

/**
 * Reconstructs chi's effective drive for one tick from the log alone:
 * starts from baseDrive (the world's steady carrier) and folds in every
 * logged entry for exactly this tick, in log order, via the named
 * transducer looked up in `registry`. Ticks with no logged entry return
 * baseDrive unchanged (same object, not a copy - callers must not mutate it).
 */
export function resolveChiDriveForTick(baseDrive: DriveSpec, registry: TransducerRegistry, entries: readonly InputLogEntry[], tick: number, t: number): DriveSpec {
  let drive = baseDrive;
  for (const entry of entries) {
    if (entry.tick !== tick) continue;
    const transducer = registry.get(entry.transducerId);
    if (!transducer) {
      throw new Error(`resolveChiDriveForTick: unknown transducerId '${entry.transducerId}' at tick ${tick}`);
    }
    drive = applyTransducerToChiDrive(drive, transducer, entry.signal, t);
  }
  return drive;
}
