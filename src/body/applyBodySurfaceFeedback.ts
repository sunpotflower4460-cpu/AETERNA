import type { BodySurfaceState } from '../types/bodySurfaceState.ts';
import type { NaturalFeedbackAdjustment } from '../types/naturalFeedbackAdjustment.ts';

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function feedbackScale(adjustment: NaturalFeedbackAdjustment): number {
  return clamp01(adjustment.adjustmentStrength) * (0.35 + clamp01(adjustment.adjustmentConfidence) * 0.65);
}

export function applyBodySurfaceFeedback(
  bodySurface: BodySurfaceState | null,
  adjustment: NaturalFeedbackAdjustment,
): BodySurfaceState | null {
  if (bodySurface == null) return null;

  const scale = feedbackScale(adjustment);
  if (scale <= 0) return bodySurface;

  const permeabilityDelta = adjustment.boundaryPermeabilityAdjustment * scale;
  const attenuationDelta = adjustment.sensoryAttenuationAdjustment * scale;

  return {
    ...bodySurface,
    permeability: clamp01(bodySurface.permeability + permeabilityDelta),
    contactReadiness: clamp01(bodySurface.contactReadiness + permeabilityDelta * 0.22),
    surfaceSensitivity: clamp01(bodySurface.surfaceSensitivity - attenuationDelta * 0.24),
    protectiveClosure: bodySurface.protectiveClosure === undefined
      ? undefined
      : clamp01(bodySurface.protectiveClosure - permeabilityDelta * 0.18 + attenuationDelta * 0.08),
    externalContactLoad: bodySurface.externalContactLoad === undefined
      ? undefined
      : clamp01(bodySurface.externalContactLoad + attenuationDelta * 0.1),
  };
}
