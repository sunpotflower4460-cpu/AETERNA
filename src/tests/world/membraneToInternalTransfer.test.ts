import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  createSpatialWorldMedium,
  updateSpatialWorldMedium,
} from '../../world/spatialWorldMedium.ts';
import { createLocalConservationSubstrate } from '../../substrate/localConservationSubstrate.ts';
import {
  deriveMembraneToInternalPairLedger,
  updateMembraneToInternalTransferPositive,
  updateMembraneToInternalTransferZero,
} from '../../world/membraneToInternalTransfer.ts';
import type { MembraneToInternalTransferConfig } from '../../types/membraneToInternalTransfer.ts';
import type { SpatialWorldMediumConfig } from '../../types/spatialWorldMedium.ts';

const baseTransferConfig: MembraneToInternalTransferConfig = {
  width: 2,
  height: 2,
  boundaryMode: 'torus',
  cellMapping: 'same-index',
  transferCoefficient: 0,
  dt: 1,
  tolerance: 1e-9,
};

const mediumConfigForMembraneIntake: SpatialWorldMediumConfig = {
  width: 2,
  height: 2,
  boundaryMode: 'torus',
  localExchangeCoefficient: 0,
  localDissipationCoefficient: 0,
  residueConversionCoefficient: 0,
  outflowCoefficient: 0,
  membraneExchangeCoefficient: 0.5,
  dt: 1,
  tolerance: 1e-9,
};

