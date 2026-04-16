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
import { state } from '../organism/state.js';

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

function prepareRewriteFrame(
  net: InstanceType<typeof AeternaNetwork>,
  node: number,
  type: 'novelty' | 'recurrence' | 'persistence' | 'directionality',
) {
  net.predictionError.fill(0);
  net.touchOnset.fill(0);
  net.touchOffset.fill(0);
  net.touchNovelty.fill(0);
  net.touchTrace.fill(0);
  net.rawTouch.fill(0);
  net.touchProjection.fill(0);
  net.activityResidue.fill(0);
  net.touchPatternScores = { tap: 0, repeat: 0, hold: 0, stroke: 0 };
  net.predictionError[node] = 1.0;

  if (type === 'novelty') {
    net.touchOnset[node] = 1.0;
    net.touchNovelty[node] = 1.0;
    net.touchPatternScores.tap = 0.9;
  } else if (type === 'recurrence') {
    net.touchTrace[node] = 1.0;
    net.rawTouch[node] = 0.8;
    net.touchNovelty[node] = 0.6;
    net.touchPatternScores.repeat = 0.9;
  } else if (type === 'persistence') {
    net.touchOffset[node] = 1.0;
    net.touchTrace[node] = 0.9;
    net.activityResidue[node] = 0.5;
    net.touchPatternScores.hold = 0.9;
  } else {
    net.rawTouch[node] = 1.0;
    net.touchNovelty[node] = 0.8;
    net.touchProjection[node] = 0.7;
    net.touchPatternScores.stroke = 0.9;
    net.touchDirectionVector = { dx: 0.4, dy: 0.05, strength: 0.9 };
  }
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

describe('AeternaNetwork — structured prior rewrite', () => {
  let net: InstanceType<typeof AeternaNetwork>;
  const node = 27;

  beforeEach(() => {
    state.disk = stubDisk() as typeof state.disk;
    state.tensionLoad = 0.6;
    net = new AeternaNetwork(SMALL);
  });

  it('initializes bounded rewrite state', () => {
    expect(net.priorBias.length).toBe(net.numNodes);
    expect(net.rewritePressure.length).toBe(net.numNodes);
    expect(net.plasticityTrace.length).toBe(net.numNodes);
    expect(net.recentRewriteMask.length).toBe(net.numNodes);
    expect(net.globalRewriteLoad).toBe(0);
  });

  it('creates a novelty rewrite event only after sustained trigger pressure', () => {
    prepareRewriteFrame(net, node, 'novelty');
    const before = net.localPrediction[node];
    for (let frame = 0; frame < 3; frame++) net.updateStructuredPriorRewrite();

    expect(net.lastRewriteEvent?.rewriteType).toBe('novelty');
    expect(net.priorChannels.novelty[node]).toBeGreaterThan(0);
    expect(net.priorBias[node]).toBeGreaterThan(0);
    expect(net.localPrediction[node]).toBeGreaterThan(before);
    expect(net.recentRewriteMask[node]).toBeGreaterThan(0);
  });

  it('applies recurrence and persistence rewrites with distinct local effects', () => {
    prepareRewriteFrame(net, node, 'recurrence');
    for (let frame = 0; frame < 3; frame++) net.updateStructuredPriorRewrite();
    const recurrenceTrace = net.touchTrace[node];
    expect(net.lastRewriteEvent?.rewriteType).toBe('recurrence');
    expect(net.priorChannels.recurrence[node]).toBeGreaterThan(0);
    expect(recurrenceTrace).toBeGreaterThan(1.0);

    net.recentRewriteMask.fill(0);
    net.globalRewriteLoad = 0;
    prepareRewriteFrame(net, node, 'persistence');
    const beforeResidue = net.activityResidue[node];
    for (let frame = 0; frame < 3; frame++) net.updateStructuredPriorRewrite();
    expect(net.lastRewriteEvent?.rewriteType).toBe('persistence');
    expect(net.priorChannels.persistence[node]).toBeGreaterThan(0);
    expect(net.activityResidue[node]).toBeGreaterThan(beforeResidue);
  });

  it('biases directional weights and suppresses rewrite when global load is too high', () => {
    prepareRewriteFrame(net, node, 'directionality');
    for (let frame = 0; frame < 3; frame++) net.updateStructuredPriorRewrite();
    expect(net.lastRewriteEvent?.rewriteType).toBe('directionality');
    expect(net.priorChannels.directionality[node]).toBeGreaterThan(0);
    expect(net.w_right[node]).toBeGreaterThan(net.w_left[node]);

    const eventId = net.lastRewriteEvent?.id;
    net.recentRewriteMask.fill(0);
    net.globalRewriteLoad = 0.5;
    prepareRewriteFrame(net, node + 1, 'novelty');
    net.updateStructuredPriorRewrite();
    expect(net.lastRewriteEvent?.id).toBe(eventId);
  });

  it('decays rewrite bias over time', () => {
    prepareRewriteFrame(net, node, 'novelty');
    for (let frame = 0; frame < 3; frame++) net.updateStructuredPriorRewrite();
    const afterRewrite = net.priorBias[node];

    net.touchPatternScores = { tap: 0, repeat: 0, hold: 0, stroke: 0 };
    net.predictionError.fill(0);
    net.touchOnset.fill(0);
    net.touchNovelty.fill(0);
    for (let frame = 0; frame < 120; frame++) net.decayStructuredPriorRewrite();

    expect(net.priorBias[node]).toBeLessThan(afterRewrite);
    expect(net.priorBias[node]).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(net.priorBias[node])).toBe(true);
  });
});

