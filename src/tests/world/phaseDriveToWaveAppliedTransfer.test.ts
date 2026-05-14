import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  createPhaseCarryingDriveState,
  updatePeriodicPhaseDrive,
} from '../../world/phaseCarryingDrive.ts';
import { applyPhaseDriveToWaveTransfer } from '../../world/phaseDriveToWaveAppliedTransfer.ts';
import { createWaveCapableMediumState } from '../../world/waveCapableMedium.ts';
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

describe('phase drive to wave applied transfer', () => {
  it('applies a small work term into wave velocity and closes the medium ledger', () => {
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

    const result = applyPhaseDriveToWaveTransfer({
      driveState: periodicDrive.state,
      mediumState: medium,
      mediumConfig,
      transferConfig: {
        driveCoupling: 0.2,
        tolerance: 1e-9,
      },
    });

    const report = result.report;

    expect(report.source).toBe('phase-drive-to-wave-applied-transfer');
    expect(report.requestedDriveCoupling).toBe(0.2);
    expect(report.effectiveDriveCoupling).toBe(0.2);
    expect(report.driveObservation.driveEnergyTotal).toBeCloseTo(2.5, 12);
    expect(report.candidateMaskedDriveEnergy).toBeCloseTo(2.25, 12);
    expect(report.requestedWorkTermEnergy).toBeCloseTo(0.45, 12);
    expect(report.appliedWorkTermEnergy).toBeCloseTo(0.45, 12);
    expect(report.mediumInputEnergy).toBeCloseTo(0.45, 12);
    expect(report.mediumEnergyDelta).toBeCloseTo(0.45, 12);
    expect(report.mediumEnergyBefore.totalEnergy).toBe(0);
    expect(report.mediumEnergyAfter.totalEnergy).toBeCloseTo(0.45, 12);
    expect(report.driveDirectionEnergyProxy).toBeCloseTo(2.25, 12);
    expect(report.velocityKickScale).toBeCloseTo(Math.sqrt(0.2), 12);
    expect(report.mediumChangedFieldCount).toBeGreaterThan(0);
    expect(report.ledger.status).toBe('closed');
    expect(report.ledger.inputEnergy).toBeCloseTo(0.45, 12);
    expect(report.ledger.internalAccumulationDelta).toBeCloseTo(0.45, 12);
    expect(report.ledger.conservationResidual).toBeCloseTo(0, 12);
    expect(result.state.tick).toBe(1);
  });

  it('keeps zero coupling as a no-op applied transfer with a closed ledger', () => {
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

    const result = applyPhaseDriveToWaveTransfer({
      driveState: periodicDrive.state,
      mediumState: medium,
      mediumConfig,
      transferConfig: {
        driveCoupling: 0,
        tolerance: 1e-9,
      },
    });

    expect(result.report.requestedWorkTermEnergy).toBe(0);
    expect(result.report.appliedWorkTermEnergy).toBe(0);
    expect(result.report.mediumInputEnergy).toBe(0);
    expect(result.report.mediumEnergyDelta).toBe(0);
    expect(result.report.mediumChangedFieldCount).toBe(0);
    expect(result.report.ledger.status).toBe('closed');
    expect(result.state.tick).toBe(1);
  });

  it('separates requested coupling from effective applied coupling', () => {
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

    const aboveUnit = applyPhaseDriveToWaveTransfer({
      driveState: periodicDrive.state,
      mediumState: medium,
      mediumConfig,
      transferConfig: {
        driveCoupling: 2,
        tolerance: 1e-9,
      },
    });

    expect(aboveUnit.report.requestedDriveCoupling).toBe(2);
    expect(aboveUnit.report.effectiveDriveCoupling).toBe(1);
    expect(aboveUnit.report.candidateMaskedDriveEnergy).toBeCloseTo(2, 12);
    expect(aboveUnit.report.requestedWorkTermEnergy).toBeCloseTo(2, 12);
    expect(aboveUnit.report.appliedWorkTermEnergy).toBeCloseTo(2, 12);
    expect(aboveUnit.report.appliedWorkTermEnergy).toBeLessThanOrEqual(
      aboveUnit.report.candidateMaskedDriveEnergy + 1e-9,
    );
    expect(aboveUnit.report.warnings.join('\n')).toContain('clamped to [0, 1]');

    const negative = applyPhaseDriveToWaveTransfer({
      driveState: periodicDrive.state,
      mediumState: medium,
      mediumConfig,
      transferConfig: {
        driveCoupling: -1,
        tolerance: 1e-9,
      },
    });

    expect(negative.report.requestedDriveCoupling).toBe(-1);
    expect(negative.report.effectiveDriveCoupling).toBe(0);
    expect(negative.report.appliedWorkTermEnergy).toBe(0);
    expect(negative.report.warnings.join('\n')).toContain('clamped to [0, 1]');
  });

  it('does not mutate the original drive or medium state', () => {
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
    const beforeMediumRealVelocity = Array.from(medium.mediumRealVelocityField);
    const beforeMediumImagVelocity = Array.from(medium.mediumImagVelocityField);

    const result = applyPhaseDriveToWaveTransfer({
      driveState: periodicDrive.state,
      mediumState: medium,
      mediumConfig,
      transferConfig: {
        driveCoupling: 0.2,
        tolerance: 1e-9,
      },
    });

    expect(Array.from(periodicDrive.state.driveRealField)).toEqual(beforeDriveReal);
    expect(Array.from(periodicDrive.state.driveImagField)).toEqual(beforeDriveImag);
    expect(Array.from(medium.mediumRealField)).toEqual(beforeMediumReal);
    expect(Array.from(medium.mediumImagField)).toEqual(beforeMediumImag);
    expect(Array.from(medium.mediumRealVelocityField)).toEqual(beforeMediumRealVelocity);
    expect(Array.from(medium.mediumImagVelocityField)).toEqual(beforeMediumImagVelocity);
    expect(medium.tick).toBe(0);
    expect(result.state).not.toBe(medium);
    expect(result.state.tick).toBe(1);
  });

  it('does not include result-coded coherence identifiers in applied transfer source files', () => {
    const source = [
      readFileSync('src/types/phaseDriveToWaveTransfer.ts', 'utf8'),
      readFileSync('src/world/phaseDriveToWaveAppliedTransfer.ts', 'utf8'),
    ].join('\n');

    for (const term of forbiddenResultTerms) {
      expect(source.toLowerCase()).not.toContain(term.toLowerCase());
    }
  });
});
