import type { ProtoNeuronCandidate } from './protoNeuronCandidate.ts';

export interface ProtoNeuronCoActivationPairSummary {
  candidateIds: [string, string];
  score: number;
}

export interface ProtoNeuronObservationState {
  timestamp: number;
  candidateCount: number;
  stableCandidateCount: number;
  averageConfidence: number;
  maxConfidence: number;
  averageExcitability: number;
  averagePropagation: number;
  averageTraceRetention: number;
  averageClosureCoupling: number;
  candidates: ProtoNeuronCandidate[];
  newCandidateCount?: number;
  decayedCandidateCount?: number;
  persistentCandidateIds?: string[];
  coActivationClusterCount?: number;
  averageCoActivationScore?: number;
  repeatedCoActivationCount?: number;
  strongestCoActivationPair?: ProtoNeuronCoActivationPairSummary | null;
}
