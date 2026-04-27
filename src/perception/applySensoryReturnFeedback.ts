import type { SensoryReturnPacket } from '../types/sensoryReturnPacket.ts';
import type { NaturalFeedbackAdjustment } from '../types/naturalFeedbackAdjustment.ts';

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function feedbackScale(adjustment: NaturalFeedbackAdjustment): number {
  return clamp01(adjustment.adjustmentStrength) * (0.35 + clamp01(adjustment.adjustmentConfidence) * 0.65);
}

export function applySensoryReturnFeedback(
  returns: SensoryReturnPacket[],
  adjustment: NaturalFeedbackAdjustment,
): SensoryReturnPacket[] {
  const scale = feedbackScale(adjustment);
  if (scale <= 0 || returns.length === 0) return returns;

  const gainDelta = adjustment.returnGainAdjustment * scale;
  const attenuationDelta = adjustment.sensoryAttenuationAdjustment * scale;
  const delayDelta = (adjustment.delayWindowAdjustment ?? 0) * scale * 0.32;
  const combinedGain = 1 + gainDelta - attenuationDelta;

  return returns.map((packet) => ({
    ...packet,
    intensity: clamp01(packet.intensity * combinedGain),
    worldOriginStrength: clamp01(packet.worldOriginStrength * (1 + gainDelta * 0.35 - attenuationDelta * 0.2)),
    returnDelayHint: clamp01(packet.returnDelayHint + delayDelta),
    returnReadiness: packet.returnReadiness === undefined
      ? undefined
      : clamp01(packet.returnReadiness * (1 + gainDelta * 0.28 - attenuationDelta * 0.24)),
  }));
}
