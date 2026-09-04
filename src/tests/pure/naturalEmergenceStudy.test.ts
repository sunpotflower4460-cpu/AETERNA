import { describe, expect, it } from 'vitest';
import { runNaturalEmergenceCondition, runNaturalEmergenceStudy, type NaturalEmergenceConfig } from '../../pure/emergence/naturalEmergenceStudy.ts';

function smallConfig(useChi: boolean): NaturalEmergenceConfig {
  return {
    N: 6,
    alpha: 1,
    g: 4,
    nu0: 0.15,
    kappa: useChi ? 1 : 0,
    rho: useChi ? 0.3 : 0,
    dt: 0.01,
    driveAmplitude: 0.3,
    driveOmega: 3,
    totalTicks: 40,
    tauMin: 10,
    maxLocalizedFraction: 0.3,
    useChi,
    M: 24,
    shiftCellsPerTick: 2,
    lambda: 20,
  };
}

describe('pure core natural emergence study: orchestration (docs/vessel/K7-natural-emergence-preregistration.md, small-scale check)', () => {
  it('condition 1 (nu-frozen, no chi) runs and produces a well-formed result', () => {
    const result = runNaturalEmergenceCondition(smallConfig(false), 1);
    expect(typeof result.l2Satisfied).toBe('boolean');
    expect(typeof result.windingDetectedAnyTick).toBe('boolean');
    expect(Number.isFinite(result.maxPersistenceTicks)).toBe(true);
    expect(result.maxPersistenceTicks).toBeGreaterThanOrEqual(0);
  });

  it('condition 2 (medium history + chi) runs and produces a well-formed result', () => {
    const result = runNaturalEmergenceCondition(smallConfig(true), 1);
    expect(typeof result.l2Satisfied).toBe('boolean');
    expect(Number.isFinite(result.maxPersistenceTicks)).toBe(true);
  });

  it('is deterministic: the same config and seed give a bit-identical result', () => {
    const config = smallConfig(true);
    const r1 = runNaturalEmergenceCondition(config, 3);
    const r2 = runNaturalEmergenceCondition(config, 3);
    expect(r1).toEqual(r2);
  });

  it('rejects a non-pre-registered configuration (medium history without chi)', () => {
    const config = smallConfig(false);
    config.kappa = 1;
    config.rho = 0.3;
    expect(() => runNaturalEmergenceCondition(config, 1)).toThrow();
  });

  it('runNaturalEmergenceStudy runs one result per seed', () => {
    const results = runNaturalEmergenceStudy(smallConfig(false), [1, 2, 3]);
    expect(results).toHaveLength(3);
    expect(results.map((r) => r.seed)).toEqual([1, 2, 3]);
  });
});
