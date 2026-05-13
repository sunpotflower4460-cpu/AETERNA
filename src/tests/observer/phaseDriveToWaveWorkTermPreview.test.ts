import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  createPhaseCarryingDriveState,
  updatePeriodicPhaseDrive,
} from '../../world/phaseCarryingDrive.ts';
import { createWaveCapableMediumState } from '../../world/waveCapableMedium.ts';
import { derivePhaseDriveToWaveWorkTermPreview } from '../../observer/phaseDriveToWaveWorkTermPreview.ts';
import type { WaveCapableMediumConfig } from '../../types/waveCapableMedium.ts';

const mediumConfig: WaveCapableMediumConfig = {
  width: 2,
  height: 2,
  boundaryMode: 'torus',
  localElasticCoupling: 1,
  localWaveDamping: 0,
  amplitudeClamp: 10,
  dt: 1,
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

describe('phase drive to wave work term preview', () => {
  it('computes preview work from effective coupling and masked drive energy without applying it', () => {
    const drive = createPhaseCarryingDriveState({
      width: 2,
      height: 2,
      boundaryMode: 'torus',
      spatialPhaseField: [0, 0, 0, 0],
      injectionMask: [1, 0.5, 0, 0],
    });
    const periodicDrive = updatePeriodicPhaseDrive(drive.state, {
      periodTicks: 8,
      driveAmplitude: 2,
    });
    const medium = createWaveCapableMediumState({ width: 2, height: 2, boundaryMode: 'torus' });

    const report = derivePhaseDriveToWaveWorkTermPreview({
      driveState: periodicDrive.state,
      mediumState: medium,
      mediumConfig,
      transferConfig: {
        driveCoupling: 0.2,
        tolerance: 1e-9,
      },
    });

    expect(report.source).toBe('phase-drive-to-wave-work-term-preview');
    expect(report.requestedDriveCoupling).toBe(0.2);
    expect(report.effectiveDriveCoupling).toBe(0.2);
    expect(report.driveObservation.driveEnergyTotal).toBeCloseTo(2.5, 12);
    expect(report.candidateMaskedDriveEnergy).toBeCloseTo(2.25, 12);
    expect(report.previewWorkTermEnergy).toBeCloseTo(0.45, 12);
    expect(report.previewMediumInputEnergy).toBeCloseTo(0.45, 12);
    expect(report.actualTransferredEnergy).toBe(0);
    expect(report.actualMediumInputEnergy).toBe(0);
    expect(report.mediumChangedFieldCount).toBe(0);
    expect(report.mediumEnergyBefore.totalEnergy).toBe(0);
    expect(report.mediumEnergyAfter.totalEnergy).toBe(0);
    expect(report.ledger.status).toBe('closed');
    expect(report.ledger.conservationResidual).toBe(0);
    expect(report.metricKind).toBe('check');
    expect(report.warnings.join('\n')).toContain('Preview work term is nonzero but not applied');
    expect(report.warnings.join('\n')).toContain('actual medium input remains zero');
  });

  it('keeps zero coupling as a closed no-application preview', () => {
    const drive = createPhaseCarryingDriveState({
      width: 2,
      height: 2,
      boundaryMode: 'torus',
      spatialPhaseField: [0, 0, 0, 0],
      injectionMask: [1, 0, 0, 0],
    });
    const periodicDrive = updatePeriodicPhaseDrive(drive.state, {
      periodTicks: 8,
      driveAmplitude: 2,
    });
    const medium = createWaveCapableMediumState({ width: 2, height: 2, boundaryMode: 'torus' });

    const report = derivePhaseDriveToWaveWorkTermPreview({
      driveState: periodicDrive.state,
      mediumState: medium,
      mediumConfig,
      transferConfig: {
        driveCoupling: 0,
        tolerance: 1e-9,
      },
    });

    expect(report.effectiveDriveCoupling).toBe(0);
    expect(report.candidateMaskedDriveEnergy).toBeCloseTo(2, 12);
    expect(report.previewWorkTermEnergy).toBe(0);
    expect(report.previewMediumInputEnergy).toBe(0);
    expect(report.actualMediumInputEnergy).toBe(0);
    expect(report.ledger.status).toBe('closed');
  });

  it('normalizes negative or non-finite requested coupling for preview math', () => {
    const drive = createPhaseCarryingDriveState({
      width: 2,
      height: 2,
      boundaryMode: 'torus',
      spatialPhaseField: [0, 0, 0, 0],
      injectionMask: [1, 0, 0, 0],
    });
    const periodicDrive = updatePeriodicPhaseDrive(drive.state, {
      periodTicks: 8,
      driveAmplitude: 2,
    });
    const medium = createWaveCapableMediumState({ width: 2, height: 2, boundaryMode: 'torus' });

    const negativeReport = derivePhaseDriveToWaveWorkTermPreview({
      driveState: periodicDrive.state,
      mediumState: medium,
      mediumConfig,
      transferConfig: {
        driveCoupling: -1,
        tolerance: 1e-9,
      },
    });

    expect(negativeReport.requestedDriveCoupling).toBe(0);
    expect(negativeReport.effectiveDriveCoupling).toBe(0);
    expect(negativeReport.previewWorkTermEnergy).toBe(0);
    expect(negativeReport.warnings.join('\n')).toContain('normalized for preview math');

    const nonFiniteReport = derivePhaseDriveToWaveWorkTermPreview({
      driveState: periodicDrive.state,
      mediumState: medium,
      mediumConfig,
      transferConfig: {
        driveCoupling: Number.NaN,
        tolerance: 1e-9,
      },
    });

    expect(nonFiniteReport.requestedDriveCoupling).toBe(0);
    expect(nonFiniteReport.effectiveDriveCoupling).toBe(0);
    expect(nonFiniteReport.previewWorkTermEnergy).toBe(0);
    expect(nonFiniteReport.warnings.join('\n')).toContain('normalized for preview math');
  });

  it('does not mutate drive or medium state', () => {
    const drive = createPhaseCarryingDriveState({
      width: 2,
      height: 2,
      boundaryMode: 'torus',
      spatialPhaseField: [0, 0.25, 0.5, 0.75],
      injectionMask: [1, 1, 0, 0],
    });
    const periodicDrive = updatePeriodicPhaseDrive(drive.state, {
      periodTicks: 4,
      driveAmplitude: 2,
    });
    const medium = createWaveCapableMediumState(
      { width: 2, height: 2, boundaryMode: 'torus' },
      { mediumRealField: [1, 0, 0, 0] },
    );
    const beforeDriveReal = Array.from(periodicDrive.state.driveRealField);
    const beforeDriveImag = Array.from(periodicDrive.state.driveImagField);
    const beforeMediumReal = Array.from(medium.mediumRealField);
    const beforeMediumImag = Array.from(medium.mediumImagField);

    derivePhaseDriveToWaveWorkTermPreview({
      driveState: periodicDrive.state,
      mediumState: medium,
      mediumConfig,
      transferConfig: {
        driveCoupling: 0.5,
        tolerance: 1e-9,
      },
    });

    expect(Array.from(periodicDrive.state.driveRealField)).toEqual(beforeDriveReal);
    expect(Array.from(periodicDrive.state.driveImagField)).toEqual(beforeDriveImag);
    expect(Array.from(medium.mediumRealField)).toEqual(beforeMediumReal);
    expect(Array.from(medium.mediumImagField)).toEqual(beforeMediumImag);
    expect(medium.tick).toBe(0);
  });

  it('does not include result-coded coherence identifiers in preview source files', () => {
    const source = [
      readFileSync('src/types/phaseDriveToWaveTransfer.ts', 'utf8'),
      readFileSync('src/observer/phaseDriveToWaveWorkTermPreview.ts', 'utf8'),
    ].join('\n');

    for (const term of forbiddenResultTerms) {
      expect(source.toLowerCase()).not.toContain(term.toLowerCase());
    }
  });
});
