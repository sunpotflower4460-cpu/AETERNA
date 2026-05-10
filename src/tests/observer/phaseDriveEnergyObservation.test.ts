import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  createPhaseCarryingDriveState,
  updatePeriodicPhaseDrive,
} from '../../world/phaseCarryingDrive.ts';
import {
  derivePhaseDriveEnergyObservation,
  derivePhaseDriveEnergyObservationReport,
  derivePhaseDriveNoMediumTransferCheck,
} from '../../observer/phaseDriveEnergyObservation.ts';

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

describe('phase drive energy observation', () => {
  it('reports zero drive energy before a waveform is generated', () => {
    const created = createPhaseCarryingDriveState({
      width: 2,
      height: 2,
      boundaryMode: 'torus',
      phaseSeed: 1,
    });

    const observation = derivePhaseDriveEnergyObservation(created.state);

    expect(observation.driveEnergyTotal).toBe(0);
    expect(observation.driveEnergyMax).toBe(0);
    expect(observation.maskWeightedDriveEnergyTotal).toBe(0);
    expect(observation.activeDriveCellCount).toBe(0);
    expect(observation.activeMaskedDriveCellCount).toBe(0);
    expect(observation.finiteCellCount).toBe(4);
    expect(observation.nonFiniteCellCount).toBe(0);
    expect(observation.metricKind).toBe('derived');
  });

  it('derives drive-side energy from real and imaginary field values without medium transfer', () => {
    const created = createPhaseCarryingDriveState({
      width: 2,
      height: 2,
      boundaryMode: 'torus',
      spatialPhaseField: [0, 0.25, 0.5, 0.75],
      injectionMask: [1, 0.5, 0, 0],
    });
    const periodic = updatePeriodicPhaseDrive(created.state, {
      periodTicks: 4,
      driveAmplitude: 2,
      applyInjectionMask: true,
    });

    const observation = derivePhaseDriveEnergyObservation(periodic.state);

    expect(observation.driveEnergyTotal).toBeCloseTo(2.5, 12);
    expect(observation.driveEnergyMax).toBeCloseTo(2, 12);
    expect(observation.maskWeightedDriveEnergyTotal).toBeCloseTo(2.125, 12);
    expect(observation.activeDriveCellCount).toBe(2);
    expect(observation.activeMaskedDriveCellCount).toBe(2);
  });

  it('keeps drive-side energy observation read-only', () => {
    const created = createPhaseCarryingDriveState({
      width: 2,
      height: 2,
      boundaryMode: 'torus',
      spatialPhaseField: [0, 0, 0, 0],
      injectionMask: [1, 1, 1, 1],
    });
    const periodic = updatePeriodicPhaseDrive(created.state, {
      periodTicks: 8,
      driveAmplitude: 1,
    });
    const beforeReal = Array.from(periodic.state.driveRealField);
    const beforeImag = Array.from(periodic.state.driveImagField);

    derivePhaseDriveEnergyObservation(periodic.state);

    expect(Array.from(periodic.state.driveRealField)).toEqual(beforeReal);
    expect(Array.from(periodic.state.driveImagField)).toEqual(beforeImag);
  });

  it('reports non-finite drive samples as zero without hiding the warning', () => {
    const created = createPhaseCarryingDriveState({
      width: 2,
      height: 2,
      boundaryMode: 'torus',
      phaseSeed: 1,
    });
    created.state.driveRealField[0] = Number.NaN;
    created.state.driveImagField[1] = Number.POSITIVE_INFINITY;

    const observation = derivePhaseDriveEnergyObservation(created.state);

    expect(observation.nonFiniteCellCount).toBe(2);
    expect(observation.finiteCellCount).toBe(2);
    expect(observation.warnings.join('\n')).toContain('non-finite drive cell');
  });

  it('closes the no-medium-transfer ledger while preserving observed drive energy as a diagnostic', () => {
    const check = derivePhaseDriveNoMediumTransferCheck({
      observedDriveEnergy: 3.5,
      tolerance: 1e-9,
    });

    expect(check.observedDriveEnergy).toBe(3.5);
    expect(check.mediumInputEnergy).toBe(0);
    expect(check.driveToMediumTransferredEnergy).toBe(0);
    expect(check.ledger.status).toBe('closed');
    expect(check.ledger.verifiedModeledFlow).toBe(true);
    expect(check.ledger.conservationResidual).toBe(0);
    expect(check.metricKind).toBe('check');
  });

  it('builds a full drive energy observation report', () => {
    const created = createPhaseCarryingDriveState({
      width: 2,
      height: 2,
      boundaryMode: 'torus',
      spatialPhaseField: [0, 0, 0, 0],
      injectionMask: [1, 0, 0, 0],
    });
    const periodic = updatePeriodicPhaseDrive(created.state, {
      periodTicks: 8,
      driveAmplitude: 2,
    });

    const report = derivePhaseDriveEnergyObservationReport({
      state: periodic.state,
      tolerance: 1e-9,
    });

    expect(report.tick).toBe(periodic.state.tick);
    expect(report.energyObservation.driveEnergyTotal).toBe(2);
    expect(report.noMediumTransferCheck.ledger.status).toBe('closed');
    expect(report.noMediumTransferCheck.mediumInputEnergy).toBe(0);
    expect(report.metricKind).toBe('derived');
  });

  it('does not include result-coded coherence identifiers in phase drive energy observation source files', () => {
    const source = [
      readFileSync('src/types/phaseDriveEnergyObservation.ts', 'utf8'),
      readFileSync('src/observer/phaseDriveEnergyObservation.ts', 'utf8'),
    ].join('\n');

    for (const term of forbiddenResultTerms) {
      expect(source.toLowerCase()).not.toContain(term.toLowerCase());
    }
  });
});
