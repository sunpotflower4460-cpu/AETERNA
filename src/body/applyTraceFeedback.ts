import type { NaturalFeedbackAdjustment } from '../types/naturalFeedbackAdjustment.ts';
import type { TraceState } from '../types/traceState.ts';

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function feedbackScale(adjustment: NaturalFeedbackAdjustment): number {
  return clamp01(adjustment.adjustmentStrength) * (0.35 + clamp01(adjustment.adjustmentConfidence) * 0.65);
}

export function applyTraceFeedback(
  trace: TraceState | null,
  adjustment: NaturalFeedbackAdjustment,
): TraceState | null {
  if (trace == null) return null;

  const scale = feedbackScale(adjustment);
  if (scale <= 0) return trace;

  const decayDelta = adjustment.traceDecayAdjustment * scale;

  return {
    ...trace,
    traceStrength: clamp01(trace.traceStrength - decayDelta),
    salienceResidue: clamp01(trace.salienceResidue - decayDelta * 0.85),
    replayReadiness: clamp01(trace.replayReadiness - decayDelta * 0.28),
    recentPatternWeight: trace.recentPatternWeight === undefined
      ? undefined
      : clamp01(trace.recentPatternWeight - decayDelta * 0.35),
    settlingResidue: trace.settlingResidue === undefined
      ? undefined
      : clamp01(trace.settlingResidue - decayDelta * 0.78),
    recoveryLinkedResidue: trace.recoveryLinkedResidue === undefined
      ? undefined
      : clamp01(trace.recoveryLinkedResidue - decayDelta * 0.62),
  };
}
