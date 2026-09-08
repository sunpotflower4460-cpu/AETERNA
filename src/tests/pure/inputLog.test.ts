import { describe, expect, it } from 'vitest';
import {
  serializeInputLogEntry,
  parseInputLogLine,
  serializeInputLogJsonl,
  parseInputLogJsonl,
  resolveChiDriveForTick,
  type InputLogEntry,
} from '../../pure/runtime/inputLog.ts';
import { createTransducerRegistry } from '../../pure/runtime/transducer.ts';
import { uniformAmplitudeTransducer, singleCellPulseTransducer } from '../../pure/runtime/builtinTransducers.ts';
import type { DriveSpec } from '../../pure/drive/drive.ts';

describe('pure core K15 inputLog: single-entry round trip', () => {
  it('serializeInputLogEntry -> parseInputLogLine reproduces the entry exactly', () => {
    const entry: InputLogEntry = { tick: 42, transducerId: 'K15-M1', signal: 0.05 };
    const parsed = parseInputLogLine(serializeInputLogEntry(entry));
    expect(parsed).toEqual(entry);
  });

  it('round-trips a structured signal object', () => {
    const entry: InputLogEntry = { tick: 7, transducerId: 'K15-M2', signal: { cellIndex: 3, amplitude: 1.5 } };
    const parsed = parseInputLogLine(serializeInputLogEntry(entry));
    expect(parsed).toEqual(entry);
  });

  it('rejects a negative or non-integer tick', () => {
    expect(() => parseInputLogLine(JSON.stringify({ tick: -1, transducerId: 'K15-M1', signal: 1 }))).toThrow();
    expect(() => parseInputLogLine(JSON.stringify({ tick: 1.5, transducerId: 'K15-M1', signal: 1 }))).toThrow();
  });

  it('rejects a missing or empty transducerId', () => {
    expect(() => parseInputLogLine(JSON.stringify({ tick: 0, signal: 1 }))).toThrow();
    expect(() => parseInputLogLine(JSON.stringify({ tick: 0, transducerId: '', signal: 1 }))).toThrow();
  });
});

describe('pure core K15 inputLog: JSONL round trip', () => {
  it('serializes multiple entries as one-JSON-object-per-line and parses them back in order', () => {
    const entries: InputLogEntry[] = [
      { tick: 0, transducerId: 'K15-M1', signal: 0.1 },
      { tick: 5, transducerId: 'K15-M2', signal: { cellIndex: 1, amplitude: 2 } },
      { tick: 5, transducerId: 'K15-M1', signal: 0.2 },
    ];
    const jsonl = serializeInputLogJsonl(entries);
    expect(jsonl.split('\n').filter((l) => l.length > 0)).toHaveLength(3);
    expect(parseInputLogJsonl(jsonl)).toEqual(entries);
  });

  it('an empty entry list serializes to an empty string and parses back to an empty array', () => {
    expect(serializeInputLogJsonl([])).toBe('');
    expect(parseInputLogJsonl('')).toEqual([]);
  });

  it('tolerates trailing/blank lines when parsing', () => {
    const entries: InputLogEntry[] = [{ tick: 1, transducerId: 'K15-M1', signal: 1 }];
    const jsonl = serializeInputLogJsonl(entries) + '\n\n';
    expect(parseInputLogJsonl(jsonl)).toEqual(entries);
  });
});

describe('pure core K15 inputLog: resolveChiDriveForTick', () => {
  const registry = createTransducerRegistry([uniformAmplitudeTransducer, singleCellPulseTransducer]);
  const baseDrive: DriveSpec = { spatialProfile: new Float64Array(4).fill(0.1), omega: 2, phase: 0 };

  it('returns baseDrive unchanged (same values) when no entry matches the tick', () => {
    const entries: InputLogEntry[] = [{ tick: 5, transducerId: 'K15-M1', signal: 0.5 }];
    const result = resolveChiDriveForTick(baseDrive, registry, entries, 3, 0.03);
    expect(result.spatialProfile).toEqual(baseDrive.spatialProfile);
  });

  it('applies exactly the entries matching the given tick, ignoring others', () => {
    const entries: InputLogEntry[] = [
      { tick: 5, transducerId: 'K15-M1', signal: 0.5 },
      { tick: 6, transducerId: 'K15-M1', signal: 100 },
    ];
    const result = resolveChiDriveForTick(baseDrive, registry, entries, 5, 0.05);
    expect(Array.from(result.spatialProfile)).toEqual([0.6, 0.6, 0.6, 0.6]);
  });

  it('folds multiple entries for the same tick in log order', () => {
    const entries: InputLogEntry[] = [
      { tick: 5, transducerId: 'K15-M1', signal: 0.5 },
      { tick: 5, transducerId: 'K15-M2', signal: { cellIndex: 0, amplitude: 10 } },
    ];
    const result = resolveChiDriveForTick(baseDrive, registry, entries, 5, 0.05);
    expect(Array.from(result.spatialProfile)).toEqual([10.6, 0.6, 0.6, 0.6]);
  });

  it('throws for a logged transducerId that is not in the registry', () => {
    const entries: InputLogEntry[] = [{ tick: 5, transducerId: 'K15-M999', signal: 1 }];
    expect(() => resolveChiDriveForTick(baseDrive, registry, entries, 5, 0.05)).toThrow(/unknown transducerId/);
  });
});
