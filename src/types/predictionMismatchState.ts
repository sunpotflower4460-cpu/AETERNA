export interface PredictionMismatchState {
  timestamp: number;
  mismatchLevel: number;
  surprisePressure: number;
  boundaryStress: number;
  recoveryPull: number;
  continuityDisruption?: number;
  localInstability?: number;
}
