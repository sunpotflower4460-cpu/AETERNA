import type { NaturalFeedbackAdjustment } from '../types/naturalFeedbackAdjustment.ts';
import type { WorldMediumState } from '../types/worldMediumState.ts';

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function feedbackScale(adjustment: NaturalFeedbackAdjustment): number {
  return clamp01(adjustment.adjustmentStrength) * (0.35 + clamp01(adjustment.adjustmentConfidence) * 0.65);
}

export function applyWorldMediumFeedback(
  world: WorldMediumState,
  adjustment: NaturalFeedbackAdjustment,
): WorldMediumState {
  const scale = feedbackScale(adjustment);
  if (scale <= 0) return world;

  const echoDelta = adjustment.echoDecayAdjustment * scale;
  const resistanceDelta = (adjustment.worldResistanceAdjustment ?? 0) * scale;
  const delayDelta = (adjustment.delayWindowAdjustment ?? 0) * scale;
  const absorptionDelta = (adjustment.mediumAbsorptionAdjustment ?? 0) * scale;
  const returnDelta = adjustment.returnGainAdjustment * scale;
  const sensoryDelta = adjustment.sensoryAttenuationAdjustment * scale;

  return {
    ...world,
    echoLevel: clamp01(world.echoLevel - echoDelta),
    surfaceResistance: clamp01(world.surfaceResistance + resistanceDelta),
    feedbackDelay: clamp01(world.feedbackDelay + delayDelta),
    mediumStability: clamp01(world.mediumStability + (echoDelta + absorptionDelta) * 0.18),
    fieldTemperature: clamp01(world.fieldTemperature - absorptionDelta * 0.12),
    lastPulseImpact: clamp01(world.lastPulseImpact - absorptionDelta * 0.08),
    visualResidue: clamp01((world.visualResidue ?? 0) - absorptionDelta * 0.72 - echoDelta * 0.28),
    forceResidue: clamp01((world.forceResidue ?? 0) - absorptionDelta * 0.68),
    returnReadiness: clamp01((world.returnReadiness ?? 0) + returnDelta * 0.32 - sensoryDelta * 0.22),
  };
}
