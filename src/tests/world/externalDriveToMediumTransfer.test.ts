import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  createExternalDriveField,
  updateSteadyExternalDrive,
} from '../../world/externalDriveField.ts';
import {
  createSpatialWorldMedium,
} from '../../world/spatialWorldMedium.ts';
import {
  deriveTransferPairLedger,
  updateExternalDriveToMediumTransferPositive,
  updateExternalDriveToMediumTransferZero,
} from '../../world/externalDriveToMediumTransfer.ts';
import type { ExternalDriveToMediumTransferConfig } from '../../types/externalDriveToMediumTransfer.ts';

const baseTransferConfig: ExternalDriveToMediumTransferConfig = {
  width: 2,
  height: 2,
  boundaryMode: 'torus',
  cellMapping: 'same-index',
  transferCoefficient: 0,
  dt: 1,
  tolerance: 1e-9,
};

describe('external drive to medium zero transfer', () => {
  it('creates a closed pair ledger for matched zero transfer', () => {
    const pairLedger = deriveTransferPairLedger(0, 0, 1e-9);

    expect(pairLedger.source).toBe('ExternalDriveField');
    expect(pairLedger.destination).toBe('SpatialWorldMedium');
    expect(pairLedger.sourceOutEnergy).toBe(0);
    expect(pairLedger.destinationInputEnergy).toBe(0);
    expect(pairLedger.residual).toBe(0);
    expect(pairLedger.status).toBe('closed');
    expect(pairLedger.matched).toBe(true);
  });

  it('detects an open pair ledger when source out and destination input differ', () => {
    const pairLedger = deriveTransferPairLedger(1, 0.5, 1e-9);

    expect(pairLedger.status).toBe('open');
    expect(pairLedger.matched).toBe(false);
    expect(pairLedger.residual).toBeCloseTo(0.5, 12);
    expect(pairLedger.warnings.join('\n')).toContain('Transfer pair ledger is open');
  });

  it('keeps both fields unchanged when transferCoefficient is zero', () => {
    const externalDriveState = updateSteadyExternalDrive(
      createExternalDriveField({ width: 2, height: 2, boundaryMode: 'torus' }),
      {
        width: 2,
        height: 2,
        boundaryMode: 'torus',
        steadyDrivePerCell: 0.25,
        dt: 1,
        tolerance: 1e-9,
      },
    ).state;
    const spatialWorldMediumState = createSpatialWorldMedium(
      { width: 2, height: 2, boundaryMode: 'torus' },
      [1, 1, 1, 1],
    );

    const result = updateExternalDriveToMediumTransferZero(
      externalDriveState,
      spatialWorldMediumState,
      baseTransferConfig,
    );

    expect(result.report.transferEnergy).toBe(0);
    expect(result.report.externalDriveEnergyBefore).toBe(1);
    expect(result.report.externalDriveEnergyAfter).toBe(1);
    expect(result.report.mediumEnergyBefore).toBe(4);
    expect(result.report.mediumEnergyAfter).toBe(4);
    expect(Array.from(result.externalDriveState.driveField)).toEqual(Array.from(externalDriveState.driveField));
    expect(Array.from(result.spatialWorldMediumState.mediumStorageField)).toEqual(
      Array.from(spatialWorldMediumState.mediumStorageField),
    );
    expect(result.report.pairLedger.status).toBe('closed');
    expect(result.report.pairLedger.sourceOutEnergy).toBe(0);
    expect(result.report.pairLedger.destinationInputEnergy).toBe(0);
  });

  it('rejects non-zero transferCoefficient in v3.6 without moving energy', () => {
    const externalDriveState = updateSteadyExternalDrive(
      createExternalDriveField({ width: 2, height: 2, boundaryMode: 'torus' }),
      {
        width: 2,
        height: 2,
        boundaryMode: 'torus',
        steadyDrivePerCell: 0.25,
        dt: 1,
        tolerance: 1e-9,
      },
    ).state;
    const spatialWorldMediumState = createSpatialWorldMedium(
      { width: 2, height: 2, boundaryMode: 'torus' },
      [0, 0, 0, 0],
    );

    const result = updateExternalDriveToMediumTransferZero(
      externalDriveState,
      spatialWorldMediumState,
      {
        ...baseTransferConfig,
        transferCoefficient: 0.5,
      },
    );

    expect(result.report.acceptedTransferCoefficient).toBe(0);
    expect(result.report.attemptedTransferCoefficient).toBe(0.5);
    expect(result.report.rejectedTransferCoefficient).toBe(0.5);
    expect(result.report.transferEnergy).toBe(0);
    expect(result.report.externalDriveEnergyAfter).toBe(result.report.externalDriveEnergyBefore);
    expect(result.report.mediumEnergyAfter).toBe(result.report.mediumEnergyBefore);
    expect(result.report.pairLedger.status).toBe('closed');
    expect(result.report.warnings.join('\n')).toContain('Non-zero transferCoefficient was rejected');
  });

  it('uses same-index cell mapping only in v3.6', () => {
    const externalDriveState = createExternalDriveField({ width: 2, height: 2, boundaryMode: 'torus' });
    const spatialWorldMediumState = createSpatialWorldMedium({ width: 2, height: 2, boundaryMode: 'torus' });

    const result = updateExternalDriveToMediumTransferZero(
      externalDriveState,
      spatialWorldMediumState,
      baseTransferConfig,
    );

    expect(result.report.pairLedger.status).toBe('closed');
  });

  it('does not include life metaphor or energy-flow proof terms in zero-transfer source', () => {
    const source = readFileSync('src/world/externalDriveToMediumTransfer.ts', 'utf8');
    const forbidden = ['vital', 'breath', 'heartbeat', 'pulse', 'metabolic', 'lifeDrive', '呼吸', '鼓動', '生命', '心拍'];

    for (const term of forbidden) {
      expect(source.toLowerCase()).not.toContain(term.toLowerCase());
    }
  });
});

