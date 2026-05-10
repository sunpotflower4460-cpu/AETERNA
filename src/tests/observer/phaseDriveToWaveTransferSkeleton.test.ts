import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  createPhaseCarryingDriveState,
  updatePeriodicPhaseDrive,
} from '../../world/phaseCarryingDrive.ts';
import { createWaveCapableMediumState } from '../../world/waveCapableMedium.ts';
import { derivePhaseDriveToWaveTransferSkeleton } from '../../observer/phaseDriveToWaveTransferSkeleton.ts';
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

describe('phase drive to wave transfer skeleton', () => {
  it('keeps effective drive coupling zero and closes the medium ledger', () => {
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

    const report = derivePhaseDriveToWaveTransferSkeleton({
      driveState: periodicDrive.state,
      mediumState: medium,
      mediumConfig,
      transferConfig: {
        driveCoupling: 0,
        tolerance: 1e-9,
      },
    });

    expect(report.source).toBe('phase-drive-to-wave-transfer-skeleton');
    expect(report.requestedDriveCoupling).toBe(0);
    expect(report.effectiveDriveCoupling).toBe(0);
    expect(report.transferredEnergy).toBe(0);
    expect(report.mediumInputEnergy).toBe(0);
    expect(report.mediumChangedFieldCount).toBe(0);
    expect(report.mediumEnergyBefore.totalEnergy).toBe(0);
    expect(report.mediumEnergyAfter.totalEnergy).toBe(0);
    expect(report.ledger.status).toBe('closed');
    expect(report.ledger.conservationResidual).toBe(0);
    expect(report.metricKind).toBe('check');
  });

  it('keeps candidate drive energy diagnostic separate from transferred energy', () => {
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

    const report = derivePhaseDriveToWaveTransferSkeleton({
      driveState: periodicDrive.state,
      mediumState: medium,
      mediumConfig,
      transferConfig: {
        driveCoupling: 0,
        tolerance: 1e-9,
      },
    });

    expect(report.driveObservation.driveEnergyTotal).toBeCloseTo(2.5, 12);
    expect(report.candidateMaskedDriveEnergy).toBeCloseTo(2.125, 12);
    expect(report.transferredEnergy).toBe(0);
    expect(report.mediumInputEnergy).toBe(0);
    expect(report.warnings.join('\n')).toContain('Masked drive energy is diagnostic only');
  });

  it('records requested coupling but does not apply it in the skeleton phase', () => {
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

    const report = derivePhaseDriveToWaveTransferSkeleton({
      driveState: periodicDrive.state,
      mediumState: medium,
      mediumConfig,
      transferConfig: {
        driveCoupling: 1,
        tolerance: 1e-9,
      },
    });

    expect(report.requestedDriveCoupling).toBe(1);
    expect(report.effectiveDriveCoupling).toBe(0);
    expect(report.transferredEnergy).toBe(0);
    expect(report.warnings.join('\n')).toContain('effective coupling remains zero');
    expect(report.ledger.status).toBe('closed');
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
    const beforeMediumReal = Array.from(medium.mediumRealField);

    derivePhaseDriveToWaveTransferSkeleton({
      driveState: periodicDrive.state,
      mediumState: medium,
      mediumConfig,
      transferConfig: {
        driveCoupling: 1,
        tolerance: 1e-9,
      },
    });

    expect(Array.from(periodicDrive.state.driveRealField)).toEqual(beforeDriveReal);
    expect(Array.from(medium.mediumRealField)).toEqual(beforeMediumReal);
    expect(medium.tick).toBe(0);
  });

  it('does not include result-coded coherence identifiers in transfer skeleton source files', () => {
    const source = [
      readFileSync('src/types/phaseDriveToWaveTransfer.ts', 'utf8'),
      readFileSync('src/observer/phaseDriveToWaveTransferSkeleton.ts', 'utf8'),
    ].join('\n');

    for (const term of forbiddenResultTerms) {
      expect(source.toLowerCase()).not.toContain(term.toLowerCase());
    }
  });
});
