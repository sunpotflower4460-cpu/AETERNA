import { describe, expect, it } from 'vitest';
import { runPerturbationRecoveryProtocol, type PerturbationRecoveryConfig } from '../../pure/emergence/perturbationRecovery.ts';

function baseConfig(overrides: Partial<PerturbationRecoveryConfig> = {}): PerturbationRecoveryConfig {
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
    baselineTicks: 20,
    pulseAmplitude: 0.5,
    measurementWindowTicks: 20,
    relativeDeviation: 0.3,
    recoveryTolerance: 0.5,
    ...overrides,
  };
}

describe('pure core K11 (L4): perturbation-recovery protocol (pulse delivered only through world chi)', () => {
  it('runs the full baseline + pulse + measurement window without throwing, producing one indicator value per tick', () => {
    const config = baseConfig();
    const result = runPerturbationRecoveryProtocol(config);
    expect(result.indicatorHistory).toHaveLength(config.baselineTicks + 1 + config.measurementWindowTicks);
    for (const value of result.indicatorHistory) {
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
    }
  });

  it('a zero-amplitude pulse (a control condition: nothing actually perturbed) always counts as recovered', () => {
    const config = baseConfig({ pulseAmplitude: 0 });
    const result = runPerturbationRecoveryProtocol(config);
    expect(result.recovered).toBe(true);
  });

  it('is deterministic: two runs with the same config produce identical indicator histories', () => {
    const config = baseConfig();
    const a = runPerturbationRecoveryProtocol(config);
    const b = runPerturbationRecoveryProtocol(config);
    expect(a.indicatorHistory).toEqual(b.indicatorHistory);
    expect(a.recovered).toBe(b.recovered);
  });

  it('baselineIndicator is computed only from ticks BEFORE the pulse, postWindowIndicator only from the tail of the measurement window', () => {
    const config = baseConfig({ baselineTicks: 10, measurementWindowTicks: 10 });
    const result = runPerturbationRecoveryProtocol(config);
    const expectedBaseline = result.indicatorHistory.slice(5, 10).reduce((a, b) => a + b, 0) / 5;
    const expectedPostWindow = result.indicatorHistory.slice(-5).reduce((a, b) => a + b, 0) / 5;
    expect(result.baselineIndicator).toBeCloseTo(expectedBaseline, 10);
    expect(result.postWindowIndicator).toBeCloseTo(expectedPostWindow, 10);
  });

  it('throws for a non-positive baselineTicks or measurementWindowTicks', () => {
    expect(() => runPerturbationRecoveryProtocol(baseConfig({ baselineTicks: 0 }))).toThrow();
    expect(() => runPerturbationRecoveryProtocol(baseConfig({ measurementWindowTicks: -1 }))).toThrow();
  });

  it('accepts an explicit spectral linearSolverKind for a power-of-two N', () => {
    const config = baseConfig({ N: 8, linearSolverKind: 'spectral', baselineTicks: 5, measurementWindowTicks: 5 });
    const result = runPerturbationRecoveryProtocol(config);
    expect(result.indicatorHistory).toHaveLength(11);
  });
});
