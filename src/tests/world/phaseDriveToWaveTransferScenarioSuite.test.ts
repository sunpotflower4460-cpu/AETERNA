import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
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

const oneCellMediumConfig: WaveCapableMediumConfig = {
  width: 1,
  height: 1,
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

function makePeriodicDrive(options?: {
  injectionMask?: number[];
  spatialPhaseField?: number[];
  driveAmplitude?: number;
  width?: number;
  height?: number;
}): PhaseCarryingDriveState {
  const width = options?.width ?? 2;
  const height = options?.height ?? 2;
  const drive = createPhaseCarryingDriveState({
    width,
    height,
    boundaryMode: 'torus',
    spatialPhaseField: options?.spatialPhaseField ?? [0, 0, 0, 0].slice(0, width * height),
    injectionMask: options?.injectionMask ?? [1, 0.5, 0, 0].slice(0, width * height),
  });

  return updatePeriodicPhaseDrive(drive.state, {
    periodTicks: 8,
    driveAmplitude: options?.driveAmplitude ?? 2,
  }).state;
}

function makeMedium(options?: Parameters<typeof createWaveCapableMediumState>[1]): WaveCapableMediumState {
  return createWaveCapableMediumState({ width: 2, height: 2, boundaryMode: 'torus' }, options);
}

describe('phase drive to wave transfer scenario suite', () => {
  it('compares preview-only and applied transfer for the same nonzero work term', () => {
    const drive = makePeriodicDrive();
    const medium = makeMedium();

    const preview = derivePhaseDriveToWaveWorkTermPreview({
      driveState: drive,
      mediumState: medium,
      mediumConfig,
      transferConfig: { driveCoupling: 0.2, tolerance: 1e-9 },
    });
    const applied = applyPhaseDriveToWaveTransfer({
      driveState: drive,
      mediumState: medium,
      mediumConfig,
      transferConfig: { driveCoupling: 0.2, tolerance: 1e-9 },
    }).report;

    expect(preview.candidateMaskedDriveEnergy).toBeCloseTo(2.25, 12);
    expect(preview.previewWorkTermEnergy).toBeCloseTo(0.45, 12);
    expect(preview.actualMediumInputEnergy).toBe(0);
    expect(preview.mediumChangedFieldCount).toBe(0);
    expect(preview.ledger.status).toBe('closed');

    expect(applied.candidateMaskedDriveEnergy).toBeCloseTo(2.25, 12);
    expect(applied.requestedWorkTermEnergy).toBeCloseTo(preview.previewWorkTermEnergy, 12);
    expect(applied.mediumInputEnergy).toBeCloseTo(0.45, 12);
    expect(applied.mediumEnergyDelta).toBeCloseTo(0.45, 12);
    expect(applied.mediumChangedFieldCount).toBeGreaterThan(0);
    expect(applied.ledger.status).toBe('closed');
  });

  it('keeps zero coupling closed in both preview and applied modes', () => {
    const drive = makePeriodicDrive({ injectionMask: [1, 0, 0, 0] });
    const medium = makeMedium();

    const preview = derivePhaseDriveToWaveWorkTermPreview({
      driveState: drive,
      mediumState: medium,
      mediumConfig,
      transferConfig: { driveCoupling: 0, tolerance: 1e-9 },
    });
    const applied = applyPhaseDriveToWaveTransfer({
      driveState: drive,
      mediumState: medium,
      mediumConfig,
      transferConfig: { driveCoupling: 0, tolerance: 1e-9 },
    }).report;

    expect(preview.previewWorkTermEnergy).toBe(0);
    expect(preview.actualMediumInputEnergy).toBe(0);
    expect(preview.mediumChangedFieldCount).toBe(0);
    expect(preview.ledger.status).toBe('closed');

    expect(applied.requestedWorkTermEnergy).toBe(0);
    expect(applied.mediumInputEnergy).toBe(0);
    expect(applied.mediumEnergyDelta).toBe(0);
    expect(applied.mediumChangedFieldCount).toBe(0);
    expect(applied.ledger.status).toBe('closed');
  });

  it('clamps high requested coupling consistently while separating requested and effective values', () => {
    const drive = makePeriodicDrive({ injectionMask: [1, 0, 0, 0] });
    const medium = makeMedium();

    const preview = derivePhaseDriveToWaveWorkTermPreview({
      driveState: drive,
      mediumState: medium,
      mediumConfig,
      transferConfig: { driveCoupling: 2, tolerance: 1e-9 },
    });
    const applied = applyPhaseDriveToWaveTransfer({
      driveState: drive,
      mediumState: medium,
      mediumConfig,
      transferConfig: { driveCoupling: 2, tolerance: 1e-9 },
    }).report;

    expect(preview.requestedDriveCoupling).toBe(2);
    expect(preview.effectiveDriveCoupling).toBe(1);
    expect(preview.previewWorkTermEnergy).toBeCloseTo(2, 12);
    expect(preview.warnings.join('\n')).toContain('clamped to [0, 1]');

    expect(applied.requestedDriveCoupling).toBe(2);
    expect(applied.effectiveDriveCoupling).toBe(1);
    expect(applied.requestedWorkTermEnergy).toBeCloseTo(2, 12);
    expect(applied.appliedWorkTermEnergy).toBeCloseTo(2, 12);
    expect(applied.mediumInputEnergy).toBeCloseTo(2, 12);
    expect(applied.warnings.join('\n')).toContain('clamped to [0, 1]');
    expect(applied.ledger.status).toBe('closed');
  });

  it('keeps no-direction drive as a no-input applied scenario', () => {
    const drive = makePeriodicDrive({ injectionMask: [0, 0, 0, 0] });
    const medium = makeMedium();

    const applied = applyPhaseDriveToWaveTransfer({
      driveState: drive,
      mediumState: medium,
      mediumConfig,
      transferConfig: { driveCoupling: 1, tolerance: 1e-9 },
    }).report;

    expect(applied.driveObservation.maskWeightedDriveEnergyTotal).toBe(0);
    expect(applied.candidateMaskedDriveEnergy).toBe(0);
    expect(applied.driveDirectionEnergyProxy).toBe(0);
    expect(applied.requestedWorkTermEnergy).toBe(0);
    expect(applied.velocityKickScale).toBe(0);
    expect(applied.mediumInputEnergy).toBe(0);
    expect(applied.mediumEnergyDelta).toBe(0);
    expect(applied.mediumChangedFieldCount).toBe(0);
    expect(applied.ledger.status).toBe('closed');
  });

  it('closes the ledger when the medium already has velocity', () => {
    const drive = makePeriodicDrive({ injectionMask: [1, 0, 0, 0] });
    const medium = makeMedium({
      mediumRealVelocityField: [0.25, 0, 0, 0],
      mediumImagVelocityField: [0, 0, 0, 0],
    });

    const applied = applyPhaseDriveToWaveTransfer({
      driveState: drive,
      mediumState: medium,
      mediumConfig,
      transferConfig: { driveCoupling: 0.5, tolerance: 1e-9 },
    }).report;

    expect(applied.mediumEnergyBefore.totalEnergy).toBeGreaterThan(0);
    expect(applied.candidateMaskedDriveEnergy).toBeCloseTo(2, 12);
    expect(applied.requestedWorkTermEnergy).toBeCloseTo(1, 12);
    expect(applied.mediumEnergyDelta).toBeCloseTo(1, 12);
    expect(applied.mediumInputEnergy).toBeCloseTo(1, 12);
    expect(applied.mediumEnergyAfter.totalEnergy).toBeCloseTo(
      applied.mediumEnergyBefore.totalEnergy + applied.requestedWorkTermEnergy,
      12,
    );
    expect(applied.ledger.status).toBe('closed');
    expect(applied.ledger.conservationResidual).toBeCloseTo(0, 12);
  });

  it('uses shared transfer region energy when drive and medium sizes differ', () => {
    const drive = makePeriodicDrive({ injectionMask: [1, 1, 1, 1] });
    const medium = createWaveCapableMediumState({ width: 1, height: 1, boundaryMode: 'torus' });

    const applied = applyPhaseDriveToWaveTransfer({
      driveState: drive,
      mediumState: medium,
      mediumConfig: oneCellMediumConfig,
      transferConfig: { driveCoupling: 1, tolerance: 1e-9 },
    }).report;

    expect(applied.driveObservation.maskWeightedDriveEnergyTotal).toBeCloseTo(8, 12);
    expect(applied.candidateMaskedDriveEnergy).toBeCloseTo(2, 12);
    expect(applied.driveDirectionEnergyProxy).toBeCloseTo(2, 12);
    expect(applied.requestedWorkTermEnergy).toBeCloseTo(2, 12);
    expect(applied.mediumInputEnergy).toBeCloseTo(2, 12);
    expect(applied.mediumEnergyDelta).toBeCloseTo(2, 12);
    expect(applied.ledger.status).toBe('closed');
    expect(applied.warnings.join('\n')).toContain('shortest shared field length');
  });

  it('does not include result-coded coherence identifiers in scenario suite source files', () => {
    const source = [
      readFileSync('src/tests/world/phaseDriveToWaveTransferScenarioSuite.test.ts', 'utf8'),
      readFileSync('src/world/phaseDriveToWaveAppliedTransfer.ts', 'utf8'),
      readFileSync('src/observer/phaseDriveToWaveWorkTermPreview.ts', 'utf8'),
    ].join('\n');

    for (const term of forbiddenResultTerms) {
      expect(source.toLowerCase()).not.toContain(term.toLowerCase());
    }
  });
});
