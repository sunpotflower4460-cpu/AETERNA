import { describe, expect, it } from 'vitest';
import { computeReturnWindow, runConditionA, runConditionB, type ReafferenceExperimentConfig } from '../../pure/reafference/conditions.ts';
import { calibrateControlAmplitude, measureReturnEnergy } from '../../pure/reafference/calibration.ts';

function baseConfig(): ReafferenceExperimentConfig {
  return {
    N: 6,
    M: 20,
    shiftCellsPerTick: 2,
    alpha: 1,
    g: 1,
    nu0: 0.2,
    kappa: 1,
    rho: 0.3,
    lambda: 20,
    dt: 0.01,
    shoutAmplitude: 0.5,
    shoutOmega: 5,
    shoutPhase: 0.3,
    shoutTicks: 5,
    windowHalfWidth: 2,
    observeAfterTicks: 3,
  };
}

describe('pure core K6 reafference: return window computation (docs/vessel/K6-reafference-preregistration.md)', () => {
  it('computes roundTripTicks = M/shiftCellsPerTick and the window around it', () => {
    const config = baseConfig();
    const window = computeReturnWindow(config);
    expect(window.roundTripTicks).toBe(10);
    expect(window.start).toBe(8);
    expect(window.end).toBe(12);
    expect(window.observationTick).toBe(12 + config.observeAfterTicks);
  });

  it('throws if M/shiftCellsPerTick is not an integer', () => {
    const config = { ...baseConfig(), M: 21 };
    expect(() => computeReturnWindow(config)).toThrow();
  });
});

describe('pure core K6 reafference: condition A/B determinism', () => {
  it('condition A is deterministic for a fixed seed', () => {
    const config = baseConfig();
    const a1 = runConditionA(config, 7);
    const a2 = runConditionA(config, 7);
    expect(a1.boundaryDensity).toBe(a2.boundaryDensity);
    expect(a1.globalCoherence).toBe(a2.globalCoherence);
    expect(a1.exchangeWorkNPsiTrajectory).toEqual(a2.exchangeWorkNPsiTrajectory);
  });

  it('condition B is deterministic for a fixed seed and control amplitude', () => {
    const config = baseConfig();
    const b1 = runConditionB(config, 7, 0.01);
    const b2 = runConditionB(config, 7, 0.01);
    expect(b1.boundaryDensity).toBe(b2.boundaryDensity);
    expect(b1.globalCoherence).toBe(b2.globalCoherence);
  });

  it('condition A produces finite, non-degenerate measurements', () => {
    const config = baseConfig();
    const a = runConditionA(config, 3);
    expect(Number.isFinite(a.boundaryDensity)).toBe(true);
    expect(Number.isFinite(a.globalCoherence)).toBe(true);
    expect(a.globalCoherence).toBeGreaterThanOrEqual(0);
    expect(a.globalCoherence).toBeLessThanOrEqual(1);
    // the shout should leave a measurable trace of coupling activity somewhere
    expect(a.exchangeWorkNPsiTrajectory.some((v) => Math.abs(v) > 0)).toBe(true);
  });
});

describe('pure core K6 reafference: energy calibration (docs/vessel/K6-reafference-preregistration.md 較正手順)', () => {
  it('measureReturnEnergy sums exchangeWork_N_psi over exactly the return window', () => {
    const config = baseConfig();
    const window = computeReturnWindow(config);
    const trajectory = Array.from({ length: window.observationTick }, (_, i) => i + 1); // 1,2,3,...
    const expected = Array.from({ length: window.end - window.start + 1 }, (_, i) => window.start + 1 + i).reduce((s, v) => s + v, 0);
    expect(measureReturnEnergy(trajectory, window)).toBe(expected);
  });

  it('calibrateControlAmplitude produces a finite amplitude whose resulting driveWork_N is close to the target (linear-approximation tolerance)', () => {
    const config = baseConfig();
    const calibrationSeed = 0;
    const a = runConditionA(config, calibrationSeed);
    const window = computeReturnWindow(config);
    const targetEnergy = measureReturnEnergy(a.exchangeWorkNPsiTrajectory, window);
    expect(Number.isFinite(targetEnergy)).toBe(true);

    const amplitude = calibrateControlAmplitude(config, calibrationSeed, targetEnergy);
    expect(Number.isFinite(amplitude)).toBe(true);

    const b = runConditionB(config, calibrationSeed, amplitude);
    const achievedEnergy = b.controlDriveWorkNTrajectory.reduce((s, v) => s + v, 0);

    // Linear approximation, not exact - documented floor. Require the same
    // sign and same order of magnitude rather than exact equality.
    expect(Math.sign(achievedEnergy)).toBe(Math.sign(targetEnergy));
    const relativeError = Math.abs(achievedEnergy - targetEnergy) / Math.max(Math.abs(targetEnergy), 1e-12);
    expect(relativeError).toBeLessThan(0.5);
  });

  it('throws a clear error when the test drive produces zero N-work (degenerate calibration)', () => {
    const config = baseConfig();
    expect(() => calibrateControlAmplitude(config, 0, 1, 0)).toThrow();
  });
});
