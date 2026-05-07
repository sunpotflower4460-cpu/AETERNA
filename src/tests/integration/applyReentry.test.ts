/**
 * Tests for applyReentry helpers (Phase C-1).
 *
 * Phase C-1 guarantees:
 *   - mergeReentryIntoBeautifulLoop preserves the original five deltas.
 *   - clampModulation passes through unmodified Phase C fields when they
 *     are within range, clamps when out of range, leaves them undefined
 *     when missing.
 *   - smoothModulation blends Phase C fields when present on either side.
 *   - createZeroModulation still returns the original five-field shape (so
 *     existing call sites stay backward compatible).
 *   - updateLivingState advances the new EMA fields from Reentry deltas.
 *   - buildLivingStateReentryInput composes both legacy and reentry deltas.
 */

import { describe, it, expect } from 'vitest';
import {
  clampModulation,
  createZeroModulation,
  smoothModulation,
  type BeautifulLoopModulation,
} from '../../core/beautifulLoopModulation.ts';
import {
  buildLivingStateReentryInput,
  extractReentryFromBeautifulLoop,
  mergeReentryIntoBeautifulLoop,
} from '../../integration/applyReentry.ts';
import { REENTRY_LIMITS, zeroDeltas } from '../../integration/reentryModulator.ts';
import {
  createInitialLivingState,
  updateLivingState,
} from '../../organism/livingState.ts';

describe('mergeReentryIntoBeautifulLoop', () => {
  it('writes only the four Phase C fields and leaves the original five untouched', () => {
    const base: BeautifulLoopModulation = {
      noveltyBiasDelta: 0.01,
      withdrawBiasDelta: -0.02,
      rewritePressureDelta: 0.005,
      restorationBiasDelta: 0.01,
      touchOpennessDelta: 0.02,
    };
    const reentry = {
      curiosityBiasDelta: 0.03,
      internalUtteranceBiasDelta: -0.02,
      bindingCoherenceDelta: 0.01,
      hierarchicalErrorBiasDelta: -0.005,
    };
    const merged = mergeReentryIntoBeautifulLoop(base, reentry);
    expect(merged.noveltyBiasDelta).toBe(base.noveltyBiasDelta);
    expect(merged.withdrawBiasDelta).toBe(base.withdrawBiasDelta);
    expect(merged.rewritePressureDelta).toBe(base.rewritePressureDelta);
    expect(merged.restorationBiasDelta).toBe(base.restorationBiasDelta);
    expect(merged.touchOpennessDelta).toBe(base.touchOpennessDelta);
    expect(merged.curiosityBiasDelta).toBe(reentry.curiosityBiasDelta);
    expect(merged.internalUtteranceBiasDelta).toBe(reentry.internalUtteranceBiasDelta);
    expect(merged.bindingCoherenceDelta).toBe(reentry.bindingCoherenceDelta);
    expect(merged.hierarchicalErrorBiasDelta).toBe(reentry.hierarchicalErrorBiasDelta);
    // The base object itself is not mutated.
    expect(base).not.toHaveProperty('curiosityBiasDelta');
  });
});

describe('extractReentryFromBeautifulLoop', () => {
  it('returns zeros when Phase C fields are absent', () => {
    const base: BeautifulLoopModulation = createZeroModulation();
    const reentry = extractReentryFromBeautifulLoop(base);
    expect(reentry).toEqual(zeroDeltas());
  });
});

describe('clampModulation - Phase C fields', () => {
  it('clamps Phase C fields to per-channel limits', () => {
    const merged: BeautifulLoopModulation = {
      ...createZeroModulation(),
      curiosityBiasDelta: 99,
      internalUtteranceBiasDelta: -99,
      bindingCoherenceDelta: 0.005,
      hierarchicalErrorBiasDelta: 99,
    };
    const clamped = clampModulation(merged);
    expect(clamped.curiosityBiasDelta).toBe(REENTRY_LIMITS.curiosity);
    expect(clamped.internalUtteranceBiasDelta).toBe(-REENTRY_LIMITS.internalUtterance);
    expect(clamped.bindingCoherenceDelta).toBe(0.005);
    expect(clamped.hierarchicalErrorBiasDelta).toBe(REENTRY_LIMITS.hierarchicalError);
  });

  it('leaves Phase C fields undefined when input had none', () => {
    const base = createZeroModulation();
    const clamped = clampModulation(base);
    expect(clamped.curiosityBiasDelta).toBeUndefined();
    expect(clamped.internalUtteranceBiasDelta).toBeUndefined();
    expect(clamped.bindingCoherenceDelta).toBeUndefined();
    expect(clamped.hierarchicalErrorBiasDelta).toBeUndefined();
  });
});

