/**
 * Vortex Candidate Types
 *
 * N2: Complex Scalar Field
 *
 * These types describe observer-side phase-defect candidates derived from a
 * complex torus field. They are not runtime graph nodes, not semantic labels,
 * and not claims about selfhood, memory, emotion, or consciousness.
 */

export interface VortexCandidate {
  id: string;
  timestamp: number;
  regionId: string;
  i: number;
  j: number;
  amplitudeMinimum: number;
  phaseWinding: number;
  topologicalCharge: number;
  confidence: number;
  lifetimeTicks?: number;
}

export interface VortexObservationState {
  timestamp: number;
  candidateCount: number;
  positiveChargeCount: number;
  negativeChargeCount: number;
  totalTopologicalCharge: number;
  averageConfidence: number;
  maxConfidence: number;
  averagePhaseGradient: number;
  averageVorticity: number;
  phaseUnwrapWarningCount: number;
  candidates: VortexCandidate[];
  observationConfidence: number;
  vorticity: Float32Array;
  topologicalCharge: Int8Array;
  vortexCandidateMask: Uint8Array;
}
