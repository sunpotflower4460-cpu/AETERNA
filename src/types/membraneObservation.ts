export interface MembraneObservationState {
  timestamp: number;
  averagePermeability: number;
  averageTension: number;
  averageDeformation: number;
  averageTwoSidedness: number;
  highDeformationRegionCount: number;
  highTwoSidednessRegionCount: number;
  actuationReturnOverlap: number;
  membraneRecoveryBalance: number;
  membraneAsymmetry: number;
  membraneIntegrity: number;
  observationConfidence: number;
  nanOrInfinityCount: number;
}
