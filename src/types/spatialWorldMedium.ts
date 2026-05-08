import type { EnergyLedgerState } from './energyLedger.ts';

export type SpatialWorldMediumBoundaryMode = 'torus';

export interface SpatialWorldMediumConfig {
  width: number;
  height: number;
  boundaryMode: SpatialWorldMediumBoundaryMode;

  /** Local material constants. These are not target outcomes. */
  localExchangeCoefficient: number;
  localDissipationCoefficient: number;
  residueConversionCoefficient: number;
  outflowCoefficient: number;
  membraneExchangeCoefficient: number;

  dt: number;
  tolerance?: number;
}

export interface SpatialWorldMediumState {
  width: number;
  height: number;
  boundaryMode: SpatialWorldMediumBoundaryMode;

  /** Spatial external medium stock. This replaces scalar proxy thinking for v3.1 experiments only. */
  mediumStorageField: Float64Array;
  mediumDissipationField: Float64Array;
  mediumResidueField: Float64Array;
  mediumOutflowField: Float64Array;

  /** Boundary-side cumulative inflow record. Tracks how much has entered the membrane. Not a center-buffer injection. */
  membraneExchangeField: Float64Array;
  /** Boundary-side cumulative outflow record. Tracks how much has been released from the membrane to internal storage.
   * Drainable amount per cell = max(0, membraneExchangeField[i] - membraneExchangeReleasedField[i]). */
  membraneExchangeReleasedField: Float64Array;

  tick: number;
}

export interface SpatialWorldMediumStepReport {
  tick: number;
  inputEnergy: number;
  mediumEnergyBefore: number;
  mediumEnergyAfter: number;
  mediumAccumulationDelta: number;
  dissipatedEnergy: number;
  residueConvertedEnergy: number;
  measuredOutflowEnergy: number;
  membraneExchangeEnergy: number;
  clampLossOrOverflow: number;
  localExchangeMagnitude: number;
  ledger: EnergyLedgerState;
  warnings: string[];
}

export interface SpatialWorldMediumStepResult {
  state: SpatialWorldMediumState;
  report: SpatialWorldMediumStepReport;
}
