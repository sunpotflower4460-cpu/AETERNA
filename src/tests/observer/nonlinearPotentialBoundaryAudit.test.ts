import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { deriveNonlinearPotentialBoundaryAudit } from '../../observer/nonlinearPotentialBoundaryAudit.ts';
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

describe('nonlinear potential boundary audit', () => {
  it('passes when the nonlinear preview chain stays read-only and numerically finite', () => {
    const medium = createWaveCapableMediumState(
      { width: 2, height: 2, boundaryMode: 'torus' },
      {
        mediumRealField: [1, 0, 2, 0],
        mediumImagField: [0, 1, 0, 0],
        mediumRealVelocityField: [0.5, 0, 0, 0],
        mediumImagVelocityField: [0, 0.25, 0, 0],
        waveEnergyDissipationField: [0.01, 0, 0, 0],
        waveEnergyResidueField: [0, 0.02, 0, 0],
        waveEnergyOutflowField: [0, 0, 0.03, 0],
      },
    );
    const before = snapshotMedium(medium);

    const report = deriveNonlinearPotentialBoundaryAudit({ mediumState: medium, config });

    expect(snapshotMedium(medium)).toEqual(before);
    expect(report.source).toBe('nonlinear-potential-boundary-audit');
    expect(report.boundaryAuditStatus).toBe('pass');
    expect(report.appliedRuntimeReady).toBe(false);
    expect(report.mediumFieldChangeCount).toBe(0);
    expect(report.previewReportChangeCount).toBe(0);
    expect(report.boundaryViolationCount).toBe(0);
    expect(report.numericWarningCount).toBe(0);
    expect(report.mediumChangedFieldCount).toBe(0);
    expect(report.metricKind).toBe('derived');
    expect(report.findings.join('\n')).toContain('Medium fields remained unchanged');
    expect(report.findings.join('\n')).toContain('Applied nonlinear runtime remains locked');
  });

  it('warns when the preview chain stays read-only but produces non-finite diagnostics', () => {
    const medium = createWaveCapableMediumState(
      { width: 1, height: 1, boundaryMode: 'torus' },
      { mediumRealField: [Number.MAX_VALUE], mediumImagField: [0] },
    );
    const before = snapshotMedium(medium);

    const report = deriveNonlinearPotentialBoundaryAudit({
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

    expect(snapshotMedium(medium)).toEqual(before);
    expect(report.boundaryAuditStatus).toBe('warning');
    expect(report.boundaryViolationCount).toBe(0);
    expect(report.mediumFieldChangeCount).toBe(0);
    expect(report.previewReportChangeCount).toBe(0);
    expect(report.numericWarningCount).toBeGreaterThan(0);
    expect(report.warnings.join('\n')).toContain('non-finite nonlinear-acceleration preview cell');
    expect(report.appliedRuntimeReady).toBe(false);
  });

  it('warns when configuration normalization creates preview warnings without boundary violations', () => {
    const medium = createWaveCapableMediumState(
      { width: 1, height: 1, boundaryMode: 'torus' },
      { mediumRealField: [1], mediumImagField: [0] },
    );

    const report = deriveNonlinearPotentialBoundaryAudit({
      mediumState: medium,
      config: {
        width: 1,
        height: 1,
        boundaryMode: 'torus',
        localQuadraticCoefficient: 2,
        localQuarticCoefficient: 0,
        previewForceScale: -1,
        previewMass: 0,
      },
    });

    expect(report.boundaryAuditStatus).toBe('warning');
    expect(report.boundaryViolationCount).toBe(0);
    expect(report.numericWarningCount).toBe(0);
    expect(report.warnings.join('\n')).toContain('Negative preview force scale was clamped to 0.');
    expect(report.warnings.join('\n')).toContain('Non-positive preview mass was clamped to 1.');
    expect(report.appliedRuntimeReady).toBe(false);
  });

  it('does not include result-coded or internal-buffer identifiers in nonlinear potential source files', () => {
    const source = [
      readFileSync('src/types/nonlinearPotentialField.ts', 'utf8'),
      readFileSync('src/observer/nonlinearPotentialFieldPreparation.ts', 'utf8'),
      readFileSync('src/observer/nonlinearPotentialForcePreview.ts', 'utf8'),
      readFileSync('src/observer/nonlinearPotentialAccelerationPreview.ts', 'utf8'),
      readFileSync('src/observer/nonlinearPotentialBoundaryAudit.ts', 'utf8'),
    ].join('\n');

    for (const term of forbiddenResultTerms) {
      expect(source.toLowerCase()).not.toContain(term.toLowerCase());
    }

    const forbiddenBoundaryTerms = [
      'AeternaNetwork',
      'SpatialWorldMedium',
      'centerBuffer',
      'internalBuffer',
      'center-buffer',
      'internal buffer',
    ];

    for (const term of forbiddenBoundaryTerms) {
      expect(source).not.toContain(term);
    }
  });
});
