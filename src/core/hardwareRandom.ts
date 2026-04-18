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
