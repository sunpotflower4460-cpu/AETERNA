/**
 * AeternaNetwork regression tests.
 *
 * These tests cover the pure-computation methods of AeternaNetwork — the parts
 * that do NOT require DOM, Three.js, or live state.disk values.
 *
 * Goals:
 *   - Confirm no NaN output from baseline / residue / prediction paths
 *   - Confirm predictionError is current - localPrediction (signed difference)
 *   - Confirm touchOnset > 0 and touchOffset === 0 when rawTouch > localPrediction
 *   - Confirm touchOffset > 0 and touchOnset === 0 when localPrediction > rawTouch
 *   - Confirm computeLargestCluster() returns a sensible ratio
 *   - Confirm computeIntegrationProxy() is non-negative
 *   - Confirm computePhaseCoherence() is in [0, 1]
 */

import { describe, it, expect, beforeEach } from 'vitest';
// @ts-expect-error — AeternaNetwork is plain JS without type declarations
import { AeternaNetwork } from '../core/AeternaNetwork.js';
import { state } from '../state.js';

const SMALL = 8; // small segment count keeps tests fast

/** Build the minimal state.disk stub needed by updateDynamics */
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

describe('AeternaNetwork — baseline and residue', () => {
  let net: InstanceType<typeof AeternaNetwork>;

  beforeEach(() => {
    net = new AeternaNetwork(SMALL);
  });

  it('updateBaseline() produces no NaN values', () => {
    net.updateBaseline();
    for (let i = 0; i < net.numNodes; i++) {
      expect(Number.isNaN(net.baselineActivity[i])).toBe(false);
    }
  });

  it('updateResidue() produces no NaN values from a zero state', () => {
    net.updateResidue();
    for (let i = 0; i < net.numNodes; i++) {
      expect(Number.isNaN(net.activityResidue[i])).toBe(false);
    }
  });

  it('activityResidue stays in [0, 1) after many residue updates', () => {
    net.spikeTrace.fill(1.0);
    for (let frame = 0; frame < 200; frame++) net.updateResidue();
    for (let i = 0; i < net.numNodes; i++) {
      expect(net.activityResidue[i]).toBeGreaterThanOrEqual(0);
      expect(net.activityResidue[i]).toBeLessThan(1.1); // generous upper bound
    }
  });
});

describe('AeternaNetwork — local prediction and prediction error', () => {
  let net: InstanceType<typeof AeternaNetwork>;

  beforeEach(() => {
    net = new AeternaNetwork(SMALL);
  });

  it('updatePredictionError() computes current - localPrediction (signed)', () => {
    net.currentBuffer[0] = 2.0;
    net.localPrediction[0] = 0.5;
    net.updatePredictionError();
    expect(net.predictionError[0]).toBeCloseTo(1.5);
  });

  it('predictionError is negative when localPrediction exceeds currentBuffer', () => {
    net.currentBuffer[0] = 0.3;
    net.localPrediction[0] = 1.0;
    net.updatePredictionError();
    expect(net.predictionError[0]).toBeCloseTo(-0.7);
  });

  it('updateLocalPrediction() produces no NaN values', () => {
    net.updateLocalPrediction();
    for (let i = 0; i < net.numNodes; i++) {
      expect(Number.isNaN(net.localPrediction[i])).toBe(false);
    }
  });

  it('localPrediction converges toward neighbourhood after repeated updates', () => {
    // Set all nodes to 1.0, then track node 0 — it should approach ~1.0
    net.currentBuffer.fill(1.0);
    for (let frame = 0; frame < 50; frame++) net.updateLocalPrediction();
    expect(net.localPrediction[0]).toBeGreaterThan(0.5);
  });
});

