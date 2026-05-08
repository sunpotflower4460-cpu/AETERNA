import { describe, expect, it } from 'vitest';
import {
  createExternalDriveField,
  updateExternalDriveFieldZero,
  updatePeriodicExternalDrive,
  updateSteadyExternalDrive,
  updateSupplyCutoffDrive,
} from '../../world/externalDriveField.ts';
import type {
  ExternalDriveFieldConfig,
  PeriodicExternalDriveConfig,
  SteadyExternalDriveConfig,
} from '../../types/externalDriveField.ts';

const baseConfig: ExternalDriveFieldConfig = {
  width: 2,
  height: 2,
  boundaryMode: 'torus',
  dt: 1,
  tolerance: 1e-9,
};

const steadyConfig: SteadyExternalDriveConfig = {
  ...baseConfig,
  steadyDrivePerCell: 0.25,
};

const periodicConfig: PeriodicExternalDriveConfig = {
  ...baseConfig,
  baseDrivePerCell: 0.1,
  amplitudeDrivePerCell: 0.2,
  periodTicks: 4,
};

describe('external drive field zero', () => {
  it('creates a structural zero drive field', () => {
    const state = createExternalDriveField({ width: 2, height: 2, boundaryMode: 'torus' });

    expect(state.driveField.length).toBe(4);
    expect(state.rejectedDriveField.length).toBe(4);
    expect(Array.from(state.driveField)).toEqual([0, 0, 0, 0]);
    expect(Array.from(state.rejectedDriveField)).toEqual([0, 0, 0, 0]);
  });

  it('keeps accepted input energy at zero when no attempted drive is provided', () => {
    const state = createExternalDriveField({ width: 2, height: 2, boundaryMode: 'torus' });
    const result = updateExternalDriveFieldZero(state, baseConfig);

    expect(result.report.inputEnergy).toBe(0);
    expect(result.report.acceptedDriveEnergy).toBe(0);
    expect(result.report.attemptedDriveEnergy).toBe(0);
    expect(result.report.rejectedDriveEnergy).toBe(0);
    expect(result.report.ledger.status).toBe('closed');
    expect(result.report.ledger.conservationResidual).toBe(0);
  });

  it('rejects non-zero attempted drive without accepting it as input', () => {
    const state = createExternalDriveField({ width: 2, height: 2, boundaryMode: 'torus' });
    const result = updateExternalDriveFieldZero(state, baseConfig, [1, 2, 0, 3]);

    expect(result.report.attemptedDriveEnergy).toBe(6);
    expect(result.report.rejectedDriveEnergy).toBe(6);
    expect(result.report.acceptedDriveEnergy).toBe(0);
    expect(result.report.inputEnergy).toBe(0);
    expect(Array.from(result.state.driveField)).toEqual([0, 0, 0, 0]);
    expect(Array.from(result.state.rejectedDriveField)).toEqual([1, 2, 0, 3]);
    expect(result.report.warnings.join('\n')).toContain('Non-zero attempted drive was rejected');
    expect(result.report.ledger.status).toBe('closed');
  });

  it('does not add external supply, steady drive, pulse, or periodic drive in v3.2', () => {
    const state = createExternalDriveField({ width: 2, height: 2, boundaryMode: 'torus' });
    const result = updateExternalDriveFieldZero(state, baseConfig, [4, 4, 4, 4]);
    const text = JSON.stringify(result.report);

    expect(result.report.inputEnergy).toBe(0);
    expect(text).not.toContain('steady');
    expect(text).not.toContain('pulse');
    expect(text).not.toContain('periodic');
    expect(text).not.toContain('breath');
    expect(text).not.toContain('heartbeat');
    expect(text).not.toContain('Energy is flowing through AETERNA');
  });
});

