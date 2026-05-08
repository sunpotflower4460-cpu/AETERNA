import type { EnergyLedgerState } from './energyLedger.ts';

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
