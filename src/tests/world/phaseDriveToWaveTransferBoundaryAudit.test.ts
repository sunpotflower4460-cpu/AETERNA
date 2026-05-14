import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { derivePhaseDriveToWaveTransferSkeleton } from '../../observer/phaseDriveToWaveTransferSkeleton.ts';
import { derivePhaseDriveToWaveWorkTermPreview } from '../../observer/phaseDriveToWaveWorkTermPreview.ts';
import {
  createPhaseCarryingDriveState,
  updatePeriodicPhaseDrive,
} from '../../world/phaseCarryingDrive.ts';
import { applyPhaseDriveToWaveTransfer } from '../../world/phaseDriveToWaveAppliedTransfer.ts';
import { createWaveCapableMediumState } from '../../world/waveCapableMedium.ts';
import type { PhaseCarryingDriveState } from '../../types/phaseCarryingDrive.ts';
import type { WaveCapableMediumConfig, WaveCapableMediumState } from '../../types/waveCapableMedium.ts';

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

function makeDrive(): PhaseCarryingDriveState {
  const drive = createPhaseCarryingDriveState({
    width: 2,
    height: 2,
    boundaryMode: 'torus',
    spatialPhaseField: [0, 0, 0, 0],
    injectionMask: [1, 0.5, 0, 0],
  });

  return updatePeriodicPhaseDrive(drive.state, {
    periodTicks: 8,
    driveAmplitude: 2,
  }).state;
}

function makeMedium(): WaveCapableMediumState {
  return createWaveCapableMediumState(
    { width: 2, height: 2, boundaryMode: 'torus' },
    {
      mediumRealField: [1, -0.5, 0.25, 0],
      mediumImagField: [0.25, 0, -0.25, 0.5],
      mediumRealVelocityField: [0.1, 0, 0, 0],
      mediumImagVelocityField: [0, -0.1, 0, 0],
      waveEnergyDissipationField: [0.01, 0.02, 0, 0],
      waveEnergyResidueField: [0, 0.03, 0, 0],
      waveEnergyOutflowField: [0, 0, 0.04, 0],
    },
  );
}

function snapshotMediumFields(state: WaveCapableMediumState) {
  return {
    mediumRealField: Array.from(state.mediumRealField),
    mediumImagField: Array.from(state.mediumImagField),
    mediumRealVelocityField: Array.from(state.mediumRealVelocityField),
    mediumImagVelocityField: Array.from(state.mediumImagVelocityField),
    waveEnergyDissipationField: Array.from(state.waveEnergyDissipationField),
    waveEnergyResidueField: Array.from(state.waveEnergyResidueField),
    waveEnergyOutflowField: Array.from(state.waveEnergyOutflowField),
    tick: state.tick,
  };
}

describe('phase drive to wave transfer boundary audit', () => {
  it('keeps skeleton and preview observer paths read-only even when requested coupling is nonzero', () => {
    const drive = makeDrive();
    const medium = makeMedium();
    const before = snapshotMediumFields(medium);

    const skeleton = derivePhaseDriveToWaveTransferSkeleton({
      driveState: drive,
      mediumState: medium,
      mediumConfig,
      transferConfig: { driveCoupling: 0.9, tolerance: 1e-9 },
    });
    const preview = derivePhaseDriveToWaveWorkTermPreview({
      driveState: drive,
      mediumState: medium,
      mediumConfig,
      transferConfig: { driveCoupling: 0.9, tolerance: 1e-9 },
    });

    expect(snapshotMediumFields(medium)).toEqual(before);

    expect(skeleton.effectiveDriveCoupling).toBe(0);
    expect(skeleton.mediumInputEnergy).toBe(0);
    expect(skeleton.mediumChangedFieldCount).toBe(0);
    expect(skeleton.ledger.status).toBe('closed');

    expect(preview.previewWorkTermEnergy).toBeGreaterThan(0);
    expect(preview.actualMediumInputEnergy).toBe(0);
    expect(preview.mediumChangedFieldCount).toBe(0);
    expect(preview.ledger.status).toBe('closed');
  });

  it('keeps applied transfer constrained to cloned velocity fields only', () => {
    const drive = makeDrive();
    const medium = makeMedium();
    const before = snapshotMediumFields(medium);

    const result = applyPhaseDriveToWaveTransfer({
      driveState: drive,
      mediumState: medium,
      mediumConfig,
      transferConfig: { driveCoupling: 0.2, tolerance: 1e-9 },
    });
    const after = snapshotMediumFields(result.state);

    expect(snapshotMediumFields(medium)).toEqual(before);
    expect(result.state).not.toBe(medium);

    expect(after.mediumRealField).toEqual(before.mediumRealField);
    expect(after.mediumImagField).toEqual(before.mediumImagField);
    expect(after.waveEnergyDissipationField).toEqual(before.waveEnergyDissipationField);
    expect(after.waveEnergyResidueField).toEqual(before.waveEnergyResidueField);
    expect(after.waveEnergyOutflowField).toEqual(before.waveEnergyOutflowField);

    expect(after.mediumRealVelocityField).not.toEqual(before.mediumRealVelocityField);
    expect(after.mediumImagVelocityField).not.toEqual(before.mediumImagVelocityField);
    expect(after.tick).toBe(before.tick + 1);

    expect(result.report.mediumInputEnergy).toBeCloseTo(result.report.mediumEnergyDelta, 12);
    expect(result.report.ledger.status).toBe('closed');
  });

  it('keeps transfer implementation source free of internal-buffer and target-order coupling', () => {
    const source = [
      readFileSync('src/observer/phaseDriveToWaveTransferSkeleton.ts', 'utf8'),
      readFileSync('src/observer/phaseDriveToWaveWorkTermPreview.ts', 'utf8'),
      readFileSync('src/world/phaseDriveToWaveAppliedTransfer.ts', 'utf8'),
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

    expect(source).not.toMatch(/nextState\.mediumRealField\s*\[/);
    expect(source).not.toMatch(/nextState\.mediumImagField\s*\[/);
  });
});