describe('external drive to medium positive transfer', () => {
  it('moves a bounded amount from ExternalDriveField to SpatialWorldMedium with a closed pair ledger', () => {
    const externalDriveState = updateSteadyExternalDrive(
      createExternalDriveField({ width: 2, height: 2, boundaryMode: 'torus' }),
      {
        width: 2,
        height: 2,
        boundaryMode: 'torus',
        steadyDrivePerCell: 1,
        dt: 1,
        tolerance: 1e-9,
      },
    ).state;
    const spatialWorldMediumState = createSpatialWorldMedium(
      { width: 2, height: 2, boundaryMode: 'torus' },
      [0, 0, 0, 0],
    );

    const result = updateExternalDriveToMediumTransferPositive(
      externalDriveState,
      spatialWorldMediumState,
      {
        ...baseTransferConfig,
        transferCoefficient: 0.25,
      },
    );

    expect(result.report.transferRate).toBe(0.25);
    expect(result.report.transferEnergy).toBe(1);
    expect(result.report.externalDriveEnergyBefore).toBe(4);
    expect(result.report.externalDriveEnergyAfter).toBe(3);
    expect(result.report.mediumEnergyBefore).toBe(0);
    expect(result.report.mediumEnergyAfter).toBe(1);
    expect(result.report.externalDriveEnergyDelta).toBe(-1);
    expect(result.report.mediumEnergyDelta).toBe(1);
    expect(result.report.pairLedger.sourceOutEnergy).toBe(1);
    expect(result.report.pairLedger.destinationInputEnergy).toBe(1);
    expect(result.report.pairLedger.status).toBe('closed');
    expect(Array.from(result.externalDriveState.driveField)).toEqual([0.75, 0.75, 0.75, 0.75]);
    expect(Array.from(result.spatialWorldMediumState.mediumStorageField)).toEqual([0.25, 0.25, 0.25, 0.25]);
  });

  it('uses the same atomic transfer amount on source and destination cells', () => {
    const externalDriveState = createExternalDriveField({ width: 2, height: 2, boundaryMode: 'torus' });
    externalDriveState.driveField.set([2, 1, 0, 3]);
    const spatialWorldMediumState = createSpatialWorldMedium(
      { width: 2, height: 2, boundaryMode: 'torus' },
      [10, 10, 10, 10],
    );

    const result = updateExternalDriveToMediumTransferPositive(
      externalDriveState,
      spatialWorldMediumState,
      {
        ...baseTransferConfig,
        transferCoefficient: 0.5,
      },
    );

    expect(Array.from(result.externalDriveState.driveField)).toEqual([1, 0.5, 0, 1.5]);
    expect(Array.from(result.spatialWorldMediumState.mediumStorageField)).toEqual([11, 10.5, 10, 11.5]);
    expect(result.report.transferEnergy).toBe(3);
    expect(result.report.destinationInputEnergy).toBe(3);
    expect(result.report.pairLedger.matched).toBe(true);
  });

  it('caps transfer rate at one so it never moves more than available source storage', () => {
    const externalDriveState = createExternalDriveField({ width: 2, height: 2, boundaryMode: 'torus' });
    externalDriveState.driveField.set([2, 1, 0, 3]);
    const spatialWorldMediumState = createSpatialWorldMedium(
      { width: 2, height: 2, boundaryMode: 'torus' },
      [0, 0, 0, 0],
    );

    const result = updateExternalDriveToMediumTransferPositive(
      externalDriveState,
      spatialWorldMediumState,
      {
        ...baseTransferConfig,
        transferCoefficient: 5,
      },
    );

    expect(result.report.transferRate).toBe(1);
    expect(Array.from(result.externalDriveState.driveField)).toEqual([0, 0, 0, 0]);
    expect(Array.from(result.spatialWorldMediumState.mediumStorageField)).toEqual([2, 1, 0, 3]);
    expect(result.report.transferEnergy).toBe(6);
    expect(result.report.pairLedger.status).toBe('closed');
  });

  it('does not couple positive transfer into AETERNA runtime buffers or center buffers', () => {
    const externalDriveState = createExternalDriveField({ width: 2, height: 2, boundaryMode: 'torus' });
    externalDriveState.driveField.set([1, 1, 1, 1]);
    const spatialWorldMediumState = createSpatialWorldMedium({ width: 2, height: 2, boundaryMode: 'torus' });

    const result = updateExternalDriveToMediumTransferPositive(
      externalDriveState,
      spatialWorldMediumState,
      {
        ...baseTransferConfig,
        transferCoefficient: 0.25,
      },
    );

    expect(result.report.transferEnergy).toBe(1);
    expect(result.report.warnings.join('\n')).not.toContain('internal buffer');
    expect(result.report.warnings.join('\n')).not.toContain('center-buffer');
  });
});
