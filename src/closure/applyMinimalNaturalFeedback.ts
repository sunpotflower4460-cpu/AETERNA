import { applyActuationFeedback } from '../actuation/applyActuationFeedback.ts';
import { applyBodySurfaceFeedback } from '../body/applyBodySurfaceFeedback.ts';
import { applyTraceFeedback } from '../body/applyTraceFeedback.ts';
import { applySensoryReturnFeedback } from '../perception/applySensoryReturnFeedback.ts';
import {
  normalizeNaturalFeedbackFlags,
  type NaturalFeedbackAblationFlags,
  type NaturalFeedbackAdjustment,
  type NaturalFeedbackApplicationReport,
  type NaturalFeedbackTarget,
} from '../types/naturalFeedbackAdjustment.ts';
import type { ActuationPulse } from '../types/actuationPulse.ts';
import type { BodySurfaceState } from '../types/bodySurfaceState.ts';
import type { SensoryReturnPacket } from '../types/sensoryReturnPacket.ts';
import type { TraceState } from '../types/traceState.ts';
import type { WorldMediumState } from '../types/worldMediumState.ts';
import { applyWorldMediumFeedback } from '../world/applyWorldMediumFeedback.ts';

export interface ApplyMinimalNaturalFeedbackParams {
  world: WorldMediumState;
  returns: SensoryReturnPacket[];
  pulse: ActuationPulse | null;
  bodySurface: BodySurfaceState | null;
  trace: TraceState | null;
  adjustment: NaturalFeedbackAdjustment | null;
  flags?: Partial<NaturalFeedbackAblationFlags>;
}

export interface ApplyMinimalNaturalFeedbackResult {
  world: WorldMediumState;
  returns: SensoryReturnPacket[];
  pulse: ActuationPulse | null;
  bodySurface: BodySurfaceState | null;
  trace: TraceState | null;
  report: NaturalFeedbackApplicationReport;
}

function magnitude(value: number | undefined): number {
  return Math.abs(value ?? 0);
}

function hasWorldAdjustment(adjustment: NaturalFeedbackAdjustment): boolean {
  return (
    magnitude(adjustment.echoDecayAdjustment) > 1e-6 ||
    magnitude(adjustment.worldResistanceAdjustment) > 1e-6 ||
    magnitude(adjustment.mediumAbsorptionAdjustment) > 1e-6 ||
    magnitude(adjustment.delayWindowAdjustment) > 1e-6
  );
}

function hasSensoryAdjustment(adjustment: NaturalFeedbackAdjustment): boolean {
  return (
    magnitude(adjustment.returnGainAdjustment) > 1e-6 ||
    magnitude(adjustment.sensoryAttenuationAdjustment) > 1e-6 ||
    magnitude(adjustment.delayWindowAdjustment) > 1e-6
  );
}

function hasActuationAdjustment(adjustment: NaturalFeedbackAdjustment): boolean {
  return magnitude(adjustment.pulseLeakageAdjustment) > 1e-6;
}

function hasBodyAdjustment(adjustment: NaturalFeedbackAdjustment): boolean {
  return (
    magnitude(adjustment.boundaryPermeabilityAdjustment) > 1e-6 ||
    magnitude(adjustment.sensoryAttenuationAdjustment) > 1e-6
  );
}

function hasTraceAdjustment(adjustment: NaturalFeedbackAdjustment): boolean {
  return magnitude(adjustment.traceDecayAdjustment) > 1e-6;
}

function deriveAppliedTargets(
  params: ApplyMinimalNaturalFeedbackParams,
  enabledFlags: NaturalFeedbackAblationFlags,
): NaturalFeedbackTarget[] {
  const { adjustment, world, returns, pulse, bodySurface, trace } = params;
  if (adjustment == null || !enabledFlags.minimalNaturalFeedbackEnabled) return [];

  const appliedTargets: NaturalFeedbackTarget[] = [];
  if (enabledFlags.naturalFeedbackWorldMediumEnabled && world && hasWorldAdjustment(adjustment)) {
    appliedTargets.push('worldMedium');
  }
  if (enabledFlags.naturalFeedbackSensoryReturnEnabled && returns.length > 0 && hasSensoryAdjustment(adjustment)) {
    appliedTargets.push('sensoryReturn');
  }
  if (enabledFlags.naturalFeedbackActuationEnabled && pulse && hasActuationAdjustment(adjustment)) {
    appliedTargets.push('actuation');
  }
  if (enabledFlags.naturalFeedbackBodySurfaceEnabled && bodySurface && hasBodyAdjustment(adjustment)) {
    appliedTargets.push('bodySurface');
  }
  if (enabledFlags.naturalFeedbackTraceEnabled && trace && hasTraceAdjustment(adjustment)) {
    appliedTargets.push('trace');
  }
  return appliedTargets;
}

export function applyMinimalNaturalFeedback(
  params: ApplyMinimalNaturalFeedbackParams,
): ApplyMinimalNaturalFeedbackResult {
  const enabledFlags = normalizeNaturalFeedbackFlags(params.flags);
  const appliedTargets = deriveAppliedTargets(params, enabledFlags);
  const report: NaturalFeedbackApplicationReport = {
    appliedTargets,
    appliedTargetCount: appliedTargets.length,
    enabledFlags,
  };

  if (params.adjustment == null || !enabledFlags.minimalNaturalFeedbackEnabled || appliedTargets.length === 0) {
    return {
      world: params.world,
      returns: params.returns,
      pulse: params.pulse,
      bodySurface: params.bodySurface,
      trace: params.trace,
      report,
    };
  }

  return {
    world: enabledFlags.naturalFeedbackWorldMediumEnabled && hasWorldAdjustment(params.adjustment)
      ? applyWorldMediumFeedback(params.world, params.adjustment)
      : params.world,
    returns: enabledFlags.naturalFeedbackSensoryReturnEnabled && hasSensoryAdjustment(params.adjustment)
      ? applySensoryReturnFeedback(params.returns, params.adjustment)
      : params.returns,
    pulse: enabledFlags.naturalFeedbackActuationEnabled && hasActuationAdjustment(params.adjustment)
      ? applyActuationFeedback(params.pulse, params.adjustment)
      : params.pulse,
    bodySurface: enabledFlags.naturalFeedbackBodySurfaceEnabled && hasBodyAdjustment(params.adjustment)
      ? applyBodySurfaceFeedback(params.bodySurface, params.adjustment)
      : params.bodySurface,
    trace: enabledFlags.naturalFeedbackTraceEnabled && hasTraceAdjustment(params.adjustment)
      ? applyTraceFeedback(params.trace, params.adjustment)
      : params.trace,
    report,
  };
}
