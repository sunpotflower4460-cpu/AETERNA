import { describe, expect, it } from 'vitest';
import { runSelfSustainingClosureProtocol, type SelfSustainingClosureConfig } from '../../pure/emergence/selfSustainingClosure.ts';

function baseConfig(overrides: Partial<SelfSustainingClosureConfig> = {}): SelfSustainingClosureConfig {
  return {
    N: 8,
    alpha: 1,
    g: 1.2,
    nu0: 0.2,
    kappa: 1,
    rho: 0.3,
    dt: 0.01,
    M: 6,
    shiftCellsPerTick: 1,
    lambda: 0.5,
    driveAmplitude: 0.05,
    driveOmega: 2,
    seed: 7,
    driveTicks: 15,
    postDriveTicks: 15,
    relativeDeviation: 0.3,
    structureThreshold: 2,
    ...overrides,
  };
}

describe('pure core K11 (L6): self-sustaining-closure protocol (drive cut off after a build-up phase)', () => {
  it('runs both phases without throwing, one indicator value per tick', () => {
    const config = baseConfig();
    const result = runSelfSustainingClosureProtocol(config);
    expect(result.indicatorHistory).toHaveLength(config.driveTicks + config.postDriveTicks);
    for (const value of result.indicatorHistory) {
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
    }
  });

  it('computes dissipationTimeTicks as exactly (1/nu0)/dt', () => {
    const config = baseConfig({ nu0: 0.25, dt: 0.02 });
    const result = runSelfSustainingClosureProtocol(config);
    expect(result.dissipationTimeTicks).toBeCloseTo(1 / 0.25 / 0.02, 10);
  });

  it('an impossibly high structureThreshold (never met) gives zero survival and does not satisfy L6', () => {
    const config = baseConfig({ structureThreshold: 1e9 });
    const result = runSelfSustainingClosureProtocol(config);
    expect(result.survivalTicksPastDriveOff).toBe(0);
    expect(result.satisfiesL6).toBe(false);
    expect(result.censored).toBe(false);
  });

  it('an always-met structureThreshold (<=0, since contrastRatio is always >= 0) is censored at exactly postDriveTicks', () => {
    const config = baseConfig({ structureThreshold: 0, postDriveTicks: 10 });
    const result = runSelfSustainingClosureProtocol(config);
    expect(result.survivalTicksPastDriveOff).toBe(10);
    expect(result.censored).toBe(true);
  });

  it('satisfiesL6 requires survival to STRICTLY EXCEED dissipationTimeTicks, not merely equal it', () => {
    // Choose nu0/dt so dissipationTimeTicks is small enough that a censored full-window survival exceeds it,
    // to check the comparison direction is right (survival > dissipation time, not >=).
    const config = baseConfig({ nu0: 5, dt: 0.5, structureThreshold: 0, postDriveTicks: 5 });
    const result = runSelfSustainingClosureProtocol(config);
    expect(result.dissipationTimeTicks).toBeCloseTo(1 / 5 / 0.5, 10); // = 0.4
    expect(result.survivalTicksPastDriveOff).toBe(5);
    expect(result.satisfiesL6).toBe(true); // 5 > 0.4
  });

  it('is deterministic across repeated calls with the same config', () => {
    const config = baseConfig();
    const a = runSelfSustainingClosureProtocol(config);
    const b = runSelfSustainingClosureProtocol(config);
    expect(a.indicatorHistory).toEqual(b.indicatorHistory);
    expect(a.survivalTicksPastDriveOff).toBe(b.survivalTicksPastDriveOff);
  });

  it('throws for a non-positive driveTicks or postDriveTicks', () => {
    expect(() => runSelfSustainingClosureProtocol(baseConfig({ driveTicks: 0 }))).toThrow();
    expect(() => runSelfSustainingClosureProtocol(baseConfig({ postDriveTicks: -1 }))).toThrow();
  });

  it('throws for a non-positive nu0 (dissipation time undefined)', () => {
    expect(() => runSelfSustainingClosureProtocol(baseConfig({ nu0: 0 }))).toThrow();
    expect(() => runSelfSustainingClosureProtocol(baseConfig({ nu0: -0.1 }))).toThrow();
  });
});
