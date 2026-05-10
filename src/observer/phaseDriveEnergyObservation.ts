import { deriveEnergyLedger } from './deriveEnergyLedger.ts';
import type { PhaseCarryingDriveState } from '../types/phaseCarryingDrive.ts';
import type {
  PhaseDriveEnergyObservation,
  PhaseDriveEnergyObservationReport,
  PhaseDriveNoMediumTransferCheck,
} from '../types/phaseDriveEnergyObservation.ts';

function finiteSample(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function derivePhaseDriveEnergyObservation(
  state: PhaseCarryingDriveState,
): PhaseDriveEnergyObservation {
  let driveEnergyTotal = 0;
  let driveEnergyMax = 0;
  let maskWeightedDriveEnergyTotal = 0;
  let activeDriveCellCount = 0;
  let activeMaskedDriveCellCount = 0;
  let finiteCellCount = 0;
  let nonFiniteCellCount = 0;
  const warnings: string[] = [];

  const size = Math.min(
    state.driveRealField.length,
    state.driveImagField.length,
    state.injectionMask.length,
  );

  if (
    state.driveRealField.length !== state.driveImagField.length ||
    state.driveRealField.length !== state.injectionMask.length
  ) {
    warnings.push('Phase drive field lengths differ; observation used the shortest shared length.');
  }

  for (let i = 0; i < size; i++) {
    const realRaw = state.driveRealField[i];
    const imagRaw = state.driveImagField[i];
    const real = finiteSample(realRaw);
    const imag = finiteSample(imagRaw);
    const finite = Number.isFinite(realRaw) && Number.isFinite(imagRaw);

    if (finite) finiteCellCount += 1;
    else nonFiniteCellCount += 1;

    const energy = 0.5 * (real * real + imag * imag);
    const mask = clamp01(state.injectionMask[i]);
    driveEnergyTotal += energy;
    driveEnergyMax = Math.max(driveEnergyMax, energy);
    maskWeightedDriveEnergyTotal += energy * mask;
    if (energy > 0) activeDriveCellCount += 1;
    if (energy > 0 && mask > 0) activeMaskedDriveCellCount += 1;
  }

  if (nonFiniteCellCount > 0) {
    warnings.push(`${nonFiniteCellCount} non-finite drive cell(s) were treated as zero for energy observation.`);
  }

  return {
    driveEnergyTotal,
    driveEnergyMax,
    maskWeightedDriveEnergyTotal,
    activeDriveCellCount,
    activeMaskedDriveCellCount,
    finiteCellCount,
    nonFiniteCellCount,
    warnings,
    metricKind: 'derived',
  };
}

export function derivePhaseDriveNoMediumTransferCheck(input: {
  observedDriveEnergy: number;
  tolerance?: number;
}): PhaseDriveNoMediumTransferCheck {
  const observedDriveEnergy = Math.max(0, finiteSample(input.observedDriveEnergy));
  const mediumInputEnergy = 0;
  const driveToMediumTransferredEnergy = 0;
  const ledger = deriveEnergyLedger({
    source: 'phase-drive-no-medium-transfer-check',
    tolerance: input.tolerance,
    inputEnergy: 0,
    internalEnergyBefore: 0,
    internalEnergyAfter: 0,
    dissipatedEnergy: 0,
    actuationOutputEnergy: 0,
    residueConvertedEnergy: 0,
    boundaryExchangeEnergy: 0,
    clampLossOrOverflow: 0,
    measuredOutflowEnergy: 0,
  });

  return {
    source: 'phase-drive-no-medium-transfer-check',
    observedDriveEnergy,
    mediumInputEnergy,
    driveToMediumTransferredEnergy,
    ledger,
    warnings: [...ledger.warnings],
    metricKind: 'check',
  };
}

export function derivePhaseDriveEnergyObservationReport(input: {
  state: PhaseCarryingDriveState;
  tolerance?: number;
}): PhaseDriveEnergyObservationReport {
  const energyObservation = derivePhaseDriveEnergyObservation(input.state);
  const noMediumTransferCheck = derivePhaseDriveNoMediumTransferCheck({
    observedDriveEnergy: energyObservation.driveEnergyTotal,
    tolerance: input.tolerance,
  });

  return {
    tick: input.state.tick,
    energyObservation,
    noMediumTransferCheck,
    warnings: [...energyObservation.warnings, ...noMediumTransferCheck.warnings],
    metricKind: 'derived',
  };
}
