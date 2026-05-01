export interface MembraneCell {
  regionId: string;
  index: number;
  permeability: number;
  tension: number;
  deformation: number;
  recovery: number;
  actuationImprint: number;
  returnImprint: number;
  twoSidedness: number;
  localResistance: number;
  localAttenuation: number;
  confidence: number;
}

export interface MembraneState {
  timestamp: number;
  segments: number;
  cells: MembraneCell[];
  averagePermeability: number;
  averageTension: number;
  averageDeformation: number;
  averageRecovery: number;
  averageActuationImprint: number;
  averageReturnImprint: number;
  averageTwoSidedness: number;
  maxDeformation: number;
  deformationVariance: number;
  membraneIntegrity: number;
  membraneConfidence: number;
  nanOrInfinityCount: number;
}
