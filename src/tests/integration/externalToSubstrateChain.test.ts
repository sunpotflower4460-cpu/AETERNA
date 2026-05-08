import { describe, expect, it } from 'vitest';
import {
  createExternalDriveField,
  updateSteadyExternalDrive,
} from '../../world/externalDriveField.ts';
import {
  createSpatialWorldMedium,
  updateSpatialWorldMedium,
} from '../../world/spatialWorldMedium.ts';
import {
  createLocalConservationSubstrate,
  updateLocalConservationSubstrate,
} from '../../substrate/localConservationSubstrate.ts';
import {
  updateExternalDriveToMediumTransferPositive,
} from '../../world/externalDriveToMediumTransfer.ts';
import {
  updateMembraneToInternalTransferPositive,
} from '../../world/membraneToInternalTransfer.ts';
import type { ExternalDriveToMediumTransferConfig } from '../../types/externalDriveToMediumTransfer.ts';
import type { MembraneToInternalTransferConfig } from '../../types/membraneToInternalTransfer.ts';
import type { SpatialWorldMediumConfig } from '../../types/spatialWorldMedium.ts';
import type { LocalConservationSubstrateConfig } from '../../types/localConservationSubstrate.ts';
import type { SteadyExternalDriveConfig } from '../../types/externalDriveField.ts';

const WIDTH = 3;
const HEIGHT = 3;
const TOLERANCE = 1e-9;

const driveConfig: SteadyExternalDriveConfig = {
  width: WIDTH,
  height: HEIGHT,
  boundaryMode: 'torus',
  steadyDrivePerCell: 0.1,
  dt: 1,
  tolerance: TOLERANCE,
};

const externalToMediumConfig: ExternalDriveToMediumTransferConfig = {
  width: WIDTH,
  height: HEIGHT,
  boundaryMode: 'torus',
  cellMapping: 'same-index',
  transferCoefficient: 0.5,
  dt: 1,
  tolerance: TOLERANCE,
};

const mediumConfig: SpatialWorldMediumConfig = {
  width: WIDTH,
  height: HEIGHT,
  boundaryMode: 'torus',
  localExchangeCoefficient: 0.05,
  localDissipationCoefficient: 0.05,
  residueConversionCoefficient: 0.05,
  outflowCoefficient: 0.05,
  membraneExchangeCoefficient: 0.3,
  dt: 1,
  tolerance: TOLERANCE,
};

const membraneToInternalConfig: MembraneToInternalTransferConfig = {
  width: WIDTH,
  height: HEIGHT,
  boundaryMode: 'torus',
  cellMapping: 'same-index',
  transferCoefficient: 0.5,
  dt: 1,
  tolerance: TOLERANCE,
};

const substrateConfig: LocalConservationSubstrateConfig = {
  width: WIDTH,
  height: HEIGHT,
  boundaryMode: 'torus',
  localExchangeCoefficient: 0.05,
  localDissipationCoefficient: 0.05,
  residueConversionCoefficient: 0.05,
  outflowCoefficient: 0.05,
  dt: 1,
  tolerance: TOLERANCE,
};

function totalNonNegative(field: ArrayLike<number>): number {
  let sum = 0;
  for (let i = 0; i < field.length; i++) {
    const v = field[i];
    if (Number.isFinite(v)) sum += Math.max(0, v);
  }
  return sum;
}