describe('membrane to internal zero transfer', () => {
  it('creates a closed pair ledger for matched zero transfer', () => {
    const pairLedger = deriveMembraneToInternalPairLedger(0, 0, 1e-9);

    expect(pairLedger.source).toBe('SpatialWorldMedium.membraneExchangeField');
    expect(pairLedger.destination).toBe('LocalConservationSubstrate.storageField');
    expect(pairLedger.sourceOutEnergy).toBe(0);
    expect(pairLedger.destinationInputEnergy).toBe(0);
    expect(pairLedger.residual).toBe(0);
    expect(pairLedger.status).toBe('closed');
    expect(pairLedger.matched).toBe(true);
  });

  it('detects an open pair ledger when source out and destination input differ', () => {
    const pairLedger = deriveMembraneToInternalPairLedger(1, 0.5, 1e-9);

    expect(pairLedger.status).toBe('open');
    expect(pairLedger.matched).toBe(false);
    expect(pairLedger.residual).toBeCloseTo(0.5, 12);
    expect(pairLedger.warnings.join('\n')).toContain('Membrane-to-internal pair ledger is open');
  });

  it('keeps both fields unchanged when transferCoefficient is zero', () => {
    const mediumWithMembraneInflow = updateSpatialWorldMedium(
      createSpatialWorldMedium({ width: 2, height: 2, boundaryMode: 'torus' }, [10, 0, 0, 0]),
      mediumConfigForMembraneIntake,
    ).state;
    const substrate = createLocalConservationSubstrate(
      { width: 2, height: 2, boundaryMode: 'torus' },
      [1, 1, 1, 1],
    );

    const drainableBefore = Array.from(mediumWithMembraneInflow.membraneExchangeField).map(
      (v, i) => v - mediumWithMembraneInflow.membraneExchangeReleasedField[i],
    );

    const result = updateMembraneToInternalTransferZero(
      mediumWithMembraneInflow,
      substrate,
      baseTransferConfig,
    );

    expect(result.report.transferEnergy).toBe(0);
    expect(result.report.membraneDrainableAfter).toBeCloseTo(result.report.membraneDrainableBefore, 12);
    expect(result.report.substrateStorageAfter).toBe(result.report.substrateStorageBefore);
    expect(Array.from(result.spatialWorldMediumState.membraneExchangeField)).toEqual(
      Array.from(mediumWithMembraneInflow.membraneExchangeField),
    );
    expect(Array.from(result.spatialWorldMediumState.membraneExchangeReleasedField)).toEqual(
      Array.from(mediumWithMembraneInflow.membraneExchangeReleasedField),
    );
    expect(Array.from(result.localConservationSubstrateState.storageField)).toEqual(
      Array.from(substrate.storageField),
    );
    expect(result.report.pairLedger.status).toBe('closed');
    expect(result.report.pairLedger.sourceOutEnergy).toBe(0);
    expect(result.report.pairLedger.destinationInputEnergy).toBe(0);

    const drainableAfter = Array.from(result.spatialWorldMediumState.membraneExchangeField).map(
      (v, i) => v - result.spatialWorldMediumState.membraneExchangeReleasedField[i],
    );
    expect(drainableAfter).toEqual(drainableBefore);
  });

  it('rejects non-zero transferCoefficient in v3.8 without moving energy', () => {
    const mediumWithMembraneInflow = updateSpatialWorldMedium(
      createSpatialWorldMedium({ width: 2, height: 2, boundaryMode: 'torus' }, [4, 4, 4, 4]),
      mediumConfigForMembraneIntake,
    ).state;
    const substrate = createLocalConservationSubstrate(
      { width: 2, height: 2, boundaryMode: 'torus' },
      [0, 0, 0, 0],
    );

    const result = updateMembraneToInternalTransferZero(
      mediumWithMembraneInflow,
      substrate,
      {
        ...baseTransferConfig,
        transferCoefficient: 0.5,
      },
    );

    expect(result.report.acceptedTransferCoefficient).toBe(0);
    expect(result.report.attemptedTransferCoefficient).toBe(0.5);
    expect(result.report.rejectedTransferCoefficient).toBe(0.5);
    expect(result.report.transferEnergy).toBe(0);
    expect(result.report.substrateStorageAfter).toBe(result.report.substrateStorageBefore);
    expect(result.report.pairLedger.status).toBe('closed');
    expect(result.report.warnings.join('\n')).toContain('Non-zero transferCoefficient was rejected');
  });

  it('runs 200 ticks of zero transfer with the medium continuously refilling membrane inflow', () => {
    let medium = createSpatialWorldMedium({ width: 2, height: 2, boundaryMode: 'torus' }, [10, 10, 10, 10]);
    let substrate = createLocalConservationSubstrate(
      { width: 2, height: 2, boundaryMode: 'torus' },
      [0, 0, 0, 0],
    );

    let openLedgerCount = 0;
    let substrateGain = 0;
    let membraneReleasedGain = 0;
    const initialReleased = medium.membraneExchangeReleasedField.reduce((a, v) => a + v, 0);
    const initialSubstrate = substrate.storageField.reduce((a, v) => a + v, 0);

    for (let t = 0; t < 200; t++) {
      const mediumStep = updateSpatialWorldMedium(medium, mediumConfigForMembraneIntake);
      medium = mediumStep.state;

      const transferStep = updateMembraneToInternalTransferZero(medium, substrate, baseTransferConfig);
      medium = transferStep.spatialWorldMediumState;
      substrate = transferStep.localConservationSubstrateState;

      if (transferStep.report.pairLedger.status !== 'closed') openLedgerCount++;
    }

    substrateGain = substrate.storageField.reduce((a, v) => a + v, 0) - initialSubstrate;
    membraneReleasedGain =
      medium.membraneExchangeReleasedField.reduce((a, v) => a + v, 0) - initialReleased;

    expect(openLedgerCount).toBe(0);
    expect(substrateGain).toBe(0);
    expect(membraneReleasedGain).toBe(0);
    expect(medium.membraneExchangeField.reduce((a, v) => a + v, 0)).toBeGreaterThan(0);
  });

  it('uses same-index cell mapping only', () => {
    const medium = createSpatialWorldMedium({ width: 2, height: 2, boundaryMode: 'torus' });
    const substrate = createLocalConservationSubstrate({ width: 2, height: 2, boundaryMode: 'torus' });

    expect(() =>
      updateMembraneToInternalTransferZero(medium, substrate, {
        ...baseTransferConfig,
        cellMapping: 'centroid' as unknown as 'same-index',
      }),
    ).toThrow();
  });

  it('does not include life metaphor or energy-flow proof terms in source', () => {
    const source = readFileSync('src/world/membraneToInternalTransfer.ts', 'utf8');
    const forbidden = ['vital', 'breath', 'heartbeat', 'pulse', 'metabolic', 'lifeDrive', '呼吸', '鼓動', '生命', '心拍'];

    for (const term of forbidden) {
      expect(source.toLowerCase()).not.toContain(term.toLowerCase());
    }
  });
});

