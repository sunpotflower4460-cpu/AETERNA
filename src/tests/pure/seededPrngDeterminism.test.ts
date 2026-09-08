import { describe, expect, it } from 'vitest';
import { createSeededRandom } from '../../pure/random/seededPrng.ts';

describe('pure core seeded PRNG determinism', () => {
  it('produces an identical sequence for the same seed', () => {
    const a = createSeededRandom(4242);
    const b = createSeededRandom(4242);
    const sequenceA = Array.from({ length: 20 }, () => a());
    const sequenceB = Array.from({ length: 20 }, () => b());
    expect(sequenceB).toEqual(sequenceA);
  });

  it('produces a different sequence for a different seed', () => {
    const a = createSeededRandom(1);
    const b = createSeededRandom(2);
    const sequenceA = Array.from({ length: 20 }, () => a());
    const sequenceB = Array.from({ length: 20 }, () => b());
    expect(sequenceB).not.toEqual(sequenceA);
  });

  it('stays within [0, 1) over many draws', () => {
    const random = createSeededRandom(7);
    for (let i = 0; i < 10000; i++) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
      expect(Number.isFinite(value)).toBe(true);
    }
  });
});
