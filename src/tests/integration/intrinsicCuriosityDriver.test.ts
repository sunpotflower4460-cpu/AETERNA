/**
 * Tests for IntrinsicCuriosityDriver (Phase C-2).
 *
 * Phase C-2 guarantees:
 *   - Initial state has zero EMA / zero drive.
 *   - When the governor's gate is closed, seedMagnitude is exactly 0 even
 *     under sustained boredom or instability.
 *   - When the gate is open, sustained low aggregateError raises driveIndex
 *     toward 1, and seedMagnitude rises but never exceeds the cap.
 *   - High variance (alternating high/low aggregateError) raises
 *     driveIndex via the instability term.
 *   - seedDirection stays in [-1, 1] and is finite.
 *   - The function does not mutate the input governor or hpError.
 */

import { describe, it, expect } from 'vitest';
import {
  createInitialCuriosityState,
  deriveIntrinsicCuriositySeed,
  INTRINSIC_CURIOSITY_SEED_CAP,
} from '../../organism/intrinsicCuriosityDriver.ts';
import {
  createInitialGovernor,
  GOVERNOR_GAIN_HARD_CAP,
  setGovernorGain,
} from '../../integration/consciousnessSafetyGovernor.ts';
import type { HierarchicalPredictionError } from '../../perception/hierarchicalPredictor.ts';

function err(aggregate: number): HierarchicalPredictionError {
  return {
    sensoryError: aggregate,
    selfError: aggregate,
    relationError: aggregate,
    aggregateError: aggregate,
    smoothedAggregateError: aggregate,
    layerAgreement: 1,
  };
}

describe('createInitialCuriosityState', () => {
  it('starts at zero', () => {
    const s = createInitialCuriosityState();
    expect(s.errorEMA).toBe(0);
    expect(s.varianceEMA).toBe(0);
    expect(s.observedTicks).toBe(0);
    expect(s.lastDriveIndex).toBe(0);
  });
});

describe('deriveIntrinsicCuriositySeed - closed gate', () => {
  it('seedMagnitude is 0 even under sustained boredom (gate closed)', () => {
    const governor = createInitialGovernor(); // gain 0
    let state = createInitialCuriosityState();
    let last = null;
    for (let t = 0; t < 200; t++) {
      const out = deriveIntrinsicCuriositySeed(state, err(0.0), governor);
      state = out.state;
      last = out;
    }
    expect(last).not.toBeNull();
    if (last) {
      expect(last.seedMagnitude).toBe(0);
      // driveIndex still rises so operators can see it.
      expect(last.driveIndex).toBeGreaterThan(0.5);
    }
  });

  it('seedMagnitude is 0 when the governor is tripped', () => {
    let governor = setGovernorGain(createInitialGovernor(), GOVERNOR_GAIN_HARD_CAP);
    let state = createInitialCuriosityState();

    // Run open-gate ticks to warm up.
    for (let t = 0; t < 30; t++) {
      const out = deriveIntrinsicCuriositySeed(state, err(0), governor);
      state = out.state;
    }
    governor = { ...governor, enabled: false, globalGain: 0 };
    const out = deriveIntrinsicCuriositySeed(state, err(0), governor);
    expect(out.seedMagnitude).toBe(0);
  });
});

describe('deriveIntrinsicCuriositySeed - open gate', () => {
  it('rising drive under sustained boredom produces non-zero seedMagnitude (≤ cap)', () => {
    const governor = setGovernorGain(createInitialGovernor(), GOVERNOR_GAIN_HARD_CAP);
    let state = createInitialCuriosityState();
    let last = null;
    for (let t = 0; t < 200; t++) {
      const out = deriveIntrinsicCuriositySeed(state, err(0.0), governor);
      state = out.state;
      last = out;
    }
    expect(last).not.toBeNull();
    if (last) {
      expect(last.driveIndex).toBeGreaterThan(0.5);
      expect(last.seedMagnitude).toBeGreaterThan(0);
      expect(last.seedMagnitude).toBeLessThanOrEqual(INTRINSIC_CURIOSITY_SEED_CAP);
    }
  });

  it('half-open gate scales seedMagnitude proportionally', () => {
    const fullGov = setGovernorGain(createInitialGovernor(), GOVERNOR_GAIN_HARD_CAP);
    const halfGov = setGovernorGain(createInitialGovernor(), GOVERNOR_GAIN_HARD_CAP / 2);

    let fullState = createInitialCuriosityState();
    let halfState = createInitialCuriosityState();
    let fullOut = null;
    let halfOut = null;

    for (let t = 0; t < 200; t++) {
      const fOut = deriveIntrinsicCuriositySeed(fullState, err(0.0), fullGov);
      const hOut = deriveIntrinsicCuriositySeed(halfState, err(0.0), halfGov);
      fullState = fOut.state;
      halfState = hOut.state;
      fullOut = fOut;
      halfOut = hOut;
    }

    expect(fullOut).not.toBeNull();
    expect(halfOut).not.toBeNull();
    if (fullOut && halfOut) {
      // half-gain should produce roughly half magnitude (linear scaling).
      expect(halfOut.seedMagnitude).toBeCloseTo(fullOut.seedMagnitude / 2, 5);
    }
  });

  it('high variance raises driveIndex via instability term', () => {
    const governor = setGovernorGain(createInitialGovernor(), GOVERNOR_GAIN_HARD_CAP);
    let state = createInitialCuriosityState();
    let last = null;
    for (let t = 0; t < 200; t++) {
      // Alternating extremes to keep variance high while mean ≈ 0.5.
      const e = t % 2 === 0 ? 0.95 : 0.05;
      const out = deriveIntrinsicCuriositySeed(state, err(e), governor);
      state = out.state;
      last = out;
    }
    expect(last).not.toBeNull();
    if (last) {
      expect(last.driveIndex).toBeGreaterThan(0.3);
    }
  });
});

describe('deriveIntrinsicCuriositySeed - bounds and immutability', () => {
  it('seedDirection stays in [-1, 1] and is finite', () => {
    const governor = setGovernorGain(createInitialGovernor(), GOVERNOR_GAIN_HARD_CAP);
    let state = createInitialCuriosityState();
    for (let t = 0; t < 100; t++) {
      const out = deriveIntrinsicCuriositySeed(state, err(t * 0.01), governor);
      state = out.state;
      expect(Number.isFinite(out.seedDirection)).toBe(true);
      expect(out.seedDirection).toBeGreaterThanOrEqual(-1);
      expect(out.seedDirection).toBeLessThanOrEqual(1);
    }
  });

  it('does not mutate input governor or hpError', () => {
    const governor = setGovernorGain(createInitialGovernor(), GOVERNOR_GAIN_HARD_CAP);
    const govSnapshot = JSON.stringify(governor);
    const e = err(0.0);
    const eSnapshot = JSON.stringify(e);
    deriveIntrinsicCuriositySeed(createInitialCuriosityState(), e, governor);
    expect(JSON.stringify(governor)).toBe(govSnapshot);
    expect(JSON.stringify(e)).toBe(eSnapshot);
  });
});
