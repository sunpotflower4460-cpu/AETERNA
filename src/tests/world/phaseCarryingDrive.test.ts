import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  createPhaseCarryingDriveState,
  derivePhaseCarryingDriveDiagnostic,
} from '../../world/phaseCarryingDrive.ts';

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

describe('phase-carrying drive state', () => {
  it('creates zero complex drive fields with deterministic seeded spatial phase by default', () => {
    const first = createPhaseCarryingDriveState({
      width: 3,
      height: 3,
      boundaryMode: 'torus',
      phaseSeed: 42,
    });
    const second = createPhaseCarryingDriveState({
      width: 3,
      height: 3,
      boundaryMode: 'torus',
      phaseSeed: 42,
    });

    expect(first.state.driveRealField.length).toBe(9);
    expect(first.state.driveImagField.length).toBe(9);
    expect(Array.from(first.state.driveRealField)).toEqual(new Array(9).fill(0));
    expect(Array.from(first.state.driveImagField)).toEqual(new Array(9).fill(0));
    expect(Array.from(first.state.spatialPhaseField)).toEqual(Array.from(second.state.spatialPhaseField));
    expect(first.report.spatialPhaseMode).toBe('seededNoise');
    expect(first.report.allSpatialPhaseSamplesEqual).toBe(false);
    expect(first.report.metricKind).toBe('derived');
  });

  it('uses a center-point injection mask by default instead of full-field injection', () => {
    const result = createPhaseCarryingDriveState({
      width: 3,
      height: 3,
      boundaryMode: 'torus',
      phaseSeed: 1,
    });

    expect(result.report.injectionMaskMode).toBe('centerPoint');
    expect(result.report.activeInjectionCellCount).toBe(1);
    expect(result.report.injectionMaskTotal).toBe(1);
    expect(result.report.fullInjectionMask).toBe(false);
    expect(result.report.zeroInjectionMask).toBe(false);
    expect(Array.from(result.state.injectionMask)).toEqual([
      0, 0, 0,
      0, 1, 0,
      0, 0, 0,
    ]);
  });

  it('accepts provided spatial phase and injection mask while normalizing values', () => {
    const result = createPhaseCarryingDriveState({
      width: 2,
      height: 2,
      boundaryMode: 'torus',
      spatialPhaseField: [-0.25, 0, 1.25, Number.NaN],
      injectionMask: [-1, 0.25, 2, Number.NaN],
    });

    expect(result.report.spatialPhaseMode).toBe('provided');
    expect(result.report.injectionMaskMode).toBe('provided');
    expect(Array.from(result.state.spatialPhaseField)).toEqual([0.75, 0, 0.25, 0]);
    expect(Array.from(result.state.injectionMask)).toEqual([0, 0.25, 1, 0]);
    expect(result.report.activeInjectionCellCount).toBe(2);
    expect(result.report.injectionMaskTotal).toBe(1.25);
  });

  it('warns when a provided phase field is all same-phase', () => {
    const result = createPhaseCarryingDriveState({
      width: 2,
      height: 2,
      boundaryMode: 'torus',
      spatialPhaseField: [0.5, 0.5, 0.5, 0.5],
    });

    expect(result.report.allSpatialPhaseSamplesEqual).toBe(true);
    expect(result.report.warnings.join('\n')).toContain('All spatial phase samples are equal');
  });

  it('warns when a provided injection mask covers every cell', () => {
    const result = createPhaseCarryingDriveState({
      width: 2,
      height: 2,
      boundaryMode: 'torus',
      injectionMask: [1, 1, 1, 1],
    });

    expect(result.report.fullInjectionMask).toBe(true);
    expect(result.report.warnings.join('\n')).toContain('Injection mask covers every cell');
  });

  it('warns when a provided injection mask has no active cells', () => {
    const result = createPhaseCarryingDriveState({
      width: 2,
      height: 2,
      boundaryMode: 'torus',
      injectionMask: [0, 0, 0, 0],
    });

    expect(result.report.zeroInjectionMask).toBe(true);
    expect(result.report.warnings.join('\n')).toContain('Injection mask has no active cells');
  });

  it('derives drive diagnostics without mutating the drive state', () => {
    const result = createPhaseCarryingDriveState({
      width: 2,
      height: 2,
      boundaryMode: 'torus',
      spatialPhaseField: [0, 0.25, 0.5, 0.75],
      injectionMask: [1, 0.5, 0, 0],
    });
    result.state.driveRealField[0] = 3;
    result.state.driveImagField[1] = 4;

    const beforeReal = Array.from(result.state.driveRealField);
    const beforeImag = Array.from(result.state.driveImagField);
    const diagnostic = derivePhaseCarryingDriveDiagnostic(result.state);

    expect(diagnostic.driveMagnitudeTotal).toBe(7);
    expect(diagnostic.driveMagnitudeMax).toBe(4);
    expect(diagnostic.activeInjectionCellCount).toBe(2);
    expect(diagnostic.injectionMaskTotal).toBe(1.5);
    expect(diagnostic.phaseSpread).toBe(0.75);
    expect(diagnostic.metricKind).toBe('derived');
    expect(Array.from(result.state.driveRealField)).toEqual(beforeReal);
    expect(Array.from(result.state.driveImagField)).toEqual(beforeImag);
  });

  it('does not include result-coded coherence identifiers in phase-carrying drive source files', () => {
    const source = [
      readFileSync('src/types/phaseCarryingDrive.ts', 'utf8'),
      readFileSync('src/world/phaseCarryingDrive.ts', 'utf8'),
    ].join('\n');

    for (const term of forbiddenResultTerms) {
      expect(source.toLowerCase()).not.toContain(term.toLowerCase());
    }
  });
});
