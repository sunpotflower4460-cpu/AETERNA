import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { applyTransducerToChiDrive, createTransducerRegistry } from '../../pure/runtime/transducer.ts';
import { uniformAmplitudeTransducer, singleCellPulseTransducer } from '../../pure/runtime/builtinTransducers.ts';
import type { DriveSpec } from '../../pure/drive/drive.ts';

function baseDrive(cellCount: number): DriveSpec {
  return { spatialProfile: new Float64Array(cellCount).fill(0.1), omega: 2, phase: 0.3 };
}

describe('pure core K15 transducer: applyTransducerToChiDrive composes onto chi\'s existing drive', () => {
  it('adds the uniform amplitude transducer\'s contribution to every cell', () => {
    const drive = baseDrive(4);
    const result = applyTransducerToChiDrive(drive, uniformAmplitudeTransducer, 0.05, 0);
    for (const value of result.spatialProfile) {
      expect(value).toBeCloseTo(0.15, 12);
    }
    expect(result.omega).toBe(drive.omega);
    expect(result.phase).toBe(drive.phase);
  });

  it('a zero-amplitude signal reproduces baseDrive\'s spatialProfile bit-for-bit', () => {
    const drive = baseDrive(4);
    const result = applyTransducerToChiDrive(drive, uniformAmplitudeTransducer, 0, 0);
    expect(result.spatialProfile).toEqual(drive.spatialProfile);
  });

  it('the single-cell pulse transducer only changes the named cell', () => {
    const drive = baseDrive(4);
    const result = applyTransducerToChiDrive(drive, singleCellPulseTransducer, { cellIndex: 2, amplitude: 1 }, 0);
    expect(Array.from(result.spatialProfile)).toEqual([0.1, 0.1, 1.1, 0.1]);
  });

  it('throws when the single-cell pulse transducer receives an out-of-range cellIndex', () => {
    const drive = baseDrive(4);
    expect(() => applyTransducerToChiDrive(drive, singleCellPulseTransducer, { cellIndex: 4, amplitude: 1 }, 0)).toThrow(/out of range/);
    expect(() => applyTransducerToChiDrive(drive, singleCellPulseTransducer, { cellIndex: -1, amplitude: 1 }, 0)).toThrow(/out of range/);
  });

  it('does not mutate baseDrive\'s own spatialProfile array', () => {
    const drive = baseDrive(4);
    const original = Float64Array.from(drive.spatialProfile);
    applyTransducerToChiDrive(drive, uniformAmplitudeTransducer, 0.05, 0);
    expect(drive.spatialProfile).toEqual(original);
  });
});

describe('pure core K15 transducer: registry', () => {
  it('looks transducers up by id', () => {
    const registry = createTransducerRegistry([uniformAmplitudeTransducer, singleCellPulseTransducer]);
    expect(registry.get('K15-M1')).toBe(uniformAmplitudeTransducer);
    expect(registry.get('K15-M2')).toBe(singleCellPulseTransducer);
    expect(registry.get('K15-M999')).toBeUndefined();
  });

  it('throws on a duplicate id', () => {
    const duplicate = { ...uniformAmplitudeTransducer };
    expect(() => createTransducerRegistry([uniformAmplitudeTransducer, duplicate])).toThrow(/duplicate/);
  });
});

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

describe('pure core K15 transducer: structural psi-blindness (docs/vessel/K15-runtime-design.md Choice 4)', () => {
  it('transducer.ts never references psi outside of comments', () => {
    const sourcePath = fileURLToPath(new URL('../../pure/runtime/transducer.ts', import.meta.url));
    const source = stripComments(readFileSync(sourcePath, 'utf-8'));
    expect(source).not.toMatch(/\bpsi\b/);
  });

  it('builtinTransducers.ts never references psi outside of comments', () => {
    const sourcePath = fileURLToPath(new URL('../../pure/runtime/builtinTransducers.ts', import.meta.url));
    const source = stripComments(readFileSync(sourcePath, 'utf-8'));
    expect(source).not.toMatch(/\bpsi\b/);
  });
});
