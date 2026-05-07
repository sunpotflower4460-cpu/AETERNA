/**
 * Tests for setGovernorGain (Phase B extension).
 *
 * Phase B guarantees:
 *   - setGovernorGain on a tripped governor stays at 0.
 *   - Negative or non-finite values clamp to 0.
 *   - Values above the hard cap clamp to the cap.
 *   - governorGlobalGain still returns 0 when disabled.
 *   - Phase A invariant preserved: createInitialGovernor still has gain 0.
 */

import { describe, it, expect } from 'vitest';
import {
  createInitialGovernor,
  governorGlobalGain,
  GOVERNOR_GAIN_HARD_CAP,
  resetGovernor,
  setGovernorGain,
  tripGovernor,
} from '../../integration/consciousnessSafetyGovernor.ts';

describe('setGovernorGain', () => {
  it('preserves Phase A invariant: initial governor has gain 0', () => {
    const g = createInitialGovernor();
    expect(g.globalGain).toBe(0);
    expect(governorGlobalGain(g)).toBe(0);
  });

  it('clamps negative requests to 0', () => {
    const g = createInitialGovernor();
    const next = setGovernorGain(g, -0.5);
    expect(next.globalGain).toBe(0);
    expect(governorGlobalGain(next)).toBe(0);
  });

  it('clamps non-finite requests to 0 (NaN and ±Infinity are all rejected)', () => {
    const g = createInitialGovernor();
    expect(setGovernorGain(g, Number.NaN).globalGain).toBe(0);
    expect(setGovernorGain(g, Number.POSITIVE_INFINITY).globalGain).toBe(0);
    expect(setGovernorGain(g, Number.NEGATIVE_INFINITY).globalGain).toBe(0);
  });

  it('clamps requests above the hard cap', () => {
    const g = createInitialGovernor();
    const next = setGovernorGain(g, 0.5);
    expect(next.globalGain).toBe(GOVERNOR_GAIN_HARD_CAP);
  });

  it('accepts values within range', () => {
    const g = createInitialGovernor();
    const next = setGovernorGain(g, 0.02);
    expect(next.globalGain).toBe(0.02);
    expect(governorGlobalGain(next)).toBe(0.02);
  });

  it('refuses to set gain on a tripped governor', () => {
    const g0 = createInitialGovernor();
    const tripped = tripGovernor(g0, 'energyCollapse', 'manual', 0, 0);
    const after = setGovernorGain(tripped, 0.04);
    expect(after.enabled).toBe(false);
    expect(after.globalGain).toBe(0);
    expect(governorGlobalGain(after)).toBe(0);
  });

  it('idempotent when value matches', () => {
    const g = setGovernorGain(createInitialGovernor(), 0.02);
    const again = setGovernorGain(g, 0.02);
    expect(again).toBe(g);
  });

  it('survives reset → still 0 after reset (manual ramp-up required)', () => {
    let g = setGovernorGain(createInitialGovernor(), 0.02);
    g = tripGovernor(g, 'bindingRunaway', 'forced', 0, 0);
    g = resetGovernor(g);
    expect(g.enabled).toBe(true);
    expect(g.globalGain).toBe(0);
  });
});
