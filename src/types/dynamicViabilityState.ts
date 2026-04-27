export interface DynamicViabilityState {
  timestamp: number;
  flowContinuity: number;
  energyThroughput: number;
  dissipationBalance: number;
  resistanceBalance: number;
  delayCoherence: number;
  boundaryExchange: number;
  underCouplingRisk: number;
  overCouplingRisk: number;
  saturationRisk: number;
  extinctionRisk: number;
  viabilityConfidence: number;
  returnContinuity?: number;
  traceContinuity?: number;
  mediumExchangeBalance?: number;
  closureViability?: number;
}
