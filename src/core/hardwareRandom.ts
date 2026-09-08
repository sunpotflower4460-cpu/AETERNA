const RANDOM_BUFFER_SIZE = 128;
const randomBuffer = new Uint32Array(RANDOM_BUFFER_SIZE);
let randomBufferIndex = RANDOM_BUFFER_SIZE;

export function hasHardwareRandomSource() {
  return typeof globalThis !== 'undefined' && !!globalThis.crypto?.getRandomValues;
}

function refillRandomBuffer() {
  if (!hasHardwareRandomSource()) return false;
  globalThis.crypto.getRandomValues(randomBuffer);
  randomBufferIndex = 0;
  return true;
}

export function getHardwareRandomFloat() {
  if (randomBufferIndex >= RANDOM_BUFFER_SIZE && !refillRandomBuffer()) return Math.random();
  return randomBuffer[randomBufferIndex++] / 0x100000000;
}

export function getHardwareRandomSigned() {
  return getHardwareRandomFloat() * 2 - 1;
}

/**
 * K1 opt-in determinism (docs/vessel/vessel-roadmap.md).
 *
 * When a network has a seeded PRNG attached (network.seededRandom, set by
 * passing { seed } to the AeternaNetwork constructor), these resolvers use
 * it instead of the crypto-backed source above, making a run fully
 * reproducible for the same seed and input sequence.
 *
 * When no seed is configured (the default - e.g. the interactive app in
 * main.ts), behavior is byte-for-byte unchanged: these fall straight
 * through to the existing crypto/fallback path, so this is purely additive.
 */
export function resolveRandomFloat(network: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (network?.seededRandom) return network.seededRandom();
  return getHardwareRandomFloat();
}

export function resolveRandomSigned(network: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (network?.seededRandom) return network.seededRandom() * 2 - 1;
  return getHardwareRandomSigned();
}

export function resolveRandomNoiseSourceLabel(network: any): 'seeded' | 'crypto' | 'fallback' { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (network?.seededRandom) return 'seeded';
  return hasHardwareRandomSource() ? 'crypto' : 'fallback';
}
