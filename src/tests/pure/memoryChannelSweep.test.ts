import { describe, expect, it } from 'vitest';
import { runTimescaleSweepCondition, runGChannelSweepCondition, type TimescaleSweepConfig, type GChannelSweepConfig } from '../../pure/emergence/memoryChannelSweep.ts';

function baseTimescaleConfig(overrides: Partial<TimescaleSweepConfig> = {}): TimescaleSweepConfig {
  return {
    N: 6,
    alpha: 1,
    g: 4,
    nu0: 0.15,
    kappa: 1,
    rho: 0.3,
    dt: 0.01,
    driveAmplitude: 0.3,
    driveOmega: 3,
    totalTicks: 30,
    tauMin: 5,
    maxLocalizedFraction: 0.3,
    maxDisplacementCells: 2,
    seed: 1,
    ...overrides,
  };
}

function baseGChannelConfig(overrides: Partial<GChannelSweepConfig> = {}): GChannelSweepConfig {
  return {
    N: 6,
    alpha: 1,
    nu0: 0.15,
    dt: 0.01,
    driveAmplitude: 0.3,
    driveOmega: 3,
    totalTicks: 30,
    tauMin: 5,
    maxLocalizedFraction: 0.3,
    maxDisplacementCells: 2,
    seed: 1,
    kappaG: 1,
    rhoG: 0.3,
    g0: 4,
    g1: 8,
    ...overrides,
  };
}

describe('pure core K12: memory channel sweep runners (docs/vessel/K12-memory-channel-preregistration.md)', () => {
  it('arm A runs without throwing and returns a well-formed result', () => {
    const result = runTimescaleSweepCondition(baseTimescaleConfig());
    expect(typeof result.l2Satisfied).toBe('boolean');
    expect(typeof result.l3Satisfied).toBe('boolean');
    expect(result.maxPersistenceTicks).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(result.finalLocalization.fraction)).toBe(true);
  });

  it('arm A with kappa=0 (control) runs without throwing (nu never leaves nu0)', () => {
    const result = runTimescaleSweepCondition(baseTimescaleConfig({ kappa: 0, rho: 0 }));
    expect(typeof result.l2Satisfied).toBe('boolean');
  });

  it('arm A is deterministic for a fixed seed', () => {
    const a = runTimescaleSweepCondition(baseTimescaleConfig());
    const b = runTimescaleSweepCondition(baseTimescaleConfig());
    expect(a).toEqual(b);
  });

  it('arm B runs without throwing and returns a well-formed result', () => {
    const result = runGChannelSweepCondition(baseGChannelConfig());
    expect(typeof result.l2Satisfied).toBe('boolean');
    expect(typeof result.l3Satisfied).toBe('boolean');
    expect(result.maxPersistenceTicks).toBeGreaterThanOrEqual(0);
  });

  it('arm B with kappaG=0 (control) runs without throwing (g stays at g0)', () => {
    const result = runGChannelSweepCondition(baseGChannelConfig({ kappaG: 0, rhoG: 0 }));
    expect(typeof result.l2Satisfied).toBe('boolean');
  });

  it('arm B is deterministic for a fixed seed', () => {
    const a = runGChannelSweepCondition(baseGChannelConfig());
    const b = runGChannelSweepCondition(baseGChannelConfig());
    expect(a).toEqual(b);
  });

  it('a different seed runs without throwing and produces a well-formed result (arm A)', () => {
    const result = runTimescaleSweepCondition(baseTimescaleConfig({ seed: 2 }));
    expect(typeof result.l2Satisfied).toBe('boolean');
    expect(result.maxPersistenceTicks).toBeGreaterThanOrEqual(0);
  });
});
