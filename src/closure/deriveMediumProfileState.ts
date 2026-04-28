import { deriveDelayProfile } from './deriveDelayProfile.ts';
import { deriveEchoProfile } from './deriveEchoProfile.ts';
import { deriveResistanceProfile } from './deriveResistanceProfile.ts';
import type { ActuationPulse } from '../types/actuationPulse.ts';
import type { BodySurfaceState } from '../types/bodySurfaceState.ts';
import type { BodyWorldClosureState } from '../types/bodyWorldClosureState.ts';
import type { DynamicViabilityState } from '../types/dynamicViabilityState.ts';
import type { MediumProfileState } from '../types/mediumProfileState.ts';
import type { ReafferenceComparisonState } from '../types/reafferenceComparisonState.ts';
import type { SensoryReturnPacket } from '../types/sensoryReturnPacket.ts';
import type { WorldMediumState } from '../types/worldMediumState.ts';

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function deriveMediumProfileState(params: {
  closure: BodyWorldClosureState | null;
  reafference: ReafferenceComparisonState | null;
  world: WorldMediumState | null;
  bodySurface: BodySurfaceState | null;
  pulse: ActuationPulse | null;
  returns: SensoryReturnPacket[];
  viability?: DynamicViabilityState | null;
  previousProfile?: MediumProfileState | null;
  dt: number;
}): MediumProfileState {
  const {
    closure,
    reafference,
    world,
    bodySurface,
    pulse,
    returns,
    viability = null,
    previousProfile = null,
    dt,
  } = params;

  const delay = deriveDelayProfile({
    closure,
    reafference,
    returns,
    world,
    previousProfile: previousProfile?.delay ?? null,
    dt,
  });
  const echo = deriveEchoProfile({
    world,
    pulse,
    returns,
    closure,
    previousProfile: previousProfile?.echo ?? null,
    dt,
  });
  const resistance = deriveResistanceProfile({
    world,
    bodySurface,
    pulse,
    returns,
    closure,
    viability,
    previousProfile: previousProfile?.resistance ?? null,
    dt,
  });

  const timestamp = Math.max(delay.timestamp, echo.timestamp, resistance.timestamp);
  const profileConfidence = clamp01(
    delay.delayProfileConfidence * 0.34 +
      echo.echoProfileConfidence * 0.33 +
      resistance.resistanceProfileConfidence * 0.33,
  );

  return {
    timestamp,
    delay,
    echo,
    resistance,
    profileConfidence,
  };
}
