import { describe, expect, it } from 'vitest';
import { createWorldField } from '../../pure/world/worldField.ts';
import { measureRoundTripDelay } from '../../pure/world/measureRoundTripDelay.ts';
import type { PureCoreParams } from '../../pure/params.ts';

function chiParams(overrides: Partial<PureCoreParams> = {}): PureCoreParams {
  return { R: 3, r: 1, N: 8, dt: 0.01, alpha: 1, g: 0, nu0: 0, kappa: 0, rho: 0, seed: 1, ...overrides };
}

describe('pure core K13: measureRoundTripDelay (docs/vessel/K13-world-constitution-adr.md Choice 5, corrected)', () => {
  it('returns a delayTicks and dampingFactor within sane bounds for a real dispersive chi', () => {
    const chiWorld = createWorldField({ params: chiParams() });
    const result = measureRoundTripDelay({
      chiWorld,
      pair: { psiCellIndex: 0, chiCellIndex: 0 },
      lambda: 20,
      dt: 0.01,
      maxTicks: 200,
      riseThreshold: 0.05,
      pulseAmplitude: 1,
    });

    expect(result.delayTicks).toBeGreaterThan(1); // not the trivial "still near pulseAmplitude on tick 1" false positive
    expect(result.delayTicks).toBeLessThanOrEqual(200);
    expect(result.dampingFactor).toBeGreaterThan(0);
    expect(result.dampingFactor).toBeLessThanOrEqual(1);
  });

  it('is deterministic for the same config', () => {
    const chiWorld = createWorldField({ params: chiParams() });
    const config = { chiWorld, pair: { psiCellIndex: 0, chiCellIndex: 0 }, lambda: 20, dt: 0.01, maxTicks: 200, riseThreshold: 0.05, pulseAmplitude: 1 };
    const a = measureRoundTripDelay(config);
    const b = measureRoundTripDelay(config);
    expect(a).toEqual(b);
  });

  it('throws when no echo clears the threshold within the tick budget (an artificially tiny budget)', () => {
    const chiWorld = createWorldField({ params: chiParams() });
    expect(() =>
      measureRoundTripDelay({
        chiWorld,
        pair: { psiCellIndex: 0, chiCellIndex: 0 },
        lambda: 20,
        dt: 0.01,
        maxTicks: 1,
        riseThreshold: 0.05,
        pulseAmplitude: 1,
      }),
    ).toThrow(/no echo/);
  });

  it('a higher riseThreshold does not report an earlier or equal delay than a lower one (a stricter bar cannot trigger sooner on the same trajectory)', () => {
    const chiWorld = createWorldField({ params: chiParams() });
    const base = { chiWorld, pair: { psiCellIndex: 0, chiCellIndex: 0 }, lambda: 20, dt: 0.01, maxTicks: 200, pulseAmplitude: 1 };
    const lenient = measureRoundTripDelay({ ...base, riseThreshold: 0.02 });
    const strict = measureRoundTripDelay({ ...base, riseThreshold: 0.3 });
    expect(strict.delayTicks).toBeGreaterThanOrEqual(lenient.delayTicks);
  });
});