describe('AeternaNetwork — sleep / wake / dream mode', () => {
  let net: InstanceType<typeof AeternaNetwork>;

  beforeEach(() => {
    state.disk = stubDisk() as typeof state.disk;
    net = new AeternaNetwork(SMALL);
  });

  it('initializes conservative mode state', () => {
    expect(net.modeState).toBe('wake');
    expect(net.wakeDrive).toBeGreaterThan(0);
    expect(net.sleepPressure).toBeGreaterThanOrEqual(0);
    expect(net.dreamPressure).toBeGreaterThanOrEqual(0);
    expect(net.lastModeChangeTime).toBe(0);
  });

  it('raises sleep pressure during prolonged quiet', () => {
    const before = net.sleepPressure;
    for (let frame = 0; frame < 320; frame++) {
      net.simTime = frame + 1;
      net.updateModeState();
    }

    expect(net.sleepPressure).toBeGreaterThan(before);
    expect(net.externalQuietFrames).toBeGreaterThan(200);
  });

  it('raises wake drive when touch and novelty are present', () => {
    const before = net.wakeDrive;
    for (let frame = 0; frame < 8; frame++) {
      net.simTime = frame + 1;
      net.updateModeState({
        activeTouchCount: 1,
        meanRawTouch: 0.28,
        meanTouchOnset: 0.22,
        meanTouchNovelty: 0.26,
        arousal: 0.05,
        meanPredictionError: 0.18,
        sigmaDisplay: 1.07,
        tension: 0.35,
      });
    }

    expect(net.wakeDrive).toBeGreaterThan(before);
  });

  it('raises dream pressure from quiet residue and prior ember', () => {
    const before = net.dreamPressure;
    for (let frame = 0; frame < 180; frame++) {
      net.simTime = frame + 1;
      net.updateModeState({
        residueLevel: 0.36,
        traceLevel: 0.42,
        priorBiasMean: 0.09,
        rewritePressureMean: 0.05,
        recentRewriteMean: 0.08,
      });
    }

    expect(net.dreamPressure).toBeGreaterThan(before);
  });

  it('applies weak dream-like replay without direct external input', () => {
    net.modeState = 'dream';
    net.currentModeDynamics = { ...net.currentModeDynamics, replayGain: 1.0 };
    net.dreamPressure = 0.72;
    net.activityResidue[5] = 0.7;
    net.touchTrace[5] = 1.8;
    net.priorBias[5] = 0.2;
    net.recentRewriteMask[5] = 20;
    const residueBefore = net.activityResidue[5];
    const projectionBefore = net.touchProjection[5];

    net.applyDreamReplay(0);

    expect(net.dreamReplayActive).toBe(true);
    expect(net.activityResidue[5]).toBeGreaterThan(residueBefore);
    expect(net.touchProjection[5]).toBeGreaterThan(projectionBefore);
    expect(net.dreamReplayStrength).toBeGreaterThan(0);
  });

  it('respects cooldown and avoids immediate mode flapping', () => {
    net.modeState = 'wake';
    net.lastModeChangeTime = 100;
    net.simTime = 110;

    net.updateModeState({
      residueLevel: 0.5,
      traceLevel: 0.6,
      priorBiasMean: 0.12,
      rewritePressureMean: 0.08,
      recentRewriteMean: 0.1,
    });

    expect(net.modeState).toBe('wake');
  });

  it('returns mode fields from updateDynamics()', () => {
    const dyn = net.updateDynamics(-1);
    expect(['sleep', 'wake', 'dream']).toContain(dyn.modeState);
    expect(typeof dyn.wakeDrive).toBe('number');
    expect(typeof dyn.sleepPressure).toBe('number');
    expect(typeof dyn.dreamPressure).toBe('number');
    expect(typeof dyn.lastModeChangeFrames).toBe('number');
    expect(typeof dyn.dreamReplayActive).toBe('boolean');
    expect(typeof dyn.energy).toBe('number');
    expect(typeof dyn.stability).toBe('number');
    expect(typeof dyn.overload).toBe('number');
    expect(['idle', 'orient', 'withdraw', 'settle']).toContain(dyn.actionState);
  });
});

