import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { deriveNonlinearPotentialAccelerationPreview } from '../../observer/nonlinearPotentialAccelerationPreview.ts';
import { createWaveCapableMediumState } from '../../world/waveCapableMedium.ts';
import type { NonlinearPotentialAccelerationPreviewConfig } from '../../types/nonlinearPotentialField.ts';

const config: NonlinearPotentialAccelerationPreviewConfig = {
  width: 2,
  height: 2,
  boundaryMode: 'torus',
  localQuadraticCoefficient: 2,
  localQuarticCoefficient: 0.5,
  previewForceScale: 0.25,
  previewMass: 0.5,
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

describe('nonlinear potential acceleration preview', () => {
  it('derives acceleration candidates from force preview without mutating medium state', () => {
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

    const report = deriveNonlinearPotentialAccelerationPreview({ mediumState: medium, config });

    expect(report.forcePreview.source).toBe('nonlinear-potential-force-preview');
    expect(Array.from(report.forcePreview.previewForceRealField)).toEqual([-0.625, -0, -2, -0]);
    expect(Array.from(report.forcePreview.previewForceImagField)).toEqual([-0, -0.625, -0, -0]);

    expect(report.requestedPreviewMass).toBe(0.5);
    expect(report.effectivePreviewMass).toBe(0.5);
    expect(Array.from(report.previewAccelerationRealField)).toEqual([-1.25, -0, -4, -0]);
    expect(Array.from(report.previewAccelerationImagField)).toEqual([-0, -1.25, -0, -0]);
    expect(report.maxPreviewAccelerationMagnitude).toBeCloseTo(4, 12);
    expect(report.previewAccelerationEnergyProxy).toBeCloseTo(0.5 * (1.25 * 1.25 + 1.25 * 1.25 + 4 * 4), 12);

    expect(report.finiteCellCount).toBe(4);
    expect(report.nonFiniteCellCount).toBe(0);
    expect(report.mediumChangedFieldCount).toBe(0);
    expect(report.metricKind).toBe('derived');
    expect(report.source).toBe('nonlinear-potential-acceleration-preview');
    expect(snapshotMedium(medium)).toEqual(before);
  });

  it('clamps zero preview mass to one', () => {
    const medium = createWaveCapableMediumState(
      { width: 1, height: 1, boundaryMode: 'torus' },
      { mediumRealField: [1], mediumImagField: [0] },
    );

    const report = deriveNonlinearPotentialAccelerationPreview({
      mediumState: medium,
      config: {
        width: 1,
        height: 1,
        boundaryMode: 'torus',
        localQuadraticCoefficient: 2,
        localQuarticCoefficient: 0,
        previewForceScale: 0.5,
        previewMass: 0,
      },
    });

    expect(report.requestedPreviewMass).toBe(0);
    expect(report.effectivePreviewMass).toBe(1);
    expect(Array.from(report.previewAccelerationRealField)).toEqual([-1]);
    expect(Array.from(report.previewAccelerationImagField)).toEqual([-0]);
    expect(report.warnings.join('\n')).toContain('Non-positive preview mass was clamped to 1.');
    expect(report.finiteCellCount).toBe(1);
    expect(report.nonFiniteCellCount).toBe(0);
    expect(report.mediumChangedFieldCount).toBe(0);
  });

  it('clamps negative preview mass to one', () => {
    const medium = createWaveCapableMediumState(
      { width: 1, height: 1, boundaryMode: 'torus' },
      { mediumRealField: [1], mediumImagField: [0] },
    );

    const report = deriveNonlinearPotentialAccelerationPreview({
      mediumState: medium,
      config: {
        width: 1,
        height: 1,
        boundaryMode: 'torus',
        localQuadraticCoefficient: 2,
        localQuarticCoefficient: 0,
        previewForceScale: 0.5,
        previewMass: -2,
      },
    });

    expect(report.requestedPreviewMass).toBe(-2);
    expect(report.effectivePreviewMass).toBe(1);
    expect(report.previewAccelerationEnergyProxy).toBeCloseTo(0.5, 12);
    expect(report.warnings.join('\n')).toContain('Non-positive preview mass was clamped to 1.');
  });

  it('treats non-finite preview mass as one', () => {
    const medium = createWaveCapableMediumState(
      { width: 1, height: 1, boundaryMode: 'torus' },
      { mediumRealField: [1], mediumImagField: [0] },
    );

    const report = deriveNonlinearPotentialAccelerationPreview({
      mediumState: medium,
      config: {
        width: 1,
        height: 1,
        boundaryMode: 'torus',
        localQuadraticCoefficient: 2,
        localQuarticCoefficient: 0,
        previewForceScale: 0.5,
        previewMass: Number.POSITIVE_INFINITY,
      },
    });

    expect(report.requestedPreviewMass).toBe(1);
    expect(report.effectivePreviewMass).toBe(1);
    expect(report.warnings.join('\n')).toContain('Non-finite preview mass was treated as 1.');
  });

  it('recomputes finite counts after mass division and warns on non-finite acceleration output', () => {
    const medium = createWaveCapableMediumState(
      { width: 1, height: 1, boundaryMode: 'torus' },
      { mediumRealField: [Number.MAX_VALUE], mediumImagField: [0] },
    );

    const report = deriveNonlinearPotentialAccelerationPreview({
      mediumState: medium,
      config: {
        width: 1,
        height: 1,
        boundaryMode: 'torus',
        localQuadraticCoefficient: Number.MAX_VALUE,
        localQuarticCoefficient: 0,
        previewForceScale: 1,
        previewMass: Number.MIN_VALUE,
      },
    });

    expect(report.forcePreview.finiteCellCount).toBe(1);
    expect(report.finiteCellCount).toBe(0);
    expect(report.nonFiniteCellCount).toBe(1);
    expect(report.previewAccelerationRealField[0]).toBe(Number.NEGATIVE_INFINITY);
    expect(report.warnings.join('\n')).toContain('non-finite nonlinear-acceleration preview cell');
    expect(report.mediumChangedFieldCount).toBe(0);
  });

  it('propagates force preview warnings while keeping acceleration preview read-only', () => {
    const medium = createWaveCapableMediumState({ width: 1, height: 1, boundaryMode: 'torus' });
    medium.mediumRealField[0] = Number.NaN;

    const report = deriveNonlinearPotentialAccelerationPreview({
      mediumState: medium,
      config: {
        width: 1,
        height: 1,
        boundaryMode: 'torus',
        localQuadraticCoefficient: -1,
        localQuarticCoefficient: -1,
        previewForceScale: -1,
        previewMass: 0,
      },
    });

    expect(report.finiteCellCount).toBe(1);
    expect(report.nonFiniteCellCount).toBe(0);
    expect(report.forcePreview.nonFiniteCellCount).toBe(1);
    expect(report.warnings.join('\n')).toContain('non-finite nonlinear-potential cell');
    expect(report.warnings.join('\n')).toContain('Local quadratic coefficient is negative');
    expect(report.warnings.join('\n')).toContain('Local quartic coefficient is negative');
    expect(report.warnings.join('\n')).toContain('Negative preview force scale was clamped to 0.');
    expect(report.warnings.join('\n')).toContain('Non-positive preview mass was clamped to 1.');
    expect(report.mediumChangedFieldCount).toBe(0);
    expect(medium.tick).toBe(0);
  });

  it('does not include result-coded coherence identifiers in nonlinear acceleration preview source files', () => {
    const source = [
      readFileSync('src/types/nonlinearPotentialField.ts', 'utf8'),
      readFileSync('src/observer/nonlinearPotentialFieldPreparation.ts', 'utf8'),
      readFileSync('src/observer/nonlinearPotentialForcePreview.ts', 'utf8'),
      readFileSync('src/observer/nonlinearPotentialAccelerationPreview.ts', 'utf8'),
    ].join('\n');

    for (const term of forbiddenResultTerms) {
      expect(source.toLowerCase()).not.toContain(term.toLowerCase());
    }
  });
});