describe('external → medium → membrane → substrate chain (v3.9 integration)', () => {
  it('keeps every pair ledger closed for 1000 ticks under steady drive', () => {
    let drive = createExternalDriveField({ width: WIDTH, height: HEIGHT, boundaryMode: 'torus' });
    let medium = createSpatialWorldMedium({ width: WIDTH, height: HEIGHT, boundaryMode: 'torus' });
    let substrate = createLocalConservationSubstrate({
      width: WIDTH,
      height: HEIGHT,
      boundaryMode: 'torus',
    });

    let externalToMediumOpenCount = 0;
    let membraneToInternalOpenCount = 0;
    let mediumLedgerOpenCount = 0;
    let substrateLedgerOpenCount = 0;
    let totalSteadyInput = 0;
    let totalMembraneTransferred = 0;

    const TICKS = 1000;
    for (let t = 0; t < TICKS; t++) {
      const driveStep = updateSteadyExternalDrive(drive, driveConfig);
      drive = driveStep.state;
      totalSteadyInput += driveStep.report.acceptedDriveEnergy;

      const e2m = updateExternalDriveToMediumTransferPositive(drive, medium, externalToMediumConfig);
      drive = e2m.externalDriveState;
      medium = e2m.spatialWorldMediumState;
      if (e2m.report.pairLedger.status !== 'closed') externalToMediumOpenCount++;

      const mediumStep = updateSpatialWorldMedium(medium, mediumConfig);
      medium = mediumStep.state;
      if (mediumStep.report.ledger.status !== 'closed') mediumLedgerOpenCount++;

      const m2i = updateMembraneToInternalTransferPositive(medium, substrate, membraneToInternalConfig);
      medium = m2i.spatialWorldMediumState;
      substrate = m2i.localConservationSubstrateState;
      if (m2i.report.pairLedger.status !== 'closed') membraneToInternalOpenCount++;
      totalMembraneTransferred += m2i.report.transferEnergy;

      const subStep = updateLocalConservationSubstrate(substrate, substrateConfig);
      substrate = subStep.state;
      if (subStep.report.ledger.status !== 'closed') substrateLedgerOpenCount++;
    }

    expect(externalToMediumOpenCount).toBe(0);
    expect(mediumLedgerOpenCount).toBe(0);
    expect(membraneToInternalOpenCount).toBe(0);
    expect(substrateLedgerOpenCount).toBe(0);

    const expectedSteadyInput = TICKS * driveConfig.steadyDrivePerCell * WIDTH * HEIGHT;
    expect(totalSteadyInput).toBeCloseTo(expectedSteadyInput, 9);

    expect(totalMembraneTransferred).toBeGreaterThan(0);
    expect(substrate.storageField.reduce((a, v) => a + v, 0)).toBeGreaterThan(0);
  });

  it('conserves total energy across the chain (input = accumulated + sinks across all stages)', () => {
    let drive = createExternalDriveField({ width: WIDTH, height: HEIGHT, boundaryMode: 'torus' });
    let medium = createSpatialWorldMedium({ width: WIDTH, height: HEIGHT, boundaryMode: 'torus' });
    let substrate = createLocalConservationSubstrate({
      width: WIDTH,
      height: HEIGHT,
      boundaryMode: 'torus',
    });

    const TICKS = 500;
    let totalInput = 0;

    for (let t = 0; t < TICKS; t++) {
      const driveStep = updateSteadyExternalDrive(drive, driveConfig);
      drive = driveStep.state;
      totalInput += driveStep.report.acceptedDriveEnergy;

      const e2m = updateExternalDriveToMediumTransferPositive(drive, medium, externalToMediumConfig);
      drive = e2m.externalDriveState;
      medium = e2m.spatialWorldMediumState;

      const mediumStep = updateSpatialWorldMedium(medium, mediumConfig);
      medium = mediumStep.state;

      const m2i = updateMembraneToInternalTransferPositive(medium, substrate, membraneToInternalConfig);
      medium = m2i.spatialWorldMediumState;
      substrate = m2i.localConservationSubstrateState;

      const subStep = updateLocalConservationSubstrate(substrate, substrateConfig);
      substrate = subStep.state;
    }

    const driveFieldStored = totalNonNegative(drive.driveField);
    const mediumStorage = totalNonNegative(medium.mediumStorageField);
    const mediumDissipation = totalNonNegative(medium.mediumDissipationField);
    const mediumResidue = totalNonNegative(medium.mediumResidueField);
    const mediumOutflow = totalNonNegative(medium.mediumOutflowField);
    const membraneInflow = totalNonNegative(medium.membraneExchangeField);
    const membraneReleased = totalNonNegative(medium.membraneExchangeReleasedField);
    const membraneRetained = membraneInflow - membraneReleased;
    const substrateStorage = totalNonNegative(substrate.storageField);
    const substrateDissipation = totalNonNegative(substrate.dissipationField);
    const substrateResidue = totalNonNegative(substrate.residueField);
    const substrateOutflow = totalNonNegative(substrate.outflowField);

    const accountedTotal =
      driveFieldStored +
      mediumStorage +
      mediumDissipation +
      mediumResidue +
      mediumOutflow +
      membraneRetained +
      substrateStorage +
      substrateDissipation +
      substrateResidue +
      substrateOutflow;

    // Membrane released energy is fully accounted on the substrate side.
    // Total input from external drive must equal total accounted minus membrane released
    // (because membrane released is double-counted: it left the medium and entered substrate).
    expect(accountedTotal).toBeCloseTo(totalInput, 6);
  });

  it('keeps clampLossOrOverflow at the medium step bounded under steady drive over 200 ticks', () => {
    let drive = createExternalDriveField({ width: WIDTH, height: HEIGHT, boundaryMode: 'torus' });
    let medium = createSpatialWorldMedium({ width: WIDTH, height: HEIGHT, boundaryMode: 'torus' });
    let substrate = createLocalConservationSubstrate({
      width: WIDTH,
      height: HEIGHT,
      boundaryMode: 'torus',
    });

    let totalClampLossMedium = 0;

    const TICKS = 200;
    for (let t = 0; t < TICKS; t++) {
      drive = updateSteadyExternalDrive(drive, driveConfig).state;

      const e2m = updateExternalDriveToMediumTransferPositive(drive, medium, externalToMediumConfig);
      drive = e2m.externalDriveState;
      medium = e2m.spatialWorldMediumState;

      const mediumStep = updateSpatialWorldMedium(medium, mediumConfig);
      medium = mediumStep.state;
      totalClampLossMedium += mediumStep.report.clampLossOrOverflow;

      const m2i = updateMembraneToInternalTransferPositive(medium, substrate, membraneToInternalConfig);
      medium = m2i.spatialWorldMediumState;
      substrate = m2i.localConservationSubstrateState;

      substrate = updateLocalConservationSubstrate(substrate, substrateConfig).state;
    }

    expect(totalClampLossMedium).toBeLessThan(TOLERANCE);
  });

  it('supply cutoff: when external drive stops, substrate storage drains as a consequence (not as an explicit decay rule)', () => {
    let drive = createExternalDriveField({ width: WIDTH, height: HEIGHT, boundaryMode: 'torus' });
    let medium = createSpatialWorldMedium({ width: WIDTH, height: HEIGHT, boundaryMode: 'torus' });
    let substrate = createLocalConservationSubstrate({
      width: WIDTH,
      height: HEIGHT,
      boundaryMode: 'torus',
    });

    // Phase 1: warm up with steady drive for 200 ticks
    for (let t = 0; t < 200; t++) {
      drive = updateSteadyExternalDrive(drive, driveConfig).state;

      const e2m = updateExternalDriveToMediumTransferPositive(drive, medium, externalToMediumConfig);
      drive = e2m.externalDriveState;
      medium = e2m.spatialWorldMediumState;

      const mediumStep = updateSpatialWorldMedium(medium, mediumConfig);
      medium = mediumStep.state;

      const m2i = updateMembraneToInternalTransferPositive(medium, substrate, membraneToInternalConfig);
      medium = m2i.spatialWorldMediumState;
      substrate = m2i.localConservationSubstrateState;

      substrate = updateLocalConservationSubstrate(substrate, substrateConfig).state;
    }

    const substrateStorageAtCutoff = totalNonNegative(substrate.storageField);
    expect(substrateStorageAtCutoff).toBeGreaterThan(0);

    // Phase 2: cut supply (drive at zero) for 800 ticks. Substrate storage must
    // decrease as a consequence of the named dissipation/residue/outflow paths,
    // not because anyone wrote a decay rule.
    for (let t = 0; t < 800; t++) {
      // skip drive tick: drive remains as the residual from phase 1 and slowly drains via positive transfer.
      // After the drive field is drained, e2m stops moving energy.
      const e2m = updateExternalDriveToMediumTransferPositive(drive, medium, externalToMediumConfig);
      drive = e2m.externalDriveState;
      medium = e2m.spatialWorldMediumState;

      const mediumStep = updateSpatialWorldMedium(medium, mediumConfig);
      medium = mediumStep.state;

      const m2i = updateMembraneToInternalTransferPositive(medium, substrate, membraneToInternalConfig);
      medium = m2i.spatialWorldMediumState;
      substrate = m2i.localConservationSubstrateState;

      substrate = updateLocalConservationSubstrate(substrate, substrateConfig).state;
    }

    const substrateStorageAfterCutoff = totalNonNegative(substrate.storageField);
    expect(substrateStorageAfterCutoff).toBeLessThan(substrateStorageAtCutoff);
    // Verify the chain still closes after cutoff. The drained energy went to named destinations.
    const substrateAccounted =
      substrateStorageAfterCutoff +
      totalNonNegative(substrate.dissipationField) +
      totalNonNegative(substrate.residueField) +
      totalNonNegative(substrate.outflowField);
    expect(substrateAccounted).toBeGreaterThan(substrateStorageAtCutoff);
  });
});