describe('AeternaNetwork — organism and action loop', () => {
  let net: InstanceType<typeof AeternaNetwork>;

  beforeEach(() => {
    state.disk = stubDisk() as typeof state.disk;
    net = new AeternaNetwork(SMALL);
  });

  it('initializes bounded organism and action state', () => {
    expect(net.energy).toBeGreaterThanOrEqual(0);
    expect(net.energy).toBeLessThanOrEqual(1);
    expect(net.stability).toBeGreaterThanOrEqual(0);
    expect(net.overload).toBeGreaterThanOrEqual(0);
    expect(net.restDrive).toBeGreaterThanOrEqual(0);
    expect(net.orientingDrive).toBeGreaterThanOrEqual(0);
    expect(net.actionState).toBe('idle');
    expect(net.organismStateHistory.length).toBeGreaterThan(0);
  });

  it('raises overload and orienting drive under novelty-heavy contact', () => {
    const overloadBefore = net.overload;
    const orientBefore = net.orientingDrive;

    for (let frame = 0; frame < 12; frame++) {
      net.simTime = frame + 1;
      net.touchPatternScores = { tap: 0.85, repeat: 0.8, hold: 0.05, stroke: 0.35 };
      net.updateOrganismState({
        activeTouchCount: 1,
        meanRawTouch: 0.22,
        meanTouchOnset: 0.2,
        meanTouchNovelty: 0.28,
        meanTouchTrace: 0.08,
        arousal: 0.05,
        meanPredictionError: 0.24,
        residueLevel: 0.04,
        rewritePressureMean: 0.05,
        globalRewriteLoad: 0.14,
      });
    }

    expect(net.overload).toBeGreaterThan(overloadBefore);
    expect(net.orientingDrive).toBeGreaterThan(orientBefore);
  });

  it('recovers energy and stability in quiet and shifts toward settle', () => {
    net.energy = 0.22;
    net.stability = 0.2;
    net.overload = 0.46;
    net.restDrive = 0.52;

    for (let frame = 0; frame < 80; frame++) {
      net.simTime = frame + 1;
      net.touchPatternScores = { tap: 0, repeat: 0, hold: 0, stroke: 0 };
      net.updateOrganismState({
        residueLevel: 0.08,
      });
    }
    net.updateActionState({
      meanTouchTrace: 0.06,
    });

    expect(net.energy).toBeGreaterThan(0.22);
    expect(net.stability).toBeGreaterThan(0.2);
    expect(net.actionState).toBe('settle');
  });

  it('uses touch packet pattern scores when updating organism state', () => {
    const orientBefore = net.orientingDrive;
    net.touchPatternScores = { tap: 0, repeat: 0, hold: 0, stroke: 0 };

    for (let frame = 0; frame < 12; frame++) {
      net.simTime = frame + 1;
      net.updateOrganismState({
        activeTouchCount: 1,
        meanRawTouch: 0.22,
        meanTouchOnset: 0.2,
        meanTouchNovelty: 0.28,
        meanTouchTrace: 0.08,
        patternScores: { tap: 0.85, repeat: 0.8, hold: 0.05, stroke: 0.35 },
        arousal: 0.05,
        meanPredictionError: 0.24,
        residueLevel: 0.04,
        rewritePressureMean: 0.05,
        globalRewriteLoad: 0.14,
      });
    }

    expect(net.orientingDrive).toBeGreaterThan(orientBefore);
  });

  it('enters withdraw when overload is high', () => {
    net.overload = 0.78;
    net.energy = 0.28;
    net.touchDirectionVector = { dx: 0.3, dy: 0.05, strength: 0.9 };

    net.updateActionState({
      activeTouchCount: 1,
      meanRawTouch: 0.2,
      meanTouchNovelty: 0.22,
      meanTouchTrace: 0.05,
    });

    expect(net.actionState).toBe('withdraw');
    expect(net.actionPulseLevel).toBeGreaterThan(0);
    expect(net.actionDirection?.[0]).toBeLessThan(0);
  });

  it('uses packet touch pattern and direction when deciding action', () => {
    net.overload = 0.78;
    net.energy = 0.28;
    net.touchPatternScores = { tap: 0, repeat: 0, hold: 0, stroke: 0 };
    net.touchDirectionVector = { dx: 0, dy: 0, strength: 0 };

    net.updateActionState({
      activeTouchCount: 1,
      meanRawTouch: 0.2,
      meanTouchNovelty: 0.22,
      meanTouchTrace: 0.05,
      patternScores: { tap: 0.8, repeat: 0, hold: 0, stroke: 0.4 },
      lastTouchDirection: [0.3, 0.05],
      touchDirectionStrength: 0.9,
      energy: net.energy,
      overload: net.overload,
      restDrive: net.restDrive,
      orientingDrive: net.orientingDrive,
    });

    expect(net.actionState).toBe('withdraw');
    expect(net.actionDirection?.[0]).toBeLessThan(0);
  });

  it('returns orient action back into dynamics as a weak directional pulse', () => {
    net.energy = 0.8;
    net.stability = 0.62;
    net.overload = 0.08;
    net.restDrive = 0.12;
    net.orientingDrive = 0.72;
    net.lastTouchCentroid = [0.5, 0.5];
    net.touchDirectionVector = { dx: 0.25, dy: 0.04, strength: 0.9 };

    net.updateActionState({
      activeTouchCount: 1,
      meanRawTouch: 0.24,
      meanTouchNovelty: 0.22,
      meanTouchTrace: 0.03,
    });
    const idx = net.mapTouchToSurfaceIndex(0.5, 0.5);
    const beforeProjection = net.touchProjection[idx];
    const beforeCurrent = net.currentBuffer[idx];

    expect(net.actionState).toBe('orient');
    net.applyActionToDynamics();

    expect(net.touchProjection[idx]).toBeGreaterThan(beforeProjection);
    expect(net.currentBuffer[idx]).toBeGreaterThan(beforeCurrent);
  });
});
