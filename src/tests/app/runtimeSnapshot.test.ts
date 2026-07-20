/**
 * runtimeSnapshot.test.ts
 *
 * Confirms:
 * - buildRuntimeSnapshot returns null before the first frame (lastDyn unset)
 * - buildRuntimeSnapshot reads tick/engineState/sigma/phi/energy/arousal from state
 * - a legitimate 0 value is preserved, not replaced by a fallback
 * - deep per-layer fields are explicitly null (not wired yet — see docs/ui-migration-boundary.md)
 */

import { describe, it, expect } from 'vitest';
import { buildRuntimeSnapshot } from '../../app/runtime/RuntimeSnapshot.js';

describe('buildRuntimeSnapshot', () => {
  it('returns null before the first frame has run', () => {
    const state = { network: { simTime: 0 }, lastDyn: null, lastEngineState: null };
    expect(buildRuntimeSnapshot(state, 1000)).toBeNull();
  });

  it('returns null when network is not yet constructed', () => {
    const state = { network: null, lastDyn: { sigmaDisplay: 1 }, lastEngineState: 'NEUTRAL' };
    expect(buildRuntimeSnapshot(state, 1000)).toBeNull();
  });

  it('reads tick/engineState/sigma/phi/energy/arousal from live state', () => {
    const state = {
      network: { simTime: 42 },
      lastDyn: { sigmaDisplay: 1.02, phiApprox: 0.0009, energy: 0.7, arousal: 0.03 },
      lastEngineState: 'WHITE',
    };
    const snapshot = buildRuntimeSnapshot(state, 1234);
    expect(snapshot).toEqual({
      tick: 42,
      timestamp: 1234,
      engineState: 'WHITE',
      sigma: 1.02,
      phi: 0.0009,
      energy: 0.7,
      arousal: 0.03,
      viability: null,
      closure: null,
      membrane: null,
      localField: null,
      repeatedFlowPaths: null,
      protoNetwork: null,
      observedRatios: null,
    });
  });

  it('preserves a legitimate 0 energy value instead of dropping it to null', () => {
    const state = {
      network: { simTime: 1 },
      lastDyn: { sigmaDisplay: 1, phiApprox: 0, energy: 0, arousal: 0 },
      lastEngineState: 'NEUTRAL',
    };
    const snapshot = buildRuntimeSnapshot(state, 0);
    expect(snapshot?.energy).toBe(0);
    expect(snapshot?.phi).toBe(0);
    expect(snapshot?.arousal).toBe(0);
  });

  it('defaults engineState to NEUTRAL when not yet set', () => {
    const state = { network: { simTime: 1 }, lastDyn: { sigmaDisplay: 1 }, lastEngineState: null };
    expect(buildRuntimeSnapshot(state, 0)?.engineState).toBe('NEUTRAL');
  });
});
