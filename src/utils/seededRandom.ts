/**
 * Shared deterministic PRNG for AETERNA.
 *
 * This is the single seeded random source for the codebase. It was promoted
 * from a duplicated implementation that existed independently in
 * src/core/complexField.ts and src/world/phaseCarryingDrive.ts (a simpler
 * LCG). The xorshift-style generator here matches complexField.ts's prior
 * behavior exactly, so no existing seeded-field test output changes.
 *
 * Not for cryptographic use. For the runtime's hardware/crypto-backed noise
 * source, see src/core/hardwareRandom.ts.
 */

/**
 * Create a seeded pseudo-random generator returning floats in [0, 1).
 * Same seed always produces the same sequence (the determinism contract
 * K1 depends on for reproducible headless scenario runs).
 */
export function createSeededRandom(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Same as createSeededRandom, but returns signed floats in [-1, 1). */
export function createSeededSignedRandom(seed: number): () => number {
  const random = createSeededRandom(seed);
  return () => random() * 2 - 1;
}
