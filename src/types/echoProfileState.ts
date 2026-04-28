export interface EchoProfileState {
  timestamp: number;
  echoStrength: number;
  echoDecayRate: number;
  echoPersistence: number;
  echoSaturationRisk: number;
  visualEchoResidue: number;
  forceEchoResidue: number;
  returnEchoCoupling: number;
  echoProfileConfidence: number;
  echoHalfLifeEstimate?: number;
  echoStability?: number;
  echoBurstCount?: number;
}
