import { describe, expect, it } from 'vitest';
import { EMERGENCE_CEILING_MAP } from '../../pure/run/emergenceCeilingMap.ts';

describe('pure core K16 emergenceCeilingMap: shape and coverage', () => {
  it('has exactly 17 entries (V1\'s 10 K2-K7 entries + 7 new K12-K14 entries)', () => {
    expect(EMERGENCE_CEILING_MAP).toHaveLength(17);
  });

  it('every entry has a non-empty string for the 4 narrative fields', () => {
    for (const entry of EMERGENCE_CEILING_MAP) {
      expect(typeof entry.phase).toBe('string');
      expect(entry.phase.length).toBeGreaterThan(0);
      expect(typeof entry.white).toBe('string');
      expect(entry.white.length).toBeGreaterThan(0);
      expect(typeof entry.reachedLevel).toBe('string');
      expect(entry.reachedLevel.length).toBeGreaterThan(0);
      expect(typeof entry.stopReason).toBe('string');
      expect(entry.stopReason.length).toBeGreaterThan(0);
      expect(typeof entry.nextMissingCause).toBe('string');
      expect(entry.nextMissingCause.length).toBeGreaterThan(0);
    }
  });

  it('phase names are unique', () => {
    const phases = EMERGENCE_CEILING_MAP.map((e) => e.phase);
    expect(new Set(phases).size).toBe(phases.length);
  });

  it('systemSizes/ticks/worldPresence are null/n-a together, never independently (no half-null entry)', () => {
    for (const entry of EMERGENCE_CEILING_MAP) {
      const allNull = entry.systemSizes === null && entry.ticks === null && entry.worldPresence === 'n/a';
      const noneNull = entry.systemSizes !== null && entry.ticks !== null && entry.worldPresence !== 'n/a';
      expect(allNull || noneNull, `${entry.phase}: systemSizes/ticks/worldPresence must be null/n-a together`).toBe(true);
    }
  });

  it('a scored-dynamical-run entry (not one of the no-run 判定対象外 phases) has non-null systemSizes/ticks/worldPresence', () => {
    const noScoredRunPhases = new Set(['K2 PR2', 'K2 PR3', 'K2 PR4', 'K2 PR7 / K4', 'K6']);
    for (const entry of EMERGENCE_CEILING_MAP) {
      if (noScoredRunPhases.has(entry.phase)) {
        expect(entry.systemSizes).toBeNull();
      } else {
        expect(entry.systemSizes, `${entry.phase} should report the run it describes`).not.toBeNull();
      }
    }
  });

  it('systemSizes, when present, is a non-empty array of positive integers', () => {
    for (const entry of EMERGENCE_CEILING_MAP) {
      if (entry.systemSizes === null) continue;
      expect(entry.systemSizes.length).toBeGreaterThan(0);
      for (const n of entry.systemSizes) {
        expect(Number.isInteger(n)).toBe(true);
        expect(n).toBeGreaterThan(0);
      }
    }
  });

  it('includes every K12/K13/K14 phase missing from V1\'s frozen EMERGENCE_CEILING_MAP', () => {
    const phases = new Set(EMERGENCE_CEILING_MAP.map((e) => e.phase));
    for (const expected of ['K12腕A', 'K12腕B', 'K13', 'K14-PR3', 'K14-PR4', 'K14-PR5 (L6)', 'K14-PR5 (K6対照群)']) {
      expect(phases.has(expected)).toBe(true);
    }
  });

  it('still includes every phase V1 already had (K2-K7 era)', () => {
    const phases = new Set(EMERGENCE_CEILING_MAP.map((e) => e.phase));
    for (const expected of ['K2 PR2', 'K2 PR3', 'K2 PR4', 'K2 PR5', 'K2 PR6 / K3', 'K2 PR7 / K4', 'K5', 'K6', 'K7追加', 'K7追加（探索的）']) {
      expect(phases.has(expected)).toBe(true);
    }
  });

  it('every worldPresence value is one of the declared union members', () => {
    const allowed = new Set(['none', 'ring-chi', 'world-chi', 'foreign-chi', 'delay-line', 'n/a']);
    for (const entry of EMERGENCE_CEILING_MAP) {
      expect(allowed.has(entry.worldPresence)).toBe(true);
    }
  });
});
