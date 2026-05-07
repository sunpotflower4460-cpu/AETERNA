/**
 * Phase D wiring tests.
 *
 * Verifies that the consciousness integration pipeline is correctly wired
 * into AeternaNetwork:
 *
 *   - Constructor initialises pipeline state with the gate closed (Phase A
 *     invariant: governor.globalGain = 0 by default).
 *   - runConsciousnessIntegration() returns zero deltas when the gate is
 *     closed, regardless of input.
 *   - After setGovernorGain(...) opens the gate, reentry deltas can become
 *     non-zero.
 *   - Governor trip records surface via lastGovernorTrip and
 *     governorTripCount increments.
 *   - extractReentryFromBeautifulLoop / mergeReentryIntoBeautifulLoop wiring
 *     in the heartbeat side is exercised via a hand-built modulation bundle.
 *
 * These tests deliberately bypass AeternaNetwork.update() so they do not
 * depend on the full simulation harness (state.disk, touches, etc.).
 */

import { describe, it, expect, beforeEach } from 'vitest';
// @ts-expect-error — AeternaNetwork is plain JS without type declarations.
import { AeternaNetwork } from '../../core/AeternaNetwork.js';
import {
  GOVERNOR_GAIN_HARD_CAP,
  setGovernorGain,
  tripGovernor,
} from '../../integration/consciousnessSafetyGovernor.ts';
import { REENTRY_LIMITS } from '../../integration/reentryModulator.ts';
import {
  buildLivingStateReentryInput,
  extractReentryFromBeautifulLoop,
  mergeReentryIntoBeautifulLoop,
} from '../../integration/applyReentry.ts';
import type { InteroceptionPacket } from '../../types/interoception.ts';
import type { SelfWorldModelPacket } from '../../types/selfWorldModel.ts';
import type { ArousalAwarenessState } from '../../types/arousalAwareness.ts';

const SEGMENTS = 8;

function intero(coherence: number, energy = 0.7): InteroceptionPacket {
  return {
    timestamp: 0,
    energySense: energy,
    overloadSense: 0.2,
    coherenceSense: coherence,
    boundarySense: 0.6,
    restorationSense: 0.4,
    perturbationPressure: 0.1,
  };
}
function self(coherence: number, continuity = 0.6): SelfWorldModelPacket {
  return {
    timestamp: 0,
    selfCoherence: coherence,
    selfContinuity: continuity,
    worldPressure: 0.3,
    relationEngagement: 0.5,
  };
}
function ar(window: number, foreground = 0.4): ArousalAwarenessState {
  return {
    timestamp: 0,
    arousalLevel: 0.5,
    awarenessWindow: window,
    salienceOpenness: 0.5,
    foregroundPressure: foreground,
    restDepth: 0.4,
    hyperreactivity: 0.0,
    settlingWindow: 0.5,
  };
}

describe('AeternaNetwork — Phase D state initialization', () => {
  let net: InstanceType<typeof AeternaNetwork>;
  beforeEach(() => {
    net = new AeternaNetwork(SEGMENTS);
  });

  it('initialises consciousness governor with gate closed', () => {
    expect(net.consciousnessGovernor).toBeDefined();
    expect(net.consciousnessGovernor.enabled).toBe(true);
    expect(net.consciousnessGovernor.globalGain).toBe(0);
  });

  it('initialises predictor / curiosity / reentry / metric / utterance state', () => {
    expect(net.predictorState).toBeDefined();
    expect(net.predictorState.observedTicks).toBe(0);
    expect(net.curiosityState).toBeDefined();
    expect(net.curiosityState.observedTicks).toBe(0);
    expect(net.reentryState).toBeDefined();
    expect(net.lastBindingMetric).toBeDefined();
    expect(net.lastBindingMetric.bindingStrength).toBe(0);
    expect(net.lastInternalUtteranceMeta).toBeDefined();
    expect(net.lastInternalUtteranceMeta.hasUtterance).toBe(false);
    expect(net.lastReentryDeltas).toEqual({
      curiosityBiasDelta: 0,
      internalUtteranceBiasDelta: 0,
      bindingCoherenceDelta: 0,
      hierarchicalErrorBiasDelta: 0,
    });
    expect(net.lastReentryDiagnostics.gateOpen).toBe(false);
    expect(net.governorTripCount).toBe(0);
    expect(net.lastGovernorTrip).toBeNull();
  });

  it('default predictor mode is observe (theory-neutral)', () => {
    expect(net.consciousnessIntegrationConfig.predictorMode).toBe('observe');
  });
});