describe('steady external drive', () => {
  it('accepts a constant non-negative drive into the external drive field only', () => {
    const state = createExternalDriveField({ width: 2, height: 2, boundaryMode: 'torus' });
    const result = updateSteadyExternalDrive(state, steadyConfig);

    expect(result.report.acceptedDriveEnergy).toBe(1);
    expect(result.report.inputEnergy).toBe(1);
    expect(result.report.rejectedDriveEnergy).toBe(0);
    expect(Array.from(result.state.driveField)).toEqual([0.25, 0.25, 0.25, 0.25]);
    expect(result.report.ledger.status).toBe('closed');
    expect(result.report.ledger.conservationResidual).toBeCloseTo(0, 12);
  });

  it('accumulates steady drive across steps without coupling into runtime or medium', () => {
    const state = createExternalDriveField({ width: 2, height: 2, boundaryMode: 'torus' });
    const first = updateSteadyExternalDrive(state, steadyConfig);
    const second = updateSteadyExternalDrive(first.state, steadyConfig);

    expect(Array.from(second.state.driveField)).toEqual([0.5, 0.5, 0.5, 0.5]);
    expect(second.report.acceptedDriveEnergy).toBe(1);
    expect(second.report.ledger.status).toBe('closed');
  });

  it('does not add pulse, periodic modulation, breath, heartbeat, or energy-flow proof claims', () => {
    const state = createExternalDriveField({ width: 2, height: 2, boundaryMode: 'torus' });
    const result = updateSteadyExternalDrive(state, steadyConfig);
    const text = JSON.stringify(result.report);

    expect(text).not.toContain('pulse');
    expect(text).not.toContain('periodic');
    expect(text).not.toContain('rhythm');
    expect(text).not.toContain('breath');
    expect(text).not.toContain('heartbeat');
    expect(text).not.toContain('Energy is flowing through AETERNA');
  });

  it('treats negative steady drive as zero rather than accepted supply', () => {
    const state = createExternalDriveField({ width: 2, height: 2, boundaryMode: 'torus' });
    const result = updateSteadyExternalDrive(state, {
      ...steadyConfig,
      steadyDrivePerCell: -1,
    });

    expect(result.report.acceptedDriveEnergy).toBe(0);
    expect(result.report.inputEnergy).toBe(0);
    expect(Array.from(result.state.driveField)).toEqual([0, 0, 0, 0]);
    expect(result.report.ledger.status).toBe('closed');
  });
});

describe('supply cutoff drive', () => {
  it('stops accepted input without applying a special decay outcome rule', () => {
    const initial = createExternalDriveField({ width: 2, height: 2, boundaryMode: 'torus' });
    const charged = updateSteadyExternalDrive(initial, steadyConfig);
    const cutoff = updateSupplyCutoffDrive(charged.state, baseConfig);

    expect(cutoff.report.inputEnergy).toBe(0);
    expect(cutoff.report.acceptedDriveEnergy).toBe(0);
    expect(cutoff.report.driveEnergyBeforeCutoff).toBe(1);
    expect(cutoff.report.driveEnergyAfterCutoff).toBe(1);
    expect(cutoff.report.driveEnergyDeltaDuringCutoff).toBe(0);
    expect(Array.from(cutoff.state.driveField)).toEqual([0.25, 0.25, 0.25, 0.25]);
    expect(cutoff.report.ledger.status).toBe('closed');
    expect(cutoff.report.cutoffVerifiedNoSpecialOutcomeRule).toBe(true);
  });

  it('keeps stored drive across multiple cutoff steps when no destination exists', () => {
    const initial = createExternalDriveField({ width: 2, height: 2, boundaryMode: 'torus' });
    const charged = updateSteadyExternalDrive(initial, steadyConfig);
    const firstCutoff = updateSupplyCutoffDrive(charged.state, baseConfig);
    const secondCutoff = updateSupplyCutoffDrive(firstCutoff.state, baseConfig);

    expect(secondCutoff.report.driveEnergyBeforeCutoff).toBe(1);
    expect(secondCutoff.report.driveEnergyAfterCutoff).toBe(1);
    expect(secondCutoff.report.driveEnergyDeltaDuringCutoff).toBe(0);
    expect(secondCutoff.report.ledger.status).toBe('closed');
  });

  it('does not encode if supply is zero then decay', () => {
    const initial = createExternalDriveField({ width: 2, height: 2, boundaryMode: 'torus' });
    const charged = updateSteadyExternalDrive(initial, steadyConfig);
    const cutoff = updateSupplyCutoffDrive(charged.state, baseConfig);
    const text = JSON.stringify(cutoff.report);

    expect(cutoff.report.inputEnergy).toBe(0);
    expect(cutoff.report.driveEnergyAfterCutoff).toBe(cutoff.report.driveEnergyBeforeCutoff);
    expect(text).not.toContain('decay');
    expect(text).not.toContain('pulse');
    expect(text).not.toContain('periodic');
    expect(text).not.toContain('rhythm');
    expect(text).not.toContain('breath');
    expect(text).not.toContain('heartbeat');
    expect(text).not.toContain('Energy is flowing through AETERNA');
  });
});

