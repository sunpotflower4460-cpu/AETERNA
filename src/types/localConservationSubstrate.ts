import type { EnergyLedgerState } from './energyLedger.ts';
import type { CurvatureWeightFields } from './curvatureWeightedExchange.ts';

export type LocalConservationBoundaryMode = 'torus';

export interface LocalConservationSubstrateConfig {
  width: number;
  height: number;
  boundaryMode: LocalConservationBoundaryMode;
  localExchangeCoefficient: number;
  localDissipationCoefficient: number;
  residueConversionCoefficient: number;
  outflowCoefficient: number;
  dt: number;
  tolerance?: number;

  /**
   * v4.1 optional curvature-weighted exchange weights. Same semantics as
   * SpatialWorldMediumConfig.curvatureWeights. Absent or grid mismatched →
   * uniform weights (bit-identical to pre-v4.1 behavior).
   */
  curvatureWeights?: CurvatureWeightFields | null;
}

export interface LocalConservationSubstrateState {
  width: number;
  height: number;
  boundaryMode: LocalConservationBoundaryMode;
  storageField: Float64Array;
  dissipationField: Float64Array;
  residueField: Float64Array;
  outflowField: Float64Array;
  tick: number;
}

export interface LocalConservationStepReport {
  tick: number;
  inputEnergy: number;
  internalEnergyBefore: number;
  internalEnergyAfter: number;
  internalAccumulationDelta: number;
  dissipatedEnergy: number;
  actuationOutputEnergy: number;
  residueConvertedEnergy: number;
  measuredOutflowEnergy: number;
  clampLossOrOverflow: number;
  exchangeMagnitude: number;
  ledger: EnergyLedgerState;
  warnings: string[];
}

export interface LocalConservationStepResult {
  state: LocalConservationSubstrateState;
  report: LocalConservationStepReport;
}