describe('AeternaNetwork — runConsciousnessIntegration (closed gate)', () => {
  let net: InstanceType<typeof AeternaNetwork>;
  beforeEach(() => {
    net = new AeternaNetwork(SEGMENTS);
  });

  it('returns zero deltas when the gate is closed', () => {
    const deltas = net.runConsciousnessIntegration({
      interoceptionPacket: intero(0.7),
      selfWorldModelPacket: self(0.8),
      arousalAwarenessState: ar(0.6),
      bodyWorldClosureState: null,
      bodySurfaceState: null,
      sensoryReturnPackets: null,
    });
    expect(deltas.curiosityBiasDelta).toBe(0);
    expect(deltas.internalUtteranceBiasDelta).toBe(0);
    expect(deltas.bindingCoherenceDelta).toBe(0);
    expect(deltas.hierarchicalErrorBiasDelta).toBe(0);
    expect(net.lastReentryDiagnostics.gateOpen).toBe(false);
  });

  it('still advances predictor / curiosity tick counts when the gate is closed', () => {
    for (let t = 0; t < 5; t++) {
      net.runConsciousnessIntegration({
        interoceptionPacket: intero(0.5),
        selfWorldModelPacket: self(0.5),
        arousalAwarenessState: ar(0.5),
        bodyWorldClosureState: null,
        bodySurfaceState: null,
        sensoryReturnPackets: null,
      });
    }
    expect(net.predictorState.observedTicks).toBe(5);
    expect(net.curiosityState.observedTicks).toBe(5);
  });
});

describe('AeternaNetwork — runConsciousnessIntegration (open gate)', () => {
  let net: InstanceType<typeof AeternaNetwork>;
  beforeEach(() => {
    net = new AeternaNetwork(SEGMENTS);
    net.consciousnessGovernor = setGovernorGain(net.consciousnessGovernor, GOVERNOR_GAIN_HARD_CAP);
  });

  it('produces non-zero deltas after a few ticks of varying input', () => {
    let totalAbs = 0;
    for (let t = 0; t < 8; t++) {
      const c = t % 2 === 0 ? 0.2 : 0.9;
      const deltas = net.runConsciousnessIntegration({
        interoceptionPacket: intero(c),
        selfWorldModelPacket: self(c),
        arousalAwarenessState: ar(c),
        bodyWorldClosureState: null,
        bodySurfaceState: null,
        sensoryReturnPackets: null,
      });
      totalAbs +=
        Math.abs(deltas.curiosityBiasDelta) +
        Math.abs(deltas.internalUtteranceBiasDelta) +
        Math.abs(deltas.bindingCoherenceDelta) +
        Math.abs(deltas.hierarchicalErrorBiasDelta);
      expect(Math.abs(deltas.curiosityBiasDelta)).toBeLessThanOrEqual(REENTRY_LIMITS.curiosity);
      expect(Math.abs(deltas.internalUtteranceBiasDelta)).toBeLessThanOrEqual(
        REENTRY_LIMITS.internalUtterance,
      );
      expect(Math.abs(deltas.bindingCoherenceDelta)).toBeLessThanOrEqual(
        REENTRY_LIMITS.bindingCoherence,
      );
      expect(Math.abs(deltas.hierarchicalErrorBiasDelta)).toBeLessThanOrEqual(
        REENTRY_LIMITS.hierarchicalError,
      );
    }
    expect(totalAbs).toBeGreaterThan(0);
    expect(net.lastReentryDiagnostics.gateOpen).toBe(true);
  });

  it('manually-tripped governor stops producing non-zero deltas', () => {
    net.runConsciousnessIntegration({
      interoceptionPacket: intero(0.3),
      selfWorldModelPacket: self(0.3),
      arousalAwarenessState: ar(0.3),
      bodyWorldClosureState: null,
      bodySurfaceState: null,
      sensoryReturnPackets: null,
    });
    net.consciousnessGovernor = tripGovernor(
      net.consciousnessGovernor,
      'energyCollapse',
      'manual',
      0,
      0,
    );
    const deltas = net.runConsciousnessIntegration({
      interoceptionPacket: intero(0.3),
      selfWorldModelPacket: self(0.9),
      arousalAwarenessState: ar(0.9),
      bodyWorldClosureState: null,
      bodySurfaceState: null,
      sensoryReturnPackets: null,
    });
    expect(deltas.curiosityBiasDelta).toBe(0);
    expect(deltas.internalUtteranceBiasDelta).toBe(0);
    expect(net.lastReentryDiagnostics.gateOpen).toBe(false);
  });
});

describe('AeternaNetwork — Phase D heartbeat wiring', () => {
  it('extractReentryFromBeautifulLoop / mergeReentryIntoBeautifulLoop round-trip preserves deltas', () => {
    const net = new AeternaNetwork(SEGMENTS);
    const reentry = {
      curiosityBiasDelta: 0.02,
      internalUtteranceBiasDelta: -0.01,
      bindingCoherenceDelta: 0.005,
      hierarchicalErrorBiasDelta: -0.003,
    };
    const merged = mergeReentryIntoBeautifulLoop(net.currentModulation, reentry);
    const extracted = extractReentryFromBeautifulLoop(merged);
    expect(extracted).toEqual(reentry);
  });

  it('buildLivingStateReentryInput composes legacy and reentry fields for the heartbeat', () => {
    const reentry = {
      curiosityBiasDelta: 0.04,
      internalUtteranceBiasDelta: 0.03,
      bindingCoherenceDelta: 0.0,
      hierarchicalErrorBiasDelta: 0.0,
    };
    const legacy = { touchOpennessDelta: 0.05, noveltyBiasDelta: -0.04 };
    const input = buildLivingStateReentryInput(reentry, legacy);
    expect(input.touchOpennessDelta).toBe(0.05);
    expect(input.curiosityBiasDelta).toBe(0.04);
    expect(input.internalUtteranceBiasDelta).toBe(0.03);
  });
});