describe('membrane to internal positive transfer', () => {
  it('moves a bounded amount from membraneExchangeField drainable into substrate storage with a closed pair ledger', () => {
    const mediumWithMembraneInflow = updateSpatialWorldMedium(
      createSpatialWorldMedium({ width: 2, height: 2, boundaryMode: 'torus' }, [4, 4, 4, 4]),
      mediumConfigForMembraneIntake,
    ).state;
    const substrate = createLocalConservationSubstrate(
      { width: 2, height: 2, boundaryMode: 'torus' },
      [0, 0, 0, 0],
    );

    const drainableBefore = Array.from(mediumWithMembraneInflow.membraneExchangeField).map(
      (v, i) => v - mediumWithMembraneInflow.membraneExchangeReleasedField[i],
    );
    const expectedTransferPerCell = drainableBefore.map((d) => d * 0.25);
    const expectedTotalTransfer = expectedTransferPerCell.reduce((a, v) => a + v, 0);

    const result = updateMembraneToInternalTransferPositive(
      mediumWithMembraneInflow,
      substrate,
      {
        ...baseTransferConfig,
        transferCoefficient: 0.25,
      },
    );

    expect(result.report.transferRate).toBe(0.25);
    expect(result.report.transferEnergy).toBeCloseTo(expectedTotalTransfer, 12);
    expect(result.report.pairLedger.sourceOutEnergy).toBeCloseTo(expectedTotalTransfer, 12);
    expect(result.report.pairLedger.destinationInputEnergy).toBeCloseTo(expectedTotalTransfer, 12);
    expect(result.report.pairLedger.status).toBe('closed');
    expect(result.report.substrateStorageDelta).toBeCloseTo(expectedTotalTransfer, 12);
    expect(result.report.membraneDrainableDelta).toBeCloseTo(-expectedTotalTransfer, 12);

    for (let i = 0; i < 4; i++) {
      expect(result.localConservationSubstrateState.storageField[i]).toBeCloseTo(expectedTransferPerCell[i], 12);
    }
  });

  it('caps transfer rate at one so it never moves more than drainable amount', () => {
    const mediumWithMembraneInflow = updateSpatialWorldMedium(
      createSpatialWorldMedium({ width: 2, height: 2, boundaryMode: 'torus' }, [4, 4, 4, 4]),
      mediumConfigForMembraneIntake,
    ).state;
    const substrate = createLocalConservationSubstrate(
      { width: 2, height: 2, boundaryMode: 'torus' },
      [0, 0, 0, 0],
    );

    const drainableBefore = Array.from(mediumWithMembraneInflow.membraneExchangeField).map(
      (v, i) => v - mediumWithMembraneInflow.membraneExchangeReleasedField[i],
    );
    const totalDrainable = drainableBefore.reduce((a, v) => a + v, 0);

    const result = updateMembraneToInternalTransferPositive(
      mediumWithMembraneInflow,
      substrate,
      {
        ...baseTransferConfig,
        transferCoefficient: 5,
      },
    );

    expect(result.report.transferRate).toBe(1);
    expect(result.report.transferEnergy).toBeCloseTo(totalDrainable, 12);
    expect(result.report.membraneDrainableAfter).toBeCloseTo(0, 12);
    expect(result.report.pairLedger.status).toBe('closed');
  });

  it('chains ExternalDrive -> Medium -> Membrane -> Internal substrate over many ticks with closed pair ledger every tick', () => {
    let medium = createSpatialWorldMedium({ width: 2, height: 2, boundaryMode: 'torus' }, [10, 10, 10, 10]);
    let substrate = createLocalConservationSubstrate(
      { width: 2, height: 2, boundaryMode: 'torus' },
      [0, 0, 0, 0],
    );

    let openLedgerCount = 0;
    let totalTransferred = 0;

    for (let t = 0; t < 50; t++) {
      const mediumStep = updateSpatialWorldMedium(medium, mediumConfigForMembraneIntake);
      medium = mediumStep.state;

      const transferStep = updateMembraneToInternalTransferPositive(medium, substrate, {
        ...baseTransferConfig,
        transferCoefficient: 0.5,
      });
      medium = transferStep.spatialWorldMediumState;
      substrate = transferStep.localConservationSubstrateState;

      if (transferStep.report.pairLedger.status !== 'closed') openLedgerCount++;
      totalTransferred += transferStep.report.transferEnergy;
    }

    expect(openLedgerCount).toBe(0);
    expect(totalTransferred).toBeGreaterThan(0);

    const substrateTotal = substrate.storageField.reduce((a, v) => a + v, 0);
    const releasedTotal = medium.membraneExchangeReleasedField.reduce((a, v) => a + v, 0);
    expect(substrateTotal).toBeCloseTo(releasedTotal, 9);
    expect(substrateTotal).toBeCloseTo(totalTransferred, 9);
  });
});
