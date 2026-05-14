import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { deriveNonlinearPotentialForcePreview } from '../../observer/nonlinearPotentialForcePreview.ts';
import { createWaveCapableMediumState } from '../../world/waveCapableMedium.ts';
import type { NonlinearPotentialForcePreviewConfig } from '../../types/nonlinearPotentialField.ts';

const config: NonlinearPotentialForcePreviewConfig = {
  width: 2,
  height: 2,
  boundaryMode: 'torus',
  localQuadraticCoefficient: 2,
  localQuarticCoefficient: 0.5,
  previewForceScale: 0.25,
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

function snapshotMedium(state: ReturnType<typeof createWaveCapableMediumState>) {
  return {
    real: Array.from(state.mediumRealField),
    imag: Array.from(state.mediumImagField),
    realVelocity: Array.from(state.mediumRealVelocityField),
    imagVelocity: Array.from(state.mediumImagVelocityField),
    dissipation: Array.from(state.waveEnergyDissipationField),
    residue: Array.from(state.waveEnergyResidueField),
    outflow: Array.from(state.waveEnergyOutflowField),
    tick: state.tick,
  };
}

describe('nonlinear potential force preview', () => {
  it('derives a negative-gradient force candidate without mutating medium state', () => {
    const medium = createWaveCapableMediumState(
      { width: 2, height: 2, boundaryMode: 'torus' },
      {
        mediumRealField: [1, 0, 2, 0],
        mediumImagField: [0, 1, 0, 0],
        mediumRealVelocityField: [0.5, 0, 0, 0],
        mediumImagVelocityField: [0, 0.25, 0, 0],
      },
    );
    const before = snapshotMedium(medium);

    const report = deriveNonlinearPotentialForcePreview({ mediumState: medium, config });

    expect(report.preparation.source).toBe('nonlinear-potential-field-preparation');
    expect(Array.from(report.preparation.gradientRealField)).toEqual([2.5, 0, 8, 0]);
    expect(Array.from(report.preparation.gradientImagField)).toEqual([0, 2.5, 0, 0]);

    expect(report.requestedPreviewForceScale).toBe(0.25);
    expect(report.effectivePreviewForceScale).toBe(0.25);
    expect(Array.from(report.previewForceRealField)).toEqual([-0.625, -0, -2, -0]);
    expect(Array.from(report.previewForceImagField)).toEqual([-0, -0.625, -0, -0]);
    expect(report.maxPreviewForceMagnitude).toBeCloseTo(2, 12);
    expect(report.previewForceEnergyProxy).toBeCloseTo(0.5 * (0.625 * 0.625 + 0.625 * 0.625 + 2 * 2), 12);

    expect(report.mediumChangedFieldCount).toBe(0);
    expect(report.metricKind).toBe('derived');
    expect(report.source).toBe('nonlinear-potential-force-preview');
    expect(snapshotMedium(medium)).toEqual(before);
  });

  it('clamps negative preview force scale to zero', () => {
    const medium = createWaveCapableMediumState(
      { width: 1, height: 1, boundaryMode: 'torus' },
      { mediumRealField: [1], mediumImagField: [0] },
    );

    const report = deriveNonlinearPotentialForcePreview({
      mediumState: medium,
      config: {
        width: 1,
        height: 1,
        boundaryMode: 'torus',
        localQuadraticCoefficient: 2,
        localQuarticCoefficient: 0,
        previewForceScale: -1,
      },
    });

    expect(report.requestedPreviewForceScale).toBe(-1);
    expect(report.effectivePreviewForceScale).toBe(0);
    expect(Array.from(report.previewForceRealField)).toEqual([-0]);
    expect(Array.from(report.previewForceImagField)).toEqual([-0]);
    expect(report.maxPreviewForceMagnitude).toBe(0);
    expect(report.previewForceEnergyProxy).toBe(0);
    expect(report.warnings.join('\n')).toContain('Negative preview force scale was clamped to 0.');
    expect(report.mediumChangedFieldCount).toBe(0);
  });

  it('treats non-finite preview force scale as zero', () => {
    const medium = createWaveCapableMediumState(
      { width: 1, height: 1, boundaryMode: 'torus' },
      { mediumRealField: [1], mediumImagField: [0] },
    );

    const report = deriveNonlinearPotentialForcePreview({
      mediumState: medium,
      config: {
        width: 1,
        height: 1,
        boundaryMode: 'torus',
        localQuadraticCoefficient: 2,
        localQuarticCoefficient: 0,
        previewForceScale: Number.POSITIVE_INFINITY,
      },
    });

    expect(report.requestedPreviewForceScale).toBe(0);
    expect(report.effectivePreviewForceScale).toBe(0);
    expect(report.previewForceEnergyProxy).toBe(0);
    expect(report.warnings.join('\n')).toContain('Non-finite preview force scale was treated as 0.');
  });

  it('propagates preparation warnings while keeping force preview read-only', () => {
    const medium = createWaveCapableMediumState({ width: 1, height: 1, boundaryMode: 'torus' });
    medium.mediumRealField[0] = Number.NaN;

    const report = deriveNonlinearPotentialForcePreview({
      mediumState: medium,
      config: {
        width: 1,
        height: 1,
        boundaryMode: 'torus',
        localQuadraticCoefficient: -1,
        localQuarticCoefficient: -1,
        previewForceScale: 1,
      },
    });

    expect(report.finiteCellCount).toBe(0);
    expect(report.nonFiniteCellCount).toBe(1);
    expect(report.warnings.join('\n')).toContain('non-finite nonlinear-potential cell');
    expect(report.warnings.join('\n')).toContain('Local quadratic coefficient is negative');
    expect(report.warnings.join('\n')).toContain('Local quartic coefficient is negative');
    expect(report.mediumChangedFieldCount).toBe(0);
    expect(medium.tick).toBe(0);
  });

  it('does not include result-coded coherence identifiers in nonlinear force preview source files', () => {
    const source = [
      readFileSync('src/types/nonlinearPotentialField.ts', 'utf8'),
      readFileSync('src/observer/nonlinearPotentialFieldPreparation.ts', 'utf8'),
      readFileSync('src/observer/nonlinearPotentialForcePreview.ts', 'utf8'),
    ].join('\n');

    for (const term of forbiddenResultTerms) {
      expect(source.toLowerCase()).not.toContain(term.toLowerCase());
    }
  });
});
