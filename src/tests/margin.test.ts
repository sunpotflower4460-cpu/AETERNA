import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-expect-error — AeternaNetwork is plain JS without type declarations
import { AeternaNetwork } from '../core/AeternaNetwork.js';
import { updateDormantNodes } from '../core/dormantNodes.ts';
import { state } from '../organism/state.js';

function stubDisk() {
  return {
    omega_t: 8.33,
    omega_p: 5.15,
    ratioRr: 1.618,
    phaseRatio: 1.0,
    torusFormed: false,
    isErgodic: false,
    schumannLock: false,
    getConsciousnessPrerequisites: () => ({ A: false, B: false }),
    _irrationalScore: () => 0,
  };
}

function setCryptoStub(fillValue: number) {
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: {
      getRandomValues: vi.fn((buffer: Uint32Array) => {
        buffer.fill(fillValue);
        return buffer;
      }),
    },
  });
}

describe('Phase D margin paths', () => {
  const originalCrypto = globalThis.crypto;
  const originalMathRandom = Math.random;

  afterEach(() => {
    Math.random = originalMathRandom;
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: originalCrypto,
    });
  });

  it('initializes a bounded dormant node subset without removing connectivity', () => {
    const net = new AeternaNetwork(20);
    const dormantCount = net.dormantTraitMask.reduce((sum: number, value: number) => sum + value, 0);

    expect(dormantCount).toBeGreaterThan(0);
    expect(dormantCount).toBe(net.totalDormantNodeCount);
    expect(net.isDormantNode.reduce((sum: number, value: number) => sum + value, 0)).toBe(dormantCount);
    for (let i = 0; i < net.numNodes; i++) {
      if (net.dormantTraitMask[i] !== 1) continue;
      expect(net.w_up[i]).toBeGreaterThan(0);
      expect(net.w_down[i]).toBeGreaterThan(0);
      expect(net.w_left[i]).toBeGreaterThan(0);
      expect(net.w_right[i]).toBeGreaterThan(0);
    }
  });

  it('uses the crypto-backed noise path without calling Math.random', () => {
    state.disk = stubDisk() as typeof state.disk;
    const net = new AeternaNetwork(8);
    setCryptoStub(0);
    Math.random = () => {
      throw new Error('Math.random should not be used on the main noise path');
    };

    net.triggerNoise(5, 1);

    expect(net.currentBuffer[0]).toBeGreaterThan(0);
    expect(net.hardwareRandomNoiseSource).toBe('crypto');
    expect(net.lastNoiseMagnitude).toBeGreaterThan(0);
  });

  it('wakes and re-sleeps a dormant node under pressure and release', () => {
    state.disk = stubDisk() as typeof state.disk;
    const net = new AeternaNetwork(8);
    setCryptoStub(0);

    const dormantIndex = net.dormantTraitMask.findIndex((value: number) => value === 1);
    expect(dormantIndex).toBeGreaterThanOrEqual(0);

    const i = Math.floor(dormantIndex / net.segments);
    const j = dormantIndex % net.segments;
    const neighbors = [
      ((i - 1 + net.segments) % net.segments) * net.segments + j,
      ((i + 1) % net.segments) * net.segments + j,
      i * net.segments + ((j - 1 + net.segments) % net.segments),
      i * net.segments + ((j + 1) % net.segments),
    ];

    net.dormantWakeCooldown[dormantIndex] = 0;
    net.dormantWakePressure[dormantIndex] = 0.54;
    net.currentBuffer[dormantIndex] = 1.2;
    net.localPrediction[dormantIndex] = 0;
    net.activityResidue[dormantIndex] = 0.8;
    net.spikeTrace[dormantIndex] = 0.9;
    for (const neighbor of neighbors) {
      net.currentBuffer[neighbor] = 1.1;
      net.localPrediction[neighbor] = 0;
    }

    updateDormantNodes(net);

    expect(net.isDormantNode[dormantIndex]).toBe(0);
    expect(net.totalDormantWakeCount).toBe(1);
    expect(net.recentDormantWakeEvents[0]?.node).toBe(dormantIndex);

    net.currentBuffer.fill(0);
    net.localPrediction.fill(0);
    net.activityResidue.fill(0);
    net.spikeTrace.fill(0);
    net.dormantWakePressure[dormantIndex] = 0.04;
    net.dormantWakeCooldown[dormantIndex] = 0;

    updateDormantNodes(net);

    expect(net.isDormantNode[dormantIndex]).toBe(1);
  });

  it('surfaces dormant margin debug fields through updateDynamics', () => {
    state.disk = stubDisk() as typeof state.disk;
    if (typeof globalThis.window === 'undefined') {
      (globalThis as Record<string, unknown>).window = { innerWidth: 800, innerHeight: 600 };
    }
    const net = new AeternaNetwork(8);
    const dyn = net.updateDynamics(-1);

    expect(typeof dyn.dormantNodeCount).toBe('number');
    expect(typeof dyn.dormantWakeCount).toBe('number');
    expect(Array.isArray(dyn.recentDormantWakeEvents)).toBe(true);
    expect(typeof dyn.hardwareRandomNoiseActivePath).toBe('boolean');
    expect(typeof dyn.noiseMagnitude).toBe('number');
    expect(typeof dyn.wakePressureMean).toBe('number');
    expect(typeof dyn.wakePressureMax).toBe('number');
  });
});
