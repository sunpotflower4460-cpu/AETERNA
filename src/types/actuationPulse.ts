export type ActuationPulseChannel = 'visual' | 'simulatedForce';

export interface ActuationPulse {
  timestamp: number;
  channel: ActuationPulseChannel;
  intensity: number;
  coherence: number;
  rhythm: number;
  locality: number;
  recoveryLinked: number;
  boundaryLinked: number;
  traceLinked: number;
  outputReadiness: number;
  pressureLinked?: number;
  noveltyLinked?: number;
  restorationLinked?: number;
  durationTicks?: number;
  decayRate?: number;
}