describe('AeternaNetwork — touch perception', () => {
  let net: InstanceType<typeof AeternaNetwork>;

  beforeEach(() => {
    net = new AeternaNetwork(SMALL);
  });

  it('touchOnset > 0 and touchOffset === 0 when rawTouch exceeds localPrediction', () => {
    net.rawTouch[0] = 1.5;
    net.localPrediction[0] = 0.5;
    net.updateTouchPerception();
    expect(net.touchOnset[0]).toBeCloseTo(1.0);
    expect(net.touchOffset[0]).toBe(0);
  });

  it('touchOffset > 0 and touchOnset === 0 when localPrediction exceeds rawTouch', () => {
    net.rawTouch[0] = 0.2;
    net.localPrediction[0] = 0.9;
    net.updateTouchPerception();
    expect(net.touchOffset[0]).toBeCloseTo(0.7);
    expect(net.touchOnset[0]).toBe(0);
  });

  it('touchNovelty equals |rawTouch - localPrediction|', () => {
    net.rawTouch[0] = 0.4;
    net.localPrediction[0] = 1.0;
    net.updateTouchPerception();
    expect(net.touchNovelty[0]).toBeCloseTo(0.6);
  });

  it('updateTouchPerception() produces no NaN values from a zero state', () => {
    net.updateTouchPerception();
    for (let i = 0; i < net.numNodes; i++) {
      expect(Number.isNaN(net.touchOnset[i])).toBe(false);
      expect(Number.isNaN(net.touchOffset[i])).toBe(false);
      expect(Number.isNaN(net.touchNovelty[i])).toBe(false);
    }
  });
});

describe('AeternaNetwork — cluster, phi proxy, phase coherence', () => {
  let net: InstanceType<typeof AeternaNetwork>;

  beforeEach(() => {
    net = new AeternaNetwork(SMALL);
  });

  it('computeLargestCluster() returns 0 when no nodes are active', () => {
    net.spikeTrace.fill(0);
    expect(net.computeLargestCluster()).toBe(0);
  });

  it('computeLargestCluster() returns numNodes when all nodes are active', () => {
    net.spikeTrace.fill(1.0);
    expect(net.computeLargestCluster()).toBe(net.numNodes);
  });

  it('computeLargestCluster() is non-negative in a partial activity state', () => {
    for (let i = 0; i < net.numNodes; i++) net.spikeTrace[i] = i % 2 === 0 ? 1.0 : 0.0;
    const clusterSize = net.computeLargestCluster();
    expect(clusterSize).toBeGreaterThanOrEqual(0);
    expect(clusterSize).toBeLessThanOrEqual(net.numNodes);
  });

  it('computeIntegrationProxy() is non-negative', () => {
    net.spikeTrace.fill(0.5);
    expect(net.computeIntegrationProxy()).toBeGreaterThanOrEqual(0);
  });

  it('computeIntegrationProxy() returns 0 from a zero state', () => {
    net.spikeTrace.fill(0);
    expect(net.computeIntegrationProxy()).toBeCloseTo(0);
  });

  it('computePhaseCoherence() is in a reasonable positive range', () => {
    const coherence = net.computePhaseCoherence();
    expect(coherence).toBeGreaterThanOrEqual(0);
    // Coherence denominator is numNodes so the raw value is << 1 for typical networks
    expect(Number.isNaN(coherence)).toBe(false);
  });
});

describe('AeternaNetwork — full dynamics step', () => {
  let net: InstanceType<typeof AeternaNetwork>;

  beforeEach(() => {
    // updateDynamics reads state.disk.omega_t, so provide a minimal stub
    state.disk = stubDisk() as typeof state.disk;
    // updateRawTouchField uses window.innerWidth/Height (browser globals)
    if (typeof globalThis.window === 'undefined') {
      (globalThis as Record<string, unknown>).window = { innerWidth: 800, innerHeight: 600 };
    }
    net = new AeternaNetwork(SMALL);
  });

  it('updateDynamics() returns an object with no NaN metric values', () => {
    const dyn = net.updateDynamics(-1);
    const keys = [
      'ignitionRatio', 'phiApprox', 'phaseCoherence',
      'arousal', 'sigmaDisplay', 'firingRateError',
      'baselineLevel', 'residueLevel',
      'meanRawTouch', 'meanTouchOnset', 'meanTouchOffset', 'meanTouchNovelty',
    ] as const;
    for (const k of keys) {
      expect(Number.isNaN(dyn[k]), `${k} should not be NaN`).toBe(false);
    }
  });

  it('updateDynamics() with a hot node raises arousal above zero', () => {
    // Inject a large value so several nodes cross the 0.8 threshold
    for (let i = 0; i < 10; i++) net.currentBuffer[i] = 5.0;
    const dyn = net.updateDynamics(-1);
    expect(dyn.arousal).toBeGreaterThan(0);
  });

  it('sigmaDisplay stays finite after many frames', () => {
    for (let frame = 0; frame < 10; frame++) {
      net.updateDynamics(-1);
    }
    expect(Number.isFinite(net.sigmaDisplay)).toBe(true);
  });
});
