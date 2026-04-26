/**
 * Proto-Neuron Candidate
 *
 * W7: Emergent Proto-Neuron Observation
 *
 * Proto-neuron candidates are observer-side records of excitable field loci
 * that arise from the closed body-world loop. They are pre-semantic,
 * read-only, and never become runtime neuron nodes in this phase.
 */

export type ProtoNeuronCandidateLifecycle =
  | 'new'
  | 'recurring'
  | 'stabilizing'
  | 'persistent'
  | 'decaying';

export interface ProtoNeuronCandidate {
  id: string;
  timestamp: number;
  regionId: string | null;
  excitability: number;
  refractoryPattern: number;
  localPropagation: number;
  traceRetention: number;
  recurrenceScore: number;
  coActivationScore: number;
  weakPlasticityScore: number;
  closureCoupling: number;
  confidence: number;
  lifecycle: ProtoNeuronCandidateLifecycle;
  lifetimeTicks?: number;
  lastSeenTick?: number;
  stabilityScore?: number;
  replayAffinity?: number;
  basinOverlap?: number;
  knotOverlap?: number;
}
