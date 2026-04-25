export interface PerturbationEvent {
  timestamp: number;
  source: 'touch' | 'sound' | 'light' | 'motion' | 'internal';
  magnitude: number;
  novelty: number;
  locality: number;
  expectedness: number;
  targetRegion?: string | null;
  repetitionHint?: number;
  boundaryContact?: number;
}
