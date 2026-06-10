import { describe, expect, it } from 'vitest';
import { createPureFieldState } from '../../pure/field/state.ts';
import { createPurePhysicsParams } from '../../pure/params.ts';
import { createSeededPrng } from '../../pure/random/seededPrng.ts';

function sequence(seed: number, length: number): number[] {
  const random = createSeededPrng(seed);
  return Array.from({ length }, () => random());
}

describe('PURE seeded PRNG', () => {
  it('returns the same sequence for the same seed', () => {
    expect(sequence(1234, 8)).toEqual(sequence(1234, 8));
  });

  it('usually returns a different sequence for a different seed', () => {
    expect(sequence(1234, 8)).not.toEqual(sequence(5678, 8));
  });

  it('creates identical field states for the same seed', () => {
    const params = createPurePhysicsParams({ gridSize: 8, seed: 42 });
    const first = createPureFieldState(params);
    const second = createPureFieldState(params);

    expect(Array.from(first.psiRe)).toEqual(Array.from(second.psiRe));
    expect(Array.from(first.psiIm)).toEqual(Array.from(second.psiIm));
    expect(Array.from(first.nu)).toEqual(Array.from(second.nu));
  });
});
