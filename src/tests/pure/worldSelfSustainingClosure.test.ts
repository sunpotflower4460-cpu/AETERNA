import { describe, expect, it } from 'vitest';
import {
  runWorldSelfSustainingClosureProtocol,
  type WorldSelfSustainingClosureConfig,
} from '../../pure/emergence/worldSelfSustainingClosure.ts';
import type { PureCoreParams } from '../../pure/params.ts';

function baseParams(overrides: Partial<PureCoreParams> = {}): PureCoreParams {
  return { R: 3, r: 1, N: 8, dt: 0.01, alpha: 1, g: 1.2, nu0: 0.2, kappa: 1, rho: 0.3, seed: 7, ...overrides };
}

function baseConfig(overrides: Partial<WorldSelfSustainingClosureConfig> = {}): WorldSelfSustainingClosureConfig {
  return {
    psiConfig: { params: baseParams({ seed: 7 }) },
    chiConfig: { params: baseParams({ seed: 11 }) },
    k: 4,
    lambda: 0.5,
    driveAmplitude: 0.3,
    driveOmega: 2,
    driveTicks: 15,
    postDriveTicks: 15,
    relativeDeviation: 0.3,
    structureThreshold: 2,
    ...overrides,
  };
}

describe('pure core K14 (L6, world version): self-sustaining-closure protocol using K13\'s real 2D world', () => {
  it('runs both phases without throwing, one indicator value per tick', () => {
    const config = baseConfig();
    const result = runWorldSelfSustainingClosureProtocol(config);
    expect(result.indicatorHistory).toHaveLength(config.driveTicks + config.postDriveTicks);
    for (const value of result.indicatorHistory) {
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
    }
  });

  it('computes dissipationTimeTicks as exactly (1/nu0)/dt, from psiConfig only', () => {
    const config = baseConfig({ psiConfig: { params: baseParams({ seed: 7, nu0: 0.25, dt: 0.02 }) } });
    const result = runWorldSelfSustainingClosureProtocol(config);
    expect(result.dissipationTimeTicks).toBeCloseTo(1 / 0.25 / 0.02, 10);
  });

  it('an impossibly high structureThreshold (never met) gives zero survival and does not satisfy L6', () => {
    const config = baseConfig({ structureThreshold: 1e9 });
    const result = runWorldSelfSustainingClosureProtocol(config);
    expect(result.survivalTicksPastDriveOff).toBe(0);
    expect(result.satisfiesL6).toBe(false);
    expect(result.censored).toBe(false);
  });

  it('an always-met structureThreshold (<=0, since contrastRatio is always >= 0) is censored at exactly postDriveTicks', () => {
    const config = baseConfig({ structureThreshold: 0, postDriveTicks: 10 });
    const result = runWorldSelfSustainingClosureProtocol(config);
    expect(result.survivalTicksPastDriveOff).toBe(10);
    expect(result.censored).toBe(true);
  });

  it('satisfiesL6 requires survival to STRICTLY EXCEED dissipationTimeTicks, not merely equal it', () => {
    const config = baseConfig({
      psiConfig: { params: baseParams({ seed: 7, nu0: 5, dt: 0.5 }) },
      chiConfig: { params: baseParams({ seed: 11, nu0: 5, dt: 0.5 }) },
      structureThreshold: 0,
      postDriveTicks: 5,
    });
    const result = runWorldSelfSustainingClosureProtocol(config);
    expect(result.dissipationTimeTicks).toBeCloseTo(1 / 5 / 0.5, 10); // = 0.4
    expect(result.survivalTicksPastDriveOff).toBe(5);
    expect(result.satisfiesL6).toBe(true); // 5 > 0.4
  });

  it('is deterministic across repeated calls with the same config', () => {
    const config = baseConfig();
    const a = runWorldSelfSustainingClosureProtocol(config);
    const b = runWorldSelfSustainingClosureProtocol(config);
    expect(a.indicatorHistory).toEqual(b.indicatorHistory);
    expect(a.survivalTicksPastDriveOff).toBe(b.survivalTicksPastDriveOff);
  });

  it('throws for a non-positive driveTicks or postDriveTicks', () => {
    expect(() => runWorldSelfSustainingClosureProtocol(baseConfig({ driveTicks: 0 }))).toThrow();
    expect(() => runWorldSelfSustainingClosureProtocol(baseConfig({ postDriveTicks: -1 }))).toThrow();
  });

  it('throws for a non-positive nu0 on psiConfig (dissipation time undefined)', () => {
    expect(() =>
      runWorldSelfSustainingClosureProtocol(baseConfig({ psiConfig: { params: baseParams({ seed: 7, nu0: 0 }) } }))
    ).toThrow();
    expect(() =>
      runWorldSelfSustainingClosureProtocol(baseConfig({ psiConfig: { params: baseParams({ seed: 7, nu0: -0.1 }) } }))
    ).toThrow();
  });

  it('at lambda=0, driving chi harder does not change psi\'s indicator history at all (no contact)', () => {
    const weak = runWorldSelfSustainingClosureProtocol(baseConfig({ lambda: 0, driveAmplitude: 0.01 }));
    const strong = runWorldSelfSustainingClosureProtocol(baseConfig({ lambda: 0, driveAmplitude: 5 }));
    expect(weak.indicatorHistory).toEqual(strong.indicatorHistory);
  });
});
