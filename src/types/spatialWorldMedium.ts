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

  /** Boundary-side transfer record. It is a named destination, not center-buffer injection. */
  membraneExchangeField: Float64Array;

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
