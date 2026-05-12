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
  /**
   * Optional per-cell accumulator for sensory return energy that has entered
   * the membrane via the W4→Membrane weak coupling (D2-d). Length matches
   * cells.length when present. Absent by default to preserve back-compat
   * with existing W7/W8 consumers that read MembraneState without this
   * field.
   */
  receivedSensoryField?: Float64Array;
}
