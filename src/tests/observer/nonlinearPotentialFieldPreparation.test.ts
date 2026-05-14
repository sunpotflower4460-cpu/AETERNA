import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { deriveNonlinearPotentialFieldPreparation } from '../../observer/nonlinearPotentialFieldPreparation.ts';
import { createWaveCapableMediumState } from '../../world/waveCapableMedium.ts';
import type { NonlinearPotentialFieldConfig } from '../../types/nonlinearPotentialField.ts';

const config: NonlinearPotentialFieldConfig = {
  width: 2,
  height: 2,
  boundaryMode: 'torus',
  localQuadraticCoefficient: 2,
  localQuarticCoefficient: 0.5,
  tolerance: 1e-9,
};

const forbiddenResultTerms = [
  'coherenceTarget',
  'phaseLockingRate',
  'naturalFrequencyPull',
  'desiredOrderParameter',
  'driveSyncStrength',
  'globalDecayRate',
  'vital',
  'breath',
  'heartbeat',
  'metabolic',
  'lifeDrive',
  '呼吸',
  '鼓動',
  '生命',
  '心拍',
];

describe('nonlinear potential field preparation', () => {
  it('derives local quadratic-quartic potential energy and gradient fields without mutating medium state', () => {
    const medium = createWaveCapableMediumState(
      { width: 2, height: 2, boundaryMode: 'torus' },
      {
        mediumRealField: [1, 0, 2, 0],
        mediumImagField: [0, 1, 0, 0],
        mediumRealVelocityField: [0.5, 0, 0, 0],
        mediumImagVelocityField: [0, 0.25, 0, 0],
      },
    );
    const before = {
      real: Array.from(medium.mediumRealField),
      imag: Array.from(medium.mediumImagField),
      realVelocity: Array.from(medium.mediumRealVelocityField),
      imagVelocity: Array.from(medium.mediumImagVelocityField),
      tick: medium.tick,
    };

    const report = deriveNonlinearPotentialFieldPreparation({ mediumState: medium, config });

    // cell amplitudes squared: 1, 1, 4, 0
    // potential: 0.5*k2*r2 + 0.25*k4*r2^2
    // with k2=2, k4=0.5 => 1.125, 1.125, 6, 0
    expect(Array.from(report.potentialEnergyField)).toEqual([1.125, 1.125, 6, 0]);
    expect(report.potentialEnergyTotal).toBeCloseTo(8.25, 12);
    expect(report.potentialEnergyMax).toBeCloseTo(6, 12);

    // gradient scale: k2 + k4*r2 => 2.5, 2.5, 4, 2
    expect(Array.from(report.gradientRealField)).toEqual([2.5, 0, 8, 0]);
    expect(Array.from(report.gradientImagField)).toEqual([0, 2.5, 0, 0]);
    expect(report.maxGradientMagnitude).toBeCloseTo(8, 12);
    expect(report.gradientEnergyProxy).toBeCloseTo(0.5 * (2.5 * 2.5 + 2.5 * 2.5 + 8 * 8), 12);

    expect(report.finiteCellCount).toBe(4);
    expect(report.nonFiniteCellCount).toBe(0);
    expect(report.mediumChangedFieldCount).toBe(0);
    expect(report.metricKind).toBe('derived');
    expect(report.source).toBe('nonlinear-potential-field-preparation');

    expect(Array.from(medium.mediumRealField)).toEqual(before.real);
    expect(Array.from(medium.mediumImagField)).toEqual(before.imag);
    expect(Array.from(medium.mediumRealVelocityField)).toEqual(before.realVelocity);
    expect(Array.from(medium.mediumImagVelocityField)).toEqual(before.imagVelocity);
    expect(medium.tick).toBe(before.tick);
  });

  it('treats non-finite position samples as zero and reports warnings', () => {
    const medium = createWaveCapableMediumState(
      { width: 2, height: 2, boundaryMode: 'torus' },
      {
        mediumRealField: [0, 1, 0, 0],
        mediumImagField: [0, 0, 0, 0],
      },
    );
    medium.mediumRealField[0] = Number.NaN;
    medium.mediumRealField[2] = Number.POSITIVE_INFINITY;
    medium.mediumImagField[3] = Number.NEGATIVE_INFINITY;

    const report = deriveNonlinearPotentialFieldPreparation({ mediumState: medium, config });

    expect(report.finiteCellCount).toBe(1);
    expect(report.nonFiniteCellCount).toBe(3);
    expect(report.warnings.join('\n')).toContain('non-finite nonlinear-potential cell');
    expect(Array.from(report.potentialEnergyField)).toEqual([0, 1.125, 0, 0]);
    expect(report.mediumChangedFieldCount).toBe(0);
  });

  it('warns when local coefficients describe potentially unstable diagnostic shapes', () => {
    const medium = createWaveCapableMediumState(
      { width: 1, height: 1, boundaryMode: 'torus' },
      { mediumRealField: [1], mediumImagField: [0] },
    );

    const report = deriveNonlinearPotentialFieldPreparation({
      mediumState: medium,
      config: {
        width: 1,
        height: 1,
        boundaryMode: 'torus',
        localQuadraticCoefficient: -1,
        localQuarticCoefficient: -0.5,
      },
    });

    expect(report.potentialEnergyTotal).toBeCloseTo(-0.625, 12);
    expect(report.potentialEnergyMax).toBeCloseTo(-0.625, 12);
    expect(report.gradientRealField[0]).toBeCloseTo(-1.5, 12);
    expect(report.warnings.join('\n')).toContain('Local quadratic coefficient is negative');
    expect(report.warnings.join('\n')).toContain('Local quartic coefficient is negative');
    expect(report.mediumChangedFieldCount).toBe(0);
  });

  it('throws when config size does not match medium state size', () => {
    const medium = createWaveCapableMediumState({ width: 2, height: 2, boundaryMode: 'torus' });

    expect(() =>
      deriveNonlinearPotentialFieldPreparation({
        mediumState: medium,
        config: {
          ...config,
          width: 1,
          height: 2,
        },
      }),
    ).toThrow('NonlinearPotentialField config size must match medium state size.');
  });

  it('does not include result-coded coherence identifiers in nonlinear potential preparation source files', () => {
    const source = [
      readFileSync('src/types/nonlinearPotentialField.ts', 'utf8'),
      readFileSync('src/observer/nonlinearPotentialFieldPreparation.ts', 'utf8'),
    ].join('\n');

    for (const term of forbiddenResultTerms) {
      expect(source.toLowerCase()).not.toContain(term.toLowerCase());
    }
  });
});
