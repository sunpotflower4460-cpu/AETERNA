export type NaturalFeedbackTarget =
  | 'worldMedium'
  | 'sensoryReturn'
  | 'actuation'
  | 'bodySurface'
  | 'trace';

export interface NaturalFeedbackAdjustment {
  timestamp: number;
  echoDecayAdjustment: number;
  returnGainAdjustment: number;
  pulseLeakageAdjustment: number;
  boundaryPermeabilityAdjustment: number;
  sensoryAttenuationAdjustment: number;
  traceDecayAdjustment: number;
  adjustmentStrength: number;
  adjustmentConfidence: number;
  worldResistanceAdjustment?: number;
  delayWindowAdjustment?: number;
  mediumAbsorptionAdjustment?: number;
  feedbackEffectEstimate?: number;
  overcorrectionRisk?: number;
  feedbackDominanceRisk?: number;
}

export interface NaturalFeedbackAblationFlags {
  minimalNaturalFeedbackEnabled: boolean;
  naturalFeedbackWorldMediumEnabled: boolean;
  naturalFeedbackSensoryReturnEnabled: boolean;
  naturalFeedbackActuationEnabled: boolean;
  naturalFeedbackBodySurfaceEnabled: boolean;
  naturalFeedbackTraceEnabled: boolean;
}

export interface NaturalFeedbackApplicationReport {
  appliedTargets: NaturalFeedbackTarget[];
  appliedTargetCount: number;
  enabledFlags: NaturalFeedbackAblationFlags;
}

export const DEFAULT_NATURAL_FEEDBACK_FLAGS: NaturalFeedbackAblationFlags = {
  minimalNaturalFeedbackEnabled: true,
  naturalFeedbackWorldMediumEnabled: true,
  naturalFeedbackSensoryReturnEnabled: true,
  naturalFeedbackActuationEnabled: true,
  naturalFeedbackBodySurfaceEnabled: true,
  naturalFeedbackTraceEnabled: true,
};

export function normalizeNaturalFeedbackFlags(
  flags?: Partial<NaturalFeedbackAblationFlags>,
): NaturalFeedbackAblationFlags {
  return {
    ...DEFAULT_NATURAL_FEEDBACK_FLAGS,
    ...flags,
  };
}

export function createNeutralNaturalFeedbackAdjustment(
  timestamp = 0,
): NaturalFeedbackAdjustment {
  return {
    timestamp,
    echoDecayAdjustment: 0,
    returnGainAdjustment: 0,
    pulseLeakageAdjustment: 0,
    boundaryPermeabilityAdjustment: 0,
    sensoryAttenuationAdjustment: 0,
    traceDecayAdjustment: 0,
    adjustmentStrength: 0,
    adjustmentConfidence: 0,
    worldResistanceAdjustment: 0,
    delayWindowAdjustment: 0,
    mediumAbsorptionAdjustment: 0,
    feedbackEffectEstimate: 0,
    overcorrectionRisk: 0,
    feedbackDominanceRisk: 0,
  };
}
