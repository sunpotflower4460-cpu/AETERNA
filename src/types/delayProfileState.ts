export interface DelayProfileState {
  timestamp: number;
  averageReturnDelay: number;
  minReturnDelay: number;
  maxReturnDelay: number;
  delayVariance: number;
  stableDelayWindow: number;
  unstableDelayScore: number;
  delayedEchoScore: number;
  delayProfileConfidence: number;
  recentDelaySamples?: number[];
  delayHistogram?: number[];
  dominantDelayBand?: number;
}
