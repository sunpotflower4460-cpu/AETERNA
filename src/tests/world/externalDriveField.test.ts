import { describe, expect, it } from 'vitest';
import {
  createExternalDriveField,
  updateExternalDriveFieldZero,
} from '../../world/externalDriveField.ts';
import type { ExternalDriveFieldConfig } from '../../types/externalDriveField.ts';

const baseConfig: ExternalDriveFieldConfig = {
  width: 2,
  height: 2,
  boundaryMode: 'torus',
  dt: 1,
  tolerance: 1e-9,
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