describe('smoothModulation - Phase C fields', () => {
  it('blends Phase C fields when present on either side', () => {
    const current: BeautifulLoopModulation = {
      ...createZeroModulation(),
      curiosityBiasDelta: 0.04,
    };
    const previous: BeautifulLoopModulation = {
      ...createZeroModulation(),
      curiosityBiasDelta: 0.0,
    };
    const blended = smoothModulation(current, previous, 0.5);
    expect(blended.curiosityBiasDelta).toBeCloseTo(0.02, 6);
  });

  it('returns undefined when neither side has the Phase C field', () => {
    const a = createZeroModulation();
    const b = createZeroModulation();
    const blended = smoothModulation(a, b, 0.5);
    expect(blended.curiosityBiasDelta).toBeUndefined();
  });
});

describe('updateLivingState - Phase C EMA fields', () => {
  it('initial state has zero reentry traces', () => {
    const ls = createInitialLivingState();
    expect(ls.internalNarrativeTrace).toBe(0);
    expect(ls.curiosityResidue).toBe(0);
    expect(ls.bindingMemory).toBe(0);
  });

  it('curiosityResidue rises under sustained curiosity reentry and decays back', () => {
    const ls = createInitialLivingState();
    const network = { simTime: 0 };
    // 200 ticks of full curiosity reentry — should saturate close to 1.
    for (let t = 0; t < 200; t++) {
      updateLivingState(ls, network, {
        blModulation: { curiosityBiasDelta: REENTRY_LIMITS.curiosity },
      });
    }
    expect(ls.curiosityResidue).toBeGreaterThan(0.9);
    // Now 200 ticks with no reentry — should decay back close to 0.
    for (let t = 0; t < 200; t++) {
      updateLivingState(ls, network, {});
    }
    expect(ls.curiosityResidue).toBeLessThan(0.05);
  });

  it('bindingMemory neutral midpoint is 0.5 with no signed input', () => {
    const ls = createInitialLivingState();
    const network = { simTime: 0 };
    // No reentry at all — bindingMemory drifts toward 0.5 (the neutral).
    for (let t = 0; t < 500; t++) {
      updateLivingState(ls, network, { blModulation: { bindingCoherenceDelta: 0 } });
    }
    expect(ls.bindingMemory).toBeGreaterThan(0.4);
    expect(ls.bindingMemory).toBeLessThan(0.6);
  });

  it('does not change Phase C fields when blModulation is null', () => {
    const ls = createInitialLivingState();
    ls.curiosityResidue = 0.5;
    ls.internalNarrativeTrace = 0.5;
    ls.bindingMemory = 0.5;
    const network = { simTime: 0 };
    updateLivingState(ls, network, { blModulation: null });
    // With reentry deltas all 0/undefined, EMA pulls slightly toward target (0
    // for curiosity/utterance, 0.5 for bindingMemory). The pull is bounded by
    // the smoothing factor (0.02) per tick, so single-tick movement is small.
    expect(Math.abs(ls.curiosityResidue - 0.5)).toBeLessThan(0.02);
    expect(Math.abs(ls.internalNarrativeTrace - 0.5)).toBeLessThan(0.02);
    expect(Math.abs(ls.bindingMemory - 0.5)).toBeLessThan(0.02);
  });
});

describe('buildLivingStateReentryInput', () => {
  it('combines reentry and legacy deltas', () => {
    const reentry = {
      curiosityBiasDelta: 0.03,
      internalUtteranceBiasDelta: 0.02,
      bindingCoherenceDelta: 0.01,
      hierarchicalErrorBiasDelta: 0.005,
    };
    const legacy = { touchOpennessDelta: 0.04, noveltyBiasDelta: -0.02 };
    const input = buildLivingStateReentryInput(reentry, legacy);
    expect(input.touchOpennessDelta).toBe(legacy.touchOpennessDelta);
    expect(input.noveltyBiasDelta).toBe(legacy.noveltyBiasDelta);
    expect(input.curiosityBiasDelta).toBe(reentry.curiosityBiasDelta);
    expect(input.internalUtteranceBiasDelta).toBe(reentry.internalUtteranceBiasDelta);
  });

  it('handles null reentry and null legacy', () => {
    const input = buildLivingStateReentryInput(null, null);
    expect(input.touchOpennessDelta).toBeUndefined();
    expect(input.curiosityBiasDelta).toBeUndefined();
  });
});
