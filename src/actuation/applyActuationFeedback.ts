import type { ActuationPulse } from '../types/actuationPulse.ts';
import type { NaturalFeedbackAdjustment } from '../types/naturalFeedbackAdjustment.ts';

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function feedbackScale(adjustment: NaturalFeedbackAdjustment): number {
  return clamp01(adjustment.adjustmentStrength) * (0.35 + clamp01(adjustment.adjustmentConfidence) * 0.65);
}

export function applyActuationFeedback(
  pulse: ActuationPulse | null,
  adjustment: NaturalFeedbackAdjustment,
): ActuationPulse | null {
  if (pulse == null) return null;

  const scale = feedbackScale(adjustment);
  if (scale <= 0) return pulse;

  const leakageDelta = adjustment.pulseLeakageAdjustment * scale;

  return {
    ...pulse,
    intensity: clamp01(pulse.intensity * (1 + leakageDelta)),
    outputReadiness: clamp01(pulse.outputReadiness * (1 + leakageDelta * 0.25)),
    decayRate: pulse.decayRate === undefined
      ? undefined
      : clamp01(pulse.decayRate - leakageDelta * 0.08),
  };
}