describe('periodic external drive', () => {
  it('accepts an explicit sinusoidal waveform into the external drive field only', () => {
    const state = createExternalDriveField({ width: 2, height: 2, boundaryMode: 'torus' });
    const result = updatePeriodicExternalDrive(state, periodicConfig);

    expect(result.report.waveformPhase01).toBe(0);
    expect(result.report.waveformValuePerCell).toBeCloseTo(0.2, 12);
    expect(result.report.acceptedDriveEnergy).toBeCloseTo(0.8, 12);
    expect(result.report.inputEnergy).toBeCloseTo(0.8, 12);
    expect(result.report.transferOutputEnergy).toBe(0);
    expect(Array.from(result.state.driveField)).toEqual([0.2, 0.2, 0.2, 0.2]);
    expect(result.report.ledger.status).toBe('closed');
    expect(result.report.ledger.conservationResidual).toBeCloseTo(0, 12);
  });

  it('changes accepted input according to waveform phase while preserving ledger accounting', () => {
    const state = createExternalDriveField({ width: 2, height: 2, boundaryMode: 'torus' });
    const first = updatePeriodicExternalDrive(state, periodicConfig);
    const second = updatePeriodicExternalDrive(first.state, periodicConfig);
    const third = updatePeriodicExternalDrive(second.state, periodicConfig);

    expect(first.report.waveformValuePerCell).toBeCloseTo(0.2, 12);
    expect(second.report.waveformValuePerCell).toBeCloseTo(0.3, 12);
    expect(third.report.waveformValuePerCell).toBeCloseTo(0.2, 12);
    expect(second.report.acceptedDriveEnergy).toBeCloseTo(1.2, 12);
    expect(third.report.ledger.status).toBe('closed');
  });

  it('does not couple periodic input into SpatialWorldMedium, runtime buffers, or transfer output', () => {
    const state = createExternalDriveField({ width: 2, height: 2, boundaryMode: 'torus' });
    const result = updatePeriodicExternalDrive(state, periodicConfig);

    expect(result.report.transferOutputEnergy).toBe(0);
    expect(result.report.rejectedDriveEnergy).toBe(0);
    expect(result.report.driveEnergyDeltaDuringPeriodicInput).toBeCloseTo(result.report.acceptedDriveEnergy, 12);
  });

  it('does not present the waveform as breath, heartbeat, life rhythm, or verified energy flow through AETERNA', () => {
    const state = createExternalDriveField({ width: 2, height: 2, boundaryMode: 'torus' });
    const result = updatePeriodicExternalDrive(state, periodicConfig);
    const text = JSON.stringify(result.report);

    expect(text).not.toContain('breath');
    expect(text).not.toContain('heartbeat');
    expect(text).not.toContain('life');
    expect(text).not.toContain('Energy is flowing through AETERNA');
  });

  it('normalizes negative waveform parameters to zero rather than creating negative input', () => {
    const state = createExternalDriveField({ width: 2, height: 2, boundaryMode: 'torus' });
    const result = updatePeriodicExternalDrive(state, {
      ...periodicConfig,
      baseDrivePerCell: -1,
      amplitudeDrivePerCell: -1,
    });

    expect(result.report.acceptedDriveEnergy).toBe(0);
    expect(result.report.inputEnergy).toBe(0);
    expect(Array.from(result.state.driveField)).toEqual([0, 0, 0, 0]);
    expect(result.report.ledger.status).toBe('closed');
  });
});
