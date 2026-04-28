export interface ResistanceProfileState {
  timestamp: number;
  worldResistance: number;
  boundaryResistance: number;
  returnAttenuation: number;
  mediumAbsorption: number;
  transmissionRatio: number;
  resistanceBalance: number;
  resistanceVariance: number;
  resistanceProfileConfidence: number;
  surfaceImpedance?: number;
  pulseAbsorptionRatio?: number;
  returnAbsorptionRatio?: number;
}
